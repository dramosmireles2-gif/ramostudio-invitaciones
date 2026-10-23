// Único lugar donde se define el dominio de los enlaces de invitación.
// NO usar inv.ramosmkt.lat: pertenece al repo de invitaciones en vivo de clientes.
export const INVITE_BASE_URL = 'https://demo.ramosmkt.lat';

// Evento que abre la demo cuando la URL no trae ?e=
export const DEMO_EVENT_SLUG = 'mariana-diego';

// Modo demo: el evento DEMO_EVENT_SLUG entra al panel sin login y muestra la
// franja "Estás viendo un demo" con "Reiniciar demo". Los demás eventos usan el login.
export const DEMO_MODE = true;

// Login simulado del panel (solo demo): cualquier correo + este código.
export const DEMO_LOGIN_CODE = '123456';

// Número de WhatsApp de RamoStudio (con lada de país, sin "+" ni espacios).
export const WHATSAPP_NUMBER = '528148078309';
