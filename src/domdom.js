const {
    ELEMENT_NODE,
    TEXT_NODE,
    DOCUMENT_TYPE_NODE,
} = require("./constants");
const {
    isArray,
    isFunction,
    isObject,
    isString,
} = require("./utils");

const FIRST_ELEMENT = 0;
const TWO = 2;

/**
 * @example
 *     assembleProps("a", [], {}) // => { id: "a" }
 *     assembleProps("a", ["X"], { class: "Y" })
 *     // => { id: "a", classList: ["X", "Y"] }
 *     assembleProps("", ["X"], { className: "Y" })
 *     // => { classList: ["X", "Y"] }
 *     assembleProps("", ["X"], { class: "Z", className: "Y" })
 *     // => { classList: ["X", "Z", "Y"] }
 */
const assembleProps = function (id, classNames, props) {
    if (id) {
        if (props.id) {
            throw new Error(`Multiple IDs "${id}"/${props.id} provided`);
        }

        // eslint-disable-next-line immutable/no-mutation
        props.id = id;
    }


    // eslint-disable-next-line immutable/no-let
    let classList = classNames;

    if (isObject(props.class)) {
        const truthyValuedKeys = Object.keys(props.class).filter(
            (name) => props.class[name]
        );
        classList = classList.concat(truthyValuedKeys);
        delete props.class;
    }

    if (isArray(props.classList)) {
        classList = classList.concat(props.classList);
    }

    if (isString(props.class)) {
        classList = classList.concat(props.class.split(" "));
        delete props.class;
    }

    if (props.className) {
        classList = classList.concat(props.className.split(" "));
        delete props.className;
    }

    if (classList.length) {
        // eslint-disable-next-line immutable/no-mutation
        props.classList = classList;
    }

    return props;
};

/**
 * @example
 *     extractTagMeta("div") // => ["div", "", []]
 *     extractTagMeta("div#some-id") // => ["div", "some-id", []]
 *     extractTagMeta("div.cls-a.cls-b") // => ["div", "", ["cls-a", "cls-b"]]
 *     extractTagMeta("i#idx.some-class.fx42")
 *     // => ["i", "idx", ["some-class", "fx42"]]
 *     extractTagMeta(extractTagMeta) // => [extractTagMeta, "", []]
 */
const extractTagMeta = function (tagName) {
    if (isFunction(tagName)) {
        return [tagName, "", []];
    }

    const tag = tagName.match(/^[^.#]+/)[FIRST_ELEMENT];
    const id = (tagName.match(/#[^.]+/) || [""])[FIRST_ELEMENT]
        .replace("#", "");
    const classNames = (tagName.match(/\.[^.#]+/g) || []).map((cls) => {
        return cls.replace(".", "");
    });
    return [tag, id, classNames];
};

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

    // FIXME: Remove Recursion!
    const traverse = (driver, expr) => {

        if (isString(expr)) {
            return driver.visit(expr, null, TEXT_NODE);
        }

        if (!isArray(expr)) {
            return "";
        }

        if (isArray(expr[FIRST_ELEMENT])) {
            return driver.reduce(
                expr.map((it) => traverse(driver, it))
            );
        }

        if (expr[FIRST_ELEMENT] === "") {
            return driver.reduce(
                expr.map((it) => traverse(driver, it))
            );
        }

        const [tagName, maybeProps, ...childrenWithoutProps] = expr;
        const [, ...allChildren] = expr;
        const hasProps = isObject(maybeProps);
        const children = hasProps ? childrenWithoutProps : allChildren;

        const [isSpecial, specialNodeType] = driver.isSpecialTag(tagName);
        if (isSpecial) {
            return driver.visit(tagName, null, specialNodeType);
        }

        const [tag, id, classNames] = extractTagMeta(tagName);
        const props =
            assembleProps(id, classNames, hasProps ? maybeProps : {});

        if (isFunction(tag)) {
            return traverse(driver, tag.call(null, props, children));
        }

        const finalize = driver.visit(tag, props, ELEMENT_NODE);

        if (isFunction(finalize)) {
            return finalize(children.map((it) => traverse(driver, it)));
        }

        return finalize;
    };

    function render(drive, expr, root) {

        invariant(
            typeof drive === "function" && drive.length <= TWO,
            "Please provide a valid 'driver' into 'render'"
        );
        invariant(
            expr && (isString(expr) || isArray(expr)),
            "Please provide a valid expression"
        );

        return traverse(drive(utils, root), expr);
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

