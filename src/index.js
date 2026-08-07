import spacing from './rules/spacing.js';
import color from './rules/color.js';

const plugin = {
    meta: {
        name: 'token-drift',
        version: '0.1.0',
    },
    rules: {
        spacing,
        color,
    },
    configs: {},
};

plugin.configs.recommended = {
    name: 'token-drift/recommended',
    plugins: { 'token-drift': plugin },
    rules: {
        'token-drift/spacing': 'warn',
        'token-drift/color': 'warn',
    },
};

export default plugin;
