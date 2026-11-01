// Ajustes de la web de marca (raíz de ramostudio.com.mx). Los dominios y el
// número de WhatsApp siguen en src/config.js.

// Testimonios: el componente existe pero no se muestra hasta tener testimonios
// reales con permiso de las parejas.
export const TESTIMONIOS_VISIBLES = false;

// Medición (src/site/analitica.js). Apagada mientras sea null: no se carga
// ningún script de Google ni de Meta. Al poner un ID, agregar Google Analytics
// y/o Meta Pixel al aviso de privacidad (sección 4) y su aviso de cookies.
//   GA4_ID:       'G-XXXXXXXXXX'
//   META_PIXEL_ID: '123456789012345'
export const GA4_ID = null;
export const META_PIXEL_ID = null;
