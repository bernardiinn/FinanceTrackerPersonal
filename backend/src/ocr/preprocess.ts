import fs from 'fs';
import path from 'path';
import os from 'os';

// Optional image preprocessing using sharp if available.
// Returns path to (possibly) preprocessed temp image; caller is responsible for cleanup.
export async function preprocessImageIfEnabled(originalPath: string): Promise<{ path: string; cleanup: () => void; used: boolean; warnings: string[]; }> {
  const warnings: string[] = [];
  const flag = process.env.OCR_PREPROCESS;
  const enabled = flag === undefined || flag === '1' || flag?.toLowerCase() === 'true';
  if (!enabled) {
    return { path: originalPath, cleanup: () => {}, used: false, warnings };
  }
  let sharp: any;
  try {
    // Dynamic import so absence does not crash runtime
    sharp = (await import('sharp')).default;
  } catch (_e) {
    warnings.push('preprocess_skipped_no_sharp');
    return { path: originalPath, cleanup: () => {}, used: false, warnings };
  }
  try {
    const tmpDir = os.tmpdir();
    const outPath = path.join(tmpDir, `ocr-pre-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
    const image = sharp(originalPath, { failOn: 'none' }).rotate(); // auto-orient
    const metadata = await image.metadata();
    if (metadata.width && metadata.width > 2000) {
      image.resize(2000); // maintain aspect ratio
    }
    await image
      .grayscale()
      .normalise()
      .sharpen()
      .toColourspace('b-w')
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    return { path: outPath, cleanup: () => { fs.unlink(outPath, () => {}); }, used: true, warnings };
  } catch (e: any) {
    warnings.push('preprocess_failed');
    return { path: originalPath, cleanup: () => {}, used: false, warnings };
  }
}
