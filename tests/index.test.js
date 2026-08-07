import { describe, it, expect } from 'vitest';
import plugin from '../src/index.js';

describe('plugin entry point', () => {
    it('1. exports meta with correct name and version', () => {
        expect(plugin.meta.name).toBe('token-drift');
        expect(plugin.meta.version).toBe('0.1.0');
    });

    it('2. exports both rules: spacing and color', () => {
        expect(plugin.rules).toHaveProperty('spacing');
        expect(plugin.rules).toHaveProperty('color');
        expect(typeof plugin.rules.spacing.create).toBe('function');
        expect(typeof plugin.rules.color.create).toBe('function');
    });

    it('3. exports a recommended config with both rules set to "warn" (never "error")', () => {
        const rules = plugin.configs.recommended.rules;
        expect(rules['token-drift/spacing']).toBe('warn');
        expect(rules['token-drift/color']).toBe('warn');
    });

    it('4. recommended config does not hardcode a "tokens" path (project-specific)', () => {
        const rules = plugin.configs.recommended.rules;
        // Severity-only strings (not [severity, options]) confirm no tokens path is baked in.
        expect(typeof rules['token-drift/spacing']).toBe('string');
        expect(typeof rules['token-drift/color']).toBe('string');
    });

    it('5. recommended config references the plugin itself under the "token-drift" namespace', () => {
        expect(plugin.configs.recommended.plugins['token-drift']).toBe(plugin);
    });
});
