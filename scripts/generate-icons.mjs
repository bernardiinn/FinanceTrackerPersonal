/**
 * Icon generation script.
 * Requires: sharp (installed as dev dependency).
 * Source: public/logo-master.png (should be a large square PNG, >=1024x1024 recommended).
 * Outputs resized icons into public/icons/.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = path.resolve('public', 'logo-master.png');
const OUT_DIR = path.resolve('public', 'icons');
const SIZES = [192, 512];

async function ensureOutDir() {
  await fs.promises.mkdir(OUT_DIR, { recursive: true });
}

async function generateStandardSizes() {
  const tasks = SIZES.map(async (size) => {
    const out = path.join(OUT_DIR, `icon-${size}.png`);
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log('Generated', out);
  });
  await Promise.all(tasks);
}

async function generateMaskable() {
  // Add padding (safe zone) ~20% for maskable icon
  const size = 512;
  const out = path.join(OUT_DIR, 'icon-512-maskable.png');
  const PADDING_RATIO = 0.2; // 20% padding
  const inner = Math.round(size * (1 - PADDING_RATIO * 2));
  const padding = Math.round((size - inner) / 2);

  const base = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).png();

  const resized = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(await base.toBuffer())
    .composite([{ input: resized, top: padding, left: padding }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('Generated', out);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source logo not found at', SRC);
    process.exit(1);
  }
  await ensureOutDir();
  await generateStandardSizes();
  await generateMaskable();
  console.log('All icons generated successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
