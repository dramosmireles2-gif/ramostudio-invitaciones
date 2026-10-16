# RamoStudio — Invitaciones digitales

## Qué es

RamoStudio hace invitaciones digitales para bodas, XV años y eventos similares. Cada
evento tiene dos caras:

- **Invitación** (la ven los invitados): sobre que se abre con un sello, portada, cuenta
  regresiva, ceremonia y recepción, itinerario, código de vestimenta, mesa de regalos,
  confirmación de asistencia (RSVP) por familia con número de pases, mensajes para los
  novios y música.
- **Panel de novios** (lo ven los anfitriones): resumen de confirmaciones, familias y
  pases, mesas, mensajes, regalos, actividad reciente, datos del evento, exportación a
  Excel/CSV y enlaces personalizados por familia para compartir.

RamoStudio es una **marca separada de RamosMKT**. No mezclar logotipos, colores, tono ni
copy de RamosMKT en este proyecto. El único punto de contacto es el subdominio donde se
publica.

## Dominio

- Este demo se publica en **`demo.ramosmkt.lat`**.
- **Nunca usar `inv.ramosmkt.lat`**: pertenece a otro repositorio con invitaciones en vivo
  de clientes reales.

## Etapa actual: DEMO

- Todo es **demo**, sin backend. Supabase se conecta en una etapa posterior.
- **Solo datos ficticios.** El evento de prueba es la boda de **Mariana & Diego**. Su
  fecha se calcula al cargar como *hoy + 58 días*, para que la demo siempre diga
  "faltan 58 días". Nunca usar nombres, teléfonos, correos ni direcciones reales.
- **Login del panel simulado:** cualquier correo + código `123456`. Es solo para la demo;
  no construir nada que parezca autenticación real ni guardar contraseñas.

## Stack

- **Vite** + HTML, CSS y JavaScript plano (ES modules). **Sin React** ni otros frameworks
  de UI.
- Despliegue en **GitHub Pages** (sitio estático). Pages no reescribe rutas: usar páginas
  reales (multi-page de Vite) y parámetros en la URL, no rutas dinámicas.
- Dependencias mínimas. Antes de agregar una librería, preguntar.

## Reglas de arquitectura

1. **Un solo módulo de datos** (`src/data/`). Las pantallas nunca leen JSON,
   `localStorage` ni (en el futuro) Supabase directamente; siempre importan de
   `src/data/index.js` (`getEvento`, `getFamilias`, `confirmarAsistencia`, `getMesas`,
   `enviarMensaje`, `getRegalos`, `getActividad`, …).
   - Hoy: `store.local.js` lee el JSON de `seed/` y guarda los cambios en `localStorage`.
   - Después: se agrega `store.supabase.js` y `index.js` cambia de implementación **sin
     tocar las pantallas**.
   - Todas las funciones son `async` desde ya, para que el cambio no altere su firma.
2. **Modelo pensado para varias bodas.** Cada evento tiene `id`, `slug`, sus familias,
   pases, mesas, mensajes, regalos y su **tema** (colores, fuentes, monograma). Nada del
   evento demo va escrito a mano en el HTML o el CSS; todo sale de los datos.
3. **El tema se aplica con variables CSS** (`src/lib/theme.js`) generadas desde el `tema`
   del evento, encima de los tokens del design system de RamoStudio.
4. **Dominio en una sola variable.** `INVITE_BASE_URL = "https://demo.ramosmkt.lat"` vive
   únicamente en `src/config.js`. Ningún otro archivo escribe el dominio.
5. **Enlaces por familia:** `<INVITE_BASE_URL>/invitacion/?e=<slug>&f=<codigo>`. El código
   de familia es **aleatorio, de 6 a 8 caracteres**, sin caracteres ambiguos (0/O, 1/I/L),
   y **nunca se deriva del apellido**, para que no se pueda adivinar el enlace de otra
   familia. Los textos y ejemplos del panel muestran este formato. Los enlaces se arman
   solo con `src/lib/links.js`.
6. **Música de la invitación:** solo arranca cuando el invitado toca el sello del sobre
   (nunca en autoplay). Si el invitado la silencia, esa elección se guarda y se respeta
   en visitas siguientes.

## Marca y diseño

- Usar el **design system de RamoStudio** que llega desde Claude Design (tokens,
  tipografía, componentes). No inventar paleta ni tipografías propias si el design
  system ya las define. Los tokens van en `src/styles/tokens.css`.
- Antes de diseñar o revisar una pantalla, usar la skill `direccion-arte-ramostudio`.
- Las pantallas se implementan una por una a partir del diseño enviado desde Claude Design.
- La invitación se diseña primero para celular (la mayoría la abre desde WhatsApp).
- Textos en español de México.
- **Fuentes autoalojadas** en `public/fonts/` (Playfair Display, Montserrat, Great Vibes;
  licencia OFL) y declaradas con `@font-face` en `src/styles/base.css`. No cargar fuentes
  desde Google Fonts ni otros CDN.

## Estructura

```
index.html                 Portada de la demo (enlaces a invitación y panel)
invitacion/index.html      Invitación (?e=<slug>&f=<codigo>)
panel/index.html           Login simulado
panel/app.html             Panel de novios
public/fonts/              Fuentes autoalojadas
public/CNAME               demo.ramosmkt.lat (GitHub Pages)
src/config.js              INVITE_BASE_URL y constantes de la demo
src/data/                  ÚNICO acceso a datos (index.js = API, store.local.js, seed/)
src/styles/                tokens.css, base.css, components.css
src/lib/                   theme, links, fechas, dom
src/invitacion/sections/   sobre, musica, portada, cuenta, evento, rsvp, regalos, mensajes
src/panel/views/           resumen, familias, mesas, mensajes, regalos, actividad,
                           datos-evento, exportar, mas
```

## Comandos

- `npm run dev`: servidor local
- `npm run build`: compila a `dist/` (lo que se publica en GitHub Pages)
