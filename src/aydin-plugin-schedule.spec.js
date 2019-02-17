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

    it("should use the 'windowed' scheduler by default", () => {
        const schedule = plugin();

        expect(schedule.scheduler).toBe(plugin.windowed);
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
        const schedule = plugin(plugin.sync);

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

    describe("the 'sync' scheduler", () => {

        it("should be exported", () => {
            expect(typeof plugin.sync).toBe("function");
            expect(plugin.sync).toHaveLength(1);
        });

        const sync = plugin.sync;

        it("should invoke the step function immediately without data", () => {
            const fn = jest.fn();
            const schedule = sync(fn);
            schedule("aang");
            expect(fn.mock.calls).toEqual([
                ["aang"],
            ]);
        });

        it("should invoke the step function immediately with data", () => {
            const fn = jest.fn();
            const schedule = sync(fn);
            schedule("aang", { team: "Avatar" });
            expect(fn.mock.calls).toEqual([
                ["aang", { team: "Avatar" }],
            ]);
        });

    });

    describe("the 'windowed' scheduler", () => {

        it("should be exported", () => {
            expect(typeof plugin.configureWindowed).toBe("function");
            expect(plugin.configureWindowed).toHaveLength(2);
            expect(typeof plugin.windowed).toBe("function");
            expect(plugin.windowed).toHaveLength(1);
        });

        describe("a windowed scheduler batching signals for one event loop run", () => {
            const maxCalls = (max, fn) => {
                // eslint-disable-next-line immutable/no-let
                let i = 0;
                return (...args) => {
                    i += 1;
                    if (i <= max) {
                        fn(...args);
                    }
                };
            };
            const requestAnimationFrame = (fn, ms = 10) =>
                setTimeout(() => fn(Date.now()), ms);

            const window = {
                requestAnimationFrame: jest.fn(maxCalls(100, requestAnimationFrame)),
            };
            const scheduler = plugin.configureWindowed(10, window);

            it("should invoke the step function on the next time slice without data", (done) => {
                const fn = jest.fn();
                const schedule = scheduler(fn);
                schedule("aang");

                expect(fn.mock.calls).toEqual([]);

                window.requestAnimationFrame(() => {
                    expect(fn.mock.calls).toEqual([
                        ["aang"],
                    ]);
                    done();
                }, 100);
            });

            it("should merge synchronously scheduled signals on the next time slice", (done) => {
                const fn = jest.fn();
                const schedule = scheduler(fn);
                schedule("aang");

                window.requestAnimationFrame(() => {
                    schedule("soka");
                });

                expect(fn.mock.calls).toEqual([]);

                window.requestAnimationFrame(() => {
                    expect(fn.mock.calls).toEqual([
                        ["aang"],
                        ["katara"],
                        ["soka"],
                    ]);
                    done();
                }, 50);

                schedule("katara");
            });

            it("should linearize the scheduled schedules into the same time slice", (done) => {
                const fn = jest.fn();
                const schedule = scheduler(fn);
                schedule("aang");
                schedule("katara");

                expect(fn.mock.calls).toEqual([]);
                expect(window.requestAnimationFrame.mock.calls).toHaveLength(1);

                window.requestAnimationFrame(() => {
                    expect(fn.mock.calls).toEqual([
                        ["aang"],
                        ["katara"],
                    ]);
                    done();
                }, 50);
            });

            it("should invoke the step function on the next time slice with data", (done) => {
                const fn = jest.fn();
                const data = { team: "Avatar" };
                const schedule = scheduler(fn);
                schedule("aang", data);

                expect(fn.mock.calls).toEqual([]);

                window.requestAnimationFrame(() => {
                    expect(fn.mock.calls).toEqual([
                    ]);
                }, 5);

                window.requestAnimationFrame(() => {
                    expect(fn.mock.calls).toEqual([
                        ["aang", data],
                    ]);
                    done();
                }, 50);
            });

            it("should de-duplicate re-render signals in the time slice buffer", (done) => {
                const fn = jest.fn();
                const schedule = scheduler(fn);
                schedule(CORE_RERENDER);
                schedule("katara");
                schedule(CORE_RERENDER);

                expect(fn.mock.calls).toEqual([]);

                window.requestAnimationFrame(() => {
                    expect(fn.mock.calls).toEqual([
                        ["katara"],
                        [CORE_RERENDER],
                    ]);
                    done();
                }, 50);
            });

        });

    });

});

