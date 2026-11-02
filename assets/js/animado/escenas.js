// escenas.js — Definiciones de las escenas animadas para vistas/animado.js.
import * as THREE from 'three';
import * as red from './red.js';
import * as rack from './rack.js';

const miles = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const euros = n => miles(n) + ' €';

export const ESCENA_RED = {
  construir: red.construirRed, animar: red.animarRed, ORDEN: red.ORDEN, VISTAS: red.VISTAS,
  rotulos: [
    ...Object.values(red.NAVES).map(n => [n.nombre, n.c.clone().add(new THREE.Vector3(0, 3.4, -n.D / 2)), 'nave']),
    ['Pedido de InfoTajo (muelle de carga)', new THREE.Vector3(0, 7.5, 54), 'nave'],
  ],
  hud: {
    cab: 'Pedido a InfoTajo', max: red.PRESUPUESTO, fmt: euros, prefijo: 'Compra: ',
    queda: v => 'Quedan ' + euros(v), pasa: v => 'Te pasas en ' + euros(v),
    resto: ([cod, , n, total]) => ` × ${miles(n)}${cod === 'FO-02' ? ' m' : ''} · ${total ? euros(total) : 'incluido'}`,
  },
  textos: {
    etiqueta: 'Proyecto · Tema 1', titulo: 'La red de Cerámicas Ribera del Tajo',
    lead: 'Una solución posible del proyecto, montada paso a paso: qué se compra, dónde va cada cosa y qué pasa si te equivocas.',
    aria: 'Maqueta en 3D del polígono con las tres naves y la tienda. Usa la lista de pasos para seleccionar.',
    pista: 'Toca una caja del pedido · arrastra para girar · rueda para acercar',
    finTitulo: '¡Red terminada!',
    finTexto: 'Armarios, cable y tomas, puestos, switches, servidor, impresora, Wi‑Fi, fibra entre naves e Internet. Cumple R1 a R4 y se queda en 29.285 €, por debajo de los 30.000 €. Es una solución posible: hay otras igual de válidas.',
    claseFinTitulo: '¡Red terminada: 29.285 €!',
    claseFinTexto: 'Armarios, cable y tomas, puestos, switches, servidor, impresora, Wi‑Fi, fibra entre naves e Internet. Cada nave en estrella y la red completa en árbol. Una avería en el taller no tumba las oficinas (R1). Es una solución posible: hay otras válidas.',
  },
};

export const ESCENA_RACK = {
  construir: rack.construirRack, animar: rack.animarRack, ORDEN: rack.ORDEN, VISTAS: rack.VISTAS,
  rotulos: rack.ROTULOS, escala: 0.22, sombra: 30, distancias: [6, 90], fondo: 0xe9e2d4,
  hud: {
    cab: 'Armario mural', max: rack.ALTURA_U, fmt: n => Math.round(n) + ' U', prefijo: 'Ocupa: ',
    queda: v => `Quedan ${Math.round(v)} U libres para ampliar`, pasa: v => `¡No cabe! Faltan ${Math.round(v)} U`,
    resto: ([, , n, u]) => ` × ${n}${u ? ' · ' + u + ' U' : ''}`,
  },
  textos: {
    etiqueta: 'Tema 2 · Sección 1', titulo: 'Monta el armario rack',
    lead: 'El armario de un aula de 20 puestos, paso a paso: canaleta, panel de parcheo, pasahilos, switch, bandeja, SAI y regleta. Mira qué pasa si te equivocas.',
    aria: 'Armario rack mural en 3D colgado en la pared del aula. Usa la lista de pasos para seleccionar.',
    pista: 'Toca una caja del material · arrastra para girar · rueda para acercar',
    finTitulo: '¡Armario montado!',
    finTexto: 'De arriba abajo: panel de parcheo, pasahilos, switch y bandeja con el router; abajo, lo pesado (SAI) y la regleta. 7 U ocupadas de 9: quedan 2 para ampliar. Cables fijos al panel, latiguillos cortos al switch y todo etiquetado.',
    claseFinTitulo: '¡Armario montado: 7 de 9 U!',
    claseFinTexto: 'De arriba abajo: panel de parcheo, pasahilos, switch, bandeja con el router, hueco de reserva, SAI y regleta. Lo pesado abajo. La toma 07 llega al puerto 07 del panel y, con un latiguillo, al puerto 7 del switch.',
  },
};
