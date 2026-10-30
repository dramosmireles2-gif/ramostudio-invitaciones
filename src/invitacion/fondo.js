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

// El difuminado va dentro del SVG y el SVG se usa como imagen: el navegador lo
// dibuja una sola vez y luego solo lo mueve (con filter: blur en CSS lo volvía
// a dibujar en cada cuadro y la página bajaba a pocos cuadros por segundo).
function svgSombras(color) {
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 900" width="400" height="900">
    <filter id="d" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
    <g fill="${color}" stroke="${color}" filter="url(#d)">${ramas.join('')}</g></svg>`;
}

// Motas de luz (tema.motas): puntitos que suben despacio, como polvo en un rayo
// de sol, en el color de texto secundario y algunas en el acento. Canvas con
// pocas piezas; se detiene con la pestaña oculta y no corre con "reducir
// movimiento".
function montarMotas(tema) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lienzo = document.createElement('canvas');
  lienzo.className = 'fondo-motas';
  lienzo.setAttribute('aria-hidden', 'true');
  document.body.prepend(lienzo);
  const ctx = lienzo.getContext('2d');
  const colores = [tema.colores?.text2 ?? '#5E6466', tema.colores?.text2 ?? '#5E6466', tema.colores?.accent ?? '#9C1C1C'];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let ancho = 0;
  let alto = 0;
  const medir = () => {
    ancho = window.innerWidth;
    alto = window.innerHeight;
    lienzo.width = ancho * dpr;
    lienzo.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  medir();
  window.addEventListener('resize', medir);
  const nueva = (enCualquierParte) => ({
    x: Math.random() * ancho,
    y: enCualquierParte ? Math.random() * alto : alto + 10,
    r: 0.8 + Math.random() * 1.6,
    color: colores[Math.floor(Math.random() * colores.length)],
    vx: (Math.random() - 0.5) * 0.5,
    vy: -0.24 - Math.random() * 0.5,
    vida: 0,
    duracion: 150 + Math.random() * 150,
    max: 0.18 + Math.random() * 0.25,
  });
  const motas = Array.from({ length: 34 }, () => nueva(true));
  let corriendo = true;
  let par = false;
  const cuadro = () => {
    if (!corriendo) return;
    // Se redibuja un cuadro sí y uno no: a esta lentitud no se nota y cuesta la mitad.
    par = !par;
    if (par) { requestAnimationFrame(cuadro); return; }
    ctx.clearRect(0, 0, ancho, alto);
    for (let i = 0; i < motas.length; i++) {
      const m = motas[i];
      m.vida += 1;
      m.x += m.vx;
      m.y += m.vy;
      const t = m.vida / m.duracion;
      if (t >= 1 || m.y < -10) { motas[i] = nueva(false); continue; }
      ctx.globalAlpha = m.max * Math.sin(Math.PI * t);
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(cuadro);
  };
  document.addEventListener('visibilitychange', () => {
    corriendo = !document.hidden;
    if (corriendo) requestAnimationFrame(cuadro);
  });
  requestAnimationFrame(cuadro);
}

export function montarFondo(tema) {
  if (tema?.motas) montarMotas(tema);
  if (tema?.fondo !== 'sombras') return;
  const capa = document.createElement('img');
  capa.className = 'fondo-sombras';
  capa.alt = '';
  capa.setAttribute('aria-hidden', 'true');
  capa.decoding = 'async';
  capa.src = `data:image/svg+xml,${encodeURIComponent(svgSombras(tema.colores?.text ?? '#1A1A1C'))}`;
  document.body.prepend(capa);
}
