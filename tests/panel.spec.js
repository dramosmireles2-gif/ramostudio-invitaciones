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
