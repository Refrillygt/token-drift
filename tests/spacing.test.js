import { describe, it, expect, beforeEach } from 'vitest';
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

describe('token-drift/spacing', () => {
    it('runs RuleTester cases', () => {
        ruleTester.run('token-drift/spacing', spacingRule, {
            valid: [
                {
                    code: `const El = () => <div style={{ padding: 12 }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                },
                {
                    code: `const El = () => <div style={{ padding: 200 }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                },
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
            invalid: [
                {
                    code: `const El = () => <div style={{ padding: 13 }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [
                        {
                            messageId: 'drift',
                            data: {
                                property: 'padding',
                                value: '13',
                                tokenName: 'md',
                                tokenValue: '12',
                            },
                        },
                    ],
                },
                {
                    code: `const El = () => <div style={{ padding: 13, marginTop: 9 }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [{ messageId: 'drift' }, { messageId: 'drift' }],
                },
                {
                    code: `const El = () => <div style={{ padding: 20 }} />;`,
                    options: [{ tokens: TOKENS_PATH, tolerance: 5 }],
                    errors: [
                        {
                            messageId: 'drift',
                            data: {
                                property: 'padding',
                                value: '20',
                                tokenName: 'lg',
                                tokenValue: '16',
                            },
                        },
                    ],
                },
                {
                    // string "13px" value should be detected too, not just numeric literal
                    code: `const El = () => <div style={{ padding: "13px" }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [{ messageId: 'drift' }],
                },
                {
                    // ignore comment NOT directly above (blank line gap) → should still warn
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

    it('throws when "tokens" option is missing (calling create() directly)', () => {
        const fakeContext = {
            options: [{}],
            cwd: process.cwd(),
        };
        expect(() => spacingRule.create(fakeContext)).toThrow(
            /"tokens" option is required/
        );
    });
});

describe('token-drift/spacing styled-components', () => {
    it('detects drift in styled.div`` template literal', () => {
        ruleTester.run('token-drift/spacing', spacingRule, {
            valid: [
                {
                    code: 'const Box = styled.div`\n  padding: 12px;\n`;',
                    options: [{ tokens: TOKENS_PATH }],
                },
            ],
            invalid: [
                {
                    code: 'const Box = styled.div`\n  padding: 13px;\n`;',
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [{ messageId: 'drift' }],
                },
            ],
        });
    });
});
