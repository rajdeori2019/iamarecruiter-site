const fs = require('fs');
const path = require('path');

const partsDir = path.join(__dirname, '..', 'public', 'assets', 'talent-bundle-final');
const outputPath = path.join(__dirname, '..', 'public', 'assets', 'talent-intelligence-starter-pack-bundle.webp');

const parts = fs.readdirSync(partsDir)
  .filter((name) => /^p\d+\.b64$/.test(name))
  .sort();

if (!parts.length) {
  throw new Error('No Starter Pack image chunks found.');
}

const base64 = parts
  .map((name) => fs.readFileSync(path.join(partsDir, name), 'utf8').trim())
  .join('');

const buffer = Buffer.from(base64, 'base64');

if (buffer.length < 40000) {
  throw new Error(`Starter Pack image is unexpectedly small: ${buffer.length} bytes`);
}

const riff = buffer.subarray(0, 4).toString('ascii');
const webp = buffer.subarray(8, 12).toString('ascii');
if (riff !== 'RIFF' || webp !== 'WEBP') {
  throw new Error('Starter Pack image chunks did not reconstruct a valid WebP container.');
}

fs.writeFileSync(outputPath, buffer);
console.log(`Starter Pack image rebuilt: ${buffer.length} bytes from ${parts.length} chunks.`);
