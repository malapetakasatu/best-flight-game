// Automated Screenshot Capture Script using Headless Chrome
// Renders the 4 authentic scenes listed in shots.json at full 1280x720 TrueColor

import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const shotsFile = join(here, 'shots.json');
const shots = JSON.parse(readFileSync(shotsFile, 'utf8'));
const screenshotsDir = join(here, 'screenshots');

mkdirSync(screenshotsDir, { recursive: true });

// Clean old files in screenshots dir
for (const file of readdirSync(screenshotsDir)) {
  rmSync(join(screenshotsDir, file));
}

// Start local server on port 8089
const server = spawn('node', [join(here, 'serve.ts'), '--port', '8089'], {
  stdio: 'inherit',
});

// Wait for server to start
await new Promise((r) => setTimeout(r, 1500));

try {
  for (const shot of shots) {
    const targetUrl = `http://localhost:8089/${shot.query}`;
    const outPath = join(screenshotsDir, shot.name);
    const tempRaw = join('/tmp', `raw_${shot.name}.png`);
    process.stdout.write(`Capturing ${shot.name} from ${targetUrl}...\n`);

    // Use headless Chrome with software swiftshader WebGL at 1280x720 16:9
    const chromeCmd = [
      'google-chrome-stable',
      '--headless=new',
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--window-size=1280,720',
      '--hide-scrollbars',
      '--virtual-time-budget=4000',
      `--screenshot=${tempRaw}`,
      `"${targetUrl}"`,
    ].join(' ');

    execSync(chromeCmd, { stdio: 'inherit' });

    // Convert raw PNG capture to pristine quality 94 JPEG
    // Strictly adheres to: long side <= 1280, short side >= 480, size <= 256 KiB
    execSync(`python3 -c "
from PIL import Image
im = Image.open('${tempRaw}').convert('RGB')
im.save('${outPath}', format='JPEG', quality=94, optimize=True)
"`);

    const size = statSync(outPath).size;
    process.stdout.write(`Saved ${shot.name}: ${size} bytes (${(size / 1024).toFixed(1)} KiB)\n`);

    if (size > 262144) {
      throw new Error(`Screenshot ${shot.name} exceeds 256 KiB cap: ${size} bytes`);
    }
  }
} finally {
  server.kill('SIGTERM');
}

process.stdout.write('All screenshots captured and verified successfully!\n');
