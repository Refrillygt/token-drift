import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import spacingRule from '../src/rules/spacing.js';
import colorRule from '../src/rules/color.js';
import { clearTokenCache } from '../src/utils/loadTokens.js';

const TOKENS_PATH = 'tests/fixtures/tokens.json';

function lint(code, rule, ruleName, options) {
    clearTokenCache();
    const linter = new Linter();
    return linter.verify(code, {
        languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
        plugins: { 'token-drift': { rules: { [ruleName]: rule } } },
        rules: { [`token-drift/${ruleName}`]: ['warn', options] },
    });
}

describe('styled-components template literal support', () => {
    it('1. detects spacing drift in styled.div``', () => {
        const code = `
      import styled from 'styled-components';
      const Box = styled.div\`
        padding: 13px;
      \`;
    `;
        const messages = lint(code, spacingRule, 'spacing', {
            tokens: TOKENS_PATH,
        });
        expect(messages).toHaveLength(1);
        expect(messages[0].message).toMatch(/padding/);
    });

    it('2. detects color drift in styled(Component)``', () => {
        const code = `
      const Box = styled(Base)\`
        color: #3467FE;
      \`;
    `;
        const messages = lint(code, colorRule, 'color', {
            tokens: TOKENS_PATH,
        });
        expect(messages).toHaveLength(1);
    });

    it('3. skips dynamic interpolated values', () => {
        const code = `
      const Box = styled.div\`
        padding: \${props => props.spacing}px;
      \`;
    `;
        const messages = lint(code, spacingRule, 'spacing', {
            tokens: TOKENS_PATH,
        });
        expect(messages).toHaveLength(0);
    });

    it('4. exact token match → no warning', () => {
        const code = `
      const Box = styled.div\`
        padding: 12px;
      \`;
    `;
        const messages = lint(code, spacingRule, 'spacing', {
            tokens: TOKENS_PATH,
        });
        expect(messages).toHaveLength(0);
    });

    it('5. non-styled tagged template is ignored (e.g. gql``)', () => {
        const code = `
      const Q = gql\`
        padding: 13px;
      \`;
    `;
        const messages = lint(code, spacingRule, 'spacing', {
            tokens: TOKENS_PATH,
        });
        expect(messages).toHaveLength(0);
    });
});
