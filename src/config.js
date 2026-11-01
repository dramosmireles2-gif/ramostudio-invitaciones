// Único lugar donde se definen los dominios de las invitaciones.
// NO usar inv.ramosmkt.lat: pertenece al repo de invitaciones en vivo de clientes.
// Todo se publica en un solo sitio, ramostudio.com.mx: el demo y cada boda en
// /<slug>/ (ver scripts/vite-eventos.js). Si algún día los clientes van en otro
// dominio, basta con cambiar CLIENTES_BASE_URL y los dos sitios se separan.
// Demo: solo el evento DEMO_EVENT_SLUG.
export const INVITE_BASE_URL = 'https://ramostudio.com.mx';
// Clientes: todos los demás eventos, cada uno en /<slug>/.
export const CLIENTES_BASE_URL = 'https://ramostudio.com.mx';

// Evento que abre la demo cuando la URL no trae ?e=
export const DEMO_EVENT_SLUG = 'mariana-diego';

// Dominio donde se publica un evento.
export const baseUrlEvento = (slug) => (slug === DEMO_EVENT_SLUG ? INVITE_BASE_URL : CLIENTES_BASE_URL);

// Modo demo: el evento DEMO_EVENT_SLUG entra al panel sin login y muestra la
// franja "Estás viendo un demo" con "Reiniciar demo". Los demás eventos usan el login.
export const DEMO_MODE = true;

// Supabase (proyecto "ramostudio"): datos de los eventos de clientes. La llave
// es la pública (publishable): las reglas de la base protegen los datos.
// Nunca poner aquí la llave service_role.
export const SUPABASE_URL = 'https://aynagxrafuctjbadxpmt.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_1TAD7P5kuonVHjbIb7aYZQ_zEWCjEuK';

// Login simulado del panel (solo demo): cualquier correo + este código.
export const DEMO_LOGIN_CODE = '123456';

// Número de WhatsApp de RamoStudio (con lada de país, sin "+" ni espacios).
export const WHATSAPP_NUMBER = '528148078309';
