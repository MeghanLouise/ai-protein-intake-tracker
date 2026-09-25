// Runs the Vite dev server and the API server in watch mode together, and stops both on Ctrl+C.
import { spawn } from 'node:child_process';

const commands = [
  ['npx', ['vite']],
  ['node', ['--watch', '--env-file-if-exists=.env', 'server.js']],
];

const children = commands.map(([cmd, args]) => spawn(cmd, args, { stdio: 'inherit' }));

const stopAll = () => children.forEach((child) => child.kill());
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
children.forEach((child) => child.on('exit', stopAll));
