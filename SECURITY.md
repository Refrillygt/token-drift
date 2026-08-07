# Security Policy

`token-drift` is designed to be safe to run in any codebase:

- **No network access.** The plugin never performs HTTP requests. All
  processing is local.
- **No `eval`, `new Function`, or `child_process`.** Token files are read
  via `fs`, `JSON.parse`, and Node's standard module loader (`import()` /
  `require()`) — never dynamically executed as arbitrary code.
- **Path traversal protection.** Token file paths are resolved and
  validated to be inside your project root before being read. A path like
  `../../etc/passwd` is rejected.
- **No install scripts.** `package.json` has no `preinstall`/`postinstall`/
  `install` script.
- **Minimal dependencies.** `eslint` is the only peer dependency.
- **Published with provenance** (`npm publish --provenance`), so you can
  verify the package was built from this repository's source.

## Reporting a vulnerability

If you find a security issue, please open a private security advisory on
GitHub rather than a public issue.
