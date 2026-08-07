import { describe, it, expect } from 'vitest';
import {
    parseCssDeclarations,
    normalizeCssPropertyName,
} from '../src/utils/parseCssTemplate.js';

describe('parseCssDeclarations', () => {
    it('1. parses simple flat declarations', () => {
        const result = parseCssDeclarations(`
      padding: 13px;
      color: #3467FE;
    `);
        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ property: 'padding', value: '13px' }),
                expect.objectContaining({
                    property: 'color',
                    value: '#3467FE',
                }),
            ])
        );
    });

    it('2. skips declarations with interpolated values', () => {
        const result = parseCssDeclarations(`
      padding: ${'${'}props => props.spacing}px;
      color: #3467FE;
    `);
        expect(result).toHaveLength(1);
        expect(result[0].property).toBe('color');
    });

    it('3. handles declarations without a trailing semicolon (last line)', () => {
        const result = parseCssDeclarations(`padding: 13px`);
        expect(result).toEqual([
            expect.objectContaining({ property: 'padding', value: '13px' }),
        ]);
    });

    it('4. does not hang on adversarial input (ReDoS check)', () => {
        const adversarial = 'a'.repeat(50000) + ':' + 'b'.repeat(50000);
        const start = Date.now();
        parseCssDeclarations(adversarial);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(1000);
    });

    it('5. ignores empty/whitespace-only input', () => {
        expect(parseCssDeclarations('   \n  ')).toEqual([]);
    });
});

describe('normalizeCssPropertyName', () => {
    it('trims and lowercases property names', () => {
        expect(normalizeCssPropertyName('  Padding-Top  ')).toBe('padding-top');
    });
});
