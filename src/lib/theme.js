// Aplica el tema del evento (colores, fuentes, monograma) como variables CSS,
// encima de los tokens base de src/styles/tokens.css.
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function aplicarTema(tema, raiz = document.documentElement) {
  if (!tema) return;
  for (const [nombre, valor] of Object.entries(tema.colores ?? {})) {
    raiz.style.setProperty(`--evento-${kebab(nombre)}`, valor);
  }
  for (const [rol, familia] of Object.entries(tema.fuentes ?? {})) {
    raiz.style.setProperty(`--evento-fuente-${kebab(rol)}`, `"${familia}"`);
  }
  if (tema.monograma) raiz.dataset.monograma = tema.monograma;
}
