// lateral.js — Menú lateral: los temas (plegables, con sus actividades) y los apartados fijos.
// Sale de indice.js. Se construye una vez y en cada cambio de página se actualizan el enlace actual y el tema abierto.
import { h } from './util.js';
import { INDICE } from './indice.js';

const CLAVE_PLEGADO = INDICE.clave + ':lateral';
const CLAVE_TEMA = INDICE.clave + ':tema';
const ANCHO_FIJO = '(min-width: 1280px)';
const leer = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const escribir = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };
// Una actividad es «la actual» si su ruta coincide con la de la página (con o sin parámetros detrás)
const rutaDe = href => href.startsWith('#/') ? href.slice(2) : null;
const esDe = href => { const r = rutaDe(href); return r === null ? () => false : ruta => ruta === r || ruta.startsWith(r + '?'); };

export function crearLateral(aside, boton, extras = []) {
  const fijo = window.matchMedia(ANCHO_FIJO);
  const enlaces = [];
  const enlace = (href, contenido, es) => { const a = h('a', { href }, contenido); enlaces.push({ a, es }); return a; };

  const bloques = [];
  const grupos = INDICE.grupos.map(g => h('div.lat-grupo', h('p.lat-rotulo', g.rotulo), g.temas.map(t => {
    const ver = enlace(`#/tema/${t.id}`, 'Ver el tema', r => r === 'tema/' + t.id);
    ver.classList.add('ver-tema');
    const det = h('details.lat-tema',
      h('summary', h('span.lat-n', t.n), h('span.lat-t', t.titulo), h('span.cuenta', String(t.items.length))),
      h('ul', h('li', ver), t.items.map(it => h('li', enlace(it.href, it.titulo, esDe(it.href))))));
    bloques.push({ t, det });
    return det;
  })));
  const fijos = [...(INDICE.extra || []), ...extras].filter(g => g.items.length).map(g => h('div.lat-grupo', h('p.lat-rotulo', g.rotulo),
    h('ul', g.items.map(it => h('li', enlace(it.href, it.titulo, esDe(it.href)))))));

  aside.replaceChildren(h('ul.lat-inicio', h('li', enlace('#/', 'Inicio', r => r === ''))), ...grupos, ...fijos);

  const velo = h('div.lat-velo', { hidden: true });
  aside.after(velo);
  let abiertoMovil = false, ocultoPorExamen = false;
  const plegado = () => leer(CLAVE_PLEGADO) === '1';
  function pintar() {
    const visible = fijo.matches ? !plegado() && !ocultoPorExamen : abiertoMovil;
    document.body.classList.toggle('con-lateral', fijo.matches && visible);
    aside.classList.toggle('abierto', !fijo.matches && visible);
    aside.toggleAttribute('inert', !visible);
    velo.hidden = fijo.matches || !visible;
    boton.setAttribute('aria-expanded', String(visible));
    boton.setAttribute('aria-label', visible ? 'Ocultar el menú' : 'Mostrar el menú');
  }
  boton.addEventListener('click', () => {
    if (fijo.matches) {
      if (ocultoPorExamen) { ocultoPorExamen = false; escribir(CLAVE_PLEGADO, '0'); }
      else escribir(CLAVE_PLEGADO, plegado() ? '0' : '1');
    } else abiertoMovil = !abiertoMovil;
    pintar();
  });
  velo.addEventListener('click', () => { abiertoMovil = false; pintar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && abiertoMovil) { abiertoMovil = false; pintar(); boton.focus(); } });
  fijo.addEventListener('change', () => { abiertoMovil = false; pintar(); });

  let temaAbierto = null;
  function actualizar(ruta) {
    for (const { a, es } of enlaces) { if (es(ruta)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
    // Tema abierto: el de la página en la que estás; si no es de ningún tema, el último que visitaste.
    const b = bloques.find(b => ruta === 'tema/' + b.t.id || b.t.items.some(it => esDe(it.href)(ruta)));
    if (b) escribir(CLAVE_TEMA, b.t.id);
    const quiero = (b && b.t.id) || temaAbierto || leer(CLAVE_TEMA) || bloques[0].t.id;
    if (quiero !== temaAbierto) {
      temaAbierto = bloques.some(x => x.t.id === quiero) ? quiero : bloques[0].t.id;
      for (const x of bloques) x.det.open = x.t.id === temaAbierto;
    }
    // En el examen el menú se recoge para dejar todo el ancho; el botón lo vuelve a sacar.
    ocultoPorExamen = /(^|\/)examen$/.test(ruta);
    abiertoMovil = false;
    pintar();
  }
  return { actualizar };
}
