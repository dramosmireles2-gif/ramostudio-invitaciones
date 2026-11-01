import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { INVITE_BASE_URL, CLIENTES_BASE_URL, DEMO_EVENT_SLUG, baseUrlEvento } from './src/config.js';
import { eventos } from './scripts/vite-eventos.js';

// Las metas del HTML (canonical, og:image) necesitan el dominio absoluto:
// %INVITE_BASE_URL% se cambia por el de src/config.js, el único lugar donde vive.
const dominioEnHtml = {
  name: 'dominio-en-html',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replaceAll('%INVITE_BASE_URL%', INVITE_BASE_URL).replaceAll('%DEMO_EVENT_SLUG%', DEMO_EVENT_SLUG),
  },
};

// Dos sitios desde este repo (ver scripts/vite-eventos.js):
//   vite build                  → dist/          demo (y hoy también los clientes: un solo sitio)
//   vite build --mode clientes  → dist-clientes/ eventos reales (CLIENTES_BASE_URL)
// La raíz es la página de RamoStudio y /demo/ la portada del demo; el sitio de
// clientes (si algún día va aparte) no lleva ninguna de las dos.
// Cada sitio usa un dominio propio, así que base es la raíz.
export default defineConfig(({ mode }) => {
  const clientes = mode === 'clientes';
  const pagina = (ruta) => resolve(import.meta.dirname, ruta);
  return {
    base: '/',
    plugins: [dominioEnHtml, eventos({ baseUrlEvento, demoSlug: DEMO_EVENT_SLUG, clientesBaseUrl: CLIENTES_BASE_URL })],
    build: {
      outDir: clientes ? 'dist-clientes' : 'dist',
      rollupOptions: {
        input: {
          ...(clientes ? {} : { main: pagina('index.html'), demo: pagina('demo/index.html') }),
          invitacion: pagina('invitacion/index.html'),
          login: pagina('panel/index.html'),
          panel: pagina('panel/app.html'),
        },
      },
    },
  };
});
