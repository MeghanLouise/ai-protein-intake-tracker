// Local / self-hosted server: the API plus the built client from dist/.
// (On Firebase, Hosting serves dist/ and backend/index.js runs the API as a Cloud Function.)
import express from 'express';
import path from 'node:path';
import { app } from './backend/app.js';

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(import.meta.dirname, 'dist')));

app
  .listen(PORT, () => {
    console.log(`MOTIV running at http://localhost:${PORT}`);
  })
  .on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop whatever is using it (npm run stop), or set a different PORT in .env.`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
