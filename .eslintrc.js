module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "jest/globals": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module"
    },
    "plugins": [
        "immutable",
        "jest"
    ],
    "root": true,
    "rules": {
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
        "jest/no-disabled-tests": "warn",
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "jest/prefer-to-have-length": "warn",
        "jest/valid-expect": "error",
        "linebreak-style": [
            "error",
            "unix"
        ],
        "max-len": 2,
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
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "sort-keys": 2
    }
};
