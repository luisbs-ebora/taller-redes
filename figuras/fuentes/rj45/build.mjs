// El RJ45 por dentro: un conector cortado a lo largo en una prensa de crimpar, con el hilo, la cuchilla y la cuña.
// ANATOMY=/ruta/al/clon node build.mjs  →  ../../rj45.html (con la cabecera y los colores del taller)
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
const WIDTH = 720, HEIGHT = 470;
const FONDO_Y = 104;                     // el conector tiene 8 carriles de 13 de ancho; el corte es el plano y = 0
const PASO = 13;
const Z_BASE = -34, Z_YUNQUE = -6;
const BASE = { x: -100, y: -172, w: 440, d: 236, r: 8 };
const COLUMNA = { x: 50, y: -160, w: 100, d: 34, r: 3 };
const BRAZO = { x: 50, y: -126, w: 100, d: 126, r: 3 };
const Z_BRAZO = 176, ALTO_BRAZO = 18;
const TESTER = { x: -84, y: 16, w: 58, d: 40, r: 4 };
const ALTO_TESTER = 20;

const P = k.fitProjection(
  [...k.boxCorners(BASE, Z_BASE - 14, Z_BASE), [50, -160, 212], [150, 0, 212], [150, -160, 212], [320, 0, 60]],
  WIDTH, HEIGHT, { pad: 16, azimuth: 70, elevation: 21 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const FY = G.frameOf([0, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0]);          // s = y; polígonos en (z, x)
const prisma = (pts, y0, y1) => G.prismOf(FY, pts.map(([x, z]) => [z, x]), y0, y1, P);
const cara = (pts, cerrada = true) => k.pathOf(pts.map(([x, z]) => at([x, 0, z])), cerrada);
const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

// ---------- Banco: base, regla, yunque y columna de la prensa ----------
function banco() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, Z_BASE - 14, 14, P)}"/>`];
  for (const [x, y] of k.corners(BASE, 22).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(mat("grafito", S(k.cylinder(x, y, 8, Z_BASE - 14, 4, P, 28), { tone: "hi" })));
  }
  out.push(S(k.slabOf(BASE, Z_BASE - 10, 10, P, 8, 1.6), { tone: "hi" }));
  out.push(Ln(k.planOutline(k.insetPlan(BASE, 6), Z_BASE, P), { tone: "lo" }));
  const tornillos = k.corners(BASE, 13);
  out.push(Ln(tornillos.map(([x, y]) => k.ring(x, y, 2.6, Z_BASE, P, 16)).join(""), { tone: "lo" }), Dots(tornillos.map(([x, y]) => at([x, y, Z_BASE])), { size: 0.5 }));
  // Regla en milímetros delante del conector: el 0 está en el fondo del carril.
  const regla = { x: M.FONDO - 6, y: 36, w: 26 * M.MM + 12, d: 12, r: 1.5 };
  const ticks = k.topTicks(M.FONDO, M.FONDO + 25 * M.MM, M.MM, 5, regla.y + 0.4, Z_BASE + 1, [3.4, 6.2], P);
  // Marca de los 12-13 mm que hay que dejar de hilo.
  const marca = [12, 13].map((mm) => k.lineOnTop([M.FONDO + mm * M.MM, regla.y + 0.4], [M.FONDO + mm * M.MM, regla.y + 10.5], Z_BASE + 1, P)).join("");
  out.push(mat("crema",
    S(k.slabOf(regla, Z_BASE, 1, P, 3), { tone: "hi", crease: "none" }) + Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" }) + Ln(marca, { tone: "hi", className: "rj-marca" }) +
    k.faceTextSvg(k.topMatrix([M.FONDO + 14.2 * M.MM, regla.y + 9.6], Z_BASE + 1, P, "x"), "12-13 mm", { size: 5.2, tone: "hi" })));
  return out.join("");
}

function columna() {
  const out = [];
  out.push(S(k.slabOf(COLUMNA, Z_BASE, Z_BRAZO + ALTO_BRAZO - Z_BASE, P, 4, 1), { tone: "hi", inner: Ln(k.sideSeam(COLUMNA, Z_BRAZO - 6, P, 4), { tone: "faint" }) }));
  const pie = { x: COLUMNA.x - 14, y: COLUMNA.y - 8, w: COLUMNA.w + 28, d: COLUMNA.d + 16, r: 3 };
  out.unshift(S(k.slabOf(pie, Z_BASE, 8, P, 4, 0.8), { tone: "hi" }));
  out.push(Dots(k.corners(pie, 6).map(([x, y]) => at([x, y, Z_BASE + 8])), { size: 0.5 }));
  return out.join("");
}

function yunque() {
  const plan = { x: -8, y: -FONDO_Y - 8, w: M.LARGO + 16, d: FONDO_Y + 16, r: 3 };
  return S(k.slabOf(plan, Z_BASE, Z_YUNQUE - Z_BASE, P, 4, 1), { tone: "hi" }) +
    Ln(k.planOutline(k.insetPlan(plan, 4), Z_YUNQUE, P, 4), { tone: "faint" });
}

function brazo() {
  const out = [];
  out.push(S(k.slabOf(BRAZO, Z_BRAZO, ALTO_BRAZO, P, 4, 1), { tone: "hi" }));
  const top = Z_BRAZO + ALTO_BRAZO;
  out.push(Ln(k.planOutline(k.insetPlan(BRAZO, 5), top, P, 4), { tone: "faint" }));
  // Guía por la que baja el vástago y pomo de la palanca.
  out.push(S(k.cylinder(100, -52, 13, top, 5, P, 32, 0.6), { tone: "hi" }));
  out.push(mat("naranja", S(k.cylinder(100, -52, 8, top + 5, 12, P, 28, 0.8), { tone: "hi" }) + Ln(k.ring(100, -52, 4.4, top + 17, P, 18), { tone: "lo" })));
  out.push(Dots([[58, -8], [142, -8], [58, -118], [142, -118]].map(([x, y]) => at([x, y, top])), { size: 0.5 }));
  return out.join("");
}

// ---------- El conector: cuerpo de plástico transparente con el corte a la vista ----------
const CUERPO = [[0, 6], [6, 0], [M.LARGO, 0], [M.LARGO, M.ALTO], [4, M.ALTO], [0, M.ALTO - 4]];
const HUECOS = {
  carril: rect(M.FONDO, 120, M.HILO.z0, M.HILO.z1),
  boca: rect(120, M.LARGO, M.CUBIERTA.z0, M.CUBIERTA.z1),
  ranura: rect(M.CUCHILLA.x0 - 2, M.CUCHILLA.x1 + 2, M.HILO.z1, M.ALTO),
  ventana: rect(M.CUNA.x0 - 2, M.CUNA.x1 + 2, M.CUBIERTA.z1, M.ALTO),
};
function conector() {
  const out = [];
  // Pestaña, aplastada bajo el conector.
  out.push(S(prisma([[8, Z_YUNQUE], [150, Z_YUNQUE], [150, 0], [8, 0]], -FONDO_Y + 30, -30), { tone: "hi" }));
  out.push(S(prisma(CUERPO, -FONDO_Y, 0), { tone: "hi" }));
  // Tapa: las ocho ranuras de los contactos y la ventana de la cuña.
  let ranuras = "";
  for (let i = 0; i < 8; i++) ranuras += k.planOutline({ x: M.CUCHILLA.x0 - 2, y: -PASO * i - 9.5, w: M.CUCHILLA.x1 - M.CUCHILLA.x0 + 4, d: 6, r: 0.8 }, M.ALTO, P, 2);
  out.push(Ln(ranuras, { tone: "mid" }));
  out.push(Ln(k.planOutline({ x: M.CUNA.x0 - 2, y: -FONDO_Y + 8, w: M.CUNA.x1 - M.CUNA.x0 + 4, d: FONDO_Y - 16, r: 1.5 }, M.ALTO, P, 3), { tone: "mid" }));
  // Los carriles de los otros siete hilos, marcados en la tapa.
  let carriles = "";
  for (let i = 1; i < 8; i++) carriles += k.lineOnTop([M.CUCHILLA.x1 + 8, -PASO * i], [M.CUNA.x0 - 8, -PASO * i], M.ALTO, P);
  out.push(Ln(carriles, { tone: "faint", free: true }));
  // Cara de corte: el plástico seccionado y los huecos por donde entran el hilo, la cuchilla y la cuña.
  out.push(`<path class="rj-corte" d="${cara(CUERPO)}"/>`);
  out.push(Object.values(HUECOS).map((h) => `<path class="rj-hueco" d="${cara(h)}"/>`).join(""));
  const borde = [[M.LARGO, M.CUBIERTA.z0], [120, M.CUBIERTA.z0], [120, M.HILO.z0], [M.FONDO, M.HILO.z0], [M.FONDO, M.HILO.z1], [M.CUCHILLA.x0 - 2, M.HILO.z1], [M.CUCHILLA.x0 - 2, M.ALTO]];
  const borde2 = [[M.CUCHILLA.x1 + 2, M.ALTO], [M.CUCHILLA.x1 + 2, M.HILO.z1], [120, M.HILO.z1], [120, M.CUBIERTA.z1], [M.CUNA.x0 - 2, M.CUBIERTA.z1], [M.CUNA.x0 - 2, M.ALTO]];
  const borde3 = [[M.CUNA.x1 + 2, M.ALTO], [M.CUNA.x1 + 2, M.CUBIERTA.z1], [M.LARGO, M.CUBIERTA.z1]];
  out.push(Ln(cara(borde, false) + cara(borde2, false) + cara(borde3, false), { tone: "hi" }));
  return out.join("");
}

// ---------- Comprobador con su luz, delante del conector ----------
function tester() {
  const out = [];
  out.push(S(k.slabOf(TESTER, Z_BASE, ALTO_TESTER, P, 4, 1), { tone: "hi" }));
  const top = Z_BASE + ALTO_TESTER, led = [TESTER.x + 16, TESTER.y + 20];
  out.push(Ln(k.planOutline(k.insetPlan(TESTER, 4), top, P, 4), { tone: "faint" }));
  out.push(Ln(k.ring(led[0], led[1], 8.6, top, P, 28), { tone: "lo" }));
  const [cx, cy] = at([...led, top]);
  out.push(`<ellipse id="rj-led" class="rj-led" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="8.2" ry="5.1"/>`);
  out.push(`<g class="rj-rotulo">${k.faceTextSvg(k.topMatrix([TESTER.x + 30, TESTER.y + 24], top, P, "x"), "TESTER", { size: 5, tone: "mid" })}</g>`);
  // Cable del comprobador hasta la punta del conector.
  out.push(Ln(k.pathOf([[TESTER.x + TESTER.w, TESTER.y + 12, top - 6], [-18, 14, top - 6], [-18, 0, 66], [0, 0, 66]].map(at)), { tone: "hi", className: "rj-cable" }));
  out.push(Dots([at([0, 0, 66]), at([TESTER.x + TESTER.w, TESTER.y + 12, top - 6])], { size: 0.9, tone: "hi" }));
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Prensa de crimpar con un conector RJ45 cortado a lo largo. Se ve un hilo entrar por su carril hasta el fondo, la cuchilla dorada del contacto bajar y clavarse en el cobre, y la cuña que sujeta la cubierta del cable. Un comprobador enciende su luz cuando hay contacto.",
  body: [
    mat("pizarra", banco()),
    mat("grafito", columna()),
    mat("metal", yunque()),
    `<g class="rj-plastico">${conector()}</g>`,
    `<g id="rj-traseras" class="m-amarillo"></g>`,
    `<g id="rj-corte-vivo"></g>`,
    `<g id="rj-punzon" class="m-metal"></g>`,
    mat("grafito", brazo()),
    mat("grafito", tester()),
  ],
});

const CSS = `
.iso .rj-plastico{--anatomy-paper:#eef3f6;--anatomy-top:#f7fafc;--anatomy-shade-0:#bccad4;--anatomy-shade-1:#cad6de;--anatomy-shade-2:#d8e1e8;--anatomy-shade-3:#e5ecf0;--anatomy-mid:#3d3a48;--anatomy-lo:#7f8d98;--anatomy-faint:#b9c6cf}
.rj-corte{fill:#c4d2db;stroke:none}
.rj-hueco{fill:#fffaf0;stroke:none}
.iso-line.rj-marca{stroke:#e5484d;stroke-width:1.6px}
.iso-line.rj-cable{stroke:#1d1b24;stroke-width:1.8px}
.rj-rotulo{--anatomy-mid:#e4e6ee}
.rj-led{fill:#25262e;stroke:#0e0e12;stroke-width:1px;transition:fill .15s}
.rj-led[data-on]{fill:#3fbf6a}
.rj-funda{fill:#4f79bd;stroke:#1d1b24;stroke-width:1.4px;stroke-linejoin:round}
.rj-relleno{fill:#dbe6f5;stroke:none}
.rj-aislante{fill:#3fb364;stroke:#1d1b24;stroke-width:1.3px;stroke-linejoin:round}
.rj-cobre{fill:#c8763a;stroke:none}
.rj-cuchilla{fill:#e0b02a;stroke:#1d1b24;stroke-width:1.4px;stroke-linejoin:round}
.rj-cuna{fill:#555866;stroke:#1d1b24;stroke-width:1.4px;stroke-linejoin:round}
.rj-chispa{fill:none;stroke:#3fbf6a;stroke-width:2.4px;stroke-linecap:round}
.rj-aviso{fill:none;stroke:#e5484d;stroke-width:2.4px;stroke-linecap:round;stroke-dasharray:1 5}
.iso-stage{outline:none;touch-action:manipulation}
.fig .ch{margin:22px 0 0;padding:18px 20px 20px;background:var(--d-papel);border:var(--d-borde);border-radius:18px;box-shadow:var(--d-sombra)}
.ch h2{font-size:24px;margin:0 0 6px}
.ch p{margin:0 0 12px}
.ch-normas{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px 28px}
.ch-norma h3{font:800 20px/1.2 var(--f-titulo);margin:0 0 8px}
.ch-norma h3 small{font:500 13px var(--f-mono);color:var(--tinta-2);margin-left:6px}
.ch-hilos{list-style:none;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:5px;margin:0;padding:10px 10px 8px;border:2.5px solid var(--d-tinta);border-radius:12px 12px 4px 4px;background:#fff}
.ch-hilos li{display:grid;justify-items:center;gap:5px;min-width:0}
.ch-pin{font:700 15px var(--f-mono);color:var(--d-tinta)}
.ch-hilo{display:block;width:100%;max-width:30px;height:64px;border:2px solid var(--d-tinta);border-radius:5px}
.ch-nombre{font:700 11.5px/1.15 var(--f-texto);text-align:center;color:var(--tinta);overflow-wrap:anywhere}
.ch-notas{margin:14px 0 0;padding-left:20px;display:grid;gap:6px;font-size:17px}
@media (max-width:560px){.ch-nombre{font-size:9.5px}.ch-hilo{height:52px}.ch-hilos{padding:8px 5px 6px;gap:3px}}
`;

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const BOTONES = [["bien", "Bien hecho"], ["corto", "El hilo no llega al fondo"], ["flojo", "Sin apretar del todo"], ["cubierta", "Cubierta fuera"]];

const live = `
${MODEL}
const RJ = ${JSON.stringify({ P, FONDO_Y, PASO, Z_BRAZO })};
const rjP = RJ.P;
const rjStage = document.querySelector(".iso-stage"), rjReadout = document.querySelector("[data-readout]");
const rjEl = (id) => document.getElementById(id);
const rjTraseras = rjEl("rj-traseras"), rjCorte = rjEl("rj-corte-vivo"), rjPunzon = rjEl("rj-punzon"), rjLed = rjEl("rj-led");
const rjBotones = [...document.querySelectorAll(".rj-controles button")];
const rjStill = matchMedia("(prefers-reduced-motion: reduce)");
const rjAt = (x, z) => iso([x, 0, z], rjP);
const rjCara = (pts, cls) => '<path class="' + cls + '" d="' + pathOf(pts.map(([x, z]) => rjAt(x, z)), true) + '"/>';
const rjRect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const rjPlan = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const rjNum = (v, d = 1) => v.toFixed(d).replace(".", ",");
let rjCaso = "bien", rjT = 0, rjLast = 0, rjFrame = 0, rjVisible = true;

function rjDraw() {
  const caso = CASOS[rjCaso], e = estadoEn(rjT, caso), r = resultadoDe(e, caso);
  // Las otras siete cuchillas, que asoman por la tapa hasta que el punzón las hunde.
  let traseras = "";
  const sale = e.cuchilla - ALTO;
  if (sale > 0.4) for (let i = 7; i >= 1; i--) traseras += solidSvg(extrude(rjPlan(CUCHILLA.x0, CUCHILLA.x1, -RJ.PASO * i - 8, -RJ.PASO * i - 5), ALTO, sale, rjP), { tone: "hi", crease: "none" });
  rjTraseras.innerHTML = traseras;
  // En el plano del corte: el cable, el hilo, la cuchilla y la cuña.
  const borde = e.punta + caso.pelado, fin = e.punta + 300;
  let html = "";
  html += rjCara(rjRect(borde, fin, CUBIERTA.z0, CUBIERTA.z1), "rj-funda");
  html += rjCara(rjRect(borde + 5, fin, CUBIERTA.z0 + 5, CUBIERTA.z1 - 5), "rj-relleno");
  html += rjCara(rjRect(e.punta, fin, HILO.z0, HILO.z1), "rj-aislante");
  html += rjCara(rjRect(e.punta, fin, HILO.cu0, HILO.cu1), "rj-cobre");
  const b = e.cuchilla - CUCHILLA.alto, x0 = CUCHILLA.x0, x1 = CUCHILLA.x1, [d0, d1] = CUCHILLA.dientes;
  html += rjCara([[x0, e.cuchilla], [x1, e.cuchilla], [x1, b + 7], [d1, b], [d1 - 3.4, b + 7], [d0 + 3.4, b + 7], [d0, b], [x0, b + 7]], "rj-cuchilla");
  html += rjCara(rjRect(CUNA.x0, CUNA.x1, e.cuna - CUNA.alto, e.cuna), "rj-cuna");
  if (e.fase === "fin" || e.fase === "sube") {
    const mx = (d0 + d1) / 2;
    if (r.contacto) html += '<path class="rj-chispa" d="' + pathOf([rjAt(mx - 16, HILO.cu1 + 16), rjAt(mx - 9, HILO.cu1 + 9)]) + pathOf([rjAt(mx + 16, HILO.cu1 + 16), rjAt(mx + 9, HILO.cu1 + 9)]) + '"/>';
    else if (!r.debajo) html += '<path class="rj-aviso" d="' + pathOf([rjAt(FONDO + 1, (HILO.z0 + HILO.z1) / 2), rjAt(Math.min(e.punta, 118) - 2, (HILO.z0 + HILO.z1) / 2)]) + '"/>';
    if (r.contacto && !r.dentro) html += '<path class="rj-aviso" d="' + pathOf([rjAt(122, CUBIERTA.z1 - 4), rjAt(Math.min(borde, 198) - 2, CUBIERTA.z1 - 4)]) + '"/>';
  }
  rjCorte.innerHTML = html;
  // El punzón: una cabeza con dos pies, uno sobre los contactos y otro sobre la cuña.
  const pz = e.punzon;
  rjPunzon.innerHTML =
    solidSvg(cylinder(100, -52, 6, pz + 26, Math.max(1, RJ.Z_BRAZO - pz - 26), rjP, 20), { tone: "hi", crease: "none" }) +
    solidSvg(extrude(rjPlan(CUCHILLA.x0 - 4, CUCHILLA.x1 + 4, -RJ.FONDO_Y, 0), pz, 14, rjP), { tone: "hi", crease: "none" }) +
    solidSvg(extrude(rjPlan(CUNA.x0, CUNA.x1, -RJ.FONDO_Y + 10, -10), pz, 14, rjP), { tone: "hi", crease: "none" }) +
    solidSvg(extrude(rjPlan(14, 180, -RJ.FONDO_Y - 2, 2), pz + 14, 12, rjP, { bevel: 1 }), { tone: "hi" });
  rjLed.toggleAttribute("data-on", r.contacto);
  let text;
  if (e.fase === "entra") text = "entra el hilo: le faltan " + rjNum(Math.max(0, r.faltaFondo)) + " mm para el fondo";
  else if (e.fase === "espera") text = r.faltaFondo > 0.5 ? "el hilo se queda a " + rjNum(r.faltaFondo) + " mm del fondo" : "el hilo toca el fondo del carril";
  else if (e.fase === "baja") text = r.atraviesa ? "la cuchilla atraviesa el aislante" : "baja la crimpadora: la cuchilla está a " + rjNum(r.faltaCobre) + " mm del cobre";
  else if (!r.debajo) text = "hilo abierto: la cuchilla baja en vacío, el hilo no llegó al fondo";
  else if (!r.atraviesa) text = "hilo abierto: la cuchilla se queda a " + rjNum(r.faltaCobre) + " mm del cobre, faltó apretar";
  else if (!r.dentro) text = "hace contacto, pero con " + rjNum(r.peladoMm, 0) + " mm de hilo la cuña no coge la cubierta";
  else text = "contacto: la cuchilla toca el cobre y la cuña sujeta la cubierta";
  if (rjReadout.textContent !== text) rjReadout.textContent = text;
}
function rjTick(now) {
  rjFrame = 0;
  const dt = rjLast ? Math.min(0.05, (now - rjLast) / 1000) : 0;
  rjLast = now;
  rjT = (rjT + dt) % CICLO;
  rjDraw();
  if (rjVisible && !rjStill.matches) rjFrame = requestAnimationFrame(rjTick);
}
const rjRun = () => { if (!rjFrame && rjVisible && !rjStill.matches) { rjLast = 0; rjFrame = requestAnimationFrame(rjTick); } };
function rjSet(caso) {
  rjCaso = caso; rjT = rjStill.matches ? 6 : 0;
  for (const b of rjBotones) b.setAttribute("aria-pressed", String(b.dataset.caso === caso));
  rjDraw(); rjRun();
}
new IntersectionObserver((entries) => { rjVisible = entries[entries.length - 1].isIntersecting; if (rjVisible) rjRun(); }, { rootMargin: "120px 0px" }).observe(rjStage);
for (const b of rjBotones) b.addEventListener("click", () => rjSet(b.dataset.caso));
rjStage.addEventListener("keydown", (event) => { const n = Number(event.key); if (n >= 1 && n <= rjBotones.length) { event.preventDefault(); rjSet(rjBotones[n - 1].dataset.caso); } });
window.rjPose = (caso, t) => { rjCaso = caso; rjT = t; rjVisible = false; cancelAnimationFrame(rjFrame); rjFrame = 0; for (const b of rjBotones) b.setAttribute("aria-pressed", String(b.dataset.caso === caso)); rjDraw(); };
rjSet("bien");
`;

const controls = `<div class="rj-controles fig-controles" role="group" aria-label="Cómo se ha hecho el conector">${BOTONES.map(([id, t], i) => `<button type="button" data-caso="${id}" aria-pressed="${i === 0}">${t}</button>`).join("")}</div>`;
const c = (v, d = 1) => v.toFixed(d).replace(".", ",");
const card = k
  .plateHtml({
    fig: "Fig 4",
    title: "RJ45 por dentro",
    hint: "Elige cómo se ha hecho el conector",
    readout: "",
    keys: [
      { mark: "flat", label: "[#e0b02a] Contacto: una cuchilla con dos dientes" },
      { mark: "flat", label: "[#3fb364] Aislante del hilo" },
      { mark: "flat", label: "[#c8763a] Cobre" },
      { mark: "flat", label: "[#4f79bd] Cubierta del cable" },
      { mark: "flat", label: "[#555866] Cuña que sujeta la cubierta" },
    ],
    caption:
      `Un conector RJ45 cortado a lo largo, a la altura de uno de sus ocho hilos, dentro de una prensa de crimpar. El hilo entra por su carril hasta tocar el fondo. ¶` +
      `Cada contacto es una **cuchilla dorada con dos dientes**. Al apretar la crimpadora, baja, atraviesa el aislante y se clava en el cobre: por eso los hilos se meten sin pelar uno a uno. ¶` +
      `**Hilo abierto.** Si el hilo no llegó al fondo, la cuchilla baja en vacío y ese pin no hace contacto: en el tester falta una luz. Pasa lo mismo si la crimpadora no se aprieta hasta el final. ¶` +
      `**La cubierta, dentro.** La crimpadora baja a la vez una cuña que muerde la cubierta. Si dejas más de 12 o 13 mm de hilo, la cubierta se queda fuera (aquí, con ${c(M.CASOS.cubierta.pelado / M.MM, 0)} mm) y la cuña no tiene nada que morder: al cable solo lo sujetan las cuchillas y acaba fallando al primer tirón. ¶` +
      `Aquí no se ve el cortocircuito: ocurre cuando un hilo pelado o mal cortado toca al de al lado.`,
    body: `<div class="iso-stage" tabindex="0" role="group" aria-label="RJ45 por dentro: pulsa del 1 al 4 para ver cada forma de hacer el conector">${svg}</div>`,
  })
  .replace("</div><figcaption", `</div>${controls}<figcaption`);

// ---------- Chuleta: el orden de colores de las dos normas (sección 4 del Tema 2, apartado 1.1) ----------
const COLORES = { n: ["Naranja", "#e8811a"], v: ["Verde", "#2e9e4f"], a: ["Azul", "#2a62c9"], m: ["Marrón", "#7a4a22"] };
const NORMAS = { T568B: ["bn", "n", "bv", "a", "ba", "v", "bm", "m"], T568A: ["bv", "v", "bn", "a", "ba", "n", "bm", "m"] };
const hilo = (id, pin) => {
  const [nombre, color] = COLORES[id.slice(-1)], rayado = id.length === 2;
  return `<li><span class="ch-pin">${pin}</span><i class="ch-hilo" style="${rayado ? `background:repeating-linear-gradient(180deg,#fff 0 7px,${color} 7px 14px)` : `background:${color}`}"></i><span class="ch-nombre">${rayado ? "Blanco-" + nombre.toLowerCase() : nombre}</span></li>`;
};
const norma = (nombre, nota) => `<div class="ch-norma"><h3>${nombre} <small>${nota}</small></h3><ol class="ch-hilos" aria-label="Orden de colores de la norma ${nombre}, del pin 1 al 8">${NORMAS[nombre].map((id, i) => hilo(id, i + 1)).join("")}</ol></div>`;
const chuleta = `<section class="tarjeta ch" aria-labelledby="ch-titulo">
  <h2 id="ch-titulo"><span class="etiqueta">Chuleta</span> El orden de los colores</h2>
  <p>Con la <strong>pestaña hacia abajo</strong> y la abertura del cable <strong>mirando hacia ti</strong>, el pin 1 es el de la izquierda.</p>
  <div class="ch-normas">${norma("T568B", "la más habitual")}${norma("T568A", "")}</div>
  <ul class="ch-notas">
    <li><strong>Truco para la T568B:</strong> blanco-naranja, naranja, blanco-verde, azul, blanco-azul, verde, blanco-marrón, marrón. El par azul va en el centro (pines 4 y 5) y el verde «abraza» al azul (pines 3 y 6).</li>
    <li>Entre la A y la B solo <strong>se intercambian el par naranja y el verde</strong>. El azul y el marrón no se mueven.</li>
    <li><strong>Cable directo:</strong> la misma norma en los dos extremos. <strong>Cable cruzado:</strong> la A en un extremo y la B en el otro.</li>
  </ul>
</section>`;

const out = join(HERE, "../../rj45.html");
writeFileSync(out, paginaTaller({
  isoCss: k.ISO_CSS,
  titulo: "El RJ45 por dentro",
  etiqueta: "Tema 2 · Conectores y herramientas",
  h1: "El RJ45 por dentro",
  lead: "Qué hace la crimpadora dentro del conector, y por qué un hilo que no llega al fondo deja una luz del tester apagada.",
  css: CSS,
  card,
  extra: chuleta,
  script: kitScript() + live,
}));
console.log("wrote", out);
