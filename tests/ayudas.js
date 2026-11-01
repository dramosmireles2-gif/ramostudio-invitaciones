// Ayudas compartidas por las pruebas de Playwright.
import { expect } from '@playwright/test';

export const SLUG = 'iris-alex';

// Enlace personal de una familia, igual al que arma src/lib/links.js
// (?f=<codigo>&d=<nombre y pases en base64 de URL>).
export function enlaceFamilia(codigo, nombre, pases) {
  const d = Buffer.from(JSON.stringify({ n: nombre, p: pases })).toString('base64url');
  return `/${SLUG}/?f=${codigo}&d=${d}`;
}

// Código de prueba único por corrida (sin 0/O ni 1/I/L, como los reales).
export function codigoPrueba() {
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => letras[Math.floor(Math.random() * letras.length)]).join('');
}

export async function abrirSobre(page) {
  await page.getByRole('button', { name: 'Abrir la invitación' }).click({ force: true });
  // La apertura dura 2.4 s; margen por lo cargada que esté la máquina (y el
  // reproductor de YouTube cargando al mismo tiempo).
  await expect(page.locator('.sobre')).toHaveCount(0, { timeout: 10_000 });
}

// Login simulado del panel (solo localhost): cualquier correo + 123456.
export async function entrarAlPanel(page) {
  await page.goto(`/panel/?e=${SLUG}`);
  await page.getByLabel('Su correo').fill('novia@ejemplo.com');
  await page.getByRole('button', { name: 'Mandarme el código por correo' }).click();
  await page.locator('#login-codigo').fill('123456');
  await page.getByRole('button', { name: 'Entrar a mi panel' }).click();
  await page.waitForURL('**/panel/app.html**');
}

// Reproductor de YouTube simulado: la prueba no depende de que YouTube deje
// reproducir desde la máquina de pruebas (en GitHub Actions lo bloquea y el
// botón de música se esconde, como debe ser si el video no está disponible).
// Imita lo que usa src/invitacion/sections/musica.js y cuenta en
// window.__youtube cuántas veces se pidió reproducir y pausar.
const YOUTUBE_SIMULADO = `
  window.__youtube = { play: 0, pause: 0 };
  window.YT = {
    PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2 },
    Player: class {
      constructor(lugar, o) {
        const f = document.createElement('iframe');
        f.src = o.host + '/embed/' + o.videoId;
        lugar.replaceWith(f);
        this.o = o;
        setTimeout(() => o.events.onReady({ target: this }), 50);
      }
      playVideo() { window.__youtube.play++; setTimeout(() => this.o.events.onStateChange({ data: 1 })); }
      pauseVideo() { window.__youtube.pause++; setTimeout(() => this.o.events.onStateChange({ data: 2 })); }
      seekTo() {}
      isMuted() { return false; }
    },
  };
  window.onYouTubeIframeAPIReady?.();
`;

export async function simularYouTube(page) {
  await page.route('https://www.youtube.com/iframe_api', (r) => r.fulfill({ contentType: 'text/javascript', body: YOUTUBE_SIMULADO }));
  await page.route(/youtube-nocookie\.com\/embed\//, (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Video</title>' }));
}

// Nada más ancho que la pantalla (sin scroll horizontal).
export async function sinDesbordeHorizontal(page) {
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(ancho).toBeLessThanOrEqual(0);
}
