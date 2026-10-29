# BRIEF-EVENTO · Iris & Alex

Evento real (cliente). Slug: `iris-alex`. Sitio: clientes (`CLIENTES_BASE_URL`, dominio
pendiente de compra). Datos dados por David el 28 de octubre de 2026.

Marcas: **PENDIENTE** = falta el dato · **SUPUESTO** = lo asumo hasta que se confirme.

## Calendario del proyecto

| Fecha | Hito |
|---|---|
| Miércoles 28 de octubre de 2026 | Brief (este documento) |
| Al llegar las fotos | Análisis de fotos y 2 conceptos en DESIGN.md; David elige uno |
| Después de elegir | Construcción, ciclo de revisión con capturas (REVISION.md) |
| **Miércoles 4 de noviembre de 2026** | **Invitación enviable** (dominio comprado y publicado) |
| Viernes 20 de noviembre de 2026 | Fecha límite para confirmar asistencia |
| **Viernes 4 de diciembre de 2026** | **Boda** |

## Evento

- **Tipo:** boda.
- **Nombres como se escriben:** Iris & Alex. PENDIENTE: ¿solo nombres de pila o también
  nombres completos y padres/padrinos?
- **Fecha:** viernes 4 de diciembre de 2026.
- **Ciudad:** Reynosa, Tamaulipas. Zona horaria `America/Matamoros` (en diciembre es la
  misma hora que CDMX).

## Lugares

### Ceremonia religiosa · 6:00 p. m.
- Parroquia San Felipe de Jesús
- Francisco Villa #330, col. Aquiles Serdán, C.P. 88540, Reynosa, Tamps.
- Mapa: PENDIENTE. SUPUESTO: enlace de Google Maps y Waze por dirección; lo verifico
  abriéndolo antes de publicar.
- Cómo se ve: PENDIENTE (si hay foto del templo, sirve para la ilustración o el emblema).

### Recepción · 7:00 p. m.
- Salón de eventos Bellagio
- Prol. Río Purificación #300, col. Luis Donaldo Colosio, Reynosa, Tamps.
- Google Maps: https://www.google.com/maps/search/?api=1&query=26.0379125,-98.3010376
- Waze: https://waze.com/ul?ll=26.0379125,-98.3010376&navigate=yes
- Cómo se ve: PENDIENTE (salón; las fotos dirán si hay algo propio que usar).

### Itinerario
Solo los dos momentos de arriba. SUPUESTO: no se muestran horas de cena ni baile.

## Datos clave para el invitado

| Dato | Valor | Cómo se muestra |
|---|---|---|
| Vestimenta | Formal, negro | "Formal · Negro". Sin script, legible |
| Regalos | Lluvia de sobres | Frase elegante, **sin cuentas ni datos bancarios** |
| Confirmar antes de | Viernes 20 de noviembre de 2026 | Fecha completa, sin script |
| Niños | Sin restricción | No se escribe ninguna nota de niños |
| Pases | Por familia | Los asigna la novia desde el panel |

### Frase de lluvia de sobres (propuesta, la elige la pareja)
1. "Su compañía es nuestro mejor regalo. Si desean tener un detalle con nosotros, habrá
   una lluvia de sobres el día de la boda."
2. "Lo más importante para nosotros es que nos acompañen. Si además quieren
   obsequiarnos algo, con cariño recibiremos su sobre en la recepción."

## Confirmación de asistencia (RSVP)

- **Plan A:** Supabase (familias, personas, confirmaciones; RLS por pareja; login de la
  novia por código al correo), solo si está listo **y probado** antes del 4 de noviembre.
- **Plan B (respaldo):** botón "Confirmar asistencia" que abre WhatsApp con el mensaje
  "Confirmamos {n} personas de la familia {X}". PENDIENTE: número de WhatsApp que recibe
  las confirmaciones.
- Sin backend, la lista que la novia capture en el panel vive solo en su celular y el
  invitado no la ve. El plan B necesita que el enlace de cada familia lleve su nombre y sus
  pases (firmados para que no se puedan alterar). Se diseña junto con Supabase.

## Música

PENDIENTE: la canción. **Sin control de música** hasta que llegue (ni botón ni pista de
relleno). Cuando llegue: arranca al tocar el sello y la elección de silencio se recuerda.
La pareja provee el audio y nos confirma que puede usarse; no se sube música sin
derechos al repo público.

## Paleta y estilo

- Salen de las fotos (llegan en el siguiente mensaje): luz, colores, vestuario, lugar y
  ambiente. Cada color de DESIGN.md dirá de qué foto sale.
- La vestimenta en negro puede guiar la paleta, pero se justifica con las fotos. Cuidado
  con la regla de la skill: nada de "fondo negro de lujo" genérico ni dorado en todo.
- Estilo de la pareja en sus palabras: PENDIENTE.

## Historia y personalización

- PENDIENTE (opcional): cómo se conocieron, 3 a 5 momentos, una frase propia.
- Personalización mínima en 2 lugares: monograma I & A en el sello, nombre de la
  familia en el sobre, y lo que salga de las fotos o del lugar.

## Fotos

- Originales en `eventos/iris-alex/_originales/` (no se suben al repo).
- `npm run fotos -- iris-alex --og <foto>` genera las optimizadas y la imagen de WhatsApp.
- PENDIENTE: fotos que **no** quieren mostrar y cuál prefieren para la portada.

## Tono y copy

- Español de México, cálido, sin frases de plantilla.
- PENDIENTE: ¿tú o usted? SUPUESTO: **ustedes** (neutro y respetuoso para todas las edades).

## Restricciones

- No parecerse a ivan-gemima ni a eunice-edher (viven en otro repo, en
  `inv.ramosmkt.lat`). PENDIENTE: su ciudad, apertura y tipografías, para no repetir
  concepto si los invitados se cruzan.
- Sin datos de invitados en el repo.

## Preguntas para David (máximo 8)

1. ¿"Iris & Alex" solo, o también nombres completos, padres y padrinos?
2. ¿A qué número de WhatsApp llegan las confirmaciones del respaldo (novia o novio)?
3. ¿Tú o ustedes en el copy?
4. Vestimenta "negro": ¿es para todos los invitados (hombres y mujeres) o solo sugerido?
5. ¿Hay mapa o coordenadas de la parroquia, o armo el enlace por dirección y lo verifico?
6. ¿Cuál de las dos frases de lluvia de sobres, o tienen una propia?
7. ¿Alguna foto que no quieran mostrar, y cuál prefieren para la portada?
8. ¿Ciudad y concepto de apertura de ivan-gemima y eunice-edher, para no repetir?
