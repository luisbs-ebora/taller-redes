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
    h('h2.tema-tit', h('span.etiqueta', 'Tema 1'), ' Introducción a las redes locales'),
    h('div.rejilla',
      tarjeta('#/animado', '1', 'Red animada', 'La red de Cerámicas Ribera del Tajo montada paso a paso, con el presupuesto y los errores típicos.', 'Disponible'),
      tarjeta('#/mapas', '2', 'Mapa físico y diagrama lógico', 'Las oficinas de Cerámicas dibujadas de las dos formas: toca un equipo y mira cómo sale en cada una.', 'Disponible'),
      tarjeta('#/practica', '3', 'Práctica: diseña una red', 'Te toca una empresa distinta cada vez, de tres sedes o pequeña: clasifica sus redes, diséñala sobre el plano y haz la compra. La web te corrige.', 'Sin nota')),
    h('h2.tema-tit', h('span.etiqueta', 'Tema 2'), ' Medios de transmisión y espacios físicos'),
    h('div.rejilla',
      tarjeta('#/rack', '1', 'Armario rack', 'Monta el armario de un aula de 20 puestos: panel de parcheo, pasahilos, switch, SAI y regleta, cada cosa en su U.', 'Disponible'),
      tarjeta('figuras/fibra-optica.html', '2', 'Fibra óptica por dentro', 'Una fibra cortada a lo largo: gira el láser, mira cómo rebota la luz en el núcleo, cuándo se escapa y por qué el monomodo llega más lejos.', 'Disponible')),
    h('h2.tema-tit', h('span.etiqueta', '1.º ASIR · PAR'), ' Tema 1 · Caracterización de redes de datos'),
    h('div.rejilla',
      tarjeta('figuras/csma-cd.html', '1', 'CSMA/CD con un hub', 'Cuatro equipos y un hub: haz que envíen a la vez y sigue la colisión, la señal de atasco y la espera al azar de cada uno.', 'Disponible'))) };
}
