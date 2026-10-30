// Fondo con movimiento (tema.fondo "sombras"): sombras de ramas de mezquite que
// caen sobre la invitación y se mecen despacio, como la luz entre los árboles
// de su sesión. Es un SVG generado aquí (sin imágenes ni video), difuminado y
// casi transparente, que solo se mueve con transform. Sin animación si el
// invitado pidió reducir movimiento (ver invitacion.css).

// Números pseudoaleatorios repetibles: las ramas salen igual en cada visita.
function aleatorio(semilla) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Una rama: curva suave con hojitas en pares a lo largo (como el mezquite).
function rama(r, x0, y0, largo, angulo) {
  const piezas = [];
  const curva = (r() - 0.5) * 0.9;
  let [x, y, a] = [x0, y0, angulo];
  const puntos = [[x, y]];
  for (let t = 0; t < largo; t += 9) {
    a += curva / 14;
    x += Math.cos(a) * 9;
    y += Math.sin(a) * 9;
    puntos.push([x, y]);
    if (t > 30) {
      for (const lado of [-1, 1]) {
        const ah = a + lado * (0.9 + r() * 0.4);
        const l = 7 + r() * 5;
        const cx = x + Math.cos(ah) * l * 0.6;
        const cy = y + Math.sin(ah) * l * 0.6;
        piezas.push(`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(l / 2).toFixed(1)}" ry="${(1.6 + r()).toFixed(1)}" transform="rotate(${((ah * 180) / Math.PI).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`);
      }
    }
  }
  const d = puntos.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join('');
  return `<path d="${d}" fill="none" stroke-width="${(2 + r() * 2).toFixed(1)}"/>${piezas.join('')}`;
}

function svgSombras() {
  const r = aleatorio(1204);
  const ramas = [];
  // Ramas que entran desde las orillas, sobre todo arriba y a los lados.
  for (let i = 0; i < 9; i++) {
    const desdeIzq = i % 2 === 0;
    const x0 = desdeIzq ? -20 : 420;
    const y0 = 40 + r() * 760;
    const ang = (desdeIzq ? 0 : Math.PI) + (r() - 0.5) * 0.9;
    ramas.push(rama(r, x0, y0, 180 + r() * 160, ang));
  }
  return `<svg viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g fill="currentColor" stroke="currentColor">${ramas.join('')}</g></svg>`;
}

export function montarFondo(tema) {
  if (tema?.fondo !== 'sombras') return;
  const capa = document.createElement('div');
  capa.className = 'fondo-sombras';
  capa.innerHTML = svgSombras();
  document.body.prepend(capa);
}
