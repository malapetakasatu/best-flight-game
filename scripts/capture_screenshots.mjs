// Automated Screenshot Capture Script using Headless Chrome
// Renders the 4 authentic scenes listed in shots.json

import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
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
await new Promise((r) => setTimeout(r, 1500));

try {
  for (const shot of shots) {
    const targetUrl = `http://localhost:8089/${shot.query}`;
    const outPath = join(here, 'screenshots', shot.name);
    process.stdout.write(`Capturing ${shot.name} from ${targetUrl}...\n`);

    // Use headless Chrome with software swiftshader WebGL to capture full visual fidelity
    const chromeCmd = [
      'google-chrome-stable',
      '--headless=new',
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--window-size=1280,800',
      '--hide-scrollbars',
      '--virtual-time-budget=4000',
      `--screenshot=${outPath}`,
      `"${targetUrl}"`,
    ].join(' ');

    execSync(chromeCmd, { stdio: 'inherit' });

    let size = statSync(outPath).size;
    process.stdout.write(`Initial ${shot.name}: ${(size / 1024).toFixed(1)} KiB\n`);

    // Ensure under 262,144 byte cap
    if (size > 262144) {
      process.stdout.write(`Compressing ${shot.name} to fit <= 256 KiB cap...\n`);
      execSync(`python3 -c "
from PIL import Image
im = Image.open('${outPath}')
im_opt = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
im_opt.save('${outPath}', optimize=True)
"`);
      size = statSync(outPath).size;
      process.stdout.write(`Compressed ${shot.name}: ${(size / 1024).toFixed(1)} KiB\n`);
    }

    process.stdout.write(`Saved ${outPath} (${size} bytes)\n`);
  }
} finally {
  server.kill('SIGTERM');
}

process.stdout.write('All screenshots captured successfully!\n');
