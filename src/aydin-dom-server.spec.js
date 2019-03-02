const validateHtml = require("html5-validator");

const pkg = require("../package.json");

const Aydin = require("./aydin");
const AydinDom = require("./aydin-dom");
const AydinDomServer = require("./aydin-dom-server");

const {
    html,
    makeRoot,
    range,
    serialize,
} = require("./testUtils");

function delay(millis, value) {
    return new Promise((resolve) => setTimeout(resolve(value), 100));
}

describe("aydin-dom-server", () => {
    const driver = AydinDomServer;
    const render = (it) => Aydin.render(driver(), it);

    describe("the 'aydin-dom-server' driver", () => {

        it("should be a function with arity 0", () => {
            expect(typeof driver).toBe("function");
            expect(driver).toHaveLength(0);
        });

    });

    describe("handling special edge cases", () => {

        it("should not treat <!DOCTYPE ...> definitions as normal nodes", () => {
            expect(render(["!DOCTYPE html"])).toBe("<!DOCTYPE html>");
        });

        it("should ensure that empty props do not add unnecessary whitespace in flat collections", () => {
            expect(render([["i", {}], ["b", {}]])).toBe("<i></i><b></b>");
        });

    });

});

describe("The traits that both the DOM and DOMServer driver share", () => {

    cover("AydinDom", AydinDom, () => (it) => {
        const root = makeRoot();
        Aydin.render(AydinDom(root), it);
        return serialize(root);
    });

    cover("AydinDomServer", AydinDomServer, () => (it) => {
        return Aydin.render(AydinDomServer(), it);
    });

    function cover(prefix, driver, makeRender) {
        describe(`${prefix} supports the necessary common traits`, () => {

            describe("the driver", () => {

                it("should export the proper 'version' string matching the package version", () => {
                    expect(driver.version).toBe(pkg.version);
                });

            });

            describe("Invalid 'tagName's", () => {

                it("should reject invalid characters by panicking", () => {
                    const render = makeRender();
                    expect(() => render(["ä"])).toThrow();
                    expect(() => render(["/"])).toThrow();
                    expect(() => render(["\\"])).toThrow();
                });

                it("should reject invalid characters by panicing", () => {
                    const render = makeRender();
                    expect(() => render(["ä"])).toThrow();
                    expect(() => render(["/"])).toThrow();
                    expect(() => render(["\\"])).toThrow();
                });

                it("should reject malformed tag names", () => {
                    const render = makeRender();
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
                    const render = makeRender();
                    expect(() => render(["div#id1#id2"])).toThrow();
                });

                it("should panic if more than one id is supplied via tag and prop", () => {
                    const render = makeRender();
                    expect(() => render(["div#idx", { id: "idy" }])).toThrow();
                });

            });

            describe("rendering easy static examples", () => {

                it("should render the simplest helloworld", () => {
                    const render = makeRender();
                    expect(render("Hello, World!"))
                        .toBe("Hello, World!");
                });

                it("should render a static helloworld", () => {
                    const render = makeRender();
                    expect(render(["div", "Hello, World!"]))
                        .toBe("<div>Hello, World!</div>");
                });

                it("should render a static hellouniverse", () => {
                    const render = makeRender();
                    expect(render(["div", "Hello, Universe!"]))
                        .toBe("<div>Hello, Universe!</div>");
                });

                it("should render a static hellomultiverse <span>", () => {
                    const render = makeRender();
                    expect(render(["span", "Hello, Multiverse!"]))
                        .toBe("<span>Hello, Multiverse!</span>");
                });

                it("should render a static hellomultiverse <h1>", () => {
                    const render = makeRender();
                    expect(render(["h1", "Hello, Multiverse!"]))
                        .toBe("<h1>Hello, Multiverse!</h1>");
                });
            });

            describe("'tagName' features", () => {

                it("should support valid plain strings", () => {
                    const render = makeRender();
                    expect(render(["i"])).toBe("<i></i>");
                    expect(render(["div"])).toBe("<div></div>");
                    expect(render(["script"])).toBe("<script></script>");
                });

                it("should support adding an id via '#' emmet like syntax", () => {
                    const render = makeRender();
                    expect(render(["div#some-id"])).toBe("<div id=\"some-id\"></div>");
                });

                it("should support adding CSS classes via '.' emmet like syntax", () => {
                    const render = makeRender();
                    expect(render(["div.some-class.another"]))
                        .toBe("<div class=\"another some-class\"></div>");
                });

                it("should support a combination of '#' and '.' emmet like syntax", () => {
                    const render = makeRender();
                    expect(render(["div#idx.some-class.another"]))
                        .toBe("<div class=\"another some-class\" id=\"idx\"></div>");
                });

                it("should support a wild combination of '#' and '.' emmet like syntax", () => {
                    const render = makeRender();
                    expect(render(["div#a.X.Y", {
                        class: "Z",
                        classList: ["N", "O"],
                        className: "M",
                    }])).toBe(
                        "<div class=\"M N O X Y Z\" id=\"a\"></div>"
                    );
                });

                it("should de-duplicate CSS class names", () => {
                    const render = makeRender();
                    expect(render(["div.X.X"])).toBe("<div class=\"X\"></div>");
                });

                it("should apply CSS classes", () => {
                    const render = makeRender();

                    const expected = render(["button", {
                        class: {
                            "text-size-sm": 1,
                            // eslint-disable-next-line sort-keys
                            "btn-sm": 1,
                        },
                        classList: ["btn-default", "active"],
                        className: "btn",
                    }, "Click Me!"]);

                    expect(expected).toBe(html([
                        "<button class=\"active btn btn-default btn-sm text-size-sm\">",
                        "  Click Me!",
                        "</button>",
                    ]));
                });

            });

            describe("handling props", () => {

                it("should only enumerate own properties", () => {
                    const render = makeRender();
                    const obj = Object.create({ enumerateMe: false });
                    expect(render(["i", obj])).toBe("<i></i>");
                });

                it("should degrade gracefully if invalid props are supplied", () => {
                    expect(makeRender()(["i", /rx/])).toBe("<i></i>");
                    expect(makeRender()(["i", null, /rx/])).toBe("<i></i>");
                });

                it("should degrade gracefully if invalid props and children are supplied", () => {
                    const render = makeRender();
                    expect(render(["i", /rx1/, /rx2/])).toBe("<i></i>");
                });

                it("should support providing props to elements", () => {
                    const render = makeRender();
                    expect(render(["i", { class: "a b" }, "Maybe some icon!"]))
                        .toBe("<i class=\"a b\">Maybe some icon!</i>");
                });

                it("should ensure that props are sorted alphabetically", () => {
                    const render = makeRender();
                    // eslint-disable-next-line sort-keys
                    expect(render(["i", { type: "b", class: "a" }]))
                        .toBe("<i class=\"a\" type=\"b\"></i>");
                });

                it("should ensure that empty props do not add unnecessary whitespace", () => {
                    expect(makeRender()(["br", {}])).toBe("<br/>");
                    expect(makeRender()(["i", {}])).toBe("<i></i>");
                });

                it("should serialize object props using JSON", () => {
                    expect(makeRender()(["i", { aang: "Avatar" }, "the Last Airbender"]))
                        .toBe("<i aang=\"Avatar\">the Last Airbender</i>");
                    expect(makeRender()(["i", { teamAvatar: ["Aang", "Katara", "Soka"] }]))
                        .toBe("<i teamAvatar='[\"Aang\",\"Katara\",\"Soka\"]'></i>");
                    expect(makeRender()(["i", { a: { b: { c: "d" } } }]))
                        .toBe("<i a='{\"b\":{\"c\":\"d\"}}'></i>");
                });

                it("should apply an Emmett-style ID prop", () => {
                    const render = makeRender();
                    expect(render(["div#some-id", "Bam!"])).toBe(html([
                        "<div id=\"some-id\">Bam!</div>"
                    ]));
                });

                it("should apply a plain ID prop", () => {
                    const render = makeRender();
                    expect(render(["div", { id: "some-id" }, "Bam!"])).toBe(html([
                        "<div id=\"some-id\">Bam!</div>"
                    ]));
                });

            });

            describe("handling special props", () => {

                describe("'class', 'className' and 'classList'", () => {

                    it("should support strings for 'class' and 'className' props", () => {
                        expect(makeRender()(["i", { class: "a b c" }]))
                            .toBe("<i class=\"a b c\"></i>");
                        expect(makeRender()(["i", { className: "a b c" }]))
                            .toBe("<i class=\"a b c\"></i>");
                    });

                    it("should support a map for 'class' prop where keys with truthy values become classes", () => {
                        const render = makeRender();
                        expect(render(["i", { class: { a: false, b: true, c: 0 } }]))
                            .toBe("<i class=\"b\"></i>");
                    });

                    it("should support list of strings for 'classList' prop", () => {
                        const render = makeRender();
                        expect(render(["i", { classList: ["a", "b", "c"] }]))
                            .toBe("<i class=\"a b c\"></i>");
                    });

                    it("should sort CSS classes alphabetically for stable renders", () => {
                        expect(makeRender()(["i", { class: "b a c" }]))
                            .toBe("<i class=\"a b c\"></i>");
                        expect(makeRender()(["i", { className: "b a c" }]))
                            .toBe("<i class=\"a b c\"></i>");
                        expect(makeRender()(["i", { classList: ["b", "a", "c"] }]))
                            .toBe("<i class=\"a b c\"></i>");
                    });

                    it("should omit empty an 'classList'", () => {
                        const render = makeRender();
                        expect(render(["i", { classList: [] }])).toBe("<i></i>");
                    });

                });

                describe("should merge Emmet, 'class', 'className' and 'classList'", () => {
                    const render = makeRender();
                    expect(render(["i#a.z.y", {
                        class: "M N",
                        classList: ["O", "Q"],
                        className: "P",
                    }])).toBe("<i class=\"M N O P Q y z\" id=\"a\"></i>");
                });

                describe("'data-' properties", () => {

                    it("should support plain 'data-id' property names", () => {
                        const render = makeRender();
                        expect(render(["i", { "data-id": "boring" }]))
                            .toBe("<i data-id=\"boring\"></i>");
                    });

                    it("should support a special 'data' prop for convenience", () => {
                        expect(makeRender()(
                            ["i", {
                                data: {
                                    id: "interesting",
                                    key: "whoohooo!",
                                },
                            }]
                        )).toBe("<i data-id=\"interesting\" data-key=\"whoohooo!\"></i>");
                        expect(makeRender()(
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

                    it("should support a mix of 'data' and other props", () => {
                        const render = makeRender();
                        const expected = render(["i", {
                            data: { key: "some-key"},
                            // eslint-disable-next-line sort-keys
                            class: { "hello": 1 },
                        }]);
                        expect(expected).toBe(html([
                            "<i class=\"hello\" data-key=\"some-key\"></i>",
                        ]));
                    });

                });

                it("should set properties other than event handlers", () => {
                    const render = makeRender();
                    expect(render(["i", { "role": "button" }, "Buttonic!"])).toBe(html([
                        "<i role=\"button\">Buttonic!</i>",
                    ]));
                });

                it("should skip serializing 'on*' callback props", () => {
                    expect(makeRender()(["button", { onClick: () => {} }]))
                        .toBe("<button></button>");
                    expect(makeRender()(["button", { onMouseUp: () => {} }]))
                        .toBe("<button></button>");
                });

                it("should support truthy boolean props", () => {
                    const render = makeRender();
                    expect(render(["i", { disabled: true }, "Disabled!"])).toBe(html([
                        "<i disabled>Disabled!</i>",
                    ]));
                });

                it("should support falsy boolean props", () => {
                    const render = makeRender();
                    expect(render(["i", { disabled: false }, "Enabled!"])).toBe(html([
                        "<i>Enabled!</i>",
                    ]));
                });

            });

            describe("handling simple edge cases", () => {

                it("should output elements without content", () => {
                    expect(makeRender()(["div"])).toBe("<div></div>");
                    expect(makeRender()(["div", null])).toBe("<div></div>");
                    expect(makeRender()(["div", false])).toBe("<div></div>");
                    expect(makeRender()(["div", false, null])).toBe("<div></div>");
                    expect(makeRender()(["div", null, false])).toBe("<div></div>");
                });

            });

            describe("handling self-closing tags", () => {
                // See https://www.w3.org/TR/html5/syntax.html#void-elements
                const voidElements = "area base br col embed hr img input link meta param source track wbr".split(" ");

                it("should recognize tags that need to be self-closing and render them accordingly", () => {
                    const render = makeRender();
                    voidElements.forEach((it) => {
                        expect(render([it])).toBe(`<${it}/>`);
                    });
                });

                it("should apply props but ignore content", () => {
                    const render = makeRender();
                    voidElements.forEach((it) => {
                        expect(render([it, { class: "a b c" }, "Evil content"]))
                            .toBe(`<${it} class="a b c"/>`);
                    });
                });

            });


            describe("rendering flat expressions", () => {

                it("should be able to render expressions with all kinds of children", () => {
                    const render = makeRender();
                    expect(render(["div", ["b", "Bold!"], "Normal", ["i", "Italics!"]])).toBe(html([
                        "<div>",
                        "  <b>Bold!</b>",
                        "  Normal",
                        "  <i>Italics!</i>",
                        "</div>",
                    ]));

                });

                it("should be able to render expressions with many text children", () => {
                    const render = makeRender();
                    const labels = range(42).map((n) => `x${n}`);
                    expect(render(["div", ...labels])).toBe(html([
                        "<div>",
                        ...labels,
                        "</div>",
                    ]));
                });

            });

            describe("using code templates", () => {

                it("should support functions acting as simple templates", () => {
                    const render = makeRender();

                    function tmpl(props, children) {
                        expect(typeof props).toBe("object");
                        expect(children).toEqual([]);

                        const { items } = props;
                        expect(items).toEqual(["a", "b"]);

                        return ["ul",
                            ...items.map((id) => ["li", {
                                data: { id },
                            }, id]),
                        ];
                    }

                    expect(render([tmpl, { items: ["a", "b"] }]))
                        .toBe(html([
                            "<ul>",
                            "  <li data-id=\"a\">a</li>",
                            "  <li data-id=\"b\">b</li>",
                            "</ul>",
                        ]));
                });

                it("should support that simple templates return flat collections", () => {
                    const render = makeRender();

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
                        .toBe(html([
                            "<ul>",
                            "  <li data-id=\"a\">a</li>",
                            "  <li data-id=\"b\">b</li>",
                            "</ul>",
                            "Text1",
                            "Text2",
                        ]));
                });

                it("should expand static function templates without them being the first element of an expression", () => {
                    const render = makeRender();
                    const fn = jest.fn(() => "Hello, World!");
                    expect(render(fn)).toBe("Hello, World!");
                });

            });

            describe("rendering complex structures", () => {

                it("should support rendering flat collections of nodes", () => {
                    const render = makeRender();
                    const generated = render([
                        ["b#important"],
                        ["h1.highlighted", "Heading"],
                        ["p.y.x", "Some Content"],
                    ]);

                    expect(generated).toBe(html([
                        "<b id=\"important\"></b>",
                        "<h1 class=\"highlighted\">Heading</h1>",
                        "<p class=\"x y\">Some Content</p>",
                    ]));
                });


                it("should support rendering trees of nodes", async () => {
                    const render = makeRender();
                    const generated = render(
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
                        ]
                    );

                    const expected = html([
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
                    ]);

                    expect(generated).toBe(expected);

                    // Delaying due to rate limiting on HTML5 validator side
                    await Promise.all([
                        validateHtml("<!DOCTYPE html>" + generated),
                        delay(500, validateHtml("<!DOCTYPE html>" + expected)),
                    ]).then(([inResults, outResults]) => {
                        const inOk = inResults.messages.length === 0;
                        const outOk = outResults.messages.length === 0;

                        expect(inOk && outOk).toBe(true);
                    }).catch((error) => {
                        expect("Markup to be valid").toBe(error);
                    });
                });

            });

        });
    }

});
