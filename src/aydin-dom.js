const utils = require("./utils");

const DOCUMENT_TYPE_NODE = utils.DOCUMENT_TYPE_NODE;
const ELEMENT_NODE = utils.ELEMENT_NODE;
const INVALID_NODE = utils.INVALID_NODE;
const TEXT_NODE = utils.TEXT_NODE;

const signals = require("./signals");
const DOMDRIVER_MISSING_HANDLER = signals.DOMDRIVER_MISSING_HANDLER;

const invariant = utils.invariant;
const isFunction = utils.isFunction;
const isSpecialTag = utils.isSpecialTag;

const TOPLEVEL = 1;

function driver(root) {

    invariant(
        root && root.ownerDocument && root.ownerDocument.createElement,
        "Please supply a valid root node"
    );

    const document = root.ownerDocument;

    return function dom(signal) {

        function reduce(children) {
            children.forEach(function (child) {
                root.appendChild(child);
            });
        }

        function visit(tag, props, nodeType, path) {
            if (nodeType === INVALID_NODE) {
                // TODO: Should we really panic on invalid tag names?
                throw new Error("Invalid tag name \"" + tag + "\"");
            }

            switch (nodeType) {
            case ELEMENT_NODE: {
                const node = document.createElement(tag);

                Object.keys(props).forEach(function (key) {
                    const value = props[key];

                    if (/^on/.test(key)) {
                        const evt = key.toLocaleLowerCase().replace(/^on/, "");
                        node.addEventListener(evt, function (ev) {
                            if (isFunction(value)) {
                                value(props, ev);
                                return;
                            }
                            signal({
                                data: {
                                    value: value,
                                },
                                topic: DOMDRIVER_MISSING_HANDLER,
                            });
                        });
                        return;
                    }

                    /* eslint-disable immutable/no-mutation */
                    switch (key) {
                    case "classList":
                        if (value.length) {
                            // Not using `classList` property because IE11
                            // doesn't support it for SVG elements
                            node.className = value.join(" ");
                        }
                        break;
                    case "data":
                        Object.keys(value).forEach(function (name) {
                            node.dataset[name] = value[name];
                        });
                        break;
                    default:
                        node[key] = value;
                        break;
                    }
                    /* eslint-enable immutable/no-mutation */
                });

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
            isSpecialTag: isSpecialTag,
            reduce: reduce,
            visit: visit,
        };
    };
}

// eslint-disable-next-line immutable/no-mutation
driver.version = "0.1.0";

// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = driver;
