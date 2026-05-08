import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const SOURCE = path.join(ROOT, "public", "icons", "source.png");
const OUT_DIR = path.join(ROOT, "public", "icons");
const PUBLIC_DIR = path.join(ROOT, "public");
const APP_DIR = path.join(ROOT, "app");

const BRAND_BG = "#0c2340"; // gov-navy

const standardSizes = [192, 256, 384, 512];
const appleSizes = [120, 152, 167, 180];

await mkdir(OUT_DIR, { recursive: true });

// Standard "any" purpose icons — keep the original logo edges intact.
for (const size of standardSizes) {
  const out = path.join(OUT_DIR, `icon-${size}.png`);
  await sharp(SOURCE)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`✓ ${path.relative(ROOT, out)}`);
}

// Maskable icons — pad the logo so it stays inside the safe zone (80%) on
// platforms that crop the icon into a circle/squircle.
for (const size of [192, 512]) {
  const out = path.join(OUT_DIR, `icon-maskable-${size}.png`);
  const inner = Math.round(size * 0.7);
  const padding = Math.round((size - inner) / 2);
  const innerBuffer = await sharp(SOURCE)
    .resize(inner, inner, { fit: "cover" })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([{ input: innerBuffer, top: padding, left: padding }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`✓ ${path.relative(ROOT, out)}`);
}

// Apple touch icons.
for (const size of appleSizes) {
  const out = path.join(OUT_DIR, `apple-touch-icon-${size}.png`);
  await sharp(SOURCE)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`✓ ${path.relative(ROOT, out)}`);
}

// Default apple-touch-icon.png (180×180) at /apple-touch-icon.png.
const appleDefault = path.join(PUBLIC_DIR, "apple-touch-icon.png");
await sharp(SOURCE)
  .resize(180, 180, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(appleDefault);
console.log(`✓ ${path.relative(ROOT, appleDefault)}`);

// Replace app/icon.svg + app/favicon.ico-equivalent with the new logo (PNG).
// Next.js auto-detects app/icon.png and app/apple-icon.png.
await sharp(SOURCE)
  .resize(512, 512, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(path.join(APP_DIR, "icon.png"));
console.log("✓ app/icon.png");

await sharp(SOURCE)
  .resize(180, 180, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(path.join(APP_DIR, "apple-icon.png"));
console.log("✓ app/apple-icon.png");

// Generate a multi-size favicon.ico (16, 32, 48) and write it both to
// public/ (for direct /favicon.ico requests) and to app/ (Next.js convention,
// takes precedence over app/icon.png for the /favicon.ico route).
const faviconBuffers = await Promise.all(
  [16, 32, 48].map((size) =>
    sharp(SOURCE).resize(size, size, { fit: "cover" }).png().toBuffer()
  )
);
const icoBuffer = await pngToIco(faviconBuffers);
await writeFile(path.join(APP_DIR, "favicon.ico"), icoBuffer);
console.log("✓ app/favicon.ico");

// Also keep a 32×32 PNG export for tooling that prefers PNG favicons.
await sharp(SOURCE)
  .resize(32, 32, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(path.join(OUT_DIR, "favicon-32.png"));
console.log("✓ public/icons/favicon-32.png");

console.log("\nAll PWA icons generated.");
