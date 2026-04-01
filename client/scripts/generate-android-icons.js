/**
 * Generates Android launcher icons from the SVG sources at correct densities.
 * Run from the client/ directory: node scripts/generate-android-icons.js
 *
 * Sources:
 *   public/icon-source.svg     — 1024×1024 full icon (purple rounded square + S)
 *   public/icon-foreground.svg — 432×432 foreground only (white S on transparent)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const publicDir = path.join(__dirname, '..', 'public');

const fullIconSvg = fs.readFileSync(path.join(publicDir, 'icon-source.svg'), 'utf8');
const foregroundSvg = fs.readFileSync(path.join(publicDir, 'icon-foreground.svg'), 'utf8');

// Standard launcher icon sizes
const iconSizes = [
  { density: 'ldpi',    size: 36  },
  { density: 'mdpi',    size: 48  },
  { density: 'hdpi',    size: 72  },
  { density: 'xhdpi',   size: 96  },
  { density: 'xxhdpi',  size: 144 },
  { density: 'xxxhdpi', size: 192 },
];

// Adaptive icon foreground sizes (108dp canvas at each density)
const foregroundSizes = [
  { density: 'ldpi',    size: 81  },
  { density: 'mdpi',    size: 108 },
  { density: 'hdpi',    size: 162 },
  { density: 'xhdpi',   size: 216 },
  { density: 'xxhdpi',  size: 324 },
  { density: 'xxxhdpi', size: 432 },
];

async function generateIcon(svgBuffer, outputPath, size) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`  Generated ${path.relative(androidDir, outputPath)} (${size}x${size})`);
}

async function main() {
  const fullIconBuffer = Buffer.from(fullIconSvg);
  const foregroundBuffer = Buffer.from(foregroundSvg);

  // ic_launcher.png and ic_launcher_round.png for each density
  for (const { density, size } of iconSizes) {
    const dir = path.join(androidDir, `mipmap-${density}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await generateIcon(fullIconBuffer, path.join(dir, 'ic_launcher.png'), size);
    await generateIcon(fullIconBuffer, path.join(dir, 'ic_launcher_round.png'), size);
  }

  // ic_launcher_foreground.png and ic_launcher_round_foreground.png for each density
  for (const { density, size } of foregroundSizes) {
    const dir = path.join(androidDir, `mipmap-${density}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await generateIcon(foregroundBuffer, path.join(dir, 'ic_launcher_foreground.png'), size);
    await generateIcon(foregroundBuffer, path.join(dir, 'ic_launcher_round_foreground.png'), size);
  }

  // Play Store / web icon (512×512)
  await generateIcon(fullIconBuffer, path.join(androidDir, 'ic_launcher-web.png'), 512);
  await generateIcon(fullIconBuffer, path.join(androidDir, 'playstore-icon.png'), 512);

  console.log('\nDone! All Android icons regenerated.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
