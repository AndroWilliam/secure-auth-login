#!/usr/bin/env node
import { execSync } from 'node:child_process';

const port = process.argv[2] || process.env.PORT;
if (!port) {
  console.error('Usage: kill-port.mjs <port>');
  process.exit(1);
}

try {
  // macOS/Linux
  const pids = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  if (pids) {
    execSync(`kill -9 ${pids}`, { stdio: 'inherit' });
    console.log(`Killed processes on port ${port}`);
  } else {
    console.log(`No process on port ${port}`);
  }
} catch (e) {
  console.log(`No process on port ${port}`);
}


