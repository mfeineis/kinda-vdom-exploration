const pkg = require("../package.json");

const Aydin = require("./aydin");
const AydinDom = require("./aydin-dom");

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
            return [
                `<${self.nodeName}>`,
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
            };
            const node = Object.freeze({
                appendChild: (child) => {
                    nodeState.childNodes.push(child);
                },
                get childNodes() {
                    return nodeState.childNodes;
                },
                nodeName,
                ownerDocument,
            });
            return node;
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

            /*
            It("should be able to render expressions with all kinds of children", () => {
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
            */

        });

    });

});
