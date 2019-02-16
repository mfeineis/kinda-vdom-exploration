const pkg = require("../package.json");

const Aydin = require("./aydin");
const plugin = require("./aydin-plugin-schedule");
const {
    CORE_RERENDER,
    CORE_RENDER_FRAME_DONE,
    CORE_RENDER_FRAME_INIT,
} = require("./signals");
const { configureSink, identityDriver, range } = require("./testUtils");
const { noop } = require("./utils");

describe("the Aydin schedule plugin", () => {
    const { render } = Aydin;

    it("should export something", () => {
        expect(plugin).toBeDefined();
    });

    it("should export the proper 'version' string matching the package version", () => {
        expect(plugin.version).toBe(pkg.version);
    });

    const constantlyChatty = (next) => (notify) => {
        const decoratee = next(notify);
        return Object.freeze({
            expand: decoratee.expand,
            isSpecialTag: decoratee.isSpecialTag,
            receive: decoratee.receive,
            reduce: decoratee.reduce,
            visit: (expr, props, nodeType, path) => {
                notify(CORE_RERENDER);
                notify(CORE_RERENDER);
                notify(CORE_RERENDER);
                return decoratee.visit(expr, props, nodeType, path);
            },
        });
    };

    const unpredictablyChatty = (next) => (notify) => {
        const decoratee = next(notify);
        return Object.freeze({
            expand: decoratee.expand,
            isSpecialTag: decoratee.isSpecialTag,
            receive: decoratee.receive,
            reduce: decoratee.reduce,
            visit: (expr, props, nodeType, path) => {
                range(Math.random() * 2).forEach(() => {
                    notify(CORE_RERENDER);
                });

                return decoratee.visit(expr, props, nodeType, path);
            },
        });
    };

    describe("the problem with chatty notifications", () => {

        it("should receive many unnecessary re-render signals without the plugin", () => {
            const spy = jest.fn();
            const capture = configureSink(spy);
            const driver = capture(constantlyChatty(identityDriver));

            render(driver, ["i", "Chatty, chatty"]);

            expect(spy.mock.calls).toEqual([
                [CORE_RERENDER],
                [CORE_RERENDER],
                [CORE_RERENDER],
                [CORE_RERENDER],
                [CORE_RERENDER],
                [CORE_RERENDER],
            ]);
        });

    });

    describe("batching 'CORE_RERENDER' signals", () => {
        const schedule = plugin();

        it("should not notify if no re-render signals were dispatched", () => {
            const spy = jest.fn();
            const capture = configureSink(spy);
            const driver = capture(schedule(identityDriver));

            render(driver, ["i", "Chatty, chatty"]);

            expect(spy.mock.calls).toEqual([]);
        });

        it("should notify once within one event loop by default", () => {
            const spy = jest.fn();
            const capture = configureSink(spy);
            const driver = capture(schedule(unpredictablyChatty(identityDriver)));

            render(driver, ["i", "Chatty, chatty"]);
            expect(spy.mock.calls).toEqual([
                [CORE_RERENDER],
            ]);
        });

        it("should exlusively track 'CORE_RERENDER' signals and pass along everything else untouched", () => {
            const data = { some: "data" };

            const notRenderRelated = (next) => (notify) => {
                const decoratee = next(notify);
                return Object.freeze({
                    expand: decoratee.expand,
                    isSpecialTag: decoratee.isSpecialTag,
                    receive: decoratee.receive,
                    reduce: decoratee.reduce,
                    visit: (expr, props, nodeType, path) => {
                        notify(-1, data);
                        return decoratee.visit(expr, props, nodeType, path);
                    },
                });
            };

            const spy = jest.fn();
            const capture = configureSink(spy);
            const driver = capture(schedule(notRenderRelated(identityDriver)));

            render(driver, ["i", "Chatty, chatty", "but not rerendery"]);
            expect(spy.mock.calls).toEqual([
                [-1, data],
                [-1, data],
                [-1, data],
            ]);
        });

        it("should only track render notifications within a given render frame", () => {
            /* eslint-disable immutable/no-let */
            let i = 0;
            let k = 0;
            let upstream = noop;
            /* eslint-enable immutable/no-let */

            const received = jest.fn();
            const ignoredData = { evil: "data" };
            const chattyThenSilent = (next) => (notify) => {
                const decoratee = next(notify);
                upstream = notify;
                return Object.freeze({
                    expand: decoratee.expand,
                    isSpecialTag: decoratee.isSpecialTag,
                    receive: (...args) => {
                        received(...args);
                        return (decoratee.receive || noop)(...args);
                    },
                    reduce: decoratee.reduce,
                    visit: (expr, props, nodeType, path) => {
                        if (i === 0) {
                            range(Math.random() * 2).forEach(() => {
                                notify(CORE_RERENDER, ignoredData);
                            });

                            i += 1;
                        }
                        return decoratee.visit(expr, props, nodeType, path);
                    },
                });
            };

            const spy = jest.fn();
            const capture = configureSink(spy, (next, args) => {
                if (k == 1) {
                    next(...args);
                }
                k += 1;
            });
            const driver = capture(schedule(chattyThenSilent(identityDriver)));

            render(driver, ["i", "Chatty, chatty"]);
            expect(received.mock.calls).toEqual([
                [CORE_RENDER_FRAME_INIT],
                [CORE_RENDER_FRAME_DONE],
            ]);
            expect(spy.mock.calls).toEqual([
                [CORE_RERENDER],
            ]);

            // Forcing re-render
            upstream(CORE_RERENDER);

            expect(received.mock.calls).toEqual([
                [CORE_RENDER_FRAME_INIT],
                [CORE_RENDER_FRAME_DONE],
                [CORE_RENDER_FRAME_INIT],
                [CORE_RENDER_FRAME_DONE],
            ]);
            expect(spy.mock.calls).toEqual([
                [CORE_RERENDER],
                [CORE_RERENDER],
            ]);
        });

    });

});

