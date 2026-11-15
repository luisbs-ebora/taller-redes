// latiguillo.js — «Haz el latiguillo y pásale el tester» (Redes locales, Tema 2).
import { h } from '../util.js';
import { HILOS, TAREAS, TAREA_CONSOLA, juzgar, DIAGNOSTICOS, crearLecturas, CABLES, COMPROBADORES, DIAGNOSTICOS_ASIR, crearAsir } from '../practica/Latiguillo.js';

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
  function nueva(fija) {
    tarea = fija && fija.id ? fija : TAREAS[Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 2)];
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
    h('div.lt-barra', probar, h('button.btn.sec', { type: 'button', onclick: () => { extremos = [Array(8).fill(null), Array(8).fill(null)]; activo = 0; resultado.replaceChildren(); pintar(); } }, 'Vaciar'), h('button.btn.sec', { type: 'button', onclick: () => nueva() }, 'Otro cable'), h('button.btn.sec', { type: 'button', onclick: () => nueva(TAREA_CONSOLA) }, 'Cable de consola (ASIR)')),
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

// Nivel de ASIR: qué cable une qué equipos, qué comprobador hace falta y lecturas con cable de consola.
function parteAsir() {
  let hechos = 0, aciertos = 0, total = 0;
  const marcador = h('span.chip'), lista = h('div');
  const pintarMarcador = () => { marcador.textContent = `${aciertos} de ${hechos} bien`; marcador.className = 'chip' + (hechos === total && aciertos === total ? ' ok' : ''); };
  const pregunta = (cuerpo, opciones, buena, porque) => {
    const pista = h('p.lt-pista', { hidden: true });
    const sel = h('select', h('option', { value: '' }, 'Elige…'), opciones.map(([id, t]) => h('option', { value: id }, t)));
    const caja = h('div.lt-caso', cuerpo, sel, pista);
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const ok = sel.value === String(buena);
      sel.disabled = true; hechos++; if (ok) aciertos++;
      caja.classList.add(ok ? 'ok' : 'ko'); pista.hidden = false;
      pista.replaceChildren(h('strong', ok ? 'Bien. ' : 'No: ' + opciones.find(o => String(o[0]) === String(buena))[1] + '. '), porque);
      pintarMarcador();
    });
    total++;
    return caja;
  };
  function nueva() {
    const a = crearAsir(semillaNueva()); hechos = 0; aciertos = 0; total = 0;
    lista.replaceChildren(
      h('p', h('strong', 'Supón equipos antiguos, sin Auto-MDIX. '), '¿Qué cable hace falta para unir…'),
      ...a.uniones.map(u => pregunta(h('p', '…' + u[0] + '?'), CABLES, u[1], u[2])),
      h('p', h('strong', '¿Qué comprobador usarías?')),
      ...a.trabajos.map(t => pregunta(h('p', t[0]), COMPROBADORES.map((c, i) => [i, c]), t[1], t[2])),
      h('p', h('strong', 'Dos lecturas del comprobador de continuidad.')),
      ...a.lecturas.map(l => pregunta(tester(l.luces), DIAGNOSTICOS_ASIR, l.tipo, l.causa)),
      pregunta(h('p', 'Vas a configurar un switch por su puerto de consola. ¿Qué parámetros pones en el programa de terminal?'), [['a', '9600 bit/s, 8 bits de datos, sin paridad, 1 bit de parada (9600 8N1)'], ['b', '115200 bit/s, 7 bits de datos, paridad par, 1 bit de parada'], ['c', '100 Mbit/s en dúplex completo'], ['d', '9600 bit/s, 8 bits de datos, paridad par, 2 bits de parada']], 'a', 'Los parámetros habituales del puerto de consola son 9600 8N1, sin control de flujo.'),
      pregunta(h('p', 'Un latiguillo pasa la prueba de continuidad, pero el enlace negocia a 100 Mbit/s en vez de a 1 Gbit/s. ¿Qué es lo más probable?'), [['a', 'Un par dividido o un hilo de los pares 4-5 o 7-8 mal conectado'], ['b', 'Que el cable sea cruzado'], ['c', 'Que falte el capuchón del conector'], ['d', 'Que el cable sea demasiado corto']], 'a', '1000BASE-T usa los cuatro pares. Con un par dividido el orden de pines es correcto, pero los hilos son de pares distintos: pasa la continuidad y falla a 1 Gbit/s.'));
    pintarMarcador();
  }
  const el = h('section.tarjeta.lt-bloque',
    h('h2', h('span.etiqueta', '1.º ASIR · PAR Tema 2'), ' Directo, cruzado y consola'),
    h('p', 'Para el grupo de ASIR: decide qué cable y qué comprobador hacen falta en cada caso.'),
    h('div.lt-barra', marcador, h('button.btn.sec', { type: 'button', onclick: nueva }, 'Otras preguntas')),
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
    parteHacer(), parteTester(), parteAsir()) };
}
