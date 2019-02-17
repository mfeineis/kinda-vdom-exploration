const signals = require("./signals");
const CORE_RERENDER = signals.CORE_RERENDER;
const CORE_RENDER_FRAME_DONE = signals.CORE_RENDER_FRAME_DONE;
const CORE_RENDER_FRAME_INIT = signals.CORE_RENDER_FRAME_INIT;

const NOTHING = 0;
const ONE = 1;

const FIRST = 0;
const SECOND = 1;

function noop() {}

function sync(notify) {
    return function (evt, data) {
        if (data) {
            notify(evt, data);
            return;
        }
        notify(evt);
    };
}

function configureWindowed(frameSizeMs, window) {
    const schedule = window.requestAnimationFrame;
    return function windowed(notify) {
        /* eslint-disable immutable/no-let */
        let buffer = [];
        let start = null;
        /* eslint-enable immutable/no-let */

        function dispatch(timestamp) {
            if (!start) {
                start = timestamp;
            }

            const durationMs = timestamp - start;

            if (durationMs < frameSizeMs) {
                schedule(dispatch);
                return;
            }

            start = timestamp;

            // eslint-disable-next-line immutable/no-let
            let shouldRender = false;
            buffer.forEach(function (it) {
                const evt = it[FIRST];
                const data = it[SECOND];

                if (evt === CORE_RERENDER) {
                    shouldRender = true;
                    return;
                }

                if (data) {
                    notify(evt, data);
                    return;
                }
                notify(evt);
            });

            buffer = [];

            if (shouldRender) {
                notify(CORE_RERENDER);
            }

            schedule(dispatch);
        }

        schedule(dispatch);

        return function (evt, data) {
            buffer.push([evt, data]);
        };
    };
}

// eslint-disable-next-line immutable/no-this, no-magic-numbers
const windowed = configureWindowed(1000 / 60, this);

function plugin(maybeScheduler) {
    const scheduler = maybeScheduler || windowed;

    function driver(next) {

        function schedule(notify) {
            /* eslint-disable immutable/no-let */
            let count = 0;
            let batching = true;
            /* eslint-enable immutable/no-let */

            const queue = scheduler(notify);

            function intercept(evt, data) {
                if (evt === CORE_RERENDER) {
                    if (batching) {
                        count += ONE;
                    } else {
                        queue(evt);
                    }
                } else {
                    queue(evt, data);
                }
            }

            const decoratee = next(intercept);

            function receive(evt) {
                const shouldRerender = count > NOTHING;
                switch (evt) {
                case CORE_RENDER_FRAME_INIT:
                    batching = true;
                    break;
                case CORE_RENDER_FRAME_DONE:
                    batching = false;
                    count = NOTHING;
                    break;
                }

                const downstreamResult = (decoratee.receive || noop)(evt);
                if (shouldRerender) {
                    queue(CORE_RERENDER);
                }
                return downstreamResult;
            }

            return {
                expand: decoratee.expand,
                isSpecialTag: decoratee.isSpecialTag,
                receive: receive,
                reduce: decoratee.reduce,
                visit: decoratee.visit,
            };
        }

        return schedule;
    }

    // eslint-disable-next-line immutable/no-mutation
    driver.scheduler = scheduler;
    return driver;
}

/* eslint-disable immutable/no-mutation */
plugin.configureWindowed = configureWindowed;
plugin.sync = sync;
plugin.version = "0.1.0";
plugin.windowed = windowed;
module.exports = plugin;
/* eslint-enable immutable/no-mutation */
