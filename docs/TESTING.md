# Testing

## Stage 2 validation coverage

Vitest tests cover valid synthetic fixture, research and saved-run samples; duplicate fixtures; unsupported competitions; fixture/research mismatches; missing or invalid sources; prohibited content; synthetic-data warnings; and deterministic stale-source checks using an explicit reference timestamp.

Run:

```sh
npm run lint
npm test
npm run test:watch
npm run build
```

## Latest verification

- `npm install` — blocked on 2026-09-01 by `403 Forbidden` for `https://registry.npmjs.org/@eslint%2fjs` under the environment registry policy.
- `npm run lint` — blocked because `@eslint/js` is unavailable after the failed install.
- `npm test` — blocked because the `vitest` executable is unavailable after the failed install.
- `npm run build` — blocked because React, Vitest and Node packages/types are unavailable after the failed install.
