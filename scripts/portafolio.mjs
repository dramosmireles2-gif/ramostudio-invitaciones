// Material del portafolio de la web (docs/web/plan-web.md, sección 6):
// capturas de celular (390x844, escala 3x) y video del sobre abriéndose, para
// cada invitación. Uso: npm run portafolio [-- <slug> ...]
//
//   portafolio/<slug>/01-sobre, 02-portada, 03-seccion, 04-confirmacion
//                     .avif .webp .jpg   (capturas)
//   portafolio/<slug>/sobre.mp4 + sobre-poster.avif/.webp/.jpg (4-6 s, < 1 MB)
//   portafolio/<slug>/info.json          (título, enlace de muestra, crédito)
//
// Reglas (no se negocian):
// - Nunca se confirma asistencia ni se deja mensaje: solo se ven las pantallas.
// - Iris & Alex corre en un Vite propio con VITE_DATOS=local (no toca Supabase).
// - Las invitaciones del repo viejo (demoInvitacion) se sirven desde su copia
//   local, solo lectura, sin ?g= (sin invitado no registran la visita), y el
//   navegador bloquea cualquier escritura a Firestore por si acaso.
// - La mesa de regalos del repo viejo trae la CLABE real: no se captura.
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import ffmpeg from 'ffmpeg-static';
import sharp from 'sharp';

const RAIZ = resolve(import.meta.dirname, '..');
const REPO_VIEJO = resolve(RAIZ, '..', 'demoInvitacion');
const PUERTO_VITE = 5198;
const PUERTO_VIEJO = 5197;
const VIDEO_MAX_BYTES = 1024 * 1024;

const iris = JSON.parse(readFileSync(join(RAIZ, 'eventos/iris-alex/evento.json'), 'utf8')).eventos[0];

// Cómo abrir cada invitación y qué capturar. `seccion` y `confirmacion` son
// funciones que reciben la página y devuelven el elemento a llevar arriba.
const NUEVA = {
  abrir: async (page) => {
    await page.getByRole('button', { name: 'Abrir la invitación' }).click({ force: true });
    await page.locator('.sobre').waitFor({ state: 'detached', timeout: 10_000 });
  },
  seccion: (page) => page.locator('[data-seccion="evento"]'),
  confirmacion: (page) => page.locator('[data-seccion="rsvp"]'),
};
const VIEJA = {
  abrir: async (page) => {
    await page.locator('#envelope-screen').click();
    await page.locator('#invitation.show').waitFor({ timeout: 10_000 });
  },
  seccion: (page) => page.locator('.section-label', { hasText: 'Dónde nos encontramos' }).locator('..'),
  confirmacion: (page) => page.locator('#rsvp-section'),
};

const INVITACIONES = {
  'iris-alex': {
    ...NUEVA,
    url: `http://localhost:${PUERTO_VITE}/iris-alex/`,
    info: { titulo: iris.titulo, tipo: iris.tipo, ciudad: iris.ciudad, enlace: '/iris-alex/?muestra=1', creditoFotos: iris.creditoFotos },
  },
  'eunice-edher': {
    ...VIEJA,
    url: `http://localhost:${PUERTO_VIEJO}/eunice-edher/`,
    // En vivo hasta el 19 de diciembre de 2026, en el repo viejo: sin enlace.
    info: { titulo: 'Eunice & Edher', tipo: 'boda', enlace: null, creditoFotos: null },
  },
  'ivan-gemima': {
    ...VIEJA,
    url: `http://localhost:${PUERTO_VIEJO}/ivan-gemima/`,
    // Ya pasó; vive en un dominio de RamosMKT: sin enlace.
    info: { titulo: 'Iván & Gemima', tipo: 'boda', enlace: null, creditoFotos: null },
  },
};

// Servidor estático mínimo para el repo viejo (solo GET, nada se escribe).
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.webp': 'image/webp' };
function servirRepoViejo() {
  const server = createServer((req, res) => {
    let ruta = join(REPO_VIEJO, decodeURIComponent(req.url.split('?')[0]));
    if (!ruta.startsWith(REPO_VIEJO)) return res.writeHead(403).end();
    if (existsSync(ruta) && statSync(ruta).isDirectory()) ruta = join(ruta, 'index.html');
    if (!existsSync(ruta)) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta).toLowerCase()] ?? 'application/octet-stream' });
    createReadStream(ruta).pipe(res);
  });
  return new Promise((listo) => server.listen(PUERTO_VIEJO, () => listo(server)));
}

async function levantarVite() {
  const vite = spawn('npx', ['vite', '--port', String(PUERTO_VITE), '--strictPort'], {
    cwd: RAIZ, shell: true, stdio: 'ignore', env: { ...process.env, VITE_DATOS: 'local' },
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${PUERTO_VITE}/`)).ok) return vite;
    } catch { /* todavía no arranca */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Vite no arrancó en el puerto ' + PUERTO_VITE);
}

async function guardarImagen(png, destino) {
  const img = sharp(png);
  await img.clone().avif({ quality: 50, effort: 6 }).toFile(`${destino}.avif`);
  await img.clone().webp({ quality: 78 }).toFile(`${destino}.webp`);
  await img.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${destino}.jpg`);
}

// El elemento arriba de la pantalla, con un respiro, y tiempo para que
// terminen las animaciones de entrada.
async function llevarArriba(page, locator) {
  await locator.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24));
  await page.waitForTimeout(1800);
}

function recortarVideo(webm, desde, destino) {
  for (const crf of [26, 28, 30, 32, 34]) {
    execFileSync(ffmpeg, [
      '-y', '-loglevel', 'error', '-ss', desde.toFixed(2), '-i', webm, '-t', '5',
      '-vf', 'scale=540:-2,fps=30', '-c:v', 'libx264', '-crf', String(crf), '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', destino,
    ]);
    if (statSync(destino).size < VIDEO_MAX_BYTES) return crf;
  }
  throw new Error(`${destino} sigue pesando más de 1 MB.`);
}

async function contexto(browser, extra = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    locale: 'es-MX', timezoneId: 'America/Matamoros', ...extra,
  });
  // Ninguna escritura a Firestore (repo viejo), pase lo que pase.
  await ctx.route(/firestore\.googleapis\.com\/.*\/Write\//, (r) => r.abort());
  return ctx;
}

async function capturar(browser, slug, inv, temporal) {
  const carpeta = join(RAIZ, 'portafolio', slug);
  mkdirSync(carpeta, { recursive: true });

  // 1. Capturas.
  const ctx = await contexto(browser);
  const page = await ctx.newPage();
  await page.goto(inv.url, { waitUntil: 'load' });
  await page.waitForTimeout(3000); // Firestore deja la red abierta: no hay "networkidle".
  const tomas = [['01-sobre', await page.screenshot()]];
  await inv.abrir(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2000);
  tomas.push(['02-portada', await page.screenshot()]);
  await llevarArriba(page, inv.seccion(page));
  tomas.push(['03-seccion', await page.screenshot()]);
  await llevarArriba(page, inv.confirmacion(page));
  tomas.push(['04-confirmacion', await page.screenshot()]);
  await ctx.close();
  for (const [nombre, png] of tomas) await guardarImagen(png, join(carpeta, nombre));

  // 2. Video del sobre: 1 s antes del toque y 4 s de apertura.
  const vctx = await contexto(browser, { recordVideo: { dir: temporal, size: { width: 780, height: 1688 } } });
  const inicio = Date.now();
  const vpage = await vctx.newPage();
  await vpage.goto(inv.url, { waitUntil: 'load' });
  await vpage.waitForTimeout(3000);
  const toque = (Date.now() - inicio) / 1000;
  await inv.abrir(vpage);
  await vpage.waitForTimeout(4000);
  const webm = await vpage.video().path();
  await vctx.close();
  const crf = recortarVideo(webm, Math.max(0, toque - 1), join(carpeta, 'sobre.mp4'));
  const poster = join(temporal, `${slug}-poster.png`);
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', join(carpeta, 'sobre.mp4'), '-frames:v', '1', poster]);
  await guardarImagen(poster, join(carpeta, 'sobre-poster'));

  writeFileSync(join(carpeta, 'info.json'), `${JSON.stringify(inv.info, null, 2)}\n`);
  const kb = Math.round(statSync(join(carpeta, 'sobre.mp4')).size / 1024);
  console.log(`✓ ${slug}: 4 capturas, sobre.mp4 ${kb} KB (crf ${crf})`);
}

const pedidos = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(INVITACIONES);
for (const s of pedidos) if (!INVITACIONES[s]) throw new Error(`No conozco "${s}". Opciones: ${Object.keys(INVITACIONES).join(', ')}`);

const temporal = mkdtempSync(join(tmpdir(), 'portafolio-'));
const vite = pedidos.includes('iris-alex') ? await levantarVite() : null;
const viejo = pedidos.some((s) => s !== 'iris-alex') ? await servirRepoViejo() : null;
const browser = await chromium.launch();
try {
  for (const slug of pedidos) await capturar(browser, slug, INVITACIONES[slug], temporal);
} finally {
  await browser.close();
  viejo?.close();
  if (vite) {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
    else vite.kill();
  }
  rmSync(temporal, { recursive: true, force: true });
}
