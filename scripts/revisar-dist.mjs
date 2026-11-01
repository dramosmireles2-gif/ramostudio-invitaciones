// Después de `vite build`: cada ruta local que aparece en las páginas de dist/
// (src, srcset, poster, href, content y data-*) tiene que existir en dist/.
// En dev todo el repo se sirve, así que un archivo que Vite no publica (por
// ejemplo, una ruta escrita en un data-*) funciona en localhost y da 404 en
// el sitio. Uso: node scripts/revisar-dist.mjs [dist]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { INVITE_BASE_URL, CLIENTES_BASE_URL } from '../src/config.js';

const dist = resolve(process.argv[2] ?? 'dist');
const propios = new Set([new URL(INVITE_BASE_URL).host, new URL(CLIENTES_BASE_URL).host]);

const paginas = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const ruta = join(dir, d.name);
  return d.isDirectory() ? paginas(ruta) : d.name.endsWith('.html') ? [ruta] : [];
});

// "/ruta" o "https://<dominio propio>/ruta" → "/ruta"; lo demás no es nuestro.
function rutaLocal(valor) {
  if (valor.startsWith('/') && !valor.startsWith('//')) return valor;
  try {
    const u = new URL(valor);
    return propios.has(u.host) ? u.pathname : null;
  } catch {
    return null;
  }
}

function existe(ruta) {
  const limpia = decodeURIComponent(ruta.split(/[?#]/)[0]);
  const archivo = join(dist, limpia);
  if (limpia.endsWith('/')) return existsSync(join(archivo, 'index.html'));
  return existsSync(archivo) && statSync(archivo).isFile();
}

const rotos = [];
for (const pagina of paginas(dist)) {
  const html = readFileSync(pagina, 'utf8');
  for (const [, atributo, valor] of html.matchAll(/\s(src|srcset|poster|href|content|data-[\w-]+)="([^"]+)"/g)) {
    const valores = atributo === 'srcset' ? valor.split(',').map((v) => v.trim().split(/\s+/)[0]) : [valor];
    for (const v of valores) {
      const ruta = rutaLocal(v);
      if (ruta && !existe(ruta)) rotos.push(`${relative(dist, pagina)}: ${atributo}="${v}"`);
    }
  }
}

if (rotos.length) {
  console.error(`Rutas que no existen en ${relative(process.cwd(), dist)}/ (darían 404 en el sitio):\n  ${rotos.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ ${relative(process.cwd(), dist)}/: todas las rutas locales de las páginas existen`);
