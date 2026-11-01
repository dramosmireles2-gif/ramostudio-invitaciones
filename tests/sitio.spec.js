// La web de marca (raíz, legales, sitemap y robots) y la invitación en modo
// muestra del portafolio.
import { test, expect } from '@playwright/test';
import { SLUG, abrirSobre, sinDesbordeHorizontal } from './ayudas.js';

test('las páginas de marca cargan sin errores y con un solo H1', async ({ page }) => {
  const errores = [];
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  page.on('pageerror', (e) => errores.push(e.message));
  for (const ruta of ['/', '/terminos/', '/aviso-de-privacidad/']) {
    const r = await page.goto(ruta);
    expect(r.status(), ruta).toBe(200);
    await expect(page.getByRole('heading', { level: 1 }), ruta).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]'), ruta).toHaveCount(0);
    await expect(page.locator('.wordmark'), ruta).toBeVisible();
    await sinDesbordeHorizontal(page);
  }
  expect(errores).toEqual([]);
});

test('sitemap y robots: solo las páginas de marca', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(urls).toEqual(['/', '/demo/', '/terminos/', '/aviso-de-privacidad/']);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/^Sitemap: https:\/\/.+\/sitemap\.xml$/m);
  expect(robots).not.toMatch(/Disallow: \//);
});

test('la invitación de muestra no pide ni muestra datos de invitados', async ({ page }) => {
  await page.goto(`/${SLUG}/?muestra=1&f=ABCDEFG`);
  await expect(page.locator('.muestra')).toHaveText('Invitación de muestra · RamoStudio');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  // Aunque el enlace traiga ?f=, el sobre no es para ninguna familia.
  await expect(page.locator('.sobre__familia')).toHaveText('ustedes');
  await abrirSobre(page);
  const secciones = await page.locator('#app > section').evaluateAll((s) => s.map((x) => x.dataset.seccion));
  expect(secciones).not.toContain('rsvp');
  expect(secciones).not.toContain('mensajes');
  expect(secciones).toContain('portada');
  await expect(page.locator('.muestra')).toBeVisible();
  await sinDesbordeHorizontal(page);
});
