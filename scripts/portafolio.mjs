// Material del portafolio de la web (docs/web/plan-web.md, sección 6):
// capturas de celular (390x844, escala 3x) y video del sobre abriéndose, para
// cada invitación. Uso: npm run portafolio [-- <slug> ...]
//
//   portafolio/<slug>/01-sobre, 02-portada, 03-seccion, 04-confirmacion
//                     .avif .webp .jpg   (capturas)
//   portafolio/<slug>/sobre.mp4 + sobre-poster.avif/.webp/.jpg (4-6 s, < 1 MB)
//   portafolio/<slug>/info.json          (título, enlace de muestra, crédito)
//   portafolio/<slug>/<nombre>-600.*     (versión de 600 px para la web)
//   portafolio/panel/                    (resumen y familias del panel demo)
//
// Reglas (no se negocian):
// - Nunca se confirma asistencia ni se deja mensaje: solo se ven las pantallas.
// - Iris & Alex corre en un Vite propio con VITE_DATOS=local (no toca Supabase).
// - Las invitaciones del repo viejo (demoInvitacion) se sirven desde su copia
//   local, solo lectura, sin ?g= (sin invitado no registran la visita), y el
//   navegador bloquea cualquier escritura a Firestore por si acaso.
// - La mesa de regalos del repo viejo trae la CLABE real: no se captura.
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
  viejo: true,
  abrir: async (page) => {
    await page.locator('#envelope-screen').click();
    await page.locator('#invitation.show').waitFor({ timeout: 10_000 });
  },
  seccion: (page) => page.locator('.section-label', { hasText: 'Dónde nos encontramos' }).locator('..'),
  confirmacion: (page) => page.locator('#rsvp-section'),
};

const INVITACIONES = {
  // Demo (datos ficticios): video del hero y capturas de "La invitación" en la
  // web, abierta como la Familia Ramos del recorrido del demo.
  'mariana-diego': {
    ...NUEVA,
    url: `http://localhost:${PUERTO_VITE}/mariana-diego/?f=demo`,
    info: { titulo: 'Mariana & Diego', tipo: 'boda', enlace: '/demo/', creditoFotos: null, demo: true },
  },
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

// Graba la pantalla mientras corre `accion` con el screencast de Chromium, a
// 2x (recordVideo de Playwright graba a 1x y deja el resto del cuadro en gris).
// Los cuadros llegan solo cuando algo cambia: cada uno dura hasta el siguiente.
async function grabar(page, dir, accion) {
  mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const cuadros = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const archivo = join(dir, `c${String(cuadros.length).padStart(4, '0')}.jpg`);
    writeFileSync(archivo, Buffer.from(data, 'base64'));
    cuadros.push({ archivo, t: metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 780, maxHeight: 1688 });
  const inicio = Date.now() / 1000;
  await accion();
  const fin = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  const lista = cuadros.map((c, i) => `file '${c.archivo.replaceAll('\\', '/')}'\nduration ${((cuadros[i + 1]?.t ?? fin) - Math.max(c.t, i ? 0 : inicio)).toFixed(4)}`);
  const txt = join(dir, 'lista.txt');
  writeFileSync(txt, `${lista.join('\n')}\nfile '${cuadros.at(-1).archivo.replaceAll('\\', '/')}'\n`);
  return txt;
}

function recortarVideo(lista, destino) {
  for (const crf of [24, 26, 28, 30, 32, 34]) {
    execFileSync(ffmpeg, [
      '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-t', '5',
      '-vf', 'fps=30,scale=540:1168,setsar=1', '-c:v', 'libx264', '-crf', String(crf), '-preset', 'slow',
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
  const vctx = await contexto(browser);
  const vpage = await vctx.newPage();
  await vpage.goto(inv.url, { waitUntil: 'load' });
  await vpage.waitForTimeout(3000);
  const lista = await grabar(vpage, join(temporal, slug), async () => {
    await vpage.waitForTimeout(1000);
    await inv.abrir(vpage);
    await vpage.waitForTimeout(4000);
  });
  await vctx.close();
  const crf = recortarVideo(lista, join(carpeta, 'sobre.mp4'));
  const poster = join(temporal, `${slug}-poster.png`);
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', join(carpeta, 'sobre.mp4'), '-frames:v', '1', poster]);
  await guardarImagen(poster, join(carpeta, 'sobre-poster'));

  writeFileSync(join(carpeta, 'info.json'), `${JSON.stringify(inv.info, null, 2)}\n`);
  const kb = Math.round(statSync(join(carpeta, 'sobre.mp4')).size / 1024);
  console.log(`✓ ${slug}: 4 capturas, sobre.mp4 ${kb} KB (crf ${crf})`);
}

// Panel del demo (datos ficticios), para la sección "El panel" de la web.
async function capturarPanel(browser) {
  const carpeta = join(RAIZ, 'portafolio', 'panel');
  mkdirSync(carpeta, { recursive: true });
  const ctx = await contexto(browser);
  const page = await ctx.newPage();
  for (const [nombre, vista] of [['01-resumen', 'resumen'], ['02-familias', 'invitados']]) {
    await page.goto(`http://localhost:${PUERTO_VITE}/panel/app.html#${vista}`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await guardarImagen(await page.screenshot(), join(carpeta, nombre));
  }
  await ctx.close();
  console.log('✓ panel: 2 capturas');
}

// Versión para la web (600 px de ancho: el marco de celular mide ~300 px en
// pantalla): <nombre>-600.avif/.webp/.jpg junto a cada captura.
async function versionesWeb() {
  const raiz = join(RAIZ, 'portafolio');
  for (const carpeta of readdirSync(raiz)) {
    for (const f of readdirSync(join(raiz, carpeta)).filter((n) => /^(\d\d-[a-z-]+|sobre-poster)\.webp$/.test(n))) {
      const png = await sharp(join(raiz, carpeta, f)).resize(600).png().toBuffer();
      await guardarImagen(png, join(raiz, carpeta, f.replace('.webp', '-600')));
    }
  }
  console.log('✓ versiones de 600 px para la web');
}

const TODOS = [...Object.keys(INVITACIONES), 'panel'];
const pedidos = process.argv.slice(2).length ? process.argv.slice(2) : TODOS;
if (pedidos.length === 1 && pedidos[0] === 'web') {
  await versionesWeb();
  process.exit(0);
}
for (const s of pedidos) if (!TODOS.includes(s)) throw new Error(`No conozco "${s}". Opciones: ${TODOS.join(', ')}, web`);

const temporal = mkdtempSync(join(tmpdir(), 'portafolio-'));
const vite = pedidos.some((s) => s === 'panel' || !INVITACIONES[s].viejo) ? await levantarVite() : null;
const viejo = pedidos.some((s) => INVITACIONES[s]?.viejo) ? await servirRepoViejo() : null;
const browser = await chromium.launch();
try {
  for (const slug of pedidos) {
    if (slug === 'panel') await capturarPanel(browser);
    else await capturar(browser, slug, INVITACIONES[slug], temporal);
  }
  await versionesWeb();
} finally {
  await browser.close();
  viejo?.close();
  if (vite) {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
    else vite.kill();
  }
  rmSync(temporal, { recursive: true, force: true });
}
