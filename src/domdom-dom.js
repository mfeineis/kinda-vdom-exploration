
const SECOND = 1;
const FIRST = 0;

const transform = (utils, expr, root) => {
    const { invariant } = utils;

    invariant(
        root && root.ownerDocument && root.ownerDocument.createElement,
        "Please supply a valid root node"
    );

    invariant(
        expr && Array.isArray(expr),
        "Please supply a valid expression"
    );

    if (!expr || expr.length === FIRST) {
        return;
    }

    const document = root.ownerDocument;
    const child = document.createElement(expr[FIRST]);
    child.appendChild(document.createTextNode(expr[SECOND]));

    root.appendChild(child);
};

// eslint-disable-next-line immutable/no-mutation
transform.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = transform;
