// latiguillo.js — «Haz el latiguillo y pásale el tester» (Redes locales, Tema 2).
import { h } from '../util.js';
import { HILOS, TAREAS, juzgar, DIAGNOSTICOS, crearLecturas } from '../practica/Latiguillo.js';

const semillaNueva = () => 1000 + Math.floor(Math.random() * 9000);
const hilo = id => h('span.lt-hilo', { 'data-hilo': id, title: HILOS[id] });
// Las luces del tester: una fila por pin del extremo 1.
const tester = luces => h('div.lt-tester', { role: 'img', 'aria-label': 'Tester: ' + luces.map((l, i) => `${i + 1} con ${l.join(' y ') || 'ninguno'}`).join(', ') },
  luces.map((l, i) => h('div.lt-fila' + (l.length === 1 && l[0] === i + 1 ? '' : '.mal'), h('span.lt-led.on', String(i + 1)), h('span.lt-cable'),
    Array.from({ length: 8 }, (_, j) => h('span.lt-led' + (l.includes(j + 1) ? '.on' : ''), String(j + 1))))));

function parteHacer() {
  let tarea, extremos, activo;
  const enunciado = h('p.lt-tarea'), zona = h('div'), resultado = h('div');
  const probar = h('button.btn', { type: 'button', disabled: true }, 'Crimpar y pasar el tester');
  function pintar() {
    const lleno = extremos.every(e => e.every(Boolean));
    probar.disabled = !lleno;
    const usados = extremos[activo];
    zona.replaceChildren(
      h('div.lt-extremos', extremos.map((e, k) => h('div.lt-extremo' + (k === activo ? '.activo' : ''), { onclick: () => { activo = k; pintar(); } },
        h('p', h('strong', `Extremo ${k + 1}`), k === activo ? ' · colocando aquí' : ''),
        h('div.lt-conector', e.map((id, i) => h('button.lt-pin', { type: 'button', 'aria-label': `Pin ${i + 1}: ${id ? HILOS[id] : 'vacío'}`, onclick: ev => { ev.stopPropagation(); activo = k; e[i] = null; resultado.replaceChildren(); pintar(); } }, id ? hilo(id) : h('span.lt-vacio'), h('span.lt-num', String(i + 1))))),
        h('small', 'Pestaña hacia abajo y el cable hacia ti: el pin 1 es el de la izquierda.')))),
      h('p', 'Hilos sueltos. Tócalos en el orden en que quieres meterlos; toca un pin para sacar su hilo.'),
      h('div.lt-hilos', Object.keys(HILOS).map(id => h('button.lt-suelto', { type: 'button', disabled: usados.includes(id), onclick: () => { const hueco = usados.indexOf(null); if (hueco < 0) return; usados[hueco] = id; if (!usados.includes(null) && activo === 0 && extremos[1].includes(null)) activo = 1; resultado.replaceChildren(); pintar(); } }, hilo(id), HILOS[id]))));
  }
  function nueva() {
    tarea = TAREAS[Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 2)];
    extremos = [Array(8).fill(null), Array(8).fill(null)]; activo = 0;
    enunciado.replaceChildren('Haz ', h('strong', tarea.texto), '.');
    resultado.replaceChildren(); pintar();
  }
  probar.addEventListener('click', () => {
    const r = juzgar(tarea, extremos[0], extremos[1]);
    resultado.replaceChildren(tester(r.mapa.map(p => [p])), h('p.lt-veredicto.' + (r.ok ? 'ok' : 'ko'), r.texto));
  });
  const el = h('section.tarjeta.lt-bloque',
    h('h2', h('span.etiqueta', 'Parte 1'), ' Haz el latiguillo'),
    enunciado, zona,
    h('div.lt-barra', probar, h('button.btn.sec', { type: 'button', onclick: () => { extremos = [Array(8).fill(null), Array(8).fill(null)]; activo = 0; resultado.replaceChildren(); pintar(); } }, 'Vaciar'), h('button.btn.sec', { type: 'button', onclick: nueva }, 'Otro cable')),
    resultado);
  nueva();
  return el;
}

function parteTester() {
  let hechos = 0, aciertos = 0, total = 0;
  const marcador = h('span.chip'), lista = h('div');
  const pintarMarcador = () => { marcador.textContent = `${aciertos} de ${hechos} bien`; marcador.className = 'chip' + (hechos === total && aciertos === total ? ' ok' : ''); };
  function nueva() {
    const lecturas = crearLecturas(semillaNueva()); hechos = 0; aciertos = 0; total = lecturas.length; pintarMarcador();
    lista.replaceChildren(...lecturas.map((lec, i) => {
      const pista = h('p.lt-pista', { hidden: true });
      const sel = h('select', { 'aria-label': 'Diagnóstico del cable ' + (i + 1) }, h('option', { value: '' }, '¿Qué le pasa?'), DIAGNOSTICOS.map(([id, t]) => h('option', { value: id }, t)));
      const caja = h('div.lt-caso', h('p', h('strong', `Cable ${i + 1}`)), tester(lec.luces), sel, pista);
      sel.addEventListener('change', () => {
        if (!sel.value) return;
        const ok = sel.value === lec.tipo;
        sel.disabled = true; hechos++; if (ok) aciertos++;
        caja.classList.add(ok ? 'ok' : 'ko'); pista.hidden = false;
        pista.replaceChildren(h('strong', ok ? 'Bien. ' : 'No: ' + DIAGNOSTICOS.find(d => d[0] === lec.tipo)[1].toLowerCase() + '. '), lec.causa);
        pintarMarcador();
      });
      return caja;
    }));
  }
  const el = h('section.tarjeta.lt-bloque',
    h('h2', h('span.etiqueta', 'Parte 2'), ' ¿Qué dice el tester?'),
    h('p', 'Cinco cables de compañeros. En cada fila, a la izquierda está el pin del extremo 1 y a la derecha las luces que se encienden en el extremo 2. Di qué le pasa a cada uno.'),
    h('div.lt-barra', marcador, h('button.btn.sec', { type: 'button', onclick: nueva }, 'Otros cinco')),
    lista);
  nueva();
  return el;
}

export function vistaLatiguillo() {
  return { el: h('section.lt',
    h('div.inicio-cab',
      h('span.etiqueta', 'Tema 2 · Conectores y herramientas'),
      h('h1', 'Haz el latiguillo y pásale el tester'),
      h('p.lead', 'Ordena los ocho hilos en los dos conectores RJ45, crímpalos y mira qué dice el tester. Después, diagnostica los cables de otros. No se guarda nada y no tiene nota.')),
    parteHacer(), parteTester()) };
}
