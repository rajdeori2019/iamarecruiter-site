const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'public', 'assets', 'talent-bundle-hq');
const outputPath = path.join(__dirname, '..', 'public', 'assets', 'talent-intelligence-starter-pack-bundle.webp');
const parts = ['hq0.b64', 'hq1.b64'];

const base64 = parts
  .map((name) => fs.readFileSync(path.join(sourceDir, name), 'utf8').trim())
  .join('');

const image = Buffer.from(base64, 'base64');
const isWebP = image.subarray(0, 4).toString('ascii') === 'RIFF' && image.subarray(8, 12).toString('ascii') === 'WEBP';

if (!isWebP || image.length !== 105206) {
  throw new Error(`Starter Pack HQ image reconstruction failed validation (${image.length} bytes, WebP=${isWebP}).`);
}

fs.writeFileSync(outputPath, image);
console.log(`Starter Pack HQ image rebuilt: ${image.length} bytes from ${parts.length} chunks.`);
