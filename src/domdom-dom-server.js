const FIRST_ELEMENT = 0;

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
    let classList = classNames.concat(props.classList || []);

    if (props.class) {
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
 */
const extractTagMeta = function (tagName) {
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
 *     serializePropValue({ a: "a", b: "b" }) // => "{\"a\":\"a\",\"b\":\"b\"}"
 */
const serializePropValue = function (value) {
    return JSON.stringify(value);
};

/**
 * @example
 *     spreadProps({ classList: ["b", "a"] }) // => " class=\"a b\""
 *     spreadProps({ c: "d", a: "b" }) // => " a=\"b\" c=\"d\""
 *     spreadProps([]) // => ""
 *     spreadProps(/regex/) // => ""
 *     spreadProps(() => {}) // => ""
 */
const spreadProps = function (props) {
    return Object.keys(props).sort().map((key) => {
        const value = props[key];
        if (key === "classList") {
            if (value.length) {
                const cssCache = {};
                // eslint-disable-next-line immutable/no-mutation
                value.forEach((name) => cssCache[name] = true);
                return ` class="${Object.keys(cssCache).sort().join(" ")}"`;
            }

            return "";
        }

        if (isObject(value) || isArray(value)) {
            if (key === "data") {
                return Object.keys(value).sort().map((name) => {
                    const propValue = value[name];
                    if (isString(propValue)) {
                        return ` data-${name}="${propValue}"`;
                    }

                    return ` data-${name}='${serializePropValue(propValue)}'`;
                }).join("");
            }

            return ` ${key}='${serializePropValue(value)}'`;
        }

        return ` ${key}="${value}"`;
    }).join("");
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

        if (isArray(traversable[FIRST_ELEMENT])) {
            return compact(traversable).map(traverse).join("");
        }

        const [tagName, maybeProps, ...childrenWithoutProps] = traversable;
        const [, ...allChildren] = traversable;
        const hasProps = isObject(maybeProps);
        const children = compact(hasProps ? childrenWithoutProps : allChildren);

        if (/\s*!DOCTYPE/.test(tagName)) {
            // FIXME: Validate doctype structure
            return `<${tagName}>`;
        }

        if (!isValidTagName(tagName)) {
            // TODO: Should we really panic on invalid tag names?
            throw new Error(`Invalid tag name "${tagName}"`);
        }

        const [tag, id, classNames] = extractTagMeta(tagName);
        const props =
            assembleProps(id, classNames, hasProps ? maybeProps : {});

        if (isVoidElement(tag)) {
            const propsString = spreadProps(props);
            return `<${tag}${propsString}/>`;
        }

        const subTree = children.map(traverse).join("");
        const propsString = spreadProps(props);

        return `<${tag}${propsString}>${subTree}</${tag}>`;
    };

    return traverse(root);
};

// eslint-disable-next-line immutable/no-mutation
transform.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = transform;

