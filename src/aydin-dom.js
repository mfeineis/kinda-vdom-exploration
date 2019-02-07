const constants = require("./constants");
const DOCUMENT_TYPE_NODE = constants.DOCUMENT_TYPE_NODE;
const ELEMENT_NODE = constants.ELEMENT_NODE;
const INVALID_NODE = constants.INVALID_NODE;
const TEXT_NODE = constants.TEXT_NODE;

const TOPLEVEL = 1;

const utils = require("./utils");
const invariant = utils.invariant;
const isSpecialTag = utils.isSpecialTag;

function driver(root) {

    invariant(
        root && root.ownerDocument && root.ownerDocument.createElement,
        "Please supply a valid root node"
    );

    const document = root.ownerDocument;

    function visit(tag, _, nodeType, path) {
        switch (nodeType) {
        case ELEMENT_NODE: {
            const node = document.createElement(tag);

            if (path.length === TOPLEVEL) {
                root.appendChild(node);
            }

            return function (children) {
                children.forEach(function (child) {
                    node.appendChild(child);
                });
                return node;
            };
        }
        case TEXT_NODE: {
            const node = document.createTextNode(tag);
            if (path.length === TOPLEVEL) {
                root.appendChild(node);
            }

            return node;
        }
        }
    }

    return {
        isSpecialTag,
        visit,
    };
}

// eslint-disable-next-line immutable/no-mutation
driver.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = driver;
