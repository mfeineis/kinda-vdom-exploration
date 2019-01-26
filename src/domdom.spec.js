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
            ({ checkEnvironment, invariant }) => {
                it("should use 'checkEnvironment' on the runtime env", () => {
                    expect(() => checkEnvironment(invariant)).not.toThrow();
                    expect(() => checkEnvironment(invariant, {})).toThrow();
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

    describe("the main exported 'render' function", () => {

        it("should be 'null' while testing due to missing 'document'", () => {
            expect(DomDom.render).toBeNull();
        });

    });

    describe("the 'configureRenderer' factory", () => {
        const utils = makeTestUtils();
        const { configureRenderer } = DomDom;

        it("should be a function", () => {
            expect(configureRenderer).toBeInstanceOf(Function);
        });

        it("should use the internal 'utils' if not provided", () => {
            expect(() => configureRenderer(null, null)).toThrow(Error);
        });

        it("should check that it has been passed a valid document", () => {
            const report = jest.fn();
            const tracingUtils = makeTestUtils(report);

            expect(() => configureRenderer(tracingUtils, null))
                .toThrow(InvariantViolation);
            expect(report.mock.calls[0][0])
                .toBe(
                    "Please pass a valid 'document' to configure a renderer"
                );
        });

        it("should check the current environment for compatibility", () => {
            const doc = {};
            const checkEnv = jest.fn();
            const customUtils = makeTestUtils(undefined, checkEnv);

            configureRenderer(customUtils, doc);

            expect(checkEnv.mock.calls[0][0]).toBe(customUtils.invariant);
        });

        it("should return a 'render' function", () => {
            const render = configureRenderer(utils, {});

            expect(render).toBeInstanceOf(Function);
            expect(render.name).toBe("render");
        });

        describe("a configured 'render' function", () => {
            const doc = {};

            it("should check the given 'driver' and 'root'", () => {
                const report = jest.fn();
                const tracingUtils = makeTestUtils(report);
                const render = configureRenderer(tracingUtils, doc);

                expect(() => render()).toThrow(InvariantViolation);
                expect(report.mock.calls[0][0])
                    .toBe("Please provide a valid 'driver' into 'render'");

                expect(() => render(DomDomDomServer.driver))
                    .toThrow(InvariantViolation);
                expect(report.mock.calls[1][0])
                    .toBe("Please provide a valid root definition");
            });

        });

    });

});

describe("domdom-dom-server", () => {
    const { configureRenderer } = DomDom;
    const utils = makeTestUtils();
    const doc = {};
    const { driver } = DomDomDomServer;

    const makeRender = () => configureRenderer(utils, doc);

    it("should export something", () => {
        expect(DomDomDomServer).toBeDefined();
    });

    describe("rendering easy static examples", () => {

        it("should render the simplest helloworld", () => {
            const render = makeRender();

            expect(render(driver, "Hello, World!"))
                .toEqual("Hello, World!");
        });

        it("should render a static helloworld", () => {
            const render = makeRender();

            expect(render(driver, ["div", "Hello, World!"]))
                .toEqual("<div>Hello, World!</div>");
        });

        it("should render a static hellouniverse", () => {
            const render = makeRender();

            expect(render(driver, ["div", "Hello, Universe!"]))
                .toEqual("<div>Hello, Universe!</div>");
        });

        it("should render a static hellomultiverse", () => {
            const render = makeRender();

            expect(render(driver, ["span", "Hello, Multiverse!"]))
                .toEqual("<span>Hello, Multiverse!</span>");
            expect(render(driver, ["h1", "Hello, Multiverse!"]))
                .toEqual("<h1>Hello, Multiverse!</h1>");
        });

    });

});

