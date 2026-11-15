// Medio.js — «Elige el medio» (Redes locales, Tema 2, secciones 2 y 3): casos de clientes generados con semilla
// y las reglas de los canales Wi‑Fi de 2,4 GHz. Las respuestas siguen los apuntes: par trenzado hasta 100 m,
// Cat 6 lo habitual, Cat 6A para 10 Gbps a 100 m, Cat 8 en distancias muy cortas, apantallado o fibra si hay
// interferencias, fibra multimodo dentro del edificio y monomodo en distancias largas; 2,4 GHz llega más lejos
// y 5 GHz lleva más datos; microondas con visión directa, satélite donde no hay nada, Bluetooth e infrarrojos.
import { azar } from './Analiza.js';

export const MEDIOS = [
  ['utp6', 'Par trenzado Cat 6 sin apantallar (UTP)'],
  ['cat6a', 'Par trenzado Cat 6A'],
  ['stp', 'Par trenzado apantallado (FTP o S/FTP)'],
  ['cat8', 'Par trenzado Cat 8'],
  ['fmm', 'Fibra óptica multimodo'],
  ['fsm', 'Fibra óptica monomodo'],
  ['coax', 'Cable coaxial'],
  ['wifi24', 'Wi‑Fi en 2,4 GHz'],
  ['wifi5', 'Wi‑Fi en 5 GHz'],
  ['micro', 'Radioenlace de microondas'],
  ['sat', 'Satélite'],
  ['bt', 'Bluetooth'],
  ['ir', 'Infrarrojos'],
];
export const nombreMedio = id => MEDIOS.find(m => m[0] === id)[1];

// Cada plantilla devuelve el enunciado, las respuestas buenas, las que también funcionarían (con su pega) y el porqué.
const PLANTILLAS = [
  r => { const n = r.n(8, 24), d = r.n(25, 85), sitio = r.de(['una gestoría', 'una academia', 'una oficina de seguros', 'un aula de informática']);
    return { texto: `En ${sitio} hay que cablear ${n} puestos fijos. El más lejano queda a ${d} m del armario y basta con 1 Gbps.`, buenas: ['utp6'], valen: { cat6a: 'Funcionaría, pero es más cara y aquí no hace falta 10 Gbps.' }, porque: `Menos de 100 m, 1 Gbps y sin interferencias: par trenzado Cat 6, lo habitual en instalaciones nuevas.` }; },
  r => { const d = r.n(70, 100), que = r.de(['el servidor de archivos', 'el equipo de edición de vídeo', 'la cabina de copias de seguridad']);
    return { texto: `Hay que conectar ${que} al switch con cobre a 10 Gbps. El cable medirá ${d} m.`, buenas: ['cat6a'], valen: {}, porque: `La Cat 6 solo da 10 Gbps hasta unos 55 m; para 10 Gbps a ${d} m hace falta Cat 6A.` }; },
  r => { const d = r.n(30, 90), que = r.de(['máquinas de soldar', 'motores eléctricos grandes', 'hornos de inducción']);
    return { texto: `En una nave, el cable de red tiene que pasar ${d} m junto a ${que}. Basta con 1 Gbps.`, buenas: ['stp', 'fmm'], valen: {}, porque: `Esas máquinas producen interferencias. Sirve el par trenzado apantallado, que lleva una pantalla metálica contra el ruido, o la fibra, porque a la luz no le afectan las interferencias eléctricas.` }; },
  r => { const d = r.n(15, 35) * 10;
    return { texto: `En un edificio grande hay que unir el armario de la planta baja con el de la última planta. El recorrido del cable es de ${d} m.`, buenas: ['fmm'], valen: { fsm: 'Llegaría de sobra, pero es más cara y aquí no hace falta.' }, porque: `Son más de 100 m, así que el par trenzado no llega. Dentro de un edificio, entre armarios, se usa fibra multimodo, que alcanza unos cientos de metros.` }; },
  r => { const d = r.n(3, 40);
    return { texto: `Una empresa quiere unir por cable su sede con un almacén que está a ${d} km. Hay canalización hecha entre los dos.`, buenas: ['fsm'], valen: {}, porque: `A ${d} km solo llega la fibra monomodo, que es la de las distancias largas (kilómetros).` }; },
  r => { const d = r.n(1, 5);
    return { texto: `Dos naves de una empresa están separadas ${d} km, se ven una a otra y no se puede abrir zanja entre ellas.`, buenas: ['micro'], valen: {}, porque: `Sin poder tender cable y con visión directa entre las dos, se pone un radioenlace de microondas: dos antenas, una frente a otra.` }; },
  r => { const sitio = r.de(['un cortijo', 'una casa rural', 'un refugio de montaña']);
    return { texto: `Hay que dar Internet a ${sitio} aislado, sin cable de ningún operador y sin cobertura móvil.`, buenas: ['sat'], valen: {}, porque: `Donde no llega ni el cable ni el móvil queda el satélite: cubre zonas enormes, aunque con más retardo.` }; },
  r => { const p = r.n(2, 4);
    return { texto: `En tu habitación, al fondo del piso y con ${p} paredes entre el router y tú, solo quieres mirar el correo con el portátil.`, buenas: ['wifi24'], valen: {}, porque: `La frecuencia más baja llega más lejos y atraviesa mejor las paredes. Lleva menos datos, pero para el correo sobra.` }; },
  r => { const que = r.de(['ver una película en 4K', 'una videollamada con mucha gente', 'descargar un juego de 80 GB']);
    return { texto: `Estás en el salón, a dos metros del router y sin paredes en medio, y quieres ${que} con el portátil, sin cable.`, buenas: ['wifi5'], valen: {}, porque: `La frecuencia más alta transporta más datos. Llega menos lejos, pero estás al lado del router.` }; },
  r => { const que = r.de(['unos auriculares', 'un ratón sin cable', 'un reloj inteligente']);
    return { texto: `Quieres conectar ${que} al móvil o al portátil, a un metro de distancia.`, buenas: ['bt'], valen: {}, porque: `Para dispositivos personales a corta distancia se usa Bluetooth: una red de área personal (PAN).` }; },
  r => { const que = r.de(['la televisión', 'el proyector del aula', 'el aire acondicionado']);
    return { texto: `Hay que cambiar de canal o de modo en ${que} desde el mando a distancia.`, buenas: ['ir'], valen: {}, porque: `Los mandos usan infrarrojos: poco alcance, con visión directa y sin atravesar paredes.` }; },
  r => { const que = r.de(['la antena de la azotea', 'la parabólica']);
    return { texto: `En una vivienda hay que llevar la señal de televisión desde ${que} hasta la toma del salón.`, buenas: ['coax'], valen: {}, porque: `La señal de televisión viaja por cable coaxial. En redes locales ya no se usa.` }; },
  r => { const v = r.de([25, 40]), d = r.n(1, 3);
    return { texto: `En un centro de datos hay que unir con cobre dos switches del mismo armario, a ${d} m uno de otro, a ${v} Gbps.`, buenas: ['cat8'], valen: {}, porque: `La Cat 8 da 25 o 40 Gbps, pero solo hasta 30 m: es para conexiones muy cortas entre equipos.` }; },
];

export function crearTanda(semilla, cuantos = 6) {
  const r = azar(semilla), resto = PLANTILLAS.map((p, i) => i), casos = [];
  while (casos.length < cuantos) casos.push(PLANTILLAS[resto.splice(r.n(0, resto.length - 1), 1)[0]](r));
  return { semilla, casos };
}
export function corregirCaso(caso, id) {
  if (caso.buenas.includes(id)) return { ok: true, nota: '' };
  if (caso.valen[id]) return { ok: true, nota: caso.valen[id] };
  return { ok: false, nota: '' };
}

// Canales de 2,4 GHz: 13 canales separados 5 MHz; cada uno ocupa unos 22 MHz, así que dos canales
// se pisan si están a menos de 5 de distancia.
export const CANALES = 13, ANCHO = 22;
export const centro = canal => 2412 + 5 * (canal - 1);
export const sePisan = (a, b) => Math.abs(a - b) < 5;
export function crearEdificio(semilla) {
  const r = azar(semilla), tres = [1, 6, 11], libre = tres.splice(r.n(0, 2), 1)[0];
  const pisados = Array.from({ length: CANALES }, (_, i) => i + 1).filter(c => !tres.includes(c) && tres.some(v => sePisan(v, c)));
  return { vecinos: tres, libre, tuyo: r.de(pisados) };
}
