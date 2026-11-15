// CSMA/CD con un hub 10BASE-T: banco con un hub, cuatro equipos y sus cables (par de ida y par de vuelta).
// node build.mjs [--dark]  →  csma-cd[-light].html
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
const HEIGHT = 430;

const PLATE = { x: -176, y: -108, w: 326, d: 198, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const HUB = { x: -43, y: -95, w: 86, d: 44, r: 3 };
const HUB_H = 20;
const BOX = { w: 46, d: 36, h: 28 };
const STATIONS = [
  { name: "A", x: -160, y: -95 },
  { name: "B", x: 92, y: -95 },
  { name: "C", x: -110, y: 35 },
  { name: "D", x: 60, y: 35 },
];
// Recorrido de cada cable sobre la placa, del equipo al hub.
const ROUTES = [
  [[-114, -77], [-100, -77], [-100, -42], [-25, -42], [-25, -51]],
  [[115, -59], [115, -50], [55, -50], [55, -73], [43, -73]],
  [[-64, 53], [-5, 53], [-5, -51]],
  [[106, 53], [114, 53], [114, -30], [15, -30], [15, -51]],
];
const WIRE_Z = 0.4;
const PAIR = 1.6;
const SEED = 11;

const lengthOf = (route) => route.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - route[i][0], p[1] - route[i][1]), 0);
const LENGTHS = ROUTES.map(lengthOf);
const TIMING = M.timingOf(LENGTHS);

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...STATIONS.flatMap((s) => k.boxCorners({ ...s, ...BOX, r: 3 }, 0, BOX.h + 5))], WIDTH, HEIGHT, { pad: 30, azimuth: 58 });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const closed = (points) => k.pathOf(points.map(at), true);
// Ranura cerrada en una cara vertical: sobre la cara +y (a lo largo de x) o la cara +x (a lo largo de y).
const slotY = (x0, x1, y, z0, z1) => closed([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]);
const slotX = (x, y0, y1, z0, z1) => closed([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]]);

// Desplaza un recorrido en ángulos rectos hacia un lado, con las esquinas a inglete.
function offset(route, by) {
  const dirs = route.slice(1).map((p, i) => { const dx = p[0] - route[i][0], dy = p[1] - route[i][1], len = Math.hypot(dx, dy); return [dx / len, dy / len]; });
  return route.map((p, i) => {
    const a = dirs[Math.max(0, i - 1)], b = dirs[Math.min(dirs.length - 1, i)];
    const n = i === 0 || i === route.length - 1 ? [-(i ? a : b)[1], (i ? a : b)[0]] : [-a[1] - b[1], a[0] + b[0]];
    return [p[0] + n[0] * by, p[1] + n[1] * by];
  });
}
// Cada línea lleva su trazo en pantalla y las longitudes acumuladas en el mundo y en pantalla,
// para que la señal avance a velocidad constante por el cable.
function lineOf(points) {
  const flat = points.map(([x, y]) => at([x, y, WIRE_Z]));
  const world = [0], screen = [0];
  for (let i = 1; i < points.length; i++) {
    world.push(world[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    screen.push(screen[i - 1] + Math.hypot(flat[i][0] - flat[i - 1][0], flat[i][1] - flat[i - 1][1]));
  }
  return { d: k.pathOf(flat), world, screen };
}
const LINES = ROUTES.map((route) => ({ tx: lineOf(offset(route, PAIR)), rx: lineOf(offset(route, -PAIR).reverse()) }));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 22).sort((a, b) => depth(...a) - depth(...b))) {
    out.push(mat("grafito", S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "hi" }) + S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "hi" })));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "hi" }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 11);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }), D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -150, y: PLATE.y + PLATE.d - 13.5, w: 150, d: 6.5, r: 1 };
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.25, 0.6, [2.2, 3.9], P);
  out.push(mat("crema", S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "hi", crease: "none" }) + Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" })));
  const label = { x: 22, y: PLATE.y + PLATE.d - 15, w: 96, d: 10.5, r: 1.2 };
  out.push(mat("crema",
    S(k.slabOf(label, 0, 0.8, P, 3), { tone: "hi", crease: "none" }) + Ln(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), { tone: "faint" }) +
    k.faceTextSvg(k.topMatrix([label.x + 7, label.y + 6.6], 0.8, P, "x"), "10BASE-T · semidúplex · 10 Mbit/s", { size: 3.6, tone: "hi" }) +
    D([at([label.x + 3, label.y + 5.3, 0.8]), at([label.x + label.w - 3, label.y + 5.3, 0.8])], { size: 0.4 })));
  return out.join("");
}

function wires() {
  const pool = (d, line, way) => [0, 1, 2].map(() => `<path class="cs-sig" data-line="${line}" data-way="${way}" d="${d}" stroke-dasharray="0 99999"/>`).join("");
  return LINES.map((pair, i) => Ln(pair.tx.d + pair.rx.d, { tone: "hi", className: "cs-cable" }) + pool(pair.tx.d, i, "tx") + pool(pair.rx.d, i, "rx")).join("");
}

// Clavija al pie de la cara donde entra el cable; tapa el extremo de los dos hilos.
function plug(end, next) {
  const along = Math.abs(next[0] - end[0]) > Math.abs(next[1] - end[1]);
  const sign = along ? Math.sign(next[0] - end[0]) : Math.sign(next[1] - end[1]);
  const plan = along ? { x: sign > 0 ? end[0] : end[0] - 5, y: end[1] - 3.2, w: 5, d: 6.4, r: 0.8 } : { x: end[0] - 3.2, y: sign > 0 ? end[1] : end[1] - 5, w: 6.4, d: 5, r: 0.8 };
  return mat("blanco", S(k.slabOf(plan, 0, 4.2, P, 2, 0.3), { tone: "hi" }) + D([at([plan.x + plan.w / 2, plan.y + plan.d / 2, 4.2])], { size: 0.4 }));
}

function station(s, i) {
  const plan = { x: s.x, y: s.y, w: BOX.w, d: BOX.d, r: 3 };
  const top = BOX.h, face = s.y + BOX.d, side = s.x + BOX.w;
  const out = [];
  out.push(S(k.slabOf(plan, 0, top, P, 5, 0.8), { tone: "hi", inner: Ln(k.sideSeam(plan, top - 5, P, 5), { tone: "faint" }) }));
  // Tapa: tecla de enviar (viva), placa con la letra y tornillos.
  const key = [s.x + 34, s.y + 13];
  out.push(Ln(k.ring(key[0], key[1], 7.4, top, P, 28), { tone: "lo" }));
  out.push(`<g class="cs-key m-naranja">${S(k.cylinder(key[0], key[1], 5.6, top, 2.6, P, 28, 0.5), { tone: "hi" })}</g>`);
  out.push(k.faceTextSvg(k.topMatrix([s.x + 7, s.y + 21], top, P, "x"), s.name, { size: 11, tone: "hi" }));
  out.push(D(k.corners(plan, 5).map(([x, y]) => at([x, y, top])), { size: 0.45 }));
  out.push(Ln(k.planOutline({ x: s.x + 6, y: s.y + 27, w: 34, d: 2, r: 1 }, top, P, 3), { tone: "lo" }));
  // Cara +x: ranuras de ventilación.
  for (const z of [9, 13, 17]) out.push(Ln(slotX(side, s.y + 8, s.y + 28, z, z + 1.6), { tone: "lo" }));
  // Cara +y: pantalla de estado (viva) y la boca del disco debajo.
  const m = k.sideMatrix([s.x + 5, face], 7.5, P, "left");
  out.push(`<g transform="${m}"><path class="cs-screen" d="M0 0H36V-13.5H0Z"/><text class="cs-text" x="18" y="-4.3" font-size="6.2" text-anchor="middle">LIBRE</text></g>`);
  out.push(Ln(slotY(s.x + 10, s.x + 36, face, 3, 4.6), { tone: "lo" }));
  out.push(plug(ROUTES[i][0], ROUTES[i][1]));
  return `<g class="cs-stn m-crema" data-i="${i}" data-state="idle">${out.join("")}</g>`;
}

function hub() {
  const top = HUB_H, face = HUB.y + HUB.d, side = HUB.x + HUB.w;
  const out = [];
  out.push(S(k.slabOf(HUB, 0, top, P, 5, 0.8), { tone: "hi", crease: "lo", inner: Ln(k.sideSeam(HUB, top - 4.5, P, 5), { tone: "faint" }) }));
  out.push(Ln(k.planOutline(k.insetPlan(HUB, 4), top, P, 5), { tone: "faint" }));
  // Tapa: un piloto por puerto, el piloto de colisión, rejilla y rótulo.
  const leds = [-27, -9, 9, 27].map((x) => [x, -60]);
  out.push(Ln(leds.map(([x, y]) => k.ring(x, y, 2.6, top, P, 16)).join(""), { tone: "lo" }));
  out.push(leds.map((p, i) => { const [cx, cy] = at([...p, top]); return `<circle class="cs-led" data-port="${i}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.9"/>`; }).join(""));
  const col = [26, -81];
  out.push(Ln(k.ring(col[0], col[1], 5.2, top, P, 24) + k.ring(col[0], col[1], 3.4, top, P, 20), { tone: "mid" }));
  const [cx, cy] = at([...col, top]);
  out.push(`<circle class="cs-col" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.2"/>`);
  for (const y of [-87, -83, -79]) out.push(Ln(k.planOutline({ x: -35, y, w: 34, d: 1.6, r: 0.8 }, top, P, 3), { tone: "lo" }));
  out.push(`<g class="cs-rotulo">${k.faceTextSvg(k.topMatrix([-35, -66.5], top, P, "x"), "HUB", { size: 5.2, tone: "mid" })}</g>`);
  out.push(D(k.corners(HUB, 6).map(([x, y]) => at([x, y, top])), { size: 0.45 }));
  // Bocas RJ45: cuatro en la cara +y y una en la cara +x.
  for (const x of [-25, -5, 15, 33]) out.push(Ln(slotY(x - 4, x + 4, face, 6.5, 13), { tone: "mid" }));
  out.push(Ln(slotX(side, -77, -69, 6.5, 13), { tone: "mid" }));
  out.push(ROUTES.map((route) => plug(route[route.length - 1], route[route.length - 2])).join(""));
  return `<g class="cs-hub m-grafito">${out.join("")}</g>`;
}

const devices = [
  { depth: depth(0, -73), svg: hub() },
  ...STATIONS.map((s, i) => ({ depth: depth(s.x + BOX.w / 2, s.y + BOX.d / 2), svg: station(s, i) })),
].sort((a, b) => a.depth - b.depth);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Banco de prácticas con un hub 10BASE-T y cuatro equipos, A, B, C y D, cada uno unido al hub por un cable con un par de ida y otro de vuelta. Las tramas viajan por los cables; cuando dos equipos envían a la vez, el hub enciende el piloto de colisión y manda una señal de atasco a todos, y cada equipo espera un número al azar de ranuras antes de reintentar.",
  body: [mat("pizarra", plate()), wires(), ...devices.map((d) => d.svg)],
});

const CSS = `
.iso-line.cs-cable{stroke:#1d1b24;stroke-width:1.5px}
.cs-sig{fill:none;stroke:#ffd23f;stroke-width:3.4px;stroke-linecap:butt;vector-effect:non-scaling-stroke}
.cs-sig[data-kind="jam"]{stroke:#ff4d3d}
.cs-screen{fill:#14171c;stroke:#1d1b24;stroke-width:1.5px}
.cs-text{font-family:var(--anatomy-mono);font-weight:700;fill:#dfe7e1;letter-spacing:.02em}
.cs-led,.cs-col{fill:#25262e;stroke:#0e0e12;stroke-width:.8px}
.cs-rotulo{align-self:center;font:700 14px var(--f-mono);color:var(--tinta-2);margin-right:2px}
.cs-led[data-on]{fill:#ffd23f}
.cs-col[data-on]{fill:#ff4d3d}
.cs-rotulo{--anatomy-mid:#e4e6ee}
.cs-stn{cursor:pointer}
.cs-stn[data-state="tx"] .cs-key .iso-top{fill:#ffd23f}
.cs-stn[data-state="jam"] .cs-key .iso-top{fill:#ff4d3d}
.cs-stn[data-state="tx"] .cs-text{fill:#ffd23f}
.cs-stn[data-state="jam"] .cs-text,.cs-stn[data-state="backoff"] .cs-text{fill:#ff8f80}
.cs-stn:hover .cs-key .iso-edge{stroke-width:2.6px}
.iso-stage{touch-action:manipulation;outline:none}
`;

const MODEL = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

const live = `
${MODEL}
const CS = ${JSON.stringify({ LINES, LENGTHS, SEED })};
const csStage = document.querySelector(".iso-stage");
const csReadout = document.querySelector("[data-readout]");
const csStations = [...document.querySelectorAll(".cs-stn")].sort((a, b) => a.dataset.i - b.dataset.i);
const csTexts = csStations.map((g) => g.querySelector(".cs-text"));
const csLeds = [...document.querySelectorAll(".cs-led")].sort((a, b) => a.dataset.port - b.dataset.port);
const csCol = document.querySelector(".cs-col");
const csSigs = {};
for (const path of document.querySelectorAll(".cs-sig")) (csSigs[path.dataset.line + path.dataset.way] ||= []).push(path);
const csStill = matchMedia("(prefers-reduced-motion: reduce)");
let csSim = createSim(CS.LENGTHS, CS.SEED);
let csTour = !csStill.matches, csPhase = 0, csMark = 0, csFrame = 0, csLast = 0, csVisible = false, csIdle = 0, csHits = 0, csWas = false, csPaused = false;
// Velocidad de la animación: 1 es la normal. Se recuerda en este navegador.
const CS_RITMOS = [1, 0.4, 0.15];
let csRitmo = 1;
try { const v = Number(localStorage.getItem("csma:ritmo")); if (CS_RITMOS.includes(v)) csRitmo = v; } catch (e) {}
const csRitmoBtns = [...document.querySelectorAll(".cs-controls [data-ritmo]")], csPausaBtn = document.querySelector(".cs-controls [data-pausa]");

// Del tramo de cable [from, to] (unidades del mundo) al trazo en pantalla.
const csMap = (line, s) => { const w = line.world, c = line.screen; let i = 1; while (i < w.length - 1 && s > w[i]) i++; return c[i - 1] + ((c[i] - c[i - 1]) * (s - w[i - 1])) / (w[i] - w[i - 1]); };
function csDrawLine(key, line, list, length, t) {
  const paths = csSigs[key];
  let used = 0;
  for (const e of list) {
    if (used >= paths.length) break;
    const head = Math.min(length, (t - e.t0) * SPEED), tail = Math.max(0, e.t1 === null ? 0 : (t - e.t1) * SPEED);
    if (head <= tail + 0.01) continue;
    const a = csMap(line, tail), b = csMap(line, head), path = paths[used++];
    path.setAttribute("stroke-dasharray", "0 " + a.toFixed(1) + " " + (b - a).toFixed(1) + " 99999");
    if (path.dataset.kind !== e.kind) path.dataset.kind = e.kind;
  }
  for (; used < paths.length; used++) if (paths[used].getAttribute("stroke-dasharray") !== "0 99999") paths[used].setAttribute("stroke-dasharray", "0 99999");
}

const csPlural = (n) => n + (n === 1 ? " ranura" : " ranuras");
const csJoin = (names) => names.length > 1 ? names.slice(0, -1).join(", ") + " y " + names[names.length - 1] : names[0];
function csSay() {
  const st = csSim.stations, of = (state) => st.filter((s) => s.state === state);
  const tx = of("tx"), back = of("backoff"), wait = st.filter((s) => s.state === "defer" && s.rx);
  let text;
  const jam = of("jam");
  if (jam.length) text = "colisión · " + csJoin(jam.map((s) => s.name)) + (jam.length > 1 ? " cortan y envían" : " corta y envía") + " la señal de atasco";
  else if (csSim.hub.colliding) text = "las señales chocan en el hub";
  else {
    const parts = [];
    if (tx.length === 1) parts.push(tx[0].name + " envía");
    if (tx.length > 1) parts.push(csJoin(tx.map((s) => s.name)) + " envían a la vez");
    if (back.length === 1) parts.push(back[0].name + " espera " + csPlural(back[0].k) + " (de 0 a " + (2 ** Math.min(back[0].tries, 10) - 1) + ")");
    else if (back.length) parts.push("en espera: " + back.map((s) => s.name + " " + s.k).join(", ") + " ranuras");
    const again = wait.filter((s) => s.tries > 0 && s.k === 0), held = wait.filter((s) => !again.includes(s));
    if (again.length) parts.push(csJoin(again.map((s) => s.name)) + (again.length > 1 ? " sacan" : " saca") + " 0 ranuras: reintenta" + (again.length > 1 ? "n" : "") + " ya");
    for (const s of held) parts.push(s.name + " escucha: medio ocupado");
    text = parts.length ? parts.join(" · ") : "medio libre";
  }
  if (csReadout.textContent !== text) csReadout.textContent = text;
}

function csDraw() {
  const t = csSim.t;
  CS.LINES.forEach((pair, i) => { csDrawLine(i + "tx", pair.tx, csSim.up[i], CS.LENGTHS[i], t); csDrawLine(i + "rx", pair.rx, csSim.down[i], CS.LENGTHS[i], t); });
  csSim.stations.forEach((s, i) => {
    const text = s.state === "tx" ? "ENVÍA" : s.state === "jam" ? "COLISIÓN" : s.state === "backoff" ? "ESPERA " + Math.max(0, Math.ceil((s.until - t) / csSim.slot - 1e-6)) : s.state === "defer" ? "ESCUCHA" : s.rx === "data" ? "RECIBE" : s.rx === "jam" ? "ATASCO" : "LIBRE";
    if (csTexts[i].textContent !== text) csTexts[i].textContent = text;
    if (csStations[i].dataset.state !== s.state) csStations[i].dataset.state = s.state;
    csLeds[i].toggleAttribute("data-on", csSim.hub.active.includes(i));
  });
  csCol.toggleAttribute("data-on", csSim.hub.colliding);
  csSay();
}

function csAdvance(dt) {
  if (csTour) {
    if (csPhase === 0 && csSim.t >= 0.8) { csSim.request(0); csPhase = 1; csMark = 0; }
    else if (csPhase === 1 && csSim.t > 1.2 && csSim.quiet()) { csMark += dt; if (csMark > 1.2) { csSim.request(0); csSim.request(2); csPhase = 2; csMark = 0; } }
    else if (csPhase === 2 && csSim.quiet()) { csMark += dt; if (csMark > 3) { csSim = createSim(CS.LENGTHS, CS.SEED); csPhase = 0; } }
  }
  csSim.step(dt);
  if (csSim.hub.colliding && !csWas) csHits++;
  csWas = csSim.hub.colliding;
}

function csTick(now) {
  const dt = csLast ? Math.min((now - csLast) / 1000, 1 / 20) : 1 / 60;
  csLast = now;
  if (!csPaused) for (let i = 0; i < 4; i++) csAdvance((dt * csRitmo) / 4);
  csDraw();
  const busy = csTour || !csSim.quiet();
  csFrame = csVisible && busy && !csPaused ? requestAnimationFrame(csTick) : 0;
}
const csRun = () => { if (!csFrame && csVisible) { csLast = 0; csFrame = requestAnimationFrame(csTick); } };
function csPonRitmo(v) {
  csRitmo = v;
  try { localStorage.setItem("csma:ritmo", String(v)); } catch (e) {}
  for (const b of csRitmoBtns) b.setAttribute("aria-pressed", String(Number(b.dataset.ritmo) === v));
}
function csPausa(v) {
  csPaused = v;
  csPausaBtn.setAttribute("aria-pressed", String(v));
  csPausaBtn.textContent = v ? "Seguir" : "Pausa";
  if (!v) csRun();
}
function csSend(indices) {
  if (csTour) { csTour = false; if (!csSim.quiet()) csSim = createSim(CS.LENGTHS, (Math.random() * 1e9) | 0); }
  csPausa(false);
  for (const i of indices) csSim.request(i);
  clearTimeout(csIdle);
  if (!csStill.matches) csIdle = setTimeout(function again() { if (csSim.quiet()) { csSim = createSim(CS.LENGTHS, CS.SEED); csPhase = 0; csTour = true; csRun(); } else csIdle = setTimeout(again, 3000); }, 14000);
  csRun();
}

new IntersectionObserver((entries) => { csVisible = entries[entries.length - 1].isIntersecting; if (csVisible) csRun(); }, { rootMargin: "120px 0px" }).observe(csStage);
csStations.forEach((g, i) => g.addEventListener("click", () => csSend([i])));
for (const b of document.querySelectorAll(".cs-controls [data-send]")) b.addEventListener("click", () => csSend(b.dataset.send.split("").map(Number)));
for (const b of csRitmoBtns) b.addEventListener("click", () => csPonRitmo(Number(b.dataset.ritmo)));
csPausaBtn.addEventListener("click", () => csPausa(!csPaused));
csStage.addEventListener("keydown", (event) => {
  const i = "abcd".indexOf(event.key.toLowerCase());
  if (i >= 0) csSend([i]);
  else if (event.key === " ") { event.preventDefault(); csSend([0, 2]); }
  else if (event.key.toLowerCase() === "p") csPausa(!csPaused);
  else if (event.key.toLowerCase() === "v") csPonRitmo(CS_RITMOS[(CS_RITMOS.indexOf(csRitmo) + 1) % CS_RITMOS.length]);
});
// Para las comprobaciones: lleva el paseo a un instante concreto y lo deja quieto.
window.csAt = (seconds) => { csSim = createSim(CS.LENGTHS, CS.SEED); csTour = true; csPhase = 0; csMark = 0; for (let t = 0; t < seconds; t += 1 / 120) csAdvance(1 / 120); csPausa(true); csDraw(); return csReadout.textContent; };
window.csReloj = () => csSim.t;
csPonRitmo(csRitmo);
csDraw();
`;

const c = (v, d = 1) => v.toFixed(d).replace(".", ",");
const controls = `<div class="cs-controls fig-controles"><div class="fig-grupo" role="group" aria-label="Quién envía"><button type="button" data-send="0">Envía A</button><button type="button" data-send="02">A y C a la vez</button><button type="button" data-send="0123">Los cuatro a la vez</button></div>` +
  `<div class="fig-grupo" role="group" aria-label="Velocidad de la animación"><span class="cs-rotulo">Velocidad</span><button type="button" data-ritmo="1" aria-pressed="true">Normal</button><button type="button" data-ritmo="0.4" aria-pressed="false">Lenta</button><button type="button" data-ritmo="0.15" aria-pressed="false">Muy lenta</button>` +
  `<button type="button" data-pausa aria-pressed="false">Pausa</button></div></div>`;
const card = k
  .plateHtml({
    fig: "Fig 2",
    title: "CSMA/CD con un hub",
    hint: "Pulsa un equipo para que envíe",
    readout: "medio libre",
    keys: [
      { mark: "flat", label: "[#ffd23f] Trama de datos: el hub la repite por todos los demás puertos" },
      { mark: "flat", label: "[#ff4d3d] Señal de atasco (jam): avisa a todos de la colisión" },
      { mark: "flat", label: "[#626675] Hub: un solo dominio de colisión para los cuatro equipos" },
    ],
    caption:
      `Cuatro equipos comparten un hub 10BASE-T en semidúplex: forman un único dominio de colisión. Cada cable lleva un par de ida y otro de vuelta. ¶Antes de enviar, el equipo escucha el medio; si está libre, transmite y sigue escuchando, y el hub repite la señal por todos los demás puertos. Si dos transmiten a la vez, las señales chocan en el hub, que propaga la colisión a todos sus puertos. ¶El equipo que oye algo por su par de vuelta mientras transmite ha detectado la colisión: deja de transmitir, envía la señal de atasco (jam) de 32 bits y espera un número al azar de ranuras, entre 0 y 2ⁿ − 1 tras la colisión número n (el exponente deja de crecer a partir de 10). Si los dos eligen lo mismo, vuelven a chocar; a los 16 intentos la trama se descarta. ¶Al acabar la espera vuelve a escuchar y, si el medio está ocupado, aguarda a que quede libre más la pausa entre tramas (96 tiempos de bit). ¶` +
      `La ranura real dura 512 tiempos de bit, 51,2 µs a 10 Mbit/s, lo mismo que tarda en enviarse la trama mínima de 64 bytes; aquí va a cámara lenta y dura ${c(TIMING.slot)} s, lo que tarda la señal en ir y volver entre los dos equipos más lejanos. Con **Lenta** y **Muy lenta** todo va todavía más despacio, y con **Pausa** se queda quieto para mirarlo.`,
    body: `<div class="iso-stage" tabindex="0" role="group" aria-label="CSMA/CD: pulsa un equipo o las teclas A, B, C y D para que envíe; la barra espaciadora hace que A y C envíen a la vez; V cambia la velocidad y P pone o quita la pausa">${svg}</div>`,
  })
  .replace("</div><figcaption", `</div>${controls}<figcaption`);

const out = join(HERE, "../../csma-cd.html");
writeFileSync(out, paginaTaller({
  isoCss: k.ISO_CSS,
  titulo: "CSMA/CD con un hub",
  etiqueta: "1.º ASIR · PAR · Tema 1",
  h1: "CSMA/CD con un hub",
  lead: "Cuatro equipos y un hub. Haz que envíen a la vez y sigue la colisión, la señal de atasco y la espera al azar de cada uno.",
  css: CSS,
  card,
  script: kitScript() + live,
}));
console.log("wrote", out, "· ranura", TIMING.slot, "s · trama", TIMING.frame.toFixed(1), "s · cables", LENGTHS.join(", "));
