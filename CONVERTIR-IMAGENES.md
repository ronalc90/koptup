# 🎨 Convertir Imágenes SVG a PNG

Los archivos SVG ya están creados en `/apps/web/public/`:
- ✅ `logo.svg` (512x512)
- ✅ `og-image.svg` (1200x630)
- ✅ `icon.svg` (512x512)

## Opción 1: Conversión Automática con ImageMagick (Recomendada)

### Instalar ImageMagick:
```bash
brew install imagemagick
```

### Convertir todos los archivos:
```bash
cd /Users/gt/Desktop/proyecto/koptup/apps/web/public

# Logo principal
convert -background none -resize 512x512 logo.svg logo.png

# Open Graph image
convert -background none -resize 1200x630 og-image.svg og-image.png

# PWA Icons
convert -background none -resize 192x192 icon.svg icon-192.png
convert -background none -resize 512x512 icon.svg icon-512.png

# Favicons
convert -background none -resize 32x32 icon.svg favicon-32x32.png
convert -background none -resize 16x16 icon.svg favicon-16x16.png

# Crear favicon.ico multi-size
convert favicon-16x16.png favicon-32x32.png favicon.ico

# Apple Touch Icon
convert -background none -resize 180x180 icon.svg apple-touch-icon.png
```

## Opción 2: Usar Servicio Online (Más Fácil)

1. **Abre cada SVG en el navegador**:
   - http://localhost:3001/logo.svg
   - http://localhost:3001/og-image.svg
   - http://localhost:3001/icon.svg

2. **Usa CloudConvert**:
   - Ve a: https://cloudconvert.com/svg-to-png
   - Arrastra los archivos SVG
   - Configura el tamaño de salida:
     - `logo.svg` → 512x512 → `logo.png`
     - `og-image.svg` → 1200x630 → `og-image.png`
     - `icon.svg` → 192x192 → `icon-192.png`
     - `icon.svg` → 512x512 → `icon-512.png`
   - Descarga y coloca en `/apps/web/public/`

3. **Para favicon.ico**:
   - Ve a: https://favicon.io/favicon-converter/
   - Sube `icon.svg` o `icon-192.png`
   - Descarga el favicon.ico

## Opción 3: Usar Inkscape

```bash
# Instalar Inkscape
brew install inkscape

# Convertir archivos
cd /Users/gt/Desktop/proyecto/koptup/apps/web/public

inkscape logo.svg --export-type=png --export-filename=logo.png --export-width=512 --export-height=512
inkscape og-image.svg --export-type=png --export-filename=og-image.png --export-width=1200 --export-height=630
inkscape icon.svg --export-type=png --export-filename=icon-192.png --export-width=192 --export-height=192
inkscape icon.svg --export-type=png --export-filename=icon-512.png --export-width=512 --export-height=512
```

## Opción 4: Copiar desde Navegador (Rápido)

1. **Abre el SVG en Chrome**:
   ```
   http://localhost:3001/logo.svg
   ```

2. **Click derecho → Inspeccionar**

3. **En la consola, ejecuta**:
   ```javascript
   // Crear canvas y convertir a PNG
   const canvas = document.createElement('canvas');
   canvas.width = 512;
   canvas.height = 512;
   const ctx = canvas.getContext('2d');
   const img = new Image();
   img.onload = () => {
     ctx.drawImage(img, 0, 0, 512, 512);
     canvas.toBlob(blob => {
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'logo.png';
       a.click();
     });
   };
   img.src = '/logo.svg';
   ```

## Verificar Conversión

Después de convertir, verifica que los archivos existan:

```bash
ls -lh /Users/gt/Desktop/proyecto/koptup/apps/web/public/*.png
ls -lh /Users/gt/Desktop/proyecto/koptup/apps/web/public/*.ico
```

Deberías ver:
- ✅ logo.png (512x512)
- ✅ og-image.png (1200x630)
- ✅ icon-192.png (192x192)
- ✅ icon-512.png (512x512)
- ✅ favicon-32x32.png (32x32)
- ✅ favicon-16x16.png (16x16)
- ✅ favicon.ico (multi-size)
- ✅ apple-touch-icon.png (180x180)

## Optimizar PNGs (Opcional)

Para reducir el tamaño de los archivos:

```bash
# Con pngquant
brew install pngquant
pngquant --quality=80-90 *.png

# O con TinyPNG
# Sube los archivos a https://tinypng.com/
```

---

**Recomendación**: Usa la **Opción 1 (ImageMagick)** si estás en Mac/Linux, es la más rápida y automática.
