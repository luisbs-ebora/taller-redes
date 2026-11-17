// inicio.js — Portada del Taller de Redes. Es fija: un acceso por tema, que sale de indice.js.
import { h } from '../util.js';
import { tarjetasDeTemas } from './temas.js';

export function vistaInicio() {
  return { el: h('section',
    h('div.inicio-cab',
      h('span.etiqueta', 'Redes locales · 1.º SMR'),
      h('h1', 'Taller de Redes'),
      h('p.lead', 'Diseña la red de una empresa: qué se compra, dónde va cada cosa y por qué. Empieza viendo cómo se monta una red completa paso a paso.')),
    tarjetasDeTemas()) };
}
