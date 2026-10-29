// La invitación de Iris & Alex en celular (Android y iPhone).
import { test, expect } from '@playwright/test';
import { SLUG, enlaceFamilia, codigoPrueba, abrirSobre, sinDesbordeHorizontal } from './ayudas.js';

const CAPTURAS = 'test-results/capturas';

test('el sobre muestra a la familia y se abre con una transición suave', async ({ page }, info) => {
  await page.goto(enlaceFamilia(codigoPrueba(), 'Familia Prueba Sobre', 4));
  await expect(page.locator('.sobre__familia')).toHaveText('Familia Prueba Sobre');
  await expect(page.getByRole('button', { name: 'Abrir la invitación' })).toBeVisible();
  await sinDesbordeHorizontal(page);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-00-sobre.png` });

  // Cuadros de la apertura: la tarjeta clara crece dentro del sobre antes de
  // que aparezca la invitación (no hay salto de oscuro a claro).
  await page.getByRole('button', { name: 'Abrir la invitación' }).click();
  const fondos = [];
  let antes = 0;
  for (const ms of [400, 900, 1300, 1700, 2100]) {
    await page.waitForTimeout(ms - antes);
    antes = ms;
    fondos.push(await page.evaluate(() => {
      const t = document.querySelector('.sobre__tarjeta');
      return t ? Number(getComputedStyle(t).opacity) : 1;
    }));
    await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-0${fondos.length}-apertura-${ms}ms.png` });
  }
  // La tarjeta aparece poco a poco (no de golpe) y la apertura dura menos de 3 s.
  expect(fondos[0]).toBeLessThan(0.5);
  expect(fondos.at(-1)).toBe(1);
  await expect(page.locator('.sobre')).toHaveCount(0, { timeout: 1500 });
});

test('todas las secciones con los datos del brief', async ({ page }) => {
  await page.goto(enlaceFamilia(codigoPrueba(), 'Familia Prueba Datos', 3));
  await abrirSobre(page);
  const secciones = await page.locator('#app > section').evaluateAll((s) => s.map((x) => x.dataset.seccion));
  expect(secciones).toEqual(['portada', 'cuenta', 'frase', 'evento', 'vestimenta', 'foto', 'rsvp', 'mensajes', 'regalos', 'galeria', 'pie']);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Iris & Alex');
  await expect(page.locator('.portada__fecha')).toHaveText('Viernes 4 de diciembre de 2026');
  await expect(page.locator('.portada__lugar')).toHaveText('6:00 p. m. · Reynosa, Tamaulipas');
  await expect(page.locator('.frase')).toContainText('nuestro amor no empieza hoy, pero hoy prometemos que será para siempre.');

  const sedes = page.locator('.sede');
  await expect(sedes.nth(0)).toContainText('Ceremonia religiosa');
  await expect(sedes.nth(0)).toContainText('6:00 p. m.');
  await expect(sedes.nth(0)).toContainText('Parroquia San Felipe de Jesús');
  await expect(sedes.nth(0)).toContainText('Francisco Villa #330, col. Aquiles Serdán, C.P. 88540');
  await expect(sedes.nth(1)).toContainText('7:00 p. m.');
  await expect(sedes.nth(1)).toContainText('Salón de eventos Bellagio');
  await expect(sedes.nth(1).getByRole('link', { name: 'Cómo llegar' }))
    .toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=26.0379125,-98.3010376');
  await expect(sedes.nth(1).getByRole('link', { name: 'Abrir en Waze' }))
    .toHaveAttribute('href', /waze\.com\/ul\?ll=26\.0379125%2C-98\.3010376&navigate=yes/);
  await expect(page.getByRole('link', { name: 'Agregar al calendario' })).toBeVisible();

  await expect(page.locator('.vestimenta')).toContainText('Formal');
  await expect(page.locator('.vestimenta')).toContainText('De negro');
  await expect(page.locator('.rsvp__limite')).toContainText('viernes 20 de noviembre de 2026');
  await expect(page.locator('.regalos')).toContainText('Lluvia de sobres');
  await expect(page.locator(".galeria img")).toHaveCount(6);
  await expect(page.locator('.pie')).toContainText('Fotos: Dreams Studio by May Torres');
  // Sin música hasta que llegue la canción: no hay control de música.
  await expect(page.getByRole('button', { name: /música|silenciar/i })).toHaveCount(0);
  await sinDesbordeHorizontal(page);
});

test('las 8 fotos se ven completas, sin recorte', async ({ page }, info) => {
  await page.goto(`/${SLUG}/`);
  await abrirSobre(page);
  // Recorre la página para que carguen las fotos diferidas.
  for (let y = 0; y < 20; y++) {
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(120);
  }
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  const fotos = await page.locator('#app img').evaluateAll((imgs) => imgs.map((i) => ({
    src: i.currentSrc.split('/').pop(),
    natural: i.naturalWidth / i.naturalHeight,
    visto: i.clientWidth / i.clientHeight,
  })));
  expect(fotos).toHaveLength(8);
  for (const f of fotos) expect(Math.abs(f.visto - f.natural) / f.natural, f.src).toBeLessThan(0.01);
  // Las fotos solas en su fila ocupan todo el ancho de la pantalla.
  const anchas = await page.locator('.galeria__fila:has(> .galeria__celda:only-child) img, .portada img, .foto-intermedia img')
    .evaluateAll((imgs) => imgs.map((i) => i.clientWidth));
  const pantalla = await page.evaluate(() => Math.min(window.innerWidth, 560));
  for (const w of anchas) expect(w).toBeGreaterThanOrEqual(pantalla - 1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-10-invitacion-completa.png`, fullPage: true });
});

test('confirmar con el enlace personal', async ({ page }) => {
  await page.goto(enlaceFamilia(codigoPrueba(), 'Familia Prueba Enlace', 4));
  await abrirSobre(page);
  const rsvp = page.locator('.rsvp');
  await expect(rsvp.locator('.rsvp__familia')).toHaveText('Familia Prueba Enlace');
  await expect(rsvp).toContainText('Tenemos 4 lugares reservados para ustedes.');
  // El contador no pasa de los pases asignados.
  await expect(rsvp.getByRole('button', { name: 'Una persona más' })).toBeDisabled();
  await rsvp.getByRole('button', { name: 'Una persona menos' }).click();
  await expect(rsvp.locator('.rsvp__numero')).toHaveText('3');
  await rsvp.getByRole('button', { name: 'Confirmar asistencia' }).click();
  await expect(rsvp.locator('.rsvp__gracias')).toHaveText('¡Gracias! Iris y Alex ya saben que van 3 personas.');
  await expect(rsvp.getByRole('button', { name: 'Confirmar asistencia' })).toBeHidden();

  // Al volver a abrir el enlace, se ve lo que ya respondieron y se puede cambiar.
  await page.reload();
  await abrirSobre(page);
  await expect(page.locator('.rsvp__previa')).toContainText('Ya nos confirmaron 3 personas.');
  await expect(page.locator('.rsvp__numero')).toHaveText('3');
});

test('confirmar sin enlace personal y avisar que no asisten', async ({ page }) => {
  await page.goto(`/${SLUG}/`);
  await abrirSobre(page);
  const rsvp = page.locator('.rsvp');
  await rsvp.getByRole('button', { name: 'Confirmar asistencia' }).click();
  await expect(rsvp.getByText('Escriban el nombre de su familia.')).toBeVisible();
  await rsvp.getByLabel('Nombre de su familia').fill('Familia Prueba Sin Enlace');
  await rsvp.getByRole('button', { name: 'No podremos asistir' }).click();
  await expect(rsvp.locator('.rsvp__gracias')).toHaveText('Gracias por avisarnos. Iris y Alex ya lo saben.');
});

test('dejar un mensaje a los novios', async ({ page }) => {
  await page.goto(enlaceFamilia(codigoPrueba(), 'Familia Prueba Mensaje', 2));
  await abrirSobre(page);
  const m = page.locator('.mensajes');
  await m.getByRole('button', { name: 'Enviar mensaje a Iris y Alex' }).click();
  await expect(m.getByText('Escriban su mensaje.')).toBeVisible();
  await m.getByLabel('Su mensaje').fill('¡Muchas felicidades! Ahí estaremos.');
  await m.getByRole('button', { name: 'Enviar mensaje a Iris y Alex' }).click();
  await expect(m.locator('.mensajes__gracias')).toHaveText('Su mensaje ya está con Iris y Alex. ¡Gracias!');
});

test('con "reducir movimiento" el sobre abre sin animación', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/${SLUG}/`);
  await page.getByRole('button', { name: 'Abrir la invitación' }).click();
  await expect(page.locator('.sobre')).toHaveCount(0, { timeout: 500 });
});
