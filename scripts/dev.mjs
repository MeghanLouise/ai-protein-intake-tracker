// `npm run dev`: starts MOTIV for local development, always the same way.
//
//   API   (Express, restarts on file changes)  -> API_PORT, default 3000 (PORT in .env)
//   Client (Vite)                              -> http://localhost:5173, never any other port
//
// Guarantees:
//   * One copy only. Before starting, any dev server left over from this project (a previous
//     `npm run dev`, a stray `vite`, an orphaned `node --watch`) is stopped first.
//   * Fixed ports. If something that is NOT this project holds a port, we stop with a clear
//     message instead of silently hopping to 5174, 5175, ... and leaving a mess.
//   * The API is up before Vite starts, so the first page load never hits a proxy error.
//   * Ctrl+C (or closing the terminal) stops both servers and everything they spawned.
//
// `npm run stop` (this file with --stop) stops this project's dev servers from anywhere.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CLIENT_PORT = 5173; // keep in sync with vite.config.ts
const API_PORT = Number(process.env.API_PORT || readEnvFile().PORT || 3000);

// Command lines (from `ps`) that belong to this project's dev servers. A process only counts
// when its working directory is also inside ROOT, so other projects' servers are never touched.
const OURS = /node_modules\/\.bin\/vite|node_modules\/vite\/bin\/vite\.js|npm exec vite|env-file-if-exists=\.env server\.js|scripts\/dev\.mjs/;

function readEnvFile() {
  try {
    const out = {};
    for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return ''; // e.g. lsof exits 1 when nothing matches
  }
}

function cwdOf(pid) {
  return run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']).match(/^n(.*)$/m)?.[1] ?? '';
}

function processTable() {
  return run('ps', ['-eo', 'pid=,ppid=,command='])
    .split('\n')
    .map((line) => line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/))
    .filter(Boolean)
    .map(([, pid, ppid, command]) => ({ pid: Number(pid), ppid: Number(ppid), command }));
}

// Dev-server processes from this project, other than this script and the shells that launched it.
function staleProjectProcesses() {
  const table = processTable();
  const skip = new Set([process.pid]);
  for (let pid = process.ppid; pid > 1 && !skip.has(pid); ) {
    skip.add(pid);
    pid = table.find((p) => p.pid === pid)?.ppid ?? 0;
  }
  return table.filter((p) => {
    if (skip.has(p.pid) || !OURS.test(p.command)) return false;
    const cwd = cwdOf(p.pid);
    return cwd === ROOT || cwd.startsWith(ROOT + path.sep);
  });
}

function listeners(port) {
  return run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'])
    .split('\n')
    .filter(Boolean)
    .map(Number);
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function terminate(pids) {
  const targets = [...new Set(pids)].filter(alive);
  for (const pid of targets) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {}
  }
  for (let i = 0; i < 30 && targets.some(alive); i++) await sleep(100);
  for (const pid of targets.filter(alive)) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {}
  }
}

async function stopStale() {
  const stale = staleProjectProcesses();
  if (stale.length) {
    await terminate(stale.map((p) => p.pid));
  }
  return stale.length;
}

function describe(pid) {
  return run('ps', ['-p', String(pid), '-o', 'command=']).trim().slice(0, 100) || `pid ${pid}`;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: 'localhost' });
    socket.once('connect', () => (socket.destroy(), resolve(true)));
    socket.once('error', () => resolve(false));
  });
}

async function waitForPort(port, child, label) {
  for (let i = 0; i < 300; i++) {
    if (child.exitCode !== null) throw new Error(`${label} stopped before it was ready (see its output above).`);
    if (await portOpen(port)) return;
    await sleep(100);
  }
  throw new Error(`${label} did not start listening on port ${port} within 30 seconds.`);
}

if (process.argv.includes('--stop')) {
  const n = await stopStale();
  console.log(n ? `Stopped ${n} MOTIV dev process${n === 1 ? '' : 'es'}.` : 'No MOTIV dev servers were running.');
  process.exit(0);
}

// 1. Clear out anything left over from earlier runs.
const cleared = await stopStale();
if (cleared) console.log(`Stopped ${cleared} leftover dev process${cleared === 1 ? '' : 'es'} from an earlier run.`);

// 2. Make sure both ports are ours to use.
for (const [port, name] of [[CLIENT_PORT, 'the client'], [API_PORT, 'the API']]) {
  const pids = listeners(port);
  if (pids.length) {
    console.error(
      `\nPort ${port} (needed for ${name}) is in use by something that isn't a MOTIV dev server:\n` +
        pids.map((pid) => `  ${describe(pid)}`).join('\n') +
        `\nStop it (kill ${pids.join(' ')}) and run npm run dev again` +
        (port === API_PORT ? `, or set a different PORT in .env.\n` : `.\n`),
    );
    process.exit(1);
  }
}

// 3. Start the API, wait until it is listening, then start the client.
const children = [];
let shuttingDown = false;

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  // Each child leads its own process group, so -pid reaches grandchildren (node --watch's server).
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {}
  }
  for (let i = 0; i < 30 && children.some((c) => alive(c.pid)); i++) await sleep(100);
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {}
  }
  process.exit(code);
}

function start(label, args, env) {
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: 'inherit',
    detached: true,
    env: { ...process.env, ...env },
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`\n${label} stopped unexpectedly (${signal ?? `exit code ${code}`}). Shutting down.`);
      shutdown(1);
    }
  });
  return child;
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => shutdown(0));

try {
  const api = start('The API server', ['--watch', '--env-file-if-exists=.env', 'server.js'], {
    PORT: String(API_PORT),
  });
  await waitForPort(API_PORT, api, 'The API server');

  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const client = start('Vite', [viteBin, '--port', String(CLIENT_PORT), '--strictPort'], {
    API_PORT: String(API_PORT),
  });
  await waitForPort(CLIENT_PORT, client, 'Vite');

  console.log(`\n  MOTIV is ready  ->  http://localhost:${CLIENT_PORT}\n`);
} catch (error) {
  console.error(`\n${error.message}`);
  await shutdown(1);
}
