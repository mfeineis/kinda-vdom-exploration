
/**
 * @example
 *     compact([1, null, 2, false, undefined, 3]) // => [1, 2, 3]
 */
const compact = function (it) {
    // FIXME: `jsdoctest` doesn't recognize arrow syntax apparently
    return it.filter(Boolean);
};

const isArray = Array.isArray;

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

const voidElementLookup = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true,
};

/**
 * @example
 *     isVoidElement("br") // => true
 *     isVoidElement("div") // => false
 */
const isVoidElement = function (tagName) {
    return Boolean(voidElementLookup[tagName]);
};

/**
 * @example
 *     spreadProps({ class: "a b c" }) // => " class=\"a b c\""
 *     spreadProps({ c: "d", a: "b" }) // => " a=\"b\" c=\"d\""
 *     spreadProps([]) // => ""
 *     spreadProps(/regex/) // => ""
 *     spreadProps(() => {}) // => ""
 */
const spreadProps = function (props) {
    const result = Object.keys(props).sort()
        .map((key) => ` ${key}="${props[key]}"`);

    return result.join("");
};

const transform = (utils, root) => {
    const { invariant } = utils;

    invariant(
        utils && utils.invariant && utils.trace,
        "Please provide valid utils"
    );
    invariant(
        isString(root) || isArray(root),
        "Please provide a valid root element"
    );

    // FIXME: Remove Recursion!
    const traverse = (traversable) => {

        if (isString(traversable)) {
            return traversable;
        }

        if (!isArray(traversable)) {
            return "";
        }

        if (isArray(traversable[0])) {
            return compact(traversable).map(traverse).join("");
        }

        const [tagName, props, ...childrenWithoutProps] = traversable;
        const [, ...allChildren] = traversable;
        const hasProps = isObject(props);
        const children = compact(hasProps ? childrenWithoutProps : allChildren);

        if (!tagName) {
            return "";
        }

        if (isVoidElement(tagName)) {
            return `<${tagName}${hasProps ? spreadProps(props) : ""}/>`;
        }

        if (/\s*!DOCTYPE/.test(tagName)) {
            return `<${tagName}>`;
        }

        const subTree = children.map(traverse).join("");
        const propsString = hasProps ? spreadProps(props) : "";

        return `<${tagName}${propsString}>${subTree}</${tagName}>`;
    };

    return traverse(root);
};

// eslint-disable-next-line immutable/no-mutation
transform.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = transform;

