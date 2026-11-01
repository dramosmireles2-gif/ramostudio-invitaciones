# DESIGN · Página principal de RamoStudio

## Concepto
**"El pliego de muestras del estudio."** La página es como la hoja que una imprenta
fina le enseña a sus clientes: papel crema, filetes finos, numeración editorial y las
invitaciones puestas encima como piezas reales. El celular es el papel nuevo; la marca
no compite con las invitaciones, las enmarca.

## Color (solo tokens de marca, `--rs-*`)
| Token | Hex | Rol |
|---|---|---|
| Crema | #F4EFE9 | Fondo de la página |
| Crema papel | #FAF7F2 | Hojas (tarjetas de paquete, preguntas), con filete de 1px, sin sombra |
| Pizarra | #3E5266 | Texto de cuerpo, botón principal, bandas (Completa, CTA final) |
| Tinta | #2B2A28 | Títulos |
| Dorado | #B79A6B | Solo filetes, sello y numerales grandes sobre pizarra. Nunca texto sobre crema |
| Velo polvo | #DCE3E6 | Fondo de la sección del panel |

Contraste: pizarra sobre crema 7.1:1, tinta 12.5:1, crema sobre pizarra 7.1:1. Se mide
en las pruebas.

## Tipografía
- **Playfair Display** para títulos: H1 40px en celular, 64px en escritorio; H2 30/44px.
  Itálica solo en una palabra de acento por título, nunca en el wordmark.
- **Montserrat** para todo lo demás: cuerpo 17px (18px en escritorio), etiquetas 13px en
  mayúsculas con espaciado .18em, precios 600.
- Sin script en la web de marca.

## Composición
- Celular primero a 375px, una columna, márgenes de 24px. Escritorio (≥900px): rejilla
  editorial de 12 columnas, texto a la izquierda y piezas a la derecha, alternando.
- Cada sección abre con su **numeral y etiqueta** ("02 · Cómo funciona") sobre un filete
  dorado corto. Ritmo vertical amplio (96px entre secciones en celular, 144px en
  escritorio).
- **Marco de celular** propio y sobrio: rectángulo redondeado (radio 36px), borde pizarra
  de 8px, sin muesca dibujada ni sombra. Lo usan el hero, la invitación, el panel y el
  portafolio: es el hilo de toda la página.
- Sello "rs" oficial como remate (CTA final y pie). Wordmark oficial arriba.

## Secciones
1. **Hero.** Celular: wordmark, H1, subtítulo, dos botones (pizarra lleno / contorno),
   línea de confianza "Desde $800 MXN · Lista en 3 a 5 días · Para bodas, XV años y más",
   y debajo el celular con el **video del sobre** (demo, en loop, sin sonido, poster).
   Escritorio: texto 7 columnas, celular 5.
2. **El problema.** El título grande como cita ("¿Cuántos van? Nadie sabe."), el párrafo y
   los 3 dolores como lista numerada con filetes entre ellos. Nada de tarjetas con ícono.
3. **Cómo funciona.** 3 pasos con numerales Playfair grandes en pizarra, unidos por un
   filete dorado vertical (horizontal en escritorio). Botón WhatsApp.
4. **La invitación.** 4 celulares (sobre, portada, confirmación, mapas) en una fila con
   desplazamiento horizontal y "snap" en celular; en escritorio, los 4 en línea. Bajo cada
   uno, su beneficio. Botón "Prueba el demo".
5. **El panel.** Banda velo polvo. 2 celulares del panel demo (resumen y familias) y los 4
   beneficios como lista con filete. Botón "Pruébalo tú" y la nota del plan.
6. **Portafolio.** "Invitaciones reales": 3 piezas (celular con la portada, nombre, tipo y
   ciudad). Cada una con "Ver cómo se abre" (reproduce su video en el mismo marco, solo al
   tocar). Iris & Alex con "Ver invitación" → modo muestra y su crédito de fotos.
7. **Paquetes.** Celular: 3 hojas apiladas, la Completa como banda pizarra con la etiqueta
   "La que más recomendamos" en crema. Escritorio: tabla con la columna Completa en pizarra.
   ✓ y — tipográficos (no íconos). Extras y "¿Necesitas algo distinto?" debajo. En Premium
   se explica "a medida": apertura, paleta, tipografía y monograma propios.
8. **Proceso y tiempos.** Línea de 3 a 5 días como regla con marcas (Día 1, Días 2 y 3, Días 4 y 5) y la
   recomendación de 6 a 8 semanas; "¿Vas tarde?" con express.
9. **Testimonios.** Componente listo, apagado (`TESTIMONIOS_VISIBLES = false`).
10. **Preguntas frecuentes.** `<details>` nativos (teclado y lector de pantalla sin JS),
    hojas con filete, "+" que gira a "–".
11. **CTA final.** Banda pizarra con el sello, "Cuéntanos de tu evento", botón crema y
    "¿Todavía no te decides? Prueba el demo".
- **Pie:** wordmark, ciudad, WhatsApp (formateado desde `WHATSAPP_NUMBER`), Instagram,
  legales, © 2026. Sin TikTok.
- **Botón flotante "Cotiza"** (solo celular): píldora pizarra abajo a la derecha, con
  `safe-area-inset-bottom`; se esconde mientras se ve un botón de WhatsApp de la página
  para no taparlo.

## Movimiento
- Solo el video del hero (y el del portafolio, al tocar). Microinteracciones: botón que
  se hunde 1px al presionar, "+" de las preguntas. Sin fade-in por sección, sin parallax.
- `prefers-reduced-motion`: el video del hero no se reproduce solo; queda el poster.

## Material
- Demo Mariana & Diego: video del sobre (hero) y 4 capturas → `npm run portafolio`.
- Panel demo: 2 capturas (resumen y familias) → mismo script.
- Portafolio: lo de la Fase B.
- Todo en AVIF/WebP con respaldo JPG, `width`/`height`, `loading="lazy"` bajo el hero.

Aprobado por: David · Fecha: 1 de noviembre de 2026
