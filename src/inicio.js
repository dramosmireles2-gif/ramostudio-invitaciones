// Página provisional de RamoStudio (raíz del sitio): marca, ejemplo y WhatsApp.
import { enlaceQuieroLaMia } from './lib/links.js';
import { wordmark } from './lib/ui.js';

document.querySelector('[data-wordmark]').innerHTML = wordmark({ width: 168, tone: 'pizarra', tagline: false });
document.querySelector('[data-whatsapp]').href = enlaceQuieroLaMia();
