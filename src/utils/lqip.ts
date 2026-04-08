import sharp from 'sharp';

/**
 * Generates an inline Base64 LQIP from a file path or a pre-read Buffer.
 *
 * Accepts Buffer because Astro's build compiles pages into dist/ — relative
 * paths from import.meta.url no longer point to src/. Use fs.readFile with
 * process.cwd() to resolve source files, then pass the Buffer here.
 */
export async function generateLqip(input: Buffer | string): Promise<string> {
  const image = sharp(input);
  const metadata = await image.metadata();

  const buffer = await image
    .resize(20)
    .webp({ quality: 20 })
    .toBuffer();

  const base64Webp = buffer.toString('base64');

  //Some finessing to ensure aspect ratio when scaled up again
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${metadata.width} ${metadata.height}">
  <image width="100%" height="100%" href="data:image/webp;base64,${base64Webp}" preserveAspectRatio="none" />
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

