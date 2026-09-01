# Versioned schemas

FormFirst uses strict JSON Schema Draft 2020-12 contracts:

- `fixture-pack.v1.schema.json` describes manually supplied scheduled fixtures.
- `research-pack.v1.schema.json` describes source-backed team evidence and explicitly labels synthetic data.
- `saved-analysis-run.v1.schema.json` describes a future local export, including deterministic settings and manually recorded outcomes.

Contract filenames and stable `$id` values carry the major version; `schemaVersion` carries the exact semantic version. Breaking changes require a new major-version file. Additive compatible changes require a minor version, while clarifications use a patch version. Version 1 documents `1.0.0` exactly. Unknown properties are rejected where practical. Samples in `samples/` are fictional test fixtures only and must never be used as real research or advice.

FixturePack v1 deliberately permits an empty `fixtures` array so a selected date with no qualifying scheduled fixtures can be represented truthfully. Its `competitions` array remains non-empty to record the explicit search scope.
