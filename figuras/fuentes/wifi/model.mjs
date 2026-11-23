// La Wi‑Fi de un piso: cuánta señal llega a cada punto y qué pasa con las redes de los vecinos.
// Todo lo que enseña la figura sale de aquí. Las distancias van en metros y las potencias en dBm.
//
// OJO, VALORES ORIENTATIVOS. Son números de manual para que el modelo se comporte como una casa de verdad,
// no medidas de este piso, y por eso la figura no los enseña como datos exactos:
//  · POTENCIA: 20 dBm (100 mW), la misma en las dos bandas para que solo cambie la frecuencia.
//  · PERDIDA por pared: del orden de las tablas de fabricantes (pladur 3‑4 dB en 2,4 GHz y 3‑5 dB en 5 GHz;
//    ladrillo u hormigón de 6 a 18 dB en 2,4 GHz y de 10 a 30 dB en 5 GHz). Para el acuario no hay tabla:
//    se ha puesto algo más que una persona (3 dB y 6 dB), porque el agua absorbe las ondas.
//  · DATOS (cuánto puede llevar cada banda) y los factores de interferencia: solo ordenan los casos
//    (5 GHz lleva más que 2,4 GHz; solaparse es peor que compartir canal). En pantalla salen como una barra.
//  · MICROONDAS: se trata como una fuente de ruido de 1 mW en 2,4 GHz.

export const PISO = { ancho: 12, fondo: 8 };          // interior del piso, en metros
export const ROUTER = [0.65, 1.35];                    // sobre el mueble del salón
export const MICROONDAS = [11.2, 0.28];                // en la encimera de la cocina
export const POTENCIA = 20;                            // dBm que emite el router
export const POTENCIA_MICRO = 0;                       // dBm de ruido que deja escapar el microondas

export const PERDIDA = {
  pladur: { "2.4": 3, "5": 4 },
  ladrillo: { "2.4": 8, "5": 13 },
  hormigon: { "2.4": 18, "5": 30 },
  agua: { "2.4": 6, "5": 10 },
};
export const NOMBRE_MATERIAL = { pladur: "pladur", ladrillo: "ladrillo", hormigon: "hormigón", agua: "agua" };

// Paredes interiores, por su eje. Los huecos de las puertas no están: por una puerta abierta la señal pasa.
export const PAREDES = [
  { a: [5, 0], b: [5, 5.6], m: "ladrillo" },          // salón | pasillo
  { a: [5, 6.6], b: [5, 8], m: "ladrillo" },
  { a: [6.4, 0], b: [6.4, 1.0], m: "pladur" },        // pasillo | cocina y habitaciones
  { a: [6.4, 1.9], b: [6.4, 3.4], m: "pladur" },
  { a: [6.4, 4.3], b: [6.4, 6.2], m: "pladur" },
  { a: [6.4, 7.1], b: [6.4, 8], m: "pladur" },
  { a: [6.4, 2.6], b: [12, 2.6], m: "pladur" },       // cocina | habitación 1
  { a: [6.4, 5.3], b: [12, 5.3], m: "hormigon" },     // habitación 1 | habitación 2: muro de carga
];
// El acuario del salón: una caja llena de agua.
export const ACUARIO = { x0: 2.6, x1: 3.8, y0: 5.3, y1: 5.7 };

// Sitios donde se puede dejar el móvil.
export const SITIOS = [
  { id: "sofa", nombre: "Salón", en: [2.9, 2.8] },
  { id: "acuario", nombre: "Detrás del acuario", en: [3.3, 6.6] },
  { id: "pasillo", nombre: "Pasillo", en: [5.7, 4.4] },
  { id: "cocina", nombre: "Cocina", en: [9.2, 1.5] },
  { id: "hab1", nombre: "Habitación 1", en: [9.4, 4.2] },
  { id: "fondo", nombre: "Habitación del fondo", en: [9.4, 6.9] },
];

/* ---------- Canales ---------- */
// 2,4 GHz: 13 canales separados 5 MHz; cada uno ocupa unos 22 MHz.
export const CANALES_24 = 13;
export const ANCHO_24 = 22;
export const centro24 = (canal) => 2412 + 5 * (canal - 1);
// 5 GHz: canales de 20 MHz, uno al lado de otro, sin pisarse.
export const CANALES_5 = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140];
export const ANCHO_5 = 20;
export const centro5 = (canal) => 5000 + 5 * canal;
export const MI_CANAL_5 = 36;
export const VECINOS_5 = [44, 52, 60];                // en 5 GHz cada vecino cae en un canal libre
export const frecuencia = (banda, canal) => (banda === "5" ? centro5(MI_CANAL_5) : centro24(canal));

// Altura de la «campana» de un canal de 2,4 GHz en la frecuencia f (de 0 a 1).
export const campana = (f, canal) => {
  const d = Math.abs(f - centro24(canal));
  return d >= ANCHO_24 / 2 ? 0 : Math.cos((Math.PI * d) / ANCHO_24) ** 2;
};
// Fracción del espectro que comparten dos canales de 2,4 GHz (0 = no se tocan, 1 = el mismo canal).
export const solape = (a, b) => Math.max(0, ANCHO_24 - 5 * Math.abs(a - b)) / ANCHO_24;
// Cómo se llevan dos redes de 2,4 GHz:
//  · mismo canal → se escuchan y se turnan;  · de 1 a 4 números de distancia → se solapan: ruido;
//  · 5 o más → ninguna molesta a la otra.
export const relacion = (a, b) => {
  const d = Math.abs(a - b);
  return d === 0 ? "turnos" : d < 5 ? "ruido" : "libre";
};

/* ---------- Atenuación ---------- */
// Pérdida en espacio libre: FSPL(dB) = 20·log10(d en m) + 20·log10(f en MHz) − 27,55
export const fspl = (metros, mhz) => 20 * Math.log10(Math.max(metros, 0.3)) + 20 * Math.log10(mhz) - 27.55;

// Punto donde el tramo p→q corta al tramo a→b, como fracción de p→q (o null si no se cortan).
function corte(p, q, a, b) {
  const rx = q[0] - p[0], ry = q[1] - p[1], sx = b[0] - a[0], sy = b[1] - a[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((a[0] - p[0]) * sy - (a[1] - p[1]) * sx) / den;
  const u = ((a[0] - p[0]) * ry - (a[1] - p[1]) * rx) / den;
  return t > 1e-9 && t < 1 - 1e-9 && u >= 0 && u <= 1 ? t : null;
}

// Lo que cruza la línea recta entre dos puntos: paredes y, si se pone en medio, el acuario.
// Devuelve cada cruce con su material, el punto y la distancia desde el origen, ordenados.
export function cruces(desde, hasta) {
  const largo = Math.hypot(hasta[0] - desde[0], hasta[1] - desde[1]);
  const lista = [];
  const punto = (t) => [desde[0] + (hasta[0] - desde[0]) * t, desde[1] + (hasta[1] - desde[1]) * t];
  for (const pared of PAREDES) {
    const t = corte(desde, hasta, pared.a, pared.b);
    if (t !== null) lista.push({ m: pared.m, en: punto(t), d: t * largo });
  }
  const A = ACUARIO;
  const lados = [[[A.x0, A.y0], [A.x1, A.y0]], [[A.x1, A.y0], [A.x1, A.y1]], [[A.x1, A.y1], [A.x0, A.y1]], [[A.x0, A.y1], [A.x0, A.y0]]];
  const cortes = lados.map(([a, b]) => corte(desde, hasta, a, b)).filter((t) => t !== null).sort((x, y) => x - y);
  if (cortes.length) lista.push({ m: "agua", en: punto(cortes[0]), d: cortes[0] * largo });
  return lista.sort((x, y) => x.d - y.d);
}

// Señal que llega a un punto: lo que emite la fuente, menos el camino por el aire, menos cada pared.
export function llega(desde, hasta, banda, mhz, potencia) {
  const d = Math.hypot(hasta[0] - desde[0], hasta[1] - desde[1]);
  const cruza = cruces(desde, hasta);
  const paredes = cruza.reduce((suma, c) => suma + PERDIDA[c.m][banda], 0);
  return { dbm: potencia - fspl(d, mhz) - paredes, d, cruza, paredes };
}
export const senal = (donde, banda, canal) => llega(ROUTER, donde, banda, frecuencia(banda, canal), POTENCIA);

// Etiquetas de cobertura. Cada una tiene un valor de referencia; se pone la que queda más cerca.
export const COBERTURA = [
  { nombre: "Excelente", ref: -30, barras: 4, rinde: 1 },
  { nombre: "Buena", ref: -67, barras: 3, rinde: 0.8 },
  { nombre: "Justa", ref: -70, barras: 2, rinde: 0.5 },
  { nombre: "Muy débil", ref: -80, barras: 1, rinde: 0.2 },
  { nombre: "Sin conexión", ref: -90, barras: 0, rinde: 0 },
];
export const cobertura = (dbm) => COBERTURA.reduce((mejor, c) => (Math.abs(dbm - c.ref) < Math.abs(dbm - mejor.ref) ? c : mejor));

/* ---------- Interferencias y datos ---------- */
export const DATOS = { "2.4": 0.5, "5": 1 };          // a más frecuencia, más datos
export const FACTOR_RUIDO = 0.2;                       // un vecino en un canal solapado
export const MARGEN_FUERTE = 10;                       // dB: el microondas llega casi tan fuerte como el router
export const MARGEN_ALGO = 25;

// Qué le pasa a tu red con los vecinos (lista de canales, null = ese vecino no tiene red) y el microondas.
export function interferencias({ banda, canal, vecinos, micro, donde }) {
  const fuera = { turnos: 0, ruido: 0, libres: 0, micro: "no", factor: 1, vecinos: [] };
  const hay = vecinos.filter((v) => v !== null && v !== undefined);
  if (banda === "5") return { ...fuera, libres: hay.length, vecinos: vecinos.map((v) => (v == null ? null : "libre")) };
  const como = vecinos.map((v) => (v == null ? null : relacion(canal, v)));
  const turnos = como.filter((c) => c === "turnos").length;
  const ruido = como.filter((c) => c === "ruido").length;
  let factor = (1 / (1 + turnos)) * FACTOR_RUIDO ** ruido;   // turnarse reparte el tiempo; el ruido estropea mucho más
  let estado = "no";
  if (micro) {
    const s = senal(donde, banda, canal).dbm;
    const r = llega(MICROONDAS, donde, banda, 2450, POTENCIA_MICRO).dbm;
    estado = s - r < MARGEN_FUERTE ? "fuerte" : s - r < MARGEN_ALGO ? "algo" : "no";
    factor *= estado === "fuerte" ? 0.15 : estado === "algo" ? 0.5 : 1;
  }
  return { turnos, ruido, libres: como.filter((c) => c === "libre").length, micro: estado, factor, vecinos: como };
}

// Cuántos datos puede llevar el enlace, de 0 a 1: la banda, por la cobertura, por las interferencias.
export function datos({ banda, canal, vecinos, micro, donde }) {
  const s = senal(donde, banda, canal);
  return DATOS[banda] * cobertura(s.dbm).rinde * interferencias({ banda, canal, vecinos, micro, donde }).factor;
}
