# Known issues

## Stage 2 limitations

- JSON Schema documents are contracts for interoperable tooling, while the dependency-light runtime validators implement the focused import checks needed in Stage 2 rather than a general-purpose JSON Schema engine.
- Optional evidence may remain `null`, and unknown contextual evidence is represented explicitly; later scoring and UI stages are intentionally not implemented.
- Samples are synthetic contract fixtures only and cannot be used for real analysis.

## Environment limitation

- On 2026-09-01, Stage 1 dependency installation was blocked by the environment's package-registry policy (`npm install` received HTTP 403 from the npm registry). The Stage 2 `npm install` attempt was likewise blocked with `403 Forbidden` for `https://registry.npmjs.org/@eslint%2fjs`; dependencies remain unavailable, so lint, tests and build cannot execute until registry access is restored.
