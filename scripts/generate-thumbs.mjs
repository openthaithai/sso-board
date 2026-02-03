import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const TARGETS = [
  { inputDir: 'public/images', outputDir: 'public/images/thumbs' },
  { inputDir: 'public/images/ministers', outputDir: 'public/images/ministers/thumbs' }
];

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const WIDTH = 256;
const QUALITY = 70;

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const isStale = async (inputPath, outputPath) => {
  try {
    const [inStat, outStat] = await Promise.all([fs.stat(inputPath), fs.stat(outputPath)]);
    return inStat.mtimeMs > outStat.mtimeMs;
  } catch {
    return true;
  }
};

const processDir = async ({ inputDir, outputDir }) => {
  await ensureDir(outputDir);
  const entries = await fs.readdir(inputDir, { withFileTypes: true });
  let processed = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTS.has(ext)) continue;

    const inputPath = path.join(inputDir, entry.name);
    const outputName = `${path.basename(entry.name, ext)}.webp`;
    const outputPath = path.join(outputDir, outputName);

    if (!(await isStale(inputPath, outputPath))) {
      skipped += 1;
      continue;
    }

    await sharp(inputPath)
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    processed += 1;
  }

  return { processed, skipped };
};

const run = async () => {
  let totalProcessed = 0;
  let totalSkipped = 0;

  for (const target of TARGETS) {
    const { processed, skipped } = await processDir(target);
    totalProcessed += processed;
    totalSkipped += skipped;
  }

  console.log(`Thumbnails generated: ${totalProcessed}, skipped: ${totalSkipped}`);
};

run().catch((err) => {
  console.error('Thumbnail generation failed:', err);
  process.exitCode = 1;
});
