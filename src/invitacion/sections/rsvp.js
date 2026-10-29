// Confirmación de asistencia por familia.
// - evento.rsvp.modo "whatsapp" (eventos reales sin backend): abre WhatsApp de
//   los novios con el mensaje ya escrito ("Confirmamos 3 personas de la
//   familia Hernández."). El invitado solo lo envía.
// - Sin modo (demo): guarda la respuesta con data.confirmarAsistencia.
// Sin familia en el enlace, el invitado escribe su nombre y cuántos van.
import { fechaInvitacion } from '../../lib/fechas.js';
import { enlaceWhatsApp } from '../../lib/links.js';
import { html, crudo } from '../../lib/dom.js';

const MAX_SIN_FAMILIA = 10;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// "Familia Hernández" → "de la familia Hernández"; "Ana y Luis López" → "de parte de Ana y Luis López".
function deQuien(nombre) {
  const m = /^familia\s+(.+)$/i.exec(nombre.trim());
  return m ? `de la familia ${m[1]}` : `de parte de ${nombre.trim()}`;
}

export function mensajeConfirmacion(nombre, personas) {
  return `Confirmamos ${plural(personas, 'persona', 'personas')} ${deQuien(nombre)}.`;
}

export function mensajeNoAsiste(nombre) {
  return `Les avisamos con cariño que no podremos asistir (${nombre.trim()}). ¡Muchas felicidades!`;
}

export function montar(contenedor, { evento, familia, data }) {
  contenedor.className = 'rsvp';
  contenedor.id = 'confirmar';
  const porWhatsApp = evento.rsvp?.modo === 'whatsapp';
  const maximo = familia?.pasesAsignados ?? MAX_SIN_FAMILIA;
  let personas = familia?.pasesAsignados ?? 1;
  const limite = evento.fechaLimiteRsvp
    ? crudo(html`<p class="rsvp__limite">Les pedimos confirmar antes del <strong>${fechaInvitacion(evento.fechaLimiteRsvp, evento.zonaHoraria).replace(/^./, (c) => c.toLowerCase())}</strong>.</p>`)
    : '';

  contenedor.innerHTML = html`
    <h2 class="ev-titulo">Confirmar asistencia</h2>
    ${limite}
    <form class="rsvp__form" novalidate>
      ${familia
        ? crudo(html`<p class="rsvp__familia">${familia.nombre}</p>
          <p class="rsvp__pases">${familia.pasesAsignados === 1 ? 'Tenemos 1 lugar reservado para ustedes.' : `Tenemos ${familia.pasesAsignados} lugares reservados para ustedes.`}</p>`)
        : crudo(html`<div class="field">
            <label class="field__label" for="rsvp-nombre">Nombre de su familia</label>
            <input class="field__control" id="rsvp-nombre" name="nombre" autocomplete="family-name" placeholder="Familia Hernández" required>
            <p class="rsvp__error" id="rsvp-error" hidden>Escriban el nombre de su familia.</p>
          </div>`)}
      <div class="rsvp__contador">
        <p class="field__label" id="rsvp-cuantos">¿Cuántas personas asistirán?</p>
        <div class="rsvp__stepper" role="group" aria-labelledby="rsvp-cuantos">
          <button type="button" class="rsvp__paso" data-paso="-1" aria-label="Una persona menos">−</button>
          <output class="rsvp__numero" aria-live="polite">${personas}</output>
          <button type="button" class="rsvp__paso" data-paso="1" aria-label="Una persona más">+</button>
        </div>
      </div>
      <button type="submit" class="btn btn--lg btn--full" data-asiste="si">${porWhatsApp ? 'Confirmar por WhatsApp' : 'Confirmar asistencia'}</button>
      <button type="button" class="btn btn--quiet btn--full" data-asiste="no">No podremos asistir</button>
      ${porWhatsApp ? crudo('<p class="rsvp__nota">Se abre WhatsApp con el mensaje listo. Solo tienen que enviarlo.</p>') : ''}
      <p class="rsvp__gracias" role="status" hidden></p>
    </form>`;

  const form = contenedor.querySelector('form');
  const numero = form.querySelector('.rsvp__numero');
  const gracias = form.querySelector('.rsvp__gracias');
  const pintar = () => {
    numero.textContent = personas;
    form.querySelector('[data-paso="-1"]').disabled = personas <= 1;
    form.querySelector('[data-paso="1"]').disabled = personas >= maximo;
  };
  pintar();
  form.addEventListener('click', (e) => {
    const paso = e.target.closest('[data-paso]');
    if (!paso) return;
    personas = Math.min(maximo, Math.max(1, personas + Number(paso.dataset.paso)));
    pintar();
  });

  const nombreFamilia = () => {
    if (familia) return familia.nombre;
    const campo = form.nombre;
    const valor = campo.value.trim();
    const error = form.querySelector('#rsvp-error');
    error.hidden = !!valor;
    campo.toggleAttribute('aria-invalid', !valor);
    if (!valor) campo.focus();
    return valor;
  };
  form.nombre?.addEventListener('input', () => { form.querySelector('#rsvp-error').hidden = true; form.nombre.removeAttribute('aria-invalid'); });

  async function responder(asiste) {
    const nombre = nombreFamilia();
    if (!nombre) return;
    if (porWhatsApp) {
      const texto = asiste ? mensajeConfirmacion(nombre, personas) : mensajeNoAsiste(nombre);
      window.open(enlaceWhatsApp(texto, evento.rsvp.telefono ?? ''), '_blank', 'noopener');
      return;
    }
    try {
      await data.confirmarAsistencia(evento.id, familia?.codigo, { asiste, pasesConfirmados: personas });
      gracias.textContent = asiste ? `¡Gracias! Confirmaron ${plural(personas, 'persona', 'personas')}.` : 'Gracias por avisarnos.';
    } catch (err) {
      gracias.textContent = err.message;
    }
    gracias.hidden = false;
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); responder(true); });
  form.querySelector('[data-asiste="no"]').addEventListener('click', () => responder(false));
}
