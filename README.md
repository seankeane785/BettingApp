# FormFirst

FormFirst is a local-first browser tool for structured, deterministic team-level analysis of fixtures in the Premier League, Championship, League One and League Two. It supports a manual ChatGPT copy/paste workflow for people who may later place selections manually with Paddy Power. FormFirst never connects to Paddy Power or any betting account.

## Version 1 guardrails

- Manual analysis only: fixture and evidence text will be copied in by the user. There are no APIs, scraping, automatic data collection or bookmaker integrations.
- Team-level markets only. Player-specific markets are excluded.
- The app never uses, stores, displays or infers odds, prices, payouts, implied probability, expected value, value betting, bookmaker links or tipster opinions.
- FormFirst gives no stake advice and must allow the outcome **“No qualifying builder today”** when evidence does not meet the deterministic rules.
- Future analysis outputs must include **“Verify market availability and settlement rules in Paddy Power before placing.”** and **“18+; analysis only; only stake what you can afford to lose.”**
- Version 1 has no backend, accounts, remote database or automated workflow. Stage 1 is only the application shell; fixture import, evidence import, schemas, validation, scoring and analysis arrive in later stages.

## Local development

### Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer

### Commands

```sh
npm install
npm run dev
npm run lint
npm run build
```

`npm run dev` starts Vite's local development server. `npm run build` type-checks the application and creates a production bundle in `dist/`.

See [`docs/PROJECT_SCOPE.md`](docs/PROJECT_SCOPE.md) for the full scope and product guardrails.
