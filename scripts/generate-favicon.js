const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

(async () => {
  try {
    const publicDir = path.join(__dirname, '..', 'public');
    const svgPath = path.join(publicDir, 'favicon.svg');
    const pngPath = path.join(publicDir, 'favicon-256.png');
    const icoPath = path.join(publicDir, 'favicon.ico');

    if (!fs.existsSync(svgPath)) {
      console.error('favicon.svg not found in public/. Create public/favicon.svg first.');
      process.exit(2);
    }

    // Render a 256x256 PNG from the SVG
    await sharp(svgPath).resize(256, 256).png().toFile(pngPath);

    // Convert PNG to ICO (supports multiple sizes if needed)
    const buffer = await pngToIco([pngPath]);
    fs.writeFileSync(icoPath, buffer);

    // Clean up temporary PNG
    try {
      fs.unlinkSync(pngPath);
    } catch (e) {
      // ignore
    }

    console.log('Generated', icoPath);
  } catch (err) {
    console.error('Error generating favicon:', err);
    process.exit(1);
  }
})();