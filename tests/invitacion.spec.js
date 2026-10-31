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

  // El sobre flota mientras espera (como la invitación de Ivan & Gemima).
  await expect(page.locator('.sobre__carta')).toHaveCSS('animation-name', 'flotar');
  // La pantalla del sobre es del color de la invitación: no hay salto de
  // oscuro a claro al abrir.
  const [fondoSobre, fondoPagina] = await page.evaluate(() => [
    getComputedStyle(document.querySelector('.sobre')).backgroundColor,
    getComputedStyle(document.body).backgroundColor,
  ]);
  expect(fondoSobre).toBe(fondoPagina);

  // Es un sobre de verdad: carta adentro, bolsa del frente y solapa con su interior.
  for (const parte of ['.sobre__hoja', '.sobre__frente', '.sobre__solapa-cara', '.sobre__solapa-dorso']) {
    await expect(page.locator(parte)).toHaveCount(1);
  }
  await expect(page.locator('.sobre__hoja')).toContainText('Iris & Alex');

  // La apertura, revisada dentro de la página (no depende de cuántos cuadros
  // dibuje la máquina de pruebas): la solapa gira y la carta sale del sobre,
  // el sobre se desvanece con una transición de al menos medio segundo (no es
  // un corte), cae la lluvia y todo dura menos de 3 s.
  const r = await page.evaluate(() => new Promise((listo) => {
    const sobre = document.querySelector('.sobre');
    const t0 = performance.now();
    sobre.querySelector('.sobre__sello').click();
    const dura = (el, prop) => Math.max(0, ...el.getAnimations().filter((a) => a.transitionProperty === prop).map((a) => a.effect.getTiming().duration));
    let transicion = 0;
    let solapa = 0;
    let hoja = 0;
    let solapaGirada = false;
    let hojaFuera = false;
    let lluvia = 0;
    const vigilar = () => {
      if (!sobre.isConnected) return listo({ transicion, solapa, hoja, solapaGirada, hojaFuera, lluvia, total: performance.now() - t0 });
      transicion = Math.max(transicion, dura(sobre, 'opacity'));
      solapa = Math.max(solapa, dura(sobre.querySelector('.sobre__solapa'), 'transform'));
      hoja = Math.max(hoja, dura(sobre.querySelector('.sobre__hoja'), 'transform'));
      // La solapa queda volteada (rotateX ~180°: el eje Y invertido) y la carta arriba.
      solapaGirada ||= new DOMMatrix(getComputedStyle(sobre.querySelector('.sobre__solapa')).transform).m22 < -0.9;
      hojaFuera ||= new DOMMatrix(getComputedStyle(sobre.querySelector('.sobre__hoja')).transform).m42 < -40;
      lluvia = Math.max(lluvia, document.querySelectorAll('.lluvia').length);
      setTimeout(vigilar, 50);
    };
    vigilar();
  }));
  expect(r.solapa).toBeGreaterThanOrEqual(500);
  expect(r.hoja).toBeGreaterThanOrEqual(500);
  expect(r.solapaGirada).toBe(true);
  expect(r.hojaFuera).toBe(true);
  expect(r.transicion).toBeGreaterThanOrEqual(500);
  expect(r.lluvia).toBeGreaterThan(20);
  expect(r.total).toBeGreaterThan(1000);
  expect(r.total).toBeLessThan(3600); // Diseñada en 2.4 s; margen por lo cargada que esté la máquina de pruebas.
  await expect(page.locator('.sobre')).toHaveCount(0);
  // La lluvia se limpia sola al terminar de caer.
  await expect(page.locator('.lluvia')).toHaveCount(0, { timeout: 6000 });
});

test('cuenta regresiva con segundos y barra de avance al bajar', async ({ page }) => {
  await page.goto(`/${SLUG}/`);
  await abrirSobre(page);
  const unidades = page.locator('.cuenta__unidad');
  await expect(unidades).toHaveCount(4);
  await expect(unidades.nth(3)).toContainText(/segundos?/);
  const antes = await unidades.nth(3).locator('.cuenta__numero').textContent();
  await expect.poll(() => unidades.nth(3).locator('.cuenta__numero').textContent(), { timeout: 3000 }).not.toBe(antes);

  const avance = () => page.locator('.progreso').evaluate((b) => new DOMMatrix(getComputedStyle(b).transform).a);
  expect(await avance()).toBeLessThan(0.05);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(avance).toBeGreaterThan(0.95);
});

test('todas las secciones con los datos del brief', async ({ page }) => {
  await page.goto(enlaceFamilia(codigoPrueba(), 'Familia Prueba Datos', 3));
  await abrirSobre(page);
  const secciones = await page.locator('#app > section').evaluateAll((s) => s.map((x) => x.dataset.seccion));
  expect(secciones).toEqual(['portada', 'cuenta', 'frase', 'evento', 'calendario', 'vestimenta', 'foto', 'rsvp', 'mensajes', 'galeria', 'cancion', 'pie']);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Iris & Alex');
  await expect(page.locator('.portada__fecha')).toHaveText('Viernes 4 de diciembre de 2026');
  await expect(page.locator('.portada__lugar')).toHaveText('6:00 p. m. · Reynosa, Tamaulipas');
  await expect(page.locator('.frase')).toContainText('nuestro amor no empieza hoy, pero hoy prometemos que será para siempre.');
  // Portada en hoja sobre la foto y frase como cita (no dos hojas seguidas).
  await expect(page.locator('.portada')).toHaveClass(/portada--hoja/);
  await expect(page.locator('.frase')).toHaveClass(/frase--cita/);
  await expect(page.locator('.frase__promesa')).toHaveText('Porque nuestro amor no empieza hoy, pero hoy prometemos que será para siempre.');
  await expect(page.locator('.frase__firma')).toHaveText('Iris & Alex');

  const sedes = page.locator('.sede');
  await expect(sedes.nth(0)).toContainText('Ceremonia religiosa');
  await expect(sedes.nth(0)).toContainText('6:00 p. m.');
  await expect(sedes.nth(0)).toContainText('Parroquia San Felipe de Jesús');
  await expect(sedes.nth(0)).toContainText('Francisco Villa #330, col. Aquiles Serdán, C.P. 88540');
  await expect(sedes.nth(1)).toContainText('7:00 p. m.');
  await expect(sedes.nth(1)).toContainText('Salón de eventos Bellagio');
  // Mapas a la vista (insertados de Google Maps) y la foto de la parroquia.
  await expect(sedes.nth(0).locator('iframe')).toHaveAttribute('src', /google\.com\/maps\/embed.*Parroquia%20San%20Felipe/);
  await expect(sedes.nth(1).locator('iframe')).toHaveAttribute('src', /google\.com\/maps\/embed.*Bellagio/);
  await expect(sedes.nth(0).getByRole('img', { name: /Parroquia San Felipe de Jesús/ })).toBeVisible();
  await expect(sedes.nth(0).getByRole('link', { name: 'Cómo llegar' }))
    .toHaveAttribute('href', 'https://www.google.com/maps?cid=13500069162586686198');
  await expect(sedes.nth(1).getByRole('link', { name: 'Cómo llegar' }))
    .toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=26.0379125,-98.3010376');
  await expect(sedes.nth(1).getByRole('link', { name: 'Abrir en Waze' }))
    .toHaveAttribute('href', /waze\.com\/ul\?ll=26\.0379125%2C-98\.3010376&navigate=yes/);
  // Guarden la fecha: hoja de diciembre 2026 con el 4 (viernes) marcado; toda la
  // hoja agrega la boda al calendario.
  const hoja = page.getByRole('link', { name: /^Agregar la boda a mi calendario: viernes 4 de diciembre de 2026, 6:00 p\. m\./ });
  await expect(hoja).toBeVisible();
  await expect(hoja).toHaveAttribute('href', /calendar\.google\.com.*dates=20261205T000000Z%2F20261205T060000Z/);
  await expect(page.locator('.calendario__mes')).toContainText('Diciembre');
  await expect(page.locator('.calendario__dia--boda')).toHaveText('4');
  const columna = await page.locator('.calendario__rejilla > *').evaluateAll((c) => c.findIndex((x) => x.classList.contains('calendario__dia--boda')) % 7);
  expect(columna).toBe(5); // D L M M J [V] S
  await hoja.scrollIntoViewIfNeeded();
  await expect(page.locator('.calendario__hoja')).toHaveClass(/calendario__hoja--vista/);

  await expect(page.locator('.vestimenta')).toContainText('Formal');
  await expect(page.locator('.vestimenta')).toContainText('De negro');
  await expect(page.locator('.rsvp__limite')).toContainText('viernes 20 de noviembre de 2026');
  // La clienta quitó la sección de regalos (31/10/2026).
  await expect(page.locator('.regalos')).toHaveCount(0);
  await expect(page.locator(".galeria img")).toHaveCount(6);
  await expect(page.locator('.pie')).toContainText('Fotos: Dreams Studio by May Torres');
  await sinDesbordeHorizontal(page);
});

test('las 9 fotos se ven completas, sin recorte', async ({ page }, info) => {
  test.setTimeout(180_000); // Los mapas de Google cargan junto con las fotos.
  await page.goto(`/${SLUG}/`);
  await abrirSobre(page);
  // Lleva cada foto a la vista (como quien las va viendo) para que cargue la
  // diferida; WebKit no carga las que se pasan de largo al desplazarse rápido.
  const imagenes = page.locator('#app img');
  for (let i = 0; i < await imagenes.count(); i++) {
    const img = imagenes.nth(i);
    await img.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0), { timeout: 20_000 }).toBe(true);
  }
  const fotos = await page.locator('#app img').evaluateAll((imgs) => imgs.map((i) => ({
    src: i.currentSrc.split('/').pop(),
    natural: i.naturalWidth / i.naturalHeight,
    visto: i.clientWidth / i.clientHeight,
  })));
  expect(fotos).toHaveLength(9);
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

test('todo el texto en color (acento incluido) se lee: contraste AA', async ({ page }) => {
  await page.goto(enlaceFamilia(codigoPrueba(), 'Familia Prueba Contraste', 3));
  await abrirSobre(page);
  const fallas = await page.evaluate(() => {
    const rgb = (c) => (c.match(/[\d.]+/g) ?? []).map(Number);
    const lum = ([r, g, b]) => [r, g, b].map((v) => v / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const fondo = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const c = rgb(getComputedStyle(n).backgroundColor);
        if (c.length === 3 || (c.length === 4 && c[3] > 0.9)) return c.slice(0, 3);
      }
      return [245, 244, 240];
    };
    const sel = '.ev-etiqueta, .field__label, .regalo__datos dt, .rsvp__limite, .portada__lugar, .sede__direccion, .cuenta__texto, .calendario__accion, .btn';
    return [...document.querySelectorAll(sel)].filter((el) => el.offsetParent).map((el) => {
      const [a, b] = [lum(rgb(getComputedStyle(el).color).slice(0, 3)), lum(fondo(el))];
      const r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      return { texto: el.textContent.trim().slice(0, 30), r: Math.round(r * 100) / 100 };
    }).filter((x) => x.r < 4.5);
  });
  expect(fallas).toEqual([]);
});

test('con "reducir movimiento" el sobre abre sin animación', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/${SLUG}/`);
  await page.getByRole('button', { name: 'Abrir la invitación' }).click({ force: true });
  await expect(page.locator('.sobre')).toHaveCount(0, { timeout: 500 });
  // Las sombras de fondo se quedan quietas.
  await expect(page.locator('.fondo-sombras')).toHaveCSS('animation-name', 'none');
});

test('fondo de sombras: se mueve, casi transparente y no estorba los toques', async ({ page }) => {
  await page.goto(`/${SLUG}/`);
  await abrirSobre(page);
  const fondo = page.locator('.fondo-sombras');
  await expect(fondo).toHaveCount(1);
  await expect(fondo).toHaveCSS('pointer-events', 'none');
  await expect(fondo).toHaveCSS('animation-name', 'mecerse');
  expect(Number(await fondo.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThanOrEqual(0.1);
  // Los botones siguen recibiendo el toque (no lo tapa la capa de sombras).
  await page.locator('.rsvp').scrollIntoViewIfNeeded();
  const boton = page.getByRole('button', { name: 'Confirmar asistencia' });
  const caja = await boton.boundingBox();
  const encima = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('button')?.textContent?.trim(), [caja.x + caja.width / 2, caja.y + caja.height / 2]);
  expect(encima).toBe('Confirmar asistencia');
});

test('música: arranca sola al abrir el sobre (video oficial de YouTube, discreto al final), se silencia y se recuerda', async ({ page }) => {
  await page.goto(`/${SLUG}/`);
  // El reproductor oficial está en "Nuestra canción", a la vista (lo pide YouTube).
  const cancion = page.locator('.cancion');
  await expect(cancion).toContainText('A Thousand Years');
  // Discreto, al final, al tamaño mínimo que permite YouTube (200 x 200 a la vista).
  const caja = await cancion.locator('.cancion__marco').boundingBox();
  expect(Math.round(caja.width)).toBeLessThanOrEqual(216);
  await expect(cancion).toContainText('Christina Perri');
  await expect(cancion.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/rtOvBOTyX00/, { timeout: 15_000 });
  // Nunca suena antes del sello y no hay botón.
  await expect(page.locator('.musica')).toHaveCount(0);
  await abrirSobre(page);
  const boton = page.getByRole('button', { name: 'Silenciar música' });
  await expect(boton).toBeVisible();
  await boton.click();
  await expect(page.getByRole('button', { name: 'Activar música' })).toHaveAttribute('aria-pressed', 'false');
  // La elección se respeta en la siguiente visita.
  await page.reload();
  await abrirSobre(page);
  await expect(page.getByRole('button', { name: 'Activar música' })).toBeVisible();
});
