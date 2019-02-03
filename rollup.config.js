import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;
const terserOptions = {
    ecma: 5,
};

export default [
    {
        input: "src/domdom.js",
        output: {
            file: "dist/domdom.js",
            format: "umd",
            name: "DomDom",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
    {
        input: "src/domdom-dom.js",
        output: {
            file: "dist/domdom-dom.js",
            format: "umd",
            name: "DomDomDom",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
    {
        input: "src/domdom-dom-server.js",
        output: {
            file: "dist/domdom-dom-server.js",
            format: "umd",
            name: "DomDomDomServer",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
];
