# AI Protein Intake Tracker

A small web app for tracking daily protein. Describe a meal or upload a photo, an AI estimates the grams, and entries are stored in a plain CSV file.

## Set up sign-in (Firebase)

Users sign in with Google or email/password. Each user's entries and goal are stored separately under `data/users/<uid>/`.

1. Go to the [Firebase console](https://console.firebase.google.com) and create a project (the free Spark plan is enough).
2. **Build > Authentication > Get started**, then enable the **Google** and **Email/Password** providers.
3. **Project settings (gear icon) > Your apps > Web (`</>`)**, register an app, and copy the config values.
4. Copy `.env.example` to `.env` and fill in the `FIREBASE_PROJECT_ID` and `VITE_FIREBASE_*` values (plus your `GEMINI_API_KEY`).
5. For a deployed site, add its domain under **Authentication > Settings > Authorized domains** (`localhost` is already allowed).

## Invite-only sign-up

Only people with an invite code can use the app. Codes are UUIDs listed in `INVITE_CODES` in `.env` (comma-separated, so you can give different people different codes and remove one later).

```bash
npm run invite   # prints a new code to add to INVITE_CODES
```

The sign-up form asks for a code, and anyone who signs in without having redeemed one (for example with Google) gets an "Enter your invite code" screen. This is enforced by the server: until an account has redeemed a code, every data and AI request from it is refused. Removing a code from `INVITE_CODES` stops new sign-ups with it, but accounts that already redeemed it keep access. If `INVITE_CODES` is empty, nobody can sign up. Restart the server after editing `.env`.

The `VITE_FIREBASE_*` values are public identifiers, not secrets. The server verifies sign-in tokens with just the project ID, so no service-account key is needed.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 (Vite, with hot reload). It forwards `/api` calls to the Express server on port 3000, which `npm run dev` starts for you. Restart it after changing `.env`.

For a production-style run, `npm start` builds the client into `dist/` and serves everything from http://localhost:3000. `npm run typecheck` checks the TypeScript without building.

## Layout

- `server.js` – Express server and JSON API (also serves `dist/`)
- `lib/ai.js` – protein estimation with Gemini
- `lib/auth.js` – verifies Firebase ID tokens (`requireAuth` middleware)
- `lib/invites.js` – invite-code check and `requireInvite` middleware
- `lib/storage.js` – per-user CSV entries and goal (`data/users/<uid>/entries.csv`, `goal.json`)
- `client/` – React + TypeScript frontend (Vite)
  - `src/App.tsx` – loads today's data and lays out the page
  - `src/components/` – `ProgressSummary`, `AddMealForm` (`EstimateForm` -> `ConfirmForm`), `EntryList`
  - `src/firebase.ts`, `src/useAuth.ts`, `components/SignIn.tsx` – Firebase sign-in
  - `src/api.ts`, `src/types.ts` – API calls (sent with the user's token) and shared types
  - `src/index.css` – styles (plain class names, one per component section)
- `scripts/dev.mjs` – runs Vite and the server together for `npm run dev`

## API

All `/api` routes require `Authorization: Bearer <Firebase ID token>`.

- `POST /api/invite/check` – `{ code }` (no sign-in needed) used by the sign-up form
- `GET /api/me`, `POST /api/invite/redeem` – signed-in only; activation status and redeeming a code
- The routes below also require an activated account
- `GET /api/today` – today's entries, total, and goal
- `POST /api/estimate` – `{ text?, image?: { mimeType, data } }` returns an estimate (does not save)
- `POST /api/entries` – `{ description, protein_g }` saves an entry
- `PUT /api/goal` – `{ goal }`
