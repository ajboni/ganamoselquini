export const MODALIDADES = [
  { key: 'tradicional', label: 'Tradicional', paga: [4, 5, 6] },
  { key: 'segunda', label: 'La Segunda', paga: [4, 5, 6] },
  { key: 'revancha', label: 'Revancha', paga: [6] },
  { key: 'siempreSale', label: 'Siempre Sale', paga: [4, 5, 6] },
];

export const TIERS = {
  0: { nivel: 0, titulo: 'Sin premio', clase: 'tier-0' },
  1: { nivel: 1, titulo: '¡Algo te llevás!', clase: 'tier-1' },
  2: { nivel: 2, titulo: '¡Gran premio!', clase: 'tier-2' },
  3: { nivel: 3, titulo: '¡GANAMOS EL QUINI!', clase: 'tier-3' },
};

export function contarAciertos(jugada, ganadores = []) {
  const set = new Set(ganadores);
  let c = 0;
  for (const n of jugada) if (set.has(n)) c++;
  return c;
}

export function tierPorAciertos(n) {
  if (n >= 6) return 3;
  if (n === 5) return 2;
  if (n === 4) return 1;
  return 0;
}

export function aciertosPorModalidad(jugada, sorteo) {
  return MODALIDADES.map((m) => {
    const aciertos = contarAciertos(jugada, sorteo[m.key] || []);
    return { key: m.key, label: m.label, aciertos, paga: m.paga.includes(aciertos) };
  });
}

export function evaluarSorteo(jugada, sorteo) {
  const modalidades = aciertosPorModalidad(jugada, sorteo);

  let mejor = null;
  for (const m of modalidades) {
    if (m.paga && (!mejor || m.aciertos > mejor.aciertos)) {
      mejor = { key: m.key, label: m.label, aciertos: m.aciertos, numeros: sorteo[m.key] };
    }
  }

  const union = [
    ...new Set([
      ...(sorteo.tradicional || []),
      ...(sorteo.segunda || []),
      ...(sorteo.revancha || []),
    ]),
  ];
  const extraAciertos = contarAciertos(jugada, union);
  const extra = { aciertos: extraAciertos, numeros: union, paga: extraAciertos >= 6 };

  let tier = mejor ? tierPorAciertos(mejor.aciertos) : 0;
  if (extra.paga) {
    tier = 3;
    mejor = { key: '__extra', label: 'Pozo Extra', aciertos: 6, numeros: union };
  }

  return { tier, mejor, modalidades, extra };
}

export function evaluarTodo(jugada, sorteos = []) {
  return sorteos
    .map((sorteo) => ({ sorteo, ...evaluarSorteo(jugada, sorteo) }))
    .sort((a, b) => b.sorteo.nro - a.sorteo.nro);
}

export function mejorTier(resultados = []) {
  return resultados.reduce((m, r) => Math.max(m, r.tier), 0);
}

export function mejorResultado(resultados = []) {
  return resultados.reduce(
    (best, r) => (r.tier > (best?.tier ?? 0) ? r : best),
    null,
  );
}
