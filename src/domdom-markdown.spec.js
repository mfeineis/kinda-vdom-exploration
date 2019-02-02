/* global Promise */
/* eslint-disable max-len, no-magic-numbers */

const pkg = require("../package.json");

const DomDomMarkdown = require("./domdom-markdown");

describe("domdom-markdown", () => {
    const t = DomDomMarkdown;

    describe("the 'domdom-markdown' transform", () => {

        it("should be a function with arity 2", () => {
            expect(typeof t).toBe("function");
            expect(t).toHaveLength(2);
        });

        it("should export the proper 'version' string matching the package version", () => {
            expect(t.version).toBe(pkg.version);
        });

    });

    it("should render block quotes", () => {
        expect(t(`

> Block Quote

        `)).toEqual(["", ["blockquote", ["p", "Block Quote"]]]);
    });


    it.skip("should render checkboxes", () => {
        expect(t(`

[x] Checked

        `)).toEqual([
            "",
            ["input",
                { checked: "checked", disabled: "disabled", type: "checkbox" },
            ],
            ["p", "Checked"],
        ]);
    });

    it.skip("should render markdown examples to the appropriate domdom expressions", () => {
        const expr = t(`

# Hello, Markdown
Some paragraph
* A list item
* Another item [containing a link](http://example.org)

* * *

## Some subheading
Another paragraph containing a
> Blockquote

And an unordered list with
* [x] A checked checkbox
* [ ] And an unchecked checkbox

        `);
        expect(expr).toEqual([
            "",
            ["h1", "Hello, Markdown"],
            ["p", "Some paragraph"],
            ["ul",
                ["li", "A list item"],
                ["li",
                    "Another item ",
                    ["a", { href: "http://example.org" }, "containing a link"],
                    "",
                ],
            ],
            ["hr"],
            ["h2", "Some subheading"],
            ["p", "Another paragraph containing a"],
            ["blockquote", ["p", "Blockquote"]],
            ["p", "And an unordered list with"],
            ["ul",
                ["li",
                    ["input",
                        { checked: "checked", disabled: "disabled", type: "checkbox"},
                    ],
                    "A checked checkbox",
                ],
                ["li",
                    ["input",
                        { disabled: "disabled", type: "checkbox"},
                        "And an unchecked checkbox",
                    ],
                ],
            ],
        ]);
        expect(t("Hello, Markdown")).toEqual([["p", "Hello, Markdown"]]);
    });

});
