import { loadTokensCachedSync } from '../utils/loadTokens.js';
import { findNearestNumericToken } from '../utils/numericDistance.js';
import { isIgnoredByComment } from '../utils/ignoreComment.js';
import {
    isStyledTemplate,
    iterateCssDeclarations,
} from '../utils/cssTemplate.js';

const SPACING_PROPERTIES = new Set([
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'gap',
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
]);

function extractNumericValue(node) {
    if (node.type !== 'Literal') return null;
    if (typeof node.value === 'number') return node.value;
    if (typeof node.value === 'string') {
        const match = /^(-?\d+(?:\.\d+)?)px$/.exec(node.value.trim());
        if (match) return Number(match[1]);
    }
    return null;
}

function extractNumericFromCssValue(value) {
    const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value.trim());
    return match ? Number(match[1]) : null;
}

function isStyleAttribute(node) {
    return (
        node.type === 'JSXAttribute' &&
        node.name?.type === 'JSXIdentifier' &&
        node.name.name === 'style'
    );
}

/** @type {import('eslint').Rule.RuleModule} */
const spacingRule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Detect numeric spacing values that closely match a design token, likely a typo.',
            category: 'Best Practices',
            recommended: false,
        },
        schema: [
            {
                type: 'object',
                properties: {
                    tokens: { type: 'string' },
                    tolerance: { type: 'number', default: 4 },
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
            drift: '{{property}}: {{value}}px is close to token `{{tokenName}}` ({{tokenValue}}px). Consider using this token instead.',
        },
    },

    create(context) {
        const options = context.options[0] ?? {};
        if (!options.tokens) {
            throw new Error(
                'token-drift/spacing: the "tokens" option is required (path to your token file).'
            );
        }

        const tolerance = options.tolerance ?? 4;
        const toleranceType = options.toleranceType ?? 'absolute';
        const projectRoot = context.cwd ?? context.getCwd?.() ?? process.cwd();

        const tokens = loadTokensCachedSync(options.tokens, projectRoot);
        const spacingTokens = tokens.spacing;

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

                    if (!propName || !SPACING_PROPERTIES.has(propName))
                        continue;

                    const value = extractNumericValue(property.value);
                    if (value === null) continue;

                    if (
                        isIgnoredByComment(
                            sourceCode,
                            property,
                            'token-drift-disable-next-line'
                        )
                    ) {
                        continue;
                    }

                    const match = findNearestNumericToken(
                        value,
                        spacingTokens,
                        tolerance,
                        toleranceType
                    );

                    if (match) {
                        context.report({
                            node: property,
                            messageId: 'drift',
                            data: {
                                property: propName,
                                value: String(value),
                                tokenName: match.token.name,
                                tokenValue: String(match.token.value),
                            },
                        });
                    }
                }
            },

            TaggedTemplateExpression(node) {
                if (!isStyledTemplate(node)) return;

                for (const decl of iterateCssDeclarations(node.quasi)) {
                    if (!SPACING_PROPERTIES.has(decl.property)) continue;

                    const value = extractNumericFromCssValue(decl.value);
                    if (value === null) continue;

                    const match = findNearestNumericToken(
                        value,
                        spacingTokens,
                        tolerance,
                        toleranceType
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
                                value: String(value),
                                tokenName: match.token.name,
                                tokenValue: String(match.token.value),
                            },
                        });
                    }
                }
            },
        };
    },
};

export default spacingRule;
