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
  expect(texto).not.toMatch(/tiempo real|al momento|la más elegida/i);
  // Entrega en 3 a 5 días, sin rondas de revisión ni extras con precio (1/11/2026).
  expect(texto).toContain('Lista en 3 a 5 días');
  expect(texto).not.toMatch(/semanas? (desde|1|2|3)|3 semanas|ronda|express|\+\$250/i);
  await expect(page.locator('.extras__cambio')).toContainText('con costo extra');
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

test('en celular, la invitación, el portafolio y los paquetes van en carrusel con puntos', async ({ page }) => {
  await page.goto('/');
  const paquetes = page.locator('.paquetes__hojas');
  await expect(paquetes).toHaveCSS('overflow-x', 'auto');
  const puntos = page.locator('.paquetes__hojas + .carrusel__puntos button');
  await expect(puntos).toHaveCount(3);
  await expect(page.locator('.carrusel__puntos')).toHaveCount(3);
  await puntos.nth(1).click();
  await expect(puntos.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect.poll(() => paquetes.evaluate((c) => c.scrollLeft)).toBeGreaterThan(100);
  await sinDesbordeHorizontal(page);
});

test('portafolio: "Ver cómo se abre" pone el video en el marco', async ({ page }) => {
  await page.goto('/');
  const obra = page.locator('.obra').filter({ hasText: 'Eunice & Edher' });
  await obra.getByRole('button', { name: 'Ver cómo se abre' }).click();
  await expect(obra.locator('video')).toHaveAttribute('src', /eunice-edher\/sobre\.mp4/);
  // Y el video carga de verdad (en el sitio publicado lo revisa también scripts/revisar-dist.mjs).
  await expect.poll(() => obra.locator('video').evaluate((v) => v.readyState), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
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

// Texto del mensaje de WhatsApp de un enlace wa.me.
const mensaje = (href) => decodeURIComponent(new URL(href).searchParams.get('text'));

test('WhatsApp: mensaje de cotización, paquete y ?src= que se mantiene al navegar', async ({ page }) => {
  await page.goto('/');
  const general = mensaje(await page.locator('.hero [data-whatsapp]').getAttribute('href'));
  expect(general).toBe('Hola, RamoStudio. Quiero cotizar una invitación digital.\nMi evento es: \nFecha: \n(Vengo de: web)');

  await page.goto('/?src=ig-bio');
  const completa = mensaje(await page.locator('[data-paquete="Completa"]').first().getAttribute('href'));
  expect(completa).toContain('Me interesa el paquete Completa.');
  expect(completa).toContain('(Vengo de: ig-bio)');
  // Al pasar a otra página sin ?src=, el origen sigue siendo el de la entrada.
  await page.goto('/terminos/');
  expect(mensaje(await page.locator('main [data-whatsapp]').getAttribute('href'))).toContain('(Vengo de: ig-bio)');
  await page.goto('/');
  expect(mensaje(await page.locator('.cierre [data-whatsapp]').getAttribute('href'))).toContain('(Vengo de: ig-bio)');
});

test('medición apagada: sin IDs no se carga Google ni Meta', async ({ page }) => {
  const terceros = [];
  page.on('request', (r) => /googletagmanager|google-analytics|facebook\.net|facebook\.com\/tr/.test(r.url()) && terceros.push(r.url()));
  await page.goto('/');
  await page.locator('.hero [data-whatsapp]').evaluate((a) => a.addEventListener('click', (e) => e.preventDefault()));
  await page.locator('.hero [data-whatsapp]').click();
  await page.waitForTimeout(500);
  expect(terceros).toEqual([]);
  expect(await page.evaluate(() => [typeof window.gtag, typeof window.fbq])).toEqual(['undefined', 'undefined']);
});

test('legales: términos con lo decidido y aviso de privacidad en borrador', async ({ page }) => {
  await page.goto('/terminos/');
  const terminos = page.locator('main');
  await expect(terminos).toContainText('anticipo del 50%');
  await expect(terminos).toContainText('transferencia y depósito en OXXO');
  await expect(terminos).toContainText('Hasta 3 meses después de tu evento');
  await expect(terminos).toContainText('El anticipo no es reembolsable una vez que empezamos el diseño.');
  await expect(terminos).not.toContainText(/FALTA|PROPUESTA/);
  await expect(terminos.locator('[data-telefono]')).toHaveText(/^\d{3} \d{3} \d{4}$/);

  await page.goto('/aviso-de-privacidad/');
  expect(await page.content()).toContain('<!-- BORRADOR: pendiente de revisión legal -->');
  const aviso = page.locator('main');
  await expect(aviso).not.toContainText(/FALTA|PROPUESTA/);
  await expect(aviso).toContainText('David Eduardo Ramos Mireles');
  await expect(aviso).toContainText('Última actualización: 1 de noviembre de 2026.');
  await expect(aviso.getByRole('link', { name: 'ramostudiomx@gmail.com' }).first()).toHaveAttribute('href', 'mailto:ramostudiomx@gmail.com');
  await expect(aviso).toContainText('Supabase (base de datos, con servidores en Estados Unidos)');
});

test('el RSVP de la invitación lleva el aviso corto de privacidad', async ({ page }) => {
  await page.goto(`/${SLUG}/`);
  const aviso = page.locator('.rsvp__privacidad');
  await expect(aviso).toContainText('Al confirmar, sus respuestas se comparten con los anfitriones de este evento.');
  await expect(aviso.getByRole('link', { name: 'Aviso de privacidad' })).toHaveAttribute('href', '/aviso-de-privacidad/');
});

test('SEO: title, descripción, canonical, imagen al compartir y datos estructurados', async ({ page, request }) => {
  await page.goto('/');
  const title = await page.title();
  expect(title.length).toBeLessThanOrEqual(60);
  const descripcion = await page.locator('meta[name="description"]').getAttribute('content');
  expect(descripcion.length).toBeLessThanOrEqual(155);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/[^/]+\/$/);
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/\/og-ramostudio\.jpg$/);
  const imagen = await request.get(new URL(og).pathname);
  expect(imagen.ok()).toBe(true);
  expect((await imagen.body()).length).toBeLessThan(300 * 1024);

  const datos = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent)));
  const negocio = datos.find((d) => d['@type'] === 'LocalBusiness');
  expect(negocio.address.addressLocality).toBe('Reynosa');
  expect(negocio.telephone).toMatch(/^\+52\d{10}$/);
  // Las mismas preguntas que se ven en la página, incluida la de los lugares de cada familia
  // (respaldada por tests/rls.spec.js).
  const faq = datos.find((d) => d['@type'] === 'FAQPage');
  expect(faq.mainEntity).toHaveLength(await page.locator('.preguntas details').count());
  expect(faq.mainEntity.map((q) => q.name)).toContain('¿Una familia puede confirmar más lugares de los que le di?');
});
