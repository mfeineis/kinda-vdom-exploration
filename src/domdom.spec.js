const pkg = require("../package.json");

const DomDom = require("./domdom");

describe("domdom", () => {

    it("should export something", () => {
        expect(DomDom).toBeDefined();
    });

    describe("the development utilities in use", () => {

        it("should not have a 'document' while testing", () => {
            expect(typeof document).toBe("undefined");
        });

    });

    it("should export the proper 'version' string matching the package version", () => {
        expect(DomDom.version).toBe(pkg.version);
    });

    describe("the main exported 'render' function", () => {

        it("should actually be a function with an arity of 3", () => {
            expect(typeof DomDom.render).toBe("function");
            expect(DomDom.render).toHaveLength(3);
        });

    });

    describe("the 'configureRenderer' factory", () => {
        const identityDriver = () => ({
            isSpecialTag: () => [false],
            visit: (expr, _, nodeType) => {
                switch (nodeType) {
                case 1:
                    return (children) => [expr, ...children];
                case 3:
                    return expr;
                default:
                    throw new Error(`Unsupported 'nodeType' ${nodeType}`);
                }
            },
        });
        const { configureRenderer } = DomDom;

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

    });

});
