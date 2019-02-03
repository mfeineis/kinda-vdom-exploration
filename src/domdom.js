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
 *     compact([1, null, 2, false, undefined, 3]) // => [1, 2, 3]
 */
const compact = function (it) {
    // FIXME: `jsdoctest` doesn't recognize arrow syntax apparently
    return it.filter(Boolean);
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

const isArray = Array.isArray;

/**
 * @example
 *     isFunction(() => {}) // => true
 *     isFunction(function () {}) // => true
 *     isFunction(/regex/) // => false
 *     isFunction({}) // => false
 *     isFunction(null) // => false
 *     isFunction(true) // => false
 *     isFunction(false) // => false
 *     isFunction(42) // => false
 */
const isFunction = function (it) {
    return typeof it === "function";
};

/**
 * @example
 *     isObject({}) // => true
 *     isObject(Object) // => false
 *     isObject(() => {}) // => false
 *     isObject(function () {}) // => false
 *     isObject([]) // => false
 *     isObject(/regex/) // => false
 *     isObject(null) // => false
 *     isObject(undefined) // => false
 *     isObject("Not an object") // => false
 *     isObject(0) // => false
 *     isObject(42) // => false
 */
const isObject = function (it) {
    return !isArray(it) &&
        typeof it === "object" &&
        it !== null &&
        !(it instanceof RegExp);
};

/**
 * @example
 *     isString("A real hero") // => true
 *     isString("") // => true
 *     isString({}) // => false
 *     isString(null) // => false
 *     isString(undefined) // => false
 *     isString(42) // => false
 *     isString(/regex/) // => false
 */
const isString = function (it) {
    return typeof it === "string";
};

/**
 * @example
 *     isValidTagName("div") // => true
 *     isValidTagName("div#idx") // => true
 *     isValidTagName("div.shiny.text-size-large") // => true
 *     isValidTagName("x-tag") // => true
 *     isValidTagName("my-custom-elem-v1") // => true
 *     isValidTagName("my-elem1") // => true
 *     isValidTagName("div#idx#idy") // => false
 *     isValidTagName("^&") // => false
 */
const isValidTagName = function (tagName) {
    if (isFunction(tagName)) {
        return true;
    }

    const ids = (tagName || "").match(/#/g);
    // eslint-disable-next-line no-magic-numbers
    const hasAtMostOneId = !ids || ids.length <= 1;
    const onlyContainsValidCharacters = /^[1-9a-zA-Z#-.]+$/.test(tagName);
    const startsSimple = /^[a-zA-Z]/.test(tagName);
    const endsSimple = /[a-zA-Z1-9-]$/.test(tagName);
    const hasConsecutive = /\.\.|\.#|#\.|##|#-|#-\.|\.-#/g.test(tagName);

    return startsSimple &&
        endsSimple &&
        hasAtMostOneId &&
        onlyContainsValidCharacters &&
        !hasConsecutive;
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
            return expr;
        }

        if (!isArray(expr)) {
            return "";
        }

        if (isArray(expr[FIRST_ELEMENT])) {
            return compact(expr)
                .map((it) => traverse(driver, it)).join("");
        }

        if (expr[FIRST_ELEMENT] === "") {
            return compact(expr)
                .map((it) => traverse(driver, it)).join("");
        }

        const [tagName, maybeProps, ...childrenWithoutProps] = expr;
        const [, ...allChildren] = expr;
        const hasProps = isObject(maybeProps);
        const children = compact(hasProps ? childrenWithoutProps : allChildren);

        if (driver.isSpecialTag(tagName)) {
            return driver.visit(tagName);
        }

        if (!isValidTagName(tagName, expr)) {
            // TODO: Should we really panic on invalid tag names?
            throw new Error(`Invalid tag name "${tagName}"`);
        }

        const [tag, id, classNames] = extractTagMeta(tagName);
        const props =
            assembleProps(id, classNames, hasProps ? maybeProps : {});

        if (isFunction(tag)) {
            return traverse(driver, tag.call(null, props, children));
        }

        const close = driver.visit(tag, props);

        if (isFunction(close)) {
            return close(children.map((it) => traverse(driver, it)));
        }

        return close;
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

