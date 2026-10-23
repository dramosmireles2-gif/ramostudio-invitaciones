import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { INVITE_BASE_URL } from './src/config.js';

// Las metas del HTML (canonical, og:image) necesitan el dominio absoluto:
// %INVITE_BASE_URL% se cambia por el de src/config.js, el único lugar donde vive.
const dominioEnHtml = {
  name: 'dominio-en-html',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%INVITE_BASE_URL%', INVITE_BASE_URL) },
};

// Se publica en un dominio propio (public/CNAME), así que base es la raíz.
export default defineConfig({
  base: '/',
  plugins: [dominioEnHtml],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        invitacion: resolve(import.meta.dirname, 'invitacion/index.html'),
        login: resolve(import.meta.dirname, 'panel/index.html'),
        panel: resolve(import.meta.dirname, 'panel/app.html'),
      },
    },
  },
});
