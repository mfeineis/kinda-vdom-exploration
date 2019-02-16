const signals = require("./signals");
const CORE_RERENDER = signals.CORE_RERENDER;
const CORE_RENDER_FRAME_DONE = signals.CORE_RENDER_FRAME_DONE;
const CORE_RENDER_FRAME_INIT = signals.CORE_RENDER_FRAME_INIT;

const NOTHING = 0;
const ONE = 1;

function noop() {}

function plugin() {

    function driver(next) {

        function schedule(notify) {
            /* eslint-disable immutable/no-let */
            let count = 0;
            let batching = true;
            /* eslint-enable immutable/no-let */

            function intercept(evt, data) {
                if (evt === CORE_RERENDER) {
                    if (batching) {
                        count += ONE;
                    } else {
                        notify(evt);
                    }
                } else {
                    notify(evt, data);
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
                    notify(CORE_RERENDER);
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

    return driver;
}

/* eslint-disable immutable/no-mutation */
plugin.version = "0.1.0";
module.exports = plugin;
/* eslint-enable immutable/no-mutation */
