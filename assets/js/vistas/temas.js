// temas.js — Página de un tema: sus actividades en tarjetas. Sale de indice.js.
import { h } from '../util.js';
import { INDICE } from '../indice.js';

export const tarjeta = (href, num, titulo, texto, extra) => h('a.tarjeta.leccion-card', { href },
  h('span.num', num), h('h3', titulo), h('p', texto), extra ? h('span.estado.chip', extra) : null);

export function tarjetasDeTemas() {
  return INDICE.grupos.map(g => h('section.seccion',
    h('header', h('div', h('span.etiqueta', g.rotulo), h('h2', 'Temas'))),
    h('div.rejilla', g.temas.map(t => tarjeta(`#/tema/${t.id}`, t.n.replace(/\D+/g, '').padStart(2, '0'), t.titulo, t.resumen,
      t.items.length === 1 ? '1 actividad' : t.items.length + ' actividades')))));
}

export function vistaTema(id) {
  for (const g of INDICE.grupos) {
    const t = g.temas.find(x => x.id === id);
    if (t) return { el: h('section',
      h('div.inicio-cab', h('span.etiqueta', g.rotulo + ' · ' + t.n), h('h1', t.titulo), h('p.lead', t.resumen)),
      h('div.rejilla', { style: 'margin-top:28px' }, t.items.map((it, i) => tarjeta(it.href, String(i + 1), it.titulo, it.texto, it.chip)))) };
  }
  throw new Error('Este tema no existe.');
}
