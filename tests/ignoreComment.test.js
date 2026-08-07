import { describe, it, beforeEach } from 'vitest';
import { RuleTester } from 'eslint';
import spacingRule from '../src/rules/spacing.js';
import { clearTokenCache } from '../src/utils/loadTokens.js';

const TOKENS_PATH = 'tests/fixtures/tokens.json';

beforeEach(() => {
    clearTokenCache();
});

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parserOptions: {
            ecmaFeatures: { jsx: true },
        },
    },
});

describe('ignoreComment', () => {
    it('ignores a property when the comment is directly above it', () => {
        ruleTester.run('token-drift/spacing', spacingRule, {
            valid: [
                {
                    code: [
                        'const El = () => (',
                        '  <div style={{',
                        '    // token-drift-disable-next-line',
                        '    padding: 13,',
                        '  }} />',
                        ');',
                    ].join('\n'),
                    options: [{ tokens: TOKENS_PATH }],
                },
            ],
            invalid: [],
        });
    });

    it('does NOT ignore when there is a blank line between the comment and the property', () => {
        ruleTester.run('token-drift/spacing', spacingRule, {
            valid: [],
            invalid: [
                {
                    code: [
                        'const El = () => (',
                        '  <div style={{',
                        '    // token-drift-disable-next-line',
                        '',
                        '    padding: 13,',
                        '  }} />',
                        ');',
                    ].join('\n'),
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [{ messageId: 'drift' }],
                },
            ],
        });
    });

    it('does NOT ignore an unrelated comment text', () => {
        ruleTester.run('token-drift/spacing', spacingRule, {
            valid: [],
            invalid: [
                {
                    code: [
                        'const El = () => (',
                        '  <div style={{',
                        '    // some other comment',
                        '    padding: 13,',
                        '  }} />',
                        ');',
                    ].join('\n'),
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [{ messageId: 'drift' }],
                },
            ],
        });
    });
});
