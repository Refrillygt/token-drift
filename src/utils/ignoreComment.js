/**
 * Check whether an AST node should be ignored based on a
 * `// <marker>` comment placed on the line immediately before it.
 *
 * This is a lightweight, rule-agnostic helper shared by all token-drift
 * rules (spacing, color, ...) so the ignore-comment logic isn't duplicated.
 *
 * @param {import('eslint').SourceCode} sourceCode
 * @param {import('estree').Node} node - the node being checked (e.g. a Property node)
 * @param {string} marker - the exact comment text to look for, e.g. "token-drift-disable-next-line"
 * @returns {boolean}
 */
export function isIgnoredByComment(sourceCode, node, marker) {
    const comments = sourceCode.getCommentsBefore(node);

    for (const comment of comments) {
        if (comment.value.trim() === marker) {
            const commentEndLine = comment.loc.end.line;
            const nodeStartLine = node.loc.start.line;
            if (nodeStartLine - commentEndLine <= 1) {
                return true;
            }
        }
    }

    return false;
}
