// main.js — Enrutador de la web (rutas con #/…). Cada vista devuelve { el, montado?, destruir? }.
import { h } from './util.js';
import { vistaInicio } from './vistas/inicio.js';
import { vistaAnimado } from './vistas/animado.js';
import { vistaDisenio } from './vistas/disenio.js';
import { ESCENA_RED, ESCENA_RACK } from './animado/escenas.js';

const main = document.getElementById('contenido');
let actual = null;

function vistaCreditos() {
  return { el: h('section.contenido', { style: 'max-width:72ch' },
    h('h1', 'Créditos'),
    h('p', 'Contenido: proyecto «La red de Cerámicas Ribera del Tajo» del módulo Redes locales (1.º SMR).'),
    h('p', 'Gráficos 3D: ', h('a', { href: 'https://threejs.org', rel: 'noopener' }, 'three.js'), ' (licencia MIT). Todos los modelos se dibujan por código.'),
    h('p', 'La empresa Cerámicas Ribera del Tajo y el proveedor InfoTajo Distribución son ficticios. Los productos del catálogo son inventados, con características realistas.')) };
}

const RUTAS = [
  [/^$/, () => vistaInicio()],
  [/^creditos$/, () => vistaCreditos()],
  [/^animado$/, () => vistaAnimado(ESCENA_RED)],
  [/^rack$/, () => vistaAnimado(ESCENA_RACK)],
  [/^(practica|examen)$/, m => vistaDisenio(m[1])],
];

let turno = 0;
async function navegar() {
  const mio = ++turno;
  const ruta = decodeURIComponent(location.hash.replace(/^#\/?/, '')).replace(/\/$/, '');
  if (actual && actual.destruir) { try { actual.destruir(); } catch (e) { console.error(e); } }
  actual = null;
  main.replaceChildren(h('div.cargando', 'Cargando…'));
  const seccion = ruta === '' ? 'inicio' : ruta.split('/')[0];
  document.querySelectorAll('.menu a').forEach(a => {
    if (a.dataset.ruta === seccion) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  try {
    const r = RUTAS.find(([re]) => re.test(ruta));
    if (!r) throw new Error('Esta página no existe.');
    const vista = await r[1](ruta.match(r[0]));
    if (mio !== turno) { if (vista && vista.destruir) vista.destruir(); return; }
    actual = vista;
    main.replaceChildren(actual.el);
    if (actual.montado) actual.montado();
  } catch (e) {
    if (mio !== turno) return;
    console.error(e);
    main.replaceChildren(h('div.aviso', h('h2', 'Algo no ha ido bien'), h('p', e.message), h('a.btn', { href: '#/' }, 'Volver al inicio')));
  }
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

import('./config.js').then(c => { if (!c.EXAMEN_ACTIVO) document.querySelector('.menu a[data-ruta="examen"]')?.remove(); });
window.addEventListener('hashchange', navegar);
navegar();
