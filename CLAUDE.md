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

- Dos sitios desde **este mismo repo**, cada evento en su carpeta:
  - **Demo** (`npm run build` → `dist/`): solo `mariana-diego`, en **`demo.ramosmkt.lat`**.
  - **Clientes** (`npm run build:clientes` → `dist-clientes/`): todos los demás eventos, en
    `CLIENTES_BASE_URL` (**PENDIENTE**: ramostudio.mx o .com, se compra antes de entregar
    la primera invitación).
  - Los datos de un evento nunca entran al sitio del otro (`scripts/vite-eventos.js`).
  - **TEMPORAL:** mientras no hay dominio, `CLIENTES_BASE_URL` es `demo.ramosmkt.lat` y
    `npm run build` publica todos los eventos en un solo sitio (Iris & Alex en
    `demo.ramosmkt.lat/iris-alex/`). Al comprar el dominio, cambiar esa línea; los sitios
    se separan solos y falta crear el destino de Pages del sitio de clientes.
- **Nunca usar `inv.ramosmkt.lat`**: pertenece a otro repositorio con invitaciones en vivo
  de clientes reales.

## Etapa actual: DEMO + primer cliente

- Sin backend todavía. Supabase se conecta en paralelo (ver punto de respaldo del RSVP).
- **El demo usa solo datos ficticios.** El evento demo es la boda de **Mariana & Diego**
  (`eventos/mariana-diego/`). Su fecha se calcula al cargar como *hoy + 58 días*
  (`fechaRelativaDias`), para que la demo siempre diga "faltan 58 días". En el demo nunca
  usar nombres, teléfonos, correos ni direcciones reales.
- **Eventos de clientes** (primero: Iris & Alex, `eventos/iris-alex/`) llevan sus datos
  reales y una `fecha` fija. Solo lo que la pareja aprobó para la invitación pública; nada
  de datos de invitados en el repo (los captura la pareja desde el panel).
- Los eventos de `inv.ramosmkt.lat` (ivan-gemima, eunice-edher, …) viven en otro repo y no
  se tocan desde aquí.
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
   - Hoy: `store.local.js` carga `eventos/<slug>/evento.json` por slug (un chunk por
     evento, con `import.meta.glob`) y guarda los cambios en `localStorage`.
   - Después: se agrega `store.supabase.js` y `index.js` cambia de implementación **sin
     tocar las pantallas**.
   - Todas las funciones son `async` desde ya, para que el cambio no altere su firma.
2. **Modelo pensado para varias bodas.** Cada evento tiene `id`, `slug`, sus familias,
   pases, mesas, mensajes, regalos y su **tema** (colores, fuentes, monograma). Nada del
   evento demo va escrito a mano en el HTML o el CSS; todo sale de los datos.
3. **El tema se aplica con variables CSS** (`src/lib/theme.js`) generadas desde el `tema`
   del evento, encima de los tokens del design system de RamoStudio.
4. **Dominios solo en `src/config.js`.** `INVITE_BASE_URL` (demo) y `CLIENTES_BASE_URL`
   (clientes); `baseUrlEvento(slug)` elige el de cada evento. Ningún otro archivo escribe
   un dominio.
5. **Enlaces por familia:** `<dominio del evento>/<slug>/?f=<codigo>`. Cada evento tiene su
   página real en `/<slug>/` (la genera `scripts/vite-eventos.js` con el título y las metas
   Open Graph del evento, porque WhatsApp no ejecuta JS); `/invitacion/?e=<slug>&f=<codigo>`
   sigue funcionando como respaldo. El código
   de familia es **aleatorio, de 6 a 8 caracteres**, sin caracteres ambiguos (0/O, 1/I/L),
   y **nunca se deriva del apellido**, para que no se pueda adivinar el enlace de otra
   familia. Los textos y ejemplos del panel muestran este formato. Los enlaces se arman
   solo con `src/lib/links.js`.
6. **Música de la invitación:** solo arranca cuando el invitado toca el sello del sobre
   (nunca en autoplay). Si el invitado la silencia, esa elección se guarda y se respeta
   en visitas siguientes.
7. **Una carpeta por evento** (ver Estructura). Agregar un evento = crear su carpeta; la
   invitación y el panel no llevan código por evento. Al entregar uno, agregar su fila en
   `registro-eventos-ramostudio.md`.

## Marca y diseño

- Usar el **design system de RamoStudio** que llega desde Claude Design (tokens,
  tipografía, componentes). No inventar paleta ni tipografías propias si el design
  system ya las define. Los tokens van en `src/styles/tokens.css`.
- Antes de diseñar o revisar una pantalla, usar la skill `direccion-arte-ramostudio`.
- Las pantallas se implementan una por una a partir del diseño enviado desde Claude Design.
- La invitación se diseña primero para celular (la mayoría la abre desde WhatsApp).
- Textos en español de México.
- **Cada evento arma su invitación desde `evento.json`:** `secciones` (cuáles y en qué
  orden), `tema` (colores, fuentes y `variables` → `--ev-*`), `fotos` (portada,
  intermedia), `rsvp.modo: "whatsapp"` (respaldo sin backend) y `creditoFotos`. Las
  secciones de `src/invitacion/sections/` son las mismas para todos.
- **Fuentes autoalojadas** en `public/fonts/` (Playfair Display, Montserrat, Great Vibes, Bodoni Moda;
  licencia OFL) y declaradas con `@font-face` en `src/styles/base.css`. No cargar fuentes
  desde Google Fonts ni otros CDN.

## Estructura

```
registro-eventos-ramostudio.md  Registro de eventos (fuentes, color, apertura) para no repetir
eventos/<slug>/            Una carpeta por evento:
  evento.json              Datos y tema (misma forma que el demo: eventos, familias, mesas…)
  docs/                    BRIEF-EVENTO.md, REFERENCIAS.md, DESIGN.md, REVISION.md
  fotos/                   Solo optimizadas (AVIF/WebP + JPG); se publican en /eventos/<slug>/fotos/
  og.jpg                   Vista previa de WhatsApp, 1200x630, menos de 300 KB
  _originales/             Fotos pesadas; en .gitignore, nunca se suben
scripts/vite-eventos.js    Página /<slug>/ por evento y copia de fotos/ y og.jpg a dist/
scripts/fotos.mjs          _originales/ → fotos/ (npm run fotos -- <slug>)
index.html                 Portada de la demo (enlaces a invitación y panel)
invitacion/index.html      Invitación (plantilla de /<slug>/; respaldo ?e=<slug>&f=<codigo>)
panel/index.html           Login simulado
panel/app.html             Panel de novios
public/fonts/              Fuentes autoalojadas
public/CNAME               demo.ramosmkt.lat (GitHub Pages)
src/config.js              Dominios (demo y clientes) y constantes de la demo
src/data/                  ÚNICO acceso a datos (index.js = API, store.local.js)
src/styles/                tokens.css, base.css, components.css
src/lib/                   theme, links, fechas, dom
src/invitacion/sections/   sobre, musica, portada, cuenta, evento, rsvp, regalos, mensajes
src/panel/views/           resumen, familias, mesas, mensajes, regalos, actividad,
                           datos-evento, exportar, mas
```

## Comandos

- `npm run dev`: servidor local
- `npm run build`: compila el sitio demo a `dist/` (lo que se publica en GitHub Pages)
- `npm run build:clientes`: compila el sitio de clientes a `dist-clientes/`
- `npm run fotos -- <slug>`: optimiza `eventos/<slug>/_originales/` a `fotos/`
- `npm test`: pruebas de Playwright (`tests/`) en Android, iPhone y el panel en
  computadora. Correrlas antes de mostrar o publicar una invitación.
