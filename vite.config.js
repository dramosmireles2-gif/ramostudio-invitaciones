import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Se publica en un dominio propio (public/CNAME), así que base es la raíz.
export default defineConfig({
  base: '/',
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
