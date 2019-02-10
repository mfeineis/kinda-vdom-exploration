
const FIRST = 0;

function plugin(update) {
    const LENS_EXPANDO = "__aydin_plugin_mvu_lens";
    const TMPL_EXPANDO = "__aydin_plugin_mvu_tmpl";

    const init = update(null);
    const model = init[FIRST];

    function driver(decoratee) {

        function expand(tmpl, props, children) {
            return tmpl.call(null, props, children);
        }

        function visit(tag, props, nodeType, path) {
            return decoratee.visit(tag, props, nodeType, path);
        }

        return {
            expand: expand,
            isSpecialTag: decoratee.isSpecialTag,
            reduce: decoratee.reduce,
            visit: visit,
        };
    }

    function lens(get) {
        return function connect(tmpl) {

            function connected(props, children) {
                return tmpl(get(model), children);
            }

            /* eslint-disable immutable/no-mutation */
            connected[LENS_EXPANDO] = get;
            connected[TMPL_EXPANDO] = tmpl;
            /* eslint-enable immutable/no-mutation */

            return connected;
        };
    }
    // eslint-disable-next-line immutable/no-mutation
    driver.lens = lens;

    return driver;
}

/* eslint-disable immutable/no-mutation */
plugin.version = "0.1.0";
module.exports = plugin;
/* eslint-enable immutable/no-mutation */
