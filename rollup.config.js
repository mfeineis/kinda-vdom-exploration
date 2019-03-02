import pkg from "./package.json";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const release = process.env.AYDIN_BUILD === "release";
const production = !process.env.ROLLUP_WATCH;
const terserOptions = {
    ecma: 5,
    // toplevel: true,
    warnings: true,
};

const buildDir = release ? `dist/${pkg.version}` : "dist/latest";

export default [
    {
        input: "src/aydin.js",
        output: {
            file: `${buildDir}/aydin.js`,
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
            file: `${buildDir}/aydin-dom.js`,
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
            file: `${buildDir}/aydin-dom-server.js`,
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
        input: "src/aydin-plugin-mvu.js",
        output: {
            file: `${buildDir}/aydin-plugin-mvu.js`,
            format: "umd",
            name: "AydinPluginMvu",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
    {
        input: "src/aydin-plugin-schedule.js",
        output: {
            file: `${buildDir}/aydin-plugin-schedule.js`,
            format: "umd",
            name: "AydinPluginSchedule",
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            production && terser(terserOptions),
        ],
    },
    {
        input: "src/aydin-request.js",
        output: {
            file: `${buildDir}/aydin-request.js`,
            format: "umd",
            name: "AydinRequest",
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
            file: `${buildDir}/aydin-transform-markdown.js`,
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
    // Flavors
    {
        input: "flavors/browser.js",
        output: {
            file: `${buildDir}/aydin.browser.js`,
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
        input: "flavors/complete.js",
        output: {
            file: `${buildDir}/aydin.complete.js`,
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
];
