/* eslint-disable max-len, no-magic-numbers */

const pkg = require("../package.json");

const DomDom = require("./domdom");

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
            const render = configureRenderer(utils);

            expect(render).toBeInstanceOf(Function);
            expect(render.name).toBe("render");
        });

        describe("a configured 'render' function", () => {

            it("should check the given 'driver' and 'expr'" ,() => {
                const report = jest.fn();
                const tracingUtils = makeTestUtils(report);
                const render = configureRenderer(tracingUtils);

                expect(() => render()).toThrow(InvariantViolation);
                expect(report.mock.calls[0][0])
                    .toBe("Please provide a valid 'driver' into 'render'");

                expect(() => render(identityDriver))
                    .toThrow(InvariantViolation);
                expect(report.mock.calls[1][0])
                    .toBe("Please provide a valid expression");
            });

            it("should use the given 'driver' to transform the input", () => {

                const render = configureRenderer(utils);

                const result = render(identityDriver, ["div", "Hello, World!"]);
                expect(result).toEqual(["div", "Hello, World!"]);
            });

        });

        describe("handling simple edge cases", () => {
            const baseRender = configureRenderer(utils);
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
