import sharp from 'sharp';
import fs from 'fs';
const svg = fs.readFileSync('/tmp/test-logo.svg');
const png = await sharp(Buffer.from(svg)).png().toBuffer();
fs.writeFileSync('/sessions/gracious-gallant-turing/mnt/FORGE/test-logo-output.png', png);
console.log('OK:', png.length, 'bytes');
