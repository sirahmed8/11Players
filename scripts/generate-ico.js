const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIco() {
  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', '11players.ico');
  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const size of sizes) {
    // Optional: create rounded corners for 11Players shield logo so it looks sleek on Windows desktop
    const roundedCorners = Buffer.from(
      `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" ry="${Math.round(size * 0.18)}"/></svg>`
    );

    const buf = await sharp(inputPath)
      .resize(size, size, { fit: 'cover' })
      .composite([{
        input: roundedCorners,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();

    pngBuffers.push({ size, buffer: buf });
  }

  // Calculate offsets
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);      // Reserved
  header.writeUInt16LE(1, 2);      // Image type: 1 = ICO
  header.writeUInt16LE(count, 4);  // Number of images

  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(entrySize);
    const width = item.size >= 256 ? 0 : item.size;
    const height = item.size >= 256 ? 0 : item.size;

    entry.writeUInt8(width, 0);              // Width (0 means 256)
    entry.writeUInt8(height, 1);             // Height (0 means 256)
    entry.writeUInt8(0, 2);                  // Color palette count
    entry.writeUInt8(0, 3);                  // Reserved
    entry.writeUInt16LE(1, 4);               // Color planes
    entry.writeUInt16LE(32, 6);              // Bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12);         // Offset of image data

    entries.push(entry);
    offset += item.buffer.length;
  }

  const finalIcoBuffer = Buffer.concat([
    header,
    ...entries,
    ...pngBuffers.map(p => p.buffer)
  ]);

  fs.writeFileSync(outputPath, finalIcoBuffer);
  fs.writeFileSync(faviconPath, finalIcoBuffer);
  console.log(`Generated ICO successfully: ${outputPath} (${finalIcoBuffer.length} bytes)`);
}

generateIco().catch(err => {
  console.error('Failed to generate ICO:', err);
  process.exit(1);
});
