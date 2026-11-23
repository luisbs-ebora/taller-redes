// La Wi‑Fi por dentro: maqueta de un piso visto desde arriba, con el router en el salón, y el espectro debajo.
// ANATOMY=/ruta/al/clon node build.mjs  →  ../../wifi.html (con la cabecera y los colores del taller)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./model.mjs";
import { paginaTaller, mat } from "../marco.mjs";

// La skill Anatomy (MIT, github.com/wheresryan22/anatomy) no va en este repo: indica dónde la tienes clonada.
const ANATOMY = process.env.ANATOMY ?? "/home/claude/terceros/anatomy";
const k = await import(`${ANATOMY}/kit/iso-kit.mjs`);
const { kitScript } = await import(`${ANATOMY}/scripts/inline-kit.mjs`);

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 720;
const HEIGHT = 470;

// Mundo: 20 unidades por metro. x hacia la derecha, y hacia el espectador, z arriba.
const U = 20;
const W = M.PISO.ancho * U;      // 240
const D = M.PISO.fondo * U;      // 160
const H = 10;                    // altura a la que están cortadas las paredes (medio metro)
const T_EXT = 3;                 // grosor de las paredes de fuera
const GROSOR = { pladur: 2, ladrillo: 3, hormigon: 5 };
const MAT_PARED = { pladur: "blanco", ladrillo: "naranja", hormigon: "hormigon" };
const PLATE = { x: -18, y: -18, w: W + 36, d: D + 48, r: 7 };
const PLATE_H = 7;
const FOOT_H = 4;
const MOVIL = { z0: 17, alto: 17, ancho: 9, grueso: 1.8 };   // el móvil va «en la mano», por encima de las paredes

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners({ x: 0, y: 0, w: W, d: D }, 0, MOVIL.z0 + MOVIL.alto + 6)],
  WIDTH,
  HEIGHT,
  { pad: 16, azimuth: 60, elevation: 50 },   // desde bastante arriba, para ver dentro de las habitaciones
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dt = (points, style) => k.dotsSvg(points, style);
const fill = (cls, points, z) => `<path class="${cls}" d="${k.onTop(points, z, P, true)}"/>`;
const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const caja = (x, y, w, d, z, h, { tone = "hi", r = 0.6, bevel = 0.4, crease, inner } = {}) => S(k.slabOf({ x, y, w, d, r }, z, h, P, 4, bevel), { tone, crease, inner });
// Una cara que mira al espectador (plano y = constante): puntos [x, z].
const frente = (cls, y, puntos, extra = "") => `<path class="${cls}"${extra} d="${k.pathOf(puntos.map(([x, z]) => at([x, y, z])), true)}"/>`;

/* ---------- La base de la maqueta ---------- */
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 20).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(mat("grafito", S(k.cylinder(x, y, 6.5, -PLATE_H - FOOT_H, 1.4, P, 28), { tone: "hi" }) + S(k.cylinder(x, y, 5, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "hi" })));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "hi" }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 4.5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9.5);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dt(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Regla a lo largo del piso: una marca cada medio metro, mayor cada metro.
  const strip = { x: -3, y: D + 12, w: W + 6, d: 7, r: 1 };
  const ticks = k.topTicks(0, W, U / 2, 2, strip.y + 0.25, 0.6, [2.2, 4], P);
  out.push(mat("crema",
    S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "hi", crease: "none" }) + Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" }) +
    k.faceTextSvg(k.topMatrix([U + 1.5, strip.y + 6.3], 0.6, P, "x"), "1 m", { size: 3.4, tone: "mid" }) +
    Dt([at([strip.x + 1.3, strip.y + 5.4, 0.6]), at([strip.x + strip.w - 1.3, strip.y + 5.4, 0.6])], { size: 0.4 })));
  return out.join("");
}

/* ---------- El suelo: lo que queda debajo de las ondas ---------- */
const X1 = 5 * U, X2 = 6.4 * U, Y3 = 2.6 * U, Y4 = 5.3 * U;   // ejes de las paredes de dentro
function suelo() {
  const out = [];
  out.push(fill("wf-suelo", rect(-T_EXT, W + T_EXT, -T_EXT, D + T_EXT), 0));
  out.push(fill("wf-madera", rect(0, X1, 0, D), 0.02), fill("wf-madera", rect(X2, W, Y3, D), 0.02));
  out.push(fill("wf-baldosa", rect(X2, W, 0, Y3), 0.02), fill("wf-terrazo", rect(X1, X2, 0, D), 0.02));
  // Tablas del salón y de las habitaciones: de pared a pared.
  let tablas = "";
  for (let y = 10; y < D; y += 10) tablas += k.lineOnTop([0, y], [X1 - 1.5, y], 0.03, P);
  for (let y = Y3 + 8; y < D; y += 10) if (Math.abs(y - Y4) > 4) tablas += k.lineOnTop([X2 + 1, y], [W, y], 0.03, P);
  out.push(Ln(tablas, { tone: "faint" }));
  // Baldosas de la cocina y del pasillo.
  let baldosas = "";
  for (let x = X2 + 12; x < W; x += 12) baldosas += k.lineOnTop([x, 0], [x, Y3 - 1], 0.03, P);
  for (let y = 12; y < Y3 - 1; y += 12) baldosas += k.lineOnTop([X2 + 1, y], [W, y], 0.03, P);
  for (let y = 14; y < D; y += 14) baldosas += k.lineOnTop([X1 + 1.5, y], [X2 - 1, y], 0.03, P);
  out.push(Ln(baldosas, { tone: "faint" }));
  // Alfombra del salón y felpudo de la entrada.
  out.push(fill("wf-alfombra", rect(30, 86, 40, 92), 0.05) + Ln(k.planOutline({ x: 30, y: 40, w: 56, d: 52, r: 2 }, 0.05, P) + k.planOutline({ x: 33, y: 43, w: 50, d: 46, r: 1 }, 0.05, P), { tone: "lo" }));
  out.push(fill("wf-felpudo", rect(106, 122, 146, 156), 0.05) + Ln(k.planOutline({ x: 106, y: 146, w: 16, d: 10, r: 1 }, 0.05, P), { tone: "lo" }));
  // Puertas: la hoja abierta y el arco que barre.
  const puerta = (bx, by, ancho, a0, a1) => {
    const arco = [];
    for (let i = 0; i <= 12; i++) { const a = ((a0 + ((a1 - a0) * i) / 12) * Math.PI) / 180; arco.push([bx + ancho * Math.cos(a), by + ancho * Math.sin(a)]); }
    return Ln(k.onTop(arco, 0.04, P), { tone: "lo", dotted: true }) + Ln(k.lineOnTop([bx, by], arco[arco.length - 1], 0.04, P), { tone: "mid" });
  };
  out.push(puerta(X2, 1.0 * U, 18, 90, 0), puerta(X2, 3.4 * U, 18, 90, 0), puerta(X2, 6.2 * U, 18, 90, 0), puerta(104, D, 20, 0, -90));
  // Nombres de las habitaciones, escritos en el suelo.
  // (cada uno en un hueco libre del suelo que no tapan ni los muebles ni la pared que tiene delante)
  const nombre = (x, y, texto, eje = "x") => k.faceTextSvg(k.topMatrix([x, y], 0.05, P, eje), texto, { size: 6, tone: "mid" });
  out.push(nombre(52, 112, "SALÓN"), nombre(116, 40, "PASILLO", "y"), nombre(140, 36, "COCINA"), nombre(144, 92, "HABITACIÓN 1"), nombre(144, 150, "HABITACIÓN 2"));
  // Sitios donde dejar el móvil.
  out.push(`<g class="wf-sitios-suelo">${M.SITIOS.map((s) => `<path class="wf-sitio" data-sitio="${s.id}" d="${k.ring(s.en[0] * U, s.en[1] * U, 4.2, 0.06, P, 24)}"/>`).join("")}</g>`);
  return out.join("");
}

/* ---------- Paredes y muebles: todo lo que tiene altura, ordenado de atrás adelante ---------- */
const piezas = [];
const pieza = (x, y, w, d, svg) => piezas.push({ x0: x, x1: x + w, y0: y, y1: y + d, svg });

function pared(x, y, w, d, material, alto = H) {
  const largo = Math.max(w, d), aLoLargo = w >= d;
  let juntas = "";
  if (material === "ladrillo") for (let s = 6; s < largo - 1; s += 6) juntas += aLoLargo ? k.lineOnTop([x + s, y], [x + s, y + d], alto, P) : k.lineOnTop([x, y + s], [x + w, y + s], alto, P);
  const cuerpo = S(k.slabOf({ x, y, w, d, r: 0 }, 0, alto, P, 2, 0), { tone: "hi", inner: juntas ? Ln(juntas, { tone: "lo" }) : "" });
  pieza(x, y, w, d, mat(material === "exterior" ? "crema" : MAT_PARED[material], cuerpo));
}

function paredes() {
  // De fuera: la del fondo y la de delante cogen las esquinas; la de delante tiene el hueco de la entrada.
  pared(-T_EXT, -T_EXT, W + 2 * T_EXT, T_EXT, "exterior");
  pared(-T_EXT, 0, T_EXT, D, "exterior");
  pared(W, 0, T_EXT, D, "exterior");
  pared(-T_EXT, D, 104 + T_EXT, T_EXT, "exterior");
  pared(124, D, W - 124 + T_EXT, T_EXT, "exterior");
  // De dentro, tal como están en el modelo (allí van por su eje, en metros).
  for (const w of M.PAREDES) {
    const g = GROSOR[w.m], [ax, ay] = w.a.map((v) => v * U), [bx, by] = w.b.map((v) => v * U);
    if (ax === bx) pared(ax - g / 2, ay, g, by - ay, w.m);
    else pared(ax + GROSOR.pladur / 2, ay - g / 2, bx - ax - GROSOR.pladur / 2, g, w.m);
  }
}

function muebles() {
  const m = (nombre, svg) => mat(nombre, svg);
  // Salón: mueble con el router.
  const antena = (x, y) => S(k.cylinder(x, y, 0.55, 10.6, 8.5, P, 10), { tone: "hi", crease: "none" });
  pieza(4, 13, 17, 28,
    m("amarillo", caja(4, 13, 17, 28, 0, 8, { r: 1 }) + Ln(k.lineOnTop([4.5, 27], [20.5, 27], 8, P), { tone: "lo" })) +
    m("negro", caja(8.5, 19, 9.5, 16, 8, 2.6, { r: 1.6 }) + antena(10.4, 21.2) + antena(10.4, 32.8)) +
    `<g class="wf-leds">${Dt([at([16.4, 23, 10.6]), at([16.4, 25.4, 10.6]), at([16.4, 27.8, 10.6])], { size: 0.55 })}</g>`);
  // Sofá, con el respaldo hacia el fondo, y mesa baja.
  pieza(36, 44, 44, 20,
    m("azul", caja(36, 44, 44, 5, 0, 12, { r: 1.5 }) + caja(36, 49, 5, 15, 0, 9, { r: 1.5 }) + caja(75, 49, 5, 15, 0, 9, { r: 1.5 }) + caja(41, 49, 34, 15, 0, 6, { r: 1 }) + Ln(k.lineOnTop([58, 49.5], [58, 63.5], 6, P), { tone: "lo" })));
  pieza(46, 72, 24, 12, m("crema", caja(46, 72, 24, 12, 3.4, 1.2, { r: 1 }) ) + m("metal", ""));
  // Acuario sobre su mueble.
  const A = M.ACUARIO;
  pieza(A.x0 * U, A.y0 * U, (A.x1 - A.x0) * U, (A.y1 - A.y0) * U,
    m("amarillo", caja(A.x0 * U, A.y0 * U, (A.x1 - A.x0) * U, (A.y1 - A.y0) * U, 0, 7, { r: 0.8 })) +
    m("vidrio", caja(A.x0 * U + 0.8, A.y0 * U + 0.6, (A.x1 - A.x0) * U - 1.6, (A.y1 - A.y0) * U - 1.2, 7, 9, { r: 0.6, inner: Ln(k.sideSeam({ x: A.x0 * U + 0.8, y: A.y0 * U + 0.6, w: (A.x1 - A.x0) * U - 1.6, d: (A.y1 - A.y0) * U - 1.2, r: 0.6 }, 14.6, P, 4), { tone: "lo" }) })) +
    `<g class="wf-peces">${Dt([at([57, A.y1 * U - 0.6, 11]), at([63, A.y1 * U - 0.6, 9.4]), at([69, A.y1 * U - 0.6, 12])], { size: 0.8 })}</g>`);
  // Mesa de comedor con cuatro sillas.
  for (const [sx, sy] of [[20, 118], [34, 118], [20, 143], [34, 143]]) pieza(sx, sy, 7, 7, m("naranja", caja(sx, sy, 7, 7, 0, 5, { r: 1 })));
  pieza(14, 126, 32, 16, m("crema", caja(14, 126, 32, 16, 6.6, 1.4, { r: 1 })));
  // Planta en la esquina.
  pieza(86, 6, 9, 9, m("naranja", S(k.cylinder(90.5, 10.5, 3.6, 0, 5, P, 18, 0.4), { tone: "hi" })) + m("verde", S(k.cylinder(90.5, 10.5, 4.6, 5, 6, P, 18, 1.2), { tone: "hi" })));
  // Pasillo: zapatero.
  pieza(103, 4, 8, 24, m("crema", caja(103, 4, 8, 24, 0, 9, { r: 0.8 }) + Ln(k.lineOnTop([103.4, 16], [110.6, 16], 9, P), { tone: "lo" })));
  // Cocina: frigorífico, encimera con fregadero y placa, y el microondas.
  pieza(131, 1, 14, 13, m("metal", caja(131, 1, 14, 13, 0, 19, { r: 1 }) + Ln(k.lineOnTop([131.5, 9], [144.5, 9], 19, P), { tone: "lo" })));
  const X0 = M.MICROONDAS[0] * U - 10, Y0 = 1.2, Zm = 9;
  pieza(148, 0.6, 91.4, 11.4,
    m("blanco", caja(148, 0.6, 91.4, 11.4, 0, 9, { r: 0.6 })) +
    m("metal", fill("wf-fregadero", rect(156, 172, 3, 9.6), 9.02) + Ln(k.planOutline({ x: 156, y: 3, w: 16, d: 6.6, r: 1.4 }, 9.02, P, 4) + k.ring(164, 6.3, 1, 9.02, P, 10), { tone: "mid" })) +
    Ln([[184, 4.6], [193, 4.6], [184, 8.8], [193, 8.8]].map(([x, y]) => k.ring(x, y, 2.3, 9.02, P, 16) + k.ring(x, y, 1.1, 9.02, P, 12)).join(""), { tone: "mid" }) +
    m("metal", caja(X0, Y0, 20, 9, Zm, 8, { r: 0.8 })) +
    frente("wf-ventana", Y0 + 9, [[X0 + 1.6, Zm + 1.4], [X0 + 13.4, Zm + 1.4], [X0 + 13.4, Zm + 6.6], [X0 + 1.6, Zm + 6.6]], ' id="wf-ventana"') +
    Ln(k.segment([X0 + 14.6, Y0 + 9, Zm + 0.6], [X0 + 14.6, Y0 + 9, Zm + 7.4], P), { tone: "lo" }) +
    Dt([at([X0 + 17, Y0 + 9, Zm + 5.6]), at([X0 + 17, Y0 + 9, Zm + 3.6]), at([X0 + 17, Y0 + 9, Zm + 1.8])], { size: 0.45 }));
  pieza(178, 28, 22, 14, m("crema", caja(178, 28, 22, 14, 6.6, 1.4, { r: 1 })));
  pieza(170, 32, 6, 6, m("naranja", caja(170, 32, 6, 6, 0, 5, { r: 1 })));
  pieza(202, 32, 6, 6, m("naranja", caja(202, 32, 6, 6, 0, 5, { r: 1 })));
  // Habitaciones: cama con cabecero y almohada, escritorio con portátil y silla.
  const cama = (y) => pieza(194, y, 45, 32,
    m("crema", caja(235.5, y, 3.5, 32, 0, 10, { r: 0.8 })) +
    m("blanco", caja(194, y + 1, 41.5, 30, 0, 5, { r: 1.5 }) + caja(225, y + 5, 8, 22, 5, 1.6, { r: 1.6 })) +
    m("azul", caja(194, y + 1, 22, 30, 5, 0.9, { r: 1.2, crease: "none" })));
  const mesa = (y, conPortatil) => pieza(148, y, 32, 12,
    m("crema", caja(148, y, 32, 12, 6.6, 1.4, { r: 0.8 })) +
    (conPortatil ? m("metal", caja(158, y + 3.4, 10, 6.6, 8, 0.5, { r: 0.5, crease: "none" }) + caja(158, y + 3, 10, 0.7, 8.5, 6, { r: 0.2, crease: "none" })) + frente("wf-portatil", y + 3.7, [[158.8, 9.2], [167.2, 9.2], [167.2, 13.8], [158.8, 13.8]]) : m("metal", caja(160, y + 3, 9, 6, 8, 0.8, { r: 0.5 }))));
  cama(60); cama(118);
  mesa(54.5, false); mesa(110, true);
  pieza(160, 70, 8, 8, m("naranja", caja(160, 70, 8, 8, 0, 5, { r: 1 })));
  pieza(160, 126, 8, 8, m("naranja", caja(160, 126, 8, 8, 0, 5, { r: 1 })));
  pieza(131, 80, 9, 22, m("crema", caja(131, 80, 9, 22, 0, 11, { r: 0.8 }) + Ln(k.lineOnTop([131.4, 91], [139.6, 91], 11, P), { tone: "lo" })));
  pieza(131, 134, 9, 24, m("crema", caja(131, 134, 9, 24, 0, 11, { r: 0.8 }) + Ln(k.lineOnTop([131.4, 146], [139.6, 146], 11, P), { tone: "lo" })));
}

// Orden de pintor para cajas alineadas con los ejes: A va antes que B si queda detrás en x o en y.
function ordenar(lista) {
  const detras = (a, b) => a.x1 <= b.x0 + 1e-6 || a.y1 <= b.y0 + 1e-6;
  const n = lista.length, antes = lista.map(() => new Set());
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && detras(lista[i], lista[j]) && !detras(lista[j], lista[i])) antes[j].add(i);
  const hecho = new Set(), orden = [];
  const fondo = (c) => k.depthOf([(c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, 0], P);
  while (orden.length < n) {
    const libres = lista.map((_, i) => i).filter((i) => !hecho.has(i) && [...antes[i]].every((j) => hecho.has(j)));
    const pendientes = lista.map((_, i) => i).filter((i) => !hecho.has(i));
    if (!libres.length) console.warn("orden de pintor: ciclo entre", pendientes.length, "piezas");
    const i = (libres.length ? libres : pendientes).sort((a, b) => fondo(lista[a]) - fondo(lista[b]))[0];
    hecho.add(i); orden.push(lista[i]);
  }
  return orden.map((c) => c.svg).join("");
}

paredes();
muebles();

/* ---------- El móvil: se dibuja una vez en el origen y luego solo se desplaza ---------- */
function movil() {
  const { z0, alto, ancho, grueso } = MOVIL;
  const cuerpo = { x: -ancho / 2, y: -grueso / 2, w: ancho, d: grueso, r: 0.6 };
  return [
    Ln(k.ring(0, 0, 5.2, 0.07, P, 24), { tone: "hi", className: "wf-pie" }),
    Dt([at([0, 0, 0.07])], { size: 0.8 }),
    Ln(k.rise([0, 0], 0.07, z0, P), { tone: "mid", dotted: true }),
    mat("negro", S(k.slabOf(cuerpo, z0, alto, P, 4, 0.3), { tone: "hi", halo: true })),
    frente("wf-pantalla", grueso / 2, [[-ancho / 2 + 0.9, z0 + 2.2], [ancho / 2 - 0.9, z0 + 2.2], [ancho / 2 - 0.9, z0 + alto - 1.6], [-ancho / 2 + 0.9, z0 + alto - 1.6]]),
    Dt([at([0, grueso / 2, z0 + 1.1])], { size: 0.6 }),
  ].join("");
}
const origen = at([0, 0, 0]);
const cabeza = at([0, 0, MOVIL.z0 + MOVIL.alto]);     // punta del móvil, para colgar la etiqueta

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Maqueta de un piso visto desde arriba, con las paredes cortadas a media altura: salón con el router, pasillo, cocina con un microondas y dos habitaciones. Las ondas salen del router y se apagan al cruzar cada pared. Un móvil marca cuánta señal llega al punto donde está.",
  body: [
    mat("pizarra", base()),
    suelo(),
    `<g id="wf-micro-ondas"></g>`,
    `<g id="wf-ondas"></g>`,
    `<path id="wf-linea" class="iso-line wf-linea" d=""/>`,
    ordenar(piezas),
    `<g id="wf-cruces"></g>`,
    `<g id="wf-movil">${movil()}<g id="wf-cartel"></g></g>`,
  ],
});

const CSS = `
.iso .m-hormigon{--anatomy-paper:#a7a49d;--anatomy-top:#b4b1aa;--anatomy-shade-0:#73716b;--anatomy-shade-1:#807e77;--anatomy-shade-2:#8e8b84;--anatomy-shade-3:#9b9891;--anatomy-mid:#2d2c29;--anatomy-lo:#5f5d58;--anatomy-faint:#8a8780}
.wf-suelo{fill:#e9dcc2;stroke:none}
.wf-madera{fill:#f6e8c9;stroke:none}
.wf-baldosa{fill:#eef2f4;stroke:none}
.wf-terrazo{fill:#efe6d6;stroke:none}
.wf-alfombra{fill:#f3c9b5;stroke:none}
.wf-felpudo{fill:#c9b98f;stroke:none}
.wf-fregadero{fill:#c4c8d2;stroke:none}
.wf-sitio{fill:#fffaf0;fill-opacity:.75;stroke:#1d1b24;stroke-width:1.2px;stroke-dasharray:2.4 2.2;cursor:pointer}
.wf-sitio[data-aqui]{stroke-dasharray:none;fill-opacity:0}
.iso-line.wf-onda{stroke:#2f6fe0;stroke-width:1.5px}
.iso-line.wf-onda-micro{stroke:#e5484d;stroke-width:1.3px;stroke-dasharray:3 2.4}
.iso-line.wf-linea{stroke:#1d1b24;stroke-width:1.3px;stroke-dasharray:1.5 3.2;stroke-linecap:round}
.iso-line.wf-pie{stroke-width:1.5px}
.wf-cruce{stroke:#1d1b24;stroke-width:1.3px}
.wf-leds circle{fill:#2e9e4f}
.wf-peces circle{fill:#ff7a50}
.wf-ventana{fill:#2b2c35;stroke:#1d1b24;stroke-width:1px}
.iso-stage[data-micro] .wf-ventana{fill:#ffd23f}
.wf-portatil{fill:#bfdcee;stroke:#1d1b24;stroke-width:.8px}
.wf-pantalla{fill:#ffd23f;stroke:#1d1b24;stroke-width:.9px}
.wf-cartel-caja{fill:#fff;stroke:#1d1b24;stroke-width:1.5px}
.wf-cartel-sombra{fill:#1d1b24}
.wf-cartel-barra{fill:#e4dccb;stroke:#1d1b24;stroke-width:1px}
.wf-cartel-barra[data-on]{fill:#2f6fe0}
.wf-cartel-t{font:800 11.5px/1 var(--f-texto);fill:#1d1b24}
.wf-cartel-n{font:600 8.4px/1 var(--f-mono);fill:#5a5566}
.iso-stage{cursor:grab;touch-action:none;outline:none}
.iso-stage[data-agarrado]{cursor:grabbing}

/* Lo que mide el móvil, en grande, debajo de la maqueta */
.wf-medidor{display:grid;grid-template-columns:auto auto 1fr;gap:10px 22px;align-items:center;margin:14px 2px 4px;font:600 16px/1.3 var(--f-texto);color:var(--tinta)}
.wf-m{display:flex;align-items:center;gap:9px;min-width:0}
.wf-m-t{font:700 12.5px/1 var(--f-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--tinta-2)}
.wf-barras{display:inline-flex;align-items:flex-end;gap:3px;height:22px}
.wf-barras i{width:7px;border:2px solid var(--d-tinta);border-radius:3px;background:#e4dccb}
.wf-barras i:nth-child(1){height:8px}.wf-barras i:nth-child(2){height:12px}.wf-barras i:nth-child(3){height:17px}.wf-barras i:nth-child(4){height:22px}
.wf-barras i[data-on]{background:#2f6fe0}
.wf-m b{font-weight:800}
.wf-m small{font:600 13px/1 var(--f-mono);color:var(--tinta-2);white-space:nowrap}
.wf-datos{display:inline-block;width:120px;height:16px;border:2px solid var(--d-tinta);border-radius:8px;background:#e4dccb;overflow:hidden}
.wf-datos i{display:block;height:100%;width:0;background:#2e9e4f;transition:width .25s}
.wf-m-inter{grid-column:1 / -1;align-items:baseline}
.wf-m-inter span:last-child{font-weight:600}

/* El espectro */
.wf-espectro{display:block;width:100%;height:auto;margin-top:10px;border-top:2.5px dashed var(--d-tinta);padding-top:10px}
.wf-e-titulo{font:700 11px/1 var(--f-mono);letter-spacing:.05em;text-transform:uppercase;fill:#5a5566}
.wf-e-eje{stroke:#1d1b24;stroke-width:1.6px;fill:none}
.wf-e-canal{fill:none;stroke:#b9ae98;stroke-width:1px;stroke-dasharray:2.5 2.5}
.wf-e-vecino{fill:#c9c6cf;stroke:#5a5566;stroke-width:1.5px;stroke-linejoin:round}
.wf-e-mia{fill:#5b90ea;stroke:#1d1b24;stroke-width:2.2px;stroke-linejoin:round}
.wf-e-ruido{fill:url(#wf-rayas);stroke:#e5484d;stroke-width:1.8px;stroke-linejoin:round}
.wf-e-turno{stroke:#1d1b24;stroke-width:2.2px;stroke-linejoin:round}
.wf-e-num{font:700 12px/1 var(--f-mono);fill:#5a5566;text-anchor:middle;cursor:pointer}
.wf-e-num[data-mia]{fill:#fff}
.wf-e-num-fondo{fill:transparent;cursor:pointer}
.wf-e-num-fondo[data-mia]{fill:#2f6fe0;stroke:#1d1b24;stroke-width:1.5px}
.wf-e-num[data-vecino]{fill:#1d1b24}
.wf-e-rot{font:800 11.5px/1 var(--f-texto);text-anchor:middle;fill:#1d1b24}
.wf-e-rot[data-tono="ruido"]{fill:#c2272d}
.wf-e-rot[data-tono="gris"]{fill:#5a5566}
.wf-e-mhz{font:600 9.5px/1 var(--f-mono);fill:#8d8576}
.wf-e-cota{stroke:#5a5566;stroke-width:1px;fill:none}
.wf-e-micro{fill:rgba(229,72,77,.16);stroke:#e5484d;stroke-width:1.4px;stroke-linejoin:round}
.wf-e-bloque{fill:none;stroke:#b9ae98;stroke-width:1px;stroke-dasharray:2.5 2.5}
@keyframes wf-t2{0%,49.9%{opacity:1}50%,100%{opacity:0}}
@keyframes wf-t3{0%,33.2%{opacity:1}33.3%,100%{opacity:0}}
@keyframes wf-t4{0%,24.9%{opacity:1}25%,100%{opacity:0}}
@media (prefers-reduced-motion: reduce){.wf-e-turno{animation:none!important}}

/* Controles */
.wf-controles{row-gap:14px}
.wf-controles .wf-fila{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;flex:1 1 100%}
.wf-controles .wf-t{font:700 12.5px/1 var(--f-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--tinta-2);flex:none}
.wf-controles .wf-canal{flex:1 1 230px}
.wf-controles .wf-canal output{min-width:1.6em}
.wf-controles .wf-vecino{flex:none;gap:6px}
.wf-controles select{font:700 15px/1.2 var(--f-texto);padding:9px 8px;border:2.5px solid var(--d-tinta);border-radius:12px;background:var(--d-papel);color:var(--tinta)}
.wf-controles select:focus-visible{outline:3px solid var(--ambar);outline-offset:2px}
.wf-controles [data-off]{opacity:.45}
.wf-controles .fig-grupo button{padding:9px 12px;font-size:15px}
.wf-nota{flex:1 1 100%;margin:0;padding:12px 14px;border:2.5px solid var(--d-tinta);border-radius:12px;background:#fff;font:500 16.5px/1.45 var(--f-texto);color:var(--tinta);min-height:3.2em}
@media (max-width: 640px){.wf-medidor{grid-template-columns:1fr}.wf-datos{width:100px}.fig .iso-figure .iso-plate{padding-bottom:110px}}
`;

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

const live = `
${MODEL}
const WF = ${JSON.stringify({ P, U, H, W: WIDTH, origen, cabeza, zMano: MOVIL.z0 + MOVIL.alto / 2 })};
const wfP = WF.P;
const wfStage = document.querySelector(".iso-stage"), wfSvg = wfStage.querySelector("svg");
const wfEl = (id) => document.getElementById(id);
const wfOndas = wfEl("wf-ondas"), wfMicroOndas = wfEl("wf-micro-ondas"), wfLinea = wfEl("wf-linea"), wfCruces = wfEl("wf-cruces"), wfMovil = wfEl("wf-movil"), wfCartel = wfEl("wf-cartel");
const wfEspectro = document.querySelector(".wf-espectro");
const wfReadout = document.querySelector("[data-readout]");
const wfBarras = [...document.querySelectorAll(".wf-barras i")], wfCob = wfEl("wf-cob"), wfDbm = wfEl("wf-dbm"), wfDatos = wfEl("wf-datos"), wfInter = wfEl("wf-inter"), wfNota = document.querySelector(".wf-nota");
const wfBandas = [...document.querySelectorAll(".wf-banda button")], wfCanalBox = document.querySelector(".wf-canal"), wfCanalIn = wfCanalBox.querySelector("input"), wfCanalOut = wfCanalBox.querySelector("output");
const wfSelects = [...document.querySelectorAll(".wf-vecino select")], wfMicroBtn = document.querySelector(".wf-micro");
const wfSitiosBtn = [...document.querySelectorAll(".wf-sitios button")], wfEscenasBtn = [...document.querySelectorAll(".wf-escenas button")], wfSitiosSuelo = [...document.querySelectorAll(".wf-sitio")];
const wfStill = matchMedia("(prefers-reduced-motion: reduce)");
const wfNum = (v, d = 1) => v.toFixed(d).replace(".", ",").replace("-", "−");
const wfLetra = ["A", "B", "C"];
const wfColor = { pladur: "#ffffff", ladrillo: "#ff7a50", hormigon: "#a7a49d", agua: "#bfdcee" };

// Estado: lo que el alumno puede cambiar.
const wf = { banda: "2.4", canal: 6, vecinos: [null, null, null], micro: false, donde: SITIOS[0].en.slice(), escena: null };
let wfHacia = wf.donde.slice(), wfFrame = 0, wfLast = 0, wfReloj = 0, wfVisible = false, wfPaseo = !wfStill.matches, wfPaso = 0, wfSucio = true, wfPar = false;

/* ---------- De la pantalla al suelo y al revés ---------- */
const wfEx = [iso([1, 0, 0], wfP)[0] - iso([0, 0, 0], wfP)[0], iso([1, 0, 0], wfP)[1] - iso([0, 0, 0], wfP)[1]];
const wfEy = [iso([0, 1, 0], wfP)[0] - iso([0, 0, 0], wfP)[0], iso([0, 1, 0], wfP)[1] - iso([0, 0, 0], wfP)[1]];
const wfO = iso([0, 0, 0], wfP);
const wfSuelo = ([x, y]) => [wfO[0] + (x * wfEx[0] + y * wfEy[0]) * WF.U, wfO[1] + (x * wfEx[1] + y * wfEy[1]) * WF.U];   // metros → pantalla
function wfMetros(event) {      // puntero → metros, como si el dedo llevara el móvil en la mano
  const m = wfSvg.getScreenCTM().inverse(), mano = iso([0, 0, WF.zMano], wfP)[1] - wfO[1];
  const sx = event.clientX * m.a + event.clientY * m.c + m.e - wfO[0], sy = event.clientX * m.b + event.clientY * m.d + m.f - wfO[1] - mano;
  const det = wfEx[0] * wfEy[1] - wfEx[1] * wfEy[0];
  return [(sx * wfEy[1] - sy * wfEy[0]) / det / WF.U, (wfEx[0] * sy - wfEx[1] * sx) / det / WF.U];
}
const wfDentro = ([x, y]) => [Math.max(0.25, Math.min(PISO.ancho - 0.25, x)), Math.max(0.25, Math.min(PISO.fondo - 0.25, y))];

/* ---------- Las ondas del router ---------- */
// En cada dirección se guarda hasta dónde llega el piso y qué paredes se cruzan por el camino.
const WF_N = 84;
const wfRayos = Array.from({ length: WF_N }, (_, j) => {
  const a = (j / WF_N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
  const tx = c > 0 ? (PISO.ancho - ROUTER[0]) / c : c < 0 ? -ROUTER[0] / c : Infinity;
  const ty = s > 0 ? (PISO.fondo - ROUTER[1]) / s : s < 0 ? -ROUTER[1] / s : Infinity;
  const max = Math.min(tx, ty);
  const fin = [ROUTER[0] + c * max, ROUTER[1] + s * max];
  return { max, cruza: cruces(ROUTER, fin), e: [(c * wfEx[0] + s * wfEy[0]) * WF.U, (c * wfEx[1] + s * wfEy[1]) * WF.U] };
});
const wfR0 = wfSuelo(ROUTER);
function wfDrawOndas(fase) {
  const banda = wf.banda, paso = banda === "5" ? 0.62 : 1.24;      // la onda de 5 GHz es la mitad de larga (no está a escala)
  const base = POTENCIA - (20 * Math.log10(frecuencia(banda, wf.canal)) - 27.55);
  const cubos = ["", "", "", "", "", ""];
  for (let r = 0.45 + (fase % 1) * paso; r < 14; r += paso) {
    const aire = base - 20 * Math.log10(r);
    for (let j = 0; j < WF_N; j++) {
      const a = wfRayos[j], b = wfRayos[(j + 1) % WF_N];
      if (r >= a.max || r >= b.max) continue;
      let dbm = aire;
      for (const c of a.cruza) if (c.d < r) dbm -= PERDIDA[c.m][banda];
      const nivel = Math.round(Math.max(0, Math.min(1, (dbm + 93) / 52)) * 5);
      if (!nivel) continue;
      cubos[nivel] += "M" + (wfR0[0] + a.e[0] * r).toFixed(1) + " " + (wfR0[1] + a.e[1] * r).toFixed(1) + "L" + (wfR0[0] + b.e[0] * r).toFixed(1) + " " + (wfR0[1] + b.e[1] * r).toFixed(1);
    }
  }
  let html = "";
  for (let n = 1; n <= 5; n++) if (cubos[n]) html += '<path class="iso-line wf-onda" opacity="' + (0.1 + n * 0.16).toFixed(2) + '" d="' + cubos[n] + '"/>';
  wfOndas.innerHTML = html;
}
// El microondas: arcos de ruido dentro de la cocina.
function wfDrawMicro(fase) {
  if (!wf.micro) { if (wfMicroOndas.innerHTML) wfMicroOndas.innerHTML = ""; return; }
  let html = "";
  for (let i = 0; i < 4; i++) {
    const r = 0.5 + ((fase * 0.6 + i / 4) % 1) * 2.6;
    let d = "", abierto = false;
    for (let g = 0; g <= 36; g++) {
      const a = (g / 36) * Math.PI, p = [MICROONDAS[0] + Math.cos(a) * r, MICROONDAS[1] + 0.25 + Math.sin(a) * r];
      if (p[0] > PISO.ancho - 0.05 || p[0] < 6.5 || p[1] > 2.5) { abierto = false; continue; }
      const s = wfSuelo(p); d += (abierto ? "L" : "M") + s[0].toFixed(1) + " " + s[1].toFixed(1); abierto = true;
    }
    html += '<path class="iso-line wf-onda-micro" opacity="' + (0.85 * (1 - (r - 0.5) / 2.6)).toFixed(2) + '" d="' + d + '"/>';
  }
  wfMicroOndas.innerHTML = html;
}

/* ---------- El móvil, la línea hasta el router y lo que mide ---------- */
function wfMedida() {
  const s = senal(wf.donde, wf.banda, wf.canal), c = cobertura(s.dbm);
  const i = interferencias(wf);
  return { s, c, i, datos: datos(wf) };
}
function wfDrawMovil(m) {
  const p = wfSuelo(wf.donde);
  wfMovil.setAttribute("transform", "translate(" + (p[0] - WF.origen[0]).toFixed(2) + " " + (p[1] - WF.origen[1]).toFixed(2) + ")");
  wfLinea.setAttribute("d", "M" + wfR0[0].toFixed(1) + " " + wfR0[1].toFixed(1) + "L" + p[0].toFixed(1) + " " + p[1].toFixed(1));
  wfCruces.innerHTML = m.s.cruza.map((c) => { const q = iso([c.en[0] * WF.U, c.en[1] * WF.U, c.m === "agua" ? 16 : WF.H], wfP); return '<circle class="wf-cruce" r="3.1" fill="' + wfColor[c.m] + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '"/>'; }).join("");
  // El cartel cuelga de la punta del móvil; si no cabe a la derecha, se pone a la izquierda.
  const ancho = Math.max(96, 46 + m.c.nombre.length * 7.6), alto = 38, cx = WF.cabeza[0], cy = WF.cabeza[1], izq = p[0] - WF.origen[0] + cx + 14 + ancho > WF.W - 4;
  const x = izq ? cx - 14 - ancho : cx + 14, y = cy - alto - 2;
  let h = '<path class="iso-line" data-tone="mid" d="M' + cx.toFixed(1) + " " + (cy - 1).toFixed(1) + "L" + (izq ? x + ancho : x).toFixed(1) + " " + (y + alto - 8).toFixed(1) + '"/>';
  h += '<rect class="wf-cartel-sombra" x="' + (x + 3).toFixed(1) + '" y="' + (y + 3).toFixed(1) + '" width="' + ancho + '" height="' + alto + '" rx="8"/><rect class="wf-cartel-caja" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + ancho + '" height="' + alto + '" rx="8"/>';
  for (let b = 0; b < 4; b++) { const bh = 6 + b * 5; h += '<rect class="wf-cartel-barra"' + (b < m.c.barras ? " data-on" : "") + ' x="' + (x + 8 + b * 6.6).toFixed(1) + '" y="' + (y + 30 - bh).toFixed(1) + '" width="4.6" height="' + bh + '" rx="1.2"/>'; }
  h += '<text class="wf-cartel-t" x="' + (x + 38).toFixed(1) + '" y="' + (y + 17).toFixed(1) + '">' + m.c.nombre + '</text><text class="wf-cartel-n" x="' + (x + 38).toFixed(1) + '" y="' + (y + 29.5).toFixed(1) + '">' + wfNum(m.s.dbm, 0) + " dBm</text>";
  wfCartel.innerHTML = h;
}
function wfTextoInter(m) {
  if (wf.banda === "5") return "Ninguna: en 5 GHz cada red tiene su canal" + (wf.micro ? " y el microondas no usa esta banda" : "") + ".";
  const t = [];
  if (m.i.ruido) t.push(m.i.ruido === 1 ? "un vecino en un canal solapado: ruido" : m.i.ruido + " vecinos en canales solapados: ruido");
  if (m.i.turnos) t.push(m.i.turnos === 1 ? "un vecino en tu mismo canal: os turnáis para hablar" : m.i.turnos + " vecinos en tu mismo canal: os turnáis para hablar");
  if (m.i.micro === "fuerte") t.push("el microondas mete mucho ruido aquí");
  if (m.i.micro === "algo") t.push("el microondas mete algo de ruido aquí");
  if (!t.length) return m.i.libres ? "Ninguna: los vecinos están a 5 canales o más." : wf.micro ? "Ninguna aquí: el microondas queda lejos." : "Ninguna.";
  const frase = t.join("; ");
  return frase.charAt(0).toUpperCase() + frase.slice(1) + ".";
}
function wfTextoNota() {
  const E = wf.escena && WF_ESCENAS[wf.escena];
  if (E && wfIgual(E)) return E.nota;
  if (wf.banda === "5") return "En 5 GHz hay muchos más canales libres: cada red tiene el suyo y no se pisan. A cambio, la señal se queda más cerca del router.";
  const frases = [];
  wf.vecinos.forEach((v, n) => {
    if (v === null) return;
    const d = Math.abs(v - wf.canal), r = relacion(wf.canal, v);
    frases.push("Vecino " + wfLetra[n] + (r === "turnos" ? " en tu mismo canal: las dos redes se escuchan y se turnan para hablar." : " en el canal " + v + ", a " + d + " de distancia del tuyo: " + (r === "ruido" ? "se solapan y cada red es ruido para la otra." : "no molesta.")));
  });
  return frases.length ? frases.join(" ") : "No hay redes de vecinos en 2,4 GHz: tu canal está libre.";
}
function wfDrawMedida(m) {
  wfBarras.forEach((b, n) => (n < m.c.barras ? b.setAttribute("data-on", "") : b.removeAttribute("data-on")));
  wfCob.textContent = m.c.nombre;
  wfDbm.textContent = wfNum(m.s.dbm, 0) + " dBm aprox.";
  wfDatos.style.width = Math.round(m.datos * 100) + "%";
  wfDatos.parentNode.setAttribute("aria-label", "Datos: " + Math.round(m.datos * 100) + " de 100");
  wfInter.textContent = wfTextoInter(m);
  const paredes = m.s.cruza.filter((c) => c.m !== "agua").length, agua = m.s.cruza.some((c) => c.m === "agua");
  const cruza = paredes ? " · cruza " + paredes + (paredes === 1 ? " pared" : " paredes") + (agua ? " y el acuario" : "") : agua ? " · cruza el acuario" : " · sin paredes";
  const texto = (wf.banda === "5" ? "5 GHz · canal " + MI_CANAL_5 : "2,4 GHz · canal " + wf.canal) + " · a " + wfNum(m.s.d) + " m" + cruza;
  if (wfReadout.textContent !== texto) wfReadout.textContent = texto;
  const nota = wfTextoNota();
  if (wfNota.textContent !== nota) wfNota.textContent = nota;
  const cerca = SITIOS.find((s) => Math.hypot(s.en[0] - wf.donde[0], s.en[1] - wf.donde[1]) < 0.05);
  for (const b of wfSitiosBtn) b.setAttribute("aria-pressed", String(!!cerca && b.dataset.sitio === cerca.id));
  for (const s of wfSitiosSuelo) (cerca && s.dataset.sitio === cerca.id ? s.setAttribute("data-aqui", "") : s.removeAttribute("data-aqui"));
}

/* ---------- El espectro ---------- */
const wfFx = (f) => 46 + (f - 2401) * (628 / 82), WF_Y = 148, WF_ALTO = 86;
// Rótulos sobre las campanas: cada uno en la primera altura donde no pisa a otro.
function wfRotulos(lista) {
  const puestos = [];
  let h = "";
  for (const r of lista) {
    const ancho = Math.max(...r.lineas.map((t) => t.length)) * 6.6 + 8;
    let nivel = 0;
    const choca = (n) => r.lineas.some((_, l) => puestos.some((p) => p.nivel === n + l && Math.abs(p.x - r.x) < (p.ancho + ancho) / 2));
    while (choca(nivel)) nivel++;
    for (let l = 0; l < r.lineas.length; l++) puestos.push({ x: r.x, ancho, nivel: nivel + l });
    r.lineas.forEach((t, l) => { h += '<text class="wf-e-rot"' + (r.tono ? ' data-tono="' + r.tono + '"' : "") + ' x="' + r.x.toFixed(1) + '" y="' + (WF_Y - WF_ALTO - 7 - 13 * (nivel + r.lineas.length - 1 - l)) + '">' + t + "</text>"; });
  }
  return h;
}
function wfCampana(canal, tope) {     // contorno de la campana de un canal; con «tope», el trozo que comparte con ese otro canal
  let d = "";
  for (let f = centro24(canal) - 11; f <= centro24(canal) + 11.001; f += 0.5) {
    const h = tope === undefined ? campana(f, canal) : Math.min(campana(f, canal), campana(f, tope));
    d += (d ? "L" : "M") + wfFx(f).toFixed(1) + " " + (WF_Y - h * WF_ALTO).toFixed(1);
  }
  return d + "Z";
}
function wfDrawEspectro() {
  let h = '<defs><pattern id="wf-rayas" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fbd5d6"/><rect width="3" height="6" fill="#e5484d"/></pattern></defs>';
  const rot = (x, y, t, tono) => '<text class="wf-e-rot"' + (tono ? ' data-tono="' + tono + '"' : "") + ' x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '">' + t + "</text>";
  if (wf.banda === "5") {
    h += '<text class="wf-e-titulo" x="46" y="14">Banda de 5 GHz · canales que no se solapan</text>';
    const bx = (i) => 46 + i * 32.4 + (i > 7 ? 14 : 0);
    CANALES_5.forEach((c, i) => {
      const x = bx(i), n = VECINOS_5.indexOf(c), vecino = n >= 0 && wf.vecinos[n] !== null, mia = c === MI_CANAL_5;
      h += '<path class="' + (mia ? "wf-e-mia" : vecino ? "wf-e-vecino" : "wf-e-bloque") + '" d="M' + x + " " + WF_Y + "L" + (x + 3) + " " + (WF_Y - WF_ALTO * 0.78) + "Q" + (x + 15) + " " + (WF_Y - WF_ALTO * 0.9) + " " + (x + 27) + " " + (WF_Y - WF_ALTO * 0.78) + "L" + (x + 30) + " " + WF_Y + 'Z"/>';
      if (mia) h += rot(x + 15, WF_Y - WF_ALTO * 0.9 - 8, "Tu red");
      else if (vecino) h += rot(x + 15, WF_Y - WF_ALTO * 0.9 - 8, "Vecino " + wfLetra[n], "gris");
      h += '<text class="wf-e-num"' + (mia ? ' data-vecino=""' : "") + ' x="' + (x + 15) + '" y="' + (WF_Y + 17) + '" style="cursor:default">' + c + "</text>";
    });
    h += '<path class="wf-e-eje" d="M40 ' + WF_Y + "H" + (bx(7) + 34) + "M" + (bx(8) - 4) + " " + WF_Y + 'H684"/><text class="wf-e-mhz" x="' + (bx(7) + 33.5) + '" y="' + (WF_Y + 3) + '">···</text>';
    h += '<text class="wf-e-mhz" x="46" y="' + (WF_Y + 34) + '">Cada red en su canal: ninguna molesta a otra.</text>';
    wfEspectro.innerHTML = h;
    return;
  }
  h += '<text class="wf-e-titulo" x="46" y="14">Banda de 2,4 GHz · canales 1 a 13</text>';
  for (let c = 1; c <= CANALES_24; c++) h += '<path class="wf-e-canal" d="' + wfCampana(c).slice(0, -1) + '"/>';
  if (wf.micro) {
    let d = "M" + wfFx(2401) + " " + WF_Y;
    for (let f = 2401; f <= 2483; f += 1.5) d += "L" + wfFx(f).toFixed(1) + " " + (WF_Y - 9 - 9 * Math.abs(Math.sin(f * 1.7) * Math.cos(f * 0.61))).toFixed(1);
    h += '<path class="wf-e-micro" d="' + d + "L" + wfFx(2483) + " " + WF_Y + 'Z"/>';
  }
  const pico = WF_Y - WF_ALTO;
  const vecinos = wf.vecinos.map((v, n) => ({ v, n })).filter((x) => x.v !== null);
  const juntos = vecinos.filter((x) => x.v === wf.canal);
  // Vecinos en otro canal: su campana en gris. Los que comparten canal se dibujan con la tuya.
  const vistos = {};
  for (const x of vecinos) if (x.v !== wf.canal) {
    h += '<path class="wf-e-vecino" d="' + wfCampana(x.v) + '"/>';
    vistos[x.v] = (vistos[x.v] || []).concat(wfLetra[x.n]);
  }
  const rotulos = [];
  if (juntos.length) {
    // Mismo canal: las redes se turnan. La campana cambia de dueño por turnos.
    const n = juntos.length + 1, d = wfCampana(wf.canal);
    for (let t = 0; t < n; t++) h += '<path class="wf-e-turno" fill="' + (t ? "#c9c6cf" : "#5b90ea") + '" style="animation:wf-t' + n + " " + (n * 0.9) + "s linear infinite;animation-delay:-" + ((n - t) % n) * 0.9 + 's" d="' + d + '"/>';
    if (wfStill.matches) h += '<path class="wf-e-turno" fill="#5b90ea" d="' + d + '"/><path class="wf-e-vecino" style="stroke-dasharray:5 4;fill:none" d="' + d + '"/>';
    rotulos.push({ x: wfFx(centro24(wf.canal)), lineas: ["Tu red y " + (juntos.length > 1 ? "vecinos " : "vecino ") + juntos.map((x) => wfLetra[x.n]).join(" y "), "se turnan"] });
  } else {
    h += '<path class="wf-e-mia" d="' + wfCampana(wf.canal) + '"/>';
    rotulos.push({ x: wfFx(centro24(wf.canal)), lineas: ["Tu red"] });
  }
  for (const v in vistos) rotulos.push({ x: wfFx(centro24(+v)), lineas: [(vistos[v].length > 1 ? "Vecinos " : "Vecino ") + vistos[v].join(" y ")], tono: "gris" });
  // Canales solapados: el trozo que comparten es ruido.
  for (const x of vecinos) if (relacion(wf.canal, x.v) === "ruido") {
    h += '<path class="wf-e-ruido" d="' + wfCampana(wf.canal, x.v) + '"/>';
    const medio = (centro24(wf.canal) + centro24(x.v)) / 2, alto = campana(medio, wf.canal) * WF_ALTO;
    if (!vecinos.some((y) => y.n < x.n && y.v === x.v)) h += rot(wfFx(medio), WF_Y - Math.max(alto * 0.45, 9), "ruido", "ruido").replace('class="wf-e-rot"', 'class="wf-e-rot" style="paint-order:stroke;stroke:#fff;stroke-width:3px"');
  }
  h += wfRotulos(rotulos);
  if (wf.micro) h += '<text class="wf-e-rot" data-tono="ruido" style="text-anchor:end" x="690" y="14">Microondas encendido: ruido en toda la banda</text>';
  h += '<path class="wf-e-eje" d="M40 ' + WF_Y + 'H690"/>';
  for (let c = 1; c <= CANALES_24; c++) {
    const x = wfFx(centro24(c)), mia = c === wf.canal, vec = vecinos.some((v) => v.v === c);
    h += '<path class="wf-e-eje" d="M' + x.toFixed(1) + " " + WF_Y + "v4" + '"/><circle class="wf-e-num-fondo" data-canal="' + c + '"' + (mia ? " data-mia" : "") + ' cx="' + x.toFixed(1) + '" cy="' + (WF_Y + 17) + '" r="10"/><text class="wf-e-num" data-canal="' + c + '"' + (mia ? " data-mia" : vec ? " data-vecino" : "") + ' x="' + x.toFixed(1) + '" y="' + (WF_Y + 21.3) + '">' + c + "</text>";
  }
  // Cota: lo que ocupa tu canal.
  const x0 = wfFx(centro24(wf.canal) - 11), x1 = wfFx(centro24(wf.canal) + 11), yc = WF_Y + 34;
  h += '<path class="wf-e-cota" d="M' + x0.toFixed(1) + " " + (yc - 4) + "v8M" + x1.toFixed(1) + " " + (yc - 4) + "v8M" + x0.toFixed(1) + " " + yc + "H" + x1.toFixed(1) + '"/><text class="wf-e-mhz" text-anchor="middle" x="' + ((x0 + x1) / 2).toFixed(1) + '" y="' + (yc + 12) + '">tu canal ocupa unos ' + ANCHO_24 + " MHz</text>";
  // Cota: lo que separa dos canales seguidos (entre el 12 y el 13, o entre el 1 y el 2 si tu red está arriba).
  const c5 = wf.canal >= 9 ? 1 : 12, a5 = wfFx(centro24(c5)), b5 = wfFx(centro24(c5 + 1)), y5 = WF_Y + 34;
  h += '<path class="wf-e-cota" d="M' + a5.toFixed(1) + " " + (y5 - 4) + "v8M" + b5.toFixed(1) + " " + (y5 - 4) + "v8M" + a5.toFixed(1) + " " + y5 + "H" + b5.toFixed(1) + '"/><text class="wf-e-mhz" text-anchor="' + (c5 === 1 ? "start" : "end") + '" x="' + (c5 === 1 ? a5 : b5).toFixed(1) + '" y="' + (y5 + 12) + '">5 MHz</text>';
  wfEspectro.innerHTML = h;
}

/* ---------- Escenas guiadas ---------- */
const WF_ESCENAS = {
  porque: { banda: "2.4", canal: 1, vecinos: [6, 11, null], micro: false, nota: "Tres redes en los canales 1, 6 y 11. Entre cada dos hay 5 números de distancia, así que sus campanas no se tocan: ninguna molesta a otra. Mueve tu canal al 2 o al 3 y mira cómo cambia." },
  mismo: { banda: "2.4", canal: 6, vecinos: [6, null, null], micro: false, nota: "Tu vecino y tú estáis en el canal 6. Las dos redes se escuchan y se turnan para hablar: va más lento, pero funciona. Es mejor que solaparse, aunque peor que tener cada una su canal." },
  solapado: { banda: "2.4", canal: 6, vecinos: [4, 11, null], micro: false, nota: "Tú estás en el canal 6 y el vecino A en el 4: las campanas se pisan. Las redes no se entienden y, para cada una, la otra es solo ruido. Es lo peor. El vecino B, en el 11, no molesta." },
  pelicula: { banda: "2.4", canal: 6, vecinos: [null, null, null], micro: false, sitio: "sofa", libre: true, nota: "Una película en el salón y el correo en la habitación del fondo. Mira la cobertura y los datos en el salón con cada banda. Después lleva el móvil a la habitación del fondo y vuelve a cambiar de banda." },
};
const wfIgual = (E) => (E.libre || (E.banda === wf.banda && E.canal === wf.canal)) && E.micro === wf.micro && E.vecinos.every((v, n) => v === wf.vecinos[n]);
function wfEscena(id) {
  const E = WF_ESCENAS[id];
  wf.banda = E.banda; wf.canal = E.canal; wf.vecinos = E.vecinos.slice(); wf.micro = E.micro; wf.escena = id;
  if (E.sitio) wfHacia = SITIOS.find((s) => s.id === E.sitio).en.slice();
  wfTocar();
}

/* ---------- Bucle ---------- */
function wfControles() {
  for (const b of wfBandas) b.setAttribute("aria-pressed", String(b.dataset.banda === wf.banda));
  const cinco = wf.banda === "5";
  wfCanalIn.disabled = cinco; wfCanalIn.value = String(wf.canal); wfCanalOut.textContent = cinco ? String(MI_CANAL_5) : String(wf.canal);
  cinco ? wfCanalBox.setAttribute("data-off", "") : wfCanalBox.removeAttribute("data-off");
  wfSelects.forEach((s, n) => { s.value = wf.vecinos[n] === null ? "" : String(wf.vecinos[n]); for (const o of s.options) if (o.value) o.textContent = cinco ? "Con red" : "Canal " + o.value; });
  wfMicroBtn.setAttribute("aria-pressed", String(wf.micro)); wfMicroBtn.textContent = wf.micro ? "Microondas encendido" : "Microondas apagado";
  wf.micro ? wfStage.setAttribute("data-micro", "") : wfStage.removeAttribute("data-micro");
  for (const b of wfEscenasBtn) b.setAttribute("aria-pressed", String(wf.escena === b.dataset.escena && wfIgual(WF_ESCENAS[b.dataset.escena])));
}
function wfDraw() {
  const m = wfMedida();
  wfDrawMovil(m); wfDrawMedida(m);
  if (wfSucio) { wfControles(); wfDrawEspectro(); wfSucio = false; }
}
function wfTick(now) {
  const dt = wfLast ? Math.min((now - wfLast) / 1000, 1 / 20) : 1 / 60;
  wfLast = now;
  if (wfPaseo) {     // hasta que alguien toca, el móvil se pasea por el piso
    wfReloj += dt;
    const paso = Math.floor(wfReloj / 3.4) % WF_PASEO.length;
    if (paso !== wfPaso) { wfPaso = paso; wfHacia = SITIOS[WF_PASEO[paso]].en.slice(); }
  }
  const dx = wfHacia[0] - wf.donde[0], dy = wfHacia[1] - wf.donde[1];
  if (wfStill.matches || Math.hypot(dx, dy) < 0.004) wf.donde = wfHacia.slice();
  else { const f = 1 - Math.exp(-dt / 0.2); wf.donde = [wf.donde[0] + dx * f, wf.donde[1] + dy * f]; }
  wfDraw();
  wfPar = !wfPar;
  if (!wfStill.matches && wfPar) { wfDrawOndas(now / 1000 * 0.9); wfDrawMicro(now / 1000); }
  wfFrame = wfVisible && !wfStill.matches ? requestAnimationFrame(wfTick) : 0;
}
const WF_PASEO = [0, 2, 4, 5, 3, 1];
const wfRun = () => { if (wfStill.matches) { wf.donde = wfHacia.slice(); wfDraw(); wfDrawOndas(0); wfDrawMicro(0.4); } else if (!wfFrame && wfVisible) { wfLast = 0; wfFrame = requestAnimationFrame(wfTick); } };
const wfTocar = () => { wfPaseo = false; wfSucio = true; wfRun(); };

new IntersectionObserver((entries) => { wfVisible = entries[entries.length - 1].isIntersecting; if (wfVisible) wfRun(); }, { rootMargin: "160px 0px" }).observe(wfStage);
for (const b of wfBandas) b.addEventListener("click", () => { wf.banda = b.dataset.banda; wfTocar(); });
wfCanalIn.addEventListener("input", () => { wf.canal = Number(wfCanalIn.value); wfTocar(); });
wfSelects.forEach((s, n) => s.addEventListener("change", () => { wf.vecinos[n] = s.value ? Number(s.value) : null; wfTocar(); }));
wfMicroBtn.addEventListener("click", () => { wf.micro = !wf.micro; wfTocar(); });
for (const b of wfSitiosBtn) b.addEventListener("click", () => { wfHacia = SITIOS.find((s) => s.id === b.dataset.sitio).en.slice(); wfTocar(); });
for (const b of wfEscenasBtn) b.addEventListener("click", () => wfEscena(b.dataset.escena));
wfEspectro.addEventListener("click", (event) => { const c = event.target.dataset && event.target.dataset.canal; if (c && wf.banda === "2.4") { wf.canal = Number(c); wfTocar(); } });
let wfAgarre = false;
wfStage.addEventListener("pointerdown", (event) => {
  const sitio = event.target.dataset && event.target.dataset.sitio;
  if (sitio) { wfHacia = SITIOS.find((s) => s.id === sitio).en.slice(); wfTocar(); return; }
  wfAgarre = true; wfStage.setPointerCapture?.(event.pointerId); wfStage.setAttribute("data-agarrado", "");
  wfHacia = wfDentro(wfMetros(event)); wfTocar();
});
wfStage.addEventListener("pointermove", (event) => { if (wfAgarre) { wfHacia = wfDentro(wfMetros(event)); wf.donde = wfHacia.slice(); wfTocar(); } });
for (const type of ["pointerup", "pointercancel"]) wfStage.addEventListener(type, () => { wfAgarre = false; wfStage.removeAttribute("data-agarrado"); });
wfStage.addEventListener("keydown", (event) => {
  const paso = event.shiftKey ? 1 : 0.25, mover = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[event.key];
  if (mover) { event.preventDefault(); wfHacia = wfDentro([wfHacia[0] + mover[0], wfHacia[1] + mover[1]]); wfTocar(); }
  else if (event.key >= "1" && event.key <= "6") { wfHacia = SITIOS[Number(event.key) - 1].en.slice(); wfTocar(); }
  else if (event.key === "b" || event.key === "B") { wf.banda = wf.banda === "5" ? "2.4" : "5"; wfTocar(); }
});
// Para las pruebas: deja la figura en un estado concreto, sin animación.
window.wfPose = (estado) => { wfPaseo = false; Object.assign(wf, estado, { vecinos: (estado.vecinos || wf.vecinos).slice(), donde: (estado.donde || wf.donde).slice() }); wfHacia = wf.donde.slice(); wfSucio = true; wfDraw(); wfDrawOndas(estado.fase || 0); wfDrawMicro(0.4); return wfMedida(); };
window.wfEstado = () => ({ ...wf, medida: wfMedida() });
wfDraw(); wfDrawOndas(0);
`;

const opciones = `<option value="">Sin red</option>${Array.from({ length: M.CANALES_24 }, (_, i) => `<option value="${i + 1}">Canal ${i + 1}</option>`).join("")}`;
const plateBody =
  `<div class="iso-stage" tabindex="0" role="group" aria-label="Piso con Wi‑Fi: arrastra el móvil o usa las flechas para moverlo; las teclas del 1 al 6 lo llevan a cada sitio y la B cambia de banda">${svg}</div>` +
  `<div class="wf-medidor">` +
  `<div class="wf-m"><span class="wf-m-t">Cobertura</span><span class="wf-barras" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b id="wf-cob"></b><small id="wf-dbm"></small></div>` +
  `<div class="wf-m"><span class="wf-m-t">Datos</span><span class="wf-datos" role="img" aria-label="Datos"><i id="wf-datos"></i></span></div><span></span>` +
  `<div class="wf-m wf-m-inter"><span class="wf-m-t">Interferencias</span><span id="wf-inter"></span></div>` +
  `</div>` +
  `<svg class="wf-espectro" viewBox="0 0 720 198" role="img" aria-label="Espectro: los canales de la banda elegida, con tu red y las de los vecinos"></svg>`;
const controls =
  `<div class="wf-controles fig-controles">` +
  `<div class="wf-fila"><div class="wf-banda fig-grupo" role="group" aria-label="Banda"><button type="button" data-banda="2.4" aria-pressed="true">2,4 GHz</button><button type="button" data-banda="5" aria-pressed="false">5 GHz</button></div>` +
  `<label class="wf-canal">Canal de tu red<input type="range" min="1" max="${M.CANALES_24}" step="1" value="6" aria-label="Canal de tu red"><output>6</output></label></div>` +
  `<div class="wf-fila"><span class="wf-t">Vecinos</span>${["A", "B", "C"].map((l) => `<label class="wf-vecino">${l}<select aria-label="Red del vecino ${l}">${opciones}</select></label>`).join("")}` +
  `<button type="button" class="wf-micro" aria-pressed="false">Microondas apagado</button></div>` +
  `<div class="wf-fila"><span class="wf-t">Móvil en</span><div class="wf-sitios fig-grupo" role="group" aria-label="Dónde está el móvil">${M.SITIOS.map((s) => `<button type="button" data-sitio="${s.id}" aria-pressed="false">${s.nombre}</button>`).join("")}</div></div>` +
  `<div class="wf-fila"><span class="wf-t">Escenas</span><div class="wf-escenas fig-grupo" role="group" aria-label="Escenas guiadas">` +
  `<button type="button" data-escena="porque" aria-pressed="false">¿Por qué 1, 6 y 11?</button>` +
  `<button type="button" data-escena="mismo" aria-pressed="false">Vecino en el mismo canal</button>` +
  `<button type="button" data-escena="solapado" aria-pressed="false">Vecino en canal solapado</button>` +
  `<button type="button" data-escena="pelicula" aria-pressed="false">Película en el salón y correo en la habitación del fondo</button></div></div>` +
  `<p class="wf-nota" aria-live="polite"></p>` +
  `</div>`;

const card = k.plateHtml({
  fig: "Fig 1",
  title: "La Wi‑Fi de un piso",
  hint: "Arrastra el móvil por el piso",
  readout: "",
  keys: [
    { mark: "flat", label: "[#5b90ea] Tu red: las ondas del router y tu canal" },
    { mark: "flat", label: "[#c9c6cf] Redes de los vecinos" },
    { mark: "flat", label: "[#e5484d] Ruido: canales solapados y microondas" },
    { mark: "flat", label: "[#ffffff] Pared de pladur" },
    { mark: "flat", label: "[#ff7a50] Pared de ladrillo" },
    { mark: "flat", label: "[#a7a49d] Muro de carga, de hormigón" },
  ],
  caption:
    `El router del salón emite ondas de radio en todas direcciones. La señal se debilita con la distancia y cada vez que atraviesa una pared, un mueble o agua: es la **atenuación**. El pladur quita poco, el ladrillo más y el hormigón mucho. La línea de puntos une el router con el móvil y marca cada cosa que cruza. ¶` +
    `A más frecuencia, más datos pero menos alcance. En **2,4 GHz** la señal llega más lejos y atraviesa mejor las paredes. En **5 GHz** lleva más datos, pero se queda cerca del router. ¶` +
    `En 2,4 GHz hay 13 canales. Cada uno ocupa unos 22 MHz y están separados solo 5 MHz, así que **se solapan**: solo el **1, el 6 y el 11** no se pisan. Un vecino en un canal solapado con el tuyo es lo peor: las redes no se entienden y cada una es **ruido** para la otra. Si está en tu **mismo canal**, las redes se escuchan y **se turnan** para hablar: va más lento, pero funciona. En 5 GHz hay muchos más canales libres. ¶` +
    `Otros aparatos también emiten en 2,4 GHz y provocan **interferencias**: el microondas de la cocina y el Bluetooth. ¶` +
    `El número en dBm mide la señal que recibe el móvil: cuanto más cerca de 0, más fuerte. Es un modelo: los valores son aproximados y las ondas no están dibujadas a escala.`,
  body: plateBody,
}).replace("</div><figcaption", `</div>${controls}<figcaption`);

const out = join(HERE, "../../wifi.html");
writeFileSync(out, paginaTaller({
  isoCss: k.ISO_CSS,
  titulo: "La Wi‑Fi por dentro",
  etiqueta: "Tema 2 · Medios de transmisión",
  h1: "La Wi‑Fi por dentro",
  lead: "Un piso visto desde arriba. Mueve el móvil de habitación en habitación, cambia de banda y pon vecinos en tu canal para ver por qué la señal se cae.",
  css: CSS,
  card,
  script: kitScript() + live,
}));
console.log("wrote", out);
