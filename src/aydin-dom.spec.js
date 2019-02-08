const pkg = require("../package.json");

const Aydin = require("./aydin");
const AydinDom = require("./aydin-dom");

const { tracable } = require("./testUtils");

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const range = (count, step = 1) => {
    const result = [];
    // eslint-disable-next-line immutable/no-let
    let i = 0;
    while (i < count) {
        result.push(i * step);
        i += 1;
    }
    return result;
};

const makeRoot = () => {

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
                        return a < b ? -1 : a > b ? 1 : 0;
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
                ownerDocument,
            });
            return new Proxy(node, {
                get(target, key) {
                    if (nodeState.propertyNameLookup.has(key)) {
                        return nodeState.propertyValues.get(key);
                    }
                    return target[key];
                },
                has(_, key) {
                    return nodeState.propertyNameLookup.has(key);
                },
                set(_, key, value) {
                    nodeState.propertyNameLookup.add(key);
                    nodeState.propertyValues.set(key, value);
                },
            });
        },
        createTextNode: (textContent) => {
            const node = Object.freeze({
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
        get childNodes() {
            return rootState.childNodes;
        },
        get debug() {
            return JSON.stringify(rootState, null, "  ");
        },
        get innerHTML() {
            return walk(null, rootState.childNodes);
        },
        ownerDocument,
    };
};

const html = (items) => items.map((it) => it.trim()).join("");

describe("aydin-dom", () => {
    const { configureRenderer } = Aydin;
    const driver = AydinDom;
    const baseRender = configureRenderer();
    const render = (root, it) => baseRender(driver, it, root);
    const traceRender = (root, log, it) => {
        return baseRender(tracable(driver, log), it, root);
    };

    describe("the 'aydin-dom' driver", () => {

        it("should be a function with arity 2", () => {
            expect(typeof driver).toBe("function");
            expect(driver).toHaveLength(1);
        });

        it("should export the proper 'version' string matching the package version", () => {
            expect(driver.version).toBe(pkg.version);
        });

    });

    describe("DOM 'tagName' features", () => {

        it("should reject invalid characters by panicking", () => {
            expect(() => render(["ä"])).toThrow();
            expect(() => render(["/"])).toThrow();
            expect(() => render(["\\"])).toThrow();
        });

        it("should reject invalid characters by panicing", () => {
            expect(() => render(["ä"])).toThrow();
            expect(() => render(["/"])).toThrow();
            expect(() => render(["\\"])).toThrow();
        });

        it("should reject malformed tag names", () => {
            expect(() => render([".#"])).toThrow();
            expect(() => render(["-.#"])).toThrow();
            expect(() => render(["div.#"])).toThrow();
            expect(() => render(["div#."])).toThrow();
            expect(() => render(["div#.."])).toThrow();
            expect(() => render(["div#asdf."])).toThrow();
            expect(() => render(["div."])).toThrow();
            expect(() => render(["div.asdf#"])).toThrow();
            expect(() => render(["div.asdf-#-"])).toThrow();
        });

        it("should make sure that at most one '#' is accepted", () => {
            expect(() => render(["div#id1#id2"])).toThrow();
        });

        it("should panic if more than one id is supplied via tag and prop", () => {
            expect(() => render(["div#idx", { id: "idy" }])).toThrow();
        });

    });

    describe("simple examples", () => {

        it("should check that the given 'root' has an 'ownerDocument' property", () => {
            expect(() => render(null, [])).toThrow();
            expect(() => render({}, [])).toThrow();
            expect(() => render({ ownerDocument: {} }, [])).toThrow();
            expect(() => render({ ownerDocument: { createElement: 1 } }, ["div"]))
                .toThrow(TypeError);
            expect(() => render({ ownerDocument: { createElement: jest.fn() } }, []))
                .toThrow();
        });

        it("should check that the given 'expr' is valid", () => {
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } }
            )).toThrow();
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } },
                {}
            )).toThrow();
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } },
                () => {}
            )).toThrow();
        });

        it("should use 'ownerDocument' of the 'root'", () => {
            const minimalRoot = {
                appendChild: jest.fn(),
                ownerDocument: {
                    createElement: jest.fn(() => ({
                        appendChild: jest.fn(),
                    })),
                    createTextNode: jest.fn(),
                },
            };

            render(minimalRoot, ["div", "Hello, World!"]);

            expect(minimalRoot.ownerDocument.createElement).toHaveBeenCalled();
        });

    });

    describe("render using a minimal DOM document mock", () => {

        describe("simple examples rendering into an empty node", () => {

            it("should support rendering a plain string", () => {
                const root = makeRoot();

                render(root, "Simple String");

                expect(root.innerHTML).toBe(html([
                    "Simple String",
                ]));
            });

            it("should append a simple <div> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["div", "Hello, World!"]);
                expect(root.innerHTML).toBe(html([
                    "<div>",
                    "  Hello, World!",
                    "</div>",
                ]));
            });

            it("should append a simple <span> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["span", "Simple"]);
                expect(root.innerHTML).toBe(html([
                    "<span>",
                    "  Simple",
                    "</span>",
                ]));
            });

            it("should append a another <b> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["b", "Bold"]);
                expect(root.innerHTML).toBe(html([
                    "<b>",
                    "  Bold",
                    "</b>",
                ]));
            });

        });

        describe("rendering flat expressions", () => {

            it("should be able to render expressions with many text children", () => {
                const root = makeRoot();
                const labels = range(42).map((n) => `x${n}`);

                render(root, ["div", ...labels]);

                expect(root.innerHTML).toBe(html([
                    "<div>",
                    ...labels,
                    "</div>",
                ]));
            });

            it("should be able to render shallow trees of expressions", () => {
                const root = makeRoot();
                const log = [];

                traceRender(root, log,
                    ["div", "One", "Two", ["b", "Bold!"], "Four", "Five"]
                );

                expect(log).toEqual([
                    "0000: [0] ELEMENT_NODE <div>",
                    "0001: [0,0] TEXT_NODE 'One'",
                    "0002: [0,1] TEXT_NODE 'Two'",
                    "0003: [0,2] ELEMENT_NODE <b>",
                    "0004: [0,2,0] TEXT_NODE 'Bold!'",
                    "0005: [0,3] TEXT_NODE 'Four'",
                    "0006: [0,4] TEXT_NODE 'Five'",
                ]);

                expect(root.innerHTML).toBe(html([
                    "<div>",
                    "  One",
                    "  Two",
                    "  <b>Bold!</b>",
                    "  Four",
                    "  Five",
                    "</div>",
                ]));
            });

            it("should be able to render expressions with all kinds of children", () => {
                const root = makeRoot();

                render(root, ["div", ["b", "Bold!"], "Normal", ["i", "Italics!"]]);

                expect(root.innerHTML).toBe(html([
                    "<div>",
                    "  <b>Bold!</b>",
                    "  Normal",
                    "  <i>Italics!</i>",
                    "</div>",
                ]));
            });

        });

        it("should apply CSS classes", () => {
            const root = makeRoot();

            render(root, ["button", {
                class: {
                    "text-size-sm": 1,
                    // eslint-disable-next-line sort-keys
                    "btn-sm": 1,
                },
                classList: ["btn-default", "active"],
                className: "btn",
            }, "Click Me!"]);

            expect(root.innerHTML).toBe(html([
                "<button class=\"active btn btn-default btn-sm text-size-sm\">",
                "  Click Me!",
                "</button>",
            ]));
        });

        it("should apply an Emmett-style ID prop", () => {
            const root = makeRoot();

            render(root, ["div#some-id", "Bam!"]);

            expect(root.innerHTML).toBe(html([
                "<div id=\"some-id\">Bam!</div>"
            ]));
        });

        it("should apply a plain ID prop", () => {
            const root = makeRoot();

            render(root, ["div", { id: "some-id" }, "Bam!"]);

            expect(root.innerHTML).toBe(html([
                "<div id=\"some-id\">Bam!</div>"
            ]));
        });

        describe("'data-' properties", () => {

            it("should support plain 'data-id' property names", () => {
                const root = makeRoot();

                render(root, ["i", {
                    "data-id": "boring",
                }]);

                expect(root.innerHTML).toBe(html([
                    "<i data-id=\"boring\"></i>",
                ]));
            });

            it("should support a special 'data' prop for convenience", () => {
                const root = makeRoot();
                render(
                    root,
                    ["i", {
                        data: {
                            id: "interesting",
                            key: "whoohooo!",
                        },
                    }]
                );
                expect(root.innerHTML).toBe(html([
                    "<i data-id=\"interesting\" data-key=\"whoohooo!\"></i>",
                ]));
            });

            it("should sort the data properties", () => {
                const root = makeRoot();
                render(
                    root,
                    ["i", {
                        data: {
                            config: {
                                answer: 42,
                                some: "value",
                            },
                            key: "whoohooo!",
                            // eslint-disable-next-line sort-keys
                            id: "interesting",
                        },
                    }]
                );
                expect(root.innerHTML).toBe(html([
                    "<i data-config='{\"answer\":42,\"some\":\"value\"}' data-id=\"interesting\" data-key=\"whoohooo!\"></i>",
                ]));
            });

            it("should set properties other than event handlers", () => {
                const root = makeRoot();
                render(root, ["i", { "role": "button" }, "Buttonic!"]);
                expect(root.innerHTML).toBe(html([
                    "<i role=\"button\">Buttonic!</i>",
                ]));
            });

            it("should support boolean props", () => {
                const root = makeRoot();
                render(root, ["i", { disabled: true }, "Disabled!"]);
                expect(root.innerHTML).toBe(html([
                    "<i disabled>Disabled!</i>",
                ]));
            });

            it("should support a mix of 'data' and other props", () => {
                const root = makeRoot();
                // eslint-disable-next-line sort-keys
                render(root, ["i", { data: { key: "some-key"}, class: { "hello": 1 } }]);
                expect(root.innerHTML).toBe(html([
                    "<i class=\"hello\" data-key=\"some-key\"></i>",
                ]));
            });

        });

    });

});
