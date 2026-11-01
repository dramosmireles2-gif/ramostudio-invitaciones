// Plugin de Vite para la web de marca: sitemap.xml y robots.txt.
//
// El sitemap lleva solo las páginas de marca. Las invitaciones (/<slug>/) y el
// panel llevan <meta name="robots" content="noindex"> y no se listan; robots.txt
// no las bloquea porque el buscador tiene que poder leer ese noindex.
// El sitio de clientes (`--mode clientes`, si algún día va aparte) no lleva
// ninguno de los dos.

// Páginas que se indexan, en el orden del mapa del sitio (docs/web/plan-web.md).
export const PAGINAS_MARCA = ['/', '/demo/', '/terminos/', '/aviso-de-privacidad/'];

const sitemap = (base) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGINAS_MARCA.map((p) => `  <url><loc>${base}${p}</loc></url>`).join('\n')}
</urlset>
`;

const robots = (base) => `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;

export function sitio({ baseUrl }) {
  const archivos = { 'sitemap.xml': ['application/xml', sitemap(baseUrl)], 'robots.txt': ['text/plain', robots(baseUrl)] };
  let clientes = false;
  return {
    name: 'ramostudio-sitio',
    configResolved(config) {
      clientes = config.mode === 'clientes';
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const archivo = archivos[req.url.split('?')[0].slice(1)];
        if (!archivo) return next();
        res.writeHead(200, { 'Content-Type': `${archivo[0]}; charset=utf-8` });
        res.end(archivo[1]);
      });
    },
    generateBundle() {
      if (clientes) return;
      for (const [fileName, [, source]] of Object.entries(archivos)) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}
