// Genera un archivo .xlsx real sin librerías: el .xlsx es un ZIP con unos
// cuantos XML. Los archivos van sin comprimir (método "store"), que Excel,
// Numbers y Google Sheets abren sin problema.
//
// Cada hoja: { nombre, filas, encabezado = true, negritas = [] }.
//  - Con encabezado, filas[0] va en negritas, fija al bajar y con filtros.
//  - Una celda puede ser texto, número o { texto, enlace } (enlace clicable).
//  - negritas: índices de otras filas en negritas (por ejemplo, títulos de grupo).
// El ancho de cada columna sale de su contenido; los enlaces no se cortan.

const esc = (v) => String(v ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
  // Caracteres de control que el XML no admite.
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';
const ESTILO = { normal: 0, negrita: 1, enlace: 2 };

// "A", "B", …, "Z", "AA", …
function columna(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

const esObjeto = (v) => v !== null && typeof v === 'object';
const textoDe = (v) => (esObjeto(v) ? v.texto : v);
const columnas = (filas) => Math.max(1, ...filas.map((f) => f.length));
const ultimaCelda = (filas) => `${columna(columnas(filas) - 1)}${filas.length}`;
const conFiltros = (h) => h.encabezado !== false && h.filas.length > 1;

// Ancho en caracteres: lo más largo de la columna, entre 8 y 60; si la
// columna tiene enlaces, lo que mida el enlace más largo (sin tope). Las filas
// de una sola celda (títulos) no cuentan: su texto se desborda a la derecha.
function anchos(filas) {
  const medibles = filas.filter((f) => f.length > 1);
  return Array.from({ length: columnas(filas) }, (_, c) => {
    let largo = 0;
    let conEnlace = false;
    for (const f of medibles.length ? medibles : filas) {
      largo = Math.max(largo, String(textoDe(f[c]) ?? '').length);
      if (esObjeto(f[c]) && f[c].enlace) conEnlace = true;
    }
    const w = largo + 3; // Aire para la flecha del filtro.
    return conEnlace ? Math.max(w, 12) : Math.min(Math.max(w, 8), 60);
  });
}

function celda(ref, v, fuerte, enlaces) {
  if (v == null || v === '') return '';
  if (esObjeto(v)) {
    if (v.enlace) enlaces.push({ ref, url: v.enlace });
    const s = v.enlace ? ESTILO.enlace : fuerte ? ESTILO.negrita : ESTILO.normal;
    return `<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${esc(v.texto)}</t></is></c>`;
  }
  const s = fuerte ? ` s="${ESTILO.negrita}"` : '';
  if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
}

function hojaXml(hoja) {
  const { filas, negritas = [] } = hoja;
  const encabezado = hoja.encabezado !== false;
  const resaltadas = new Set(negritas);
  const enlaces = [];
  const cuerpo = filas.map((fila, r) => `<row r="${r + 1}">${fila.map((v, c) =>
    celda(`${columna(c)}${r + 1}`, v, (encabezado && r === 0) || resaltadas.has(r), enlaces)).join('')}</row>`).join('');

  const vista = conFiltros(hoja)
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
  const cols = `<cols>${anchos(filas).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`;
  const filtro = conFiltros(hoja) ? `<autoFilter ref="A1:${ultimaCelda(filas)}"/>` : '';
  const ligas = enlaces.length
    ? `<hyperlinks>${enlaces.map((e, i) => `<hyperlink ref="${e.ref}" r:id="rId${i + 1}"/>`).join('')}</hyperlinks>`
    : '';
  const xml = `${XML}<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">`
    + `${vista}${cols}<sheetData>${cuerpo}</sheetData>${filtro}${ligas}</worksheet>`;
  const rels = enlaces.length
    ? `${XML}<Relationships xmlns="${NS_PKG}">${enlaces.map((e, i) =>
      `<Relationship Id="rId${i + 1}" Type="${NS_REL}/hyperlink" Target="${esc(e.url)}" TargetMode="External"/>`).join('')}</Relationships>`
    : null;
  return { xml, rels };
}

// Nombres de hoja: sin [ ] : * ? / \ y de 31 caracteres como máximo.
const nombreHoja = (n) => String(n).replace(/[[\]:*?/\\]/g, ' ').slice(0, 31);

function archivos(hojas) {
  const nombres = hojas.map((h) => nombreHoja(h.nombre));
  // Excel pide un nombre _FilterDatabase por cada hoja con filtros.
  const filtros = hojas.map((h, i) => (conFiltros(h)
    ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${esc(nombres[i].replaceAll("'", "''"))}'!$A$1:$${columna(columnas(h.filas) - 1)}$${h.filas.length}</definedName>`
    : '')).join('');

  const salida = {
    '[Content_Types].xml': `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
      + '</Types>',
    '_rels/.rels': `${XML}<Relationships xmlns="${NS_PKG}">`
      + `<Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `${XML}<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}"><sheets>`
      + nombres.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
      + `</sheets>${filtros ? `<definedNames>${filtros}</definedNames>` : ''}</workbook>`,
    'xl/_rels/workbook.xml.rels': `${XML}<Relationships xmlns="${NS_PKG}">`
      + hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS_REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
      + `<Relationship Id="rId${hojas.length + 1}" Type="${NS_REL}/styles" Target="styles.xml"/></Relationships>`,
    // Estilos: 0 normal, 1 negritas, 2 enlace (azul y subrayado).
    'xl/styles.xml': `${XML}<styleSheet xmlns="${NS_MAIN}">`
      + '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font>'
      + '<font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts>'
      + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
      + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
      + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
      + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
      + '</styleSheet>',
  };
  hojas.forEach((h, i) => {
    const { xml, rels } = hojaXml(h);
    salida[`xl/worksheets/sheet${i + 1}.xml`] = xml;
    if (rels) salida[`xl/worksheets/_rels/sheet${i + 1}.xml.rels`] = rels;
  });
  return salida;
}

// --- ZIP sin compresión ----------------------------------------------------------

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (const b of bytes) c = TABLA_CRC[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function zip(entradas) {
  const cod = new TextEncoder();
  const partes = [];
  const central = [];
  let offset = 0;
  for (const [nombre, contenido] of Object.entries(entradas)) {
    const n = cod.encode(nombre);
    const datos = cod.encode(contenido);
    const crc = crc32(datos);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034B50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // Nombres en UTF-8.
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, n.length, true);
    partes.push(new Uint8Array(local.buffer), n, datos);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014B50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, datos.length, true);
    cen.setUint32(24, datos.length, true);
    cen.setUint16(28, n.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), n);
    offset += 30 + n.length + datos.length;
  }
  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054B50, true);
  fin.setUint16(8, central.length / 2, true);
  fin.setUint16(10, central.length / 2, true);
  fin.setUint32(12, tamCentral, true);
  fin.setUint32(16, offset, true);
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function crearXlsx({ hojas }) {
  return zip(archivos(hojas));
}

export function descargar(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nombreArchivo });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
