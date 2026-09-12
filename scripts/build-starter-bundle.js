const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'public', 'assets', 'talent-bundle-final');
const outputPath = path.join(__dirname, '..', 'public', 'assets', 'talent-intelligence-starter-pack-bundle.webp');

const parts = fs.readdirSync(sourceDir)
  .filter((name) => /^p\d+\.b64$/.test(name))
  .sort();

if (!parts.length) {
  throw new Error('Starter Pack image chunks were not found.');
}

const base64 = parts
  .map((name) => fs.readFileSync(path.join(sourceDir, name), 'utf8').trim())
  .join('');

const image = Buffer.from(base64, 'base64');

if (image.length < 50000 || image.subarray(0, 4).toString('ascii') !== 'RIFF' || image.subarray(8, 12).toString('ascii') !== 'WEBP') {
  throw new Error(`Starter Pack image reconstruction failed validation (${image.length} bytes).`);
}

fs.writeFileSync(outputPath, image);
console.log(`Starter Pack bundle rebuilt: ${parts.length} parts, ${image.length} bytes.`);
