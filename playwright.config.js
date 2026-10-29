// Pruebas de punta a punta con Playwright (npm test). Levanta (o reutiliza) el
// servidor de desarrollo en localhost:5173.
//   android: Chrome de un Android de gama media (Pixel 7).
//   iphone:  Safari de iPhone (WebKit).
//   escritorio: el panel de los novios en computadora.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', locale: 'es-MX', timezoneId: 'America/Matamoros' },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'android', use: { ...devices['Pixel 7'] }, testIgnore: /panel/ },
    { name: 'iphone', use: { ...devices['iPhone 13'] }, testIgnore: /panel/ },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testMatch: /panel/ },
  ],
});
