// La frase de la pareja (evento.frase), tal como la escribieron: la historia
// en letra normal, la última oración (la promesa) más grande en itálica,
// firmada con sus nombres y su sello de lacre. Dos formas (tema.frase):
//  - "carta" (por defecto): en una hoja de papel con pespunte.
//  - "cita": sin hoja, abierta con comillas grandes del acento; para cuando
//    la portada ya es una hoja y no se quieren dos hojas seguidas.
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
  const cita = evento.tema?.frase === 'cita';
  contenedor.className = `frase${cita ? ' frase--cita' : ''}`;
  contenedor.innerHTML = html`
    <figure class="frase__carta">
      ${cita
        ? crudo('<span class="frase__comillas" aria-hidden="true">“</span>')
        : crudo('<p class="ev-etiqueta frase__etiqueta">Unas palabras nuestras</p>')}
      <blockquote class="frase__texto">
        ${historia ? crudo(html`<p class="frase__historia">${historia}</p>`) : ''}
        <p class="frase__promesa">${promesa}</p>
      </blockquote>
      <figcaption class="frase__firma">${evento.titulo}</figcaption>
      <span class="frase__sello" aria-hidden="true">${evento.tema?.monograma ?? ''}</span>
    </figure>`;
}
