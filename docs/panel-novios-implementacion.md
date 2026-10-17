# Panel de novios: notas de implementación

Diseño de origen: proyecto de Claude Design «Panel de novios»
(https://claude.ai/design/p/76338a84-ae90-4c5f-99c0-74fa747c6212?file=Panel+de+novios.dc.html).
El diseño viene en JSX/React; aquí se traduce a JS plano.

## Estado (2026-10-16)

- **Entrar**: aprobada.
- **Resumen**: aprobado (celular y escritorio).
- **Invitados**: aprobada (celular y escritorio).
- **Siguiente**, en este orden: Mesas y Más. Cada pantalla se muestra en el navegador
  (celular y escritorio) y se espera aprobación antes de pasar a la siguiente.

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
  (`PanelData.js` trae una CLABE de BBVA: no usarla). Los regalos del seed todavía no se tocan.
