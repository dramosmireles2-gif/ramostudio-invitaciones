// Códigos de familia: aleatorios, 6–8 caracteres, sin caracteres ambiguos
// (0/O, 1/I/L). Nunca se derivan del nombre o apellido.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function enteroAleatorio(max) {
  const buf = new Uint32Array(1);
  // Rechazo para evitar sesgo de módulo.
  const limite = Math.floor(0x100000000 / max) * max;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limite);
  return buf[0] % max;
}

export function generarCodigo(existentes = new Set()) {
  for (;;) {
    const largo = 6 + enteroAleatorio(3);
    let codigo = '';
    for (let i = 0; i < largo; i++) codigo += ALFABETO[enteroAleatorio(ALFABETO.length)];
    if (!existentes.has(codigo)) return codigo;
  }
}

export function normalizarCodigo(codigo) {
  return String(codigo ?? '').trim().toUpperCase();
}
