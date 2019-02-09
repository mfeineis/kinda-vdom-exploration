const utils = require("./utils");
const ELEMENT_NODE = utils.ELEMENT_NODE;
const TEXT_NODE = utils.TEXT_NODE;

const identityDriver = () => ({
    isSpecialTag: () => [false],
    visit: (expr, _, nodeType) => {
        switch (nodeType) {
        case 1:
            return (children) => [expr, ...children];
        case 3:
            return expr;
        }
    },
});

const tracable = (drive, trace) => (...args) => {
    const driver = drive(...args);
    return {
        isSpecialTag: (tag) => driver.isSpecialTag(tag),
        visit: (expr, props, nodeType, path) => {
            switch (nodeType) {
            case 1:
                trace.push(
                    `${String(trace.length).padStart(4, "0")}: [${path.join(",")}] ELEMENT_NODE(${nodeType}) <${expr}>`
                );
                break;
            case 3:
                trace.push(
                    `${String(trace.length).padStart(4, "0")}: [${path.join(",")}] TEXT_NODE(${nodeType}) '${expr}'`
                );
                break;
            }
            return driver.visit(expr, props, nodeType, path);
        },
    };
};

/**
 * @example
 *     range(5) // => [0, 1, 2, 3, 4]
 *     range(5, 2) // => [0, 2, 4, 6, 8]
 *     range(0) // => []
 */
function range(count, step = 1) {
    const result = [];
    // eslint-disable-next-line immutable/no-let
    let i = 0;
    while (i < count) {
        result.push(i * step);
        i += 1;
    }
    return result;
}

function makeRoot() {

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

    const walk = (self, nodes) => {
        if (typeof self === "string") {
            return self;
        }

        if (self && self.textContent) {
            return self.textContent;
        }

        const children = nodes.map((child) => {
            if (child && child.childNodes) {
                return walk(child, child.childNodes);
            }

            return walk(child, []);
        }).join("");

        if (self && self.nodeName) {
            const attrs = self._properties.map(([key, value]) => {
                if (typeof value === "boolean") {
                    if (value) {
                        return ` ${key}`;
                    }
                    return "";
                }
                if (typeof value === "string") {
                    return ` ${key}=${JSON.stringify(value)}`;
                }
                return ` ${key}='${JSON.stringify(value)}'`;
            }).join("");

            if (voidElementLookup[self.nodeName]) {
                return `<${self.nodeName}${attrs}/>`;
            }

            return [
                `<${self.nodeName}${attrs}>`,
                children,
                `</${self.nodeName}>`,
            ].join("");
        }

        return children;
    };

    const ownerDocument = Object.freeze({
        createElement: (nodeName) => {
            const nodeState = {
                childNodes: [],
                dataset: Object.create(null),
                listeners: [],
                propertyNameLookup: new Set(),
                propertyValues: new Map(),
            };
            const node = Object.freeze({
                get _listeners() {
                    return nodeState.listeners;
                },
                get _properties() {
                    const dataProps = [];
                    Object.keys(nodeState.dataset).forEach((key) => {
                        dataProps.push([`data-${key}`, nodeState.dataset[key]]);
                    });
                    const props = Array.from(nodeState.propertyNameLookup).map((key) => {
                        return [
                            key.replace(/^className$/, "class"),
                            nodeState.propertyValues.get(key),
                        ];
                    });
                    return dataProps.concat(props).sort(([a], [b]) => {
                        return a <= b ? -1 : 1;
                    });
                },
                addEventListener(name, fn) {
                    nodeState.listeners.push([name, fn]);
                },
                appendChild(child) {
                    nodeState.childNodes.push(child);
                },
                get childNodes() {
                    return nodeState.childNodes;
                },
                get dataset() {
                    return nodeState.dataset;
                },
                nodeName,
                nodeType: ELEMENT_NODE,
                ownerDocument,
            });
            return new Proxy(node, {
                set(_, key, value) {
                    nodeState.propertyNameLookup.add(key);
                    nodeState.propertyValues.set(key, value);
                },
            });
        },
        createTextNode: (textContent) => {
            const node = Object.freeze({
                nodeType: TEXT_NODE,
                ownerDocument,
                textContent,
            });
            return node;
        },
    });
    const rootState = {
        childNodes: [],
    };
    return {
        get _serializedHTML() {
            return walk(null, rootState.childNodes);
        },
        appendChild: (node) => {
            rootState.childNodes.push(node);
        },
        get childNodes() {
            return rootState.childNodes;
        },
        ownerDocument,
    };
}

/**
 * @example
 *     html(["<i>", "  text", "<b>bold</b> .  ", "</i>"])
 *     // => "<i>text<b>bold</b> .</i>"
 */
function html(items) {
    return items.map((it) => it.trim()).join("");
}

function serialize(root) {
    return root._serializedHTML;
}

function simulate(event, node) {
    const result = [];
    for (const [eventName, handler] of node._listeners) {
        if (event === eventName) {
            const args = {
                target: node,
            };
            result.push(args);
            handler(args);
        }
    }
    return result;
}

/* eslint-disable immutable/no-mutation */
exports.html = html;
exports.identityDriver = identityDriver;
exports.makeRoot = makeRoot;
exports.range = range;
exports.serialize = serialize;
exports.simulate = simulate;
exports.tracable = tracable;
/* eslint-enable immutable/no-mutation */
