# REVISIÓN · Iris & Alex

Concepto B "Blanco y negro, con un punto rojo". Iteración 1, 28 de octubre de 2026.
Capturas en el navegador local a 375x812 y 390x844 (dev), con y sin familia en el enlace.

## Auditoría de señales genéricas

| Señal | ¿Aparece? |
|---|---|
| Script en datos clave | No (fecha, horas, direcciones y límite en Bodoni y Montserrat) |
| Great Vibes / Allura / Parisienne | No (no hay script; nombres en Bodoni itálica) |
| Rosa polvo + dorado | No |
| Dorado o azul polvo como texto sobre crema | No |
| Secciones idénticas con icono | No |
| Emojis | No |
| Sombras grises | No (solo anillos interiores del lacre) |
| Fade-in en todo | No (solo se anima el sobre) |
| Degradados | No |
| Clip-art | No |
| Foto de stock | No (fotos reales de la sesión) |
| Frase de plantilla | **Sí, 1:** la frase de lluvia de sobres es la propuesta 1 del brief; falta la de la pareja |
| Apertura de más de 3 s | No (unos 2 s; sin animación con "reducir movimiento") |
| Música sin gesto | No (no hay música todavía) |
| OG de más de 300 KB | No (67 KB, 1200x630, blanco y negro) |

**Total: 1.** Está dentro de la meta y se resuelve cuando la pareja elija su frase.

## Pruebas

- **2 pantallazos:** el primero ya muestra quién (Iris & Alex), cuándo (viernes 4 de
  diciembre de 2026, 6:00 p. m.), dónde (Reynosa, Tamaulipas) y la cuenta regresiva. El
  segundo, la ceremonia y la recepción con "Cómo llegar". ✔
- **Gemelo:** si se cambian los nombres, quedan el sello rojo (su corazón), las fotos en
  blanco y negro con sombrero, el negro del dress code como sobre y bandas, y el pespunte
  de su mezclilla. No sirve para otra pareja. ✔
- **Abuela:** fecha de 22 px, horas de 34 px, cuerpo de 17 a 18 px; el botón "Confirmar
  por WhatsApp" mide 56 px de alto y es el único botón rojo. ✔
- **RSVP:** con `&d=` sale "Familia Hernández Peña · 4 lugares"; el contador no deja pasar
  de 4; abre `wa.me` con "Confirmamos 3 personas de la familia Hernández Peña.". Sin
  familia pide el nombre (muestra el error si va vacío). ✔
- **Contraste:** fieltro sobre camisa 15.8:1; plata 5.5:1; rojo 7.4:1; camisa sobre rojo
  7.4:1; texto claro sobre fieltro 9.3:1 o más. ✔
- **Build:** `npm run build:clientes` publica `/iris-alex/` con sus metas y fotos; el sitio
  demo no la incluye. ✔

## Iteración 2 (28 de octubre de 2026, pedido de David)

- **Las 8 fotos:** portada (aérea), intermedia (atardecer) y una galería con las otras 6
  (una a lo ancho y dos lado a lado). Todas en blanco y negro menos `corazon`, que se
  queda a color por su corazón rojo. Por decisión de David se usan también las que traen
  la marca de agua de Dreams Studio; se ve en la galería.
- **Frase de la pareja** después de la cuenta regresiva, en Bodoni itálica.
- **La confirmación va al panel** (`rsvp.modo: "panel"`): "Confirmar asistencia" guarda la
  respuesta y la ven en su panel; al confirmar, queda "¡Gracias! Iris y Alex ya saben que
  van 4 personas.". Hoy funciona en el mismo navegador; entre teléfonos funcionará con
  Supabase. El respaldo por WhatsApp sigue listo (`respaldo: "whatsapp"`).
- **Panel de Iris & Alex:** el mismo panel del demo, con su sello I·A y su acento rojo.
  Probado con 5 familias de prueba (solo en el navegador local, no en el repo): la
  confirmación hecha desde la invitación aparece en Resumen, Invitados y Actividad.
- Capturas en `capturas/` (375x812 la invitación y el panel en celular, 1440x900 el panel
  en computadora).
- Auditoría: 2 señales (la frase de lluvia de sobres sigue siendo propuesta; el corazón
  rojo de emoji dentro de la foto `corazon`, que la pareja eligió).

## Iteración 3 (29 de octubre de 2026): versión final en localhost

Pedido de David: transición suave, fotos sin recorte, confirmación y todas las secciones
completas. Solo quedan pendientes la base de datos y el dominio.

- **Apertura:** al tocar el sello, una tarjeta del color de la invitación sale del sobre
  (aparece en 0.6 s mientras sube en 1.1 s) y el sobre se desvanece en 0.7 s sobre una
  invitación del mismo color. Medido cuadro por cuadro: ya no hay salto de oscuro a
  claro. Total: 2.45 s.
- **Fotos completas:** ninguna se recorta. Portada e intermedia a todo lo ancho con su
  alto natural; galería en filas (una a lo ancho, luego un par con el mismo alto y cada
  foto con el ancho que le toca por su aspecto).
- **Confirmación completa:** con enlace personal (aunque el teléfono nunca haya visto a esa
  familia), sin enlace (escriben su nombre y entran a la lista como familia nueva), "No
  podremos asistir", y si ya respondieron se ve su respuesta y la pueden cambiar.
- **Mensajes para los novios:** sección nueva; los mensajes llegan a su panel (Más →
  Mensajes de sus invitados).
- **Pruebas con Playwright** (`npm test`): 16 pruebas en Android (Pixel 7, Chrome), iPhone
  13 (Safari/WebKit) y panel en computadora. Pasan las 16: sobre y apertura, todas las
  secciones con los datos del brief, 8 fotos sin recorte y a todo lo ancho, confirmación
  con y sin enlace, mensaje, "reducir movimiento", y que la confirmación y el mensaje
  aparezcan en el panel.
- Capturas finales en `capturas/` (invitación completa en iPhone, apertura cuadro por
  cuadro y el panel).

## Iteración 4 (29 de octubre de 2026): calendario y regalos

- **"Guarden la fecha":** en vez del botón, una hoja de calendario de diciembre de 2026
  (banda negra con el mes en Bodoni itálica, hoja apilada como papelería) con el 4
  encerrado a mano en rojo; el círculo se traza una vez al llegar a la hoja. Toda la hoja
  agrega la boda al calendario (Google Calendar; .ics en iPhone). HyperFrames no hizo
  falta: es un SVG de unas líneas.
- **Regalos:** lluvia de sobres con su frase y, debajo, transferencia en una tarjeta con
  forma de sobre ("Copiar CLABE" cuando haya número) y Liverpool y Amazon lado a lado.
  Los datos dicen "por confirmar" hasta que la pareja los dé.
- **Liga temporal:** `demo.ramosmkt.lat/iris-alex/` mientras se compra el dominio.
- Playwright: 16 pruebas pasan (calendario con el 4 en la columna del viernes y su enlace,
  regalos con transferencia, Liverpool y Amazon).
- Auditoría: 2 señales, las mismas de antes (frase de sobres y corazón de emoji en la
  foto de la pareja); "por confirmar" en regalos es dato pendiente, no diseño.

## Iteración 5 (29 de octubre de 2026): carta y hilo rojo

- La frase de la pareja como **carta firmada** con su sello de lacre.
- **Hilo rojo:** más acentos rojos sin perder el blanco y negro (ver DESIGN.md). Se
  comparó con Playwright la invitación completa en iPhone, antes y después, pantalla por
  pantalla (`capturas/06` a `08`): el después tiene ritmo y jerarquía y los bloques
  grandes siguen en blanco y negro. Nueva prueba de contraste: todo el texto en color
  cumple AA. 18 pruebas pasan.
- Se quitó el foco automático del sello (en iPhone dibujaba un anillo blanco).

## Iteración 6 (29 de octubre de 2026): portada en hoja y frase como cita

- Se evaluó poner el texto de la portada sobre la foto: se descartó (blanco sobre la
  foto aérea baja a 1.9:1 junto a la pareja; los trazos finos de Bodoni se pierden en el
  pasto; habría que oscurecer o recortar la foto).
- En su lugar, `tema.portada: "hoja"`: el texto va en una hoja con pespunte rojo montada
  48 px sobre la orilla de la foto (sin recortarla).
- Para no tener dos hojas seguidas, `tema.frase: "cita"`: la frase sin hoja, con comillas
  rojas grandes, firma "— Iris & Alex" y sello de lacre. Se compararon maquetas con
  Playwright (cita vs. mover la carta antes de la galería); la carta movida dejaba la zona
  de regalos llena de cajas. Captura: `capturas/09`. 18 pruebas pasan.

## Iteración 7 (29 de octubre de 2026): remate, títulos, sombrero y fondo

- **Separador:** la banda negra con orilla roja parecía corte de PDF. Ahora es un remate
  de costura: dos puntadas y un rombo rojo.
- **Títulos de sección** de 32 a 42 px.
- **Vestimenta:** sombrero vaquero dibujado a una línea, con pespunte en el ala y la
  toquilla roja (`tema.vestimenta: "sombrero"`); "Formal" a 48 px y "De negro" a 30 px.
- **Fondo con movimiento** (`tema.fondo: "sombras"`). Se buscaron opciones en la web
  (loops de video de papel, acuarela, partículas doradas y bokeh, luz entre hojas). Se
  eligió la luz entre hojas: sale de la foto aérea con sombras de mezquite, y las otras
  son pesadas (video) o cliché de plantilla (brillos, bokeh). Ramas de mezquite en SVG
  generado en el código, difuminadas y al 7 %, que se mecen en 14 s solo con transform;
  quietas con "reducir movimiento". Se quitó `mix-blend-mode` para no forzar a WebKit a
  recomponer la página en cada scroll.
- Playwright: 20 pruebas pasan (nuevas: el fondo existe, se mueve, es casi transparente,
  no tapa los botones y se queda quieto con "reducir movimiento"). Captura: `capturas/10`.

## Iteración 8 (29 de octubre de 2026): mapas, parroquia y apertura tipo Ivan & Gemima

- **Mapas a la vista** en ceremonia y recepción (los "Insertar un mapa" que mandó David),
  en blanco y negro y con carga diferida. "Cómo llegar" de la parroquia abre su ficha
  exacta de Google Maps (cid del mapa insertado).
- **Foto de la parroquia** (con arcoíris) en su marco de papel, a color: en blanco y negro
  se perdía el arcoíris. Es chica (408x306): en celular se ve un poco suave.
- **Apertura como la de Ivan & Gemima** (inv.ramosmkt.lat, solo se leyó): el sobre flota
  despacio sobre el papel; "Toquen el sello para abrir" con dos puntos rojos que laten; al
  tocar, el sello cede, la solapa se levanta, cae una lluvia de rombos rojos, puntos y
  puntadas, el sobre crece y se desvanece y la portada sube suave. Toda la pantalla ya es
  del color de la invitación (no hay salto de oscuro a claro). 1.8 s. Ivan & Gemima es en
  San Nicolás de los Garza y esta en Reynosa: no se cruzan invitados.
- **Cuenta regresiva con segundos.**
- **Fondo dinámico:** además de las sombras de mezquite, motas de luz que suben despacio
  (gris y algo de rojo), en canvas, a medio ritmo, pausadas con la pestaña oculta.
- **Barra de avance** arriba, una línea roja sin brillo que crece al bajar.
- **Rendimiento:** medido con Playwright, el difuminado de las sombras con CSS bajaba la
  página a 48 cuadros/s en Chrome; ahora es una imagen ya difuminada que solo se mueve:
  54–61 cuadros/s. El motor de Safari en Windows no tiene aceleración gráfica y no sirve
  para medir un iPhone real: **falta probar en un iPhone**.
- Playwright: 22 pruebas pasan (nuevas: sobre flotante, mismo color de fondo, lluvia,
  segundos, barra de avance, mapas y foto de la parroquia). Captura: `capturas/11`.

## Pendiente antes de enviar (miércoles 4 de noviembre)

1. **Número de WhatsApp** que recibe las confirmaciones (`rsvp.telefono` en evento.json).
   Sin él, WhatsApp pide elegir el chat.
2. **Dominio** comprado y el sitio de clientes publicado (`CLIENTES_BASE_URL`).
3. **Permiso de la fotógrafa** (Dreams Studio by May Torres). Ya va el crédito en el pie.
   Las 3 fotos usadas no tienen marca de agua.
4. **Frase de lluvia de sobres** de la pareja.
5. **Mapa de la parroquia:** hoy se busca por nombre y dirección. Hay que verificar que
   Google Maps y Waze lleguen al lugar correcto.
6. Probar el enlace en WhatsApp real (Android y iPhone) cuando esté publicado: vista
   previa, apertura del sobre y botón de confirmar.
