# Known issues

## Stage 1 limitations

- Fixture and evidence workflows are not implemented; they are planned for later stages.
- Versioned schemas and validation tests are deferred to Stage 2.
- There is intentionally no test framework yet.

## Environment limitation

- On 2026-09-01, dependency installation was blocked by the environment's package-registry policy (`npm install` received HTTP 403 from the npm registry). Lint and production build verification remain pending until dependencies can be installed. No application defect is currently known from this limitation.
