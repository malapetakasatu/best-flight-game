// Automated Screenshot Capture Script using Headless Chrome
// Renders the 4 authentic scenes listed in shots.json

import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const shotsFile = join(here, 'shots.json');
const shots = JSON.parse(readFileSync(shotsFile, 'utf8'));

mkdirSync(join(here, 'screenshots'), { recursive: true });

// Start local server on port 8089
const server = spawn('node', [join(here, 'serve.ts'), '--port', '8089'], {
  stdio: 'inherit',
});

// Wait for server to start
await new Promise((r) => setTimeout(r, 1200));

try {
  for (const shot of shots) {
    const targetUrl = `http://localhost:8089/${shot.query}`;
    const outPath = join(here, 'screenshots', shot.name);
    process.stdout.write(`Capturing ${shot.name} from ${targetUrl}...\n`);

    // Use headless Chrome to take high-fidelity screenshot
    const chromeCmd = [
      'google-chrome-stable',
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--enable-unsafe-swiftshader',
      '--window-size=1280,800',
      '--hide-scrollbars',
      '--virtual-time-budget=5000',
      `--screenshot=${outPath}`,
      `"${targetUrl}"`,
    ].join(' ');

    execSync(chromeCmd, { stdio: 'inherit' });
    process.stdout.write(`Saved ${outPath}\n`);
  }
} finally {
  server.kill('SIGTERM');
}

process.stdout.write('All screenshots captured successfully!\n');
