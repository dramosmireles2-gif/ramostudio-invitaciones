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
  // Otros valores del tema (p. ej. "nombres-style": "italic") → --ev-<nombre>.
  for (const [nombre, valor] of Object.entries(tema.variables ?? {})) {
    raiz.style.setProperty(`--ev-${nombre}`, valor);
  }
  if (tema.monograma) raiz.dataset.monograma = tema.monograma;
}

// El panel de un evento con paleta propia (tema.colores) se viste con los
// colores de su invitación: fondo, papel, texto, acento y botones. Sin paleta
// propia (el demo, tema "marca"), se queda con la marca RamoStudio y el botón
// usa el acento solo si da 4.5:1 con texto crema; si no, se queda en pizarra.
const esHex = (v) => /^#[0-9a-f]{6}$/i.test(v ?? '');
const oscuro = (hex) => luminancia(hex) < 0.18;

function paletaPanel(c, acento) {
  if (!esHex(c.bg) || !esHex(c.text) || c.bg.toUpperCase() === CREMA) return null;
  const papel = esHex(c.surface) ? c.surface : c.bg;
  // Texto de cuerpo: el secundario del evento si se lee bien sobre el papel.
  const texto = esHex(c.text2) && contraste(c.text2, papel) >= 4.5 ? c.text2 : c.text;
  const activo = esHex(c.action) ? c.action : acento;
  const sobreActivo = esHex(c.onAction) ? c.onAction : (contraste(activo, c.text) >= 4.5 ? c.text : c.bg);
  const banda = esHex(c.band) ? c.band : activo;
  const enOscuro = oscuro(c.bg);
  return {
    '--pn-fondo': c.bg,
    '--pn-papel': papel,
    '--pn-hundido': esHex(c.surface2) ? c.surface2 : papel,
    '--pn-tinta': c.text,
    '--pn-texto': texto,
    '--pn-banda': banda,
    '--pn-sobre-banda': esHex(c.onBand) ? c.onBand : c.text,
    '--pn-activo': activo,
    '--pn-activo-hondo': activo,
    '--pn-sobre-activo': sobreActivo,
    '--pn-acento': acento,
    '--pn-acento-velo': `color-mix(in srgb, ${acento} 22%, ${papel})`,
    // Sí / no / pendiente, legibles sobre fondo oscuro o claro.
    '--pn-si': enOscuro ? '#9CC5A6' : '#3F5E4A',
    '--pn-no': enOscuro ? '#E39A8E' : '#7A3B34',
    '--pn-no-velo': enOscuro ? 'rgba(227, 154, 142, .12)' : '#EFDCD6',
    '--pn-velo-oscuro': enOscuro ? 'rgba(0, 0, 0, .6)' : 'rgba(43, 42, 40, .42)',
    '--status-si-fg': enOscuro ? '#9CC5A6' : '#3F5E4A',
    '--status-si-bg': enOscuro ? 'rgba(156, 197, 166, .14)' : '#DDE6DC',
    '--status-no-fg': enOscuro ? '#E39A8E' : '#7A3B34',
    '--status-no-bg': enOscuro ? 'rgba(227, 154, 142, .14)' : '#EFDCD6',
    '--status-pend-fg': texto,
    '--status-pend-bg': `color-mix(in srgb, ${c.text} 10%, ${papel})`,
    '--line-hair': `color-mix(in srgb, ${c.text} 16%, transparent)`,
    '--line-paper': `color-mix(in srgb, ${c.text} 14%, transparent)`,
    '--line-field': `color-mix(in srgb, ${c.text} 34%, transparent)`,
    '--paper-layer': `0 0 0 1px color-mix(in srgb, ${c.text} 10%, transparent), 4px 4px 0 0 ${esHex(c.surface2) ? c.surface2 : papel}`,
    '--focus-ring': acento,
    '--btn-bg': activo,
    '--btn-bg-press': activo,
    '--btn-fg': sobreActivo,
    '--btn-line': texto,
    '--seal-color': esHex(c.seal) ? c.seal : acento,
    '--seal-ink': esHex(c.onSeal) ? c.onSeal : (contraste(acento, c.bg) >= 3 ? c.bg : c.text),
  };
}

export function aplicarTemaPanel(tema, raiz = document.documentElement) {
  const acento = tema?.acento ?? '#B79A6B';
  const propia = paletaPanel(tema?.colores ?? {}, acento);
  const botonConAcento = propia ? true : contraste(acento, CREMA) >= 4.5;
  const vars = {
    '--rule-color': acento,
    '--btn-ring': acento,
    '--btn-bg': botonConAcento ? acento : PIZARRA,
    '--btn-bg-press': botonConAcento ? acento : PIZARRA_HONDO,
    '--seal-color': acento,
    '--seal-ink': contraste(acento, CREMA) >= 3 ? CREMA : TINTA,
    ...propia,
  };
  for (const [k, v] of Object.entries(vars)) raiz.style.setProperty(k, v);
  // Componentes compartidos con la invitación (p. ej. el mapa) usan --ev-*.
  if (propia) {
    for (const [nombre, valor] of Object.entries(tema.colores)) raiz.style.setProperty(`--ev-${kebab(nombre)}`, valor);
    raiz.dataset.panelTema = oscuro(tema.colores.bg) ? 'oscuro' : 'claro';
    // Los nombres y los títulos, en las fuentes de la invitación.
    const f = tema.fuentes ?? {};
    if (f.script) raiz.style.setProperty('--font-script', `"${f.script}", cursive`);
    if (f.title) raiz.style.setProperty('--font-serif', `"${f.title}", Georgia, serif`);
    if (tema.variables?.['nombres-style']) raiz.style.setProperty('--pn-script-style', tema.variables['nombres-style']);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema.colores.bg);
  }
  return {
    acento,
    botonConAcento,
    // El aviso solo aplica a eventos con color propio, no al tema de la marca.
    avisoContraste: !botonConAcento && tema?.clave && tema.clave !== 'marca',
    monograma: tema?.monograma ?? '',
  };
}
