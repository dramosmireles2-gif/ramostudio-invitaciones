// Optimiza las fotos de un evento: eventos/<slug>/_originales/ → eventos/<slug>/fotos/.
//
//   npm run fotos -- <slug>                 Todas las fotos de _originales/
//   npm run fotos -- <slug> --og <archivo>  Además, og.jpg (1200x630) desde ese original
//   npm run fotos -- <slug> --og <archivo> --og-y 0.4   Recorte del og.jpg centrado a esa altura
//   npm run fotos -- <slug> --bn            Todo en blanco y negro (si el diseño lo pide)
//
// Por cada original salen AVIF, WebP y JPG (respaldo) en varios anchos, sin
// agrandar nunca la foto, sin metadatos (EXIF, GPS) y con la orientación
// corregida. fotos/fotos.json guarda ancho y alto de cada tamaño, para poner
// width/height en el HTML y no mover la página al cargar.
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import sharp from 'sharp';

const ANCHOS = [640, 1280, 1920]; // Nunca más que el original.
const FORMATOS = [
  ['avif', (img) => img.avif({ quality: 50, effort: 6 })],
  ['webp', (img) => img.webp({ quality: 72 })],
  ['jpg', (img) => img.jpeg({ quality: 75, mozjpeg: true, progressive: true })],
];
const ENTRADAS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.heic', '.heif', '.avif']);
const OG_MAX_BYTES = 300 * 1024;

const [slug, ...resto] = process.argv.slice(2);
const bn = resto.includes('--bn');
// Orientación EXIF aplicada y, con --bn, blanco y negro.
const abrir = (archivo) => {
  const img = sharp(archivo).rotate();
  return bn ? img.grayscale() : img;
};
if (!slug) {
  console.error('Uso: npm run fotos -- <slug> [--og <archivo original>]');
  process.exit(1);
}
const carpeta = resolve(import.meta.dirname, '..', 'eventos', slug);
const originales = join(carpeta, '_originales');
const salida = join(carpeta, 'fotos');
if (!existsSync(originales)) {
  console.error(`No existe eventos/${slug}/_originales/.`);
  process.exit(1);
}
mkdirSync(salida, { recursive: true });

// "IMG_2041 copia.JPG" → "img-2041-copia"
const nombreLimpio = (archivo) => basename(archivo, extname(archivo))
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

const manifiesto = {};
for (const archivo of readdirSync(originales).filter((f) => ENTRADAS.has(extname(f).toLowerCase())).sort()) {
  const nombre = nombreLimpio(archivo);
  const base = abrir(join(originales, archivo));
  // autoOrient: el tamaño ya con la orientación EXIF aplicada.
  const m = await base.clone().metadata();
  const { width, height } = m.autoOrient ?? m;
  const anchos = [...new Set(ANCHOS.map((a) => Math.min(a, width)))];
  manifiesto[nombre] = { original: archivo, tamanos: [] };
  for (const ancho of anchos) {
    const alto = Math.round((height * ancho) / width);
    for (const [ext, codificar] of FORMATOS) {
      const destino = join(salida, `${nombre}-${ancho}.${ext}`);
      await codificar(base.clone().resize({ width: ancho })).toFile(destino);
    }
    manifiesto[nombre].tamanos.push({ width: ancho, height: alto });
    const pesos = FORMATOS.map(([ext]) => `${ext} ${kb(statSync(join(salida, `${nombre}-${ancho}.${ext}`)).size)}`);
    console.log(`${nombre}-${ancho}  ${ancho}x${alto}  ${pesos.join(' · ')}`);
  }
}
writeFileSync(join(salida, 'fotos.json'), `${JSON.stringify(manifiesto, null, 2)}\n`);

// Vista previa de WhatsApp: 1200x630, recortada al centro, menos de 300 KB.
const iOg = resto.indexOf('--og');
if (iOg !== -1) {
  const archivo = resto[iOg + 1];
  if (!archivo || !existsSync(join(originales, archivo))) {
    console.error(`--og: no existe _originales/${archivo ?? ''}.`);
    process.exit(1);
  }
  const og = join(carpeta, 'og.jpg');
  // Con --og-y <0 a 1> se recorta a mano a 1200:630 alrededor de esa altura
  // (0 arriba, 1 abajo); sin él, sharp elige la zona.
  const iY = resto.indexOf('--og-y');
  let recorte = null;
  if (iY !== -1) {
    const m = await sharp(join(originales, archivo)).metadata();
    const { width: w, height: h } = m.autoOrient ?? m;
    const alto = Math.min(h, Math.round((w * 630) / 1200));
    const top = Math.round(Number(resto[iY + 1]) * h - alto / 2);
    recorte = { left: 0, width: w, height: alto, top: Math.max(0, Math.min(h - alto, top)) };
  }
  for (let calidad = 82; calidad >= 50; calidad -= 6) {
    const img = abrir(join(originales, archivo));
    await (recorte ? img.extract(recorte) : img)
      .resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' })
      .jpeg({ quality: calidad, mozjpeg: true }).toFile(og);
    if (statSync(og).size <= OG_MAX_BYTES) break;
  }
  console.log(`og.jpg  1200x630  ${kb(statSync(og).size)}`);
}
