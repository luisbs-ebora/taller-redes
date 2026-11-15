// Latiguillo.js — «Haz el latiguillo y pásale el tester» (Redes locales, Tema 2, sección 4).
// Normas T568A y T568B, cable directo y cruzado, y lo que dice el tester (tabla 6.2 de los apuntes).
import { azar } from './Analiza.js';

export const HILOS = {
  bn: 'Blanco-naranja', n: 'Naranja', bv: 'Blanco-verde', a: 'Azul', ba: 'Blanco-azul', v: 'Verde', bm: 'Blanco-marrón', m: 'Marrón',
};
export const T568A = ['bv', 'v', 'bn', 'a', 'ba', 'n', 'bm', 'm'];
export const T568B = ['bn', 'n', 'bv', 'a', 'ba', 'v', 'bm', 'm'];
const igual = (x, y) => x.every((h, i) => h === y[i]);
export const normaDe = extremo => igual(extremo, T568B) ? 'B' : igual(extremo, T568A) ? 'A' : null;

export const TAREAS = [
  { id: 'directoB', texto: 'un cable directo con la norma T568B', extremos: ['B', 'B'] },
  { id: 'directoA', texto: 'un cable directo con la norma T568A', extremos: ['A', 'A'] },
  { id: 'cruzado', texto: 'un cable cruzado (T568A en un extremo y T568B en el otro)', extremos: ['A', 'B'] },
];

/** Lo que vería el tester: para cada pin del extremo 1, a qué pin del extremo 2 llega su hilo. */
export const leer = (e1, e2) => e1.map(h => e2.indexOf(h) + 1);
const CRUZADO = [3, 6, 1, 4, 5, 2, 7, 8];

/** Juzga un cable hecho por el alumno. */
export function juzgar(tarea, e1, e2) {
  const mapa = leer(e1, e2), n1 = normaDe(e1), n2 = normaDe(e2);
  const directo = mapa.every((p, i) => p === i + 1), cruzado = igual(mapa, CRUZADO) && n1 && n2;
  const pedido = [...tarea.extremos].sort().join('') === [n1, n2].sort().join('');
  if (pedido) return { ok: true, mapa, texto: tarea.id === 'cruzado' ? 'Cable cruzado correcto: el tester marca 1-3, 2-6, 3-1 y 6-2, y el resto en orden.' : 'Cable correcto: las 8 luces se encienden en orden y los colores siguen la norma.' };
  if (cruzado) return { ok: false, mapa, texto: 'Te ha salido un cable cruzado: has puesto una norma distinta en cada extremo. Para un directo, la misma en los dos.' };
  if (directo && n1) return { ok: false, mapa, texto: `Es un cable directo T568${n1} bien hecho, pero no es lo que se pedía.` };
  if (directo) return { ok: false, mapa, texto: 'El tester enciende las 8 luces en orden porque los dos extremos son iguales, pero los colores no siguen ninguna norma: los pares no van donde deben y el cable dará problemas. Repite el orden de la norma.' };
  const mal = mapa.map((p, i) => p !== i + 1 ? i + 1 : 0).filter(Boolean);
  return { ok: false, mapa, texto: `Hilos cruzados: los pines ${mal.join(', ')} no llegan a su sitio. Te has equivocado de orden en un extremo.` };
}

// Lecturas del tester para diagnosticar. Cada luz: pin del extremo 1 → pines que se encienden en el extremo 2.
export const DIAGNOSTICOS = [
  ['bien', 'Cable correcto'], ['abierto', 'Hilo abierto (no hace contacto)'], ['cruzados', 'Hilos cruzados'], ['corto', 'Cortocircuito entre dos hilos'], ['cruzado', 'Cable cruzado (A-B)'],
];
const CAUSAS = {
  bien: 'Las 8 luces se encienden en orden: 1-1, 2-2… 8-8.',
  abierto: 'Falta una luz: ese hilo no hace contacto. Lo normal es que no llegara al fondo del conector o que la crimpadora no apretara bien.',
  cruzados: 'Dos luces se cambian de orden: te equivocaste de orden en un extremo. Hay que cortar ese conector y repetirlo.',
  corto: 'Se encienden dos luces a la vez: hay un hilo pelado o mal cortado que toca a otro.',
  cruzado: 'Marca 1-3, 2-6, 3-1 y 6-2: es un cable cruzado, con una norma distinta en cada extremo. No es una avería si es lo que se quería.',
};
export function crearLecturas(semilla, cuantas = 5) {
  const r = azar(semilla), tipos = ['abierto', 'cruzados', 'corto', 'cruzado', 'bien'], orden = [];
  while (tipos.length) orden.push(tipos.splice(r.n(0, tipos.length - 1), 1)[0]);
  return orden.slice(0, cuantas).map(tipo => {
    const luces = Array.from({ length: 8 }, (_, i) => [i + 1]);
    if (tipo === 'abierto') luces[r.n(0, 7)] = [];
    if (tipo === 'cruzados') { const [x, y] = r.de([[1, 2], [4, 5], [7, 8], [3, 6], [5, 6], [2, 3]]); luces[x - 1] = [y]; luces[y - 1] = [x]; }
    if (tipo === 'corto') { const x = r.n(1, 7); luces[x - 1] = [x, x + 1]; luces[x] = [x, x + 1]; }
    if (tipo === 'cruzado') CRUZADO.forEach((p, i) => { luces[i] = [p]; });
    return { tipo, luces, causa: CAUSAS[tipo] };
  });
}
