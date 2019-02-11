
const DONE = 4;

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;

function noop() {}

function configureRequest(maybeXhr, window) {
    // eslint-disable-next-line immutable/no-this
    const XMLHttpRequest = maybeXhr || window.XMLHttpRequest;

    function request(url, maybeOptions, maybeCallback) {

        /* eslint-disable immutable/no-let, immutable/no-mutation */
        const options = maybeOptions || {};

        let callback = function (error, response) {
            callback = noop;
            (maybeCallback || noop)(error, response);
        };

        const async = true;
        const body = options.body || null;
        const headers = options.headers || {};
        const method = (options.method || "GET").toUpperCase();
        const onProgress = options.onProgress || noop;
        const timeout = 10000;
        const withCredentials = options.withCredentials || false;

        try {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, async);

            const abort = xhr.abort;
            let aborted = false;
            let hasContentType = false;

            const api = {
                abort: abort,
            };

            Object.keys(headers).forEach(function (key) {
                if (/^content-type/i.test(key)) {
                    hasContentType = true;
                }
                xhr.setRequestHeader(key, headers[key]);
            });

            if (!hasContentType && body !== null && typeof body === "object") {
                xhr.setRequestHeader(
                    "Content-Type", "application/json; charset=utf-8"
                );
            }

            xhr.abort = function () {
                aborted = true;
                abort.call(xhr);
            };

            xhr.onerror = function () {
                callback(new Error(xhr.responseText));
            };

            xhr.onprogress = function (evt) {
                onProgress(evt, api);
            };

            xhr.onreadystatechange = function () {
                if (aborted) {
                    return;
                }

                if (xhr.readyState === DONE) {
                    const status = xhr.status;
                    api.responseText = xhr.responseText;
                    api.responseType = xhr.responseType;
                    api.status = status;

                    if (status >= HTTP_OK && status < HTTP_BAD_REQUEST) {
                        callback(null, api);
                        return;
                    }

                    const error = new Error(xhr.responseText);
                    error.response = api;
                    error.status = status;
                    error.statusText = xhr.statusText;
                    callback(error);
                }
            };

            xhr.ontimeout = function (error) {
                callback(error);
            };

            xhr.timeout = timeout;

            if (withCredentials) {
                xhr.withCredentials = Boolean(withCredentials);
            }

            xhr.send(body);

            return api;
        } catch (error) {
            callback(error);
            return {
                abort: noop,
            };
        }

        /* eslint-enable immutable/no-let, immutable/no-mutation */
    }

    return request;
}

// eslint-disable-next-line immutable/no-this
const request = configureRequest(null, this);

/* eslint-disable immutable/no-mutation */
request.configureRequest = configureRequest;
request.version = "0.1.0";
module.exports = request;
/* eslint-enable immutable/no-mutation */
