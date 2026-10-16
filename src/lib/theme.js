// Aplica el tema del evento como variables CSS encima de los tokens de
// src/styles/tokens.css. Dos usos:
//  - aplicarTema: la invitación (capa EVENTO, tokens --ev-*).
//  - aplicarTemaPanel: el panel de novios, que del evento solo toma el acento
//    (filetes, sello, anillo del botón) y el monograma.
const CREMA = '#F4EFE9';
const TINTA = '#2B2A28';
const PIZARRA = '#3E5266';
const PIZARRA_HONDO = '#33455A';

// "onAction" → "on-action", "surface2" → "surface-2"
const kebab = (s) => s.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();

// Contraste WCAG entre dos colores hex (mismo cálculo que validar-tema.js del design system).
function luminancia(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = [...c].map((x) => x + x).join('');
  return [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
}

export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function aplicarTema(tema, raiz = document.documentElement) {
  if (!tema) return;
  if (tema.clave) raiz.dataset.evTheme = tema.clave;
  for (const [nombre, valor] of Object.entries(tema.colores ?? {})) {
    raiz.style.setProperty(`--ev-${kebab(nombre)}`, valor);
  }
  for (const [rol, familia] of Object.entries(tema.fuentes ?? {})) {
    raiz.style.setProperty(`--ev-font-${kebab(rol)}`, `"${familia}"`);
  }
  if (tema.monograma) raiz.dataset.monograma = tema.monograma;
}

// El botón usa el acento solo si da 4.5:1 con texto crema; si no, se queda en
// pizarra y el acento vive en filetes y sello.
export function aplicarTemaPanel(tema, raiz = document.documentElement) {
  const acento = tema?.acento ?? '#B79A6B';
  const botonConAcento = contraste(acento, CREMA) >= 4.5;
  const vars = {
    '--rule-color': acento,
    '--btn-ring': acento,
    '--btn-bg': botonConAcento ? acento : PIZARRA,
    '--btn-bg-press': botonConAcento ? acento : PIZARRA_HONDO,
    '--seal-color': acento,
    '--seal-ink': contraste(acento, CREMA) >= 3 ? CREMA : TINTA,
  };
  for (const [k, v] of Object.entries(vars)) raiz.style.setProperty(k, v);
  return {
    acento,
    botonConAcento,
    // El aviso solo aplica a eventos con color propio, no al tema de la marca.
    avisoContraste: !botonConAcento && tema?.clave && tema.clave !== 'marca',
    monograma: tema?.monograma ?? '',
  };
}
