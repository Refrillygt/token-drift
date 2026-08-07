/**
 * Find the nearest spacing token to a numeric value, within a tolerance.
 *
 * Design decision: if `value` is EXACTLY equal to one of the token values,
 * this function returns null (no warning needed). Rationale: the goal of
 * this rule is to catch likely TYPOS/oversights, not to force developers to
 * write token references (`tokens.spacing.md`) instead of literal numbers.
 * If the written number already matches an official token value exactly,
 * the developer is already "visually correct" — there's no drift to report.
 *
 * @param {number} value - the value written by the user in code, e.g. 13
 * @param {Array<{name: string, value: number}>} tokens - list of spacing tokens
 * @param {number} tolerance - tolerance distance threshold
 * @param {'absolute'|'percentage'} toleranceType - tolerance unit:
 *   'absolute' → tolerance is a direct px value
 *   'percentage' → tolerance as a percentage of the token value (tolerance/100 * token.value)
 * @returns {{token: {name: string, value: number}, distance: number} | null}
 *   The nearest token with its distance if within tolerance and not identical;
 *   null if there's no candidate or the value already matches a token exactly.
 */
export function findNearestNumericToken(
    value,
    tokens,
    tolerance,
    toleranceType
) {
    if (!Array.isArray(tokens) || tokens.length === 0) {
        return null;
    }

    // If value exactly matches one of the tokens → no warning needed.
    const exactMatch = tokens.some((token) => token.value === value);
    if (exactMatch) {
        return null;
    }

    let nearest = null;
    let smallestDistance = Infinity;

    for (const token of tokens) {
        const distance = Math.abs(value - token.value);
        if (distance < smallestDistance) {
            smallestDistance = distance;
            nearest = token;
        }
    }

    if (nearest === null) {
        return null;
    }

    const effectiveTolerance =
        toleranceType === 'percentage'
            ? (tolerance / 100) * nearest.value
            : tolerance;

    if (smallestDistance <= effectiveTolerance) {
        return { token: nearest, distance: smallestDistance };
    }

    return null;
}
