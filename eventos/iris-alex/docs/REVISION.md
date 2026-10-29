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
