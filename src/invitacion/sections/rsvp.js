// Confirmación de asistencia por familia.
// - evento.rsvp.modo "panel" (o sin modo, como el demo): la respuesta se guarda
//   con data y la ven los novios en su panel.
//   · Con enlace personal: "Familia X · 4 lugares", el contador no pasa de sus
//     pases y, si ya respondieron, se muestra su respuesta y la pueden cambiar.
//   · Sin enlace: escriben el nombre de su familia y cuántos van; entran a la
//     lista de los novios como una familia nueva.
// - evento.rsvp.modo "whatsapp" (respaldo si no hay backend): abre WhatsApp de
//   los novios con el mensaje ya escrito ("Confirmamos 3 personas de la
//   familia Hernández."). El invitado solo lo envía.
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

// Lo que ya respondió la familia, en una frase.
function respuestaPrevia(familia) {
  const r = familia?.rsvp;
  if (!r || r.estado === 'pendiente') return '';
  return r.estado === 'confirmado'
    ? `Ya nos confirmaron ${plural(r.pasesConfirmados, 'persona', 'personas')}. Si algo cambió, pueden actualizarlo aquí.`
    : 'Nos avisaron que no podrán asistir. Si algo cambió, pueden actualizarlo aquí.';
}

export function montar(contenedor, { evento, familia, data }) {
  contenedor.className = 'rsvp';
  contenedor.id = 'confirmar';
  const porWhatsApp = evento.rsvp?.modo === 'whatsapp';
  const novios = evento.anfitriones?.join(' y ') ?? 'Los novios';
  const maximo = familia?.pasesAsignados ?? MAX_SIN_FAMILIA;
  let personas = familia?.rsvp?.estado === 'confirmado' ? familia.rsvp.pasesConfirmados : (familia?.pasesAsignados ?? 1);
  const limite = evento.fechaLimiteRsvp
    ? crudo(html`<p class="rsvp__limite">Les pedimos confirmar antes del <strong>${fechaInvitacion(evento.fechaLimiteRsvp, evento.zonaHoraria).replace(/^./, (c) => c.toLowerCase())}</strong>.</p>`)
    : '';
  const previa = respuestaPrevia(familia);

  contenedor.innerHTML = html`
    <h2 class="ev-titulo">Confirmar asistencia</h2>
    ${limite}
    <form class="rsvp__form" novalidate>
      ${familia
        ? crudo(html`<p class="rsvp__familia">${familia.nombre}</p>
          <p class="rsvp__pases">${familia.pasesAsignados === 1 ? 'Tenemos 1 lugar reservado para ustedes.' : `Tenemos ${familia.pasesAsignados} lugares reservados para ustedes.`}</p>
          ${previa ? crudo(html`<p class="rsvp__previa">${previa}</p>`) : ''}`)
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
      <button type="submit" class="btn btn--lg btn--full">${porWhatsApp ? 'Confirmar por WhatsApp' : 'Confirmar asistencia'}</button>
      <button type="button" class="btn btn--quiet btn--full" data-no-asiste>No podremos asistir</button>
      ${porWhatsApp ? crudo('<p class="rsvp__nota">Se abre WhatsApp con el mensaje listo. Solo tienen que enviarlo.</p>') : ''}
      <p class="rsvp__gracias" role="status" tabindex="-1" hidden></p>
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
    form.querySelector('#rsvp-error').hidden = !!valor;
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
      if (familia) await data.confirmarAsistencia(evento.id, familia.codigo, { asiste, pasesConfirmados: personas });
      else await data.confirmarSinEnlace(evento.id, { nombre, asiste, pasesConfirmados: personas });
      gracias.textContent = asiste
        ? `¡Gracias! ${novios} ya saben que van ${plural(personas, 'persona', 'personas')}.`
        : `Gracias por avisarnos. ${novios} ya lo saben.`;
      for (const n of form.children) n.hidden = n !== gracias;
      gracias.hidden = false;
      gracias.focus({ preventScroll: true });
    } catch (err) {
      gracias.textContent = err.message || 'No pudimos guardar su respuesta. Intenten de nuevo.';
      gracias.hidden = false;
    }
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); responder(true); });
  form.querySelector('[data-no-asiste]').addEventListener('click', () => responder(false));
}
