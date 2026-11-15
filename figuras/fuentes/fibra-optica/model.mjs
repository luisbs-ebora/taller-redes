// Modelo de rayos de una fibra de salto de índice. Todo lo que la figura enseña sale de aquí.
// Unidades: ángulos en grados hacia fuera, radianes por dentro; longitudes en unidades de dibujo.
export const N_CORE = 1.5;
export const N_CLAD = 1.4;
export const LIGHT_KM_S = 299792.458;
const RAD = Math.PI / 180;

// Apertura numérica y ángulo máximo de entrada desde el aire (cono de aceptación).
export const NA = Math.sqrt(N_CORE * N_CORE - N_CLAD * N_CLAD);
export const ACCEPT_DEG = Math.asin(NA) / RAD;
// Ángulo crítico en la frontera núcleo/revestimiento, medido desde la normal a la pared.
export const CRITICAL_DEG = Math.asin(N_CLAD / N_CORE) / RAD;
// Inclinación máxima del rayo respecto al eje para que haya reflexión total.
export const GLIDE_MAX_DEG = 90 - CRITICAL_DEG;

// Ley de Snell en la cara de entrada: de aire (n = 1) al núcleo.
export const insideOf = (entryDeg) => Math.asin(Math.sin(entryDeg * RAD) / N_CORE) / RAD;
export const guidedAt = (entryDeg) => entryDeg <= ACCEPT_DEG + 1e-9;

// Fracción de luz que se refleja en la pared cuando NO hay reflexión total (Fresnel, luz no polarizada).
export function reflectance(glideDeg) {
  if (glideDeg <= GLIDE_MAX_DEG + 1e-9) return 1;
  const ti = (90 - glideDeg) * RAD;
  const st = (N_CORE * Math.sin(ti)) / N_CLAD;
  const ct = Math.sqrt(Math.max(0, 1 - st * st));
  const ci = Math.cos(ti);
  const rs = (N_CORE * ci - N_CLAD * ct) / (N_CORE * ci + N_CLAD * ct);
  const rp = (N_CLAD * ci - N_CORE * ct) / (N_CLAD * ci + N_CORE * ct);
  return (rs * rs + rp * rp) / 2;
}

// Retardo de un rayo inclinado frente al recto, en ns por km: recorre L / cos(a) en vez de L.
export const delayNsKm = (glideDeg) => ((N_CORE / LIGHT_KM_S) * (1 / Math.cos(glideDeg * RAD) - 1)) * 1e9;

// Traza un rayo que entra por el centro de la cara (x = 0) y avanza hacia −x por un núcleo de
// semianchura `core`, con el revestimiento hasta `clad`, a lo largo de `length`.
// Devuelve los tramos dentro del núcleo (con la potencia que llevan), las fugas al revestimiento
// y la fracción que llega al final.
export function trace(entryDeg, core, clad, length, floor = 0.02) {
  const glide = insideOf(entryDeg);
  const a = glide * RAD;
  if (a < 1e-4) return { glide, guided: true, legs: [{ from: [0, 0], to: [-length, 0], power: 1, start: 0 }], leaks: [], received: 1, bounces: 0, path: length };
  const R = reflectance(glide);
  const guided = R === 1;
  const tan = Math.tan(a);
  const cos = Math.cos(a);
  const cladGlide = guided ? 0 : Math.acos(Math.min(1, (N_CORE / N_CLAD) * cos));
  const legs = [];
  const leaks = [];
  let x = 0, y = 0, side = -1, power = 1, travelled = 0, bounces = 0, received = 0;
  for (let guard = 0; guard < 400; guard++) {
    const run = (side * core - y) * side / tan;
    const reach = x - run;
    if (reach <= -length) {
      const dx = x + length;
      legs.push({ from: [x, y], to: [-length, y + side * dx * tan], power, start: travelled });
      received = power;
      break;
    }
    legs.push({ from: [x, y], to: [reach, side * core], power, start: travelled });
    travelled += run / cos;
    x = reach;
    y = side * core;
    bounces++;
    if (!guided) {
      const out = (clad - core) / Math.tan(cladGlide);
      const end = Math.max(-length, x - out);
      const frac = out > 0 ? (x - end) / out : 1;
      leaks.push({ from: [x, y], to: [end, y + side * (clad - core) * frac], power: power * (1 - R) });
      power *= R;
      if (power < floor) break;
    }
    side = -side;
  }
  return { glide, guided, legs, leaks, received, bounces, path: length / cos };
}
