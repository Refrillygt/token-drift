/**
 * Parse a color string into an RGB object.
 * Supports: 3-digit hex (#f00), 6-digit hex (#ff0000), rgb(255, 0, 0),
 * and rgba(255, 0, 0, 0.5).
 *
 * Returns null (does NOT throw) for unrecognized formats, because the
 * calling rule should simply skip values it can't parse rather than
 * crashing the entire lint run.
 *
 * @param {string} colorString
 * @returns {{r: number, g: number, b: number} | null}
 */
export function parseColor(colorString) {
    if (typeof colorString !== 'string') {
        return null;
    }

    const value = colorString.trim();

    // 6-digit hex: #ff0000
    const hex6Match = /^#([0-9a-fA-F]{6})$/.exec(value);
    if (hex6Match) {
        const hex = hex6Match[1];
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        };
    }

    // 3-digit hex: #f00
    const hex3Match = /^#([0-9a-fA-F]{3})$/.exec(value);
    if (hex3Match) {
        const hex = hex3Match[1];
        const r = hex[0] + hex[0];
        const g = hex[1] + hex[1];
        const b = hex[2] + hex[2];
        return {
            r: parseInt(r, 16),
            g: parseInt(g, 16),
            b: parseInt(b, 16),
        };
    }

    // rgb(...) / rgba(...)
    const rgbMatch =
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/.exec(
            value
        );
    if (rgbMatch) {
        const r = Number(rgbMatch[1]);
        const g = Number(rgbMatch[2]);
        const b = Number(rgbMatch[3]);
        if (r > 255 || g > 255 || b > 255) {
            return null;
        }
        return { r, g, b };
    }

    return null;
}

/**
 * Compute a simple Euclidean distance between two RGB colors.
 *
 * @param {{r: number, g: number, b: number}} rgbA
 * @param {{r: number, g: number, b: number}} rgbB
 * @returns {number}
 */
export function colorEuclideanDistance(rgbA, rgbB) {
    const dr = rgbA.r - rgbB.r;
    const dg = rgbA.g - rgbB.g;
    const db = rgbA.b - rgbB.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Find the nearest color token to a given color string, within a tolerance.
 *
 * @param {string} colorString - the color value written by the user, e.g. "#3467FE"
 * @param {Array<{name: string, value: string}>} colorTokens - list of color tokens (hex format)
 * @param {number} tolerance - maximum Euclidean RGB distance to still be considered "drift"
 * @returns {{token: {name: string, value: string}, distance: number} | null}
 *   The nearest token with its distance if within tolerance and not identical;
 *   null if colorString can't be parsed, no token is within tolerance, or it's an exact match.
 */
export function findNearestColorToken(colorString, colorTokens, tolerance) {
    const parsedInput = parseColor(colorString);
    if (parsedInput === null) {
        return null;
    }

    if (!Array.isArray(colorTokens) || colorTokens.length === 0) {
        return null;
    }

    let nearest = null;
    let smallestDistance = Infinity;

    for (const token of colorTokens) {
        const parsedToken = parseColor(token.value);
        if (parsedToken === null) {
            continue;
        }

        const distance = colorEuclideanDistance(parsedInput, parsedToken);

        // Exact match (after normalization to RGB) → no warning needed.
        if (distance === 0) {
            return null;
        }

        if (distance < smallestDistance) {
            smallestDistance = distance;
            nearest = token;
        }
    }

    if (nearest === null) {
        return null;
    }

    if (smallestDistance <= tolerance) {
        return { token: nearest, distance: smallestDistance };
    }

    return null;
}
