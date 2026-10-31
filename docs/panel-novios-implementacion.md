# Panel de novios: notas de implementación

Diseño de origen: proyecto de Claude Design «Panel de novios»
(https://claude.ai/design/p/76338a84-ae90-4c5f-99c0-74fa747c6212?file=Panel+de+novios.dc.html).
El diseño viene en JSX/React; aquí se traduce a JS plano.

## Estado (2026-10-22)

- **Entrar**: aprobada.
- **Resumen**: aprobado (celular y escritorio).
- **Invitados**: aprobada (celular y escritorio).
- **Mesas**: aprobada; rehecha por persona (cada invitado con su mesa), en revisión.
- **Más** (Mensajes, Actividad, Mesa de regalos, Datos del evento, Exportar): Mesa de regalos y Exportar aprobados; Mensajes, Actividad y Datos del evento
  con ajustes de mapas, horas y fechas (en revisión).
- **Página de entrada y modo demo** (ver «Modo demo»): hechos, en revisión. La pantalla de la
  invitación sigue pendiente hasta que llegue su diseño de Claude Design.
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

## Modo demo

Lo que ve quien llega a `demo.ramosmkt.lat` (por ejemplo desde un flyer).

- **Página de entrada** (`index.html`, `src/home.js`, `src/styles/entrada.css`), celular primero:
  wordmark, «Así se ve tu invitación digital», «Ver el panel de los novios» (va a `/panel/`),
  «Ver la invitación» deshabilitado con la etiqueta «Próximamente» y la banda «¿Te casas o preparas
  unos XV?» con «Quiero la mía» (WhatsApp). Es la única página sin `noindex`.
- **SEO y vista previa**: title, description, canonical y Open Graph. La imagen es
  `eventos/mariana-diego/og.jpg` (1200x630, 61 KB; WhatsApp descarta las de más de 300 KB). Las metas usan
  `%INVITE_BASE_URL%`, que un plugin de `vite.config.js` cambia por el dominio de `src/config.js`.
- **`DEMO_MODE`** (`src/config.js`): con él, el evento `DEMO_EVENT_SLUG` entra al panel sin login
  (`entrarDemo` en el store guarda una sesión `{ demo: true }`). Los demás eventos siguen con el
  login simulado. `esDemo(evento)` vive en `src/panel/demo.js` y llega a las vistas como `ctx.demo`;
  en el demo, Más no muestra «Cerrar sesión».
- **Franja fija arriba** (`montarFranjaDemo`): «Estás viendo un demo · Quiero la mía» y «Reiniciar
  demo», en dorado velo con texto tinta. Reemplaza la etiqueta «Demo» del encabezado. En escritorio
  la barra lateral empieza debajo (`--franja-alto`); las hojas y confirmaciones la cubren.
- **Reiniciar demo**: pide confirmación, `reiniciarDemo()` borra los datos del demo en localStorage
  (la llave actual y las viejas, para que no se vuelvan a migrar; la sesión y el origen se quedan) y
  recarga en `#resumen` con el seed original.
- **Origen de visitas** (`src/lib/origen.js`): `?src=` (por ejemplo `?src=flyer-expo`) se lee al
  entrar, se guarda en sessionStorage y se mantiene al pasar de la entrada al panel (el login lo guarda
  antes de redirigir). Solo letras, números, «-», «_» y «.»; sin src es «directo».
- **WhatsApp de RamoStudio**: `WHATSAPP_NUMBER` en `src/config.js` (único lugar). Todos los «Quiero la
  mía» salen de `enlaceQuieroLaMia()` en `links.js`, con el mensaje «Hola, vi el demo (src) y quiero
  una invitación así».
- **Recorrido invitado → panel (solo datos)**: Familia Ramos (`fam_demo`, código `DEMO`, es
  decir `?f=demo`; antes se llamaba «Familia Herrera Luna» y la Ramos anterior es ahora Familia Rangel), 2 pases, sin abrir y sentada en Mesa 12. Es el único código no aleatorio y solo
  existe en el demo. `confirmarAsistencia()` registra la actividad con la hora actual y la lista de
  Actividad muestra «Ahora» para lo de los últimos 5 minutos. Falta conectar la pantalla de la
  invitación cuando llegue su diseño.
- QA (2026-10-22, 375x812 y 1440x900): `/?src=prueba` → entrada → panel sin login → Reiniciar demo →
  los dos «Quiero la mía» abren `wa.me/528148078309` con «(prueba)»; sin src, «(directo)».

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
- Totales en personas (con lugar y sin mesa), plano del salón o lista por mesa (`segmented` de
  `ui.js`), «Solo confirmados», avisos «Para revisar» (mesa sobrepasada, personas sin mesa, personas que
  no asisten y siguen sentadas, mesas con 4 personas o menos) y «Agregar mesa» («Mesa N» después de la
  más alta).
- **Plano**: un círculo por persona con sus iniciales; primero confirmados, luego pendientes, luego
  quienes no asisten (punteado vino, no ocupan lugar) y al final los lugares libres. Los lugares que
  pasan la capacidad se ven en rojo. Tocar un círculo abre una mini hoja con nombre completo, familia,
  estado de RSVP y mesa («Ver Mesa N»); tocar el centro abre la hoja de la mesa.
- **Hoja de mesa** (y la de «Sin mesa»), de arriba abajo: barra de ocupación «12/10» (roja si se pasa,
  verde si está completa), «Lugares en la mesa» con − y + (1 a 30), el texto de capacidad, la alerta
  con acción si sobran personas, «9 confirmados · 3 por confirmar» (pendientes atenuados), tarjetas
  plegables por familia con sus personas y un selector de mesa por persona, «Dividir familia» y
  «Quitar esta mesa».
- **Alerta con acción**: sugiere la mesa con más lugares libres y su botón «Mover X personas a
  Mesa N» abre la selección de personas de esa mesa; no mueve a nadie hasta que confirman.
- **Dividir familia**: la misma selección con las personas de la familia y la mesa destino. La
  tarjeta de una familia repartida dice «Dividida: 3 en Mesa 5 · 2 en Mesa 12».
- La selección solo actualiza el botón y el aviso al marcar (no vuelve a pintar la lista, así no se
  pierde el foco) y no deja mover a más personas de las que caben.
- **Quitar esta mesa** confirma: «Las X personas de esta mesa quedarán sin mesa. ¿Quitar?».
- `btn--quitar` (texto vino) sirve para «Quitar de la lista» y «Quitar esta mesa».

### Modelo: personas con mesa propia

- Cada familia tiene `personas: [{ id, nombre, mesaId }]`, una por pase; la mesa ya no es de la
  familia (`familia.mesaId` desapareció). Así una familia puede quedar repartida en varias mesas.
- Seed: 50 familias, 122 personas con nombres ficticios generados a partir del nombre de la familia
  (incluye la familia demo `DEMO`, ver «Modo demo»).
  Para la demo, Familia Villarreal está dividida (3 en Mesa 5 · 2 en Mesa 12); Mesa 4 queda con
  2 personas de más y en Mesa 9 siguen sentadas 3 personas que no asistirán.
- Estado de cada persona (`estadoPersona`): si la familia confirmó menos pases de los asignados,
  asisten las primeras personas de su lista y el resto queda como «No asiste». Pendiente = por
  confirmar. Quien no asiste no ocupa lugar aunque siga sentado; al responder que no va (o que van
  menos), `confirmarAsistencia` deja libres sus lugares.
- API (`src/data/index.js`):
  - `asignarPersonasMesa(personaIds, mesaId)`: todo o nada; si no caben, no mueve a nadie
    (`mesa_llena`) y no sienta a quien no asiste (`persona_no_asiste`). `mesaId = null` = sin mesa.
  - `asignarPersonaMesa(personaId, mesaId)`: una persona.
  - `asignarMesa(familiaId, mesaId)`: atajo que mueve a toda la familia.
  - `getMesas` devuelve `personaIds`, `familiaIds` y `ocupados` (personas que ocupan lugar).
  - `getResumen().mesas` incluye `personasConMesa`, `personasSinMesa` y `familiasSinMesa`.
  - Al cambiar los pases de una familia se agregan «Invitado N» (en su mesa si toda está en una) o
    salen las últimas personas.
- **Reglas compartidas** en `src/data/reglas.js` (funciones puras, exportadas desde `index.js`):
  `estadoPersona`, `personasDe`, `lugaresOcupados`, `mesasDeFamilia` y `textoCapacidad`. El texto de
  capacidad es el mismo en la lista, el plano, la hoja, los avisos y el Excel:
  - más personas que lugares: «X personas de más · faltan X lugares» (alerta roja);
  - menos: «Quedan X lugares libres» (neutro);
  - igual: «Mesa completa» (verde discreto). En el plano va la versión corta («2 de más», «3 libres»,
    «Completa»). El Resumen del panel no muestra mesas.
- **Migración (storage v6, ahora v7)**: si no hay datos actuales pero sí v6, v5, v4 o v3, `store.local.js` los convierte:
  cada persona hereda la mesa que tenía su familia, los nombres salen del seed si la familia existe ahí
  con los mismos pases y si no quedan como «Invitado 1», «Invitado 2»… Desde v7 también agrega la
  familia demo (sin abrir; sin mesa si su mesa ya no existe). Guarda la versión actual y borra la llave
  vieja. Probado con una familia movida de mesa y una que no está en el seed.
- Invitados: la mesa de la familia sale de sus personas («Mesa 4», «Mesa 5 (3) · Mesa 12 (2)» o «Sin
  mesa»). En «Editar datos», una familia dividida muestra «Dividida (sin cambios)» para no juntarla
  sin querer.
- Excel «Por mesa»: hoja «Mesas» (cada mesa con sus personas y su capacidad) y hoja «Por mesa» con una
  fila por persona (mesa, persona, familia, estado, grupo); quienes no asisten no salen.

### En Supabase

```sql
create table personas (
  id         uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  nombre     text not null,
  orden      int  not null,                                -- define quién asiste si confirman menos pases
  mesa_id    uuid null references mesas(id) on delete set null,
  unique (familia_id, orden)
);
create index personas_mesa_idx on personas (mesa_id);
```

- `familias` pierde `mesa_id`; la ocupación de una mesa es un `count` de personas por `mesa_id`
  (vista o consulta) filtrando a quienes ocupan lugar según el RSVP de su familia.
- `asignarPersonasMesa` es una función RPC que, en una transacción, revisa el cupo de la mesa y hace
  `update personas set mesa_id = $mesa where id = any($ids)`; `asignarMesa` la llama con las personas
  de la familia. Borrar una mesa deja a sus personas sin mesa (`on delete set null`).
- RLS: la pareja solo ve y cambia las personas de las familias de su evento
  (`familia_id in (select id from familias where evento_id = …)`).
- El comentario equivalente está junto a `getMesas` en `store.local.js`.

## Más

- Menú en `src/panel/views/mas.js`; cada subvista (`#mensajes`, `#actividad`, `#regalos`,
  `#datos-evento`, `#exportar`) usa `subvista()` de `componentes.js` («Volver a Más»). El
  encabezado del panel muestra el nombre de la subsección (por ejemplo «Mesa de regalos»).
  En escritorio la columna mide como máximo 640px (1040px en Mesa de regalos).
- La etiqueta «Demo» del encabezado se quitó: ahora avisa la franja del modo demo. Los textos de la
  demo no repiten «ficticio».
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
  y luego «Miércoles 14 de octubre» (`diaRelativo`). Lo de los últimos 5 minutos dice «Ahora».
- **Exportar** (aprobado): `src/lib/xlsx.js` genera un .xlsx real sin librerías (ZIP sin compresión)
  con varias hojas. Toda descarga trae «Resumen» (confirmados, pendientes, no asisten y pases, en
  personas y familias). «Toda la lista» y «Solo confirmados» agregan la lista; «Por mesa» agrega
  «Mesas» (cada mesa con sus invitados y al final «Sin mesa») y «Lista por mesa». Las hojas de lista
  tienen encabezado fijo y filtros; los anchos salen del contenido (la columna de enlaces no se
  corta) y los enlaces de invitación son clicables.
- `STORAGE_KEY` subió a v5 por los cambios del seed (después a v6 por las personas y a v7 por la
  familia demo).

## Datos

- `eventos/mariana-diego/evento.json` usa los datos ficticios del diseño: 50 familias, 122 pases (una
  persona por pase, ver «Modelo: personas con mesa propia») y 12 mesas de 10. Los códigos de familia son nuevos y aleatorios, salvo `DEMO` (familia del recorrido del demo). Cada familia tiene además `grupo` y
  `abrioHaceHoras` (que se convierte en `abrioFecha`). El evento tiene `ciudad`,
  `fechaLimiteRsvpDiasAntes: 35` (faltan 23 días para la fecha límite) y un `tema` nuevo
  (`clave`, `acento`, `monograma` «M·D», `colores --ev-*`, `fuentes`).
- Se conservaron las sedes ficticias del seed porque el diseño usa nombres y direcciones que podrían ser reales.
- `store.local.js` usa `STORAGE_KEY` v7 (migra v6, v5, v4 y v3) y tiene `getFamiliasPendientes`. `getResumen` incluye
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
