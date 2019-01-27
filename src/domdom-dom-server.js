
const transform = (utils, root) => {
    const { invariant } = utils;

    invariant(
        utils && utils.invariant && utils.trace,
        "Please provide valid utils"
    );
    invariant(
        typeof root === "string" || Array.isArray(root),
        "Please provide a valid root definition"
    );

    if (typeof root === "string") {
        return root;
    }

    const [tagName, content] = root;
    return `<${tagName}>${content}</${tagName}>`;
};

// eslint-disable-next-line immutable/no-mutation
transform.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = transform;

