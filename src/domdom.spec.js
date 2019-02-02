/* global Promise */
/* eslint-disable max-len, no-magic-numbers */

const pkg = require("../package.json");
const validateHtml = require("html5-validator");

const DomDom = require("./domdom");
const DomDomDomServer = require("./domdom-dom-server");

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

const describeUtils = (description, utils, next = () => {}) => {
    describe(description, () => {
        const { checkEnvironment, invariant, trace } = utils;

        it("should have a 'checkEnvironment' function", () => {
            expect(checkEnvironment).toBeInstanceOf(Function);
        });

        it("should have an 'invariant' function", () => {
            expect(invariant).toBeInstanceOf(Function);
            expect(() => invariant(false, "Boom!")).toThrow();
            expect(() => invariant(true, "Shiny!")).not.toThrow();
        });

        it("should have a 'trace' function", () => {
            expect(trace).toBeInstanceOf(Function);
        });

        next(utils);
    });
};

describe("domdom", () => {

    it("should export something", () => {
        expect(DomDom).toBeDefined();
    });

    describe("the development utilities in use", () => {

        it("should not have a 'document' while testing", () => {
            expect(typeof document).toBe("undefined");
        });

        describeUtils(
            "the exported but unpublished 'utils'",
            DomDom._,
            ({ checkEnvironment, invariant, trace }) => {
                it("should use 'checkEnvironment' on the runtime env", () => {
                    expect(() => checkEnvironment(invariant)).not.toThrow();
                    expect(() => checkEnvironment(invariant, {})).toThrow();
                    expect(() => checkEnvironment(invariant, { prototype: {} })).toThrow();
                    expect(() => checkEnvironment(invariant, undefined, {})).toThrow();
                });
                it("should provide a 'trace' function", () => {
                    expect(() => trace()).not.toThrow();
                });
            }
        );
        describeUtils("the test utils", makeTestUtils());

        const reportViolation = jest.fn();
        describeUtils(
            "the test utils tracing invariant violations",
            makeTestUtils(reportViolation),
            (utils) => it("should have called the invariant reporter", () => {
                try {
                    utils.invariant(false, "OMG");
                } catch (_) {
                    // Intentionally left blank
                } finally {
                    expect(reportViolation.mock.calls[0][0]).toBe("OMG");
                }
            })
        );

    });

    it("should export the proper 'version' string matching the package version", () => {
        expect(DomDom.version).toBe(pkg.version);
    });

    describe("the main exported 'render' function", () => {

        it("should actually be a function with an arity of 2", () => {
            expect(typeof DomDom.render).toBe("function");
            expect(DomDom.render).toHaveLength(2);
        });

    });

    describe("the 'configureRenderer' factory", () => {
        const utils = makeTestUtils();
        const { configureRenderer } = DomDom;

        it("should be a function", () => {
            expect(configureRenderer).toBeInstanceOf(Function);
        });

        it("should use the internal 'utils' if not provided", () => {
            expect(() => configureRenderer(null)).not.toThrow();
        });

        it("should check the current environment for compatibility", () => {
            const checkEnv = jest.fn();
            const customUtils = makeTestUtils(undefined, checkEnv);

            configureRenderer(customUtils);

            expect(checkEnv.mock.calls[0][0]).toBe(customUtils.invariant);
        });

        it("should return a 'render' function", () => {
            const render = configureRenderer(utils, {});

            expect(render).toBeInstanceOf(Function);
            expect(render.name).toBe("render");
        });

        describe("a configured 'render' function", () => {

            it("should check the given 'driver' and 'root'", () => {
                const report = jest.fn();
                const tracingUtils = makeTestUtils(report);
                const render = configureRenderer(tracingUtils);

                expect(() => render()).toThrow(InvariantViolation);
                expect(report.mock.calls[0][0])
                    .toBe("Please provide a valid 'driver' into 'render'");

                expect(() => render(DomDomDomServer))
                    .toThrow(InvariantViolation);
                expect(report.mock.calls[1][0])
                    .toBe("Please provide a valid root element");
            });

            it("should use the given 'driver' to transform the input", () => {
                const identityDriver = (_, root) => root;

                const render = configureRenderer(utils);

                expect(render(identityDriver, ["div", "Hello, World!"]))
                    .toEqual(["div", "Hello, World!"]);
            });

        });

    });

});

describe("domdom-dom-server", () => {
    const { configureRenderer } = DomDom;
    const utils = makeTestUtils();
    const driver = DomDomDomServer;
    const baseRender = configureRenderer(utils);
    const render = (it) => baseRender(driver, it);

    describe("the 'domdom-dom-server' driver", () => {

        it("should be a function with arity 2", () => {
            expect(typeof driver).toBe("function");
            expect(driver).toHaveLength(2);
        });

        it("should export the proper 'version' string matching the package version", () => {
            expect(driver.version).toBe(pkg.version);
        });

    });

    describe("rendering easy static examples", () => {

        it("should render the simplest helloworld", () => {
            expect(render( "Hello, World!"))
                .toEqual("Hello, World!");
        });

        it("should render a static helloworld", () => {
            expect(render(["div", "Hello, World!"]))
                .toEqual("<div>Hello, World!</div>");
        });

        it("should render a static hellouniverse", () => {
            expect(render(["div", "Hello, Universe!"]))
                .toEqual("<div>Hello, Universe!</div>");
        });

        it("should render a static hellomultiverse", () => {
            expect(render(["span", "Hello, Multiverse!"]))
                .toEqual("<span>Hello, Multiverse!</span>");
            expect(render(["h1", "Hello, Multiverse!"]))
                .toEqual("<h1>Hello, Multiverse!</h1>");
        });

    });

    describe("'tagName' features", () => {

        it("should support valid plain strings", () => {
            expect(render(["i"])).toBe("<i></i>");
            expect(render(["div"])).toBe("<div></div>");
            expect(render(["script"])).toBe("<script></script>");
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

        it("should support adding an id via '#' emmet like syntax", () => {
            expect(render(["div#some-id"])).toBe("<div id=\"some-id\"></div>");
        });

        it("should make sure that at most one '#' is accepted", () => {
            expect(() => render(["div#id1#id2"])).toThrow();
        });

        it("should panic if more than one id is supplied via tag and prop", () => {
            expect(() => render(["div#idx", { id: "idy" }])).toThrow();
        });

        it("should support adding CSS classes via '.' emmet like syntax", () => {
            expect(render(["div.some-class.another"]))
                .toBe("<div class=\"another some-class\"></div>");
        });

        it("should support a combination of '#' and '.' emmet like syntax", () => {
            expect(render(["div#idx.some-class.another"]))
                .toBe("<div class=\"another some-class\" id=\"idx\"></div>");
            expect(render(["div#a.X.Y", {
                class: "Z",
                classList: ["N", "O"],
                className: "M",
            }])).toBe(
                "<div class=\"M N O X Y Z\" id=\"a\"></div>"
            );
        });

        it("should de-duplicate CSS class names", () => {
            expect(render(["div.X.X"])).toBe("<div class=\"X\"></div>");
        });

    });

    describe("handling props", () => {

        it("should only enumerate own properties", () => {
            const obj = Object.create({ enumerateMe: false });
            expect(render(["i", obj])).toBe("<i></i>");
        });

        it("should degrade gracefully if invalid props are supplied", () => {
            expect(render(["i", /rx/])).toBe("<i></i>");
            expect(render(["i", null, /rx/])).toBe("<i></i>");
        });

        it("should degrade gracefully if invalid props and children are supplied", () => {
            expect(render(["i", /rx1/, /rx2/])).toBe("<i></i>");
        });

        it("should support providing props to elements", () => {
            expect(render(["i", { class: "a b" }, "Maybe some icon!"]))
                .toBe("<i class=\"a b\">Maybe some icon!</i>");
        });

        it("should ensure that props are sorted alphabetically", () => {
            // eslint-disable-next-line sort-keys
            expect(render(["i", { type: "b", class: "a" }]))
                .toBe("<i class=\"a\" type=\"b\"></i>");
        });

        it("should ensure that empty props do not add unnecessary whitespace", () => {
            expect(render(["br", {}])).toBe("<br/>");
            expect(render(["i", {}])).toBe("<i></i>");
            expect(render([["i", {}], ["b", {}]])).toBe("<i></i><b></b>");
        });

        it("should serialize object props using JSON", () => {
            expect(render(["i", { aang: "Avatar" }, "the Last Airbender"]))
                .toBe("<i aang=\"Avatar\">the Last Airbender</i>");
            expect(render(["i", { teamAvatar: ["Aang", "Katara", "Soka"] }]))
                .toBe("<i teamAvatar='[\"Aang\",\"Katara\",\"Soka\"]'></i>");
            expect(render(["i", { a: { b: { c: "d" } } }]))
                .toBe("<i a='{\"b\":{\"c\":\"d\"}}'></i>");
        });

        describe("handling special props", () => {

            describe("'class', 'className' and 'classList'", () => {

                it("should support strings for 'class' and 'className' props", () => {
                    expect(render(["i", { class: "a b c" }]))
                        .toBe("<i class=\"a b c\"></i>");
                    expect(render(["i", { className: "a b c" }]))
                        .toBe("<i class=\"a b c\"></i>");
                });

                it("should support a map for 'class' prop where keys with truthy values become classes", () => {
                    expect(render(["i", { class: { a: false, b: true, c: 0 } }]))
                        .toBe("<i class=\"b\"></i>");
                });

                it("should support list of strings for 'classList' prop", () => {
                    expect(render(["i", { classList: ["a", "b", "c"] }]))
                        .toBe("<i class=\"a b c\"></i>");
                });

                it("should sort CSS classes alphabetically for stable renders", () => {
                    expect(render(["i", { class: "b a c" }]))
                        .toBe("<i class=\"a b c\"></i>");
                    expect(render(["i", { className: "b a c" }]))
                        .toBe("<i class=\"a b c\"></i>");
                    expect(render(["i", { classList: ["b", "a", "c"] }]))
                        .toBe("<i class=\"a b c\"></i>");
                });

                it("should omit empty an 'classList'", () => {
                    expect(render(["i", { classList: [] }])).toBe("<i></i>");
                });

            });

            describe("should merge Emmet, 'class', 'className' and 'classList'", () => {
                expect(render(["i#a.z.y", {
                    class: "M N",
                    classList: ["O", "Q"],
                    className: "P",
                }])).toBe("<i class=\"M N O P Q y z\" id=\"a\"></i>");
            });

            describe("'data-' properties", () => {

                it("should support plain 'data-id' property names", () => {
                    expect(render(["i", { "data-id": "boring" }]))
                        .toBe("<i data-id=\"boring\"></i>");
                });

                it("should support a special 'data' prop for convenience", () => {
                    expect(render(
                        ["i", {
                            data: {
                                id: "interesting",
                                key: "whoohooo!",
                            },
                        }]
                    )).toBe("<i data-id=\"interesting\" data-key=\"whoohooo!\"></i>");
                    expect(render(
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
                    )).toBe("<i data-config='{\"answer\":42,\"some\":\"value\"}' data-id=\"interesting\" data-key=\"whoohooo!\"></i>");
                });

            });

            it("should skip serializing 'on*' callback props", () => {
                expect(render(["button", { onClick: () => {} }]))
                    .toBe("<button></button>");
                expect(render(["button", { onMouseUp: () => {} }]))
                    .toBe("<button></button>");
            });

        });

    });

    describe("handling simple edge cases", () => {

        it("should not treat <!DOCTYPE ...> definitions as normal nodes", () => {
            expect(render(["!DOCTYPE html"])).toBe("<!DOCTYPE html>");
        });

        it("should not be fine with trying to render nothing", () => {
            expect(() => render([])).toThrow();
            expect(() => render([[]])).toThrow();
            expect(() => render([[[]]])).toThrow();
        });

        it("should output elements without content", () => {
            expect(render(["div"])).toBe("<div></div>");
            expect(render(["div", null])).toBe("<div></div>");
            expect(render(["div", false])).toBe("<div></div>");
            expect(render(["div", false, null])).toBe("<div></div>");
            expect(render(["div", null, false])).toBe("<div></div>");
        });

        it("should be ok with a leading empty string indicating a collection instead of an element", () => {
            expect(render(["", "Some text"])).toBe("Some text");
        });

        it("should panic if no 'tagName' is given", () => {
            expect(() => render([null, "Some text"])).toThrow();
        });

    });

    describe("handling self-closing tags", () => {
        // See https://www.w3.org/TR/html5/syntax.html#void-elements
        const voidElements = "area base br col embed hr img input link meta param source track wbr".split(" ");

        it("should recognize tags that need to be self-closing and render them accordingly", () => {
            voidElements.forEach((it) => {
                expect(render([it])).toBe(`<${it}/>`);
            });
        });

        it("should apply props but ignore content", () => {
            voidElements.forEach((it) => {
                expect(render([it, { class: "a b c" }, "Evil content"]))
                    .toBe(`<${it} class="a b c"/>`);
            });
        });

    });

    describe("rendering complex structures", () => {

        it("should support rendering flat collections of nodes", () => {
            const generated = render([
                ["b#important"],
                ["h1.highlighted", "Heading"],
                ["p.y.x", "Some Content"],
            ]);

            expect(generated).toBe([
                "<b id=\"important\"></b>",
                "<h1 class=\"highlighted\">Heading</h1>",
                "<p class=\"x y\">Some Content</p>",
            ].join(""));
        });

        it("should support rendering trees of nodes", async () => {
            const generated = render([
                ["!DOCTYPE html"],
                ["html", { lang: "en" },
                    ["head", ["title", "Testtitle"]],
                    ["body",
                        ["div#main.section.padding-top-5",
                            ["h1", "A Heading"],
                            ["div",
                                "Some inline text",
                                ["b", "with bold text"],
                                "and",
                                ["i", "also italic stuff"],
                                ["ol",
                                    ["li.--active", "Point 1"],
                                    ["li", "Point 2"],
                                    ["li", "Point 3"],
                                ],
                            ],
                            ["p", "Second paragraph"],
                        ],
                    ],
                ],
            ]);

            const expected = [
                "<!DOCTYPE html>",
                "<html lang=\"en\">",
                "<head><title>Testtitle</title></head>",
                "<body>",
                "  <div class=\"padding-top-5 section\" id=\"main\">",
                "    <h1>A Heading</h1>",
                "    <div>",
                "      Some inline text",
                "      <b>with bold text</b>",
                "      and",
                "      <i>also italic stuff</i>",
                "      <ol>",
                "        <li class=\"--active\">Point 1</li>",
                "        <li>Point 2</li>",
                "        <li>Point 3</li>",
                "      </ol>",
                "    </div>",
                "    <p>Second paragraph</p>",
                "  </div>",
                "</body>",
                "</html>",
            ].map((it) => it.trim()).join("");

            expect(generated).toBe(expected);

            await Promise.all([
                validateHtml(generated),
                validateHtml(expected),
            ]).then(([inResults, outResults]) => {
                const inOk = inResults.messages.length === 0;
                const outOk = outResults.messages.length === 0;

                expect(inOk && outOk).toBe(true);
            }).catch((error) => {
                expect("Markup to be valid").toBe(error);
            });
        });

    });

    describe("using code templates", () => {

        it("should support functions acting as templates simple templates", () => {

            function tmpl(props, children) {
                expect(typeof props).toBe("object");
                expect(children).toEqual(["Text1", "Text2"]);

                const { items } = props;
                expect(items).toEqual(["a", "b"]);

                return [
                    ["ul",
                        ...items.map((id) => ["li", {
                            data: { id },
                        }, id]),
                    ],
                    ...children,
                ];
            }

            expect(render([tmpl, { items: ["a", "b"] }, "Text1", "Text2"]))
                .toBe("<ul><li data-id=\"a\">a</li><li data-id=\"b\">b</li></ul>Text1Text2");
        });

    });

});

