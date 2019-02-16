/* eslint-disable immutable/no-let, immutable/no-mutation */

const pkg = require("../package.json");

const request = require("./aydin-request");
const { configureRequest } = request;

describe("AydinRequest", () => {

    it("should export a function with arity 3", () => {
        expect(typeof request).toBe("function");
        expect(request).toHaveLength(3);
    });

    it("should export the proper 'version' string matching the package version", () => {
        expect(request.version).toBe(pkg.version);
    });


    it("should default to making an async GET request when only supplied with an URL", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));
        rq("http://example.org");

        expect(xhr.open).toHaveBeenCalled();
        expect(xhr.open.mock.calls[0]).toEqual([
            "GET",
            "http://example.org",
            true
        ]);
        expect(xhr.send).toHaveBeenCalled();
        expect(xhr.send.mock.calls[0][0]).toBe(null);
    });

    it("should use the method specified in upper case", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));
        rq("http://example.org", {
            method: "post",
        });

        expect(xhr.open.mock.calls[0]).toEqual([
            "POST",
            "http://example.org",
            true
        ]);
    });

    it("should not require a callback", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        expect(() => {
            rq("http://example.org");
            xhr.readyState = 4;
            xhr.onreadystatechange();
        }).not.toThrow();
    });

    it("should use the supplied 'body' and assume 'application/json' as 'Content-Type'", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));
        rq("http://example.org", {
            body: { some: "body" },
        });

        expect(xhr.setRequestHeader.mock.calls[0]).toEqual([
            "Content-Type", "application/json; charset=utf-8",
        ]);
        expect(xhr.send.mock.calls[0][0]).toEqual({
            some: "body",
        });
    });

    it("should use the supplied 'body' and use the specified 'Content-Type'", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));
        rq("http://example.org", {
            body: { some: "body" },
            headers: {
                "Content-Type": "text/plain",
            },
        });

        expect(xhr.setRequestHeader.mock.calls[0]).toEqual([
            "Content-Type", "text/plain",
        ]);
        expect(xhr.send.mock.calls[0][0]).toEqual({
            some: "body",
        });
    });

    it("should use the supplied content type", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("http://example.org", {
            headers: {
                "Content-Type": "Some other content type",
            },
        });

        expect(xhr.setRequestHeader.mock.calls[0]).toEqual([
            "Content-Type", "Some other content type",
        ]);
    });

    it("should use the supplied 'body' and assume no content type if it is no json", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        const fn = function () {};
        rq("http://example.org", {
            body: fn,
        });

        expect(xhr.setRequestHeader).not.toHaveBeenCalled();
        expect(xhr.send.mock.calls[0][0]).toEqual(fn);
    });

    it("should use the specified headers", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("http://example.org", {
            body: "Some content",
            headers: {
                "Accept": "text/plain",
            },
        });

        expect(xhr.setRequestHeader.mock.calls[0]).toEqual([
            "Accept", "text/plain",
        ]);
        expect(xhr.send.mock.calls[0][0]).toEqual("Some content");
    });

    it("should support 'withCredentials'", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("http://example.org", {
            withCredentials: 1,
        });

        expect(xhr.withCredentials).toBe(true);
    });

    it("should support aborting the request", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));
        const fn = jest.fn();

        rq("http://example.org", fn);

        xhr.abort();

        xhr.readyState = 4;
        xhr.status = 500;
        xhr.onreadystatechange();

        xhr.readyState = 4;
        xhr.status = 200;
        xhr.onreadystatechange();

        expect(fn).not.toHaveBeenCalled();
    });

    it("should catch XHR setup errors", () => {
        const rq = configureRequest(createXhr());

        rq("blubb", null, (err) => {
            expect(err instanceof Error).toBe(true);
        });
    });

    it("should catch actual request errors", (done) => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("blubb", null, (err) => {
            expect(err instanceof Error).toBe(true);
            done();
        });

        xhr.onerror();
    });

    it("should catch HTTP errors", (done) => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("blubb", null, (err) => {
            expect(err instanceof Error).toBe(true);
            expect(err.status).toBe(400);
            done();
        });

        xhr.readyState = 3;
        xhr.onreadystatechange();

        xhr.readyState = 4;
        xhr.status = 400;
        xhr.onreadystatechange();
    });

    it("should report HTTP progress and hand in the request api", (done) => {
        let xhr = null;
        let n = 0;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("blubb", {
            onProgress(evt, req) {
                if (n === 0) {
                    expect(typeof req.abort).toBe("function");
                    expect(evt).toEqual({
                        loaded: 64,
                        percentage: 50,
                        total: 128,
                    });
                    n += 1;
                } else {
                    expect(evt).toEqual({
                        indeterminate: true,
                        loaded: NaN,
                        percentage: 0,
                        total: NaN,
                    });
                    done();
                }
            },
        });

        xhr.onprogress({
            lengthComputable: true,
            loaded: 64,
            total: 128,
        });

        xhr.onprogress({
            lengthComputable: false,
        });
    });

    it("should support the 'timeout' property", (done) => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));
        const expectedError = new Error();

        rq("blubb", null, (err) => {
            expect(err).toBe(expectedError);
            done();
        });

        xhr.ontimeout(expectedError);
    });

    it("should hand over OK responses", (done) => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("blubb", null, (err, response) => {
            expect(err).toBe(null);
            expect(response.responseText).toBe("Hello, World!");
            expect(response.status).toBe(200);
            done();
        });

        xhr.readyState = 4;
        xhr.responseText = "Hello, World!";
        xhr.status = 200;
        xhr.onreadystatechange();
    });

    it("should allow for synchronous requests with 'sync'", (done) => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("blubb", { sync: true }, (err, response) => {
            expect(err).toBe(null);
            expect(response.responseText).toBe("Hello, World!");
            expect(response.status).toBe(200);
            done();
        });

        xhr.readyState = 4;
        xhr.responseText = "Hello, World!";
        xhr.status = 200;
        xhr.onreadystatechange();
    });

    it("should support providing parameters via 'params'", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("http://example.org/endpoint", {
            params: {
                a: "b",
                c: "some space",
            },
        });

        expect(xhr.open.mock.calls).toEqual([
            [
                "GET",
                "http://example.org/endpoint?a=b&c=some%20space",
                true,
            ],
        ]);
    });

    it("should assemble URLs correctly with 'params'", () => {
        let xhr = null;
        const rq = configureRequest(createXhr((created) => xhr = created));

        rq("http://example.org/endpoint?base=1", {
            params: {
                a: "b",
                c: "some space",
            },
        });

        expect(xhr.open.mock.calls).toEqual([
            [
                "GET",
                "http://example.org/endpoint?base=1&a=b&c=some%20space",
                true,
            ],
        ]);
    });

    function createXhr(ping) {
        return function FakeXHR() {
            const xhr = {
                abort: jest.fn(),
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
            };
            ping(xhr);
            return xhr;
        };
    }

});

