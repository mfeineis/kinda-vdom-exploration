const marksy = require("marksy");

const FIRST = 0;

const slice = [].slice;

/**
 * @example
 *     compact([1, null, 10, false, "Hello", 0, undefined, "World!"])
 *     // => [1, 10, "Hello", "World!"]
 */
function compact(items) {
    return slice.call(items).filter(Boolean);
}

function createElement(tagName, src, children) {
    const props = {};

    // eslint-disable-next-line immutable/no-let
    let hasProps = false;

    Object.keys(src).forEach(function (key) {
        if (["key"].indexOf(key) >= FIRST) {
            return;
        }

        if (src[key] === null || src[key] === undefined) {
            return;
        }

        hasProps = true;

        // eslint-disable-next-line immutable/no-mutation
        props[key] = src[key];
    });

    return compact([tagName, hasProps ? props : null].concat(children));
}

const compile = marksy.marksy({
    // Pass in whatever creates elements for your
    // virtual DOM library. h('h1', {})
    createElement: createElement,
});

function configureMarkdown(markedOptions) {
    return function markdown(props, children) {
        const md = children[FIRST];

        const compiled = compile(md, markedOptions, props);
        // compiled.toc // The table of contents, based on usage of headers

        return compiled.tree;
    };
}

const markdown = configureMarkdown({
    // Options passed to "marked" (https://www.npmjs.com/package/marked)
});

/* eslint-disable immutable/no-mutation */
markdown.configureMarkdown = configureMarkdown;
markdown.version = "0.1.0";

module.exports = markdown;
/* eslint-enable immutable/no-mutation */
