const fs = require('fs');
const path = require('path');
const svg2png = require('svg2png');
const pngToIco = require('png-to-ico');

// Read the SVG file
const svgPath = path.join(__dirname, 'public', 'favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Convert SVG to PNG
svg2png(svgBuffer, { width: 32, height: 32 })
  .then(pngBuffer => {
    // Write PNG file (optional)
    fs.writeFileSync(path.join(__dirname, 'public', 'favicon.png'), pngBuffer);
    
    // Convert PNG to ICO
    return pngToIco([pngBuffer]);
  })
  .then(icoBuffer => {
    // Write ICO file
    fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), icoBuffer);
    console.log('favicon.ico has been generated successfully!');
  })
  .catch(err => {
    console.error('Error generating favicon:', err);
  }); 