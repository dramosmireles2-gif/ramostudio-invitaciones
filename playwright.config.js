// Pruebas de punta a punta con Playwright (npm test). Levantan su propio
// servidor en localhost:5199 con VITE_DATOS=local: los eventos de clientes se
// guardan solo en el navegador de la prueba y nunca tocan Supabase.
//   android: Chrome de un Android de gama media (Pixel 7).
//   iphone:  Safari de iPhone (WebKit).
//   escritorio: el panel de los novios en computadora y la seguridad entre
//               familias (tests/rls.spec.js: las migraciones en PGlite, sin navegador).
//
// En GitHub Actions (CI): cada falla sale como anotación del job (se lee sin
// iniciar sesión) y cada prueba tiene un reintento, porque la máquina es más
// lenta y compartida. Lo que falla dos veces bloquea el deploy.
import { defineConfig, devices } from '@playwright/test';

const ci = !!process.env.CI;

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  retries: ci ? 1 : 0,
  reporter: ci ? [['list'], ['github']] : [['list']],
  use: { baseURL: 'http://localhost:5199', locale: 'es-MX', timezoneId: 'America/Matamoros' },
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    env: { VITE_DATOS: 'local' },
    reuseExistingServer: false,
  },
  projects: [
    { name: 'android', use: { ...devices['Pixel 7'] }, testIgnore: /panel|rls/ },
    { name: 'iphone', use: { ...devices['iPhone 13'] }, testIgnore: /panel|rls/ },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testMatch: /panel|rls/ },
  ],
});
