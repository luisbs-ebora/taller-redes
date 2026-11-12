// mapas.js — «Mapa físico y diagrama lógico»: la misma red (Nave 1 de Cerámicas Ribera del Tajo) dibujada de las dos formas.
// Tema 1, sección 5. Al tocar un elemento se marca en los dos dibujos.
import { h } from '../util.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, at = {}, ...hijos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); hijos.forEach(x => e.append(x)); return e; };
const dos = n => String(n).padStart(2, '0');

// La red de la Nave 1 · Oficinas, como en la solución de la red animada
const PCS = Array.from({ length: 12 }, (_, i) => 'PC' + dos(i + 1));
const PORTATILES = ['PORT01', 'PORT02', 'PORT03', 'PORT04'];
const INFO = {
  pc: id => `${id} es una estación de trabajo. En el mapa físico ves en qué mesa está y a qué toma va (T${id.slice(2)}). En el diagrama lógico solo importa que cuelga del switch SW01.`,
  toma: id => `La toma ${id} solo sale en el mapa físico: es un sitio de la pared. En el diagrama lógico no hay tomas ni canaletas; el equipo se une directamente con el switch.`,
  IMP01: 'IMP01 es la impresora en red. En el mapa físico está en la zona de impresión, en la toma T13. En el lógico cuelga de SW01 como un equipo más.',
  SRV01: 'SRV01 es el servidor de archivos. En el mapa físico está en el cuarto técnico, al lado del armario, con un cable directo al switch (sin toma). En el lógico cuelga de SW01.',
  SW01: 'SW01 es el switch de las oficinas. En el mapa físico es una cajita dentro del armario. En el diagrama lógico es el centro: de él cuelga todo. Por eso es el punto débil de la red.',
  R01: 'R01 es el router del operador. En el mapa físico está en el armario y le llega la fibra de la calle. En el lógico va entre Internet y el switch: es la puerta de salida.',
  AP01: 'AP01 es un punto de acceso Wi‑Fi. En el mapa físico está en el techo y lleva su cable hasta la toma T14. En el lógico cuelga de SW01 con línea continua, y de él cuelgan los portátiles con línea discontinua.',
  AP02: 'AP02 es el segundo punto de acceso. En el mapa físico está en el techo, en la toma T15. En el lógico cuelga de SW01, igual que AP01.',
  port: id => `${id} es un portátil de los comerciales. No tiene cable: en los dos dibujos se une a su punto de acceso con línea discontinua (Wi‑Fi).`,
  INTERNET: 'Internet solo sale en el diagrama lógico (arriba del todo). En el mapa físico lo único que se ve es por dónde entra la fibra del operador.',
  SW02: 'SW02 es el switch de la Nave 2 (taller). En el mapa físico de esta nave solo se ve la fibra que sale hacia allí. En el lógico se ve que cuelga de SW01: la red completa es un árbol.',
  SW03: 'SW03 es el switch de la Nave 3 (almacén). Igual que SW02: una fibra que sale de la nave en el mapa físico y un switch que cuelga de SW01 en el lógico.',
  canaleta: 'La canaleta solo sale en el mapa físico: es el recorrido de los cables por la pared. Por dentro va un cable distinto por cada toma, todos hasta el armario.',
  armario: 'El armario solo sale en el mapa físico: es el mueble donde están el switch y el router. En el lógico no hay muebles ni habitaciones.',
};
const infoDe = id => /^PC/.test(id) ? INFO.pc(id) : /^T\d/.test(id) ? INFO.toma(id) : /^PORT/.test(id) ? INFO.port(id) : INFO[id] || '';

/* ---------- Mapa físico ---------- */
function mapaFisico() {
  const svg = el('svg', { viewBox: '0 0 780 480', class: 'mp-svg', role: 'img', 'aria-label': 'Mapa físico de la Nave 1: plano con las mesas, las tomas, la canaleta y el armario' });
  const g = (id, ...hijos) => { const x = el('g', { 'data-id': id, class: 'mp-el', tabindex: 0 }, ...hijos); svg.append(x); return x; };
  const txt = (x, y, t, cls = 'mp-nom', anchor = 'middle') => el('text', { x, y, class: cls, 'text-anchor': anchor }, t);
  // edificio y salas
  svg.append(el('rect', { x: 20, y: 30, width: 740, height: 430, class: 'mp-muro' }));
  svg.append(el('line', { x1: 570, y1: 30, x2: 570, y2: 460, class: 'mp-tabique' }));
  svg.append(el('line', { x1: 570, y1: 230, x2: 760, y2: 230, class: 'mp-tabique' }));
  svg.append(txt(295, 250, 'OFICINA', 'mp-sala')); svg.append(txt(665, 216, 'CUARTO TÉCNICO', 'mp-sala')); svg.append(txt(665, 446, 'ZONA DE IMPRESIÓN', 'mp-sala'));
  // canaleta por las paredes hasta el armario
  g('canaleta',
    el('path', { d: 'M 50 44 H 610 V 70', class: 'mp-canaleta' }), el('path', { d: 'M 50 446 H 556 V 44', class: 'mp-canaleta' }),
    el('path', { d: 'M 742 330 V 130 H 700', class: 'mp-canaleta' }));
  // mesas con su PC y su toma
  PCS.forEach((id, i) => {
    const arriba = i < 6, x = 70 + (i % 6) * 82, y = arriba ? 92 : 372, ty = arriba ? 44 : 446, n = dos(i + 1);
    svg.append(el('line', { x1: x + 22, y1: arriba ? y - 4 : y + 30, x2: x + 22, y2: ty, class: 'mp-cable' }));
    g(id, el('rect', { x: x - 30, y: y - 4, width: 60, height: 34, rx: 4, class: 'mp-mesa' }), el('rect', { x: x - 20, y: y + 2, width: 30, height: 20, rx: 3, class: 'mp-pc' }), txt(x - 5, arriba ? y + 46 : y - 12, id));
    g('T' + n, el('rect', { x: x + 15, y: ty - 7, width: 14, height: 14, class: 'mp-toma' }), txt(x + 22, arriba ? ty + 22 : ty - 12, 'T' + n, 'mp-tnom'));
  });
  // puntos de acceso en el techo, con su cable hasta la canaleta
  [['AP01', 14, 190], ['AP02', 15, 436]].forEach(([id, t, x]) => {
    svg.append(el('path', { d: `M ${x} 200 V 44`, class: 'mp-cable' }));
    g(id, el('circle', { cx: x, cy: 218, r: 15, class: 'mp-ap' }), el('path', { d: `M ${x - 7} 220 a 9 9 0 0 1 14 0 M ${x - 4} 224 a 5 5 0 0 1 8 0`, class: 'mp-onda' }), txt(x, 250, id + ' (techo)'));
    g('T' + t, el('rect', { x: x - 7, y: 37, width: 14, height: 14, class: 'mp-toma' }), txt(x + 26, 66, 'T' + t, 'mp-tnom'));
  });
  // portátiles por Wi‑Fi
  [['PORT01', 120, 290, 190], ['PORT02', 262, 300, 190], ['PORT03', 366, 290, 436], ['PORT04', 500, 300, 436]].forEach(([id, x, y, ax]) => {
    svg.append(el('line', { x1: x, y1: y - 8, x2: ax, y2: 232, class: 'mp-wifi' }));
    g(id, el('rect', { x: x - 15, y: y - 8, width: 30, height: 18, rx: 3, class: 'mp-port' }), txt(x, y + 26, id));
  });
  // impresora
  svg.append(el('line', { x1: 700, y1: 330, x2: 742, y2: 330, class: 'mp-cable' }));
  g('IMP01', el('rect', { x: 650, y: 312, width: 50, height: 34, rx: 4, class: 'mp-imp' }), txt(675, 366, 'IMP01'));
  g('T13', el('rect', { x: 735, y: 323, width: 14, height: 14, class: 'mp-toma' }), txt(726, 314, 'T13', 'mp-tnom'));
  // armario con switch y router; servidor al lado
  g('armario', el('rect', { x: 598, y: 70, width: 104, height: 96, rx: 6, class: 'mp-armario' }), txt(650, 62, 'Armario de red', 'mp-tnom'));
  g('SW01', el('rect', { x: 610, y: 84, width: 80, height: 26, rx: 3, class: 'mp-sw' }), txt(650, 102, 'SW01', 'mp-dentro'));
  g('R01', el('rect', { x: 610, y: 126, width: 80, height: 26, rx: 3, class: 'mp-rt' }), txt(650, 144, 'R01', 'mp-dentro'));
  svg.append(el('line', { x1: 630, y1: 166, x2: 630, y2: 182, class: 'mp-cable' }));
  g('SRV01', el('rect', { x: 606, y: 182, width: 50, height: 22, rx: 3, class: 'mp-srv' }), txt(690, 198, 'SRV01'));
  // fibras: la del operador entra; dos salen hacia las otras naves
  svg.append(el('path', { d: 'M 690 139 H 772', class: 'mp-fibra-op' })); svg.append(txt(772, 156, 'Fibra del operador', 'mp-tnom', 'end'));
  g('SW02', el('path', { d: 'M 690 92 H 720 V 18', class: 'mp-fibra' }), txt(716, 14, 'Fibra a la Nave 2', 'mp-tnom', 'end'));
  g('SW03', el('path', { d: 'M 690 102 H 750 V 18', class: 'mp-fibra' }), txt(772, 28, 'a la Nave 3', 'mp-tnom', 'end'));
  return svg;
}

/* ---------- Diagrama lógico ---------- */
function diagramaLogico() {
  const svg = el('svg', { viewBox: '0 0 780 480', class: 'mp-svg', role: 'img', 'aria-label': 'Diagrama lógico: Internet, router, switch y, debajo, los equipos' });
  const g = (id, ...hijos) => { const x = el('g', { 'data-id': id, class: 'mp-el', tabindex: 0 }, ...hijos); svg.append(x); return x; };
  const txt = (x, y, t, cls = 'mp-nom', anchor = 'middle') => el('text', { x, y, class: cls, 'text-anchor': anchor }, t);
  const linea = (x1, y1, x2, y2, cls = 'mp-union') => svg.append(el('line', { x1, y1, x2, y2, class: cls }));
  const SWY = 190, FILA = 300;
  // uniones (primero, para que queden debajo)
  linea(390, 62, 390, 96); linea(390, 130, 390, SWY - 16);
  linea(150, SWY, 330, SWY, 'mp-fibra'); linea(450, SWY, 630, SWY, 'mp-fibra');
  PCS.forEach((id, i) => linea(390, SWY + 16, 36 + i * 40, FILA - 14));
  [[540, 'IMP01'], [596, 'SRV01'], [662, 'AP01'], [730, 'AP02']].forEach(([x]) => linea(390, SWY + 16, x, FILA - 14));
  [[628, 662], [672, 662], [708, 730], [750, 730]].forEach(([x, ax]) => linea(ax, FILA + 14, x, 396, 'mp-wifi'));
  // nodos
  g('INTERNET', el('path', { d: 'M 350 58 a 16 16 0 0 1 8 -30 a 22 22 0 0 1 42 -6 a 18 18 0 0 1 30 16 a 14 14 0 0 1 -4 22 Z', class: 'mp-nube' }), txt(392, 46, 'Internet', 'mp-dentro'));
  g('R01', el('rect', { x: 340, y: 96, width: 100, height: 34, rx: 6, class: 'mp-rt' }), txt(390, 118, 'R01 · router', 'mp-dentro'));
  g('SW01', el('rect', { x: 330, y: SWY - 16, width: 120, height: 32, rx: 6, class: 'mp-sw' }), txt(390, SWY + 5, 'SW01 · switch', 'mp-dentro'));
  g('SW02', el('rect', { x: 50, y: SWY - 16, width: 100, height: 32, rx: 6, class: 'mp-sw' }), txt(100, SWY + 5, 'SW02', 'mp-dentro'), txt(100, SWY + 36, 'Nave 2 · y sus equipos', 'mp-tnom'));
  g('SW03', el('rect', { x: 630, y: SWY - 16, width: 100, height: 32, rx: 6, class: 'mp-sw' }), txt(680, SWY + 5, 'SW03', 'mp-dentro'), txt(680, SWY + 36, 'Nave 3 · y sus equipos', 'mp-tnom'));
  svg.append(txt(240, SWY - 8, 'fibra', 'mp-tnom')); svg.append(txt(540, SWY - 8, 'fibra', 'mp-tnom'));
  PCS.forEach((id, i) => { const x = 36 + i * 40; g(id, el('rect', { x: x - 17, y: FILA - 14, width: 34, height: 28, rx: 4, class: 'mp-pc' }), txt(x, FILA + 30 + (i % 2) * 14, id, 'mp-chico')); });
  g('IMP01', el('rect', { x: 516, y: FILA - 14, width: 48, height: 28, rx: 4, class: 'mp-imp' }), txt(540, FILA + 30, 'IMP01', 'mp-chico'));
  g('SRV01', el('rect', { x: 572, y: FILA - 14, width: 48, height: 28, rx: 4, class: 'mp-srv' }), txt(596, FILA + 44, 'SRV01', 'mp-chico'));
  [['AP01', 662], ['AP02', 730]].forEach(([id, x]) => g(id, el('circle', { cx: x, cy: FILA, r: 15, class: 'mp-ap' }), txt(x, FILA + 5, id.slice(2), 'mp-dentro'), txt(x + 26, FILA - 16, id, 'mp-chico')));
  [['PORT01', 628], ['PORT02', 672], ['PORT03', 708], ['PORT04', 750]].forEach(([id, x], i) => g(id, el('rect', { x: x - 15, y: 396, width: 30, height: 20, rx: 3, class: 'mp-port' }), txt(x, 434 + (i % 2) * 14, id, 'mp-chico')));
  return svg;
}

const QUIZ = [
  ['Quieres saber por qué pared pasa la canaleta.', 'f', 'El recorrido de los cables solo está en el mapa físico.'],
  ['Quieres saber qué equipos se quedan sin red si se avería SW01.', 'l', 'En el lógico se ve de un vistazo qué cuelga de cada aparato.'],
  ['El instalador pregunta dónde va la toma T13.', 'f', 'Las tomas son sitios de la pared: solo salen en el mapa físico.'],
  ['Quieres ver por qué aparatos pasan los datos para llegar a Internet.', 'l', 'Internet, router, switch y equipos, de arriba abajo: es el diagrama lógico.'],
  ['Hay que calcular cuántos metros de cable hacen falta.', 'f', 'Las distancias y los recorridos están en el mapa físico. En el lógico las líneas no miden nada.'],
  ['Lleva el nombre de cada equipo: PC01, SRV01, AP01…', 'd', 'Los dos llevan los nombres: así se sabe que el PC03 de un dibujo es el PC03 del otro.'],
];

export function vistaMapas() {
  const fis = mapaFisico(), log = diagramaLogico();
  const info = h('p.mp-info', { 'aria-live': 'polite' }, 'Toca un equipo, una toma o un cable de cualquiera de los dos dibujos: se marca en los dos y te digo qué cambia de uno a otro.');
  function marcar(id) {
    for (const svg of [fis, log]) svg.querySelectorAll('.mp-el').forEach(e => e.classList.toggle('sel', e.dataset.id === id));
    const enLogico = !!log.querySelector(`[data-id="${id}"]`), enFisico = !!fis.querySelector(`[data-id="${id}"]`);
    info.replaceChildren(h('b', id === 'INTERNET' ? 'Internet' : id === 'canaleta' ? 'Canaleta' : id === 'armario' ? 'Armario' : id), ' · ',
      h('span.chip', enFisico && enLogico ? 'En los dos' : enFisico ? 'Solo en el mapa físico' : 'Solo en el diagrama lógico'), ' ', infoDe(id));
  }
  for (const svg of [fis, log]) {
    svg.addEventListener('click', e => { const g = e.target.closest('.mp-el'); if (g) marcar(g.dataset.id); });
    svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const g = e.target.closest('.mp-el'); if (g) { e.preventDefault(); marcar(g.dataset.id); } } });
  }
  // Cada dibujo se puede ver a pantalla completa, y los dos se pueden poner uno debajo de otro (el doble de grandes)
  const ampliar = () => h('button.btn.sec.peq.mp-ampliar', { type: 'button', onclick: e => {
    const fig = e.currentTarget.closest('figure');
    if (document.fullscreenElement) document.exitFullscreen(); else if (fig.requestFullscreen) fig.requestFullscreen().catch(() => {});
  } }, '⛶ Pantalla completa');
  let apilado = false;
  try { apilado = localStorage.getItem('mapas:apilado') === '1'; } catch (e) {}
  const bApilar = h('button.btn.sec.peq', { type: 'button', onclick: () => { apilado = !apilado; try { localStorage.setItem('mapas:apilado', apilado ? '1' : '0'); } catch (e) {} pintarApilado(); } });
  const pintarApilado = () => { rejillaMapas.classList.toggle('apilado', apilado); bApilar.textContent = apilado ? '◫ Ponerlos lado a lado' : '▤ Más grandes: uno debajo de otro'; };
  let rejillaMapas;
  const leyenda = (...items) => h('ul.mp-leyenda', items.map(([cls, t]) => h('li', h('i.' + cls), t)));

  // Mini test
  let aciertos = 0, hechas = 0;
  const marcador = h('p.mp-marcador', '');
  const quiz = h('ol.mp-quiz', QUIZ.map(([frase, sol, porque]) => {
    const exp = h('p.mp-exp', { hidden: true });
    const li = h('li', h('p', frase), h('div.fila', [['f', 'Mapa físico'], ['l', 'Diagrama lógico'], ['d', 'Los dos']].map(([v, t]) =>
      h('button.btn.sec.peq', { type: 'button', onclick: e => {
        if (li.dataset.hecha) return;
        li.dataset.hecha = '1'; hechas++; if (v === sol) aciertos++;
        li.querySelectorAll('button').forEach(b => { b.disabled = true; });
        e.currentTarget.classList.add(v === sol ? 'ok' : 'ko');
        exp.hidden = false; exp.textContent = (v === sol ? 'Bien. ' : 'No. ') + porque;
        marcador.textContent = `${aciertos} de ${hechas} bien` + (hechas === QUIZ.length ? '.' : '');
      } }, t))), exp);
    return li;
  }));

  const elV = h('section.mapas',
    h('span.etiqueta', 'Tema 1 · Sección 5'), h('h1', 'Mapa físico y diagrama lógico'),
    h('p.lead', 'La misma red dibujada de dos formas: las oficinas de Cerámicas Ribera del Tajo (Nave 1). Un dibujo dice dónde está cada cosa; el otro, qué está conectado con qué.'),
    info,
    h('div.fila', { style: 'margin:0 0 12px' }, bApilar),
    rejillaMapas = h('div.mp-rejilla',
      h('figure.tarjeta.mp-fig', h('figcaption', ampliar(), h('h2', 'Mapa físico'), h('p', 'Sobre el plano: dónde está cada equipo y por dónde van los cables.')), fis,
        leyenda(['l-pc', 'Ordenador'], ['l-toma', 'Toma de red'], ['l-ap', 'Punto de acceso'], ['l-cable', 'Cable de red'], ['l-canaleta', 'Canaleta'], ['l-wifi', 'Wi‑Fi'], ['l-fibra', 'Fibra entre naves'])),
      h('figure.tarjeta.mp-fig', h('figcaption', ampliar(), h('h2', 'Diagrama lógico'), h('p', 'Sin plano: qué cuelga de qué, de arriba abajo.')), log,
        leyenda(['l-pc', 'Ordenador'], ['l-sw', 'Switch'], ['l-rt', 'Router'], ['l-ap', 'Punto de acceso'], ['l-union', 'Cable'], ['l-wifi', 'Wi‑Fi'], ['l-fibra', 'Fibra']))),
    h('div.mp-rejilla',
      h('div.tarjeta.mp-lista', h('h3', 'Un mapa físico lleva…'), h('ul',
        h('li', 'El plano del local de fondo, con sus salas.'),
        h('li', 'Cada equipo en su sitio, con su nombre.'),
        h('li', 'Cada toma de red numerada (T01, T02…), junto al equipo que conecta.'),
        h('li', 'El armario, con el switch y el router dentro.'),
        h('li', 'El recorrido de los cables desde cada toma hasta el armario.'),
        h('li', 'Los puntos de acceso donde están de verdad (en el techo) y sus conexiones Wi‑Fi.'),
        h('li', 'Una leyenda: qué es cada símbolo y cada tipo de línea.'))),
      h('div.tarjeta.mp-lista', h('h3', 'Un diagrama lógico lleva…'), h('ul',
        h('li', 'Ningún plano: da igual dónde esté cada aparato y cuánto mida el cable.'),
        h('li', 'Internet arriba; debajo, el router; debajo, el switch; y debajo, los equipos.'),
        h('li', 'Una línea por cada conexión: qué está conectado con qué.'),
        h('li', 'Cable con línea continua y Wi‑Fi con línea discontinua.'),
        h('li', 'Los mismos nombres que en el mapa físico.'),
        h('li', 'Ni tomas, ni canaletas, ni armarios: eso es del mapa físico.')))),
    h('div.tarjeta.mp-lista.mp-error', h('h3', 'El error más repetido'),
      h('p', 'Copiar el mapa físico en la página del diagrama lógico y quitarle el plano de fondo. Si las líneas siguen el recorrido de las paredes y no se ve qué cuelga del switch, no es un diagrama lógico. Otros clásicos: equipos sin nombre, dibujo sin leyenda y puntos de acceso «sueltos», sin su cable hasta el switch.')),
    h('h2', { style: 'margin-top:28px' }, '¿En cuál lo mirarías?'),
    quiz, marcador,
    h('div.tarjeta.mp-lista', h('h3', 'Para dibujarlos en diagrams.net'), h('ol',
      h('li', 'Un archivo con dos páginas (pestañas de abajo): una para el mapa físico y otra para el diagrama lógico. Doble clic en la pestaña para ponerle nombre.'),
      h('li', 'En el mapa físico, arrastra la imagen del plano al lienzo y bloquéala (selecciónala y pulsa Ctrl + L) para que no se mueva al dibujar encima.'),
      h('li', 'Las formas de red están en «Más formas»: busca las de redes. Escribe el nombre de cada equipo con doble clic.'),
      h('li', 'El tipo de línea (continua o discontinua) se cambia en el panel de la derecha, en «Estilo».'),
      h('li', 'Guarda a menudo. Al terminar: Archivo → Guardar como (.drawio) y Archivo → Exportar como → PDF.'))));
  pintarApilado();
  return { el: elV };
}
