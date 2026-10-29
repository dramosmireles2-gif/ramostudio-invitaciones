// Único lugar donde se definen los dominios de las invitaciones.
// NO usar inv.ramosmkt.lat: pertenece al repo de invitaciones en vivo de clientes.
// Sitio demo: solo el evento DEMO_EVENT_SLUG.
export const INVITE_BASE_URL = 'https://demo.ramosmkt.lat';
// Sitio de clientes: todos los demás eventos, cada uno en /<slug>/.
// PENDIENTE: dominio por comprar (ramostudio.mx o ramostudio.com) antes de
// entregar la primera invitación real. Cambiar solo esta línea.
export const CLIENTES_BASE_URL = 'https://ramostudio.mx';

// Evento que abre la demo cuando la URL no trae ?e=
export const DEMO_EVENT_SLUG = 'mariana-diego';

// Dominio donde se publica un evento.
export const baseUrlEvento = (slug) => (slug === DEMO_EVENT_SLUG ? INVITE_BASE_URL : CLIENTES_BASE_URL);

// Modo demo: el evento DEMO_EVENT_SLUG entra al panel sin login y muestra la
// franja "Estás viendo un demo" con "Reiniciar demo". Los demás eventos usan el login.
export const DEMO_MODE = true;

// Login simulado del panel (solo demo): cualquier correo + este código.
export const DEMO_LOGIN_CODE = '123456';

// Número de WhatsApp de RamoStudio (con lada de país, sin "+" ni espacios).
export const WHATSAPP_NUMBER = '528148078309';
