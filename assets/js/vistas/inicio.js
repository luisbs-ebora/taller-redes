// inicio.js — Portada del Taller de Redes.
import { h } from '../util.js';

export function vistaInicio() {
  const tarjeta = (href, num, titulo, texto, extra) => h('a.tarjeta.leccion-card', { href },
    h('span.num', num), h('h3', titulo), h('p', texto), extra ? h('span.estado.chip', extra) : null);
  return { el: h('section',
    h('div.inicio-cab',
      h('span.etiqueta', 'Redes locales · 1.º SMR'),
      h('h1', 'Taller de Redes'),
      h('p.lead', 'Diseña la red de una empresa: qué se compra, dónde va cada cosa y por qué. Empieza viendo cómo se monta una red completa paso a paso.')),
    h('div.rejilla', { style: 'margin-top:28px' },
      tarjeta('#/animado', '1', 'Red animada', 'La red de Cerámicas Ribera del Tajo montada paso a paso, con el presupuesto y los errores típicos.', 'Disponible'),
      tarjeta('#/practica', '2', 'Práctica', 'Te toca una empresa distinta cada vez: clasifica sus redes, diséñala sobre el plano, haz la compra y prueba las averías. La web te corrige.', 'Sin nota'))) };
}
