const signals = require("./signals");
const CORE_RENDER = signals.CORE_RENDER;
const DOMDRIVER_HANDLER_RETURNED_DATA = signals.DOMDRIVER_HANDLER_RETURNED_DATA;
const DOMDRIVER_MISSING_HANDLER = signals.DOMDRIVER_MISSING_HANDLER;

const slice = [].slice;

const GET_EXPANDO = "__aydin_plugin_mvu_get";

const FIRST = 0;
const SECOND = 1;
const ONE = 1;

/**
 * @example
 *     dropFirst([]) // => []
 *     dropFirst([1]) // => []
 *     dropFirst([1,2]) // => [2]
 */
function dropFirst(items) {
    return slice.call(items, SECOND);
}

function identity(it) {
    return it;
}

function baseExpand(tmpl, props, children) {
    return tmpl.call(null, props, children);
}

function plugin(update) {
    const init = update();
    // eslint-disable-next-line immutable/no-let
    let model = init[FIRST];

    function dispatch(msgs, initIntents) {
        // eslint-disable-next-line immutable/no-let
        let newModel = model;

        function put(msg) {
            msgs.push(msg);
        }

        (initIntents || []).forEach(function (intent) {
            const args = [put].concat(dropFirst(intent));
            intent[FIRST].apply(null, args);
        });

        // eslint-disable-next-line immutable/no-let
        let i = 0;
        while (i < msgs.length) {
            const msg = msgs[i];
            const result = update(newModel, msg);
            newModel = result[FIRST];

            const newIntents = dropFirst(result);
            newIntents.forEach(function (intent) {
                const args = [put].concat(dropFirst(intent));
                intent[FIRST].apply(null, args);
            });

            i += ONE;
        }

        const hasChanges = newModel !== model;
        model = newModel;
        return hasChanges;
    }

    dispatch([], dropFirst(init));

    function driver(next) {

        function mvu(notify) {

            function intercept(evt, data) {
                switch (evt) {
                case DOMDRIVER_HANDLER_RETURNED_DATA:
                    if (dispatch([data.data])) {
                        notify(CORE_RENDER);
                        return;
                    }
                    return;
                case DOMDRIVER_MISSING_HANDLER:
                    if (dispatch([data.value])) {
                        notify(CORE_RENDER);
                        return;
                    }
                    return;
                default:
                    notify(evt, data);
                    return;
                }
            }

            const decoratee = next(intercept);

            function expand(tmpl, props, children) {
                if (tmpl[GET_EXPANDO]) {
                    return tmpl.call(null, tmpl[GET_EXPANDO](model), children);
                }
                return (decoratee.expand || baseExpand)(tmpl, props, children);
            }

            return {
                expand: expand,
                isSpecialTag: decoratee.isSpecialTag,
                receive: decoratee.receive,
                reduce: decoratee.reduce,
                visit: decoratee.visit,
            };

        }

        // eslint-disable-next-line immutable/no-mutation
        mvu.dispatch = dispatch;
        return mvu;
    }

    return driver;
}

function connect(get) {
    return function (tmpl) {

        function connected() {
            return tmpl.apply(null, arguments);
        }

        /* eslint-disable immutable/no-mutation */
        connected[GET_EXPANDO] = get || identity;
        /* eslint-enable immutable/no-mutation */

        return connected;
    };
}
// eslint-disable-next-line immutable/no-mutation
plugin.connect = connect;

/* eslint-disable immutable/no-mutation */
plugin.version = "0.1.0";
module.exports = plugin;
/* eslint-enable immutable/no-mutation */
