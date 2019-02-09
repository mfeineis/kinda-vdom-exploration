const constants = require("./constants");
const ELEMENT_NODE = constants.ELEMENT_NODE;
const TEXT_NODE = constants.TEXT_NODE;

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
                propertyNameLookup: new Set(),
                propertyValues: new Map(),
            };
            const node = Object.freeze({
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
        appendChild: (node) => {
            rootState.childNodes.push(node);
        },
        get innerHTML() {
            return walk(null, rootState.childNodes);
        },
        ownerDocument,
    };
}

function html(items) {
    return items.map((it) => it.trim()).join("");
}

/* eslint-disable immutable/no-mutation */
exports.html = html;
exports.identityDriver = identityDriver;
exports.makeRoot = makeRoot;
exports.range = range;
exports.tracable = tracable;
/* eslint-enable immutable/no-mutation */
