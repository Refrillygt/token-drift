import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
    loadTokens,
    loadTokensSync,
    loadTokensCached,
    loadTokensCachedSync,
    clearTokenCache,
} from '../src/utils/loadTokens.js';

let tmpDir;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-drift-test-'));
    clearTokenCache();
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadTokens', () => {
    it('1. loads a valid JSON file → normalized result is correct', async () => {
        const tokenPath = path.join(tmpDir, 'tokens.json');
        fs.writeFileSync(
            tokenPath,
            JSON.stringify({
                spacing: { sm: 8, md: 12 },
                color: { primary: '#3366FF' },
            })
        );

        const result = await loadTokens('tokens.json', tmpDir);

        expect(result.spacing).toEqual(
            expect.arrayContaining([
                { name: 'sm', value: 8 },
                { name: 'md', value: 12 },
            ])
        );
        expect(result.color).toEqual([{ name: 'primary', value: '#3366FF' }]);
    });

    it('2. loads a valid .js file with module.exports → normalized result is correct', async () => {
        const tokenPath = path.join(tmpDir, 'tokens.cjs');
        fs.writeFileSync(
            tokenPath,
            `module.exports = { spacing: { lg: 16 }, color: { danger: "#DC3545" } };`
        );

        const result = await loadTokens('tokens.cjs', tmpDir);

        expect(result.spacing).toEqual([{ name: 'lg', value: 16 }]);
        expect(result.color).toEqual([{ name: 'danger', value: '#DC3545' }]);
    });

    it('3. file not found → throws Error', async () => {
        await expect(loadTokens('does-not-exist.json', tmpDir)).rejects.toThrow(
            /not found/
        );
    });

    it('4. invalid format (not an object) → throws Error', async () => {
        const tokenPath = path.join(tmpDir, 'bad.json');
        fs.writeFileSync(tokenPath, JSON.stringify([1, 2, 3]));

        await expect(loadTokens('bad.json', tmpDir)).rejects.toThrow(
            /must be an object/
        );
    });

    it('4b. spacing field with a non-number value → throws Error', async () => {
        const tokenPath = path.join(tmpDir, 'bad2.json');
        fs.writeFileSync(tokenPath, JSON.stringify({ spacing: { sm: '8px' } }));

        await expect(loadTokens('bad2.json', tmpDir)).rejects.toThrow(
            /must be a number/
        );
    });

    it('5. path traversal outside projectRoot → throws Error, outside file is NOT read', async () => {
        const parentDir = path.dirname(tmpDir);
        const secretPath = path.join(parentDir, `secret-${Date.now()}.json`);
        fs.writeFileSync(secretPath, JSON.stringify({ spacing: { sm: 1 } }));

        const readFileSpy = vi.spyOn(fs, 'readFileSync');

        try {
            await expect(
                loadTokens('../' + path.basename(secretPath), tmpDir)
            ).rejects.toThrow(/outside the project root/);

            expect(readFileSpy).not.toHaveBeenCalledWith(
                secretPath,
                expect.anything()
            );
        } finally {
            readFileSpy.mockRestore();
            fs.rmSync(secretPath, { force: true });
        }
    });

    it('6. loadTokensCached() called twice with the same path → file is read only once', async () => {
        const tokenPath = path.join(tmpDir, 'tokens.json');
        fs.writeFileSync(tokenPath, JSON.stringify({ spacing: { sm: 8 } }));

        const readFileSpy = vi.spyOn(fs, 'readFileSync');

        const first = await loadTokensCached('tokens.json', tmpDir);
        const second = await loadTokensCached('tokens.json', tmpDir);

        expect(first).toEqual(second);
        const callsForTokenFile = readFileSpy.mock.calls.filter(
            (args) => args[0] === tokenPath
        );
        expect(callsForTokenFile.length).toBe(1);

        readFileSpy.mockRestore();
    });
});

describe('loadTokensSync', () => {
    it('1. loads a valid JSON file synchronously', () => {
        const tokenPath = path.join(tmpDir, 'sync-tokens.json');
        fs.writeFileSync(
            tokenPath,
            JSON.stringify({
                spacing: { sm: 8 },
                color: { primary: '#3366FF' },
            })
        );
        const result = loadTokensSync('sync-tokens.json', tmpDir);
        expect(result.spacing).toEqual([{ name: 'sm', value: 8 }]);
    });

    it('2. loads a valid .cjs file synchronously via require()', () => {
        const tokenPath = path.join(tmpDir, 'sync-tokens.cjs');
        fs.writeFileSync(
            tokenPath,
            `module.exports = { spacing: { lg: 16 } };`
        );
        const result = loadTokensSync('sync-tokens.cjs', tmpDir);
        expect(result.spacing).toEqual([{ name: 'lg', value: 16 }]);
    });

    it('3. throws an error for ESM "export default" .js files (require() cannot parse ESM syntax)', () => {
        const tokenPath = path.join(tmpDir, 'sync-esm.js');
        fs.writeFileSync(tokenPath, `export default { spacing: { sm: 8 } };`);
        expect(() => loadTokensSync('sync-esm.js', tmpDir)).toThrow();
    });

    it('4. blocks path traversal synchronously', () => {
        const parentDir = path.dirname(tmpDir);
        const secretPath = path.join(
            parentDir,
            `secret-sync-${Date.now()}.json`
        );
        fs.writeFileSync(secretPath, JSON.stringify({ spacing: { sm: 1 } }));
        try {
            expect(() =>
                loadTokensSync('../' + path.basename(secretPath), tmpDir)
            ).toThrow(/outside the project root/);
        } finally {
            fs.rmSync(secretPath, { force: true });
        }
    });

    it('5. throws for a missing file', () => {
        expect(() => loadTokensSync('does-not-exist.json', tmpDir)).toThrow(
            /not found/
        );
    });

    it('6. throws for an unsupported extension', () => {
        const tokenPath = path.join(tmpDir, 'tokens.txt');
        fs.writeFileSync(tokenPath, 'not json');
        expect(() => loadTokensSync('tokens.txt', tmpDir)).toThrow(
            /Unsupported token file extension/
        );
    });

    it('7. throws for invalid JSON syntax', () => {
        const tokenPath = path.join(tmpDir, 'invalid.json');
        fs.writeFileSync(tokenPath, '{ not valid json');
        expect(() => loadTokensSync('invalid.json', tmpDir)).toThrow(
            /not valid JSON/
        );
    });

    it('8. throws when .cjs file exports a function', () => {
        const tokenPath = path.join(tmpDir, 'fn-export.cjs');
        fs.writeFileSync(tokenPath, `module.exports = function () {};`);
        expect(() => loadTokensSync('fn-export.cjs', tmpDir)).toThrow(
            /exports a function/
        );
    });
});

describe('loadTokensCachedSync', () => {
    it('called twice with the same path → file read only once', () => {
        const tokenPath = path.join(tmpDir, 'cached-sync.json');
        fs.writeFileSync(tokenPath, JSON.stringify({ spacing: { sm: 8 } }));

        const readFileSpy = vi.spyOn(fs, 'readFileSync');

        const first = loadTokensCachedSync('cached-sync.json', tmpDir);
        const second = loadTokensCachedSync('cached-sync.json', tmpDir);

        expect(first).toEqual(second);
        const callsForTokenFile = readFileSpy.mock.calls.filter(
            (args) => args[0] === tokenPath
        );
        expect(callsForTokenFile.length).toBe(1);

        readFileSpy.mockRestore();
    });
});

describe('loadTokens async — additional edge cases', () => {
    it('throws for an unsupported extension', async () => {
        const tokenPath = path.join(tmpDir, 'tokens.txt');
        fs.writeFileSync(tokenPath, 'not json');
        await expect(loadTokens('tokens.txt', tmpDir)).rejects.toThrow(
            /Unsupported token file extension/
        );
    });

    it('throws when .js file exports a function', async () => {
        const tokenPath = path.join(tmpDir, 'fn-export.mjs');
        fs.writeFileSync(tokenPath, `export default function () {};`);
        await expect(loadTokens('fn-export.mjs', tmpDir)).rejects.toThrow();
    });
});
