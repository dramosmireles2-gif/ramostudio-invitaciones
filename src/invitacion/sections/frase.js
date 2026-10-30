// La frase de la pareja (evento.frase) como una carta: hoja de papel con
// pespunte (la misma hoja apilada del calendario), la historia en letra
// normal, la última oración (la promesa) más grande en itálica y firmada con
// sus nombres. El texto va tal como lo escribieron.
import { html, crudo } from '../../lib/dom.js';

// "Uno. Dos. Tres." → ["Uno. Dos.", "Tres."]; con una sola oración, todo es promesa.
function separar(frase) {
  const oraciones = frase.trim().match(/[^.!?]+[.!?]+["”»]?\s*/g) ?? [frase];
  if (oraciones.length < 2) return ['', frase.trim()];
  return [oraciones.slice(0, -1).join('').trim(), oraciones.at(-1).trim()];
}

export function montar(contenedor, { evento }) {
  if (!evento.frase) return contenedor.remove();
  const [historia, promesa] = separar(evento.frase);
  contenedor.className = 'frase';
  contenedor.innerHTML = html`
    <figure class="frase__carta">
      <p class="ev-etiqueta frase__etiqueta">Unas palabras nuestras</p>
      <blockquote class="frase__texto">
        ${historia ? crudo(html`<p class="frase__historia">${historia}</p>`) : ''}
        <p class="frase__promesa">${promesa}</p>
      </blockquote>
      <figcaption class="frase__firma">${evento.titulo}</figcaption>
    </figure>`;
}
