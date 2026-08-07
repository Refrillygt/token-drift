import { loadTokensCachedSync } from '../utils/loadTokens.js';
import { findNearestColorToken } from '../utils/colorDistance.js';
import { isIgnoredByComment } from '../utils/ignoreComment.js';
import {
    isStyledTemplate,
    iterateCssDeclarations,
} from '../utils/cssTemplate.js';

const COLOR_PROPERTIES = new Set(['color', 'backgroundColor', 'borderColor']);
const COLOR_STRING_PATTERN = /^(#[0-9a-fA-F]{3,6}|rgba?\(.*\))$/;

function isStyleAttribute(node) {
    return (
        node.type === 'JSXAttribute' &&
        node.name?.type === 'JSXIdentifier' &&
        node.name.name === 'style'
    );
}

function extractColorString(node) {
    if (node.type !== 'Literal' || typeof node.value !== 'string') return null;
    const trimmed = node.value.trim();
    return COLOR_STRING_PATTERN.test(trimmed) ? trimmed : null;
}

/** @type {import('eslint').Rule.RuleModule} */
const colorRule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Detect color values that closely match a design token, likely an unintentional near-miss.',
            category: 'Best Practices',
            recommended: false,
        },
        schema: [
            {
                type: 'object',
                properties: {
                    tokens: { type: 'string' },
                    tolerance: { type: 'number', default: 20 },
                    toleranceType: {
                        type: 'string',
                        enum: ['absolute', 'percentage'],
                        default: 'absolute',
                    },
                },
                required: ['tokens'],
                additionalProperties: false,
            },
        ],
        messages: {
            drift: '{{property}}: {{value}} is close to token `{{tokenName}}` ({{tokenValue}}). Consider using this token instead.',
        },
    },

    create(context) {
        const options = context.options[0] ?? {};
        if (!options.tokens) {
            throw new Error(
                'token-drift/color: the "tokens" option is required (path to your token file).'
            );
        }

        const tolerance = options.tolerance ?? 20;
        const projectRoot = context.cwd ?? context.getCwd?.() ?? process.cwd();

        const tokens = loadTokensCachedSync(options.tokens, projectRoot);
        const colorTokens = tokens.color;

        const sourceCode = context.sourceCode ?? context.getSourceCode();

        return {
            JSXAttribute(node) {
                if (!isStyleAttribute(node)) return;
                if (node.value?.type !== 'JSXExpressionContainer') return;
                if (node.value.expression.type !== 'ObjectExpression') return;

                for (const property of node.value.expression.properties) {
                    if (property.type !== 'Property') continue;
                    const key = property.key;
                    const propName =
                        key.type === 'Identifier'
                            ? key.name
                            : key.type === 'Literal'
                              ? String(key.value)
                              : null;

                    if (!propName || !COLOR_PROPERTIES.has(propName)) continue;

                    const colorString = extractColorString(property.value);
                    if (colorString === null) continue;

                    if (
                        isIgnoredByComment(
                            sourceCode,
                            property,
                            'token-drift-disable-next-line'
                        )
                    ) {
                        continue;
                    }

                    const match = findNearestColorToken(
                        colorString,
                        colorTokens,
                        tolerance
                    );

                    if (match) {
                        context.report({
                            node: property,
                            messageId: 'drift',
                            data: {
                                property: propName,
                                value: colorString,
                                tokenName: match.token.name,
                                tokenValue: match.token.value,
                            },
                        });
                    }
                }
            },

            TaggedTemplateExpression(node) {
                if (!isStyledTemplate(node)) return;

                for (const decl of iterateCssDeclarations(node.quasi)) {
                    if (!COLOR_PROPERTIES.has(decl.property)) continue;
                    if (!COLOR_STRING_PATTERN.test(decl.value)) continue;

                    const match = findNearestColorToken(
                        decl.value,
                        colorTokens,
                        tolerance
                    );
                    if (match) {
                        context.report({
                            loc: {
                                start: sourceCode.getLocFromIndex(decl.start),
                                end: sourceCode.getLocFromIndex(decl.end),
                            },
                            messageId: 'drift',
                            data: {
                                property: decl.property,
                                value: decl.value,
                                tokenName: match.token.name,
                                tokenValue: match.token.value,
                            },
                        });
                    }
                }
            },
        };
    },
};

export default colorRule;
