import { describe, it, expect } from 'vitest';
import { findNearestNumericToken } from '../src/utils/numericDistance.js';

const spacingTokens = [
    { name: 'sm', value: 8 },
    { name: 'md', value: 12 },
    { name: 'lg', value: 16 },
];

describe('findNearestNumericToken', () => {
    it('1. value between two tokens, both within tolerance → picks the smallest distance', () => {
        // Using 11 to keep it unambiguous (closer to md)
        const result = findNearestNumericToken(
            11,
            spacingTokens,
            4,
            'absolute'
        );
        expect(result).not.toBeNull();
        expect(result.token.name).toBe('md');
        expect(result.distance).toBe(1);
    });

    it('2. value identical to a token → returns null', () => {
        const result = findNearestNumericToken(
            12,
            spacingTokens,
            4,
            'absolute'
        );
        expect(result).toBeNull();
    });

    it('3. value far from all tokens (exceeds tolerance) → returns null', () => {
        const result = findNearestNumericToken(
            100,
            spacingTokens,
            4,
            'absolute'
        );
        expect(result).toBeNull();
    });

    it('4. percentage tolerance mode works correctly', () => {
        // token md = 12, tolerance 10% → effective tolerance = 1.2
        // value 13 → distance 1 → 1 <= 1.2 → should match
        const withinResult = findNearestNumericToken(
            13,
            spacingTokens,
            10,
            'percentage'
        );
        expect(withinResult).not.toBeNull();
        expect(withinResult.token.name).toBe('md');

        // value 14 → distance to md = 2 → 2 > 1.2 → no match
        // (also confirm it doesn't match lg=16: distance 2, tolerance 10% * 16 = 1.6, still exceeded)
        const outsideResult = findNearestNumericToken(
            14,
            spacingTokens,
            10,
            'percentage'
        );
        expect(outsideResult).toBeNull();
    });

    it('5. empty token array → returns null (no error)', () => {
        const result = findNearestNumericToken(12, [], 4, 'absolute');
        expect(result).toBeNull();
    });

    it('6. negative value (e.g. negative margin) is handled correctly', () => {
        const negativeTokens = [
            { name: 'sm', value: -8 },
            { name: 'md', value: -12 },
        ];
        const result = findNearestNumericToken(
            -13,
            negativeTokens,
            4,
            'absolute'
        );
        expect(result).not.toBeNull();
        expect(result.token.name).toBe('md');
        expect(result.distance).toBe(1);
    });
});
