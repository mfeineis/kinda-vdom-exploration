const {
    ELEMENT_NODE,
    INVALID_NODE,
    DOCUMENT_TYPE_NODE,
    TEXT_NODE,
} = require("./constants");
const {
    isSpecialTag,
} = require("./utils");


const driver = (utils, root) => {
    const { invariant } = utils;

    invariant(
        root && root.ownerDocument && root.ownerDocument.createElement,
        "Please supply a valid root node"
    );

    const document = root.ownerDocument;

    const visit = (tag, _, nodeType) => {
        switch (nodeType) {
        case ELEMENT_NODE: {
            const child = document.createElement(tag);
            root.appendChild(child);

            return (children) => {
                children.forEach((it) => {
                    child.appendChild(it);
                });
            };
        }
        case TEXT_NODE:
            return document.createTextNode(tag);
        }
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
