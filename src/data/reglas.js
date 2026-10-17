// Reglas de las mesas que comparten el store y las pantallas (se exportan desde
// index.js). Son funciones puras: no leen ni guardan nada.
//
// Cada familia tiene personas: [{ id, nombre, mesaId }], una por pase. La mesa
// es de cada persona, así una familia puede quedar repartida en varias mesas.

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Estado de RSVP de una persona: 'confirmado', 'pendiente' o 'no'.
// Si la familia confirmó menos pases de los asignados, asisten las primeras
// personas de su lista y el resto queda como 'no'.
export function estadoPersona(familia, indice) {
  const { estado, pasesConfirmados } = familia.rsvp;
  if (estado === 'confirmado') return indice < pasesConfirmados ? 'confirmado' : 'no';
  if (estado === 'no_asiste') return 'no';
  return 'pendiente';
}

// Las personas de una familia con su estado y si ocupan lugar (quien no
// asiste no ocupa lugar aunque siga sentada).
export function personasDe(familia) {
  return (familia.personas ?? []).map((p, i) => {
    const estado = estadoPersona(familia, i);
    return { ...p, familiaId: familia.id, familia: familia.nombre, estado, ocupa: estado !== 'no' };
  });
}

// Lugares que ocupa una familia (o solo los de una mesa si se da mesaId).
export function lugaresOcupados(familia, mesaId) {
  return personasDe(familia).filter((p) => p.ocupa && (mesaId === undefined || p.mesaId === mesaId)).length;
}

// [{ mesaId, n }] de una familia, de la mesa con más personas a la de menos.
// mesaId null = personas sin mesa (que sí asisten o siguen pendientes).
export function mesasDeFamilia(familia) {
  const cuenta = new Map();
  for (const p of personasDe(familia)) {
    if (!p.ocupa && !p.mesaId) continue;
    cuenta.set(p.mesaId ?? null, (cuenta.get(p.mesaId ?? null) ?? 0) + 1);
  }
  return [...cuenta].map(([mesaId, n]) => ({ mesaId, n })).sort((a, b) => b.n - a.n);
}

// Texto de capacidad de una mesa, el mismo en la lista, el plano y la hoja.
// estado: 'exceso' (alerta roja), 'libre' (neutro) o 'completa' (verde discreto).
// corto: versión breve para el centro de la mesa en el plano.
export function textoCapacidad(ocupados, capacidad, { corto = false } = {}) {
  const dif = ocupados - capacidad;
  if (dif > 0) {
    return {
      estado: 'exceso',
      texto: corto ? `${dif} de más` : `${plural(dif, 'persona', 'personas')} de más · ${dif === 1 ? 'falta 1 lugar' : `faltan ${dif} lugares`}`,
    };
  }
  if (dif < 0) {
    const n = -dif;
    return {
      estado: 'libre',
      texto: corto ? plural(n, 'libre', 'libres') : `${n === 1 ? 'Queda 1 lugar libre' : `Quedan ${n} lugares libres`}`,
    };
  }
  return { estado: 'completa', texto: corto ? 'Completa' : 'Mesa completa' };
}
