const utils = require("./utils");

const COLLECTION_END = utils.COLLECTION_END;
const DOCUMENT_TYPE_NODE = utils.DOCUMENT_TYPE_NODE;
const ELEMENT_NODE = utils.ELEMENT_NODE;
const INVALID_NODE = utils.INVALID_NODE;
const TEXT_NODE = utils.TEXT_NODE;

const signals = require("./signals");
const DOMDRIVER_MISSING_HANDLER = signals.DOMDRIVER_MISSING_HANDLER;
const DOMDRIVER_HANDLER_RETURNED_DATA = signals.DOMDRIVER_HANDLER_RETURNED_DATA;

const invariant = utils.invariant;
const isFunction = utils.isFunction;
const isSpecialTag = utils.isSpecialTag;

const TOUCHED = 1;

/**
 * @example
 *     nodeNameEquals("div", "DIV") // => true
 *     nodeNameEquals("DiV", "dIv") // => true
 */
function nodeNameEquals(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}

function forEachKey(it, fn) {
    return Object.keys(it).forEach(fn);
}

const TOPLEVEL = 1;

function driver(root) {

    invariant(
        root && root.ownerDocument && root.ownerDocument.createElement,
        "Please supply a valid root node"
    );

    const document = root.ownerDocument;

    return function dom(notify) {

        function find(parent, path) {
            /* eslint-disable immutable/no-let, no-magic-numbers */
            //console.log("find", parent, path);
            let node = parent;
            let i = 0;

            while (node && node.childNodes && i < path.length) {
                node = node.childNodes[path[i]];
                i += 1;
            }

            return node;
            /* eslint-enable immutable/no-let, no-magic-numbers */
        }

        function reduce() {
        }

        function attachHandler(node, state, props, key, value) {
            const evt = key.toLocaleLowerCase().replace(/^on/, "");
            function handler(ev) {
                if (isFunction(value)) {
                    const data = value(props, ev);
                    if (data) {
                        notify(DOMDRIVER_HANDLER_RETURNED_DATA, {
                            data: data,
                        });
                    }
                    return;
                }
                notify(DOMDRIVER_MISSING_HANDLER, {
                    value: value,
                });
            }
            node.addEventListener(evt, handler);
            // eslint-disable-next-line immutable/no-mutation
            state.handlers[key] = {
                dispose: function () {
                    node.removeEventListener(evt, handler);
                },
                handler: value,
            };
        }

        function patchNode(node, props, path) {
            //console.log("patchNode", node.nodeName, node.__aydin_dom_state);
            /* eslint-disable immutable/no-mutation */
            if (node.className && !props.classList) {
                node.className = "";
            }

            const state = node.__aydin_dom_state;
            state.path = path;

            forEachKey(node.dataset, function (name) {
                node.dataset[name] = undefined;
                delete state.touchedData[name];
            });

            forEachKey(state.touched, function (key) {
                if (!props[key]) {
                    node[key] = undefined;
                    delete state.touched[key];
                }
            });

            forEachKey(state.handlers, function (key) {
                const value = state.handlers[key];
                if (!props[key]) {
                    value.dispose();
                    delete state.handlers[key];
                    return;
                }
                if (value.handler !== props[key]) {
                    value.dispose();
                    delete state.handlers[key];
                    return;
                }
            });

            forEachKey(props, function (key) {
                const value = props[key];

                const hasThisHandler = key in state.handlers;
                if (/^on/.test(key) && !hasThisHandler) {
                    attachHandler(node, state, props, key, value);
                    return;
                }

                switch (key) {
                case "classList": {
                    // Not using `classList` property because IE11
                    // doesn't support it for SVG elements
                    node.className = value.join(" ");
                    break;
                }
                case "data":
                    forEachKey(value, function (name) {
                        node.dataset[name] = value[name];
                        state.touchedData[name] = TOUCHED;
                    });
                    break;
                default:
                    node[key] = value;
                    state.touched[key] = TOUCHED;
                    break;
                }
            });
            /* eslint-enable immutable/no-mutation */
        }

        function removeNode(node) {
            //console.warn("removeNode", node.nodeName);
            node.parentNode.removeChild(node);
        }

        function visit(tag, props, nodeType, path) {
            if (nodeType === INVALID_NODE) {
                // TODO: Should we really panic on invalid tag names?
                throw new Error("Invalid tag name \"" + tag + "\"");
            }

            switch (nodeType) {
            case ELEMENT_NODE: {
                /* eslint-disable immutable/no-let */
                let existing = find(root, path);
                let check = Boolean(existing);
                /* eslint-enable immutable/no-let */

                while (check) {
                    check = false;
                    if (existing && existing.nodeName) {
                        if (!nodeNameEquals(tag, existing.nodeName)) {
                            //console.warn("dom.visit existing",
                            //tag, "!==", existing.nodeName);
                            //console.warn("> DOM:", existing.
                            //__aydin_dom_state.path, "expr:", path);
                            removeNode(existing);

                            const next = find(root, path);
                            //console.log("> next node", next && next.nodeName);
                            existing = next;
                            check = true;
                            continue;
                        }
                    }
                }
                if (existing && existing.nodeType === ELEMENT_NODE) {
                    patchNode(existing, props, path);
                    return function () {
                        return existing;
                    };
                }

                const node = document.createElement(tag);
                const state = {
                    handlers: {},
                    path: path,
                    touched: {},
                    touchedData: {},
                };

                forEachKey(props, function (key) {
                    const value = props[key];

                    if (/^on/.test(key)) {
                        attachHandler(node, state, props, key, value);
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
                        forEachKey(value, function (name) {
                            node.dataset[name] = value[name];
                            state.touchedData[name] = TOUCHED;
                        });
                        break;
                    default:
                        node[key] = value;
                        state.touched[key] = TOUCHED;
                        break;
                    }
                    /* eslint-enable immutable/no-mutation */
                });

                // eslint-disable-next-line immutable/no-mutation
                node.__aydin_dom_state = state;

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
                const existing = find(root, path);
                //console.log("TEXT_NODE", "existing", existing);
                if (existing && existing.nodeType === TEXT_NODE) {
                    if (existing.textContent === tag) {
                        return existing;
                    } else {
                        // eslint-disable-next-line immutable/no-mutation
                        existing.textContent = tag;
                        return existing;
                    }
                }

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
