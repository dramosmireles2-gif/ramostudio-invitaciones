# Panel de novios: notas de implementación

Diseño de origen: proyecto de Claude Design «Panel de novios»
(https://claude.ai/design/p/76338a84-ae90-4c5f-99c0-74fa747c6212?file=Panel+de+novios.dc.html).
El diseño viene en JSX/React; aquí se traduce a JS plano.

## Estado (2026-10-16)

- **Entrar**: aprobada.
- **Resumen**: aprobado (celular y escritorio).
- **Invitados**: aprobada (celular y escritorio).
- **Mesas**: aprobada (celular y escritorio).
- **Más** (Mensajes, Actividad, Mesa de regalos, Datos del evento, Exportar): Mesa de regalos y Exportar aprobados; Mensajes, Actividad y Datos del evento
  con ajustes de mapas, horas y fechas (en revisión).
- Cada pantalla se muestra en el navegador (celular y escritorio) y se espera aprobación antes de
  pasar a la siguiente.

## Qué hay

- Estructura del panel en `src/panel/main.js`: pestañas abajo en celular y barra lateral desde 1024px.
  Rutas `#resumen`, `#invitados`, `#mesas`, `#mas` y las subvistas de Más (`#mensajes`, `#actividad`,
  `#regalos`, `#datos-evento`, `#exportar`). El hash admite parámetros: `#invitados?filtro=pendientes`
  (lo usa «Ver quiénes son» del Resumen). Las vistas reciben `ctx.escritorio` y se vuelven a montar al
  cruzar los 1024px.
- Piezas compartidas en `src/panel/componentes.js`: `actividadLista` y `abrirRecordatorios`.
- `src/lib/links.js` tiene ahora `rutaInvitacion` y `enlaceWhatsApp`.
- Design system: tokens en `src/styles/tokens.css`, componentes en `src/styles/components.css`,
  helpers de marcado en `src/lib/ui.js` y pantallas del panel en `src/styles/panel.css`.
- `src/lib/theme.js`: `aplicarTema` (tokens `--ev-*` de la invitación) y `aplicarTemaPanel` (el panel
  solo toma del evento el acento y el monograma; el botón usa el acento solo si da 4.5:1 con crema).

## Invitados

- Vista en `src/panel/views/familias.js` (ruta `#invitados`). Celular: lista con búsqueda, filtros
  (Todos, Confirmados, Pendientes, No asisten, No han abierto) y la ficha en
  `#invitados?familia=<id>` para que Atrás regrese a la lista; la búsqueda y el filtro se conservan.
  Escritorio: lista y ficha fija de 420px; abre con la primera familia elegida.
- `#invitados?filtro=pendientes|confirmados|no-asisten|sin-abrir` preselecciona el filtro.
- Componentes nuevos del design system en `src/lib/ui.js` y `components.css`: `guestRow`, `chips`,
  `paperNote` y `abrirConfirmacion` (acción destructiva en vino). `select.field__control` lleva flecha.
- Agregar y editar usan `crearFamilia`, `actualizarFamilia` y `asignarMesa`. Si la mesa está llena,
  al editar se avisa en el formulario; al agregar, la familia queda sin mesa y se avisa. El WhatsApp es
  opcional; si se escribe, deben ser 10 números.
- «Compartir por WhatsApp» abre WhatsApp con la invitación y el enlace de la familia (`links.js`).
- **QR pendiente**: la hoja «Su código QR» muestra el marco del diseño sin código. Generar el QR
  necesita una librería; preguntar antes de agregarla.

## Mesas

- Vista en `src/panel/views/mesas.js` (ruta `#mesas`). Igual en celular y escritorio; en escritorio la
  columna mide como máximo 720px, como en el diseño.
- Totales (con lugar y sin mesa), plano del salón o lista por mesa (`segmented` nuevo en `ui.js`),
  «Solo confirmados», avisos «Para revisar» (mesa sobrepasada, familias sin mesa, familias que no
  asisten y siguen sentadas, mesas con 4 personas o menos) y «Agregar mesa».
- La hoja de cada mesa (o de «Sin mesa») mueve familias, cambia los lugares (8, 10 o 12) y quita la
  mesa con confirmación. Las nuevas se llaman «Mesa N» después de la más alta.
- Los lugares se cuentan como en `getMesas`: confirmados si ya respondió, pases si sigue pendiente,
  ninguno si no asiste. Por eso, a diferencia del diseño, la demo no deja sentar a más personas de las
  que caben (`asignarMesa` avisa que la mesa está llena); «Sobran» aparece solo si se bajan los lugares.
- Las familias que no asisten y siguen en una mesa se dibujan con lugares punteados en vino y no
  cuentan en la ocupación; «Liberar lugares» las pasa a sin mesa.
- `btn--quitar` (texto vino) sirve para «Quitar de la lista» y «Quitar esta mesa».

## Más

- Menú en `src/panel/views/mas.js`; cada subvista (`#mensajes`, `#actividad`, `#regalos`,
  `#datos-evento`, `#exportar`) usa `subvista()` de `componentes.js` («Volver a Más»). El
  encabezado del panel muestra el nombre de la subsección (por ejemplo «Mesa de regalos»).
  En escritorio la columna mide como máximo 640px (1040px en Mesa de regalos).
- Etiqueta «Demo» única en el encabezado del panel (debajo del sello en celular, junto a «Ver mi
  invitación» en escritorio). Los textos de la demo no repiten «ficticio».
- No se pudo copiar el sello «rs» oficial desde el diseño; el pie de Más lleva solo el wordmark.
- **Mesa de regalos**: `guardarRegalo` y `eliminarRegalo` en el store; tipos `mesa`, `lista` y
  `transferencia`. La lluvia de sobres es `evento.lluviaDeSobres` (ya no es un regalo). Seed: Liverpool
  (evento n.º 00000000), Amazon (lista n.º 00000000) y «Banco Ejemplo · cuenta 0000 0000 0000 0000»,
  sin enlaces. Vista previa con el tema del evento (`aplicarTema` sobre la tarjeta).
- Celular: vista previa abajo y cada opción se edita en una hoja. Escritorio: vista previa fija a la
  derecha y la opción se edita en la columna izquierda (la hoja la taparía), con la vista previa
  cambiando mientras escriben.
- **Datos del evento**: fechas en dd/mm/aaaa (`leerFechaNumerica`; las diagonales se ponen solas
  porque el teclado numérico del celular no las tiene). La fecha límite se guarda como días antes de
  la boda y debe ser anterior a ella. Si no cambian la fecha, la demo sigue en «hoy + 58 días»; si la
  cambian, queda fija hasta «reiniciar demo». La hora de la ceremonia es también `evento.hora`.
- **Ubicación en mapa** (Ceremonia y Recepción): los novios pegan el link de Google Maps del lugar
  (`src/lib/mapas.js`). Se guarda `mapaUrl` y, si el link las trae (`!3d…!4d…`, `@lat,lng`, `?q=`),
  `coordenadas`. Los links cortos (`maps.app.goo.gl`) no las traen: entonces el mapa y Waze buscan por
  nombre y dirección. Vista previa con `mapaAlTocar`: un recuadro que no descarga nada de Google hasta
  que lo tocan; luego carga el mapa embebido sin API key (`maps.google.com/maps?…&output=embed`).
- La demo apunta a un lugar público: Plaza Principal Miguel Hidalgo de Reynosa (26.0928694,
  −98.2779834, de OpenStreetMap), en las dos sedes. Las direcciones ya no dicen «ficticia».
- **Invitación**: `src/invitacion/sections/evento.js` es PROVISIONAL (hasta su diseño): cada lugar con
  hora, dirección, mapa al tocar, «Abrir en Google Maps» y «Abrir en Waze» (`waze.com/ul`, gratis).
  Estilos en `src/styles/invitacion.css`.
- **Actividad**: el seed guarda `cuando: { dias, hora }` en la zona del evento (no `haceHoras`), así las
  horas siempre quedan entre 8:00 a. m. y 11:00 p. m.; lo de hoy que aún no pasa se acomoda justo antes
  de ahora y antes de las 8:30 a. m. toda la demo se recorre un día. Los textos llevan `{familia}` y
  los mensajes toman el autor de la familia: siempre el nombre actual del seed. Grupos: «Hoy», «Ayer»
  y luego «Miércoles 14 de octubre» (`diaRelativo`).
- **Exportar** (aprobado): `src/lib/xlsx.js` genera un .xlsx real sin librerías (ZIP sin compresión)
  con varias hojas. Toda descarga trae «Resumen» (confirmados, pendientes, no asisten y pases, en
  personas y familias). «Toda la lista» y «Solo confirmados» agregan la lista; «Por mesa» agrega
  «Mesas» (cada mesa con sus invitados y al final «Sin mesa») y «Lista por mesa». Las hojas de lista
  tienen encabezado fijo y filtros; los anchos salen del contenido (la columna de enlaces no se
  corta) y los enlaces de invitación son clicables.
- `STORAGE_KEY` subió a v5 por los cambios del seed.

## Datos

- `src/data/seed/mariana-diego.json` usa los datos ficticios del diseño: 49 familias, 120 pases y
  12 mesas de 10. Los códigos de familia son nuevos y aleatorios. Cada familia tiene además `grupo` y
  `abrioHaceHoras` (que se convierte en `abrioFecha`). El evento tiene `ciudad`,
  `fechaLimiteRsvpDiasAntes: 35` (faltan 23 días para la fecha límite) y un `tema` nuevo
  (`clave`, `acento`, `monograma` «M·D», `colores --ev-*`, `fuentes`).
- Se conservaron las sedes ficticias del seed porque el diseño usa nombres y direcciones que podrían ser reales.
- `store.local.js` usa `STORAGE_KEY` v2 y tiene `getFamiliasPendientes`. `getResumen` incluye
  `pases.noAsisten`, `familias.sinAbrir` y `diasParaFechaLimite`. Los tipos de actividad son
  `confirmacion`, `no_asiste`, `apertura` y `mensaje`.
- Las familias de la demo no tienen teléfono, así que «Abrir WhatsApp» abre WhatsApp sin número y con el
  mensaje ya escrito.

## Reglas para lo que sigue

- El diseño (`PanelInvitados.jsx`) arma enlaces con `inv.ramosmkt.lat`. **No copiarlo**: los enlaces
  salen solo de `src/lib/links.js` (`demo.ramosmkt.lat`).
- **Mesa de regalos**: usar datos claramente ficticios (por ejemplo «Banco Ejemplo · cuenta
  0000 0000 0000 0000»). Nunca una cuenta o CLABE con formato real, aunque el diseño traiga una
  (`PanelData.js` trae una CLABE de BBVA: no usarla).
