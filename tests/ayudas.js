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

// Nada más ancho que la pantalla (sin scroll horizontal).
export async function sinDesbordeHorizontal(page) {
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(ancho).toBeLessThanOrEqual(0);
}
