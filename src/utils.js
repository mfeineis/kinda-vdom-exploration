// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const DOCUMENT_TYPE_NODE = 10;
const COLLECTION_END = 100;
const INVALID_NODE = -100;

const slice = [].slice;

/**
 * @example
 *     dropLast([]) // => []
 *     dropLast([1]) // => []
 *     dropLast([1,2]) // => [1]
 */
function dropLast(it) {
    // eslint-disable-next-line no-magic-numbers
    return slice.call(it, 0, it.length - 1);
}

function invariant(condition, message) {
    if (!condition) {
        throw new Error("InvariantViolation: " + message);
    }
}

const isArray = Array.isArray;

/**
 * @remarks
 *     In some old Safari versions you could use RegExps like functions
 *     and the `typeof` operator would give back "function" for them
 *     for... reasons
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
function isFunction(it) {
    return typeof it === "function" && !(it instanceof RegExp);
}

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
function isObject(it) {
    return !isArray(it) &&
        typeof it === "object" &&
        it !== null &&
        !(it instanceof RegExp);
}

/**
 * @example
 *     isSpecialTag("!DOCTYPE html") // => [true, DOCUMENT_TYPE_NODE]
 *     isSpecialTag("   !DOCTYPE html") // => [true, DOCUMENT_TYPE_NODE]
 *     isSpecialTag("!DOCTYPE") // => [true, INVALID_NODE]
 *     isSpecialTag("div") // => [false]
 */
function isSpecialTag(tagName) {
    if (/\s*!DOCTYPE\s+[^\s]+/.test(tagName)) {
        return [true, DOCUMENT_TYPE_NODE];
    }

    if (!isValidTagName(tagName)) {
        return [true, INVALID_NODE];
    }

    return [false];
}

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
function isString(it) {
    return typeof it === "string";
}

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
function isValidTagName(tagName) {
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
}

/**
 * @example
 *     noop() // =>
 *     noop("div") // =>
 */
function noop() {}

/* eslint-disable immutable/no-mutation */
exports.ELEMENT_NODE = ELEMENT_NODE;
exports.TEXT_NODE = TEXT_NODE;
exports.DOCUMENT_TYPE_NODE = DOCUMENT_TYPE_NODE;
exports.COLLECTION_END = COLLECTION_END;
exports.INVALID_NODE = INVALID_NODE;

exports.dropLast = dropLast;
exports.invariant = invariant;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isObject = isObject;
exports.isSpecialTag = isSpecialTag;
exports.isString = isString;
exports.noop = noop;
/* eslint-enable immutable/no-mutation */

