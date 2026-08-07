import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const tokenCache = new Map();
const tokenCacheSync = new Map();

function isPathInsideRoot(targetPath, rootPath) {
    const relative = path.relative(rootPath, targetPath);
    return (
        relative !== '' &&
        !relative.startsWith('..') &&
        !path.isAbsolute(relative)
    );
}

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTokens(raw, sourcePath) {
    if (!isPlainObject(raw)) {
        throw new Error(
            `token-drift: Token file "${sourcePath}" must be an object, ` +
                `but found type "${Array.isArray(raw) ? 'array' : typeof raw}".`
        );
    }

    const spacingRaw = raw.spacing;
    const colorRaw = raw.color;

    if (spacingRaw !== undefined && !isPlainObject(spacingRaw)) {
        throw new Error(
            `token-drift: The "spacing" field in token file "${sourcePath}" must be an object ` +
                `(e.g. { sm: 8, md: 12 }), but found type "${typeof spacingRaw}".`
        );
    }
    if (colorRaw !== undefined && !isPlainObject(colorRaw)) {
        throw new Error(
            `token-drift: The "color" field in token file "${sourcePath}" must be an object ` +
                `(e.g. { primary: "#3366FF" }), but found type "${typeof colorRaw}".`
        );
    }

    const spacing = Object.entries(spacingRaw ?? {}).map(([name, value]) => {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            throw new Error(
                `token-drift: Spacing token "${name}" in "${sourcePath}" must be a number, ` +
                    `but found "${value}" (${typeof value}).`
            );
        }
        return { name, value };
    });

    const color = Object.entries(colorRaw ?? {}).map(([name, value]) => {
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error(
                `token-drift: Color token "${name}" in "${sourcePath}" must be a hex string, ` +
                    `but found "${value}" (${typeof value}).`
            );
        }
        return { name, value };
    });

    if (spacing.length === 0 && color.length === 0) {
        throw new Error(
            `token-drift: Token file "${sourcePath}" does not contain a valid "spacing" or ` +
                `"color" field. Expected format: { "spacing": { "sm": 8 }, "color": { "primary": "#3366FF" } }.`
        );
    }

    return { spacing, color };
}

function resolveAndValidatePath(tokenFilePath, projectRoot) {
    const absoluteRoot = path.resolve(projectRoot);
    const absoluteTokenPath = path.isAbsolute(tokenFilePath)
        ? path.normalize(tokenFilePath)
        : path.resolve(absoluteRoot, tokenFilePath);

    if (!isPathInsideRoot(absoluteTokenPath, absoluteRoot)) {
        throw new Error(
            `token-drift: Token path "${tokenFilePath}" is outside the project root ` +
                `"${absoluteRoot}". This is blocked to protect against path traversal. ` +
                `Make sure the "tokens" option points to a file inside the project.`
        );
    }

    if (!fs.existsSync(absoluteTokenPath)) {
        throw new Error(
            `token-drift: Token file not found at "${absoluteTokenPath}". ` +
                `Check the "tokens" option in your ESLint config.`
        );
    }

    return absoluteTokenPath;
}

export async function loadTokens(tokenFilePath, projectRoot) {
    const absoluteTokenPath = resolveAndValidatePath(
        tokenFilePath,
        projectRoot
    );
    const ext = path.extname(absoluteTokenPath).toLowerCase();

    if (ext === '.json') {
        let rawText;
        try {
            rawText = fs.readFileSync(absoluteTokenPath, 'utf-8');
        } catch (err) {
            throw new Error(
                `token-drift: Failed to read token file "${absoluteTokenPath}": ${err.message}`
            );
        }

        let parsed;
        try {
            parsed = JSON.parse(rawText);
        } catch (err) {
            throw new Error(
                `token-drift: Token file "${absoluteTokenPath}" is not valid JSON: ${err.message}`
            );
        }

        return normalizeTokens(parsed, absoluteTokenPath);
    }

    if (ext === '.js' || ext === '.cjs') {
        let mod;
        try {
            mod = await import(pathToFileURL(absoluteTokenPath).href);
        } catch (err) {
            throw new Error(
                `token-drift: Failed to load token file "${absoluteTokenPath}": ${err.message}`
            );
        }

        const raw = mod.default ?? mod;

        if (typeof raw === 'function') {
            throw new Error(
                `token-drift: Token file "${absoluteTokenPath}" exports a function, ` +
                    `but it should export a token object directly.`
            );
        }
        if (!isPlainObject(raw)) {
            throw new Error(
                `token-drift: Token file "${absoluteTokenPath}" does not export a valid object ` +
                    `(export default {...} or module.exports = {...}).`
            );
        }

        return normalizeTokens(raw, absoluteTokenPath);
    }

    throw new Error(
        `token-drift: Unsupported token file extension "${ext}" at "${absoluteTokenPath}". ` +
            `Use a .json, .js, or .cjs file.`
    );
}

export function loadTokensSync(tokenFilePath, projectRoot) {
    const absoluteTokenPath = resolveAndValidatePath(
        tokenFilePath,
        projectRoot
    );
    const ext = path.extname(absoluteTokenPath).toLowerCase();

    if (ext === '.json') {
        let rawText;
        try {
            rawText = fs.readFileSync(absoluteTokenPath, 'utf-8');
        } catch (err) {
            throw new Error(
                `token-drift: Failed to read token file "${absoluteTokenPath}": ${err.message}`
            );
        }

        let parsed;
        try {
            parsed = JSON.parse(rawText);
        } catch (err) {
            throw new Error(
                `token-drift: Token file "${absoluteTokenPath}" is not valid JSON: ${err.message}`
            );
        }

        return normalizeTokens(parsed, absoluteTokenPath);
    }

    if (ext === '.js' || ext === '.cjs') {
        let raw;
        try {
            delete require.cache[require.resolve(absoluteTokenPath)];
            raw = require(absoluteTokenPath);
        } catch (err) {
            throw new Error(
                `token-drift: Failed to load token file "${absoluteTokenPath}": ${err.message}. ` +
                    `If this file uses ESM "export default", switch to CommonJS ` +
                    `"module.exports = {...}" or rename it to .cjs — token-drift reads ` +
                    `.js/.cjs token files synchronously via require().`
            );
        }

        if (typeof raw === 'function') {
            throw new Error(
                `token-drift: Token file "${absoluteTokenPath}" exports a function, ` +
                    `but it should export a token object directly.`
            );
        }
        if (!isPlainObject(raw)) {
            throw new Error(
                `token-drift: Token file "${absoluteTokenPath}" does not export a valid object ` +
                    `(module.exports = {...}).`
            );
        }

        return normalizeTokens(raw, absoluteTokenPath);
    }

    throw new Error(
        `token-drift: Unsupported token file extension "${ext}" at "${absoluteTokenPath}". ` +
            `Use a .json, .js, or .cjs file.`
    );
}

export async function loadTokensCached(tokenFilePath, projectRoot) {
    const absoluteRoot = path.resolve(projectRoot);
    const cacheKey = path.isAbsolute(tokenFilePath)
        ? path.normalize(tokenFilePath)
        : path.resolve(absoluteRoot, tokenFilePath);

    if (tokenCache.has(cacheKey)) {
        return tokenCache.get(cacheKey);
    }

    const result = await loadTokens(tokenFilePath, projectRoot);
    tokenCache.set(cacheKey, result);
    return result;
}

export function loadTokensCachedSync(tokenFilePath, projectRoot) {
    const absoluteRoot = path.resolve(projectRoot);
    const cacheKey = path.isAbsolute(tokenFilePath)
        ? path.normalize(tokenFilePath)
        : path.resolve(absoluteRoot, tokenFilePath);

    if (tokenCacheSync.has(cacheKey)) {
        return tokenCacheSync.get(cacheKey);
    }

    const result = loadTokensSync(tokenFilePath, projectRoot);
    tokenCacheSync.set(cacheKey, result);
    return result;
}

export function clearTokenCache() {
    tokenCache.clear();
    tokenCacheSync.clear();
}
