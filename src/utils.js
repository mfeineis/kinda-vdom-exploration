const {
    DOCUMENT_TYPE_NODE,
    INVALID_NODE,
} = require("./constants");

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
 *     isSpecialTag("!DOCTYPE html") // => [true, DOCUMENT_TYPE_NODE]
 *     isSpecialTag("   !DOCTYPE html") // => [true, DOCUMENT_TYPE_NODE]
 *     isSpecialTag("!DOCTYPE") // => [true, INVALID_NODE]
 *     isSpecialTag("div") // => [false]
 */
const isSpecialTag = function (tagName) {
    if (/\s*!DOCTYPE\s+[^\s]+/.test(tagName)) {
        return [true, DOCUMENT_TYPE_NODE];
    }

    if (!isValidTagName(tagName)) {
        return [true, INVALID_NODE];
    }

    return [false];
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

// eslint-disable-next-line immutable/no-mutation
module.exports = {
    isArray,
    isFunction,
    isObject,
    isSpecialTag,
    isString,
};
