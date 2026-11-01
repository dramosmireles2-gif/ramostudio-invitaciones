// Iconos de RamoStudio (pestaña del navegador, Android e iPhone) a partir del
// sello oficial "rs": círculo pizarra, filete dorado y "rs" en Playfair itálica
// crema. Sin el texto RAMOSTUDIO del sello, que a 16-32 px no se lee.
//
//   npm run iconos   →   public/icono-32.png, icono-192.png, icono-512.png,
//                        apple-touch-icon.png (180, cuadrado: iOS redondea)
//
// Se dibuja en Chromium con la fuente autoalojada (igual que scripts/og.mjs).
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const raiz = resolve(import.meta.dirname, '..');
const fuente = `data:font/ttf;base64,${readFileSync(join(raiz, 'public', 'fonts', 'PlayfairDisplay-MediumItalic.ttf')).toString('base64')}`;

// redondo: el sello sobre fondo transparente; cuadrado: fondo pizarra completo.
const sello = (redondo) => `<!doctype html><html><head><style>
  @font-face { font-family: "Playfair Display"; src: url("${fuente}"); font-style: italic; font-weight: 500; }
  * { margin: 0; } body { width: 512px; height: 512px; background: transparent; }
</style></head><body>
  <svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    ${redondo ? '<circle cx="256" cy="256" r="256" fill="#3E5266"/>' : '<rect width="512" height="512" fill="#3E5266"/>'}
    <circle cx="256" cy="256" r="${redondo ? 226 : 196}" fill="none" stroke="#B79A6B" stroke-width="${redondo ? 14 : 10}"/>
    <text x="256" y="262" font-family="Playfair Display" font-style="italic" font-weight="500" font-size="${redondo ? 270 : 230}"
      fill="#F4EFE9" text-anchor="middle" dominant-baseline="central">rs</text>
  </svg>
</body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 512, height: 512 } });
const dibujar = async (redondo) => {
  await pagina.setContent(sello(redondo), { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);
  return pagina.screenshot({ omitBackground: true });
};
const redondo = await dibujar(true);
const cuadrado = await dibujar(false);
await navegador.close();

const salida = (nombre) => join(raiz, 'public', nombre);
for (const t of [32, 192, 512]) await sharp(redondo).resize(t, t).png({ compressionLevel: 9 }).toFile(salida(`icono-${t}.png`));
await sharp(cuadrado).resize(180, 180).png({ compressionLevel: 9 }).toFile(salida('apple-touch-icon.png'));
console.log('public/: icono-32.png, icono-192.png, icono-512.png, apple-touch-icon.png');
