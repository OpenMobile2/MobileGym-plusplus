// Locally pixelate all true-device evidence referenced by DiDi review reports.
// No source image leaves this machine and output images contain no source metadata.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../..');
const EVIDENCE_ROOT = path.join(REPO, 'didi_images/evidence');
const OUTPUT_ROOT = path.join(REPO, 'docs/didi-replication/sanitized-evidence');
const HTML_FILES = [
  path.join(REPO, 'docs/didi-replication/review.html'),
  path.join(REPO, 'docs/didi-replication/visual-diff/index.html'),
];
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const RAW_EVIDENCE_PATTERN = /(?:\.\.\/)+didi_images\/evidence\/[^"'< )]+/g;
const SANITIZED_EVIDENCE_PATTERN = /(?:\.\.\/)*sanitized-evidence\/[^"'< )]+/g;

const toPosix = (value) => value.split(path.sep).join('/');

function assertInside(root, candidate) {
  const relative = path.relative(root, candidate);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes evidence root: ${candidate}`);
  }
  return relative;
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function resolveSource(htmlPath, reference) {
  if (reference.includes('didi_images/evidence/')) {
    return path.resolve(path.dirname(htmlPath), reference);
  }

  const relativePng = reference.split('sanitized-evidence/')[1];
  const stem = relativePng.replace(/\.[^.]+$/, '');
  for (const extension of ['.png', '.jpg', '.jpeg', '.webp']) {
    const candidate = path.join(EVIDENCE_ROOT, `${stem}${extension}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot restore source for sanitized reference: ${reference}`);
}

async function sanitizeImage(page, source, output) {
  const dataUrl = `data:${mimeFor(source)};base64,${fs.readFileSync(source).toString('base64')}`;
  const sanitizedDataUrl = await page.evaluate(async ({ src }) => {
    const image = new Image();
    image.src = src;
    await image.decode();

    const blockSize = Math.max(28, Math.round(Math.min(image.naturalWidth, image.naturalHeight) / 28));
    const small = document.createElement('canvas');
    small.width = Math.max(1, Math.ceil(image.naturalWidth / blockSize));
    small.height = Math.max(1, Math.ceil(image.naturalHeight / blockSize));
    const smallContext = small.getContext('2d', { alpha: false });
    smallContext.drawImage(image, 0, 0, small.width, small.height);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = image.naturalWidth;
    outputCanvas.height = image.naturalHeight;
    const context = outputCanvas.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = false;
    context.drawImage(small, 0, 0, outputCanvas.width, outputCanvas.height);

    const badgeHeight = Math.max(34, Math.round(outputCanvas.height * 0.022));
    context.fillStyle = 'rgba(17, 24, 39, 0.88)';
    context.fillRect(0, 0, outputCanvas.width, badgeHeight);
    context.fillStyle = '#ffffff';
    context.font = `${Math.max(18, Math.round(badgeHeight * 0.48))}px sans-serif`;
    context.textBaseline = 'middle';
    context.fillText('PRIVACY-SAFE PIXELATED EVIDENCE', 16, badgeHeight / 2);

    return outputCanvas.toDataURL('image/png');
  }, { src: dataUrl });

  fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o755 });
  const temp = `${output}.tmp-${process.pid}`;
  fs.writeFileSync(temp, Buffer.from(sanitizedDataUrl.split(',')[1], 'base64'), { mode: 0o600 });
  fs.renameSync(temp, output);
  fs.chmodSync(output, 0o644);
}

async function main() {
  const documents = HTML_FILES.map((htmlPath) => ({
    htmlPath,
    source: fs.readFileSync(htmlPath, 'utf8'),
  }));
  const sources = new Map();

  for (const document of documents) {
    const references = [
      ...(document.source.match(RAW_EVIDENCE_PATTERN) ?? []),
      ...(document.source.match(SANITIZED_EVIDENCE_PATTERN) ?? []),
    ];
    for (const reference of references) {
      const source = resolveSource(document.htmlPath, reference);
      const relative = assertInside(EVIDENCE_ROOT, source);
      const outputRelative = relative.replace(/\.[^.]+$/, '.png');
      sources.set(source, path.join(OUTPUT_ROOT, outputRelative));
    }
  }

  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME });
  const page = await browser.newPage();
  try {
    for (const [source, output] of sources) {
      if (!fs.existsSync(source)) throw new Error(`Missing evidence source: ${source}`);
      await sanitizeImage(page, source, output);
      process.stdout.write('.');
    }
  } finally {
    await browser.close();
  }

  for (const document of documents) {
    const replaceReference = (reference) => {
      const source = resolveSource(document.htmlPath, reference);
      const output = sources.get(source);
      if (!output) throw new Error(`Missing sanitized mapping: ${reference}`);
      return toPosix(path.relative(path.dirname(document.htmlPath), output));
    };
    let html = document.source
      .replace(RAW_EVIDENCE_PATTERN, replaceReference)
      .replace(SANITIZED_EVIDENCE_PATTERN, replaceReference);
    if (document.htmlPath.endsWith('visual-diff/index.html')) {
      html = html.replaceAll('真机 ', '真机（脱敏） ');
    }
    if (!html.includes('data-privacy-sanitized="true"')) {
      html = html.replace(
        '<body>',
        '<body data-privacy-sanitized="true">',
      );
    }
    fs.writeFileSync(document.htmlPath, html, { mode: 0o644 });
  }

  console.log(`\nSanitized ${sources.size} evidence images and rewrote ${documents.length} reports.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
