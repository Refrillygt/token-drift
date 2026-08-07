/**
 * Minimal CSS declaration parser for styled-components/emotion template
 * literals. Not a full CSS parser — only extracts "property: value;" pairs.
 * Declarations with a dynamic ${...} interpolation are skipped since the
 * value can't be statically evaluated.
 */
export function parseCssDeclarations(cssText) {
    const declarations = [];

    // Value = either a "${...}" block (kept intact) or any char except ; { }.
    // No nested quantifiers → safe against ReDoS.
    const DECLARATION_PATTERN =
        /([a-zA-Z-]+)\s*:\s*((?:\$\{[^}]*\}|[^;{}])+);?/g;

    let match;
    while ((match = DECLARATION_PATTERN.exec(cssText)) !== null) {
        const property = match[1].trim();
        const rawValue = match[2];
        const value = rawValue.trim();

        if (value.includes('${')) {
            continue; // dynamic value, can't check statically
        }

        const offset = match.index + match[0].indexOf(value, match[1].length);
        declarations.push({ property, value, offset });
    }

    return declarations;
}

export function normalizeCssPropertyName(property) {
    return property.trim().toLowerCase();
}
