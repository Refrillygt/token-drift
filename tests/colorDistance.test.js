import { describe, it, expect } from 'vitest';
import {
    parseColor,
    colorEuclideanDistance,
    findNearestColorToken,
} from '../src/utils/colorDistance.js';

describe('parseColor', () => {
    it('1. parses all supported formats (hex3, hex6, rgb, rgba) into correct RGB', () => {
        expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0 });
        expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 });
        expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({
            r: 255,
            g: 0,
            b: 0,
        });
    });

    it('2. returns null for invalid strings', () => {
        expect(parseColor('not-a-color')).toBeNull();
        expect(parseColor('#ff00')).toBeNull();
        expect(parseColor('rgb(300, 0, 0)')).toBeNull();
        expect(parseColor(123)).toBeNull();
    });

    it('6. is case-insensitive for hex (#FF0000 equals #ff0000)', () => {
        expect(parseColor('#FF0000')).toEqual(parseColor('#ff0000'));
    });
});

describe('colorEuclideanDistance', () => {
    it('computes distance correctly', () => {
        const distance = colorEuclideanDistance(
            { r: 0, g: 0, b: 0 },
            { r: 3, g: 4, b: 0 }
        );
        expect(distance).toBe(5); // 3-4-5 triangle
    });
});

describe('findNearestColorToken', () => {
    const colorTokens = [
        { name: 'primary', value: '#3366FF' },
        { name: 'danger', value: '#DC3545' },
    ];

    it('3. finds a token within tolerance', () => {
        // #3467FE is very close to #3366FF
        const result = findNearestColorToken('#3467FE', colorTokens, 20);
        expect(result).not.toBeNull();
        expect(result.token.name).toBe('primary');
    });

    it('4. exact match with a token → returns null', () => {
        const result = findNearestColorToken('#3366FF', colorTokens, 20);
        expect(result).toBeNull();
    });

    it('4b. exact match via different format (rgb vs hex) → returns null', () => {
        const result = findNearestColorToken(
            'rgb(51, 102, 255)',
            colorTokens,
            20
        );
        expect(result).toBeNull();
    });

    it('5. color far from all tokens → returns null', () => {
        const result = findNearestColorToken('#00FF00', colorTokens, 20);
        expect(result).toBeNull();
    });

    it('5b. unparseable colorString → returns null', () => {
        const result = findNearestColorToken('not-a-color', colorTokens, 20);
        expect(result).toBeNull();
    });

    it('empty token array → returns null (no error)', () => {
        const result = findNearestColorToken('#3467FE', [], 20);
        expect(result).toBeNull();
    });
});
