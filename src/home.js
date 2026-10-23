// Página de entrada de la demo: lleva al panel de los novios y al WhatsApp de
// RamoStudio. La invitación se conecta cuando llegue su diseño.
import { enlaceQuieroLaMia } from './lib/links.js';
import { wordmark } from './lib/ui.js';

document.querySelector('[data-wordmark]').innerHTML = wordmark({ width: 168, tone: 'pizarra', tagline: false });
document.querySelector('[data-whatsapp]').href = enlaceQuieroLaMia();
