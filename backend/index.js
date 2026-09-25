// Firebase Cloud Function entry point. Hosting forwards /api/** here (see firebase.json).
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { app } from './app.js';

// Set once with: firebase functions:secrets:set <NAME>. They appear as process.env.<NAME> at runtime.
const secrets = [defineSecret('GEMINI_API_KEY'), defineSecret('INVITE_CODES')];

export const api = onRequest(
  {
    region: 'us-central1',
    secrets,
    timeoutSeconds: 60, // Firebase Hosting gives up on a function after 60s anyway
    memory: '512MiB',
    maxInstances: 3, // keeps a runaway bill impossible
  },
  app,
);
