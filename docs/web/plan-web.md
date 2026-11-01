# Plan: página web de RamoStudio (ramostudio.com.mx)

Versión 1 · 1 de noviembre de 2026 · Para Claude Code (repo `ramostudio-invitaciones`)

> **Antes de empezar:** lee `CLAUDE.md`, este plan y `docs/web/contenido-web-fase1.md` (los textos, paquetes, FAQ, términos y aviso de privacidad). Usa la skill `direccion-arte-ramostudio` (nivel MARCA). Trabaja por fases, con commit en cada una, y **espera mi OK al terminar cada fase**.

---

## 1. Objetivo

Quien llegue desde Instagram, TikTok, un anuncio o un QR debe hacer una de dos cosas:

1. **Probar el demo** (`/demo/`).
2. **Escribir por WhatsApp** para cotizar.

Todo en la página empuja a esas dos acciones. Métricas: clics a WhatsApp, visitas al demo y el `?src=` de cada anuncio o QR.

---

## 2. Decisiones ya tomadas (no se discuten)

- **Mismo repo y mismo dominio.** La web de marca vive en la raíz de `ramostudio.com.mx` y reemplaza la página provisional. Las invitaciones siguen en `/<slug>/`, el panel en `/panel/` y el demo en `/demo/`.
- **Precios fijos, tal como están:** Esencial $800 · Completa $1,200 · Premium $1,700 MXN. Extras: express +$250, página de Gracias +$250, cambio de dato $100.
- **Aprobado:** sin límite de invitados · vigencia de 3 meses después del evento · anticipo del 50% y el resto al aprobar, antes de entregar el panel · transferencia y depósito en OXXO · el anticipo no es reembolsable una vez iniciado el diseño · "La que más recomendamos" en la Completa (NO "La más elegida") · "Hechas en Reynosa, para todo México".
- **Portafolio con 3 invitaciones**, con permiso de las parejas: Iris & Alex, Eunice & Edher e Ivan & Gemima (ver sección 6).

---

## 3. Mapa del sitio

| Ruta | Qué es | Fase | Indexa |
|---|---|---|---|
| `/` | Página principal, una sola página larga | 1 | Sí |
| `/aviso-de-privacidad/` | Aviso de privacidad | 1 | Sí |
| `/terminos/` | Términos y condiciones | 1 | Sí |
| `/demo/` | Ya existe | ✅ | Sí |
| `/bodas/` y `/xv-anos/` | Páginas para SEO local | 2 | Sí |
| `/<slug>/`, `/panel/` | Invitaciones y panel | ✅ | **No** (`noindex`) |

- Agrega a las rutas reservadas: `bodas`, `xv-anos`, `aviso-de-privacidad`, `terminos`, `portafolio`. El build falla si un slug choca.
- `sitemap.xml` y `robots.txt`: solo las páginas de marca.

---

## 4. Página principal: secciones en orden

Los textos exactos están en `docs/web/contenido-web-fase1.md`, sección 2. Aplica estas **correcciones** sobre ese documento:

| # | Sección | Notas para construir |
|---|---|---|
| 1 | **Hero** | Frase: **"Tus invitados confirman en un toque. Tú ves quién va, sin preguntar."** (NO usar "al momento" ni "tiempo real" en ninguna parte del sitio; el panel se actualiza al recargar). Subtítulo y línea de confianza del documento. Botones "Prueba el demo" (principal) y "Cotiza por WhatsApp" (secundario). Video del sobre en loop, sin sonido, menos de 1 MB, con poster. |
| 2 | **El problema** | Título y 3 dolores del documento. |
| 3 | **Cómo funciona** | 3 pasos numerados + botón WhatsApp. |
| 4 | **La invitación** | 4 capturas de celular reales (sobre, portada, confirmación, mapas), cada una con su beneficio. Botón "Prueba el demo". |
| 5 | **El panel** | 4 beneficios + botón "Pruébalo tú" → `/panel/` demo. Nota: **"Es un demo con datos de ejemplo. Lo que muevas solo se ve en tu celular."** |
| 6 | **Portafolio** | 3 tarjetas (ver sección 6). |
| 7 | **Paquetes** | 3 tarjetas en celular, tabla en escritorio. Completa destacada con "La que más recomendamos". Botón de cada tarjeta → WhatsApp con el nombre del paquete. Bajo la tabla: extras y "¿Necesitas algo distinto? Escríbenos". En Premium, aclara qué incluye "a medida": apertura, paleta, tipografía y monograma propios. |
| 8 | **Proceso y tiempos** | 3 semanas, línea de tiempo por semana, recomendación de contratar 6 a 8 semanas antes y entrega express. |
| 9 | **Testimonios** | **NO se construye todavía.** Deja el componente listo pero oculto por configuración. |
| 10 | **Preguntas frecuentes** | Acordeón accesible. La FAQ "¿Una familia puede confirmar más lugares…?" y la frase "nadie puede adivinar el de otra familia" **solo se publican si pasa la prueba de RLS entre familias** (`npm test`). Si no hay prueba, quita esa frase. |
| 11 | **CTA final** | "Cuéntanos de tu evento" + WhatsApp + link al demo. |
| — | **Footer** | Del documento. TikTok solo si hay usuario; si no, se omite. |
| — | **Botón flotante WhatsApp** | Visible en celular, respeta `env(safe-area-inset-bottom)`, no tapa CTAs. |

**Nunca** mencionar marcas de la competencia en el sitio. La tabla comparativa del documento es interna.

---

## 5. WhatsApp y medición

- Número desde `WHATSAPP_NUMBER` en `src/config.js`. No escribir el número a mano en ningún archivo.
- Mensajes precargados: los de la sección 4 del documento, con `encodeURIComponent`.
- `?src=`: se lee al entrar, se guarda en `sessionStorage`, se mantiene al navegar y se agrega al mensaje. Sin `src`, usar `web`.
- Valores sugeridos: `ig-bio`, `tiktok-bio`, `ig-ads-<campaña>`, `fb-grupos`, `qr-poster-local`, `google`.
- GA4 y Meta Pixel: **deja la integración lista pero apagada** hasta que yo te dé los IDs. Eventos: `click_whatsapp` (con paquete y src), `ver_demo`, `ver_panel_demo`. Si se activan, el aviso de privacidad debe mencionarlos.

---

## 6. Portafolio

| Invitación | Cómo aparece |
|---|---|
| **Iris & Alex** (en vivo, sistema nuevo) | Capturas + video corto + botón "Ver invitación" → **modo muestra** (`/iris-alex/?muestra=1`). |
| **Eunice & Edher** (en vivo hasta el 19 dic, repo viejo) | **Solo capturas y video, sin link.** Después del evento se agrega su versión muestra. |
| **Ivan & Gemima** (ya pasó, repo viejo) | Capturas y video, **sin link** a `inv.ramosmkt.lat` (es dominio RMKT). Más adelante se copia como versión muestra. |

**Modo muestra** (sistema nuevo): la misma invitación sin RSVP, sin mensajes ni datos de familias, con una franja discreta "Invitación de muestra · RamoStudio". `noindex`.

**Material:**
- Capturas con Playwright a 390x844, escala 3x: sobre, portada, una sección representativa y la confirmación.
- Video del sobre abriéndose de 4 a 6 s, menos de 1 MB, con poster.
- Optimizar a AVIF/WebP con respaldo JPG.
- Guardar en `portafolio/<slug>/`.

**Reglas:**
- El repo viejo `demoInvitacion` NO se modifica.
- **NO confirmar asistencia ni dejar mensajes** en ninguna invitación real.
- Si una invitación pide código de familia, usar uno de prueba que no escriba datos reales.
- Las fotos de Iris & Alex llevan crédito al fotógrafo.

---

## 7. Páginas legales

- `/terminos/`: sección 6 del documento, con las decisiones de la sección 2 de este plan ya aplicadas (sin marcas [PROPUESTA] ni [FALTA] resueltas).
- `/aviso-de-privacidad/`: sección 7 del documento. **Se publica con una nota interna** en el código (`<!-- BORRADOR: pendiente de revisión legal -->`). Los datos que falten (nombre del responsable, domicilio, correo) déjalos como `[FALTA]` visibles en una lista que me entregues; **no inventes datos**.
- Aviso corto en el RSVP de cada invitación: *"Al confirmar, tus respuestas se comparten con los anfitriones de este evento. Aviso de privacidad"* con link.

---

## 8. Diseño

- Identidad de **marca** RamoStudio (no la de un evento):
  - Crema #F4EFE9 de fondo.
  - Pizarra #3E5266 para texto y bloques.
  - Tinta #2B2A28.
  - Dorado #B79A6B solo como acento: nunca texto sobre crema.
  - Azul polvo #8CA3B0 solo en fondos.
- Tipografías: Playfair Display (títulos) y Montserrat (texto y datos), autoalojadas.
- Wordmark y sello: usa los SVG oficiales del repo. **La "s" del wordmark NO va en itálica.**
- Mobile first a 375px. Una columna en celular, layout editorial en escritorio. Espacio negativo generoso.
- Prohibido: tarjetas con sombra gris, emojis como íconos, degradados, fade-in en cada sección, íconos de stock genéricos.
- Movimiento: solo el video del hero y microinteracciones discretas. Respeta `prefers-reduced-motion`.
- Botones de 48px o más. Texto de cuerpo de 17px o más en celular. Contraste AA medido.
- Estilos de la landing **separados** de los de las invitaciones: comparten solo los tokens de marca.

---

## 9. Técnica

- La landing vive en su propia carpeta (por ejemplo `src/site/`), sin romper las rutas actuales.
- SEO:
  - Title y description por página, de la sección 5 del documento.
  - Schema `LocalBusiness` (Reynosa, Tamps.) y `FAQPage`.
  - Canonical.
  - OG image propia de 1200x630 y menos de 300 KB.
- Rendimiento en celular: LCP de 2.5 s o menos, CLS de 0.1 o menos. Imágenes AVIF/WebP con width/height y lazy-load debajo del hero.
- Pruebas (`npm test`):
  - La landing carga sin errores en consola.
  - Los botones de WhatsApp llevan el `src` correcto.
  - `/demo/`, `/panel/` y cada invitación activa siguen cargando.
  - Prueba de RLS entre familias.
  - El deploy no publica si fallan.
- Accesibilidad: un solo H1, foco visible, acordeón de FAQ con teclado y `alt` en español.

---

## 10. Fases

| Fase | Qué entregas | Me muestras |
|---|---|---|
| **A. Estructura** | Carpeta de la landing, rutas reservadas, sitemap/robots, modo muestra | Árbol de archivos y rutas que responden |
| **B. Material del portafolio** | Capturas y videos de las 3 invitaciones | Vista de las capturas |
| **C. Página principal** | Las 11 secciones con textos y diseño | Capturas a 375x812, 390x844 y 1440x900 |
| **D. Legales + WhatsApp + medición** | Términos, aviso de privacidad, `src`, eventos listos (apagados) | Lista de [FALTA] pendientes |
| **E. SEO + pruebas + deploy** | Schema, OG, pruebas en `npm test`, publicación | Resultado de `npm test` y liga publicada |

En la Fase C aplica el **ciclo de revisión con capturas** de la skill: auditoría de señales genéricas, prueba de los 2 pantallazos y máximo 3 iteraciones. Documenta en `docs/web/REVISION.md`.

---

## 11. Fuera de alcance (no hacer ahora)

- `/bodas/`, `/xv-anos/` y página de Monterrey (Fase 2).
- Sección de testimonios visible.
- Página de "Gracias" post-evento y QR por familia (son extras por construir).
- Migrar Eunice & Edher o Ivan & Gemima al repo nuevo.
- Activar GA4 o Meta Pixel sin IDs.

---

**Empieza por la Fase A y espera mi OK.**
