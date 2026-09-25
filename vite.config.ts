import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The client lives in client/. `vite build` outputs to dist/, which Express serves.
// In dev, Vite runs on :5173 and forwards /api calls to the Express server on :3000.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
