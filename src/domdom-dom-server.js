const {
    DOCUMENT_TYPE_NODE,
    ELEMENT_NODE,
    INVALID_NODE,
    TEXT_NODE,
} = require("./constants");
const {
    isArray,
    isObject,
    isSpecialTag,
    isString,
} = require("./utils");

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

    const visit = (tag, props, nodeType) => {
        if (nodeType === INVALID_NODE) {
            // TODO: Should we really panic on invalid tag names?
            throw new Error(`Invalid tag name "${tag}"`);
        }

        if (nodeType === TEXT_NODE) {
            return tag;
        }

        if (nodeType === DOCUMENT_TYPE_NODE) {
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
        reduce: (nodes) => nodes.join(""),
        visit,
    };
};

// eslint-disable-next-line immutable/no-mutation
driver.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = driver;

