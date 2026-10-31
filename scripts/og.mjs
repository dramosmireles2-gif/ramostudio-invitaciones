// Vista previa de WhatsApp (og.jpg, 1200x630, menos de 300 KB) con el diseño
// del evento: foto a la izquierda y, a la derecha, el sello del monograma,
// "Nos casamos", los nombres, la fecha y la ciudad en sus fuentes y colores.
// Así el enlace se entiende en miniatura sin abrirlo.
//
//   npm run og -- <slug>                    Con la foto intermedia del evento
//   npm run og -- <slug> --foto <nombre>    Con otra foto de fotos/ (p. ej. sombreros)
//
// Se dibuja en Chromium (Playwright) para usar las fuentes autoalojadas de
// public/fonts/ y se comprime con sharp. Sin fotos/ optimizadas, correr antes
// `npm run fotos -- <slug>`.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { fechaInvitacion } from '../src/lib/fechas.js';

const OG_MAX_BYTES = 300 * 1024; // WhatsApp descarta vistas previas más pesadas.
const raiz = resolve(import.meta.dirname, '..');

const [slug, ...resto] = process.argv.slice(2);
if (!slug) {
  console.error('Uso: npm run og -- <slug> [--foto <nombre>]');
  process.exit(1);
}
const carpeta = join(raiz, 'eventos', slug);
const evento = JSON.parse(readFileSync(join(carpeta, 'evento.json'), 'utf8')).eventos[0];
const fotosJson = join(carpeta, 'fotos', 'fotos.json');
if (!existsSync(fotosJson)) {
  console.error(`Faltan las fotos optimizadas: npm run fotos -- ${slug}`);
  process.exit(1);
}

// La foto: --foto <nombre> o la intermedia del evento, en su tamaño más grande.
const iFoto = resto.indexOf('--foto');
const nombre = iFoto !== -1 ? resto[iFoto + 1] : (evento.og?.foto ?? evento.fotos?.intermedia?.nombre);
const todas = [evento.fotos?.portada, evento.fotos?.intermedia, ...(evento.fotos?.galeria ?? [])].filter(Boolean);
const foto = todas.find((f) => f.nombre === nombre);
if (!foto) {
  console.error(`--foto: "${nombre}" no está en evento.fotos (${todas.map((f) => f.nombre).join(', ')}).`);
  process.exit(1);
}
const archivoFoto = join(carpeta, 'fotos', `${foto.nombre}-${Math.max(...foto.anchos)}.jpg`);

const t = evento.tema ?? {};
const c = t.colores ?? {};
const v = t.variables ?? {};
const fuentes = t.fuentes ?? {};
// Fuentes y foto van dentro del HTML (data:), porque la página no puede leer archivos locales.
const dataUrl = (ruta, tipo) => `data:${tipo};base64,${readFileSync(ruta).toString('base64')}`;
const url = (archivo) => dataUrl(join(raiz, 'public', 'fonts', archivo), archivo.endsWith('.woff2') ? 'font/woff2' : 'font/ttf');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[x]);
const fecha = fechaInvitacion(evento.fecha, evento.zonaHoraria);
const etiqueta = { boda: 'Nos casamos', xv: 'Mis XV años' }[evento.tipo] ?? 'Están invitados';
const acento = v['hilo-sobre'] ?? c.accent ?? '#B79A6B';

const html = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><style>
  @font-face { font-family: "Bodoni Moda"; src: url("${url('BodoniModa-Variable-latin.woff2')}"); font-weight: 400 600; }
  @font-face { font-family: "Bodoni Moda"; src: url("${url('BodoniModa-Italic-Variable-latin.woff2')}"); font-weight: 400 600; font-style: italic; }
  @font-face { font-family: "Playfair Display"; src: url("${url('PlayfairDisplay-Regular.ttf')}"); }
  @font-face { font-family: "Playfair Display"; src: url("${url('PlayfairDisplay-RegularItalic.ttf')}"); font-style: italic; }
  @font-face { font-family: "Great Vibes"; src: url("${url('GreatVibes-Regular.ttf')}"); }
  @font-face { font-family: "Montserrat"; src: url("${url('Montserrat-SemiBold.ttf')}"); font-weight: 600; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; display: grid; grid-template-columns: 540px 1fr; background: ${c.bg ?? '#F4EFE9'}; overflow: hidden; }
  .foto { width: 100%; height: 100%; object-fit: cover; object-position: ${foto.foco ?? '50% 40%'}; display: block; }
  .texto { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 64px; color: ${c.text ?? '#2B2A28'}; }
  .texto::before { content: ""; position: absolute; inset: 26px; border: 2px dashed ${acento}; opacity: .7; }
  .etiqueta { font: 600 20px "Montserrat"; letter-spacing: .3em; text-transform: uppercase; color: ${v['etiqueta-color'] ?? c.text2 ?? c.text}; }
  .nombres { margin-top: 14px; font-family: "${fuentes.script ?? 'Great Vibes'}"; font-style: ${v['nombres-style'] ?? 'normal'}; font-size: 96px; line-height: 1.05; white-space: nowrap; }
  .filete { position: relative; width: 300px; height: 2px; margin: 26px 0 24px; background: linear-gradient(90deg, transparent, ${acento} 30%, ${acento} 70%, transparent); }
  .filete::after { content: ""; position: absolute; left: 50%; top: 50%; width: 12px; height: 12px; background: ${acento}; transform: translate(-50%, -50%) rotate(45deg); }
  .fecha { font-family: "${fuentes.title ?? 'Playfair Display'}"; font-size: 32px; line-height: 1.2; white-space: nowrap; }
  .fecha::first-letter { text-transform: uppercase; }
  .ciudad { margin-top: 16px; font: 600 19px "Montserrat"; letter-spacing: .24em; text-transform: uppercase; color: ${c.text2 ?? c.text}; }
  .sello { width: 96px; height: 96px; margin-bottom: 22px; flex: none; border-radius: 50%;
    display: grid; place-items: center; background: ${c.seal ?? acento}; color: ${c.onSeal ?? '#fff'};
    box-shadow: inset 0 0 0 7px rgba(0,0,0,.12), inset 0 0 0 9px rgba(255,255,255,.25), 0 0 0 0 transparent;
    font: italic 32px "${fuentes.title ?? 'Playfair Display'}"; }
</style></head><body>
  <img class="foto" src="${dataUrl(archivoFoto, 'image/jpeg')}" alt="">
  <div class="texto">
    ${t.monograma ? `<div class="sello">${esc(t.monograma)}</div>` : ''}
    <p class="etiqueta">${esc(etiqueta)}</p>
    <p class="nombres">${esc(evento.titulo)}</p>
    <span class="filete"></span>
    <p class="fecha">${esc(fecha)}</p>
    ${evento.ciudad ? `<p class="ciudad">${esc(evento.ciudad)}</p>` : ''}
  </div>
</body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html, { waitUntil: 'load' });
await pagina.evaluate(() => document.fonts.ready);
// Si los nombres o la fecha no caben, se achican hasta caber.
await pagina.evaluate(() => {
  const n = document.querySelector('.nombres');
  const max = n.parentElement.clientWidth - 150;
  let tam = 96;
  while (n.scrollWidth > max && tam > 48) n.style.fontSize = `${(tam -= 4)}px`;
  const f = document.querySelector('.fecha');
  let tf = 32;
  while (f.scrollWidth > max && tf > 20) f.style.fontSize = `${(tf -= 2)}px`;
});
const png = await pagina.screenshot({ type: 'png' });
await navegador.close();

const og = join(carpeta, 'og.jpg');
for (let calidad = 86; calidad >= 50; calidad -= 6) {
  await sharp(png).jpeg({ quality: calidad, mozjpeg: true }).toFile(og);
  if (statSync(og).size <= OG_MAX_BYTES) break;
}
console.log(`og.jpg  1200x630  ${Math.round(statSync(og).size / 1024)} KB  (foto: ${foto.nombre})`);
