# Testing

## Stage 1 strategy

Stage 1 uses static linting and a TypeScript-backed production build as its quality gates. A test framework is intentionally deferred until Stage 2 introduces versioned schemas and validation behavior.

Run:

```sh
npm run lint
npm run build
```

## Latest verification

- `npm install` — blocked on 2026-09-01 by an HTTP 403 response from the npm registry in the execution environment.
- `npm run lint` — failed because `@eslint/js` was unavailable after the blocked install.
- `npm run build` — failed because React, React DOM and Node type dependencies were unavailable after the blocked install.

Re-run all three commands in an environment with npm registry access before release.
