
const prodUtils = {
    checkEnvironment: (invariant, Arr = Array, Obj = Object) => {
        invariant(
            typeof Arr.isArray === "function",
            "'Array.isArray' is required"
        );
        invariant(
            typeof Obj.keys === "function",
            "'Object.keys' is required"
        );
    },
    invariant: (condition, message) => {
        if (!condition) {
            throw new Error(`InvariantViolation: ${message}`);
        }
    },
    trace: () => {},
};

/**
 * @example
 *     add(1, 1) // => 2
 */
const add = function (a, b) { // eslint-disable-line no-unused-vars
    // FIXME: `jsdoctest` doesn't recognize arrow syntax apparently
    return a + b;
};

const configureRenderer = (utils) => {
    const { checkEnvironment, invariant } = utils || prodUtils;

    checkEnvironment(invariant);

    function render(driver, root) {
        invariant(
            typeof driver === "function" && driver.length === 2,
            "Please provide a valid 'driver' into 'render'"
        );

        return driver(utils, root);
    }

    return render;
};

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = {
    _: prodUtils,
    configureRenderer,
    render: configureRenderer(prodUtils),
    version: "0.1.0",
};

