
const prodUtils = {
    checkEnvironment: () => {
    },
    invariant: (condition, message) => {
        if (!condition) {
            throw new Error(`InvariantViolation: ${message}`);
        }
    },
    trace: () => {},
};

/**
 * @param {Number} a
 * @param {Number} b
 * @example
 *     add(1, 1) // => 2
 */
const add = function (a, b) { // eslint-disable-line no-unused-vars
    // FIXME: `jsdoctest` doesn't recognize arrow syntax apparently
    return a + b;
};

const configureRenderer = (utils, document) => {
    const { checkEnvironment, invariant, trace } = utils || prodUtils;

    checkEnvironment(invariant);

    invariant(
        document,
        "Please pass a valid 'document' to configure a renderer"
    );

    function render(driver, root) {
        invariant(
            driver && driver["domdom-dom-server"],
            "Please provide a valid 'driver' into 'render'"
        );
        invariant(
            typeof root === "string" || Array.isArray(root),
            "Please provide a valid root definition"
        );

        trace(utils, document, driver, root);

        if (typeof root === "string") {
            return root;
        }

        const [tagName, content] = root;
        return `<${tagName}>${content}</${tagName}>`;
    }

    return render;
};

const hasDocument = typeof document !== "undefined";

const render = hasDocument
    ? configureRenderer(prodUtils, document)
    : null;

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = {
    _: prodUtils,
    configureRenderer,
    render,
};

