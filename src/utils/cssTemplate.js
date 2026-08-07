import { parseCssDeclarations } from './parseCssTemplate.js';

/**
 * Detects styled.div``, styled(Comp)``, styled.div.attrs(...)``, and css``
 * tagged template expressions.
 */
export function isStyledTemplate(node) {
    if (node.type !== 'TaggedTemplateExpression') return false;
    const tag = node.tag;

    if (tag.type === 'Identifier' && tag.name === 'css') return true;
    if (tag.type === 'Identifier' && tag.name === 'styled') return true;

    if (tag.type === 'CallExpression') {
        return isStyledTemplate({
            type: 'TaggedTemplateExpression',
            tag: tag.callee,
        });
    }

    if (tag.type === 'MemberExpression') {
        let base = tag;
        while (base.type === 'MemberExpression') base = base.object;
        return base.type === 'Identifier' && base.name === 'styled';
    }

    return false;
}

/** Converts "padding-top" → "paddingTop" to match camelCase property sets. */
export function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Yields { property, value, start, end } for each parseable declaration
 * across all quasis of a template literal, with absolute source offsets.
 */
export function* iterateCssDeclarations(templateLiteral) {
    for (const quasi of templateLiteral.quasis) {
        const raw = quasi.value.raw;
        const base = quasi.range[0];

        for (const decl of parseCssDeclarations(raw)) {
            yield {
                property: kebabToCamel(decl.property),
                value: decl.value,
                start: base + decl.offset,
                end: base + decl.offset + decl.value.length,
            };
        }
    }
}
