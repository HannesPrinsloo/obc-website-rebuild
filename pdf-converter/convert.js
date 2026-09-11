const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Grab inputs from the terminal command
const inputPath = process.argv[2];
const targetFolder = process.argv[3];
const quality = process.argv[4] || 75;
// Optional lqip=y flag — when set, images are resized to 20px wide for use as placeholders.
const isLqip = process.argv[5] === 'lqip=y';

if (!inputPath) {
  console.error('Error: Please provide a file or folder path. Example: node convert.js ./raw-images ./optimized 80');
  process.exit(1);
}

const outputDir = targetFolder ? path.resolve(targetFolder) : __dirname;

if (!fs.existsSync(outputDir)) {
  console.log(`Creating target folder: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`\nStarting conversion pipeline...`);
console.log(`Target compression quality: ${quality}%`);
console.log(`LQIP mode: ${isLqip ? 'ON (images will be resized to 20px wide)' : 'OFF'}`);
console.log(`Outputting final files to: ${outputDir}\n`);

try {
  // Check if the input is a folder or a file
  const stats = fs.statSync(inputPath);

  // --- ROUTE A: BATCH FOLDER OF PNGS ---
  if (stats.isDirectory()) {
    console.log(`1. Scanning directory for PNGs: ${inputPath}`);
    const files = fs.readdirSync(inputPath);
    const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');

    if (pngFiles.length === 0) {
      console.log('No PNGs found in the provided folder.');
      process.exit(0);
    }

    console.log(`2. Found ${pngFiles.length} PNG(s). Crushing to WebP...`);
    pngFiles.forEach(png => {
      const pngPath = path.join(inputPath, png);
      const baseName = path.parse(png).name;
      // Append '-lqip' to filename when in lqip mode so outputs don't overwrite originals.
      const outName = isLqip ? `${baseName}-lqip.webp` : `${baseName}.webp`;
      const webpPath = path.join(outputDir, outName);

      // In lqip mode, resize to 20px wide (height auto via '0') before compressing.
      const resizeFlag = isLqip ? '-resize 20 0 ' : '';
      const cwebpCommand = `npx cwebp-bin ${resizeFlag}-q ${quality} "${pngPath}" -o "${webpPath}"`;
      execSync(cwebpCommand, { stdio: 'ignore' });
      console.log(` -> Created ${path.basename(webpPath)}`);
    });

    // --- ROUTE B: SINGLE FILE (PDF OR PNG) ---
  } else if (stats.isFile()) {
    const ext = path.extname(inputPath).toLowerCase();
    const baseName = path.parse(inputPath).name;

    if (ext === '.pdf') {
      console.log(`1. Extracting PDF pages from ${baseName}.pdf as high-res PNGs...`);
      const pngOutputPattern = path.join(outputDir, `${baseName}-page-%d.png`);
      const gsCommand = `gswin64c -sDEVICE=png16m -r150 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${pngOutputPattern}" "${inputPath}"`;
      execSync(gsCommand);

      console.log('2. Locating extracted pages...');
      const files = fs.readdirSync(outputDir);
      const extractedPngs = files.filter(file => file.startsWith(`${baseName}-page-`) && file.endsWith('.png'));

      console.log(`3. Crushing to WebP & cleaning up...`);
      extractedPngs.forEach(png => {
        const pngPath = path.join(outputDir, png);
        const webpPath = path.join(outputDir, png.replace('.png', '.webp'));

        const cwebpCommand = `npx cwebp-bin -q ${quality} "${pngPath}" -o "${webpPath}"`;
        execSync(cwebpCommand, { stdio: 'ignore' });

        fs.unlinkSync(pngPath); // Delete temporary PNG
        console.log(` -> Created ${path.basename(webpPath)}`);
      });

    } else if (ext === '.png') {
      console.log(`1. Converting ${baseName}.png directly to WebP...`);
      // Append '-lqip' to filename when in lqip mode.
      const outName = isLqip ? `${baseName}-lqip.webp` : `${baseName}.webp`;
      const webpPath = path.join(outputDir, outName);

      const resizeFlag = isLqip ? '-resize 20 0 ' : '';
      const cwebpCommand = `npx cwebp-bin ${resizeFlag}-q ${quality} "${inputPath}" -o "${webpPath}"`;
      execSync(cwebpCommand, { stdio: 'ignore' });
      console.log(` -> Created ${path.basename(webpPath)}`);

    } else {
      console.error('Error: Unsupported file type. Please provide a .pdf, a .png, or a folder of PNGs.');
      process.exit(1);
    }
  }

  console.log('\nWeb-ready assets are optimized and ready to deploy.');

} catch (error) {
  console.error('An error occurred during the process:', error.message);
}