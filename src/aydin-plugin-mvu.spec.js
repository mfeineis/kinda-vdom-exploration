const pkg = require("../package.json");

const Aydin = require("./aydin");
const plugin = require("./aydin-plugin-mvu");
const { identityDriver, nonReactive, simulate } = require("./testUtils.js");

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
            const connected = plugin.lens(({ count1 }) => ({ count: count1 }))(counter);

            const result = render(mvu(identityDriver), connected);
            expect(result[0][1].onClick).toEqual(["INC", 1]);
        });

        it("should leave the behavior of the base templates intact if used without the plugin being present when rendering", () => {
            const input = { a: "a", b: "b" };
            const mvu = plugin(() => [input]);

            const fn = ({ a, b } = {}) => ["", a, b];
            const swap = ({ a, b } = {}) => ({ a: b, b: a });

            const connected = plugin.lens(swap)(fn);

            expect(fn(input)).toEqual(["", "a", "b"]);
            expect(connected(input)).toEqual(["", "a", "b"]);

            expect(render(identityDriver, [fn, input])).toEqual(["", "a", "b"]);
            expect(render(identityDriver, connected)).toEqual(["", "", ""]);
            expect(render(identityDriver, [connected, input])).toEqual(["", "a", "b"]);

            expect(render(mvu(identityDriver), [fn, input])).toEqual(["", "a", "b"]);
            expect(render(mvu(identityDriver), connected)).toEqual(["", "b", "a"]);
            expect(render(mvu(identityDriver), [connected, {}])).toEqual(["", "b", "a"]);
        });

        it("should hand in the whole state if no lens is given", () => {
            const mvu = plugin(() => [{ count: 0 }]);
            const connected = plugin.lens()(counter);

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

            const connected = plugin.lens()(counter);
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

            const connected = plugin.lens()(({ what }) => [
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

        it("should support bubbling signals upstream when visiting nodes", () => {
            // eslint-disable-next-line immutable/no-let
            let bubbleCount = 0;
            const bubbling = (next) => (signal) => {
                const decoratee = next(signal);
                return Object.freeze({
                    expand: decoratee.expand,
                    isSpecialTag: decoratee.isSpecialTag,
                    reduce: decoratee.reduce,
                    visit: (expr, props, nodeType, path, bubble) => {
                        if (bubbleCount === 0) {
                            bubble(["GLIDE!"]);
                        } else {
                            bubble([]);
                        }

                        bubbleCount += 1;
                        return decoratee.visit(expr, props, nodeType, path);
                    },
                });
            };

            const mvu = plugin((model) => {
                if (!model) {
                    return [{ what: "Bold!" }];
                }

                return [{ what: "Flawed" }];
            });

            const fn = plugin.lens()(({ what }) => [
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, what],
            ]);
            const driver = nonReactive(mvu(bubbling(identityDriver)));
            const expr = render(driver, fn);
            expect(expr).toEqual([
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, "Bold!"],
            ]);

            simulate("click", expr[1], driver);
            expect(render(driver, fn)).toEqual([
                ["i", "Nothing"],
                ["b", { onClick: ["anything"] }, "Flawed"],
            ]);
        });

    });

});

