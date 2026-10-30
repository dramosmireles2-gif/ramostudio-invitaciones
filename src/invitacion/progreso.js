// Barra de avance arriba: crece conforme el invitado baja por la invitación.
// Se mueve con transform (no con width) para no recalcular la página.
export function montarProgreso() {
  const barra = document.createElement('div');
  barra.className = 'progreso';
  barra.setAttribute('aria-hidden', 'true');
  document.body.append(barra);
  let pendiente = false;
  const pintar = () => {
    pendiente = false;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.transform = `scaleX(${total > 0 ? Math.min(1, window.scrollY / total) : 0})`;
  };
  const alMover = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  };
  window.addEventListener('scroll', alMover, { passive: true });
  window.addEventListener('resize', alMover);
  pintar();
}
