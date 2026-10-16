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
  const audio = src ? Object.assign(new Audio(src), { loop: true, preload: 'none' }) : null;
  let silenciada = leerSilencio();
  let iniciada = false;
  const oyentes = new Set();
  const avisar = () => oyentes.forEach((fn) => fn({ silenciada, iniciada, disponible: !!audio }));

  return {
    get silenciada() { return silenciada; },
    get disponible() { return !!audio; },

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
