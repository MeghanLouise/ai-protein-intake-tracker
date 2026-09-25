// Local / self-hosted server: the API plus the built client from dist/.
// (On Firebase, Hosting serves dist/ and backend/index.js runs the API as a Cloud Function.)
import express from 'express';
import path from 'node:path';
import { app } from './backend/app.js';

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(import.meta.dirname, 'dist')));

app.listen(PORT, () => {
  console.log(`Protein tracker running at http://localhost:${PORT}`);
});
