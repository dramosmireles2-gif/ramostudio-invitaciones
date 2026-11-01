// Vista previa de la web de RamoStudio al compartir ramostudio.com.mx
// (public/og-ramostudio.jpg, 1200x630, menos de 300 KB): la marca, la promesa
// y dos pantallas del demo en el marco de celular de la web.
//
//   npm run og:marca
//
// Igual que scripts/og.mjs: se dibuja en Chromium con las fuentes autoalojadas
// y se comprime con sharp. Usa las capturas de portafolio/mariana-diego/
// (npm run portafolio -- mariana-diego).
import { readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const OG_MAX_BYTES = 300 * 1024;
const raiz = resolve(import.meta.dirname, '..');
const dataUrl = (ruta, tipo) => `data:${tipo};base64,${readFileSync(ruta).toString('base64')}`;
const fuente = (archivo) => dataUrl(join(raiz, 'public', 'fonts', archivo), 'font/ttf');
const captura = (nombre) => dataUrl(join(raiz, 'portafolio', 'mariana-diego', `${nombre}-600.jpg`), 'image/jpeg');

const html = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><style>
  @font-face { font-family: "Playfair Display"; src: url("${fuente('PlayfairDisplay-Regular.ttf')}"); }
  @font-face { font-family: "Playfair Display"; src: url("${fuente('PlayfairDisplay-RegularItalic.ttf')}"); font-style: italic; }
  @font-face { font-family: "Montserrat"; src: url("${fuente('Montserrat-Medium.ttf')}"); font-weight: 500; }
  @font-face { font-family: "Montserrat"; src: url("${fuente('Montserrat-SemiBold.ttf')}"); font-weight: 600; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #F4EFE9; color: #3E5266;
    display: grid; grid-template-columns: 660px 1fr; font-family: "Montserrat"; }
  .texto { padding: 64px 0 56px 72px; display: flex; flex-direction: column; }
  .marca { font: 40px "Playfair Display"; letter-spacing: 1px; color: #3E5266; }
  .filete { width: 56px; height: 2px; background: #B79A6B; margin: 40px 0 28px; }
  h1 { font: 58px/1.08 "Playfair Display"; color: #2B2A28; font-weight: 400; }
  h1 em { color: #3E5266; }
  .datos { margin-top: auto; font: 600 19px "Montserrat"; letter-spacing: .01em; white-space: nowrap; }
  .piezas { position: relative; }
  .cel { position: absolute; width: 236px; border: 8px solid #3E5266; border-radius: 34px; overflow: hidden; background: #3E5266; }
  .cel img { display: block; width: 100%; border-radius: 26px; }
  .cel--1 { left: 28px; top: 70px; }
  .cel--2 { left: 286px; top: 28px; }
</style></head><body>
  <div class="texto">
    <p class="marca">ramostudio</p>
    <span class="filete"></span>
    <h1>Tus invitados confirman en un toque. <em>Tú ves quién va.</em></h1>
    <p class="datos">Invitaciones digitales · Desde $800 MXN · Lista en 3 a 5 días</p>
  </div>
  <div class="piezas">
    <div class="cel cel--1"><img src="${captura('01-sobre')}" alt=""></div>
    <div class="cel cel--2"><img src="${captura('04-confirmacion')}" alt=""></div>
  </div>
</body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html, { waitUntil: 'load' });
await pagina.evaluate(() => document.fonts.ready);
const png = await pagina.screenshot({ type: 'png' });
await navegador.close();

const og = join(raiz, 'public', 'og-ramostudio.jpg');
for (let calidad = 86; calidad >= 50; calidad -= 6) {
  await sharp(png).jpeg({ quality: calidad, mozjpeg: true }).toFile(og);
  if (statSync(og).size <= OG_MAX_BYTES) break;
}
console.log(`public/og-ramostudio.jpg  1200x630  ${Math.round(statSync(og).size / 1024)} KB`);
