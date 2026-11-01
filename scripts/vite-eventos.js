// Plugin de Vite para las carpetas eventos/<slug>/.
//
// - Hay dos sitios desde este mismo repo: `vite build` publica solo el demo
//   (ramostudio.com.mx) y `vite build --mode clientes` todos los demás
//   eventos (dominio de clientes). Los datos de un evento que no es del sitio
//   ni siquiera entran al bundle. En dev (`vite`) están todos.
//
// - Cada evento tiene su página real en /<slug>/ (GitHub Pages no reescribe
//   rutas): es la misma invitacion/index.html con el título y las metas Open
//   Graph del evento, porque WhatsApp no ejecuta JS y solo lee el HTML.
// - Se publican solo fotos/ y og.jpg de cada evento, en /eventos/<slug>/.
//   docs/, _originales/ y evento.json nunca llegan a dist/ (los datos viajan
//   en el bundle, por import.meta.glob en store.local.js).
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MARCA = '<!-- metas-evento -->';
const OG_MAX_BYTES = 300 * 1024; // WhatsApp descarta vistas previas más pesadas.
// Carpetas que ya existen en dist/: un evento no puede llamarse así.
const RESERVADOS = new Set(['invitacion', 'panel', 'eventos', 'assets', 'fonts', 'demo', 'src']);

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function leerEventos(raiz) {
  const dir = join(raiz, 'eventos');
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'evento.json')))
    .map((d) => {
      const carpeta = join(dir, d.name);
      const evento = JSON.parse(readFileSync(join(carpeta, 'evento.json'), 'utf8')).eventos[0];
      if (evento.slug !== d.name) throw new Error(`eventos/${d.name}: el slug del JSON es "${evento.slug}".`);
      if (RESERVADOS.has(evento.slug)) throw new Error(`eventos/${d.name}: "${evento.slug}" es una ruta reservada.`);
      return { slug: d.name, carpeta, evento };
    });
}

// Título y texto de la vista previa: qué es, cuándo, dónde y qué hacer.
function tituloOg(e) {
  if (e.og?.titulo) return e.og.titulo;
  const frase = { boda: '¡Nos casamos!', xv: '¡Mis XV años!' }[e.tipo];
  return frase ? `${e.titulo} · ${frase}` : e.titulo;
}

function descripcion(e) {
  if (e.og?.descripcion) return e.og.descripcion;
  const cierre = 'Abran su invitación y confirmen su asistencia.';
  if (!e.fecha) return `${e.ciudad}. ${cierre}`;
  const fecha = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: e.zonaHoraria,
  }).format(new Date(e.fecha)).replace(',', ''); // "viernes 4 de…", sin coma
  return `${fecha[0].toUpperCase()}${fecha.slice(1)} · ${e.ciudad}. ${cierre}`;
}

function metas({ slug, carpeta, evento }, baseUrlEvento) {
  const baseUrl = baseUrlEvento(slug);
  const url = `${baseUrl}/${slug}/`;
  const titulo = tituloOg(evento);
  const lineas = [
    `<title>${escapar(evento.titulo)} · Invitación</title>`,
    `<meta name="ramostudio:evento" content="${escapar(slug)}" />`,
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="es_MX" />',
    `<meta property="og:title" content="${escapar(titulo)}" />`,
    `<meta property="og:description" content="${escapar(descripcion(evento))}" />`,
    `<meta property="og:url" content="${url}" />`,
  ];
  const og = join(carpeta, 'og.jpg');
  if (existsSync(og)) {
    // ?v= cambia con la imagen: WhatsApp guarda la vista previa por URL y así
    // toma la nueva en cuanto se publica.
    const v = createHash('sha1').update(readFileSync(og)).digest('hex').slice(0, 8);
    lineas.push(
      `<meta property="og:image" content="${baseUrl}/eventos/${slug}/og.jpg?v=${v}" />`,
      '<meta property="og:image:type" content="image/jpeg" />',
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      `<meta property="og:image:alt" content="${escapar(titulo)}" />`,
      '<meta name="twitter:card" content="summary_large_image" />',
    );
  }
  return lineas.join('\n    ');
}

export function eventos({ baseUrlEvento, demoSlug, clientesBaseUrl }) {
  const raiz = resolve(import.meta.dirname, '..');
  let outDir;
  let publicado = () => true;
  let clientes = false;

  return {
    name: 'ramostudio-eventos',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      clientes = config.mode === 'clientes';
      // Mientras los clientes usen el mismo dominio que el demo (dominio propio
      // pendiente), `vite build` publica todos los eventos en un solo sitio.
      const unSitio = clientesBaseUrl === baseUrlEvento(demoSlug);
      if (config.command === 'build' && !unSitio) publicado = (slug) => (slug === demoSlug) !== clientes;
    },

    // Un evento de otro sitio entra como null: store.local.js lo trata como
    // inexistente y sus datos no se publican.
    load(id) {
      const slug = id.replaceAll('\\', '/').match(/\/eventos\/([^/]+)\/evento\.json$/)?.[1];
      if (slug && !publicado(slug)) return 'null';
    },

    // Dev: /<slug>/ sirve la invitación con las metas del evento.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [ruta, query = ''] = req.url.split('?');
        const m = ruta.match(/^\/([a-z0-9-]+)(\/?)$/);
        if (!m || !leerEventos(raiz).some((e) => e.slug === m[1] && publicado(e.slug))) return next();
        if (!m[2]) {
          res.writeHead(301, { Location: `/${m[1]}/${query ? `?${query}` : ''}` });
          return res.end();
        }
        req.url = `/invitacion/index.html${query ? `?${query}` : ''}`;
        next();
      });
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const slug = ctx.originalUrl?.match(/^\/([a-z0-9-]+)\//)?.[1];
        const ev = slug && leerEventos(raiz).find((e) => e.slug === slug);
        return ev ? html.replace(/\s*<title>.*?<\/title>/, '').replace(MARCA, metas(ev, baseUrlEvento)) : html;
      },
    },

    // Build: una página por evento y sus imágenes públicas.
    writeBundle() {
      const plantilla = readFileSync(join(outDir, 'invitacion', 'index.html'), 'utf8');
      // Cada sitio con su dominio (public/CNAME trae el del demo).
      if (clientes) writeFileSync(join(outDir, 'CNAME'), `${new URL(clientesBaseUrl).host}
`);
      for (const ev of leerEventos(raiz).filter((e) => publicado(e.slug))) {
        mkdirSync(join(outDir, ev.slug), { recursive: true });
        const pagina = plantilla.replace(/\s*<title>.*?<\/title>/, '').replace(MARCA, metas(ev, baseUrlEvento));
        writeFileSync(join(outDir, ev.slug, 'index.html'), pagina);

        const destino = join(outDir, 'eventos', ev.slug);
        const og = join(ev.carpeta, 'og.jpg');
        if (existsSync(og)) {
          if (statSync(og).size > OG_MAX_BYTES) this.warn(`eventos/${ev.slug}/og.jpg pesa más de 300 KB: WhatsApp no la mostrará.`);
          mkdirSync(destino, { recursive: true });
          cpSync(og, join(destino, 'og.jpg'));
        }
        const fotos = join(ev.carpeta, 'fotos');
        if (existsSync(fotos) && readdirSync(fotos).some((f) => !f.startsWith('.'))) {
          cpSync(fotos, join(destino, 'fotos'), { recursive: true, filter: (f) => !/[\\/]\.[^\\/]+$/.test(f) });
        }
      }
    },
  };
}
