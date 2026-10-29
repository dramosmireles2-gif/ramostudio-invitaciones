// Unas palabras para los novios: se guardan con data.enviarMensaje y las leen
// en su panel (Más → Mensajes de sus invitados).
import { html, crudo } from '../../lib/dom.js';

const MAX = 500;

export function montar(contenedor, { evento, familia, data }) {
  contenedor.className = 'mensajes';
  const novios = evento.anfitriones?.join(' y ') ?? 'los novios';
  contenedor.innerHTML = html`
    <h2 class="ev-titulo">Unas palabras para ${novios}</h2>
    <form class="mensajes__form" novalidate>
      ${familia ? '' : crudo(html`<div class="field">
        <label class="field__label" for="msg-autor">Su nombre</label>
        <input class="field__control" id="msg-autor" name="autor" autocomplete="name" placeholder="Familia Hernández">
      </div>`)}
      <div class="field">
        <label class="field__label" for="msg-texto">Su mensaje</label>
        <textarea class="field__control mensajes__texto" id="msg-texto" name="texto" rows="4" maxlength="${MAX}"
          placeholder="Escriban aquí sus buenos deseos"></textarea>
        <p class="mensajes__error" hidden>Escriban su mensaje.</p>
      </div>
      <button type="submit" class="btn btn--secondary btn--full">Enviar mensaje a ${novios}</button>
      <p class="mensajes__gracias" role="status" tabindex="-1" hidden></p>
    </form>`;

  const form = contenedor.querySelector('form');
  const error = form.querySelector('.mensajes__error');
  const gracias = form.querySelector('.mensajes__gracias');
  form.texto.addEventListener('input', () => { error.hidden = true; form.texto.removeAttribute('aria-invalid'); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = form.texto.value.trim();
    if (!texto) {
      error.hidden = false;
      form.texto.setAttribute('aria-invalid', 'true');
      form.texto.focus();
      return;
    }
    try {
      await data.enviarMensaje(evento.id, { codigo: familia?.codigo ?? null, autor: form.autor?.value ?? familia?.nombre, texto });
      gracias.textContent = `Su mensaje ya está con ${novios}. ¡Gracias!`;
      for (const n of form.children) n.hidden = n !== gracias;
      gracias.hidden = false;
      gracias.focus({ preventScroll: true });
    } catch (err) {
      gracias.textContent = err.message || 'No pudimos enviar su mensaje. Intenten de nuevo.';
      gracias.hidden = false;
    }
  });
}
