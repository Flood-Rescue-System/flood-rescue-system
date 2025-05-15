import sharp from "sharp";
import fs from "fs";
import path from "path";

async function generateFavicon() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const svgBuffer = fs.readFileSync(
    path.join(process.cwd(), "public/favicon/favicon.svg")
  );

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .toFile(path.join(process.cwd(), `public/favicon/favicon-${size}.png`));
  }

  // Also generate dark version
  const svgDarkBuffer = fs.readFileSync(
    path.join(process.cwd(), "public/favicon/favicon-dark.svg")
  );

  for (const size of sizes) {
    await sharp(svgDarkBuffer)
      .resize(size, size)
      .toFile(
        path.join(process.cwd(), `public/favicon/favicon-dark-${size}.png`)
      );
  }
}

generateFavicon().catch(console.error);
