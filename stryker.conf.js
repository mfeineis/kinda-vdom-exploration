// FIXME: Make this eslint rule work with `module.exports`
// eslint-disable-next-line immutable/no-mutation
module.exports = (config) => {
    config.set({
        coverageAnalysis: "off",
        // logLevel: "debug",
        // mutate: ["src/**/*.js"],
        mutator: "javascript",
        packageManager: "npm",
        reporters: [
            "html",
            "baseline",
            "clear-text",
            "progress",
            // "dashboard",
        ],
        testRunner: "jest",
        thresholds: {
            break: 50,
            high: 80,
            low: 60,
        },
        transpilers: [],
    });
};
