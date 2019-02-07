const pkg = require("../package.json");

const Aydin = require("./aydin");
const { identityDriver, tracable } = require("./testUtils.js");

describe("Aydin", () => {

    it("should export something", () => {
        expect(Aydin).toBeDefined();
    });

    describe("the development utilities in use", () => {

        it("should not have a 'document' while testing", () => {
            expect(typeof document).toBe("undefined");
        });

    });

    it("should export the proper 'version' string matching the package version", () => {
        expect(Aydin.version).toBe(pkg.version);
    });

    describe("the main exported 'render' function", () => {

        it("should actually be a function with an arity of 3", () => {
            expect(typeof Aydin.render).toBe("function");
            expect(Aydin.render).toHaveLength(3);
        });

    });

    describe("the 'configureRenderer' factory", () => {
        const { configureRenderer } = Aydin;

        it("should be a function", () => {
            expect(configureRenderer).toBeInstanceOf(Function);
        });

        it("should use the internal 'utils' if not provided", () => {
            expect(() => configureRenderer(null)).not.toThrow();
        });

        it("should return a 'render' function", () => {
            const render = configureRenderer();

            expect(render).toBeInstanceOf(Function);
            expect(render.name).toBe("render");
        });

        describe("a configured 'render' function", () => {

            it("should check the given 'driver' and 'expr'" ,() => {
                const render = configureRenderer();

                expect(() => render()).toThrow();
                expect(() => render(identityDriver)).toThrow();
            });

            it("should use the given 'driver' to transform the input", () => {

                const render = configureRenderer();

                const result = render(identityDriver, ["div", "Hello, World!"]);
                expect(result).toEqual(["div", "Hello, World!"]);
            });

        });

        describe("handling simple edge cases", () => {
            const baseRender = configureRenderer();
            const render = (expr) => baseRender(identityDriver, expr);

            it("should not be fine with trying to render nothing", () => {
                expect(() => render([])).toThrow();
                expect(() => render([[]])).toThrow();
                expect(() => render([[[]]])).toThrow();
            });

            it("should panic if no 'tagName' is given", () => {
                expect(() => render([null, "Some text"])).toThrow();
            });

        });

        describe("debugability", () => {
            const base = configureRenderer();
            const render = (expr, log) => base(tracable(identityDriver, log), expr);

            it("should be easy debug how the expression is traversed", () => {
                const log = [];
                render(
                    ["div",
                        "One",
                        "Two",
                        ["span", "Three", "Four"]
                    ],
                    log
                );

                expect(log).toEqual([
                    "0000: [0] ELEMENT_NODE <div>",
                    "0001: [0,0] TEXT_NODE 'One'",
                    "0002: [0,1] TEXT_NODE 'Two'",
                    "0003: [0,2] ELEMENT_NODE <span>",
                    "0004: [0,2,0] TEXT_NODE 'Three'",
                    "0005: [0,2,1] TEXT_NODE 'Four'",
                ]);

            });

        });

    });

});
