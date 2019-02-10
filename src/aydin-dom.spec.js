const Aydin = require("./aydin");
const AydinDom = require("./aydin-dom");

const {
    html,
    makeRoot,
    serialize,
    simulate,
    tracable,
} = require("./testUtils");

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const FIRST = 0;

describe("aydin-dom", () => {
    const driver = AydinDom;
    const render = (root, it) => Aydin.render(driver(root), it);
    const traceRender = (root, log, it) => {
        return Aydin.render(tracable(driver(root), log), it);
    };

    describe("the 'aydin-dom' driver", () => {

        it("should be a function with arity 2", () => {
            expect(typeof driver).toBe("function");
            expect(driver).toHaveLength(1);
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
                /regex/
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

                expect(serialize(root)).toBe(html([
                    "Simple String",
                ]));
            });

            it("should append a simple <div> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["div", "Hello, World!"]);
                expect(serialize(root)).toBe(html([
                    "<div>",
                    "  Hello, World!",
                    "</div>",
                ]));
            });

            it("should append a simple <span> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["span", "Simple"]);
                expect(serialize(root)).toBe(html([
                    "<span>",
                    "  Simple",
                    "</span>",
                ]));
            });

            it("should append a another <b> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["b", "Bold"]);
                expect(serialize(root)).toBe(html([
                    "<b>",
                    "  Bold",
                    "</b>",
                ]));
            });

        });

        describe("rendering flat expressions", () => {

            it("should be able to render shallow trees of expressions", () => {
                const root = makeRoot();
                const log = [];

                traceRender(root, log,
                    ["div", "One", "Two", ["b", "Bold!"], "Four", "Five"]
                );

                expect(log).toEqual([
                    "0000: [0] ELEMENT_NODE(1) <div>",
                    "0001: [0,0] TEXT_NODE(3) 'One'",
                    "0002: [0,1] TEXT_NODE(3) 'Two'",
                    "0003: [0,2] ELEMENT_NODE(1) <b>",
                    "0004: [0,2,0] TEXT_NODE(3) 'Bold!'",
                    "0005: [0,3] TEXT_NODE(3) 'Four'",
                    "0006: [0,4] TEXT_NODE(3) 'Five'",
                ]);

                expect(serialize(root)).toBe(html([
                    "<div>",
                    "  One",
                    "  Two",
                    "  <b>Bold!</b>",
                    "  Four",
                    "  Five",
                    "</div>",
                ]));
            });

        });

        describe("user interactions with the DOM", () => {

            describe("simple event handler functions", () => {

                it("should attach simple handlers for 'on*' props", () => {
                    const root = makeRoot();
                    const onClick = jest.fn();
                    const onMouseDown = jest.fn();
                    const onMouseUp = jest.fn();

                    render(root, ["button", { onClick, onMouseDown, onMouseUp }]);
                    simulate("click", root.childNodes[FIRST]);
                    simulate("mouseup", root.childNodes[FIRST]);

                    expect(onClick).toHaveBeenCalled();
                    expect(onMouseDown).not.toHaveBeenCalled();
                });

                it("should hand props into the event handler", () => {
                    const root = makeRoot();
                    const onClick = jest.fn();
                    const props = { onClick };

                    render(root, ["button", props]);
                    simulate("click", root.childNodes[FIRST]);

                    expect(onClick.mock.calls[0][0]).toBe(props);
                });

                it("should hand the native event args as the second argument", () => {
                    const root = makeRoot();
                    const onClick = jest.fn();
                    const props = { onClick };

                    render(root, ["button", props]);
                    const button = root.childNodes[FIRST];
                    const [ev] = simulate("click", button);

                    expect(onClick.mock.calls[0][1]).toBe(ev);
                });

                it("should try to signal upstream when it can't handle an event and not die", () => {
                    const root = makeRoot();
                    const props = { onClick: ["MSG"] };

                    expect(() => {
                        render(root, ["button", props]);
                        const button = root.childNodes[FIRST];
                        const evts = simulate("click", button);

                        expect(evts).toHaveLength(1);
                    }).not.toThrow();
                });

            });

        });

    });

});

