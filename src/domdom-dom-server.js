
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
 *     isSpecialTag("!DOCTYPE html") // => true
 *     isSpecialTag("   !DOCTYPE html") // => true
 *     isSpecialTag("!DOCTYPE") // => false
 */
const isSpecialTag = function (tagName) {
    return /\s*!DOCTYPE\s+[^\s]+/.test(tagName);
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
 *     serializePropValue({ a: "a", b: "b" }) // => "{\"a\":\"a\",\"b\":\"b\"}"
 */
const serializePropValue = function (value) {
    return JSON.stringify(value);
};

/**
 * @example
 *     spreadProps({ classList: ["b", "a"] }) // => " class=\"a b\""
 *     spreadProps({ c: "d", a: "b" }) // => " a=\"b\" c=\"d\""
 *     spreadProps({ onClick: () => {} }) // => ""
 *     spreadProps([]) // => ""
 *     spreadProps(/regex/) // => ""
 *     spreadProps(() => {}) // => ""
 */
const spreadProps = function (props) {
    return Object.keys(props).sort().map((key) => {
        if (/^on/i.test(key)) {
            return "";
        }

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

const driver = () => {

    const visit = (tag, props) => {
        if (isSpecialTag(tag)) {
            // FIXME: Validate doctype structure
            return `<${tag}>`;
        }

        if (isVoidElement(tag)) {
            const propsString = spreadProps(props);
            return `<${tag}${propsString}/>`;
        }

        const propsString = spreadProps(props);

        return (children) => {
            return `<${tag}${propsString}>${children.join("")}</${tag}>`;
        };
    };

    return {
        isSpecialTag,
        visit,
    };
};

// eslint-disable-next-line immutable/no-mutation
driver.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = driver;

