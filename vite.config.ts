import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// The client lives in client/. `vite build` outputs to dist/, which Express serves.
// In dev, Vite runs on :5173 and forwards /api calls to the Express server (PORT in .env, else
// 3000). `npm run dev` (scripts/dev.mjs) starts both and tells us the API port via API_PORT.
export default defineConfig(({ mode }) => {
  const apiPort = process.env.API_PORT || loadEnv(mode, process.cwd(), '').PORT || 3000;

  return {
    root: 'client',
    envDir: '..', // read VITE_* settings from the project-root .env
    plugins: [react()],
    // node_modules is a symlink to node_modules.nosync (keeps iCloud from syncing it). Without this,
    // Vite resolves deps to the .nosync path, no longer sees "node_modules" in it, skips
    // pre-bundling, and serves react-dom's CommonJS file as-is ("no export named createRoot").
    resolve: { preserveSymlinks: true },
    build: { outDir: '../dist', emptyOutDir: true },
    server: {
      port: 5173,
      // Fail loudly instead of quietly hopping to 5174, 5175, ... and leaving extra servers running.
      strictPort: true,
      proxy: { '/api': `http://localhost:${apiPort}` },
    },
  };
});
