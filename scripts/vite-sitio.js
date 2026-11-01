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

// Datos estructurados de la página principal (schema.org), para Google:
// LocalBusiness con los datos de contacto y FAQPage armada con las mismas
// preguntas que se ven en la página (<details><summary>…</summary><p>…</p>),
// para que el texto viva en un solo lugar. Sin calle: RamoStudio atiende a
// distancia, así que se publica como negocio de área de servicio.
const sinEtiquetas = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function datosEstructurados(html, { baseUrl, telefono }) {
  const preguntas = [...html.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)]
    .map(([, q, a]) => ({ '@type': 'Question', name: sinEtiquetas(q), acceptedAnswer: { '@type': 'Answer', text: sinEtiquetas(a) } }));
  const negocio = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'RamoStudio',
    description: 'Invitaciones digitales para bodas, XV años y eventos, con confirmación por familia y panel para los anfitriones.',
    url: `${baseUrl}/`,
    image: `${baseUrl}/og-ramostudio.jpg`,
    telephone: `+${telefono}`,
    email: 'ramostudiomx@gmail.com',
    priceRange: '$800 a $1,700 MXN',
    address: { '@type': 'PostalAddress', addressLocality: 'Reynosa', addressRegion: 'Tamaulipas', addressCountry: 'MX' },
    areaServed: { '@type': 'Country', name: 'México' },
    sameAs: ['https://www.instagram.com/ramostudio.mx/'],
  };
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: preguntas };
  const script = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
  return `${script(negocio)}\n    ${script(faq)}`;
}

export function sitio({ baseUrl, telefono }) {
  const archivos = { 'sitemap.xml': ['application/xml', sitemap(baseUrl)], 'robots.txt': ['text/plain', robots(baseUrl)] };
  let clientes = false;
  return {
    name: 'ramostudio-sitio',
    configResolved(config) {
      clientes = config.mode === 'clientes';
    },
    transformIndexHtml(html, ctx) {
      if (ctx.path !== '/index.html') return html;
      return html.replace('</head>', `  ${datosEstructurados(html, { baseUrl, telefono })}\n  </head>`);
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
