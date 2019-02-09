import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;
const terserOptions = {
    ecma: 5,
    // toplevel: true,
    warnings: true,
};

export default [
    {
        input: "src/aydin.js",
        output: {
            file: "dist/aydin.js",
            format: "umd",
            name: "Aydin",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
    {
        input: "src/aydin-dom.js",
        output: {
            file: "dist/aydin-dom.js",
            format: "umd",
            name: "AydinDom",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
    {
        input: "src/aydin-dom-server.js",
        output: {
            file: "dist/aydin-dom-server.js",
            format: "umd",
            name: "AydinDomServer",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
    {
        input: "src/aydin-transform-markdown.js",
        output: {
            file: "dist/aydin-transform-markdown.js",
            format: "umd",
            name: "AydinTransformMarkdown",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
];
