/* eslint-disable max-len, no-magic-numbers */

const pkg = require("../package.json");

const DomDom = require("./domdom");
const DomDomDom = require("./domdom-dom");

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

class InvariantViolation extends Error {}
const noop = () => {};

const makeTestUtils = (reportViolation = noop, checkEnv = noop) => {
    // eslint-disable-next-line no-console
    const trace = (...args) => console.log("[test:domdom]", ...args);
    return {
        checkEnvironment: checkEnv,
        invariant: (condition, message) => {
            if (!condition) {
                reportViolation(message);
                throw new InvariantViolation(message);
            }
        },
        trace,
    };
};

describe("domdom-dom", () => {
    const { configureRenderer } = DomDom;
    const utils = makeTestUtils();
    const driver = DomDomDom;
    const baseRender = configureRenderer(utils);
    const render = (root, it) => baseRender(driver, it, root);

    describe("the 'domdom-dom' driver", () => {

        it("should be a function with arity 3", () => {
            expect(typeof driver).toBe("function");
            expect(driver).toHaveLength(3);
        });

        it("should export the proper 'version' string matching the package version", () => {
            expect(driver.version).toBe(pkg.version);
        });

    });

    describe("simple examples", () => {

        it("should check that the given 'root' has an 'ownerDocument' property", () => {
            expect(() => render(null, [])).toThrow(InvariantViolation);
            expect(() => render({}, [])).toThrow(InvariantViolation);
            expect(() => render({ ownerDocument: {} }, []))
                .toThrow(InvariantViolation);
            expect(() => render({ ownerDocument: { createElement: 1 } }, ["div"]))
                .toThrow(TypeError);
            expect(() => render({ ownerDocument: { createElement: jest.fn() } }, []))
                .not.toThrow();
        });

        it("should check that the given 'expr' is valid", () => {
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } }
            )).toThrow(InvariantViolation);
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } },
                {}
            )).toThrow(InvariantViolation);
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } },
                "Boom!"
            )).toThrow(InvariantViolation);
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } },
                () => {}
            )).toThrow(InvariantViolation);
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

    const testSuite = (description, makeRoot) => {

        describe(description, () => {

            describe("simple examples rendering into an empty node", () => {

                const checkSimpleCase = (expr) => {
                    const [root, state] = makeRoot();

                    render(root, expr);

                    // Note: Having `nodeType` in there `jest` will identify
                    // Them as DOM nodes and try to check for `instanceof Element`
                    // Although we're in a node environment.
                    expect(state.createdNodes).toEqual([
                        {
                            appendChild: state.createdNodes[0].appendChild,
                            nodeName: expr[0],
                            //NodeType: ELEMENT_NODE,
                            ownerDocument: root.ownerDocument,
                        },
                        {
                            //NodeType: TEXT_NODE,
                            ownerDocument: root.ownerDocument,
                            textContent: expr[1],
                        },
                    ]);

                    expect(state.createdNodes).toHaveLength(2);
                    expect(state.createdNodes[0]).toBe(state.appendedNodes[1]);
                };

                it("should append a simple <div> into the given 'root'", () => {
                    checkSimpleCase(["div", "Hello, World!"]);
                });

                it("should append a simple <span> into the given 'root'", () => {
                    checkSimpleCase(["span", "Simple"]);
                });

                it("should append a another <b> into the given 'root'", () => {
                    checkSimpleCase(["b", "Bold"]);
                });

            });

        });

    };

    testSuite("render using a minimal DOM document mock", () => {
        const state = {
            appendedNodes: [],
            createdNodes: [],
        };
        const ownerDocument = Object.freeze({
            createElement: (nodeName) => {
                const node = Object.freeze({
                    appendChild: (child) => {
                        state.appendedNodes.push(child);
                    },
                    nodeName,
                    //NodeType: ELEMENT_NODE,
                    ownerDocument,
                });
                state.createdNodes.push(node);
                return node;
            },
            createTextNode: (textContent) => {
                const node = Object.freeze({
                    //NodeType: TEXT_NODE,
                    ownerDocument,
                    textContent,
                });
                state.createdNodes.push(node);
                return node;
            },
        });
        return [{
            appendChild: (node) => {
                state.appendedNodes.push(node);
            },
            ownerDocument,
        }, state];
    });

});
