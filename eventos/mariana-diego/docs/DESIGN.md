# DESIGN · Mariana & Diego (demo)

Estado: **propuesta en revisión** (31 de octubre de 2026). Pedido de David: que el demo se vea
como una invitación real terminada, con la misma estructura que Iris & Alex, más la lluvia de
sobres, abierta para una familia (Familia Ramos).

## Datos y fotos

- **Todo es ficticio.** Mariana & Diego, Capilla del Rosario y Jardín Las Magnolias no existen;
  el mapa apunta a un lugar público (Plaza Principal Miguel Hidalgo de Reynosa).
- **Fotos de muestra (TODO-FOTO-REAL):** una sola sesión de Jakob Owens en Unsplash (Licencia de
  Unsplash, uso libre), para que toda la invitación sea de la misma pareja. Crédito al pie:
  «Fotos: Jakob Owens en Unsplash (fotos de muestra)». Las de Iris & Alex no se usan: son de
  clientes reales.

| Archivo | Foto en Unsplash | Uso |
|---|---|---|
| `caminando` | photo-1606216794074 (SiniLJkXhMc) | Portada y og.jpg |
| `atardecer` | photo-1606216836549 (BMNTl3Svxbo) | Foto intermedia |
| `velo` | photo-1606216794079 (mLIurLmSRAY) | Galería |
| `luz` | photo-1606216794050 (lSp8R968ozE) | Galería |
| `abrazo` | photo-1606216836537 (jbaF5N0uO0k) | Galería |
| `novio` | photo-1606216769783 | Galería |

Originales en `_originales/` (no se suben). En `fotos/` van 640 y 1280 px (AVIF, WebP, JPG).

## Concepto

**«Atardecer entre palmeras»:** papel marfil, tinta olivo de las palmeras en sombra y el trigo de
la luz dorada. Distinto de Iris & Alex (negro cálido y Bodoni) para no repetir en Reynosa.

### Colores medidos en las fotos

| Elemento | Foto | Hex medido |
|---|---|---|
| Palmera en sombra | caminando | #22241C |
| Pasto en sombra | abrazo | #303621 |
| Cielo del atardecer | atardecer | #D2D0C3 |
| Velo con luz | velo | #A68D77 |
| Vestido | caminando | #8E7F75 |

### Paleta

| Token | Hex | Rol | Contraste sobre el fondo |
|---|---|---|---|
| `bg` marfil | #F4EFE4 | Fondo | — |
| `text` olivo noche | #22261D | Texto | 13.4:1 |
| `text2` olivo | #4E5443 | Texto secundario y etiquetas | 6.9:1 |
| `action` / `band` olivo hondo | #2F3521 | Botón, franja de vestimenta, sello | marfil encima 11.1:1 |
| `accent` trigo | #A9824F | Filetes, pespuntes, motas | 3.1:1, **nunca texto** |
| `onSeal` | #E9D9B8 | Monograma del sello | 9.1:1 |

### Tipografía

Playfair Display (títulos y nombres en itálica, sin script) y Montserrat (datos). Sin Great Vibes.

## Estructura (la de Iris & Alex)

`portada` (hoja sobre la foto) · `cuenta` · `frase` (cita) · `evento` · `calendario` ·
`vestimenta` · `foto` · `rsvp` · **`regalos`** (lluvia de sobres con su frase, más Liverpool,
Amazon y la transferencia de ejemplo) · `mensajes` · `galeria` · `pie`.

- Sin `cancion`: el demo no tiene canción (no se sube música sin derechos).
- Sin el sombrero de la vestimenta: era personal de Iris & Alex.
- Fondo con sombras de ramas y motas doradas, como en Iris & Alex.

## Familia del recorrido

`?f=demo` abre la invitación para **Familia Ramos** (`fam_demo`, 2 pases, sin responder), así
quien ve el demo puede confirmar y luego verlo en el panel. La Familia Ramos que ya estaba en el
seed (3 pases, confirmada) pasó a llamarse Familia Rangel.

Aprobado por: ___ Fecha: ___
