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
    await expect(page.locator('.cabeza .wordmark'), ruta).toBeVisible();
    await sinDesbordeHorizontal(page);
  }
  expect(errores).toEqual([]);
});

test('la página principal: secciones, WhatsApp, demo y copy permitido', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tus invitados confirman en un toque. Tú ves quién va, sin preguntar.');
  const secciones = await page.locator('main > section').evaluateAll((s) => s.map((x) => x.dataset.seccion));
  // Testimonios está apagado por ajuste.
  expect(secciones).toEqual(['hero', 'problema', 'como-funciona', 'invitacion', 'panel', 'portafolio', 'paquetes', 'proceso', 'preguntas', 'contacto']);
  // Todos los botones de WhatsApp abren el chat de RamoStudio.
  const whatsapp = await page.locator('[data-whatsapp]').evaluateAll((as) => as.map((a) => a.href));
  expect(whatsapp.length).toBeGreaterThan(5);
  for (const href of whatsapp) expect(href).toMatch(/^https:\/\/wa\.me\/52\d{10}\?text=/);
  await expect(page.getByRole('link', { name: 'Prueba el demo' }).first()).toHaveAttribute('href', '/demo/');
  await expect(page.getByRole('link', { name: 'Pruébalo tú' })).toHaveAttribute('href', '/panel/');
  await expect(page.getByRole('link', { name: 'Ver invitación' })).toHaveAttribute('href', '/iris-alex/?muestra=1');
  await expect(page.getByText('Fotos: Dreams Studio by May Torres')).toBeVisible();
  // Lo que el plan prohíbe decir.
  const texto = await page.locator('body').innerText();
  expect(texto).not.toMatch(/tiempo real|al momento|la más elegida|adivinar/i);
  // Las imágenes debajo del hero cargan diferidas y con medidas (sin saltos).
  for (const img of await page.locator('main img').all()) {
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('alt', /\S/);
  }
});

test('preguntas frecuentes con teclado', async ({ page }) => {
  await page.goto('/');
  const pregunta = page.locator('.preguntas summary').filter({ hasText: '¿Hay límite de invitados?' });
  await pregunta.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('No. Agregas a todas las familias que quieras desde tu panel.')).toBeVisible();
});

test('el botón flotante no tapa los otros botones de WhatsApp', async ({ page }) => {
  await page.goto('/');
  const flotante = page.locator('[data-flotante]');
  await expect(flotante).toHaveAttribute('data-oculto', ''); // En el hero ya están los botones.
  await page.locator('.problema__dolores').scrollIntoViewIfNeeded();
  await expect(flotante).not.toHaveAttribute('data-oculto');
  await page.locator('.cierre .boton').scrollIntoViewIfNeeded();
  await expect(flotante).toHaveAttribute('data-oculto', '');
});

test('portafolio: "Ver cómo se abre" pone el video en el marco', async ({ page }) => {
  await page.goto('/');
  const obra = page.locator('.obra').filter({ hasText: 'Eunice & Edher' });
  await obra.getByRole('button', { name: 'Ver cómo se abre' }).click();
  await expect(obra.locator('video')).toHaveAttribute('src', /eunice-edher\/sobre\.mp4/);
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
