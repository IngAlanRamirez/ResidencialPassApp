/**
 * Genera splash: imagen centrada con fondo negro en el espacio sobrante.
 * Uso: node scripts/generate-splash.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '../assets');
const SRC_IMAGE = path.join(ASSETS_DIR, 'splash.png');
const OUT_IMAGE = path.join(ASSETS_DIR, 'splash.png');
const WIDTH = 2732;
const HEIGHT = 4864; // 9:16 portrait
const BG_COLOR = '#000000';

async function generate() {
  const srcPath = fs.existsSync(path.join(ASSETS_DIR, 'splash-original.png'))
    ? path.join(ASSETS_DIR, 'splash-original.png')
    : SRC_IMAGE;
  if (!fs.existsSync(srcPath)) {
    console.error('No se encontró imagen en assets/splash.png ni assets/splash-original.png');
    process.exit(1);
  }

  const image = sharp(srcPath);
  const meta = await image.metadata();
  const { width: w, height: h } = meta;

  const scale = Math.min(WIDTH / w, HEIGHT / h);
  const newWidth = Math.round(w * scale);
  const newHeight = Math.round(h * scale);
  const left = Math.round((WIDTH - newWidth) / 2);
  const top = Math.round((HEIGHT - newHeight) / 2);

  const resized = await image
    .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: BG_COLOR,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(OUT_IMAGE);

  const webSplash = path.join(__dirname, '../src/assets/images/splash.png');
  const webDir = path.dirname(webSplash);
  if (fs.existsSync(webDir)) {
    fs.copyFileSync(OUT_IMAGE, webSplash);
    console.log(`Copiado a ${webSplash}`);
  }

  console.log(`Splash generado: ${OUT_IMAGE} (${WIDTH}x${HEIGHT} portrait)`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
