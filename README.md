# AI Protein Intake Tracker

A small web app for tracking daily protein. Describe a meal or upload a photo, an AI estimates the grams, and entries are stored in a plain CSV file.

## Run

```bash
npm install
cp .env.example .env   # then add your Gemini API key
npm run dev
```

Open http://localhost:5173 (Vite, with hot reload). It forwards `/api` calls to the Express server on port 3000, which `npm run dev` starts for you.

For a production-style run, `npm start` builds the client into `dist/` and serves everything from http://localhost:3000. `npm run typecheck` checks the TypeScript without building.

## Layout

- `server.js` – Express server and JSON API (also serves `dist/`)
- `lib/ai.js` – protein estimation with Gemini
- `lib/storage.js` – CSV entries (`data/entries.csv`) and goal (`data/goal.json`)
- `client/` – React + TypeScript frontend (Vite)
  - `src/App.tsx` – loads today's data and lays out the page
  - `src/components/` – `ProgressSummary`, `AddMealForm` (`EstimateForm` -> `ConfirmForm`), `EntryList`
  - `src/api.ts`, `src/types.ts` – API calls and shared types
  - `src/index.css` – styles (plain class names, one per component section)
- `scripts/dev.mjs` – runs Vite and the server together for `npm run dev`

## API

- `GET /api/today` – today's entries, total, and goal
- `POST /api/estimate` – `{ text?, image?: { mimeType, data } }` returns an estimate (does not save)
- `POST /api/entries` – `{ description, protein_g }` saves an entry
- `PUT /api/goal` – `{ goal }`
