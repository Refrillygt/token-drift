import { describe, it, expect, beforeEach } from 'vitest';
import { RuleTester } from 'eslint';
import colorRule from '../src/rules/color.js';
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

describe('token-drift/color', () => {
    it('runs RuleTester cases', () => {
        ruleTester.run('token-drift/color', colorRule, {
            valid: [
                {
                    code: `const El = () => <div style={{ color: "#3366FF" }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                },
                {
                    code: `const El = () => <div style={{ color: "#00FF00" }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                },
                {
                    code: [
                        'const El = () => (',
                        '  <div style={{',
                        '    // token-drift-disable-next-line',
                        '    backgroundColor: "#3467FE",',
                        '  }} />',
                        ');',
                    ].join('\n'),
                    options: [{ tokens: TOKENS_PATH }],
                },
            ],
            invalid: [
                {
                    code: `const El = () => <div style={{ color: "#3467FE" }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [
                        {
                            messageId: 'drift',
                            data: {
                                property: 'color',
                                value: '#3467FE',
                                tokenName: 'primary',
                                tokenValue: '#3366FF',
                            },
                        },
                    ],
                },
                {
                    code: `const El = () => <div style={{ borderColor: "rgb(52, 103, 254)" }} />;`,
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [{ messageId: 'drift' }],
                },
                {
                    code: `const El = () => <div style={{ backgroundColor: "#3467FE" }} />;`,
                    options: [{ tokens: TOKENS_PATH, tolerance: 50 }],
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
        expect(() => colorRule.create(fakeContext)).toThrow(
            /"tokens" option is required/
        );
    });
});

describe('token-drift/color styled-components', () => {
    it('detects color drift in styled(Component)`` template literal', () => {
        ruleTester.run('token-drift/color', colorRule, {
            valid: [],
            invalid: [
                {
                    code: 'const Box = styled(Base)`\n  color: #3467FE;\n`;',
                    options: [{ tokens: TOKENS_PATH }],
                    errors: [{ messageId: 'drift' }],
                },
            ],
        });
    });

    it('ignores non-styled tagged templates (e.g. gql``)', () => {
        ruleTester.run('token-drift/color', colorRule, {
            valid: [
                {
                    code: 'const Q = gql`\n  color: #3467FE;\n`;',
                    options: [{ tokens: TOKENS_PATH }],
                },
            ],
            invalid: [],
        });
    });
});
