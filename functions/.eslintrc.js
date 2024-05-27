module.exports = {
    env: {
        es6: true,
        node: true,
    },
    parserOptions: {
        "ecmaVersion": 2018,
    },
    extends: [
        "eslint:recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "google",
        // "google",
    ],
    rules: {
        "no-restricted-globals": ["error", "name", "length"],
        "prefer-arrow-callback": "error",
        "quotes": ["error", "double", { "allowTemplateLiterals": true }],
        "no-unused-vars": ["warn", { "args": "none" }],
    },
    overrides: [
        {
            files: ["**/*.spec.*"],
            env: {
                mocha: true,
            },
            rules: {},
        },
    ],
    globals: {},
};
