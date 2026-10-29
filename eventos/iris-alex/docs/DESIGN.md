# DESIGN · Iris & Alex

Estado: **Aprobado el concepto B** (David, 28 de octubre de 2026). Construido; ver REVISION.md.

## Lo que dicen las fotos (8 fotos de la sesión, Dreams Studio by May Torres)

- **Ambiente:** campo abierto del norte, con mezquites, pasto seco y tierra. Es una
  sesión vaquera de verdad: elegante, sin disfraz.
- **Luz:** dos registros. (a) La hora dorada: el sol baja detrás de un mezquite y todo se
  vuelve ámbar (`90aa4452`, `132cd327`, `605c58bf`). (b) Blanco y negro de alto contraste,
  con sombras largas de ramas sobre el pasto (`91fddf9d`, `3fcc7317`, `99690caf`).
- **Vestuario idéntico en los dos:** sombrero de fieltro **negro**, camisa **blanca**,
  mezclilla **índigo** oscura y botas **negras**. Ella lleva bolsas bordadas con pespunte
  blanco y hebilla de plata grabada; él, una pluma roja, naranja y amarilla en la toquilla.
- **Acentos rojos reales:** el labial de ella, la orilla roja de su cinto y la pluma de él.
  Además, ellos mismos le pusieron un corazón rojo a una foto en blanco y negro (`99690caf`).
- **Gestos:** se toman de la mano en casi todas las fotos, se abrazan y él se quita el
  sombrero. Es una pareja tierna y sobria.
- **El negro del dress code no es un capricho:** es el color de sus sombreros y sus botas.
  Por eso el negro puede llevar la paleta sin caer en "fondo negro de lujo".

### Colores medidos en las fotos (promedio de una zona de cada imagen)

| Elemento | Foto | Hex medido |
|---|---|---|
| Cielo del atardecer | 90aa4452 | #FEFCF0 |
| Sol tras el mezquite | 90aa4452 | #FBD494 |
| Sombrero de fieltro | 90aa4452 / 132cd327 | #2A2B32 / #1C2724 |
| Mezclilla de ella | 90aa4452 | #0F1E35 |
| Hojas de mezquite | 90aa4452 | #595C23 |
| Pasto seco | 90aa4452 | #B5885E |
| Orilla roja del cinto | 85c8516c | #9C0304 |
| Labial | 132cd327 | #610710 |
| Hebilla de plata | a404874c | #787D7E |

## ⚠️ Antes de usar las fotos

1. **6 de las 8 fotos tienen la marca de agua "Dreams Studio by May Torres".** Hay que
   pedir a la fotógrafa los archivos sin marca y su permiso para usarlas; propongo darle
   crédito discreto al pie ("Fotos: Dreams Studio by May Torres").
2. **Sin marca de agua ya tenemos 3:** `90aa4452` (atardecer, de la mano), `91fddf9d`
   (vista aérea en blanco y negro) y `605c58bf` (abrazo visto desde arriba). Con esas 3
   alcanza para portada, imagen de WhatsApp y una sección.
3. `99690caf` trae el corazón de emoji encima: no se usa como foto, pero inspira el
   concepto B.
4. Las fotos pesan poco (1024 a 1194 px de ancho, de 150 a 420 KB). Parecen versiones para
   redes. Si hay originales más grandes, mejor.

---

## Concepto A · "Atardecer en el mezquite"

**En una frase:** papel color cielo de atardecer, tinta del fieltro de sus sombreros y la
luz dorada que entra entre las ramas del mezquite.

### Paleta
| Token | Hex | Rol | Sale de |
|---|---|---|---|
| `cielo` | #FBF8EE | Fondo (dominante) | Cielo del atardecer, 90aa4452 (#FEFCF0) |
| `fieltro` | #24252B | Texto y sello | Sombrero, 90aa4452 / 132cd327 |
| `mezquite` | #5B5E2C | Texto secundario y etiquetas | Hojas de mezquite, 90aa4452 (#595C23) |
| `pastizal` | #8A5A2B | Botón "Confirmar asistencia" y enlaces | Pasto seco a contraluz, 90aa4452 (#B5885E), oscurecido para contraste |
| `sol` | #C99A4E | **Solo** filetes, liner y marco del sello (nunca texto sobre `cielo`) | Sol tras el mezquite, 90aa4452 (#FBD494) |

Contraste medido sobre `cielo`: fieltro 14.4:1 · mezquite 6.4:1 · pastizal 5.5:1 ·
sol 2.4:1 (por eso `sol` no lleva texto). Texto `cielo` sobre `fieltro`: 14.4:1.

### Tipografía (OFL, autoalojadas)
- **Títulos y nombres:** Cormorant Garamond (600 y 600 itálica). Es más cálida y
  caligráfica que Playfair, que ya usa el demo.
- **Script (solo en "Iris & Alex" del sobre):** Pinyon Script.
- **Datos:** Montserrat (ya está en el repo), en versalitas espaciadas de 17 px o más.

### Apertura
Sobre color `cielo` con borde de **pespunte** (línea punteada como la costura de sus bolsas
de mezclilla). Encima, el nombre de la familia en Cormorant. Sello de lacre `fieltro` con
el monograma **I·A** dentro de un marco grabado como su hebilla. Al tocar el sello, la solapa
se abre y deja ver el **liner: siluetas de ramas de mezquite** en `sol` sobre `fieltro`.
La tarjeta sube y se ve la foto `90aa4452` a contraluz. Dura 2.5 s, solo con transform y
opacity, y con versión sin animación para quien tenga activado reducir movimiento.

### Cómo se ve el resto
- **Portada:** la foto del atardecer a sangre arriba y, debajo, "Iris & Alex" en Cormorant
  grande con la fecha **viernes 4 de diciembre de 2026** en Montserrat.
- **Separadores:** banda delgada `fieltro` como la toquilla del sombrero, con un pespunte `sol`.
- **Vestimenta:** "Formal · Negro" con un sombrero dibujado a línea en SVG (no un icono de stock).
- **Personalización:** el monograma de la hebilla, el liner de mezquite, el nombre de la
  familia en el sobre y las fotos reales.

**Riesgo:** sin cuidado, se puede leer como "rústico" genérico. Se evita con el pespunte
y la tipografía editorial, y sin madera, yute ni encaje.

---

## Concepto B · "Blanco y negro, con un punto rojo"

**En una frase:** la camisa blanca y el fieltro negro de su sesión en blanco y negro, con
un solo acento rojo, el mismo que ellos le pusieron a su foto.

### Paleta
| Token | Hex | Rol | Sale de |
|---|---|---|---|
| `camisa` | #F5F4F0 | Fondo (dominante) | Camisas blancas en luz, 3fcc7317 / a404874c |
| `fieltro` | #1A1A1C | Texto y bandas negras (sobre, toquilla, pie) | Sombreros y botas; dress code negro |
| `plata` | #5E6466 | Texto secundario | Hebilla grabada, a404874c (#787D7E), oscurecida para contraste |
| `pluma` | #9C1C1C | **Único acento**: sello de lacre, botón "Confirmar asistencia" y un filete | Cinto rojo 85c8516c (#9C0304) y el corazón de 99690caf |
| `hebilla` | #B9BEC0 | Filetes y texto claro sobre `fieltro` | Plata de la hebilla en luz |

Contraste medido: fieltro sobre camisa 15.8:1 · pluma sobre camisa 7.4:1 · plata sobre
camisa 5.5:1 · hebilla sobre fieltro 9.3:1 · camisa sobre fieltro 15.8:1.

### Tipografía (OFL, autoalojadas)
- **Títulos y nombres:** Bodoni Moda (alto contraste, como sus fotos en blanco y negro).
- **Script:** ninguno. Los nombres van en Bodoni Moda itálica grande. Es la diferencia
  más clara frente al demo y a las plantillas.
- **Datos:** Montserrat en versalitas espaciadas.

### Apertura
Sobre **negro fieltro** (el único bloque negro grande, y se justifica porque es el sombrero)
con el borde en pespunte `hebilla`. El nombre de la familia va en Bodoni `camisa`. Al
centro, **el sello de lacre rojo `pluma`** con I·A: es el corazón rojo de su foto
convertido en lacre. Al tocarlo, el sobre negro se abre como el ala de un sombrero
(solapa curva) y aparece la tarjeta `camisa` con la foto aérea `91fddf9d` en blanco y
negro. Dura 2.5 s, solo con transform y opacity, y con versión sin animación.

### Cómo se ve el resto
- **Fotos:** todas en blanco y negro (las de color se convierten), para que el rojo sea lo
  único con color.
- **Fondo:** `camisa`. Lo negro aparece solo en el sobre, en las bandas de toquilla entre
  secciones y en el pie.
- **El rojo aparece 3 veces en total:** el sello, el botón de confirmar y el filete bajo
  la fecha.
- **Personalización:** el sello rojo (su corazón), los bordados de sus bolsas redibujados
  en SVG como esquineros y el nombre de la familia en el sobre.

**Riesgo:** blanco y negro con rojo puede verse duro. Se suaviza con fondo `camisa` (no
blanco puro), mucho aire y Bodoni en pesos medios.

---

## Comparación rápida

| | A · Atardecer en el mezquite | B · Blanco y negro, con un punto rojo |
|---|---|---|
| Se siente | Cálido, campestre y luminoso | Editorial, elegante y contundente |
| Fotos | A color (hora dorada) | En blanco y negro |
| Negro | Tinta y sello | Sobre y bandas; une el dress code |
| Acento | Dorado del sol (solo ornamento) | Rojo de la pluma y del corazón |
| Script | Pinyon Script, solo en el sobre | Ninguno |
| Mi recomendación | | ✔ Es más suyo: sale de su propio gesto (el corazón rojo) y del dress code |

## Movimiento y herramientas

- Las dos aperturas se hacen con **CSS + SVG**. No hace falta HyperFrames ni Runway: no
  hay video y eso hace que cargue rápido en WhatsApp. **Costo en créditos de Runway: 0.**
- Fuentes nuevas que hay que autoalojar en `public/fonts/` (OFL, desde el repositorio de
  Google Fonts): Cormorant Garamond y Pinyon Script (A) o Bodoni Moda (B).

## Registro

- Demo en Reynosa: Playfair Display con Great Vibes y sello "M·D". Ninguno de los dos
  conceptos repite esa combinación.
- PENDIENTE: comparar con ivan-gemima y eunice-edher (otro repo).

Aprobado por: David · Concepto: B · Fecha: 28 de octubre de 2026
