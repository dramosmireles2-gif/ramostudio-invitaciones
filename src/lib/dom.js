// Ayudas mínimas para construir DOM sin framework.

// Escapa texto que viene de datos (nombres, mensajes) antes de meterlo en HTML.
export function esc(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// html`<p>${nombre}</p>` escapa los valores interpolados.
// Para insertar HTML ya construido, envolverlo con crudo().
const CRUDO = Symbol('crudo');
export const crudo = (html) => ({ [CRUDO]: html });

export function html(partes, ...valores) {
  return partes.reduce((out, parte, i) => {
    if (i === 0) return parte;
    const v = valores[i - 1];
    const s = Array.isArray(v)
      ? v.map((x) => (x?.[CRUDO] ?? esc(x))).join('')
      : v?.[CRUDO] ?? esc(v);
    return out + s + parte;
  }, '');
}

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
