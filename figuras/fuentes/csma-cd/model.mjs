// CSMA/CD semidúplex con un hub (repetidor) y cuatro equipos. Simulación por pasos de tiempo.
// Los tiempos van a cámara lenta, pero guardan las reglas de 802.3:
//  · la ranura dura al menos lo que tarda la señal en ir y volver entre los dos equipos más lejanos;
//  · una trama dura al menos una ranura, para que el emisor siga enviando cuando le llega la colisión;
//  · tras la colisión n-ésima se espera k ranuras, con k al azar entre 0 y 2^min(n,10) − 1;
//  · a los 16 intentos se abandona.
export const SPEED = 330;        // unidades de cable por segundo
export const IFG = 0.3;          // pausa entre tramas
export const JAM = 0.4;          // señal de atasco
export const MAX_TRIES = 16;
export const NAMES = ["A", "B", "C", "D"];

export function timingOf(lengths) {
  const tau = lengths.map((length) => length / SPEED);
  const far = [...tau].sort((a, b) => b - a);
  const slot = Math.ceil(2 * (far[0] + far[1]) * 10) / 10;   // ida y vuelta entre los dos más lejanos
  return { tau, slot, frame: slot + 0.3 };
}

export function createSim(lengths, seed = 1) {
  const { tau, slot, frame } = timingOf(lengths);
  let state = seed >>> 0;
  const random = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  const stations = NAMES.map((name) => ({ name, state: "idle", want: false, tries: 0, k: 0, until: 0, start: 0, busy: -1e9, rx: null, sent: 0, dropped: 0, emit: null }));
  const up = NAMES.map(() => []);      // lo que cada equipo pone en su par de ida
  const down = NAMES.map(() => []);    // lo que el hub pone en cada par de vuelta
  const hubOut = NAMES.map(() => null);
  const sim = { t: 0, tau, slot, frame, stations, up, down, collisions: 0, hub: { active: [], colliding: false } };
  const live = (list, t, delay) => list.find((e) => e.t0 + delay <= t && (e.t1 === null || t < e.t1 + delay));

  sim.request = (index) => { const s = stations[index]; if (s.state === "idle" && !s.want) { s.want = true; return true; } return false; };

  sim.step = (dt) => {
    const t = (sim.t += dt);
    // El hub: repite lo que entra por un puerto en todos los demás; si entran dos a la vez, atasco para todos.
    const coming = NAMES.map((_, i) => live(up[i], t, tau[i]));
    const active = NAMES.map((_, i) => (coming[i] ? i : -1)).filter((i) => i >= 0);
    sim.hub.active = active;
    sim.hub.colliding = active.length > 1;
    NAMES.forEach((_, port) => {
      const kind = active.length > 1 ? "jam" : active.length === 1 && active[0] !== port ? coming[active[0]].kind : null;
      const open = hubOut[port];
      if ((open ? open.kind : null) === kind) return;
      if (open) open.t1 = t;
      hubOut[port] = kind ? { kind, t0: t, t1: null } : null;
      if (kind) down[port].push(hubOut[port]);
    });
    // Cada equipo.
    stations.forEach((s, i) => {
      const heard = live(down[i], t, tau[i]);
      s.rx = heard ? heard.kind : null;
      if (s.rx) s.busy = t;
      if (s.state === "idle" && s.want) s.state = "defer";
      if (s.state === "defer" && !s.rx && t - s.busy >= IFG) {
        s.state = "tx"; s.start = t; s.emit = { kind: "data", t0: t, t1: null }; up[i].push(s.emit);
      } else if (s.state === "tx") {
        if (s.rx) {                                   // oye algo mientras envía: colisión
          s.emit.t1 = t; s.emit = { kind: "jam", t0: t, t1: t + JAM }; up[i].push(s.emit);
          s.state = "jam"; s.until = t + JAM; sim.collisions++;
        } else if (t >= s.start + frame) { s.emit.t1 = t; s.state = "idle"; s.want = false; s.tries = 0; s.sent++; s.busy = t; }
      } else if (s.state === "jam" && t >= s.until) {
        s.tries++; s.busy = t;
        if (s.tries >= MAX_TRIES) { s.state = "idle"; s.want = false; s.tries = 0; s.dropped++; return; }
        s.k = Math.floor(random() * 2 ** Math.min(s.tries, 10));
        s.until = t + s.k * slot; s.state = "backoff";
      } else if (s.state === "backoff" && t >= s.until) s.state = "defer";
    });
    for (const list of [...up, ...down]) while (list.length && list[0].t1 !== null && list[0].t1 + 3 < t) list.shift();
  };
  sim.quiet = () => stations.every((s) => s.state === "idle" && !s.want && !s.rx) && sim.hub.active.length === 0;
  return sim;
}
