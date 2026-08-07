import tokenDrift from '../src/index.js';

export default [
    {
        files: ['**/*.jsx'],
        plugins: { 'token-drift': tokenDrift },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        rules: {
            'token-drift/spacing': [
                'warn',
                { tokens: 'playground/design-tokens.json' },
            ],
            'token-drift/color': [
                'warn',
                { tokens: 'playground/design-tokens.json' },
            ],
        },
    },
];
