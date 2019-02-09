const pkg = require("../package.json");

const Markdown = require("./aydin-transform-markdown");

describe("AydinMarkdown", () => {

    it("should export something", () => {
        expect(Markdown).toBeDefined();
    });

    it("should export the proper 'version' string matching the package version", () => {
        expect(Markdown.version).toBe(pkg.version);
    });

    describe("the main exported 'markdown' function", () => {

        it("should actually be a function with an arity of 2", () => {
            expect(typeof Markdown).toBe("function");
            expect(Markdown).toHaveLength(2);
        });

        it("should have a 'configureMarkdown' property being a function of arity 1", () => {
            expect(typeof Markdown.configureMarkdown).toBe("function");
            expect(Markdown.configureMarkdown).toHaveLength(1);
        });

    });

    describe("producing expressions from markdown", () => {

        it("should produce expressions when given markdown", () => {
            const md = `

# Some document
Some text inside a paragraph

## A subheading
A paragraph *containing* a list and a [link to example.org](http://example.org)
* Apples
* Oranges
* Peaches

            `;
            expect(Markdown(null, [md])).toEqual([

                ["h1", { id: "some-document" }, "Some document"],
                ["p", "Some text inside a paragraph"],

                ["h2", { id: "some-document-a-subheading" }, "A subheading"],
                ["p", "A paragraph ", ["em", "containing"], " a list and a ",
                    ["a", { href: "http://example.org" }, "link to example.org"],
                ],
                ["ul",
                    ["li", "Apples"],
                    ["li", "Oranges"],
                    ["li", "Peaches"],
                ],
            ]);
        });

    });

});
