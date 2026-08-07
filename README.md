# token-drift

An ESLint plugin that detects hardcoded spacing and color values in React
code that are suspiciously close to an existing design token — likely a
typo or oversight — without blocking intentional custom values.

Unlike strict "no hardcoded values" linters, `token-drift` only warns when
a value is a **near-miss** of a token. Exact token matches and values far
from any token are left alone.

## Install

```bash
npm install -D token-drift
```

## Setup

Create a token file (JSON or CommonJS):

```json
// design-tokens.json
{
    "spacing": { "sm": 8, "md": 12, "lg": 16 },
    "color": { "primary": "#3366FF", "danger": "#DC3545" }
}
```

Add the plugin to your flat ESLint config (`eslint.config.js`):

```js
import tokenDrift from 'token-drift';

export default [
    {
        plugins: { 'token-drift': tokenDrift },
        rules: {
            'token-drift/spacing': ['warn', { tokens: './design-tokens.json' }],
            'token-drift/color': ['warn', { tokens: './design-tokens.json' }],
        },
    },
];
```

That's it — no editor restart needed.

## Rules

### `token-drift/spacing`

Detects near-miss numeric values in `padding`, `margin`, `gap`, `width`,
`height`, `top`, `left`, `right`, `bottom` — in inline `style={{}}` and in
`styled-components`/`emotion` template literals.

Options:

| Option          | Type                         | Default      | Description                           |
| --------------- | ---------------------------- | ------------ | ------------------------------------- |
| `tokens`        | `string`                     | required     | Path to your token file               |
| `tolerance`     | `number`                     | `4`          | Max distance still considered "drift" |
| `toleranceType` | `'absolute' \| 'percentage'` | `'absolute'` | Unit for `tolerance`                  |

### `token-drift/color`

Detects near-miss `color`, `backgroundColor`, `borderColor` values (hex or
rgb/rgba), in inline styles and styled-components/emotion.

Options:

| Option      | Type     | Default  | Description                                         |
| ----------- | -------- | -------- | --------------------------------------------------- |
| `tokens`    | `string` | required | Path to your token file                             |
| `tolerance` | `number` | `20`     | Max RGB Euclidean distance still considered "drift" |

## Ignoring a line

```jsx
<div
    style={{
        // token-drift-disable-next-line
        padding: 13,
    }}
/>
```

Standard ESLint disable comments also work:
`// eslint-disable-next-line token-drift/spacing`

> Note: `token-drift-disable-next-line` is not yet supported inside
> styled-components/emotion template literals (CSS has no `//` comment
> syntax). Use the standard ESLint disable comment instead in that case.

## Setup examples

<details>
<summary>Plain JSON tokens</summary>

```json
{ "spacing": { "sm": 8 }, "color": { "primary": "#3366FF" } }
```

</details>

<details>
<summary>Tailwind config (planned, v0.2)</summary>

Not yet supported in v0.1. Use a plain JSON/JS token file for now.

</details>

<details>
<summary>styled-components theme</summary>

Export a plain object from a `.js`/`.cjs` file:

```js
// design-tokens.cjs
module.exports = {
    spacing: { sm: 8, md: 12 },
    color: { primary: '#3366FF' },
};
```

</details>

## Security

See [SECURITY.md](./SECURITY.md).

## License

MIT
