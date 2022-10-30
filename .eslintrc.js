module.exports = {
    env: {
        es2021: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        indent: ['error', 4],
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
};
