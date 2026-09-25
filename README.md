# AI Protein Intake Tracker

A small web app for tracking daily protein. Describe a meal or upload a photo, an AI estimates the grams, and entries are stored in a plain CSV file.

## Run

```bash
npm install
cp .env.example .env   # then add your Gemini API key
npm run dev
```

Open http://localhost:3000.

`npm run dev` recompiles the frontend and restarts the server on changes. `npm start` compiles once, then starts the server. `npm run build` only compiles.

## Layout

- `server.js` – Express server and JSON API
- `lib/ai.js` – protein estimation (stub, Gemini integration is next)
- `lib/storage.js` – CSV entries (`data/entries.csv`) and goal (`data/goal.json`)
- `client/app.ts` – frontend logic in TypeScript, compiled by `tsc` to `public/app.js` (generated, edit `client/app.ts` instead)
- `public/` – static frontend (`index.html`, `style.css`, compiled `app.js`)
- `scripts/dev.mjs` – runs `tsc --watch` and the server together for `npm run dev`

## API

- `GET /api/today` – today's entries, total, and goal
- `POST /api/estimate` – `{ text?, image?: { mimeType, data } }` returns an estimate (does not save)
- `POST /api/entries` – `{ description, protein_g }` saves an entry
- `PUT /api/goal` – `{ goal }`
