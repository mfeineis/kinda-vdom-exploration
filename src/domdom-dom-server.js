
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

const compact = (it) => it.filter(Boolean);
const isArray = Array.isArray;
const isObject = (it) => !isArray(it) && typeof it === "object";
const isString = (it) => typeof it === "string";
const isVoidElement = (tagName) => voidElementLookup[tagName];

const spread = (props) => {
    if (!props) {
        return "";
    }

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

        if (isArray(traversable[0])) {
            return compact(traversable).map(traverse).join("");
        }

        const [tagName, props, ...childrenWithoutProps] = traversable;
        const [, ...allChildren] = traversable;
        const hasProps = isObject(props);
        const children = compact(hasProps ? childrenWithoutProps : allChildren);

        if (!tagName && !props && children.length === 0) {
            return "";
        }

        if (isVoidElement(tagName)) {
            return `<${tagName}${hasProps ? spread(props) : ""}/>`;
        }

        if (/\s*!DOCTYPE/.test(tagName)) {
            return `<${tagName}>`;
        }

        const subTree = children.map(traverse).join("");
        const propsString = hasProps ? spread(props) : "";

        return `<${tagName}${propsString}>${subTree}</${tagName}>`;
    };

    return traverse(root);
};

// eslint-disable-next-line immutable/no-mutation
transform.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = transform;

