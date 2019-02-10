const utils = require("./utils");

const DOCUMENT_TYPE_NODE = utils.DOCUMENT_TYPE_NODE;
const ELEMENT_NODE = utils.ELEMENT_NODE;
const TEXT_NODE = utils.TEXT_NODE;

const invariant = utils.invariant;
const isArray = utils.isArray;
const isFunction = utils.isFunction;
const isObject = utils.isObject;
const isString = utils.isString;

const slice = [].slice;

const FIRST = 0;
const SECOND = 1;
const THIRD = 2;

/**
 * @example
 *     assembleProps("a", [], {}) // => { id: "a" }
 *     assembleProps("a", ["X"], { class: "Y" })
 *     // => { id: "a", classList: ["X", "Y"] }
 *     assembleProps("", ["X"], { className: "Y" })
 *     // => { classList: ["X", "Y"] }
 *     assembleProps("", ["X"], { class: "Z", className: "Y" })
 *     // => { classList: ["X", "Y", "Z"] }
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
        const cache = {};
        classList.forEach(function (name) {
            // eslint-disable-next-line immutable/no-mutation
            cache[name] = true;
        });
        // eslint-disable-next-line immutable/no-mutation
        props.classList = Object.keys(cache).sort();
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

function identity(it) {
    return it;
}

function configureRenderer() {

    function expand(tmpl, props, children) {
        return tmpl.call(null, props, children);
    }

    function isSpecialTag() {
        return [false];
    }

    // FIXME: Remove Recursion!
    function traverse(driver, expr, path) {

        if (isString(expr)) {
            return driver.visit(expr, null, TEXT_NODE, path);
        }

        if (!isArray(expr)) {
            return "";
        }

        if (isArray(expr[FIRST])) {
            return (driver.reduce || identity)(
                expr.map(function (it, i) {
                    return traverse(driver, it, path.concat([i]));
                })
            );
        }

        if (expr[FIRST] === "") {
            return (driver.reduce || identity)(
                expr.map(function (it, i) {
                    return traverse(driver, it, path.concat([i]));
                })
            );
        }

        const tagName = expr[FIRST];
        const maybeProps = expr[SECOND];
        const childrenWithoutProps = slice.call(expr, THIRD);
        const allChildren = slice.call(expr, SECOND);
        const hasProps = isObject(maybeProps);
        const children = hasProps ? childrenWithoutProps : allChildren;

        const specialResult = (driver.isSpecialTag || isSpecialTag)(tagName);
        const isSpecial = specialResult[FIRST];
        if (isSpecial) {
            const specialNodeType = specialResult[SECOND];
            return driver.visit(tagName, null, specialNodeType, path);
        }

        const metaResult = extractTagMeta(tagName);
        const tag = metaResult[FIRST];
        const id = metaResult[SECOND];
        const classNames = metaResult[THIRD];
        const props =
            assembleProps(id, classNames, hasProps ? maybeProps : {});

        if (isFunction(tag)) {
            return traverse(
                driver,
                (driver.expand || expand)(tag, props, children),
                path
            );
        }

        const finalize = driver.visit(tag, props, ELEMENT_NODE, path);

        if (isFunction(finalize)) {
            return finalize(children.map(function (it, i) {
                return traverse(driver, it, path.concat([i]));
            }));
        }

        return finalize;
    }

    function render(driver, expr) {

        invariant(
            typeof driver === "object" && isFunction(driver.visit),
            "Please provide a valid 'driver' into 'render'"
        );
        invariant(
            expr && (isString(expr) || isArray(expr) || isFunction(expr)),
            "Please provide a valid expression"
        );

        return traverse(driver, expr, [FIRST]);
    }

    return render;
}

/* eslint-disable immutable/no-mutation */
exports.configureRenderer = configureRenderer;
exports.render = configureRenderer();
exports.version = "0.1.0";
/* eslint-enable immutable/no-mutation */
