// Fibra óptica en corte: banco de demostración con láser giratorio, fibra cortada por el eje y receptor.
// ANATOMY=/ruta/al/clon node build.mjs  →  ../../fibra-optica.html (con la cabecera y los colores del taller)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./model.mjs";
import { paginaTaller, mat } from "../marco.mjs";

// La skill Anatomy (MIT, github.com/wheresryan22/anatomy) no va en este repo: indica dónde la tienes clonada.
const ANATOMY = process.env.ANATOMY ?? "/home/claude/terceros/anatomy";
const k = await import(`${ANATOMY}/kit/iso-kit.mjs`);
const G = await import(`${ANATOMY}/kit/lathe.mjs`);
const { kitScript } = await import(`${ANATOMY}/scripts/inline-kit.mjs`);

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 720;
const HEIGHT = 440;

// Mundo: x a lo largo de la fibra (la luz viaja hacia −x), y hacia el espectador, z arriba.
const ZA = 42;            // altura del eje de la fibra = plano del corte
const LEN = 230;          // largo de la fibra
const R_COAT = 32;        // cubierta 250 µm
const R_CLAD = 16;        // revestimiento 125 µm
const R_MM = 6.4;         // núcleo multimodo 50 µm
const R_SM = 1.15;        // núcleo monomodo 9 µm
const STUB = 9;           // tramo pelado junto a la cara de entrada
const PLATE = { x: -292, y: -52, w: 392, d: 150, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const RX = { x: -278, y: -38, w: 48, d: 76, r: 3 };   // receptor
const RX_H = 58;
const SCREEN = { x: -273, z: 22, w: 38, h: 28 };       // pantalla en la cara +y del receptor
const CRADLES = [-190, -70];
const ARM = { r0: -6, r1: 88, half: 4, z: 1.2, h: 3.3 };
const LASER = { r0: 42, r1: 78, half: 7, z: 34, h: 16, post: 60 };
const SECTOR = { r: 96, from: -7, to: 57, h: 1.2 };
const SWEEP = 50;         // recorrido del láser en grados

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(RX, 0, RX_H + 6), [LASER.r1, 0, 52], [50, 62, 52]],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 55 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const DEG = Math.PI / 180;
const polar = (r, deg) => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG)];
const fill = (cls, points, z) => `<path class="${cls}" d="${k.onTop(points, z, P, true)}"/>`;
const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 22).sort((a, b) => depth(...a) - depth(...b))) {
    out.push(mat("grafito", S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "hi" }) + S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "hi" })));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "hi" }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 11);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Regla a lo largo de la fibra: una marca cada 5 unidades, mayor cada 25.
  const strip = { x: -LEN - 3, y: PLATE.y + PLATE.d - 14, w: LEN + 6, d: 6.5, r: 1 };
  out.push(mat("crema",
    S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "hi", crease: "none" }) +
    (() => { const ticks = k.topTicks(-LEN, 0, 5, 5, strip.y + 0.25, 0.6, [2.2, 3.9], P); return Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" }); })() +
    D([at([strip.x + 1.4, strip.y + 5, 0.6]), at([strip.x + strip.w - 1.4, strip.y + 5, 0.6])], { size: 0.4 })));
  // Placa de características: el tipo de fibra montada (texto vivo).
  const label = { x: 22, y: PLATE.y + PLATE.d - 15.5, w: 66, d: 10.5, r: 1.2 };
  out.push(mat("crema",
    S(k.slabOf(label, 0, 0.8, P, 3), { tone: "hi", crease: "none" }) +
    Ln(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), { tone: "faint" }) +
    `<g id="fo-label">${k.faceTextSvg(k.topMatrix([label.x + 7, label.y + 6.6], 0.8, P, "x"), "50/125 µm · multimodo", { size: 3.6, tone: "hi" })}</g>` +
    D([at([label.x + 3, label.y + 5.5, 0.8]), at([label.x + label.w - 3, label.y + 5.5, 0.8])], { size: 0.4 })));
  return out.join("");
}

// Limbo graduado: sector sobre el que gira el brazo del láser, con el eje bajo la cara de entrada.
function sector() {
  const out = [];
  const lead = Math.acos(9 / SECTOR.r) / DEG;
  const ring = [];
  for (let a = SECTOR.from; a <= SECTOR.to + 1e-6; a += 1) ring.push(polar(SECTOR.r, a));
  for (let a = SECTOR.to + lead; a <= 360 + SECTOR.from - lead + 1e-6; a += 6) ring.push(polar(9, a));
  out.push(S(k.extrude(ring, 0, SECTOR.h, P, { bevel: 0.5 }), { tone: "hi" }));
  const z = SECTOR.h;
  const tick = (deg, long) => k.lineOnTop(polar(SECTOR.r, deg), polar(SECTOR.r - long, deg), z, P);
  let minor = "", major = "";
  for (let deg = 0; deg <= SWEEP; deg += 2) {
    if (deg % 10 === 0) major += tick(deg, 4.6);
    else minor += tick(deg, 2.8);
  }
  const rim = [];
  for (let a = SECTOR.from; a <= SECTOR.to + 1e-6; a += 1) rim.push(polar(SECTOR.r, a));
  out.push(Ln(k.onTop(rim, z, P), { tone: "lo" }));
  out.push(Ln(minor, { tone: "lo" }), Ln(major, { tone: "mid" }));
  // Marca del ángulo máximo de aceptación: raya larga con un testigo en la punta.
  out.push(Ln(tick(M.ACCEPT_DEG, 9), { tone: "hi" }));
  out.push(Ln(k.ring(...polar(SECTOR.r - 10.4, M.ACCEPT_DEG), 1.4, z, P, 14), { tone: "hi" }));
  out.push(D([at([...polar(SECTOR.r - 10.4, M.ACCEPT_DEG), z])], { size: 0.55, tone: "hi" }));
  // Surco de guía por donde corre el brazo.
  const groove = [];
  for (let a = SECTOR.from + 3; a <= SECTOR.to - 3 + 1e-6; a += 1) groove.push(polar(70, a));
  const ends = [groove[0], groove[groove.length - 1]].map(([x, y]) => at([x, y, z]));
  out.push(Ln(k.onTop(groove, z, P), { tone: "faint" }), D(ends, { size: 0.45, tone: "lo" }));
  out.push(D([polar(SECTOR.r - 4, SECTOR.from + 2.6), polar(SECTOR.r - 4, SECTOR.to - 2.6), polar(30, SECTOR.from + 8), polar(30, SECTOR.to - 8)].map(([x, y]) => at([x, y, z])), { size: 0.45 }));
  return out.join("");
}

function pin() {
  const out = [S(k.cylinder(0, 0, 4.2, ARM.z + ARM.h, 1.6, P, 24), { tone: "mid" })];
  out.push(S(k.cylinder(0, 0, 2.2, ARM.z + ARM.h + 1.6, 1.8, P, 16), { tone: "hi", crease: "none" }));
  out.push(D([at([0, 0, ARM.z + ARM.h + 3.4])], { size: 0.5 }));
  return out.join("");
}

function receiver() {
  const out = [];
  const top = RX_H;
  const seam = k.sideSeam(RX, top - 6, P, 5);
  out.push(S(k.slabOf(RX, 0, RX_H, P, 5, 0.8), { tone: "hi", inner: Ln(seam, { tone: "faint" }) }));
  out.push(Ln(k.planOutline(k.insetPlan(RX, 4), top, P, 5), { tone: "faint" }));
  const screws = k.corners(RX, 7.5);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 1.7, top, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, top])), { size: 0.45 }));
  // Conector de salida en la tapa.
  out.push(S(k.cylinder(-254, -16, 5.2, top, 1.4, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(-254, -16, 3.8, top + 1.4, 5, P, 24, 0.4), { tone: "mid" }));
  out.push(Ln(k.knurl(-254, -16, 3.8, top + 1.9, top + 5.9, 22, P, 0.3), { tone: "lo" }));
  out.push(Ln(k.ring(-254, -16, 1.5, top + 6.4, P, 12), { tone: "lo" }), D([at([-254, -16, top + 6.4])], { size: 0.45 }));
  // Rejilla de ventilación: ranuras cerradas en la tapa.
  for (const y of [8, 13, 18, 23]) out.push(Ln(k.planOutline({ x: -268, y, w: 28, d: 1.6, r: 0.8 }, top, P, 3), { tone: "lo" }));
  // Boca por la que entra la fibra, en la cara +x.
  const wx = RX.x + RX.w;
  out.push(Ln(k.pathOf([[wx, -10, ZA], [wx, -10, ZA + 9], [wx, 10, ZA + 9], [wx, 10, ZA]].map(at)), { tone: "lo" }));
  out.push(D([[wx, -14, ZA + 4.5], [wx, 14, ZA + 4.5]].map(at), { size: 0.45 }));
  // Mandos y rótulo bajo la pantalla, en la cara +y.
  const face = RX.y + RX.d;
  for (const x of [-266.5, -256]) {
    out.push(Ln(k.sideRing([x, face, 12], 3.4, "y", P, 20), { tone: "mid" }) + Ln(k.sideRing([x, face, 12], 1.1, "y", P, 10), { tone: "lo" }));
  }
  for (const [x1, z] of [[-236.5, 14.4], [-239, 11.8], [-241.5, 9.2]]) out.push(Ln(k.segment([-248, face, z], [x1, face, z], P), { tone: "lo", free: true }));
  // Pantalla: fondo, marcas de tiempo colgando del borde y la traza del pulso (viva).
  const m = k.sideMatrix([SCREEN.x, face], SCREEN.z, P, "left");
  let marks = "";
  for (let x = 4; x < SCREEN.w; x += 4) marks += `M${x} 0V${x % 8 === 0 ? -2.2 : -1.3}`;
  out.push(
    `<g class="fo-pantalla" transform="${m}"><path class="fo-screen" d="M0 0H${SCREEN.w}V${-SCREEN.h}H0Z"/>` +
      `<path class="iso-line" data-tone="lo" d="${marks}"/>` +
      `<path id="fo-trace" class="iso-line fo-trace" d="M0 -4H${SCREEN.w}"/></g>`,
  );
  return out.join("");
}

function cradle(cx, part) {
  const block = { x: cx - 9, y: -38, w: 18, d: 76, r: 1.5 };
  const reach = R_COAT * Math.SQRT1_2;             // la cuña toca la cubierta a 45° bajo el eje
  const lift = ZA - R_COAT;
  const chock = (y0) => S(k.slabOf({ x: cx - 6, y: y0, w: 12, d: 31.5 - reach, r: 0.8 }, lift, ZA - reach - lift, P, 2, 0.4), { tone: "mid" });
  if (part === "back") {
    return (
      S(k.slabOf(block, 0, lift, P, 3, 0.5), { tone: "mid" }) +
      Ln([-35, 35].map((y) => k.ring(cx, y, 1.6, lift, P, 12)).join(""), { tone: "lo" }) +
      D([-35, 35].map((y) => at([cx, y, lift])), { size: 0.45 }) +
      chock(-31.5)
    );
  }
  return chock(reach);
}

const F = G.frameOf([0, 0, ZA], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const faceOf = (x, r, n = 40) => k.pathOf(Array.from({ length: n + 1 }, (_, i) => at([x, r * Math.cos(Math.PI + (Math.PI * i) / n), ZA + r * Math.sin(Math.PI + (Math.PI * i) / n)])), true);
const half = (r, n = 56) => Array.from({ length: n + 1 }, (_, i) => [r * Math.cos(Math.PI + (Math.PI * i) / n), r * Math.sin(Math.PI + (Math.PI * i) / n)]);

function fibre() {
  const out = [];
  // Cubierta (media caña inferior) con sus marcas de metraje, y el tramo pelado de revestimiento.
  const marks = [-205, -160, -115, -45, -25].map((s) => G.arcOf(F, s, R_COAT, P, { from: Math.PI, to: 2 * Math.PI })).join("");
  out.push(mat("amarillo", S(G.prismOf(F, half(R_COAT), -LEN, -STUB, P), { tone: "hi", crease: "lo", inner: Ln(marks, { tone: "lo" }) })));
  out.push(fill("fo-coat", rect(-LEN + 0.3, -STUB - 0.3, -R_COAT + 0.4, R_COAT - 0.4), ZA));
  out.push(`<path class="fo-coat" d="${faceOf(-STUB, R_COAT - 0.4)}"/>`);
  out.push(mat("vidrio", S(G.prismOf(F, half(R_CLAD, 40), -STUB, 0, P), { tone: "hi", crease: "lo" })));
  // El plano del corte: franja de revestimiento y, encima, la del núcleo (viva: cambia de ancho).
  out.push(fill("fo-clad", rect(-LEN + 0.3, -STUB, -R_CLAD, R_CLAD), ZA));
  out.push(fill("fo-clad", rect(-STUB - 0.2, -0.35, -R_CLAD + 0.35, R_CLAD - 0.35), ZA));
  out.push(`<path class="fo-clad" d="${faceOf(0, R_CLAD - 0.35)}"/>`);
  out.push(`<g id="fo-core"></g>`);
  out.push(Ln(k.lineOnTop([-LEN, -R_CLAD], [-STUB, -R_CLAD], ZA, P) + k.lineOnTop([-LEN, R_CLAD], [-STUB, R_CLAD], ZA, P), { tone: "mid" }));
  out.push(Ln(k.lineOnTop([-LEN, -R_COAT], [-LEN, R_COAT], ZA, P), { tone: "mid" }));
  out.push(`<g id="fo-rays"></g><g id="fo-pulses"></g>`);
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Banco de demostración de fibra óptica. Un láser sobre un brazo giratorio apunta a la cara de entrada de una fibra cortada a lo largo, donde se ven el núcleo, el revestimiento y el recubrimiento. Los rayos rebotan dentro del núcleo hasta un receptor con pantalla. Si el láser entra con más de 32,6 grados, la luz se escapa al revestimiento y se pierde en el recubrimiento.",
  body: [
    mat("pizarra", plate()),
    mat("grafito", receiver()),
    mat("metal", CRADLES.map((x) => cradle(x, "back")).join("")),
    mat("crema", sector()),
    `<g id="fo-arm" class="m-metal"></g>`,
    mat("metal", pin()),
    fibre(),
    mat("metal", CRADLES.map((x) => cradle(x, "front")).join("")),
    `<g id="fo-beam"></g><g id="fo-laser" class="m-naranja"></g>`,
  ],
});

const CSS = `
.fo-coat{fill:#ffdf7e;stroke:none}
.fo-clad{fill:#bfdcee;stroke:none}
.fo-core{fill:#ffffff;stroke:none}
.iso-line.fo-ray{stroke:var(--anatomy-red);stroke-width:1.9px}
.iso-line.fo-leak{stroke:var(--anatomy-red);stroke-width:1.2px}
.iso-line.fo-trace{stroke:#ffd23f;stroke-width:1.7px}
.fo-pulse{fill:var(--anatomy-red);stroke:#1d1b24;stroke-width:.9px}
.fo-end{fill:var(--anatomy-red);stroke:none}
.fo-screen{fill:#14171c;stroke:#1d1b24;stroke-width:1.5px}
.fo-pantalla{--anatomy-lo:#6f7785}
.iso-stage{cursor:ew-resize;touch-action:pan-y;outline:none}
`;

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

const live = `
${MODEL}
const FO = ${JSON.stringify({ P, ZA, LEN, R_CLAD, R_MM, R_SM, ARM, LASER, SWEEP, SCREEN })};
const foP = FO.P;
const foStage = document.querySelector(".iso-stage");
const foEl = (id) => document.getElementById(id);
const foArm = foEl("fo-arm"), foBeam = foEl("fo-beam"), foLaser = foEl("fo-laser"), foCore = foEl("fo-core"), foRays = foEl("fo-rays"), foPulses = foEl("fo-pulses"), foTrace = foEl("fo-trace");
const foLabel = foEl("fo-label").querySelector("text");
const foReadout = document.querySelector("[data-readout]");
const foSlider = document.querySelector(".fo-angle input"), foOut = document.querySelector(".fo-angle output"), foAngleBox = document.querySelector(".fo-angle");
const foButtons = [...document.querySelectorAll(".fo-seg button")];
const foStill = matchMedia("(prefers-reduced-motion: reduce)");
const foNum = (v, d = 1) => v.toFixed(d).replace(".", ",");
const foRad = Math.PI / 180;

let foAngle = 20, foWant = 20, foMix = 1, foMode = "mm", foUser = 20;
let foFrame = 0, foLast = 0, foClock = 0, foPulse = 0, foTour = !foStill.matches, foVisible = false, foIdle = 0, foDrawn = { angle: -1, mix: -1 };

const foTurn = (r, off, deg) => { const c = Math.cos(deg * foRad), s = Math.sin(deg * foRad); return [r * c - off * s, r * s + off * c]; };
const foBox = (r0, r1, hw, deg) => [foTurn(r0, -hw, deg), foTurn(r1, -hw, deg), foTurn(r1, hw, deg), foTurn(r0, hw, deg)];

function foDrawArm(deg) {
  const A = FO.ARM, top = A.z + A.h;
  const dots = [20, 40, 80].map((r) => iso([...foTurn(r, 0, deg), top], foP));
  foArm.innerHTML =
    solidSvg(extrude(foBox(A.r0, A.r1, A.half, deg), A.z, A.h, foP, { bevel: 0.4 }), { tone: "mid" }) +
    lineSvg(lineOnTop(foTurn(80, 0, deg), foTurn(A.r1, 0, deg), top, foP), { tone: "hi" }) +
    dotsSvg(dots, { size: 0.5 });
}

function foDrawLaser(deg) {
  const Lz = FO.LASER, top = Lz.z + Lz.h, armTop = FO.ARM.z + FO.ARM.h;
  const [px, py] = foTurn(Lz.post, 0, deg);
  const body = foBox(Lz.r0, Lz.r1, Lz.half, deg);
  const mouth = foTurn(Lz.r0, 0, deg);
  foBeam.innerHTML =
    lineSvg(segment([mouth[0], mouth[1], FO.ZA], [0, 0, FO.ZA], foP), { tone: "red", className: "fo-ray" }) +
    '<circle class="fo-end" r="1" cx="' + iso([mouth[0], mouth[1], FO.ZA], foP).map((v) => v.toFixed(1)).join('" cy="') + '"/>';
  const screws = [[46, 4.6], [46, -4.6], [74, 4.6], [74, -4.6]].map(([r, o]) => iso([...foTurn(r, o, deg), top], foP));
  foLaser.innerHTML =
    solidSvg(cylinder(px, py, 4.8, armTop, 2.4, foP, 24), { tone: "mid" }) +
    solidSvg(cylinder(px, py, 3, armTop + 2.4, Lz.z - armTop - 2.4, foP, 20), { tone: "mid", crease: "none" }) +
    solidSvg(extrude(body, Lz.z, Lz.h, foP, { bevel: 0.6 }), { tone: "hi", inner: lineSvg(ringSeam(body, Lz.z + 11, foP), { tone: "faint" }) }) +
    solidSvg(extrude(foBox(63, 70.5, 2.4, deg), top, 1.3, foP), { tone: "mid", crease: "none" }) +
    lineSvg(lineOnTop(foTurn(49, -2.2, deg), foTurn(59, -2.2, deg), top, foP) + lineOnTop(foTurn(49, 1.2, deg), foTurn(56, 1.2, deg), top, foP), { tone: "lo", free: true }) +
    dotsSvg(screws, { size: 0.45 });
}

function foDrawCore(rc) {
  const Z = FO.ZA, L = FO.LEN;
  const band = onTop([[-L + 0.3, -rc], [-0.35, -rc], [-0.35, rc], [-L + 0.3, rc]], Z, foP, true);
  const face = [];
  for (let i = 0; i <= 24; i++) { const t = Math.PI + (Math.PI * i) / 24; face.push(iso([0, rc * Math.cos(t), Z + rc * Math.sin(t)], foP)); }
  foCore.innerHTML =
    '<path class="fo-core" d="' + band + '"/><path class="fo-core" d="' + pathOf(face, true) + '"/>' +
    lineSvg(lineOnTop([-L, -rc], [0, -rc], Z, foP) + lineOnTop([-L, rc], [0, rc], Z, foP) + pathOf(face), { tone: "mid" });
}

// Los tres rayos que entran a la vez: el más inclinado (el que marca el láser), uno intermedio y el recto.
function foRaysOf(angle, mix, rc) {
  return [
    { deg: angle, weight: mix, share: mix / 3 },
    { deg: angle / 2, weight: 0.5 * mix, share: mix / 3 },
    { deg: 0, weight: 1 - 0.5 * mix, share: 1 - (2 * mix) / 3 },
  ].map((ray) => ({ ...ray, t: trace(ray.deg, rc, FO.R_CLAD, FO.LEN) }));
}

const foShow = (power) => Math.pow(Math.max(0, Math.min(1, power)), 0.55);

function foDrawRays(rays) {
  let html = "";
  const Z = FO.ZA;
  for (const ray of rays) {
    if (ray.weight < 0.02) continue;
    const t = ray.t;
    if (t.guided) {
      const points = [t.legs[0].from, ...t.legs.map((leg) => leg.to)];
      html += '<path class="iso-line fo-ray" opacity="' + ray.weight.toFixed(2) + '" d="' + onTop(points, Z, foP) + '"/>';
      continue;
    }
    for (const leg of t.legs) html += '<path class="iso-line fo-ray" opacity="' + (ray.weight * foShow(leg.power)).toFixed(2) + '" d="' + lineOnTop(leg.from, leg.to, Z, foP) + '"/>';
    for (const leak of t.leaks) {
      const o = (ray.weight * foShow(leak.power)).toFixed(2);
      const end = iso([leak.to[0], leak.to[1], Z], foP);
      html += '<path class="iso-line fo-leak" opacity="' + o + '" d="' + lineOnTop(leak.from, leak.to, Z, foP) + '"/><circle class="fo-end" opacity="' + o + '" r="1.1" cx="' + end[0].toFixed(1) + '" cy="' + end[1].toFixed(1) + '"/>';
    }
  }
  foRays.innerHTML = html;
}

// Posición de un pulso que ha recorrido s unidades por su rayo (o null si ya llegó o se perdió).
function foAlong(t, s) {
  for (const leg of t.legs) {
    const len = Math.hypot(leg.to[0] - leg.from[0], leg.to[1] - leg.from[1]);
    if (s <= leg.start + len) { const f = (s - leg.start) / len; return { at: [leg.from[0] + (leg.to[0] - leg.from[0]) * f, leg.from[1] + (leg.to[1] - leg.from[1]) * f], power: leg.power }; }
  }
  return null;
}

function foDrawPulses(rays, s) {
  let html = "";
  for (const ray of rays) {
    if (ray.weight < 0.05 || s < 0) continue;
    const hit = foAlong(ray.t, s);
    if (!hit) continue;
    const p = iso([hit.at[0], hit.at[1], FO.ZA], foP);
    html += '<circle class="fo-pulse" opacity="' + Math.min(1, 0.35 + ray.weight).toFixed(2) * foShow(hit.power) + '" r="2.1" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '"/>';
  }
  foPulses.innerHTML = html;
}

// La pantalla del receptor: cada rayo deja un pulso; cuanto más camino, más tarde. La suma es lo que se recibe.
function foDrawTrace(rays) {
  const W = FO.SCREEN.w;
  const bumps = rays.filter((ray) => ray.share > 1e-3 && ray.t.received > 1e-3).map((ray) => ({ c: 7 + 200 * (1 / Math.cos(ray.t.glide * foRad) - 1), a: 17 * ray.share * ray.t.received }));
  let d = "";
  for (let x = 0; x <= W + 1e-6; x += 0.25) {
    let y = 4;
    for (const b of bumps) y += b.a * Math.exp(-(((x - b.c) / 1.25) ** 2));
    d += (x ? "L" : "M") + x.toFixed(2) + " " + (-y).toFixed(2);
  }
  foTrace.setAttribute("d", d);
}

function foSay(rays) {
  const lead = rays[0].t;
  let text;
  if (foMode === "sm") text = "monomodo · un solo camino · retardo 0";
  else if (lead.guided) text = foNum(foAngle) + "° → " + foNum(lead.glide) + "° dentro · se guía · +" + Math.round(delayNsKm(lead.glide)) + " ns/km";
  else text = foNum(foAngle) + "° > " + foNum(ACCEPT_DEG) + "° · se escapa · llega " + Math.round(lead.received * 100) + " %";
  if (foReadout.textContent !== text) foReadout.textContent = text;
  const label = foMode === "sm" ? "9/125 µm · monomodo" : "50/125 µm · multimodo";
  if (foLabel.textContent !== label) foLabel.textContent = label;
}

function foDraw() {
  const rc = FO.R_SM + (FO.R_MM - FO.R_SM) * foMix;
  if (Math.abs(foDrawn.angle - foAngle) > 0.004) { foDrawArm(foAngle); foDrawLaser(foAngle); }
  if (Math.abs(foDrawn.mix - foMix) > 0.0005) foDrawCore(rc);
  const rays = foRaysOf(foAngle, foMix, rc);
  if (Math.abs(foDrawn.angle - foAngle) > 0.004 || Math.abs(foDrawn.mix - foMix) > 0.0005) { foDrawRays(rays); foDrawTrace(rays); foDrawn = { angle: foAngle, mix: foMix }; }
  foDrawPulses(rays, foStill.matches ? -1 : (foPulse - 0.25) * (FO.LEN / 1.9));
  foSay(rays);
  foOut.textContent = foNum(foAngle) + "°";
  if (document.activeElement !== foSlider) foSlider.value = String(foAngle);
}

// Paseo en reposo: sube el ángulo hasta que se escapa, vuelve, y enseña el monomodo.
function foProgram(t) {
  const u = t % 26;
  if (u < 6) return ["mm", 10 + (20 * u) / 6];
  if (u < 9) return ["mm", 30];
  if (u < 13) return ["mm", 30 + (12 * (u - 9)) / 4];
  if (u < 15.5) return ["mm", 42];
  if (u < 19) return ["mm", 18];
  if (u < 24.5) return ["sm", 0];
  return ["mm", 10];
}

function foSetMode(mode) {
  foMode = mode;
  for (const b of foButtons) b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
  if (mode === "sm") foAngleBox.setAttribute("data-off", ""); else foAngleBox.removeAttribute("data-off");
  foSlider.disabled = mode === "sm";
}

function foTick(now) {
  const dt = foLast ? Math.min((now - foLast) / 1000, 1 / 30) : 1 / 60;
  foLast = now;
  if (foTour) { foClock += dt; const [mode, deg] = foProgram(foClock); if (mode !== foMode) foSetMode(mode); foWant = deg; }
  else foWant = foMode === "sm" ? 0 : foUser;
  const mixWant = foMode === "sm" ? 0 : 1;
  if (foStill.matches) { foAngle = foWant; foMix = mixWant; }
  else {
    foAngle += (foWant - foAngle) * (1 - Math.exp(-dt / (foTour ? 0.55 : 0.12)));
    foMix += (mixWant - foMix) * (1 - Math.exp(-dt / 0.35));
    if (Math.abs(foWant - foAngle) < 0.01) foAngle = foWant;
    if (Math.abs(mixWant - foMix) < 0.002) foMix = mixWant;
    foPulse = (foPulse + dt) % 2.9;
  }
  foDraw();
  const moving = !foStill.matches || foAngle !== foWant || foMix !== mixWant;
  foFrame = foVisible && moving ? requestAnimationFrame(foTick) : 0;
}
const foRun = () => { if (!foFrame && foVisible) { foLast = 0; foFrame = requestAnimationFrame(foTick); } };
const foTouch = () => { foTour = false; clearTimeout(foIdle); if (!foStill.matches) foIdle = setTimeout(() => { foTour = true; foClock = 0; foRun(); }, 9000); foRun(); };
const foSetAngle = (deg) => { if (foMode === "sm") { foTouch(); return; } foUser = Math.max(0, Math.min(FO.SWEEP, deg)); foTouch(); };

new IntersectionObserver((entries) => { foVisible = entries[entries.length - 1].isIntersecting; if (foVisible) foRun(); }, { rootMargin: "120px 0px" }).observe(foStage);
foSlider.addEventListener("input", () => foSetAngle(Number(foSlider.value)));
for (const b of foButtons) b.addEventListener("click", () => { foUser = foMode === "sm" || foTour ? Math.max(foUser, 12) : foUser; foSetMode(b.dataset.mode); foTouch(); });
let foDrag = null;
foStage.addEventListener("pointerdown", (event) => { foDrag = { x: event.clientX, deg: foTour ? foAngle : foUser }; foStage.setPointerCapture?.(event.pointerId); foSetAngle(foDrag.deg); });
foStage.addEventListener("pointermove", (event) => { if (foDrag) foSetAngle(foDrag.deg - (event.clientX - foDrag.x) * 0.22); });
for (const type of ["pointerup", "pointercancel"]) foStage.addEventListener(type, () => { foDrag = null; });
foStage.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 5 : 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); foSetAngle((foTour ? foAngle : foUser) - step); }
  else if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); foSetAngle((foTour ? foAngle : foUser) + step); }
  else if (event.key === "m" || event.key === "M") { foSetMode(foMode === "sm" ? "mm" : "sm"); foTouch(); }
});
window.foPose = (mode, deg) => { foTour = false; clearTimeout(foIdle); foSetMode(mode); foUser = deg; foAngle = mode === "sm" ? 0 : deg; foMix = mode === "sm" ? 0 : 1; foPulse = 1.4; foDraw(); };
foSetMode("mm");
foDraw();
`;

const plateBody = `<div class="iso-stage" tabindex="0" role="group" aria-label="Fibra óptica: arrastra a los lados o usa las flechas para girar el láser; pulsa M para cambiar entre multimodo y monomodo">${svg}</div>`;
const controls = `<div class="fo-controls fig-controles"><div class="fo-seg fig-grupo" role="group" aria-label="Tipo de fibra"><button type="button" data-mode="mm" aria-pressed="true">Multimodo 50/125</button><button type="button" data-mode="sm" aria-pressed="false">Monomodo 9/125</button></div><label class="fo-angle">Ángulo de entrada<input type="range" min="0" max="${SWEEP}" step="0.5" value="20" aria-label="Ángulo de entrada del láser en grados"><output>20,0°</output></label></div>`;

const c = (v, d = 1) => v.toFixed(d).replace(".", ",");
const card = k.plateHtml({
  fig: "Fig 1",
  title: "Fibra óptica",
  hint: "Arrastra para girar el láser",
  readout: "",
  keys: [
    { mark: "red", label: "Luz: los rayos y los pulsos" },
    { mark: "flat", label: "[#ffffff] Núcleo" },
    { mark: "flat", label: "[#bfdcee] Revestimiento" },
    { mark: "flat", label: "[#ffdf7e] Recubrimiento de plástico" },
    { mark: "edge", label: `Marca del limbo: ángulo máximo de entrada, ${c(M.ACCEPT_DEG)}°` },
  ],

  caption:
    `Modelo ampliado de una fibra cortada a lo largo. La luz entra en el núcleo (índice ${c(M.N_CORE, 2)}) y, al llegar al revestimiento (índice ${c(M.N_CLAD, 2)}), rebota sin salirse: es la reflexión interna total. Solo ocurre si el rayo llega muy rasante; por eso el láser no puede entrar con más de ${c(M.ACCEPT_DEG)}°. Si se pasa, en cada rebote una parte de la luz cruza al revestimiento y se pierde en el recubrimiento de plástico. ¶` +
    `En multimodo entran rayos con distintos ángulos a la vez: los más inclinados recorren más camino y llegan más tarde, así que el pulso se ensancha en la pantalla del receptor y por eso el multimodo solo sirve hasta unos cientos de metros. En monomodo el núcleo es tan fino que solo cabe un camino, el pulso llega limpio y alcanza kilómetros. ¶` +
    `Los índices del modelo están exagerados para que el zigzag se vea: en una fibra de vidrio real se diferencian en torno a un 1 % y los rayos van casi paralelos al eje.`,
  body: plateBody,
}).replace("</div><figcaption", `</div>${controls}<figcaption`);

const out = join(HERE, "../../fibra-optica.html");
writeFileSync(out, paginaTaller({
  isoCss: k.ISO_CSS,
  titulo: "Fibra óptica por dentro",
  etiqueta: "Tema 2 · Medios de transmisión",
  h1: "Fibra óptica por dentro",
  lead: "Una fibra cortada a lo largo. Gira el láser y mira cómo rebota la luz dentro del núcleo, cuándo se escapa y por qué la fibra monomodo llega más lejos.",
  css: CSS,
  card,
  script: kitScript() + live,
}));
console.log("wrote", out);
