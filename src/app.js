import { h, render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import htm from 'htm';
import confetti from 'canvas-confetti';
import {
  TIERS,
  evaluarTodo,
  mejorTier,
  mejorResultado,
} from './quini.js';

const html = htm.bind(h);

const STORAGE_KEY = 'ganamoselquini:ticket';
const CANT = 6;
const MAX_NUM = 45;
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function cargarTicket() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data?.numbers) && data.numbers.length === CANT) {
      return data.numbers.map((n) => String(n).padStart(2, '0'));
    }
  } catch {
    /* ignore */
  }
  return null;
}

function guardarTicket(numbers) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ numbers, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

function validar(vals) {
  const numeros = [];
  for (let i = 0; i < CANT; i++) {
    const s = (vals[i] ?? '').trim();
    if (s === '') return { ok: false, error: `Faltó completar el ${i + 1}º número.` };
    const n = Number(s);
    if (!Number.isInteger(n) || n < 0 || n > MAX_NUM) {
      return { ok: false, error: `"${s}" no es válido: usá números del 00 al 45.` };
    }
    numeros.push(n);
  }
  if (new Set(numeros).size !== CANT) {
    return { ok: false, error: 'Los 6 números tienen que ser distintos.' };
  }
  return { ok: true, numeros };
}

function festejar(tier) {
  if (reduceMotion || tier < 1) return;
  if (tier === 1) {
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 }, scalar: 0.9 });
  } else if (tier === 2) {
    confetti({ particleCount: 150, spread: 85, origin: { y: 0.6 } });
  } else {
    confetti({ particleCount: 240, spread: 120, origin: { y: 0.6 } });
    const end = Date.now() + 3500;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 65, origin: { x: 0 } });
      confetti({ particleCount: 5, angle: 120, spread: 65, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }
}

function formatearFecha(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function etiquetaTier(r) {
  if (r.tier === 0) return 'Sin premio';
  if (r.mejor?.key === '__extra') return 'Pozo Extra · 6';
  return `${r.mejor?.aciertos ?? 6} aciertos`;
}

function NumeroChip({ n, jugada }) {
  const hit = jugada.includes(n);
  return html`<span class=${'chip' + (hit ? ' chip-hit' : '')}>${String(n).padStart(2, '0')}</span>`;
}

function SorteoCard({ item, jugada }) {
  const { sorteo, tier, mejor, modalidades, extra } = item;
  const nums = mejor?.numeros || [];
  return html`
    <article class=${'card ' + TIERS[tier].clase}>
      <header class="card-head">
        <div class="card-id">
          <strong>Sorteo ${sorteo.nro}</strong>
          <span class="fecha">${formatearFecha(sorteo.fecha)}</span>
        </div>
        <span class=${'badge ' + TIERS[tier].clase}>${etiquetaTier(item)}</span>
      </header>

      ${tier > 0
        ? html`<div class="nums">
            ${nums.map((n) => html`<${NumeroChip} n=${n} jugada=${jugada} />`)}
          </div>
          <p class="mejor">${mejor.label}: ${mejor.aciertos} aciertos</p>`
        : html`<p class="sin-premio">No ganaste en este sorteo</p>`}

      <div class="modalidades">
        ${modalidades.map(
          (m) => html`<span class=${'mini' + (m.paga ? ' mini-hit' : '')}>
            ${m.label} <b>${m.aciertos}</b>
          </span>`,
        )}
        ${extra.paga ? html`<span class="mini mini-hit">Pozo Extra <b>${extra.aciertos}</b></span>` : null}
      </div>
    </article>
  `;
}

function App() {
  const [values, setValues] = useState(
    () => cargarTicket() || Array(CANT).fill(''),
  );
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [jugada, setJugada] = useState(null);
  const inputs = useRef([]);

  useEffect(() => {
    fetch('./data/sorteos.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar los resultados.');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    guardarTicket(values);
  }, [values]);

  useEffect(() => {
    if (!data) return;
    const v = validar(values);
    if (v.ok) {
      setJugada(v.numeros);
      setResultados(evaluarTodo(v.numeros, data.sorteos));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function setValor(i, raw) {
    const limpio = raw.replace(/\D/g, '').slice(0, 2);
    setValues((prev) => {
      const next = prev.slice();
      next[i] = limpio;
      return next;
    });
    if (limpio.length === 2 && i < CANT - 1) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i, e) {
    if (e.key === 'Backspace' && !e.target.value && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'Enter') verificar(true);
  }

  function onBlur(i) {
    setValues((prev) => {
      const s = prev[i];
      if (!s) return prev;
      const n = Number(s);
      if (!Number.isInteger(n) || n < 0 || n > MAX_NUM) return prev;
      const next = prev.slice();
      next[i] = String(n).padStart(2, '0');
      return next;
    });
  }

  function verificar(manual = false) {
    if (!data) return;
    const v = validar(values);
    if (!v.ok) {
      setError(v.error);
      setResultados(null);
      return;
    }
    setError(null);
    guardarTicket(values.map((s) => String(Number(s)).padStart(2, '0')));
    const res = evaluarTodo(v.numeros, data.sorteos);
    setJugada(v.numeros);
    setResultados(res);
    if (manual) festejar(mejorTier(res));
  }

  function borrar() {
    setValues(Array(CANT).fill(''));
    setResultados(null);
    setJugada(null);
    setError(null);
    inputs.current[0]?.focus();
  }

  const tierGlobal = resultados ? mejorTier(resultados) : 0;
  const top = resultados ? mejorResultado(resultados) : null;

  return html`
    <main class="wrap">
      <header class="hero">
        <h1>Ganamos el <span class="quini">Quini</span></h1>
        <p class="tagline">Cargá tus 6 números y mirá si ganaste en los últimos 10 sorteos del Quini 6.</p>
      </header>

      <section class="panel">
        <div class="inputs">
          ${Array.from({ length: CANT }).map(
            (_, i) => html`<input
              ref=${(el) => (inputs.current[i] = el)}
              class="num-input"
              inputmode="numeric"
              autocomplete="off"
              maxlength="2"
              placeholder="--"
              value=${values[i]}
              onInput=${(e) => setValor(i, e.target.value)}
              onKeyDown=${(e) => onKeyDown(i, e)}
              onBlur=${() => onBlur(i)}
              aria-label=${`Número ${i + 1}`}
            />`,
          )}
        </div>

        <div class="acciones">
          <button class="btn primary" onClick=${() => verificar(true)} disabled=${cargando || !data}>
            Verificar
          </button>
          <button class="btn ghost" onClick=${borrar}>Borrar</button>
        </div>

        ${error ? html`<p class="error">${error}</p>` : null}
        ${cargando ? html`<p class="info">Cargando resultados…</p>` : null}
      </section>

      ${resultados
        ? html`
            <section class=${'veredicto ' + TIERS[tierGlobal].clase}>
              <h2>${TIERS[tierGlobal].titulo}</h2>
              ${tierGlobal > 0 && top
                ? html`<p>
                    Mejor resultado: <strong>${top.mejor.label}</strong> con
                    <strong>${top.mejor.aciertos} aciertos</strong> en el sorteo
                    <strong>${top.sorteo.nro}</strong> (${formatearFecha(top.sorteo.fecha)}).
                  </p>`
                : html`<p>No hubo premio en los últimos ${resultados.length} sorteos. ¡La próxima será!</p>`}
            </section>

            <section class="cards">
              ${resultados.map((item) => html`<${SorteoCard} item=${item} jugada=${jugada || []} />`)}
            </section>
          `
        : null}

      <footer class="footer">
        ${data
          ? html`<p class="upd">
              Resultados actualizados el ${new Date(data.updatedAt).toLocaleString('es-AR')}.
            </p>`
          : null}
        <p>
          Sitio <strong>no oficial</strong> y sin relación con la Lotería de Santa Fe.
          Los datos se ofrecen solo a modo informativo: verificá siempre con los canales oficiales.
        </p>
        <p>Jugá con responsabilidad. Solo mayores de 18 años. Línea de ayuda: 141.</p>
      </footer>
    </main>
  `;
}

render(html`<${App} />`, document.getElementById('app'));
