/* eslint-disable capitalized-comments, max-len */
module.exports = {
    "extends": [
        "eslint:recommended",
        "plugin:jest/recommended",
    ],
    "root": true,
    "env": {
        "commonjs": true
    },
    "parserOptions": {
        "ecmaVersion": 5,
        "sourceType": "module"
    },
    "plugins": [
        "compat",
        "immutable"
    ],
    "rules": {
        "compat/compat": "error",
        "immutable/no-let": 2,
        "immutable/no-this": 2,
        "immutable/no-mutation": ["error", {
            exceptions: [{
                object: "module",
                property: "exports",
            }]
        }],
        "indent": [
            "error",
            4
        ],
        "line-comment-position": 2,
        "linebreak-style": [
            "error",
            "unix"
        ],
        "max-len": 2,
        "no-inline-comments": 2,
        "no-magic-numbers": 2,
        "no-param-reassign": 2,
        "no-shadow": 2,
        "no-undef": 2,
        "no-unused-vars": [
            "error",
            {
                "varsIgnorePattern": "_|__|___",
            }
        ],
        "no-var": 2,
        "no-warning-comments": 1,
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "sort-keys": 2
    },
    "overrides": [
        {
            "env": {
                "es6": true,
                "node": true
            },
            "files": [
                "rollup.config.js",
                "stryker.conf.js",
                "src/**/*.spec.js",
                "src/testUtils.js",
            ],
            "parserOptions": {
                "ecmaVersion": 2017,
                "sourceType": "module"
            },
            "plugins": [
                "jest"
            ],
            "rules": {
                "compat/compat": 0,
                "jest/no-disabled-tests": "warn",
                "jest/no-focused-tests": "error",
                "jest/no-identical-title": "error",
                "jest/prefer-to-have-length": "warn",
                "jest/valid-expect": "error",
                "max-len": 0,
                "no-magic-numbers": 0,
            }
        },
    ],
};
