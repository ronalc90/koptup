#!/usr/bin/env node

/**
 * Script para generar imágenes PNG desde SVG
 *
 * Este script requiere que tengas instalado uno de estos:
 * - ImageMagick: brew install imagemagick
 * - Inkscape: brew install inkscape
 * - O usar un servicio online
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const publicDir = path.join(__dirname, '..', 'public');

console.log('🎨 Generador de Imágenes KopTup\n');

// Verificar si ImageMagick está instalado
let hasImageMagick = false;
try {
  execSync('convert -version', { stdio: 'ignore' });
  hasImageMagick = true;
  console.log('✅ ImageMagick detectado');
} catch (e) {
  console.log('⚠️  ImageMagick no encontrado');
}

// Verificar si Inkscape está instalado
let hasInkscape = false;
try {
  execSync('inkscape --version', { stdio: 'ignore' });
  hasInkscape = true;
  console.log('✅ Inkscape detectado');
} catch (e) {
  console.log('⚠️  Inkscape no encontrado');
}

if (!hasImageMagick && !hasInkscape) {
  console.log('\n❌ No se encontró ImageMagick ni Inkscape');
  console.log('\nInstala uno de estos para convertir SVG a PNG:');
  console.log('  • ImageMagick: brew install imagemagick');
  console.log('  • Inkscape: brew install inkscape');
  console.log('\nO usa servicios online:');
  console.log('  • https://cloudconvert.com/svg-to-png');
  console.log('  • https://convertio.co/svg-png/');
  console.log('  • https://www.svgtopng.com/');
  process.exit(1);
}

const conversions = [
  { input: 'logo.svg', output: 'logo.png', width: 512, height: 512 },
  { input: 'og-image.svg', output: 'og-image.png', width: 1200, height: 630 },
  { input: 'icon.svg', output: 'icon-192.png', width: 192, height: 192 },
  { input: 'icon.svg', output: 'icon-512.png', width: 512, height: 512 },
  { input: 'icon.svg', output: 'favicon-32x32.png', width: 32, height: 32 },
  { input: 'icon.svg', output: 'favicon-16x16.png', width: 16, height: 16 },
];

console.log('\n🔄 Convirtiendo SVG a PNG...\n');

conversions.forEach(({ input, output, width, height }) => {
  const inputPath = path.join(publicDir, input);
  const outputPath = path.join(publicDir, output);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  ${input} no encontrado, saltando...`);
    return;
  }

  try {
    if (hasImageMagick) {
      execSync(
        `convert -background none -resize ${width}x${height} "${inputPath}" "${outputPath}"`,
        { stdio: 'pipe' }
      );
    } else if (hasInkscape) {
      execSync(
        `inkscape "${inputPath}" --export-type=png --export-filename="${outputPath}" --export-width=${width} --export-height=${height}`,
        { stdio: 'pipe' }
      );
    }
    console.log(`✅ ${output} (${width}x${height})`);
  } catch (error) {
    console.log(`❌ Error generando ${output}: ${error.message}`);
  }
});

console.log('\n✨ ¡Conversión completada!');
console.log('\nArchivos generados en: /apps/web/public/');
