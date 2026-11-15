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
// Nivel de ASIR (PAR, Tema 2, sección 3): el cable de consola invierte el orden de los pines.
export const TAREA_CONSOLA = { id: 'consola', texto: 'un cable de consola (rollover): en el segundo extremo, los mismos hilos en orden inverso', extremos: [] };

/** Lo que vería el tester: para cada pin del extremo 1, a qué pin del extremo 2 llega su hilo. */
export const leer = (e1, e2) => e1.map(h => e2.indexOf(h) + 1);
const CRUZADO = [3, 6, 1, 4, 5, 2, 7, 8];

/** Juzga un cable hecho por el alumno. */
export function juzgar(tarea, e1, e2) {
  const mapa = leer(e1, e2), n1 = normaDe(e1), n2 = normaDe(e2);
  const directo = mapa.every((p, i) => p === i + 1), cruzado = igual(mapa, CRUZADO) && n1 && n2;
  const invertido = mapa.every((p, i) => p === 8 - i);
  if (tarea.id === 'consola') return invertido
    ? { ok: true, mapa, texto: 'Cable de consola correcto: el tester marca 8-7-6-5-4-3-2-1. No es un cable Ethernet: sirve para configurar un switch o un router por su puerto de consola.' }
    : { ok: false, mapa, texto: 'No es un cable de consola: el pin 1 tiene que llegar al 8, el 2 al 7, el 3 al 6 y el 4 al 5. Pon en el segundo extremo los hilos del primero en orden inverso.' };
  if (invertido) return { ok: false, mapa, texto: 'Te ha salido un cable de consola (rollover): los pines van invertidos. No sirve como cable de red.' };
  const pedido = [...tarea.extremos].sort().join('') === [n1, n2].sort().join('');
  if (pedido) return { ok: true, mapa, texto: tarea.id === 'cruzado' ? 'Cable cruzado correcto: el tester marca 1-3, 2-6, 3-1 y 6-2, y el resto en orden.' : 'Cable correcto: las 8 luces se encienden en orden y los colores siguen la norma.' };
  if (cruzado) return { ok: false, mapa, texto: 'Te ha salido un cable cruzado: has puesto una norma distinta en cada extremo. Para un directo, la misma en los dos.' };
  if (directo && n1) return { ok: false, mapa, texto: `Es un cable directo T568${n1} bien hecho, pero no es lo que se pedía.` };
  if (directo) return { ok: false, mapa, texto: 'El tester enciende las 8 luces en orden porque los dos extremos son iguales, pero los colores no siguen ninguna norma: los pares no van donde deben (es un «par dividido») y el cable dará errores o no pasará de 100 Mbit/s. Repite el orden de la norma.' };
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

// ---------- Nivel de ASIR (PAR, Tema 2, sección 3) ----------
export const CABLES = [['directo', 'Directo'], ['cruzado', 'Cruzado'], ['consola', 'De consola (rollover)']];
const UNIONES = [
  ['un PC y un switch', 'directo', 'Son puertos de distinto tipo (MDI y MDI-X): cable directo.'],
  ['un router y un switch', 'directo', 'El router tiene puertos MDI, como un PC, y el switch MDI-X: cable directo.'],
  ['un PC y un hub', 'directo', 'El hub, como el switch, tiene puertos MDI-X: cable directo.'],
  ['dos PC entre sí', 'cruzado', 'Los dos transmiten por los pines 1-2: hay que cruzar los pares.'],
  ['dos switches entre sí', 'cruzado', 'Puertos del mismo tipo (MDI-X con MDI-X): cable cruzado.'],
  ['dos routers entre sí', 'cruzado', 'Puertos del mismo tipo (MDI con MDI): cable cruzado.'],
  ['un PC conectado directamente a un router', 'cruzado', 'El PC y el router tienen los dos puertos MDI: cable cruzado.'],
  ['el puerto serie de un portátil y el puerto de consola de un switch', 'consola', 'Para configurar el equipo por terminal se usa el cable de consola, que no es un cable Ethernet.'],
  ['un PC y el puerto de consola de un router que aún no tiene IP', 'consola', 'Sin IP no se puede entrar por la red: se entra por el puerto de consola con un cable rollover.'],
];
export const COMPROBADORES = ['Comprobador de continuidad', 'Cualificador', 'Certificador', 'Generador de tono y sonda', 'Reflectómetro (TDR)'];
const TRABAJOS = [
  ['Acabas de crimpar un latiguillo y quieres saber si cada hilo llega a su pin.', 0, 'El comprobador de continuidad (wiremap) detecta abiertos, cortos e hilos cruzados.'],
  ['Quieres saber si un cable que ya está instalado aguanta 1 Gbit/s.', 1, 'El cualificador dice si un enlace soporta una velocidad concreta.'],
  ['Tienes que entregar una instalación nueva garantizando que cumple su categoría.', 2, 'Solo el certificador mide todos los parámetros de la norma y da PASS o FAIL.'],
  ['Hay un mazo de cables sin etiquetar y necesitas saber cuál llega a una toma.', 3, 'El generador mete un tono en el cable y la sonda lo encuentra en el otro extremo.'],
  ['Un cable largo está cortado dentro de la canalización y quieres saber a cuántos metros.', 4, 'El reflectómetro mide la distancia hasta el corte.'],
];
export const DIAGNOSTICOS_ASIR = [...DIAGNOSTICOS, ['consola', 'Cable de consola (rollover)']];
export function crearAsir(semilla) {
  const r = azar(semilla), u = [...UNIONES], t = [...TRABAJOS], saca = l => l.splice(r.n(0, l.length - 1), 1)[0];
  const uniones = [saca(u), saca(u), saca(u), saca(u)];
  if (!uniones.some(x => x[1] === 'consola')) uniones[r.n(0, 3)] = r.de(UNIONES.filter(x => x[1] === 'consola'));
  const lecturas = [{ tipo: 'consola', luces: Array.from({ length: 8 }, (_, i) => [8 - i]), causa: 'En la remota se encienden 8-7-6-5-4-3-2-1: es un cable de consola, con los pines invertidos.' }, ...crearLecturas(semilla + 1).filter(l => l.tipo === 'cruzado' || l.tipo === 'abierto').slice(0, 1)];
  if (r.prob(0.5)) lecturas.reverse();
  return { uniones, trabajos: [saca(t), saca(t)], lecturas };
}
