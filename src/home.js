// Página de entrada de la demo: lleva al panel de los novios, a la invitación
// demo (abierta para la Familia Ramos) y al WhatsApp de RamoStudio. El enlace
// de WhatsApp guarda ?src= (lib/origen.js) para el resto de la visita.
import { enlaceQuieroLaMia, rutaInvitacionDemo } from './lib/links.js';
import { wordmark } from './lib/ui.js';

document.querySelector('[data-wordmark]').innerHTML = wordmark({ width: 168, tone: 'pizarra', tagline: false });
document.querySelector('[data-whatsapp]').href = enlaceQuieroLaMia();
document.querySelector('[data-invitacion]').href = rutaInvitacionDemo();
