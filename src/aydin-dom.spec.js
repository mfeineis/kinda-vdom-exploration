const Aydin = require("./aydin");
const AydinDom = require("./aydin-dom");

const {
    DOMDRIVER_HANDLER_RETURNED_DATA,
} = require("./signals");
const {
    configureSink,
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
                    createTextNode: jest.fn(() => ({})),
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

                it("should signal upstream when a handler returns data", () => {
                    const root = makeRoot();
                    const onClick = jest.fn(() => ["DATA", "from handler"]);
                    const onMouseDown = jest.fn();
                    const props = { onClick, onMouseDown };

                    const spy = jest.fn();
                    const sink = configureSink(spy);

                    Aydin.render(sink(driver(root)), ["button", props]);
                    const button = root.childNodes[FIRST];

                    const [ev] = simulate("click", button);
                    expect(onClick.mock.calls[0][1]).toBe(ev);

                    const [ev2] = simulate("mousedown", button);
                    expect(onMouseDown.mock.calls[0][1]).toBe(ev2);

                    expect(spy.mock.calls).toEqual([
                        [DOMDRIVER_HANDLER_RETURNED_DATA, {
                            data: ["DATA", "from handler"],
                        }],
                    ]);
                });

            });

        });

        describe("subsequent renders of the same expression", () => {

            describe("without interference of the DOM from the outside", () => {

                it("should leave a simple text expression alone", () => {
                    const root = makeRoot();
                    const drive = driver(root);
                    const expr = "Hello, World!";

                    Aydin.render(drive, expr);
                    expect(root.childNodes).toHaveLength(1);
                    const textNode = root.childNodes[0];
                    expect(serialize(root)).toEqual(html([
                        "Hello, World!",
                    ]));

                    Aydin.render(drive, expr);
                    expect(root.childNodes).toHaveLength(1);
                    expect(textNode)
                        .toBe(root.childNodes[root.childNodes.length - 1]);

                    expect(serialize(root)).toEqual(html([
                        "Hello, World!",
                    ]));
                });

                it("should leave a single expression alone", () => {
                    const root = makeRoot();
                    const drive = driver(root);
                    const expr = ["i", "Hello, ", "World!"];

                    Aydin.render(drive, expr);
                    expect(root.childNodes).toHaveLength(1);
                    expect(root.childNodes[0].childNodes).toHaveLength(2);
                    const hello = root.childNodes[0].childNodes[0];
                    const world = root.childNodes[0].childNodes[1];
                    expect(serialize(root)).toEqual(html([
                        "<i>Hello, World!</i>",
                    ]));

                    Aydin.render(drive, expr);
                    expect(root.childNodes).toHaveLength(1);
                    expect(root.childNodes[0].childNodes).toHaveLength(2);
                    expect(hello)
                        .toBe(root.childNodes[0].childNodes[root.childNodes[0].childNodes.length - 2]);
                    expect(world)
                        .toBe(root.childNodes[0].childNodes[root.childNodes[0].childNodes.length - 1]);

                    expect(serialize(root)).toEqual(html([
                        "<i>Hello, World!</i>",
                    ]));
                });

                it("should leave a flat collection of expressions alone", () => {
                    const root = makeRoot();
                    const drive = driver(root);
                    const expr = ["x", "Hello, ", "World", ["i", "!"]];

                    Aydin.render(drive, expr);
                    expect(root.childNodes[0].childNodes).toHaveLength(3);
                    const hello = root.childNodes[0].childNodes[0];
                    const world = root.childNodes[0].childNodes[1];
                    const stuff = root.childNodes[0].childNodes[2];
                    expect(hello.textContent).toBe("Hello, ");
                    expect(world.textContent).toBe("World");
                    expect(stuff.childNodes).toHaveLength(1);
                    expect(serialize(root)).toEqual(html([
                        "<x>Hello, World<i>!</i></x>",
                    ]));

                    Aydin.render(drive, expr);
                    expect(root.childNodes[0].childNodes).toHaveLength(3);
                    expect(hello).toBe(root.childNodes[0].childNodes[0]);
                    expect(world).toBe(root.childNodes[0].childNodes[1]);
                    expect(stuff).toBe(root.childNodes[0].childNodes[2]);
                    expect(stuff.childNodes).toHaveLength(1);

                    expect(serialize(root)).toEqual(html([
                        "<x>Hello, World<i>!</i></x>",
                    ]));
                });

                it("should leave a tree of expressions alone", () => {
                    const root = makeRoot();
                    const drive = driver(root);
                    const expr = ["div", "One", ["ul", ["li", "Two"]]];

                    Aydin.render(drive, expr);
                    expect(root.childNodes).toHaveLength(1);
                    expect(root.childNodes[0].childNodes).toHaveLength(2);
                    const one = root.childNodes[0].childNodes[0];
                    const ul = root.childNodes[0].childNodes[1];
                    const li = ul.childNodes[0];
                    const two = li.childNodes[0];
                    expect(one.textContent).toBe("One");
                    expect(two.textContent).toBe("Two");
                    expect(ul.childNodes).toHaveLength(1);
                    expect(li.childNodes).toHaveLength(1);
                    expect(serialize(root)).toEqual(html([
                        "<div>",
                        "  One",
                        "  <ul>",
                        "    <li>Two</li>",
                        "  </ul>",
                        "</div>",
                    ]));

                    Aydin.render(drive, expr);
                    expect(root.childNodes).toHaveLength(1);
                    expect(root.childNodes[0].childNodes).toHaveLength(2);
                    expect(one).toBe(root.childNodes[0].childNodes[0]);
                    expect(ul).toBe(root.childNodes[0].childNodes[1]);
                    expect(ul.childNodes).toHaveLength(1);
                    expect(li).toBe(ul.childNodes[0]);
                    expect(li.childNodes).toHaveLength(1);
                    expect(two).toBe(li.childNodes[0]);

                    expect(serialize(root)).toEqual(html([
                        "<div>",
                        "  One",
                        "  <ul>",
                        "    <li>Two</li>",
                        "  </ul>",
                        "</div>",
                    ]));
                });

                it("should leave a forest of expressions alone", () => {
                    const root = makeRoot();
                    const drive = driver(root);
                    const expr = [
                        ["b", "One"],
                        "Two",
                        ["i", "Three", "Four"],
                    ];

                    Aydin.render(drive, expr);
                    expect(root.childNodes).toHaveLength(3);
                    const one = root.childNodes[0].childNodes[0];
                    const two = root.childNodes[1];
                    const three = root.childNodes[2].childNodes[0];
                    const four = root.childNodes[2].childNodes[1];
                    expect(one.textContent).toBe("One");
                    expect(two.textContent).toBe("Two");
                    expect(three.textContent).toBe("Three");
                    expect(four.textContent).toBe("Four");
                    expect(root.childNodes[0].childNodes).toHaveLength(1);
                    expect(root.childNodes[2].childNodes).toHaveLength(2);
                    expect(serialize(root)).toEqual(html([
                        "<b>One</b>",
                        "Two",
                        "<i>ThreeFour</i>",
                    ]));

                    Aydin.render(drive, expr);
                    expect(root.childNodes).toHaveLength(3);
                    expect(one).toBe(root.childNodes[0].childNodes[0]);
                    expect(two).toBe(root.childNodes[1]);
                    expect(three).toBe(root.childNodes[2].childNodes[0]);
                    expect(four).toBe(root.childNodes[2].childNodes[1]);
                    expect(root.childNodes[0].childNodes).toHaveLength(1);
                    expect(root.childNodes[2].childNodes).toHaveLength(2);

                    expect(serialize(root)).toEqual(html([
                        "<b>One</b>",
                        "Two",
                        "<i>ThreeFour</i>",
                    ]));
                });

            });

        });

        describe("tracking DOM node state between renders", () => {

            it("keep track of internal node state in a well known property on the node", () => {
                const root = makeRoot();
                const drive = driver(root);

                Aydin.render(drive, ["b", { x: "y" }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b x=\"y\">Bold!</b>",
                ]));

                expect(root.childNodes[0].__aydin_dom_state).toEqual({
                    handlers: {},
                    touched: {
                        x: 1,
                    },
                    touchedData: {},
                });
            });

        });

        describe("mutating existing expressions in simple cases", () => {

            it("should mutate a simple text node", () => {
                const root = makeRoot();
                const drive = driver(root);

                Aydin.render(drive, "Hello, World!");
                expect(serialize(root)).toEqual(html([
                    "Hello, World!",
                ]));

                Aydin.render(drive, "Hello, Universe!");
                expect(serialize(root)).toEqual(html([
                    "Hello, Universe!",
                ]));
            });

            it("should mutate a simple expression", () => {
                const root = makeRoot();
                const drive = driver(root);

                Aydin.render(drive, ["b", "Hello, World!"]);
                expect(serialize(root)).toEqual(html([
                    "<b>Hello, World!</b>",
                ]));

                Aydin.render(drive, ["b", "Hello, Universe!"]);
                expect(serialize(root)).toEqual(html([
                    "<b>Hello, Universe!</b>",
                ]));
            });

            it("should mutate simple props that are already there", () => {
                const root = makeRoot();
                const drive = driver(root);

                Aydin.render(drive, ["b", { x: "y" }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b x=\"y\">Bold!</b>",
                ]));

                Aydin.render(drive, ["b", { x: "z" }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b x=\"z\">Bold!</b>",
                ]));
            });

            it("should mutate, remove and add simple props", () => {
                const root = makeRoot();
                const drive = driver(root);

                Aydin.render(drive, ["b", { a: "b", x: "y" }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b a=\"b\" x=\"y\">Bold!</b>",
                ]));

                Aydin.render(drive, ["b", { x: "z", z: "a" }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b x=\"z\" z=\"a\">Bold!</b>",
                ]));

                Aydin.render(drive, ["b", "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b>Bold!</b>",
                ]));
            });

            it("should mutate, remove and add data props", () => {
                const root = makeRoot();
                const drive = driver(root);

                // eslint-disable-next-line sort-keys
                Aydin.render(drive, ["b", { data: { x: "y", a: "b" } }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b data-a=\"b\" data-x=\"y\">Bold!</b>",
                ]));

                Aydin.render(drive, ["b", { data: { x: "z", z: "a" } }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b data-x=\"z\" data-z=\"a\">Bold!</b>",
                ]));

                Aydin.render(drive, ["b", "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b>Bold!</b>",
                ]));
            });

            it("should mutate, remove and add CSS class related props", () => {
                const root = makeRoot();
                const drive = driver(root);

                Aydin.render(drive, ["b", { class: "c a" }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b class=\"a c\">Bold!</b>",
                ]));

                Aydin.render(drive, ["b", { class: ["a","b"] }, "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b class=\"a b\">Bold!</b>",
                ]));

                Aydin.render(drive, ["b", "Bold!"]);
                expect(serialize(root)).toEqual(html([
                    "<b>Bold!</b>",
                ]));
            });

        });

        describe("mutating existing expressions with handlers", () => {

            it("should leave an unchanged handler alone on subsequent renders", () => {
                const root = makeRoot();

                const spy = jest.fn();
                const sink = configureSink(spy);

                const drive = sink(driver(root));

                const onClick = jest.fn(() => ["DATA1"]);

                Aydin.render(drive, ["button", { onClick }]);
                const button = root.childNodes[FIRST];

                const [ev] = simulate("click", button);
                expect(onClick.mock.calls[0][1]).toBe(ev);

                Aydin.render(drive, ["button", { onClick }]);

                const [ev2] = simulate("click", button);
                expect(onClick.mock.calls[1][1]).toBe(ev2);

                expect(spy.mock.calls).toEqual([
                    [DOMDRIVER_HANDLER_RETURNED_DATA, {
                        data: ["DATA1"],
                    }],
                    [DOMDRIVER_HANDLER_RETURNED_DATA, {
                        data: ["DATA1"],
                    }],
                ]);
            });

            it("should replace a handler if it has changed", () => {
                const root = makeRoot();

                const spy = jest.fn();
                const sink = configureSink(spy);

                const drive = sink(driver(root));

                const onClick1 = jest.fn(() => ["DATA1"]);
                const onClick2 = jest.fn(() => ["DATA2"]);

                Aydin.render(drive, ["button", { onClick: onClick1 }]);
                const button = root.childNodes[FIRST];

                const [ev] = simulate("click", button);
                expect(onClick1.mock.calls[0][1]).toBe(ev);

                Aydin.render(drive, ["button", { onClick: onClick2 }]);

                const [ev2] = simulate("click", button);
                expect(onClick1.mock.calls).toHaveLength(1);
                expect(onClick2.mock.calls[0][1]).toBe(ev2);

                expect(spy.mock.calls).toEqual([
                    [DOMDRIVER_HANDLER_RETURNED_DATA, {
                        data: ["DATA1"],
                    }],
                    [DOMDRIVER_HANDLER_RETURNED_DATA, {
                        data: ["DATA2"],
                    }],
                ]);

                Aydin.render(drive, ["button"]);
                expect(simulate("click", button)).toHaveLength(0);

                expect(spy.mock.calls).toEqual([
                    [DOMDRIVER_HANDLER_RETURNED_DATA, {
                        data: ["DATA1"],
                    }],
                    [DOMDRIVER_HANDLER_RETURNED_DATA, {
                        data: ["DATA2"],
                    }],
                ]);
            });

        });

    });

});

