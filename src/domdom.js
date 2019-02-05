const {
    ELEMENT_NODE,
    TEXT_NODE,
    DOCUMENT_TYPE_NODE,
} = require("./constants");
const {
    invariant,
    isArray,
    isFunction,
    isObject,
    isString,
} = require("./utils");

const slice = [].slice;

const FIRST = 0;
const SECOND = 1;
const THIRD = 2;
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
function assembleProps(id, classNames, props) {
    if (id) {
        if (props.id) {
            throw new Error(
                "Multiple IDs \"" + id + "\"/" + props.id + " provided"
            );
        }

        // eslint-disable-next-line immutable/no-mutation
        props.id = id;
    }

    // eslint-disable-next-line immutable/no-let
    let classList = classNames;

    if (isObject(props.class)) {
        const truthyValuedKeys = Object.keys(props.class).filter(
            function (name) {
                return props.class[name];
            }
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
}

/**
 * @example
 *     extractTagMeta("div") // => ["div", "", []]
 *     extractTagMeta("div#some-id") // => ["div", "some-id", []]
 *     extractTagMeta("div.cls-a.cls-b") // => ["div", "", ["cls-a", "cls-b"]]
 *     extractTagMeta("i#idx.some-class.fx42")
 *     // => ["i", "idx", ["some-class", "fx42"]]
 *     extractTagMeta(extractTagMeta) // => [extractTagMeta, "", []]
 */
function extractTagMeta(tagName) {
    if (isFunction(tagName)) {
        return [tagName, "", []];
    }

    const tag = tagName.match(/^[^.#]+/)[FIRST];
    const id = (tagName.match(/#[^.]+/) || [""])[FIRST]
        .replace("#", "");
    const classNames = (tagName.match(/\.[^.#]+/g) || []).map(function (cls) {
        return cls.replace(".", "");
    });
    return [tag, id, classNames];
}

function configureRenderer() {

    // FIXME: Remove Recursion!
    function traverse(driver, expr, isTopLevel) {

        if (isString(expr)) {
            return driver.visit(expr, null, TEXT_NODE, isTopLevel);
        }

        if (!isArray(expr)) {
            return "";
        }

        if (isArray(expr[FIRST])) {
            return driver.reduce(
                expr.map(function (it) {
                    return traverse(driver, it);
                })
            );
        }

        if (expr[FIRST] === "") {
            return driver.reduce(
                expr.map(function (it) {
                    return traverse(driver, it);
                })
            );
        }

        const tagName = expr[FIRST];
        const maybeProps = expr[SECOND];
        const childrenWithoutProps = slice.call(expr, THIRD);
        const allChildren = slice.call(expr, SECOND);
        const hasProps = isObject(maybeProps);
        const children = hasProps ? childrenWithoutProps : allChildren;

        const specialResult = driver.isSpecialTag(tagName);
        const isSpecial = specialResult[FIRST];
        const specialNodeType = specialResult[SECOND];
        if (isSpecial) {
            return driver.visit(tagName, null, specialNodeType, isTopLevel);
        }

        const metaResult = extractTagMeta(tagName);
        const tag = metaResult[FIRST];
        const id = metaResult[SECOND];
        const classNames = metaResult[THIRD];
        const props =
            assembleProps(id, classNames, hasProps ? maybeProps : {});

        if (isFunction(tag)) {
            return traverse(driver, tag.call(null, props, children));
        }

        const finalize = driver.visit(tag, props, ELEMENT_NODE, isTopLevel);

        if (isFunction(finalize)) {
            return finalize(children.map(function (it) {
                return traverse(driver, it);
            }));
        }

        return finalize;
    }

    function render(drive, expr, root) {

        invariant(
            typeof drive === "function" && drive.length <= TWO,
            "Please provide a valid 'driver' into 'render'"
        );
        invariant(
            expr && (isString(expr) || isArray(expr)),
            "Please provide a valid expression"
        );

        return traverse(drive(root), expr, true);
    }

    return render;
}

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = {
    configureRenderer,
    render: configureRenderer(),
    version: "0.1.0",
};

