// Música de fondo. Nunca hay autoplay: solo arranca con iniciar(), que se llama
// cuando el invitado toca el sello del sobre. Si el invitado la silencia, esa
// elección se guarda y se respeta en visitas siguientes.
const SILENCIO_KEY = 'ramostudio:musica:silenciada';

function leerSilencio() {
  try { return localStorage.getItem(SILENCIO_KEY) === '1'; } catch { return false; }
}

function guardarSilencio(valor) {
  try { localStorage.setItem(SILENCIO_KEY, valor ? '1' : '0'); } catch { /* sin almacenamiento */ }
}

export function crearMusica({ src } = {}) {
  let audio = src ? Object.assign(new Audio(src), { loop: true, preload: 'none' }) : null;
  let silenciada = leerSilencio();
  let iniciada = false;
  const oyentes = new Set();
  const sonando = () => !!audio && !audio.paused;
  const avisar = () => oyentes.forEach((fn) => fn({ silenciada, iniciada, disponible: !!audio, sonando: sonando() }));
  if (audio) {
    // Si el archivo no está (p. ej. aún sin licencia para publicarlo), no hay música ni botón.
    audio.addEventListener('error', () => { audio = null; avisar(); });
    audio.addEventListener('play', () => avisar());
    audio.addEventListener('pause', () => avisar());
    // Al salir de la pestaña se pausa; al volver, sigue si no la silenciaron.
    document.addEventListener('visibilitychange', () => {
      if (!audio || !iniciada) return;
      if (document.hidden) audio.pause();
      else if (!silenciada) audio.play().catch(() => {});
    });
  }

  return {
    get silenciada() { return silenciada; },
    get disponible() { return !!audio; },
    get sonando() { return sonando(); },

    // Llamar SOLO desde el toque del sello (gesto del usuario).
    async iniciar() {
      iniciada = true;
      if (audio && !silenciada) {
        try { await audio.play(); } catch { /* el navegador lo bloqueó */ }
      }
      avisar();
    },

    async alternar() {
      silenciada = !silenciada;
      guardarSilencio(silenciada);
      if (audio) {
        if (silenciada) audio.pause();
        else if (iniciada) { try { await audio.play(); } catch { /* bloqueado */ } }
      }
      avisar();
    },

    alCambiar(fn) { oyentes.add(fn); return () => oyentes.delete(fn); },
  };
}

// Botón flotante de música (abajo a la derecha): visible desde que se abre el
// sobre, dice exactamente qué hace ("Silenciar música" / "Activar música") y
// la elección se recuerda. Sin canción no aparece.
const NOTA = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';

export function montarBotonMusica(musica) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'musica';
  boton.innerHTML = `${NOTA}<span class="musica__barras" aria-hidden="true"><i></i><i></i><i></i></span>`;
  const pintar = ({ disponible, silenciada, sonando }) => {
    boton.hidden = !disponible;
    boton.setAttribute('aria-label', silenciada ? 'Activar música' : 'Silenciar música');
    boton.setAttribute('aria-pressed', String(!silenciada));
    boton.classList.toggle('musica--sonando', !!sonando);
  };
  boton.addEventListener('click', () => musica.alternar());
  musica.alCambiar(pintar);
  pintar({ disponible: musica.disponible, silenciada: musica.silenciada, sonando: musica.sonando });
  document.body.append(boton);
}
