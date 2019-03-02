const utils = require("./utils");

const DOCUMENT_TYPE_NODE = utils.DOCUMENT_TYPE_NODE;
const ELEMENT_NODE = utils.ELEMENT_NODE;
const INVALID_NODE = utils.INVALID_NODE;
const TEXT_NODE = utils.TEXT_NODE;

const signals = require("./signals");
const DOMDRIVER_MISSING_HANDLER = signals.DOMDRIVER_MISSING_HANDLER;
const DOMDRIVER_HANDLER_RETURNED_DATA = signals.DOMDRIVER_HANDLER_RETURNED_DATA;

const dropLast = utils.dropLast;
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

        function reduce(children, path) {
            const parent = find(root, dropLast(path));

            children.forEach(function (child, i) {
                const existing = find(parent, [i]);
                if (!existing) {
                    parent.appendChild(child);
                }
            });
        }

        function attachHandler(node, state, props, key, value) {
            const evt = key.toLocaleLowerCase().replace(/^on/, "");
            const handler = function (ev) {
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
            };
            node.addEventListener(evt, handler);
            // eslint-disable-next-line immutable/no-mutation
            state.handlers[evt] = {
                dispose: function () {
                    node.removeEventListener(evt, handler);
                },
                handler: value,
            };
        }

        function visit(tag, props, nodeType, path) {
            if (nodeType === INVALID_NODE) {
                // TODO: Should we really panic on invalid tag names?
                throw new Error("Invalid tag name \"" + tag + "\"");
            }

            switch (nodeType) {
            case ELEMENT_NODE: {
                const existing = find(root, path);
                if (existing && existing.nodeType === ELEMENT_NODE) {
                    /* eslint-disable immutable/no-mutation */
                    if (existing.className && !props.classList) {
                        existing.className = "";
                    }

                    const existingState = existing.__aydin_dom_state;
                    Object.keys(existing.dataset).forEach(function (name) {
                        existing.dataset[name] = undefined;
                        delete existingState.touchedData[name];
                    });

                    Object.keys(existingState.touched).forEach(function (key) {
                        if (!props[key]) {
                            existing[key] = undefined;
                            delete existingState.touched[key];
                        }
                    });

                    Object.keys(existingState.handlers).forEach(function (key) {
                        const value = existingState.handlers[key];
                        if (!props[key]) {
                            value.dispose();
                            delete existingState.handlers[key];
                            return;
                        }
                        if (value.handler !== props[key]) {
                            value.dispose();
                            delete existingState.handlers[key];
                            return;
                        }
                    });

                    Object.keys(props).forEach(function (key) {
                        const value = props[key];

                        if (/^on/.test(key)) {
                            attachHandler(
                                existing,
                                existingState,
                                props,
                                key,
                                value
                            );
                            return;
                        }

                        switch (key) {
                        case "classList": {
                            // Not using `classList` property because IE11
                            // doesn't support it for SVG elements
                            existing.className = value.join(" ");
                            break;
                        }
                        case "data":
                            Object.keys(value).forEach(function (name) {
                                existing.dataset[name] = value[name];
                                existingState.touchedData[name] = 1;
                            });
                            break;
                        default:
                            existing[key] = value;
                            existingState.touched[key] = 1;
                            break;
                        }
                    });

                    /* eslint-enable immutable/no-mutation */
                    return function () {
                        return existing;
                    };
                }

                const node = document.createElement(tag);
                const state = {
                    handlers: {},
                    touched: {},
                    touchedData: {},
                };

                Object.keys(props).forEach(function (key) {
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
                        Object.keys(value).forEach(function (name) {
                            node.dataset[name] = value[name];
                            state.touchedData[name] = 1;
                        });
                        break;
                    default:
                        node[key] = value;
                        state.touched[key] = 1;
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
