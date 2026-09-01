# Architecture

FormFirst v1 is a client-only React and TypeScript single-page application built with Vite. It runs locally in the browser and has no backend, remote database, account system or network-based data collection.

## Stage 1 structure

- `index.html` provides the Vite entry document.
- `src/main.tsx` mounts the React application.
- `src/App.tsx` contains the accessible application shell.
- `src/index.css` provides the baseline responsive presentation.
- `schemas/` reserves a documented location for versioned Stage 2 schemas.

Later stages should keep input explicit and manual, validation deterministic, and domain logic separate from presentation. No future layer may introduce APIs, scraping, bookmaker/account connectivity or prohibited odds-related data.

## Stage 2 contracts and validation

Manual JSON crosses the application boundary through versioned Draft 2020-12 contracts in `schemas/`. Domain types and dependency-light validators in `src/domain/` first verify identity and structure, then enforce fixture relationships, evidence sources, explicit synthetic status, prohibited-content controls and deterministic freshness. Validation is local and performs no fetches. A caller supplies the reference timestamp and maximum source age, so identical inputs and settings produce identical outcomes. Validated packs remain separate from future presentation, scoring and persistence layers.
