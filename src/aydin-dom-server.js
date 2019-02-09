const utils = require("./utils");

const DOCUMENT_TYPE_NODE = utils.DOCUMENT_TYPE_NODE;
const ELEMENT_NODE = utils.ELEMENT_NODE;
const INVALID_NODE = utils.INVALID_NODE;
const TEXT_NODE = utils.TEXT_NODE;

const isArray = utils.isArray;
const isObject = utils.isObject;
const isSpecialTag = utils.isSpecialTag;
const isString = utils.isString;

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
function isVoidElement(tagName) {
    return Boolean(voidElementLookup[tagName]);
}

/**
 * @example
 *     serialize({ a: "a", b: "b" }) // => "{\"a\":\"a\",\"b\":\"b\"}"
 */
function serialize(value) {
    return JSON.stringify(value);
}

/**
 * @example
 *     spreadProps({ classList: ["a", "b"] }) // => " class=\"a b\""
 *     spreadProps({ a: "b", c: "d" }) // => " a=\"b\" c=\"d\""
 *     spreadProps({ onClick: () => {} }) // => ""
 *     spreadProps([]) // => ""
 *     spreadProps(/regex/) // => ""
 *     spreadProps(() => {}) // => ""
 */
function spreadProps(props) {
    return Object.keys(props).sort().map(function (key) {
        if (/^on/i.test(key)) {
            return "";
        }

        const value = props[key];
        if (key === "classList") {
            if (value.length) {
                return " class=\"" + value.join(" ") + "\"";
            }

            return "";
        }

        if (isObject(value) || isArray(value)) {
            if (key === "data") {
                return Object.keys(value).sort().map(function (name) {
                    const propValue = value[name];
                    if (isString(propValue)) {
                        return " data-" + name + "=\"" + propValue + "\"";
                    }

                    return " data-" + name + "='" + serialize(propValue) + "'";
                }).join("");
            }

            return " " + key + "='" + serialize(value) + "'";
        }

        if (typeof value === "boolean") {
            if (value) {
                return " " + key;
            }

            return "";
        }

        return " " + key + "=\"" + value + "\"";
    }).join("");
}

function driver() {

    function visit(tag, props, nodeType) {
        if (nodeType === INVALID_NODE) {
            // TODO: Should we really panic on invalid tag names?
            throw new Error("Invalid tag name \"" + tag + "\"");
        }

        if (nodeType === TEXT_NODE) {
            return tag;
        }

        if (nodeType === DOCUMENT_TYPE_NODE) {
            // FIXME: Validate doctype structure
            return "<" + tag + ">";
        }

        if (isVoidElement(tag)) {
            const propsString = spreadProps(props);
            return "<" + tag + propsString + "/>";
        }

        const propsString = spreadProps(props);

        return function (children) {
            return "<" + tag + propsString + ">" +
                children.join("") +
                "</" + tag + ">";
        };
    }

    return {
        isSpecialTag,
        reduce(nodes) {
            return nodes.join("");
        },
        visit,
    };
}

// eslint-disable-next-line immutable/no-mutation
driver.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = driver;

