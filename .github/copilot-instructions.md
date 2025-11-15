# Repo-level Copilot Instructions

This file gives concise, actionable guidance for AI coding agents working across this repository.

## Big Picture
- The repository is primarily a static website (HTML, CSS, JS) at the repo root.
- Two small TypeScript Node projects live as subfolders: `project-name]` and `[project-name]-1`.
  These subprojects follow the same pattern: `src/` (TS code) -> `dist/` (compiled JS).

## Where to make changes
- For frontend/static work: edit files at the repo root (e.g. `index.html`, `assets/`, `js/`, `sass/`).
- For backend/service work: edit the subproject folder that contains the code you need, e.g.:
  - `project-name]` (see `project-name]/src/*`)
  - `[project-name]-1` (see `[project-name]-1/src/*`)

## Build / Run / Test (per subproject)
- Typical npm workflow inside a subproject directory:
  - Install dependencies: `cd "[project-folder]" ; npm install`
  - Build: `npm run build` (runs `tsc` and outputs to `dist/`)
  - Start (run compiled app): `npm run start` (runs `node dist/index.js`)
  - Test: `npm run test` (runs `jest`)

Example PowerShell commands (from repo root):
```
cd "[project-name]-1"; npm install; npm run build; npm run test
cd "project-name]"; npm install; npm run build; npm run start
```

## Project-specific conventions
- Directory layout in each TypeScript subproject:
  - `src/controllers` — thin HTTP / request handlers
  - `src/services` — core business logic and external calls
  - `src/types` — shared TypeScript types
- Keep controllers thin; put business logic into services.
- TypeScript config: `tsconfig.json` uses `rootDir: ./src` and `outDir: ./dist`.

## Integration points & dependencies
- Subprojects depend on `express` and `axios` (see each subproject `package.json`).
- Communication is via direct function calls inside the repo; external interactions are through services that call external APIs with `axios`.

## Guidance for AI agents
- Prefer editing the relevant subproject's `.github/copilot-instructions.md` or `README.md` when making project-specific changes.
- When editing TypeScript code:
  - Follow existing patterns in `src/controllers/index.ts` and `src/services/index.ts`.
  - Add or update types in `src/types/index.ts` when changing data shapes.
- For repository-level changes (site-wide HTML/CSS/js), modify root files and update `assets/`, `js/`, or `sass/` as appropriate.
- Preserve whitespace, existing code style, and inline documentation.

## Where to look for examples
- Example controller/service pattern: `project-name]/src/controllers/index.ts` and `project-name]/src/services/index.ts`.
- Build scripts and dependencies: `project-name]/package.json` and `[project-name]-1/package.json`.

If anything here is unclear or you want a more detailed, task-specific instruction set, tell me which area to expand (frontend, one of the subprojects, or CI/workflows).
