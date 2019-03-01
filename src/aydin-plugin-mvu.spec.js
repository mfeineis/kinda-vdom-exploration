const pkg = require("../package.json");

const Aydin = require("./aydin");
const plugin = require("./aydin-plugin-mvu");
const {
    CORE_RENDER,
    DOMDRIVER_MISSING_HANDLER,
    DOMDRIVER_HANDLER_RETURNED_DATA,
} = require("./signals");
const { configureSink, identityDriver, simulate } = require("./testUtils.js");

describe("the Aydin Model View Update plugin for state management", () => {
    const { render } = Aydin;

    it("should export something", () => {
        expect(plugin).toBeDefined();
    });

    it("should export the proper 'version' string matching the package version", () => {
        expect(plugin.version).toBe(pkg.version);
    });

    describe("using the Model View Update plugin", () => {

        const counter = ({ count }) => [
            ["button", {
                onClick: count >= 0 ? ["INC", count + 1] : null,
            }, "+"],
            `${count}`,
        ];

        it("should allow templates to be inspected trivially", () => {
            const result = counter({ count: 0 });
            expect(result[0][1].onClick).toEqual(["INC", 1]);
        });

        it("should allow a template to assign 'null' to a handler", () => {
            const result = counter({ count: -1 });
            expect(result[0][1].onClick).toEqual(null);
        });

        it("should support selecting parts of the state via 'connect'", () => {
            const select = () => {};
            const fn = plugin.connect(select)(() => []);
            expect(fn["__aydin_plugin_mvu_get"]).toBe(select);
        });

        it("should just hand in the complete state when omitting the selector", () => {
            const sentinel = Object.freeze({});
            const fn = plugin.connect()(() => []);
            expect(typeof fn["__aydin_plugin_mvu_get"]).toBe("function");
            expect(fn["__aydin_plugin_mvu_get"](sentinel)).toBe(sentinel);
        });

        it("should take over state management for enhanced templates when the render is driven by the MVU plugin", () => {
            const mvu = plugin((model, msg) => {
                if (!model) {
                    return [{ count1: 0 }];
                }

                switch (msg[0]) {
                case "INC":
                    return [{ ...model, count1: msg[1] }];
                default:
                    return [model];
                }
            });
            const connected = plugin.connect(({ count1 }) => ({ count: count1 }))(counter);

            const result = render(mvu(identityDriver), connected);
            expect(result[0][1].onClick).toEqual(["INC", 1]);
        });

        it("should leave the behavior of the base templates intact if used without the plugin being present when rendering", () => {
            const input = { a: "a", b: "b" };
            const mvu = plugin(() => [input]);

            const fn = ({ a, b } = {}) => ["", a, b];
            const swap = ({ a, b } = {}) => ({ a: b, b: a });

            const connected = plugin.connect(swap)(fn);

            expect(fn(input)).toEqual(["", "a", "b"]);
            expect(connected(input)).toEqual(["", "a", "b"]);

            expect(render(identityDriver, [fn, input])).toEqual(["", "a", "b"]);
            expect(render(identityDriver, connected)).toEqual(["", "", ""]);
            expect(render(identityDriver, [connected, input])).toEqual(["", "a", "b"]);

            expect(render(mvu(identityDriver), [fn, input])).toEqual(["", "a", "b"]);
            expect(render(mvu(identityDriver), connected)).toEqual(["", "b", "a"]);
            expect(render(mvu(identityDriver), [connected, {}])).toEqual(["", "b", "a"]);
        });

        it("should hand in the whole state if no mapping is given", () => {
            const mvu = plugin(() => [{ count: 0 }]);
            const connected = plugin.connect()(counter);

            const expr = render(mvu(identityDriver), connected);
            expect(expr).toEqual([
                ["button", { onClick: ["INC", 1] }, "+"], "0",
            ]);
            const [msg] = simulate("click", expr[0]);
            expect(msg).toEqual(["INC", 1]);
        });

        it("should map messages to the update function", () => {
            const mvu = plugin((model, msg) => {
                if (!model) {
                    return [{ count: 0 }];
                }
                switch (msg[0]) {
                case "INC":
                    return [{ count: model.count + msg[1] }];
                default:
                    return [model];
                }
            });

            const connected = plugin.connect()(counter);
            const driver = mvu(identityDriver);
            const expr = render(driver, connected);
            expect(expr).toEqual([
                ["button", { onClick: ["INC", 1] }, "+"], "0",
            ]);

            simulate("click", expr[0], driver);
            simulate("mouseup", expr[0], driver);
            simulate("mousedown", expr, driver);

            expect(render(driver, connected)).toEqual([
                ["button", { onClick: ["INC", 2] }, "+"], "1",
            ]);
        });

    });

    describe("simulating interactions", () => {

        it("should update only on suitable interactions", () => {
            const mvu = plugin((model) => {
                if (!model) {
                    return [{ what: "Bold" }];
                }
                return [{ what: "Flawed" }];
            });

            const connected = plugin.connect()(({ what }) => [
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, what],
            ]);
            const driver = mvu(identityDriver);
            const expr = render(driver, connected);
            expect(expr).toEqual([
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, "Bold"],
            ]);

            simulate("mouseup", expr[0], driver);
            simulate("mousedown", expr[1], driver);
            expect(render(driver, connected)).toEqual([
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, "Bold"],
            ]);

            simulate("click", expr[1], driver);
            expect(render(driver, connected)).toEqual([
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, "Flawed"],
            ]);
        });

        it("should allow MVU messages to be routed to different parts of the state", () => {
            const mvu = plugin((model, msg) => {
                if (!model) {
                    return [{ counterA: 0, counterB: 10 }];
                }

                switch (msg[0]) {
                case "INC":
                    if (msg[1] === "A") {
                        return [{
                            ...model,
                            counterA: model.counterA + 1,
                        }];
                    } else {
                        return [{
                            ...model,
                            counterB: model.counterB + 1,
                        }];
                    }
                default:
                    return [model];
                }
            });

            const F = (which) =>
                (count) => ["button", { onClick: ["INC", which] }, "+", `${count}`];

            const A = plugin.connect(({ counterA }) => counterA)(F("A"));
            const B = plugin.connect(({ counterB }) => counterB)(F("B"));

            const driver = mvu(identityDriver);
            const expr = render(driver, ["", A, B]);

            expect(expr).toEqual([
                "",
                ["button", { onClick: ["INC", "A"] }, "+", "0"],
                ["button", { onClick: ["INC", "B"] }, "+", "10"],
            ]);

            simulate("click", expr[1], driver);

            expect(render(driver, ["", A, B])).toEqual([
                "",
                ["button", { onClick: ["INC", "A"] }, "+", "1"],
                ["button", { onClick: ["INC", "B"] }, "+", "10"],
            ]);

            simulate("click", expr[2], driver);

            expect(render(driver, ["", A, B])).toEqual([
                "",
                ["button", { onClick: ["INC", "A"] }, "+", "1"],
                ["button", { onClick: ["INC", "B"] }, "+", "11"],
            ]);
        });

        it("should support bubbling signals upstream when visiting nodes", () => {
            // eslint-disable-next-line immutable/no-let
            let bubbleCount = 0;
            const bubbling = (next) => (notify) => {
                const decoratee = next(notify);
                return Object.freeze({
                    expand: decoratee.expand,
                    isSpecialTag: decoratee.isSpecialTag,
                    reduce: decoratee.reduce,
                    visit: (expr, props, nodeType, path) => {
                        if (bubbleCount === 0) {
                            notify(DOMDRIVER_MISSING_HANDLER, {
                                value: ["FAKE", "with", "params"],
                            });
                        } else if (bubbleCount === 1){
                            notify(DOMDRIVER_MISSING_HANDLER, {
                                value: ["UNKNOWN", "with", "params"],
                            });
                        } else {
                            notify();
                        }

                        bubbleCount += 1;
                        return decoratee.visit(expr, props, nodeType, path);
                    },
                });
            };

            const spy = jest.fn();
            const sink = configureSink(spy);

            const mvu = plugin((model, msg) => {
                if (!model) {
                    return [{ what: "Bold!" }];
                }

                switch (msg[0]) {
                case "FAKE":
                    return [{ what: "Flawed" }];
                default:
                    return [model];
                }
            });

            const fn = plugin.connect()(({ what }) => [
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, what],
            ]);
            const driver = sink(mvu(bubbling(identityDriver)));
            const expr = render(driver, fn);
            expect(expr).toEqual([
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, "Bold!"],
            ]);

            expect(spy.mock.calls).toEqual([
                [CORE_RENDER],
                [undefined, undefined],
                [undefined, undefined],
            ]);

            simulate("click", expr[1], driver);
            expect(render(driver, fn)).toEqual([
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, "Flawed"],
            ]);

            simulate("click", expr[1], driver);
            expect(render(driver, fn)).toEqual([
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, "Flawed"],
            ]);
        });

        it("should not request a re-render if the model has not changed", () => {
            const mvu = plugin((model, msg) => {
                if (!model) {
                    return [{ what: "Bold!" }];
                }
                if (msg[0] === "MUTATE") {
                    return [{ what: model.what }];
                }
                return [model];
            });

            const driver = mvu(identityDriver);
            const { dispatch } = driver;

            expect(dispatch([])).toBe(false);
            expect(dispatch([["PURE"]])).toBe(false);
            expect(dispatch([["MUTATE"]])).toBe(true);
            expect(dispatch([["PURE"]])).toBe(false);
        });

        it("should treat data returned from downstream handlers as messages", () => {
            const fake = (next) => (notify) => {
                const decoratee = next(notify);
                // eslint-disable-next-line immutable/no-let
                let i = 0;
                return Object.freeze({
                    expand: decoratee.expand,
                    isSpecialTag: decoratee.isSpecialTag,
                    reduce: decoratee.reduce,
                    visit(expr, props, nodeType, path) {
                        if (i === 0) {
                            notify(DOMDRIVER_HANDLER_RETURNED_DATA, {
                                data: ["FAKE", "with", "params"],
                            });
                            i += 1;
                        } else {
                            notify(DOMDRIVER_HANDLER_RETURNED_DATA, {
                                data: [],
                            });
                        }
                        return decoratee.visit(expr, props, nodeType, path);
                    },
                });
            };

            const mvu = plugin((model, msg) => {
                if (!model) {
                    return [{ what: "Bold" }];
                }
                switch (msg[0]) {
                case "FAKE":
                    return [{ what: "Fake" }];
                default:
                    return [model];
                }
            });
            const fn = plugin.connect()(({ what }) => [
                ["button", { onClick }, "Click ", what, "!"]
            ]);

            const sink = configureSink(() => {});
            const driver = sink(mvu(fake(identityDriver)));
            const onClick = jest.fn(() => ["FAKE"]);

            const expr = render(driver, fn);
            expect(expr).toEqual([
                ["button", { onClick }, "Click ", "Bold", "!"]
            ]);

            expect(render(driver, fn)).toEqual([
                ["button", { onClick }, "Click ", "Fake", "!"]
            ]);
        });

    });

});

