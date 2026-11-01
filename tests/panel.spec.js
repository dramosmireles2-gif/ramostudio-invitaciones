// De la invitación al panel: lo que hace el invitado le llega a los novios.
// (Hoy en el mismo navegador; con Supabase, entre teléfonos.)
import { test, expect } from '@playwright/test';
import { enlaceFamilia, codigoPrueba, abrirSobre, entrarAlPanel } from './ayudas.js';

const CAPTURAS = 'test-results/capturas';

test('la confirmación y el mensaje del invitado aparecen en el panel', async ({ page }) => {
  const codigo = codigoPrueba();
  await page.goto(enlaceFamilia(codigo, 'Familia Prueba Panel', 5));
  await abrirSobre(page);
  const rsvp = page.locator('.rsvp');
  await rsvp.getByRole('button', { name: 'Una persona menos' }).click();
  await rsvp.getByRole('button', { name: 'Confirmar asistencia' }).click();
  await expect(rsvp.locator('.rsvp__gracias')).toContainText('van 4 personas');
  await page.locator('.mensajes').getByLabel('Su mensaje').fill('Los queremos mucho.');
  await page.locator('.mensajes').getByRole('button', { name: /Enviar mensaje/ }).click();
  await expect(page.locator('.mensajes__gracias')).toBeVisible();

  await entrarAlPanel(page);
  await expect(page.locator('body')).toContainText('Iris & Alex');
  await expect(page.locator('body')).toContainText('Familia Prueba Panel confirmó 4 de 5 pases.');
  await page.screenshot({ path: `${CAPTURAS}/escritorio-20-panel-resumen.png` });

  await page.goto('/panel/app.html#invitados');
  await expect(page.locator('body')).toContainText('Familia Prueba Panel');
  await expect(page.locator('body')).toContainText('4 de 5 personas');
  await page.screenshot({ path: `${CAPTURAS}/escritorio-21-panel-invitados.png` });

  await page.goto('/panel/app.html#mensajes');
  await expect(page.locator('body')).toContainText('Los queremos mucho.');
  await page.screenshot({ path: `${CAPTURAS}/escritorio-22-panel-mensajes.png` });
});

test('el enlace que arma el panel abre la invitación de esa familia', async ({ page }) => {
  await entrarAlPanel(page);
  const enlace = await page.evaluate(async () => {
    const data = await import('/src/data/index.js');
    const links = await import('/src/lib/links.js');
    const sesion = await data.getSesion();
    const ev = await data.getEventoPorId(sesion.eventoId);
    const f = await data.crearFamilia(ev.id, { nombre: 'Familia Prueba Desde Panel', pasesAsignados: 2 });
    return links.enlaceFamilia(ev.slug, f.codigo, f);
  });
  // El enlace usa el dominio de clientes (pendiente); aquí se abre en localhost.
  const url = new URL(enlace);
  expect(url.pathname).toBe('/iris-alex/');
  await page.goto(url.pathname + url.search);
  await expect(page.locator('.sobre__familia')).toHaveText('Familia Prueba Desde Panel');
  await abrirSobre(page);
  await expect(page.locator('.rsvp')).toContainText('Tenemos 2 lugares reservados para ustedes.');
});

test('el panel lleva la paleta de la invitación y solo ajusta las secciones que tiene', async ({ page }) => {
  await entrarAlPanel(page);
  // Fondo negro de Iris & Alex (#0C0B09), no el crema de la marca.
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(12, 11, 9)');

  await page.goto('/panel/app.html#mas');
  const opciones = page.locator('.mas__opcion-titulo');
  // Iris & Alex tiene mensajes y lluvia de sobres (sección regalos): las dos se ajustan aquí.
  await expect(opciones).toContainText(['Mensajes de sus invitados', 'Actividad reciente', 'Mesa de regalos', 'Datos de su invitación', 'Exportar lista a Excel']);

  // Frase, vestimenta y canción se editan y llegan a la invitación.
  await page.goto('/panel/app.html#datos-evento');
  await page.locator('#ev-vd').fill('Todos de negro');
  await page.locator('#ev-mu').fill('no es un link');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('#ev-mu')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#ev-mu').fill('https://www.youtube.com/watch?v=rtOvBOTyX00');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.reload();
  await expect(page.locator('#ev-vd')).toHaveValue('Todos de negro');
  await page.screenshot({ path: `${CAPTURAS}/panel-datos-invitacion.png`, fullPage: true });

  await page.goto('/iris-alex/');
  await abrirSobre(page);
  await expect(page.locator('.vestimenta__detalle')).toHaveText('Todos de negro');
});

test('grupo propio al agregar una familia y el mismo grupo para varias a la vez', async ({ page }) => {
  await entrarAlPanel(page);
  await page.goto('/panel/app.html#invitados');
  for (const nombre of ['Familia Grupo Uno', 'Familia Grupo Dos']) {
    await page.getByRole('button', { name: /^Agregar (la primera )?familia$/ }).click();
    await page.locator('#ff-nombre').fill(nombre);
    await page.getByRole('button', { name: 'Agregar a la lista' }).click();
    await page.goto('/panel/app.html#invitados');
  }
  await page.getByRole('button', { name: 'Agregar familia' }).click();
  await page.locator('#ff-nombre').fill('Familia Grupo Tres');
  await expect(page.locator('[data-grupo-nuevo]')).toBeHidden();
  await page.locator('#ff-grupo').selectOption('__nuevo');
  await page.locator('#ff-grupo-nuevo').fill('Padrinos');
  await page.getByRole('button', { name: 'Agregar a la lista' }).click();

  await page.goto('/panel/app.html#invitados');
  await page.getByRole('button', { name: 'Asignar grupo a varias' }).click();
  await page.locator('#ag-grupo').selectOption('Padrinos');
  await page.locator('label.seleccion__persona', { hasText: 'Familia Grupo Uno' }).click();
  await page.locator('label.seleccion__persona', { hasText: 'Familia Grupo Dos' }).click();
  await page.getByRole('button', { name: 'Aplicar a 2 familias' }).click();
  const grupos = await page.evaluate(async () => {
    const d = await import('/src/data/index.js');
    const ev = await d.getEvento('iris-alex');
    return (await d.getFamilias(ev.id)).filter((f) => f.nombre.startsWith('Familia Grupo')).map((f) => f.grupo);
  });
  expect(grupos).toEqual(['Padrinos', 'Padrinos', 'Padrinos']);
});

test('en el plano, los lugares de una mesa grande no se empalman', async ({ page }) => {
  await entrarAlPanel(page);
  await page.evaluate(async () => {
    const d = await import('/src/data/index.js');
    const ev = await d.getEvento('iris-alex');
    await d.crearFamilia(ev.id, { nombre: 'Familia Mesas', pasesAsignados: 2 });
    for (const capacidad of [10, 20, 30]) await d.crearMesa(ev.id, { nombre: `Mesa de ${capacidad}`, capacidad });
  });
  await page.goto('/panel/app.html#mesas');
  await expect(page.locator('.mesa-mini')).toHaveCount(3);
  const choques = await page.evaluate(() => [...document.querySelectorAll('.mesa-mini')].reduce((n, mesa) => {
    const r = [...mesa.querySelectorAll('.mesa-mini__lugar')].map((e) => e.getBoundingClientRect());
    return n + r.filter((a, i) => { const b = r[(i + 1) % r.length]; return Math.hypot(a.x - b.x, a.y - b.y) < a.width; }).length;
  }, 0));
  expect(choques).toBe(0);
});
