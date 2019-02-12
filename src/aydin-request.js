
const DONE = 4;

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;

const ONE_HUNDRED = 100;
const TEN_SECONDS = 10000;

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

        const async = !options.sync;
        const body = options.body || null;
        const headers = options.headers || {};
        const method = (options.method || "GET").toUpperCase();
        const onProgress = options.onProgress || noop;
        const timeout = options.timeout || TEN_SECONDS;
        const withCredentials = !!options.withCredentials;

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
                if (evt.lengthComputable) {
                    onProgress({
                        loaded: evt.loaded,
                        percentage: ONE_HUNDRED * (evt.loaded / evt.total),
                        total: evt.total,
                    }, api);
                } else {
                    onProgress({
                        indeterminate: true,
                        loaded: NaN,
                        percentage: 0,
                        total: NaN,
                    }, api);
                }
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
