const pkg = require("../package.json");

const Aydin = require("./aydin");
const plugin = require("./aydin-plugin-mvu");
const { identityDriver } = require("./testUtils.js");

describe("the Aydin Model View Update plugin for state management", () => {

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

        it("(MAYBE?) should take over state for enhanced templates even when the render is not driven by the MVU plugin", () => {
            const { render } = Aydin;
            const update = (msg, model) => {
                if (!msg) {
                    return [{ count1: 0 }];
                }

                switch (msg[0]) {
                case "INC":
                    return [{ ...model, count1: msg[1] }];
                default:
                    return [model];
                }
            };
            const mvu = plugin(update);
            const connected = mvu.lens(({ count1 }) => ({ count: count1 }))(counter);

            const result = render(mvu(identityDriver), connected);
            expect(result[0][1].onClick).toEqual(["INC", 1]);
        });

        it("(MAYBE?) should leave the behavior of enhanced templates intact if used without the plugin being present when rendering", () => {
            const { render } = Aydin;
            const input = { a: "a", b: "b" };
            const mvu = plugin(() => [input]);

            const fn = ({ a, b }) => ["", a, b];
            const swapArgs = ({ a, b }) => ({ a: b, b: a });
            const connected = mvu.lens(swapArgs)(fn);

            expect(fn(input)).toEqual(["", "a", "b"]);
            expect(connected(input)).toEqual(["", "b", "a"]);

            expect(render(identityDriver, [fn, input])).toEqual(["", "a", "b"]);
            expect(render(identityDriver, connected)).toEqual(["", "b", "a"]);
            expect(render(identityDriver, [connected, {}])).toEqual(["", "b", "a"]);

            expect(render(mvu(identityDriver), [fn, input])).toEqual(["", "a", "b"]);
            expect(render(mvu(identityDriver), connected)).toEqual(["", "b", "a"]);
            expect(render(mvu(identityDriver), [connected, {}])).toEqual(["", "b", "a"]);
        });

    });

});

