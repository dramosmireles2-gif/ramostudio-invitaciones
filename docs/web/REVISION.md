# REVISIÓN · Página principal (Fase C)

Ciclo de la skill `direccion-arte-ramostudio`, nivel MARCA. Capturas a 375x812, 390x844 y
1440x900 con Playwright contra el servidor local. 1 de noviembre de 2026.

## Iteración 1
- **Videos del sobre mal grabados** (hero y portafolio): `recordVideo` de Playwright graba
  a 1x y dejaba la pantalla en la esquina con el resto del cuadro en gris. Se cambió a
  screencast de Chromium a 2x (`scripts/portafolio.mjs`, función `grabar`) y se volvieron
  a grabar las 4 invitaciones. Ahora: 5 s, 540x1168, 282 a 420 KB.
- Las portadas del portafolio salían vacías en la captura: el script bajaba demasiado
  rápido para la carga diferida. En el navegador cargan bien (se verificó).

## Iteración 2
- Escritorio, "Cómo funciona": el paso 3 (título de dos líneas) desalineaba los otros dos.
  Corregido con `align-content: start`.
- Escritorio, tabla de paquetes: "Cotiza la Esencial" y "Cotiza la Premium" se partían en
  dos líneas. Columna de conceptos al 38% y botones sin salto.
- Pie: "WhatsApp814 807 8309" sin espacio. Corregido.

## Iteración 3 (final)
- Sin desborde horizontal en 375, 390 y 1440. Sin errores en consola.
- Contraste AA medido en todo el texto visible: 0 fallas.
- Botón flotante: oculto en el hero y mientras se ve otro botón de WhatsApp; visible en
  el resto, abajo a la derecha, sin tapar botones.

## Auditoría de señales genéricas: 0
| Señal | Resultado |
|---|---|
| Script en datos clave / Great Vibes, Allura, Parisienne | No hay script en la web |
| Rosa polvo + dorado genérico / degradados / glows | No |
| Dorado o azul polvo como texto sobre crema | No (solo filetes, subrayados y el sello) |
| Secciones idénticas con ícono / emojis / íconos de stock | No (✓ y — tipográficos; el único ícono es el de WhatsApp) |
| Sombras grises | No (hojas con filete de 1px) |
| Fade-in en cada sección / parallax | No (solo el video del hero y el del portafolio al tocar) |
| Clip-art | No |
| Foto de stock en evento real | No: las fotos de stock son del demo, rotulado "datos de ejemplo" |
| Frases de plantilla | No |

## Prueba de los 2 pantallazos
En el primer pantallazo de 375x812 se leen la promesa (H1), qué es (subtítulo), las dos
acciones (Prueba el demo / Cotiza por WhatsApp) y el precio de entrada. El segundo
muestra la invitación abriéndose.

## Pendientes fuera de esta fase
- Mensaje de WhatsApp por paquete y `src` (Fase D). Hoy todos los botones usan el
  enlace general.
- La pregunta "¿Una familia puede confirmar más lugares…?" espera la prueba de RLS
  (Fase E).
- ~~El panel demo dice "se actualiza sola cada vez que alguien responde"~~ Corregido en la
  Fase D: "vuelvan a abrirla para ver las respuestas nuevas" (la captura del panel en
  portafolio/panel/ se actualiza con `npm run portafolio -- panel web`).
