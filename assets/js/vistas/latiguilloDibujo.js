// latiguilloDibujo.js — El dibujo animado del latiguillo (Redes locales, Tema 2, sección 4, apartado 6.1):
// los pares salen de la cubierta, cada hilo se coloca en su sitio, se cortan rectos, entra el RJ45,
// se crimpa y el tester manda un pulso por cada hilo.
import { HILOS } from '../practica/Latiguillo.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, ...hijos) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.append(...hijos);
  return e;
};
const COLOR = { n: '#e8811a', v: '#2e9e4f', a: '#2a62c9', m: '#7a4a22' };
const colorDe = id => COLOR[id.replace('b', '')];
const ORDEN_PARES = ['bn', 'n', 'bv', 'v', 'a', 'ba', 'bm', 'm'];   // como salen de la cubierta, par a par
const CX = [185, 535], PASO = 22, Y_BOCA = 300, Y_PEINE = 236, Y_CORTE = 150, Y_LED = 72;
const PUNTAS = { bn: 124, n: 137, bv: 117, v: 131, a: 141, ba: 121, bm: 134, m: 127 };   // puntas desiguales antes de cortar
const ranuraX = (k, i) => CX[k] + (i - 3.5) * PASO;
const bocaX = (k, id) => CX[k] + (ORDEN_PARES.indexOf(id) - 3.5) * 3.4;

const poseBrote = (k, id) => ({ ex: bocaX(k, id), ey: Y_BOCA - 6, c2x: bocaX(k, id), c2y: Y_BOCA - 4, c1: 2, up: 0 });
// Los hilos sin colocar se abren en abanico a los lados de la cubierta, cada uno junto a su pareja.
function poseSuelto(k, id) {
  const p = ORDEN_PARES.indexOf(id), lado = p < 4 ? -1 : 1, r = p < 4 ? 3 - p : p - 4;   // r = 0: el más cercano al centro
  const ang = (56 + r * 14) * Math.PI / 180, largo = 108 + (p % 2 ? 9 : 0), mx = bocaX(k, id), y0 = Y_BOCA - 8;
  return { ex: mx + lado * Math.sin(ang) * largo, ey: y0 - Math.cos(ang) * largo,
    c2x: mx + lado * Math.sin(ang) * largo * 0.55, c2y: y0 - Math.cos(ang) * largo * 0.55 - 16, c1: 34, up: 0 };
}
const posePuesto = (k, id, i, corte) => ({ ex: ranuraX(k, i), ey: Y_PEINE, c2x: ranuraX(k, i), c2y: Y_PEINE + 36, c1: 46, up: Y_PEINE - (PUNTAS[id] + (Y_CORTE - PUNTAS[id]) * corte) });
const CLAVES = ['ex', 'ey', 'c2x', 'c2y', 'c1', 'up'];

/**
 * crearDibujo({ alHilo(k, id), alPin(k, i), alExtremo(k) }) → { el, poner(estado), brotar(k), crimpar(), probar(mapa), parar(), destruir() }
 * estado = { extremos: [[id|null × 8], [id|null × 8]], activo: 0|1, crimpado: [bool, bool] }
 */
export function crearDibujo({ alHilo, alPin, alExtremo }) {
  const quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let est = { extremos: [Array(8).fill(null), Array(8).fill(null)], activo: 0, crimpado: [false, false] };
  let raf = 0, ultimo = 0, turno = 0, vivo = true;
  const esperas = [];

  const svg = s('svg', { viewBox: '0 0 720 432', class: 'ld', role: 'group', 'aria-label': 'Dibujo del latiguillo: dos extremos del cable con sus ocho hilos' });
  const capaFondo = s('g'), capaHilos = s('g'), capaCable = s('g'), capaTester = s('g'), capaRj = s('g'), capaPines = s('g'), capaPulso = s('g');
  svg.append(capaFondo, capaHilos, capaCable, capaTester, capaRj, capaPines, capaPulso);

  // El cable: una U que une los dos extremos.
  const U = `M${CX[0]} ${Y_BOCA} V352 Q${CX[0]} 400 ${CX[0] + 48} 400 H${CX[1] - 48} Q${CX[1]} 400 ${CX[1]} 352 V${Y_BOCA}`;
  capaCable.append(s('path', { d: U, class: 'ld-funda-borde' }), s('path', { d: U, class: 'ld-funda' }),
    ...CX.map(x => s('path', { d: `M${x - 13} ${Y_BOCA} h26`, class: 'ld-boca' })),
    s('text', { x: CX[0] + 26, y: 346, class: 'ld-rotulo' }, 'Extremo 1'),
    s('text', { x: CX[1] - 26, y: 346, class: 'ld-rotulo', 'text-anchor': 'end' }, 'Extremo 2'));

  const extremos = CX.map((cx, k) => {
    const E = { k, corte: 0, con: 0, crimp: 0, test: 0, quietos: true, hilos: {}, leds: [], nums: [] };
    // zona para elegir el extremo + marco del activo
    const zona = s('rect', { x: cx - 152, y: 4, width: 304, height: 322, rx: 16, class: 'ld-zona' });
    zona.addEventListener('click', () => alExtremo(k));
    E.marco = zona;
    capaFondo.append(zona);
    // guías de las ranuras y números de pin
    E.guias = s('g', {}, ...Array.from({ length: 8 }, (_, i) => s('path', { d: `M${ranuraX(k, i)} 118 V${Y_PEINE}`, class: 'ld-guia' })));
    E.numeros = s('g', {}, ...Array.from({ length: 8 }, (_, i) => s('text', { x: ranuraX(k, i), y: 108, class: 'ld-num', 'text-anchor': 'middle' }, String(i + 1))));
    E.tijera = s('g', { opacity: 0 }, s('path', { d: `M${cx - 96} ${Y_CORTE} h192`, class: 'ld-tijera' }), s('text', { x: cx + 100, y: Y_CORTE + 5, class: 'ld-tijera-t' }, '✂'));
    capaFondo.append(E.guias, E.numeros);
    // los ocho hilos: los colocados se pintan por encima de los sueltos
    E.gSueltos = s('g'); E.gPuestos = s('g');
    for (const id of ORDEN_PARES) {
      const g = s('g', { class: 'ld-hilo' });
      const borde = s('path', { class: 'ld-h-borde' }), base = s('path', { class: 'ld-h-base', stroke: id[0] === 'b' && id.length === 2 ? '#fdfdfb' : colorDe(id) });
      const partes = [borde, base];
      if (id.length === 2) partes.push(s('path', { class: 'ld-h-raya', stroke: colorDe(id) }));
      g.append(...partes, s('title', {}, HILOS[id]));
      g.addEventListener('click', () => { if (!est.extremos[k].includes(id)) alHilo(k, id); });
      E.gSueltos.append(g);
      E.hilos[id] = { id, g, partes, cur: poseBrote(k, id), puesto: false };
    }
    capaHilos.append(E.gSueltos, E.gPuestos, E.tijera);
    // el conector RJ45, visto por la cara de los contactos (pestaña hacia abajo)
    E.contactos = s('g', {}, ...Array.from({ length: 8 }, (_, i) => s('rect', { x: ranuraX(k, i) - 5, y: 148, width: 10, height: 30, rx: 2, class: 'ld-contacto' })));
    E.cuna = s('rect', { x: cx - 40, y: 292, width: 80, height: 10, rx: 3, class: 'ld-cuna' });
    E.clac = s('text', { x: cx, y: 276, class: 'ld-clac', 'text-anchor': 'middle', opacity: 0 }, '¡clac!');
    E.rj = s('g', { opacity: 0 },
      s('rect', { x: cx - 93, y: 140, width: 186, height: 180, rx: 10, class: 'ld-rj' }),
      s('path', { d: `M${cx - 93} 186 h186`, class: 'ld-rj-linea' }),
      ...Array.from({ length: 7 }, (_, i) => s('path', { d: `M${ranuraX(k, i) + PASO / 2} 142 V${Y_PEINE - 8}`, class: 'ld-rj-linea' })),
      E.contactos, E.cuna, E.clac,
      s('text', { x: cx + 86, y: 313, class: 'ld-rj-t', 'text-anchor': 'end' }, 'RJ45'));
    capaRj.append(E.rj);
    // el tester: una caja por extremo, con sus ocho luces
    E.testerG = s('g', { opacity: 0 },
      s('rect', { x: cx - 72, y: 100, width: 144, height: 46, rx: 6, class: 'ld-t-puerto' }),
      s('rect', { x: cx - 99, y: 10, width: 198, height: 98, rx: 14, class: 'ld-t-caja' }),
      s('text', { x: cx, y: 36, class: 'ld-t-titulo', 'text-anchor': 'middle' }, k === 0 ? 'TESTER · principal' : 'TESTER · remoto'));
    for (let i = 0; i < 8; i++) {
      const led = s('circle', { cx: ranuraX(k, i), cy: Y_LED, r: 9, class: 'ld-led' });
      const num = s('text', { x: ranuraX(k, i), y: Y_LED + 4, class: 'ld-led-n', 'text-anchor': 'middle' }, String(i + 1));
      E.leds.push(led); E.nums.push(num); E.testerG.append(led, num);
    }
    capaTester.append(E.testerG);
    // un botón invisible por pin, para sacar el hilo
    E.pines = Array.from({ length: 8 }, (_, i) => {
      const r = s('rect', { x: ranuraX(k, i) - PASO / 2, y: 96, width: PASO, height: Y_PEINE - 92, class: 'ld-pin', role: 'button', tabindex: 0 });
      const pulsa = () => alPin(k, i);
      r.addEventListener('click', pulsa);
      r.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pulsa(); } });
      capaPines.append(r);
      return r;
    });
    return E;
  });

  const pulso = s('circle', { r: 7.5, class: 'ld-pulso', opacity: 0 });
  const caminoPulso = s('path', { fill: 'none', stroke: 'none' });
  capaPulso.append(caminoPulso, pulso);

  // ---------- Bucle: cada valor persigue a su destino ----------
  const sigue = (v, d, dt, tau) => { const n = quieto ? d : v + (d - v) * (1 - Math.exp(-dt / tau)); return Math.abs(n - d) < 0.004 ? d : n; };
  function programar() { if (!raf && vivo) { ultimo = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(t) {
    raf = 0;
    const dt = Math.min(48, Math.max(1, t - ultimo)); ultimo = t;
    let mov = false;
    const crimpados = est.crimpado[0] && est.crimpado[1];
    for (const E of extremos) {
      const puestos = est.extremos[E.k], lleno = puestos.every(Boolean);
      const d = {
        corte: lleno || E.con > 0.04 ? 1 : 0,
        con: lleno && E.corte > 0.97 && E.quietos ? 1 : 0,
        crimp: est.crimpado[E.k] && E.con > 0.985 ? 1 : 0,
        test: crimpados && extremos.every(x => x.crimp > 0.985) ? 1 : 0,
      };
      const tau = { corte: 95, con: 120, crimp: 70, test: 130 };
      for (const c of Object.keys(d)) { const n = sigue(E[c], d[c], dt, tau[c]); if (n !== E[c] || n !== d[c]) mov = true; E[c] = n; }
      let lejos = 0;
      for (const hilo of Object.values(E.hilos)) {
        const i = puestos.indexOf(hilo.id);
        const dst = i >= 0 ? posePuesto(E.k, hilo.id, i, E.corte) : poseSuelto(E.k, hilo.id);
        for (const c of CLAVES) {
          const dif = Math.abs(dst[c] - hilo.cur[c]);
          if (dif > lejos && c !== 'up') lejos = dif;
          hilo.cur[c] = dif < 0.15 ? dst[c] : sigue(hilo.cur[c], dst[c], dt, 85);
          if (hilo.cur[c] !== dst[c]) mov = true;
        }
        if (hilo.puesto !== (i >= 0)) { hilo.puesto = i >= 0; (hilo.puesto ? E.gPuestos : E.gSueltos).append(hilo.g); hilo.g.classList.toggle('puesto', hilo.puesto); }
      }
      E.quietos = lejos < 1.5;
    }
    pintar();
    for (let i = esperas.length - 1; i >= 0; i--) if (esperas[i].cond()) esperas.splice(i, 1)[0].res();
    if (mov || esperas.length) programar();
  }
  const esperar = cond => new Promise(res => { esperas.push({ cond, res }); programar(); });

  function pintar() {
    for (const E of extremos) {
      for (const hilo of Object.values(E.hilos)) {
        const c = hilo.cur, mx = bocaX(E.k, hilo.id);
        const d = `M${mx.toFixed(1)} ${Y_BOCA + 6}V${Y_BOCA}C${mx.toFixed(1)} ${(Y_BOCA - c.c1).toFixed(1)} ${c.c2x.toFixed(1)} ${c.c2y.toFixed(1)} ${c.ex.toFixed(1)} ${c.ey.toFixed(1)}${c.up > 0.4 ? 'v' + (-c.up).toFixed(1) : ''}`;
        hilo.partes.forEach(p => p.setAttribute('d', d));
      }
      E.rj.setAttribute('transform', `translate(0 ${((1 - E.con) * -172).toFixed(1)})`);
      E.rj.setAttribute('opacity', Math.min(1, E.con * 1.6).toFixed(2));
      E.contactos.setAttribute('transform', `translate(0 ${((1 - E.crimp) * -8).toFixed(1)})`);
      E.contactos.setAttribute('opacity', (0.45 + 0.55 * E.crimp).toFixed(2));
      E.cuna.setAttribute('opacity', E.crimp.toFixed(2));
      E.clac.setAttribute('opacity', Math.sin(Math.PI * E.crimp).toFixed(2));
      E.clac.setAttribute('transform', `translate(0 ${(-10 * E.crimp).toFixed(1)})`);
      E.tijera.setAttribute('opacity', (E.con < 0.5 ? Math.sin(Math.PI * E.corte) : 0).toFixed(2));
      E.numeros.setAttribute('opacity', (1 - E.test).toFixed(2));
      E.guias.setAttribute('opacity', (1 - E.con).toFixed(2));
      E.testerG.setAttribute('transform', `translate(0 ${((1 - E.test) * -118).toFixed(1)})`);
      E.testerG.setAttribute('opacity', E.test.toFixed(2));
      E.marco.classList.toggle('activo', est.activo === E.k && !est.crimpado[E.k]);
      E.pines.forEach((r, i) => {
        const id = est.extremos[E.k][i];
        r.setAttribute('aria-label', `Extremo ${E.k + 1}, pin ${i + 1}: ${id ? HILOS[id] + '. Pulsa para sacarlo' : 'vacío'}`);
        r.classList.toggle('lleno', !!id);
      });
    }
  }

  function apagarLeds() { extremos.forEach(E => E.leds.forEach(l => { l.setAttribute('class', 'ld-led'); })); pulso.setAttribute('opacity', 0); }

  // ---------- El tester: un pulso por cada hilo, del extremo 1 al extremo 2 ----------
  function caminoDe(i, j) {
    const idA = est.extremos[0][i], xa = ranuraX(0, i), xb = ranuraX(1, j), ma = bocaX(0, idA), mb = bocaX(1, idA);
    return `M${xa} ${Y_LED}V${Y_PEINE}C${xa} ${Y_PEINE + 36} ${ma} ${Y_BOCA - 46} ${ma} ${Y_BOCA}L${CX[0]} 352Q${CX[0]} 400 ${CX[0] + 48} 400H${CX[1] - 48}Q${CX[1]} 400 ${CX[1]} 352L${mb} ${Y_BOCA}C${mb} ${Y_BOCA - 46} ${xb} ${Y_PEINE + 36} ${xb} ${Y_PEINE}V${Y_LED}`;
  }
  async function probar(mapa) {
    const yo = ++turno;
    apagarLeds();
    await esperar(() => extremos.every(E => E.test === 1) || yo !== turno);
    for (let i = 0; i < 8 && yo === turno; i++) {
      const j = mapa[i] - 1, id = est.extremos[0][i];
      extremos[0].leds[i].setAttribute('class', 'ld-led on');
      if (j >= 0 && !quieto) {
        caminoPulso.setAttribute('d', caminoDe(i, j));
        const largo = caminoPulso.getTotalLength(), rayado = id.length === 2;
        pulso.setAttribute('fill', rayado ? '#fdfdfb' : colorDe(id));
        pulso.setAttribute('stroke', rayado ? colorDe(id) : 'var(--tinta)');
        pulso.setAttribute('opacity', 1);
        const t0 = performance.now(), dura = 460;
        await new Promise(res => {
          const paso = t => {
            const u = Math.min(1, (t - t0) / dura), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
            const p = caminoPulso.getPointAtLength(largo * e);
            pulso.setAttribute('cx', p.x.toFixed(1)); pulso.setAttribute('cy', p.y.toFixed(1));
            if (u < 1 && yo === turno && vivo) requestAnimationFrame(paso); else res();
          };
          requestAnimationFrame(paso);
        });
      }
      if (yo !== turno) break;
      pulso.setAttribute('opacity', 0);
      if (j >= 0) extremos[1].leds[j].setAttribute('class', 'ld-led on' + (j === i ? '' : ' otro'));
      if (!quieto) await new Promise(res => setTimeout(res, 70));
    }
    if (yo !== turno) return false;
    return true;
  }

  return {
    el: svg,
    poner(estado) {
      const antes = est.crimpado[0] && est.crimpado[1];
      est = { extremos: estado.extremos.map(e => e.slice()), activo: estado.activo, crimpado: estado.crimpado.slice() };
      if (antes && !(est.crimpado[0] && est.crimpado[1])) { turno++; apagarLeds(); }
      programar();
    },
    /** Los hilos de ese extremo vuelven a salir de la cubierta (cable nuevo o conector cortado). */
    brotar(k) { Object.values(extremos[k].hilos).forEach(hilo => { hilo.cur = poseBrote(k, hilo.id); }); programar(); },
    /** Espera a que los dos conectores estén apretados. */
    crimpar() { const yo = turno; return esperar(() => extremos.every(E => E.crimp === 1) || yo !== turno); },
    probar,
    parar() { turno++; apagarLeds(); },
    destruir() { vivo = false; turno++; if (raf) cancelAnimationFrame(raf); raf = 0; esperas.splice(0).forEach(e => e.res()); },
  };
}
