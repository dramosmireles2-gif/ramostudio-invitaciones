// Web de marca de RamoStudio: página principal y legales. Todas comparten este
// archivo: wordmark, enlaces de WhatsApp (con ?src=, ver lib/origen.js) y las
// secciones que se apagan por ajuste.
import { enlaceQuieroLaMia } from '../lib/links.js';
import { wordmark } from '../lib/ui.js';
import { TESTIMONIOS_VISIBLES } from './ajustes.js';

for (const el of document.querySelectorAll('[data-wordmark]')) {
  el.innerHTML = wordmark({ width: 152, tone: 'pizarra', tagline: false });
}
for (const a of document.querySelectorAll('[data-whatsapp]')) a.href = enlaceQuieroLaMia();
if (!TESTIMONIOS_VISIBLES) document.querySelector('[data-seccion="testimonios"]')?.remove();
