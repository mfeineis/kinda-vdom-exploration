const TWO = 2;

const prodUtils = {
    checkEnvironment: (invariant, Arr = Array, Obj = Object) => {
        const ArrayProto = Arr.prototype;
        invariant(
            typeof Arr.isArray === "function",
            "'Array.isArray' is required"
        );
        invariant(
            typeof ArrayProto.filter === "function",
            "'Array.prototype.filter' is required"
        );
        invariant(
            typeof ArrayProto.forEach === "function",
            "'Array.prototype.forEach' is required"
        );
        invariant(
            typeof ArrayProto.map === "function",
            "'Array.prototype.map' is required"
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

const configureRenderer = (utils) => {
    const { checkEnvironment, invariant } = utils || prodUtils;

    checkEnvironment(invariant);

    function render(driver, root) {
        invariant(
            typeof driver === "function" && driver.length === TWO,
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

