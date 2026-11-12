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
      tarjeta('#/mapas', '2', 'Mapa físico y diagrama lógico', 'Las oficinas de Cerámicas dibujadas de las dos formas: toca un equipo y mira cómo sale en cada una. Tema 1.', 'Disponible'),
      tarjeta('#/rack', '3', 'Armario rack', 'Monta el armario de un aula de 20 puestos: panel de parcheo, pasahilos, switch, SAI y regleta, en su U. Tema 2.', 'Disponible'),
      tarjeta('#/practica', '4', 'Práctica', 'Te toca una empresa distinta cada vez, de tres sedes o pequeña: clasifica sus redes, diséñala sobre el plano y haz la compra. La web te corrige.', 'Sin nota'))) };
}
