// red.js — Red animada de «Cerámicas Ribera del Tajo» (estilo cartoon).
// Cada paso es una entrega del pedido: una caja en el muelle de carga que, al montarse,
// reparte su material por las naves. Cada paso tiene montar(ctx) y mal(ctx).
// Unidades: maqueta (no a escala). Las distancias reales se rotulan.
import * as THREE from 'three';
import { kit, nuevaTinta, TINTA } from './toon.js';
import { animar, esperar, ease, velocidad } from './anim.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

const C = {
  cesped: 0x9fd38a, cespedOsc: 0x7fbf6c, asfalto: 0x8c93a3, linea: 0xf7f1e3, suelo: 0xf1e4c8, sueloTaller: 0xd9d3c4,
  sueloAlmacen: 0xe6d8b4, muro: 0xf7f1e3, muroBorde: 0xe2794f, mesa: 0xc98f5a, silla: 0x4a86e8, pc: 0x37405a,
  monitor: 0x2e3340, rack: 0x3a4152, sw: 0x4a86e8, nas: 0x8b6fe0, sai: 0x2e3340, carton: 0xd9a066, cartonOsc: 0xb87f45,
  fibra: 0xff8a3d, cobre: 0x4a86e8, zanja: 0x8a5a3a, horno: 0xe5484d, hornoOsc: 0xa8322f, estante: 0xc98f5a,
  blanco: 0xffffff, crema: 0xfffaf0, amarillo: 0xffd23f, verde: 0x3fbf6a, rojo: 0xe5484d, gris: 0x9aa3b2, lila: 0x8b6fe0,
};

const PANTALLA = { apagada: 0x2e3340, ok: 0x7fb4ff, mal: 0xe5484d };
const LED = { apagado: 0x5b6375, ok: 0x3fbf6a, mal: 0xe5484d };

// ---------- Naves ----------
// c = centro; W ancho (x), D fondo (z). Pared del fondo en z = -D/2. Las posiciones de dentro son locales.
export const NAVES = {
  O: { nombre: 'Nave 1 · Oficinas', c: V(-30, 0, 4), W: 34, D: 22, suelo: C.suelo, rackX: -14.5,
       mesas: [-7, -1.5, 4, 9.5].flatMap(x => [-3, 2.5, 8].map(z => [x, z])) },
  T: { nombre: 'Nave 2 · Taller', c: V(40, 0, -24), W: 28, D: 18, suelo: C.sueloTaller, rackX: -11.5,
       mesas: [-6, -1, 4].flatMap(x => [-1.5, 4].map(z => [x, z])) },
  A: { nombre: 'Nave 3 · Almacén', c: V(32, 0, 26), W: 24, D: 18, suelo: C.sueloAlmacen, rackX: -9.5,
       mesas: [-5, 0].flatMap(x => [-1, 4.5].map(z => [x, z])) },
  K: { nombre: 'Tienda de Toledo · a 80 km', c: V(2, 0, -62), W: 16, D: 11, suelo: C.suelo, rackX: -6,
       mesas: [[-2.5, 1], [1.5, 1], [5.5, 1]] },
};
const L = (n, x, y, z) => V(n.c.x + x, y, n.c.z + z);
const fondo = n => -n.D / 2 + 0.75;            // z local donde va la canaleta del fondo
const rackPos = n => L(n, n.rackX, 0, -n.D / 2 + 0.95);
const OP = () => L(NAVES.O, -10.5, 2.2, -NAVES.O.D / 2 + 0.55);   // router del operador (oficinas)
const OPK = () => L(NAVES.K, -6, 1.6, -NAVES.K.D / 2 + 0.55);     // router del operador (tienda)
const NUBE = V(-22, 16, -40);
const IMPRESORA = [14, -7.5];
const AP_O = [[-4, -1], [8, 5]];
const HORNOS = [-5.5, -1.8, 1.9, 5.6];
const LECTORES = [[5.5, 5.5], [8.5, 5.5]];
const PORTATILES = [[-12.5, 4.5], [-11, 5.8], [-12.5, 7.1], [-14, 5.8]];

// Muelle de carga: cajas del pedido en fila
const MUELLE_Z = 54;
const muelle = i => V(-54 + i * 9, 0, MUELLE_Z);

export const ORDEN = ['armarios', 'cableado', 'puestos', 'switches', 'servidor', 'impresora', 'wifi', 'fibra',
  'internet', 'encender', 'topologia', 'tipos', 'averia'];

export const PRESUPUESTO = 30000;

// ---------- Utilidades de animación ----------
function poner(padre, m, x, y, z) { m.position.set(x, y, z); padre.add(m); return m; }

const tramoA = (t, i, n, solape = 0.55) => {
  // reparte t entre n elementos con solape: devuelve el avance (0..1) del elemento i
  const ancho = 1 / (1 + (n - 1) * (1 - solape));
  const ini = i * ancho * (1 - solape);
  return Math.min(1, Math.max(0, (t - ini) / ancho));
};

// Hace volar varios objetos desde un punto hasta su sitio, uno detrás de otro.
async function repartir(items, desde, ms = 1300, altura = 10) {
  const datos = items.map(o => ({ o, dest: o.position.clone(), s: o.scale.clone() }));
  datos.forEach(d => { d.o.position.copy(desde); d.o.scale.setScalar(0.001); d.o.visible = true; });
  await animar(ms, t => {
    datos.forEach((d, i) => {
      const u = ease.suave(tramoA(t, i, datos.length));
      d.o.position.lerpVectors(desde, d.dest, u);
      d.o.position.y += Math.sin(Math.PI * u) * altura;
      d.o.scale.copy(d.s).multiplyScalar(Math.max(0.001, Math.min(1, u * 3)));
    });
  }, ease.lineal);
}

async function aparecer(objs, ms = 600) {
  const lista = [].concat(objs);
  lista.forEach(o => { o.visible = true; o.scale.setScalar(0.001); });
  await animar(ms, t => lista.forEach((o, i) => o.scale.setScalar(Math.max(0.001, ease.muelle(tramoA(t, i, lista.length))))), ease.lineal);
}

const crecer = (malla, ms) => {
  const total = malla.geometry.index.count, paso = 60;
  malla.geometry.setDrawRange(0, 0);
  return animar(ms, t => malla.geometry.setDrawRange(0, Math.floor((t * total) / paso) * paso), ease.lineal);
};

// Línea quebrada → curva para TubeGeometry con esquinas suaves
function polilinea(pts) {
  const c = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) c.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return c;
}

// Punto a lo largo de una polilínea, t de 0 a 1
function puntoEn(ruta, t, dest) {
  const objetivo = t * ruta.largo;
  let i = 1;
  while (i < ruta.acum.length - 1 && ruta.acum[i] < objetivo) i++;
  const a = ruta.pts[i - 1], b = ruta.pts[i];
  const tramo = ruta.acum[i] - ruta.acum[i - 1] || 1;
  return dest.lerpVectors(a, b, (objetivo - ruta.acum[i - 1]) / tramo);
}
function nuevaRuta(pts, opts) {
  const acum = [0];
  for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, acum, largo: acum[acum.length - 1], fase: Math.random(), ...opts };
}

// Texto sobre una cara (etiquetas de las cajas del pedido)
function texturaTexto(lineas, { fondo = '#fffaf0', tinta = '#1d1b24', ancho = 256, alto = 160, tam = [56, 36] } = {}) {
  const cv = document.createElement('canvas');
  cv.width = ancho; cv.height = alto;
  const g = cv.getContext('2d');
  g.fillStyle = fondo; g.fillRect(0, 0, ancho, alto);
  g.strokeStyle = tinta; g.lineWidth = 8; g.strokeRect(4, 4, ancho - 8, alto - 8);
  g.fillStyle = tinta; g.textAlign = 'center'; g.textBaseline = 'middle';
  const n = lineas.length;
  lineas.forEach((l, i) => {
    g.font = `800 ${tam[Math.min(i, tam.length - 1)]}px "Bricolage Grotesque", "Segoe UI", sans-serif`;
    g.fillText(l, ancho / 2, (alto / (n + 1)) * (i + 1) + (i === 0 && n > 1 ? -6 : 4), ancho - 20);
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---------- Construcción ----------
export function construirRed() {
  const R = {
    encendida: false,
    caidas: new Set(),          // switches averiados: 'O', 'T', 'A'
    rutas: [],                  // recorridos de los paquetes
    aps: [],                    // puntos de acceso encendidos
    pantallas: {}, leds: {},
    reloj: 0,
  };
  for (const id of Object.keys(NAVES)) {
    R.pantallas[id] = new THREE.MeshBasicMaterial({ color: PANTALLA.apagada });
    R.leds[id] = new THREE.MeshBasicMaterial({ color: LED.apagado });
  }

  const escenario = construirEscenario(R);
  const P = {};

  function nuevaPieza(id, datos) {
    const grupo = new THREE.Group(), cuerpo = new THREE.Group(), fijo = new THREE.Group();
    grupo.add(cuerpo);
    grupo.userData.id = id; fijo.userData.id = id;
    const tinta = nuevaTinta(), tintas = [tinta];
    const p = { id, grupo, cuerpo, fijo, tintas, k: kit(tinta, tintas), hover: 0, salto: 0, montado: false,
      requiere: [], coste: 0, compra: [], ...datos };
    P[id] = p;
    return p;
  }

  // Caja del pedido en el muelle (lo que se pulsa antes de montar)
  function cajaPedido(p, i, lineas, color = C.carton) {
    const k = p.k;
    p.grupo.position.copy(muelle(i));
    const caja = poner(p.cuerpo, k.caja(6.4, 4.2, 5.2, color, 0.09), 0, 2.1, 0);
    poner(caja, k.caja(6.5, 0.5, 1.2, C.cartonOsc, 0), 0, 1.9, 0);   // cinta de embalar
    const tex = texturaTexto(lineas);
    const etiqueta = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.9), new THREE.MeshBasicMaterial({ map: tex }));
    poner(caja, etiqueta, 0, -0.2, 2.62);
    p.caja = caja;
    p.desde = () => p.grupo.position.clone().add(V(0, 4, 0));
    return caja;
  }
  // Al montar: la caja se abre y desaparece
  async function vaciarCaja(p) {
    const c = p.caja;
    await animar(260, t => { c.scale.set(1 + 0.12 * t, 1 - 0.15 * t, 1 + 0.12 * t); }, ease.salida);
    animar(380, t => { c.scale.setScalar(Math.max(0.001, 1 - t)); c.rotation.y = t * 1.5; }, ease.suave).then(() => { p.cuerpo.visible = false; });
  }

  /* ===== 1. Armarios ===== */
  {
    const p = nuevaPieza('armarios', {
      nombre: 'Armarios de comunicaciones', accion: 'Colgar los armarios', coste: 540,
      compra: [['AR-01', 'Armario rack de pared 9U', 3, 540]],
      texto: 'Un armario rack en cada nave. Dentro irán el switch y, en las oficinas, también el servidor y el SAI. Así nadie los golpea, derrama algo encima o los desenchufa sin querer (requisito R3).',
      tituloMal: 'Switch y servidor encima de una mesa',
      textoMal: 'Sin armario, cualquiera puede tirarlos, mojarlos o desenchufarlos. El requisito R3 pide guardar los datos en un lugar protegido.',
      foco: () => NAVES.O.c.clone(), dist: 70,
    });
    cajaPedido(p, 0, ['AR-01', '× 3']);
    const k = p.k;
    p.racks = {};
    for (const id of ['O', 'T', 'A']) {
      const n = NAVES[id];
      const g = new THREE.Group();
      g.position.copy(rackPos(n));
      // armario de pared: cuerpo oscuro abierto por delante
      poner(g, k.caja(3.4, 0.3, 1.5, C.rack, 0.06), 0, 1.0, 0);
      poner(g, k.caja(3.4, 0.3, 1.5, C.rack, 0.06), 0, 4.1, 0);
      poner(g, k.caja(0.3, 3.4, 1.5, C.rack, 0.06), -1.55, 2.55, 0);
      poner(g, k.caja(0.3, 3.4, 1.5, C.rack, 0.06), 1.55, 2.55, 0);
      poner(g, k.caja(3.4, 3.4, 0.2, 0x8592a6, 0.04), 0, 2.55, -0.65);
      g.visible = false;
      p.fijo.add(g);
      p.racks[id] = g;
    }
    p.montar = async ctx => {
      ctx.enfocar(V(0, 0, 0), 900, V(0, 1, 0.9), 150);
      await vaciarCaja(p);
      await repartir(Object.values(p.racks), p.desde(), 1500, 16);
      ctx.burbuja('Un armario en cada nave', L(NAVES.O, NAVES.O.rackX, 6.5, -NAVES.O.D / 2));
    };
    p.mal = async ctx => {
      const n = NAVES.O, k2 = p.k;
      const g = new THREE.Group(); g.position.copy(L(n, 13.5, 0, 6.5)); p.fijo.add(g);
      poner(g, k2.caja(3.2, 1.6, 2.2, C.mesa, 0.06), 0, 0.8, 0);
      const sw = poner(g, k2.caja(2.2, 0.35, 1.0, C.sw, 0.05), -0.4, 1.8, 0);
      const nas = poner(g, k2.caja(1.0, 1.2, 1.3, C.nas, 0.05), 0.9, 2.2, 0);
      const taza = poner(g, k2.cil(0.32, 0.6, C.blanco, 0.05, 14), -0.4, 7, 0);
      ctx.enfocar(g.position.clone(), 800, V(0.3, 0.8, 1), 34);
      await aparecer([sw, nas], 400);
      await esperar(300);
      await animar(520, t => { taza.position.y = 7 - 5 * t; taza.rotation.z = t * 2.4; }, ease.rebote);
      ctx.chispas(g.position.clone().add(V(0, 2.2, 0)), true);
      ctx.burbuja('¡Sin armario no está protegido!', g.position.clone().add(V(0, 5, 0)), 'peligro');
      await esperar(900);
    };
  }

  /* ===== 2. Cableado ===== */
  {
    const p = nuevaPieza('cableado', {
      nombre: 'Tomas y cable', accion: 'Tender el cable', coste: 850, requiere: ['armarios'],
      compra: [['CU-01', 'Bobina de cable Cat 6 (305 m)', 3, 480], ['CU-03', 'Toma de red de pared doble', 20, 160], ['CU-02', 'Latiguillo Cat 6 de 2 m', 70, 210]],
      texto: '34 tomas de red: 15 en las oficinas (12 puestos, la impresora y 2 puntos de acceso), 10 en el taller, 6 en el almacén y 3 en la tienda. A 25 m de cable por toma salen 850 m: 3 bobinas de 305 m.',
      tituloMal: 'Comprar solo 2 bobinas',
      textoMal: '2 × 305 = 610 m, y hacen falta 850 m. El cable se acaba antes de llegar a todos los puestos.',
      foco: () => NAVES.O.c.clone(), dist: 80,
    });
    cajaPedido(p, 1, ['CU-01 · 03', 'cable y tomas'], C.carton);
    const k = p.k;
    p.canales = [];       // tubos del cable (crecen)
    p.tomas = [];
    p.rutasNave = {};     // para los paquetes: nave → [{desde, pts}]
    const puntosNave = id => {
      const n = NAVES[id];
      const pts = n.mesas.map(([x, z]) => [x + 1.5, z]);
      if (id === 'O') { pts.push([IMPRESORA[0] - 1.6, IMPRESORA[1] + 0.5]); AP_O.forEach(([x, z]) => pts.push([x + 0.9, z])); }
      if (id === 'T') HORNOS.forEach(z => pts.push([7.6, z]));
      if (id === 'A') LECTORES.forEach(([x, z]) => pts.push([x, z - 1.4]));
      return pts;
    };
    for (const id of ['O', 'T', 'A', 'K']) {
      const n = NAVES[id];
      const zF = fondo(n);
      const rack = id === 'K' ? OPK().setY(0.35) : rackPos(n).setY(0.35);
      const tomas = puntosNave(id);
      const xs = tomas.map(t => t[0]);
      // canaleta del fondo
      const xMin = Math.min(n.rackX, ...xs), xMax = Math.max(n.rackX, ...xs);
      const canFondo = poner(p.fijo, k.caja(xMax - xMin + 0.8, 0.35, 0.5, C.blanco, 0.04), 0, 0, 0);
      canFondo.position.copy(L(n, (xMin + xMax) / 2, 0.2, zF));
      canFondo.scale.setScalar(0.001);
      p.canales.push({ obj: canFondo, tipo: 'fondo' });
      p.rutasNave[id] = [];
      tomas.forEach(([x, z], i) => {
        const pts = [L(n, x, 0.35, z), L(n, x, 0.35, zF), V(rack.x, 0.35, n.c.z + zF), rack.clone()];
        const tubo = k.tubo(polilinea(pts.slice(0, 2)), 0.12, C.cobre, 0.04, 8);
        tubo.geometry.setDrawRange(0, 0);
        p.fijo.add(tubo);
        p.canales.push({ obj: tubo, tipo: 'cable' });
        const toma = poner(p.fijo, k.caja(0.7, 0.55, 0.3, C.blanco, 0.04), 0, 0, 0);
        toma.position.copy(L(n, x, 0.45, z));
        toma.visible = false;
        p.tomas.push(toma);
        p.rutasNave[id].push({ pts, i });
      });
    }
    p.montar = async ctx => {
      ctx.enfocar(V(0, 0, -6), 900, V(0, 1, 0.75), 150);
      await vaciarCaja(p);
      p.canales.forEach(c => { if (c.tipo === 'cable') c.obj.geometry.setDrawRange(0, 0); else c.obj.scale.setScalar(0.001); });
      await animar(1200, t => p.canales.forEach((c, i) => {
        const u = tramoA(t, i, p.canales.length, 0.85);
        if (c.tipo === 'cable') c.obj.geometry.setDrawRange(0, Math.floor(u * c.obj.geometry.index.count / 6) * 6);
        else c.obj.scale.setScalar(Math.max(0.001, u));
      }), ease.lineal);
      await aparecer(p.tomas, 700);
      ctx.burbuja('34 tomas · 850 m de cable', NAVES.O.c.clone().add(V(0, 6, 0)));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(0, 0, -6), 900, V(0, 1, 0.75), 150);
      await vaciarCaja(p);
      const corte = Math.floor(p.canales.length * 610 / 850);
      p.canales.forEach(c => { if (c.tipo === 'cable') c.obj.geometry.setDrawRange(0, 0); else c.obj.scale.setScalar(0.001); });
      await animar(1100, t => p.canales.forEach((c, i) => {
        if (i >= corte) return;
        const u = tramoA(t, i, corte, 0.85);
        if (c.tipo === 'cable') c.obj.geometry.setDrawRange(0, Math.floor(u * c.obj.geometry.index.count / 6) * 6);
        else c.obj.scale.setScalar(Math.max(0.001, u));
      }), ease.lineal);
      ctx.burbuja('¡Se acabó el cable!', NAVES.A.c.clone().add(V(0, 6, 0)), 'peligro');
      ctx.burbuja('Faltan 240 m', NAVES.K.c.clone().add(V(0, 5, 0)), 'peligro');
      await esperar(1200);
    };
  }

  /* ===== 3. Puestos ===== */
  {
    const p = nuevaPieza('puestos', {
      nombre: 'Puestos de trabajo', accion: 'Colocar los ordenadores', coste: 24150, requiere: ['cableado'],
      compra: [['OR-02', 'Sobremesa de oficina «Office M»', 25, 17250], ['OR-05', 'Monitor de 24"', 25, 3500], ['OR-04', 'Portátil «Travel 14»', 4, 3400]],
      texto: '25 ordenadores de sobremesa (12 + 6 + 4 + 3) con su monitor, porque no lo traen, y 4 portátiles para los comerciales. Los terminales de los hornos y los lectores ya los tiene la empresa: solo hay que conectarlos con un latiguillo.',
      tituloMal: 'Ordenadores gaming para la oficina',
      textoMal: 'Con el OR-03 los 25 puestos cuestan 36.250 € solo en ordenadores: te pasas del presupuesto. Para trabajar en una oficina no hace falta un PC gaming.',
      foco: () => NAVES.O.c.clone(), dist: 70,
    });
    cajaPedido(p, 2, ['OR-02 · 05', '25 + 25'], C.carton);
    const k = p.k;
    p.equipos = [];
    for (const id of ['O', 'T', 'A', 'K']) {
      const n = NAVES[id];
      for (const [x, z] of n.mesas) {
        const g = new THREE.Group(); g.position.copy(L(n, x, 1.55, z));
        poner(g, k.caja(0.7, 1.4, 1.2, C.pc, 0.05), 0.95, 0.7, -0.1);          // torre
        const mon = poner(g, k.caja(1.7, 1.05, 0.14, C.monitor, 0.05), -0.2, 1.05, -0.35);
        const pant = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.85), R.pantallas[id]);
        poner(mon, pant, 0, 0, 0.075);
        poner(g, k.caja(0.18, 0.5, 0.18, C.monitor, 0.03), -0.2, 0.3, -0.35);
        poner(g, k.caja(1.2, 0.08, 0.45, 0xdfe5ee, 0.03), -0.2, 0.05, 0.35);  // teclado
        g.visible = false;
        p.fijo.add(g);
        p.equipos.push(g);
      }
    }
    PORTATILES.forEach(([x, z], i) => {
      const g = new THREE.Group(); g.position.copy(L(NAVES.O, x, 1.55, z)); g.rotation.y = (i * Math.PI) / 2;
      poner(g, k.caja(1.2, 0.08, 0.85, 0x9aa3b2, 0.04), 0, 0.05, 0);
      const tapa = poner(g, k.caja(1.2, 0.8, 0.06, 0x9aa3b2, 0.04), 0, 0.45, -0.42);
      tapa.rotation.x = -0.25;
      const pant = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.65), R.pantallas.O);
      poner(tapa, pant, 0, 0, 0.035);
      g.visible = false; p.fijo.add(g); p.equipos.push(g);
    });
    p.montar = async ctx => {
      ctx.enfocar(V(-4, 0, -4), 900, V(0, 1, 0.7), 140);
      await vaciarCaja(p);
      await repartir(p.equipos, p.desde(), 1900, 9);
      ctx.burbuja('25 puestos + 4 portátiles', NAVES.O.c.clone().add(V(0, 6, 0)));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(-4, 0, -4), 900, V(0, 1, 0.7), 140);
      await vaciarCaja(p);
      const torres = p.equipos.slice(0, 25).map(g => g.children[0]);
      torres.forEach(t => { t.scale.set(1.5, 1.35, 1.3); });
      await repartir(p.equipos, p.desde(), 1500, 9);
      ctx.presupuesto(19000);
      const luz = new THREE.MeshBasicMaterial({ color: 0xff3df0 });
      torres.forEach(t => { t.material = luz; });
      await animar(1300, (_, t) => luz.color.setHSL((t * 3) % 1, 0.9, 0.6), ease.lineal);
      ctx.burbuja('¡Te pasas del presupuesto!', NAVES.O.c.clone().add(V(0, 7, 0)), 'peligro');
      await esperar(1000);
    };
  }

  /* ===== 4. Switches ===== */
  {
    const p = nuevaPieza('switches', {
      nombre: 'Switches', accion: 'Montar los switches', coste: 480, requiere: ['armarios', 'puestos'],
      compra: [['SW-24P', 'Switch de 24 puertos con PoE', 1, 290], ['SW-16', 'Switch de 16 puertos', 2, 190]],
      texto: 'Un switch por nave, con un puerto para cada aparato con cable. Oficinas: 20 aparatos → SW-24P, con PoE para los puntos de acceso. Taller: 6 PC + 4 hornos + la fibra = 11 → SW-16. Almacén: 4 PC + 2 lectores + la fibra = 7 → SW-16, con sitio para crecer.',
      tituloMal: 'Un switch de 8 puertos en el taller',
      textoMal: 'En el taller hay 11 aparatos con cable y el SW-08 solo tiene 8 puertos: 3 se quedan sin conectar. ¡Cuenta también los terminales de los hornos y la fibra!',
      foco: () => rackPos(NAVES.T).add(V(0, 3, 0)), focoDir: V(0.2, 0.8, 1), dist: 40,
    });
    cajaPedido(p, 3, ['SW-24P · 16', '1 + 2'], C.carton);
    const k = p.k;
    p.sw = {};
    const nuevoSwitch = (id, ancho, puertos, color) => {
      const g = new THREE.Group(); g.position.copy(rackPos(NAVES[id]).add(V(0, 3.45, 0.05)));
      poner(g, k.caja(ancho, 0.55, 1.1, color, 0.05), 0, 0, 0);
      for (let i = 0; i < puertos; i++) {
        const fila = i % 2, col = Math.floor(i / 2), cols = Math.ceil(puertos / 2);
        poner(g, k.caja(0.16, 0.13, 0.05, 0x1d1b24, 0), -ancho / 2 + 0.35 + (col * (ancho - 0.9)) / Math.max(1, cols - 1), 0.08 - fila * 0.18, 0.56);
      }
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), R.leds[id]);
      poner(g, led, ancho / 2 - 0.22, 0.05, 0.56);
      g.visible = false;
      p.fijo.add(g);
      return g;
    };
    p.sw.O = nuevoSwitch('O', 3.0, 24, C.sw);
    p.sw.T = nuevoSwitch('T', 2.8, 16, C.sw);
    p.sw.A = nuevoSwitch('A', 2.8, 16, C.sw);
    p.montar = async ctx => {
      ctx.enfocar(V(10, 0, -8), 900, V(0, 1, 0.75), 130);
      await vaciarCaja(p);
      await repartir(Object.values(p.sw), p.desde(), 1400, 14);
      ctx.burbuja('Oficinas: 20 aparatos → 24 puertos', rackPos(NAVES.O).add(V(0, 7, 0)));
      ctx.burbuja('Taller: 11 → 16 puertos', rackPos(NAVES.T).add(V(0, 7, 0)));
      ctx.burbuja('Almacén: 7 → 16 puertos', rackPos(NAVES.A).add(V(0, 7, 0)));
      await esperar(400);
    };
    p.mal = async ctx => {
      const base = rackPos(NAVES.T).add(V(0, 3.45, 0.05));
      ctx.enfocar(base.clone(), 900, V(0.15, 0.55, 1), 22);
      await vaciarCaja(p);
      const g = new THREE.Group(); g.position.copy(base); p.fijo.add(g);
      poner(g, p.k.caja(1.9, 0.5, 1.0, 0x9aa3b2, 0.05), 0, 0, 0);
      await aparecer(g, 400);
      // 11 latiguillos que intentan entrar: 8 entran y 3 cuelgan
      const cables = [];
      for (let i = 0; i < 11; i++) {
        const ok = i < 8;
        const xs = -0.75 + (i % 8) * 0.21;
        const fin = ok ? V(xs, 0, 0.55) : V(1.4 + (i - 8) * 0.45, -1.3 - (i - 8) * 0.3, 0.9);
        const ini = V(-2.5 + i * 0.5, -3.2, 2.2);
        const c = p.k.tubo(new THREE.CatmullRomCurve3([ini, V((ini.x + fin.x) / 2, -1.2, 1.6), fin]), 0.07, ok ? C.cobre : C.rojo, 0.03, 20);
        g.add(c); cables.push(c);
      }
      await Promise.all(cables.map((c, i) => esperar(i * 70).then(() => crecer(c, 450))));
      ctx.burbuja('11 aparatos y 8 puertos: ¡faltan 3!', base.clone().add(V(0, 2.5, 0)), 'peligro');
      await esperar(1300);
    };
  }

  /* ===== 5. Servidor ===== */
  {
    const p = nuevaPieza('servidor', {
      nombre: 'Servidor de archivos', accion: 'Instalar el servidor', coste: 1400, requiere: ['switches'],
      compra: [['SV-02', 'NAS de 4 bahías', 1, 620], ['SV-03', 'Disco duro para NAS de 4 TB', 4, 560], ['SV-05', 'SAI de 1000 VA', 1, 220]],
      texto: 'Un NAS de 4 bahías con 4 discos de 4 TB y un SAI, todo dentro del armario de las oficinas. Los datos de la empresa quedan en un sitio central y protegido (R3). Si se va la luz, el SAI da unos minutos para apagar sin perder datos.',
      tituloMal: 'NAS sin discos',
      textoMal: 'Los discos se compran aparte. Sin ellos, el NAS no tiene dónde guardar nada.',
      foco: () => rackPos(NAVES.O).add(V(0, 2.5, 0)), focoDir: V(0.1, 0.6, 1), dist: 24,
    });
    cajaPedido(p, 4, ['SV-02 · 03 · 05', 'NAS + discos'], C.carton);
    const k = p.k, base = rackPos(NAVES.O);
    const nas = new THREE.Group(); nas.position.copy(base.clone().add(V(-0.35, 2.2, 0.05)));
    poner(nas, k.caja(2.0, 1.45, 1.1, C.nas, 0.05), 0, 0, 0);
    p.discos = [];
    for (let i = 0; i < 4; i++) {
      const d = poner(nas, k.caja(0.36, 1.05, 0.12, 0x2e3340, 0.03), -0.66 + i * 0.44, 0, 0.58);
      d.visible = false; p.discos.push(d);
    }
    const ledNas = poner(nas, new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), R.leds.O), 0.88, 0.58, 0.56);
    p.ledNas = ledNas;
    nas.visible = false; p.fijo.add(nas); p.nas = nas;
    const sai = new THREE.Group(); sai.position.copy(base.clone().add(V(1.05, 1.75, 0.05)));
    poner(sai, k.caja(0.9, 1.25, 1.1, C.sai, 0.05), 0, 0, 0);
    poner(sai, k.caja(0.5, 0.18, 0.04, C.verde, 0), 0, 0.3, 0.57);
    sai.visible = false; p.fijo.add(sai); p.sai = sai;
    p.montar = async ctx => {
      ctx.enfocar(base.clone().add(V(0, 2.5, 0)), 900, V(0.1, 0.6, 1), 24);
      await vaciarCaja(p);
      await repartir([nas, sai], p.desde(), 1200, 12);
      p.discos.forEach(d => { d.position.z = 1.8; });
      await animar(900, t => p.discos.forEach((d, i) => {
        const u = ease.salida(tramoA(t, i, 4)); d.visible = u > 0; d.position.z = 1.8 - 1.22 * u;
      }), ease.lineal);
      ctx.burbuja('4 discos de 4 TB', nas.position.clone().add(V(0, 2, 0)));
      ctx.burbuja('SAI', sai.position.clone().add(V(0.5, 1.5, 0)));
    };
    p.mal = async ctx => {
      ctx.enfocar(base.clone().add(V(0, 2.5, 0)), 900, V(0.1, 0.6, 1), 22);
      await vaciarCaja(p);
      await repartir([nas], p.desde(), 1000, 12);
      ctx.burbuja('Bahías vacías', nas.position.clone().add(V(0, 1.6, 0)), 'peligro');
      await esperar(700);
      ctx.burbuja('¡No puede guardar nada!', nas.position.clone().add(V(0, 3, 0)), 'peligro');
      await esperar(1100);
    };
  }

  /* ===== 6. Impresora ===== */
  {
    const p = nuevaPieza('impresora', {
      nombre: 'Impresora en red', accion: 'Conectar la impresora', coste: 480, requiere: ['switches'],
      compra: [['IM-01', 'Multifunción láser color en red', 1, 480]],
      texto: 'La multifunción IM-01 va conectada a su toma de red, y de ahí al switch. Así todos los puestos pueden imprimir y escanear con ella.',
      tituloMal: 'Impresora USB',
      textoMal: 'La IM-02 solo tiene USB: se conecta a un ordenador y los demás no la encuentran en la red.',
      foco: () => L(NAVES.O, IMPRESORA[0], 1, IMPRESORA[1]), focoDir: V(-0.3, 0.8, 1), dist: 34,
    });
    cajaPedido(p, 5, ['IM-01', 'multifunción'], C.carton);
    const k = p.k, n = NAVES.O;
    const imp = new THREE.Group(); imp.position.copy(L(n, IMPRESORA[0], 0, IMPRESORA[1]));
    poner(imp, k.caja(2.2, 1.6, 1.7, C.crema, 0.06), 0, 0.8, 0);
    poner(imp, k.caja(2.0, 0.3, 1.5, 0x9aa3b2, 0.04), 0, 1.75, 0);
    poner(imp, k.caja(1.3, 0.08, 0.9, C.blanco, 0.03), 0, 0.95, 0.75);
    poner(imp, k.caja(0.5, 0.25, 0.08, 0x4a86e8, 0), 0.6, 1.4, 0.86);
    imp.visible = false; p.fijo.add(imp); p.imp = imp;
    p.montar = async ctx => {
      ctx.enfocar(L(n, IMPRESORA[0], 1, IMPRESORA[1]), 900, V(-0.3, 0.8, 1), 34);
      await vaciarCaja(p);
      await repartir([imp], p.desde(), 1100, 12);
      ctx.burbuja('Todos pueden imprimir', imp.position.clone().add(V(0, 3.5, 0)));
    };
    p.mal = async ctx => {
      ctx.enfocar(L(n, 6, 1, 0), 900, V(-0.2, 0.9, 1), 46);
      await vaciarCaja(p);
      const imp2 = new THREE.Group(); imp2.position.copy(L(n, 10.8, 1.55, 8.9));
      poner(imp2, k.caja(1.4, 0.9, 1.0, 0x9aa3b2, 0.05), 0, 0.45, 0);
      p.fijo.add(imp2);
      await aparecer(imp2, 400);
      const usb = p.k.tubo(new THREE.CatmullRomCurve3([L(n, 10.4, 1.6, 8.5), L(n, 10.2, 1.0, 8.2), L(n, 10.1, 1.6, 8)]), 0.06, 0x1d1b24, 0.03, 16);
      p.fijo.add(usb); await crecer(usb, 300);
      for (const [x, z] of [[-7, -3], [-1.5, 2.5], [4, -3]]) {
        ctx.burbuja('Impresora no encontrada', L(n, x, 4.5, z), 'peligro');
        await esperar(450);
      }
      await esperar(900);
    };
  }

  /* ===== 7. Wi-Fi ===== */
  {
    const p = nuevaPieza('wifi', {
      nombre: 'Puntos de acceso Wi‑Fi', accion: 'Instalar el Wi‑Fi', coste: 320, requiere: ['switches'],
      compra: [['WF-01', 'Punto de acceso Wi-Fi 6 de techo', 2, 320]],
      texto: 'Dos puntos de acceso de techo cubren toda la nave de oficinas para los portátiles y las visitas (R2). Reciben la corriente por el propio cable de red, desde los puertos PoE del SW-24P.',
      tituloMal: 'Punto de acceso sin PoE',
      textoMal: 'Si el punto de acceso va a un puerto sin PoE (o a un switch sin PoE y sin inyector WF-02), no le llega corriente y no se enciende.',
      foco: () => NAVES.O.c.clone(), focoDir: V(0, 1, 0.8), dist: 56,
    });
    cajaPedido(p, 6, ['WF-01', '× 2'], C.carton);
    const k = p.k, n = NAVES.O;
    p.aps = AP_O.map(([x, z]) => {
      const g = new THREE.Group(); g.position.copy(L(n, x, 0, z));
      poner(g, k.cil(0.18, 5.2, 0xb9b2a3, 0.03, 10), 0, 2.6, 0);         // poste de techo
      const disco = poner(g, k.cil(0.85, 0.28, C.blanco, 0.05, 28), 0, 5.35, 0);
      const luz = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: LED.apagado }));
      poner(disco, luz, 0, -0.16, 0.5);
      g.userData.luz = luz;
      g.visible = false; p.fijo.add(g);
      return g;
    });
    p.montar = async ctx => {
      ctx.enfocar(NAVES.O.c.clone(), 900, V(0, 1, 0.8), 56);
      await vaciarCaja(p);
      await repartir(p.aps, p.desde(), 1200, 12);
      p.aps.forEach(ap => ap.userData.luz.material.color.set(LED.ok));
      R.aps = p.aps.map(ap => ({ pos: ap.position.clone().add(V(0, 5.2, 0)), on: true }));
      if (!velocidad.instantaneo) { R.demoWifi = true; ctx.burbuja('PoE: corriente por el cable', p.aps[0].position.clone().add(V(0, 7.2, 0))); await esperar(900); }
    };
    p.mal = async ctx => {
      ctx.enfocar(NAVES.O.c.clone(), 900, V(0, 1, 0.8), 50);
      await vaciarCaja(p);
      await repartir(p.aps, p.desde(), 1100, 12);
      for (const ap of p.aps) { ctx.burbuja('Sin corriente', ap.position.clone().add(V(0, 7, 0)), 'peligro'); await esperar(350); }
      await esperar(500);
      ctx.burbuja('Necesita PoE o un inyector', NAVES.O.c.clone().add(V(0, 9, 0)), 'peligro');
      await esperar(1200);
    };
  }

  /* ===== 8. Fibra ===== */
  {
    const p = nuevaPieza('fibra', {
      nombre: 'Fibra entre naves', accion: 'Tender la fibra', coste: 1065, requiere: ['switches'],
      compra: [['FO-01', 'Pareja de conversores de fibra a RJ-45', 2, 240], ['FO-02', 'Cable de fibra óptica exterior (m)', 330, 825]],
      texto: 'Las naves están a 180 m y a 120 m de las oficinas, y el par trenzado no pasa de 100 m. Cada nave se une con las oficinas por fibra óptica: una pareja de conversores por enlace y 330 m de fibra (300 m y algo de margen). Así se cumple R4.',
      tituloMal: 'Cable de red de 180 m',
      textoMal: 'El par trenzado no debe pasar de 100 m en un tramo: la señal se debilita y no llega al taller.',
      foco: () => V(8, 0, 2), focoDir: V(0, 1, 0.7), dist: 130,
    });
    cajaPedido(p, 7, ['FO-01 · 02', '2 + 330 m'], C.carton);
    const k = p.k;
    const salida = id => { const n = NAVES[id]; return L(n, n.rackX, 0.3, -n.D / 2 - 1.2); };
    p.trazado = {
      T: [rackPos(NAVES.O).setY(3.2), salida('O'), V(-14, 0.3, -12), V(10, 0.3, -36), V(26, 0.3, -36), salida('T'), rackPos(NAVES.T).setY(3.2)],
      A: [rackPos(NAVES.O).setY(3.2), salida('O').add(V(0.8, 0, 0)), V(-12, 0.3, -10), V(8, 0.3, 14), salida('A'), rackPos(NAVES.A).setY(3.2)],
    };
    p.fibras = {}; p.zanjas = [];
    for (const id of ['T', 'A']) {
      const pts = p.trazado[id];
      const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.2);
      const zanja = k.tubo(new THREE.CatmullRomCurve3(pts.slice(1, -1).map(v => v.clone().setY(0.02)), false, 'centripetal', 0.2), 0.55, C.zanja, 0, 80);
      zanja.scale.y = 0.25; zanja.position.y = 0.05; zanja.geometry.setDrawRange(0, 0);
      p.fijo.add(zanja); p.zanjas.push(zanja);
      const f = k.tubo(curva, 0.2, C.fibra, 0.05, 160); f.geometry.setDrawRange(0, 0);
      p.fijo.add(f); p.fibras[id] = f;
    }
    p.conversores = [];
    const conv = (pos) => {
      const g = new THREE.Group(); g.position.copy(pos);
      poner(g, k.caja(0.75, 0.42, 0.8, C.fibra, 0.04), 0, 0, 0);
      g.visible = false; p.fijo.add(g); p.conversores.push(g); return g;
    };
    conv(rackPos(NAVES.O).add(V(-0.9, 4.5, 0.1))); conv(rackPos(NAVES.O).add(V(0.1, 4.5, 0.1)));
    conv(rackPos(NAVES.T).add(V(-0.6, 4.5, 0.1))); conv(rackPos(NAVES.A).add(V(-0.6, 4.5, 0.1)));
    p.montar = async ctx => {
      ctx.enfocar(V(8, 0, 2), 900, V(0, 1, 0.7), 130);
      await vaciarCaja(p);
      await aparecer(p.conversores, 500);
      await Promise.all([...p.zanjas.map(z => crecer(z, 1300)), crecer(p.fibras.T, 1500), crecer(p.fibras.A, 1300)]);
      ctx.burbuja('180 m de fibra', V(8, 4, -30));
      ctx.burbuja('120 m de fibra', V(-2, 4, 4));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(8, 0, -14), 900, V(0, 1, 0.7), 110);
      await vaciarCaja(p);
      const pts = p.trazado.T;
      const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.2);
      const cu = p.k.tubo(curva, 0.2, C.cobre, 0.05, 160);
      p.fijo.add(cu);
      await crecer(cu, 1300);
      // la señal sale fuerte y se apaga antes de llegar (más de 100 m)
      const bola = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), new THREE.MeshBasicMaterial({ color: C.amarillo, transparent: true }));
      p.fijo.add(bola);
      await animar(1800, t => {
        bola.position.copy(curva.getPointAt(Math.min(t, 0.999) * 0.72));
        bola.material.opacity = 1 - Math.max(0, (t - 0.45) / 0.55);
        bola.scale.setScalar(1 - 0.75 * t);
      }, ease.lineal);
      ctx.burbuja('100 m: la señal ya no llega', curva.getPointAt(0.6).add(V(0, 4, 0)), 'peligro');
      await esperar(1300);
    };
  }

  /* ===== 9. Internet y la tienda ===== */
  {
    const p = nuevaPieza('internet', {
      nombre: 'Internet y la tienda', accion: 'Conectar a Internet', coste: 0, requiere: ['switches'],
      compra: [['—', 'Router del operador (incluido en la cuota)', 2, 0]],
      texto: 'El operador instala la fibra y su router en las oficinas y en la tienda de Toledo: va en la cuota, no se compra. Los 3 puestos de la tienda van a su router y abren los archivos del servidor a través de Internet (una WAN).',
      tituloMal: 'Comprar un router doméstico',
      textoMal: 'El WF-03 sobra: el router ya lo pone el operador y el Wi-Fi de la nave lo dan los puntos de acceso. Son 90 € tirados.',
      foco: () => V(-26, 0, -30), focoDir: V(0.3, 0.9, 0.9), dist: 110,
    });
    cajaPedido(p, 8, ['Operador', 'router incluido'], 0x9cc3e6);
    const k = p.k;
    const router = pos => {
      const g = new THREE.Group(); g.position.copy(pos);
      poner(g, k.caja(1.5, 0.45, 1.0, C.crema, 0.05), 0, 0, 0);
      [-0.5, 0.5].forEach(x => poner(g, k.cil(0.06, 0.9, C.crema, 0.03, 8), x, 0.6, -0.35));
      g.visible = false; p.fijo.add(g); return g;
    };
    p.routers = [router(OP()), router(OPK())];
    const nube = new THREE.Group(); nube.position.copy(NUBE);
    [[0, 0, 0, 3.4], [3.2, -0.6, 0.4, 2.6], [-3.2, -0.7, 0.2, 2.5], [1.4, 1.6, -0.2, 2.4], [-1.6, 1.3, 0.3, 2.2]]
      .forEach(([x, y, z, r]) => poner(nube, k.esfera(r, C.blanco, 0.08), x, y, z));
    nube.visible = false; p.fijo.add(nube); p.nube = nube;
    const enlace = (a, b) => {
      const mid = a.clone().lerp(b, 0.5).add(V(0, 6, 0));
      const t = k.tubo(new THREE.CatmullRomCurve3([a, mid, b]), 0.16, C.lila, 0.04, 60);
      p.fijo.add(t); t.geometry.setDrawRange(0, 0); return t;
    };
    p.enlaces = [enlace(OP().add(V(0, 0.3, 0)), NUBE.clone().add(V(2, -1.5, 2))), enlace(OPK().add(V(0, 0.3, 0)), NUBE.clone().add(V(-2.5, -1.5, -1)))];
    // cables de los puestos de la tienda al router
    p.montar = async ctx => {
      ctx.enfocar(V(-26, 0, -30), 900, V(0.3, 0.9, 0.9), 110);
      await vaciarCaja(p);
      await repartir(p.routers, p.desde(), 1100, 14);
      await aparecer(nube, 600);
      await Promise.all(p.enlaces.map(e => crecer(e, 900)));
      ctx.burbuja('Internet (WAN)', NUBE.clone().add(V(0, 4.5, 0)));
      ctx.burbuja('Router del operador', OPK().add(V(0, 3, 0)));
    };
    p.mal = async ctx => {
      ctx.enfocar(NAVES.O.c.clone(), 900, V(0, 1, 0.8), 60);
      await vaciarCaja(p);
      const r = router(L(NAVES.O, 2, 1.8, -4)); p.fijo.add(r);
      await repartir([r], p.desde(), 900, 12);
      ctx.presupuesto(90);
      ctx.burbuja('¡Ya lo pone el operador!', r.position.clone().add(V(0, 3, 0)), 'peligro');
      await esperar(1400);
    };
  }

  /* ===== 10. Encender ===== */
  {
    const p = nuevaPieza('encender', {
      nombre: 'Encender la red', accion: 'Encender', coste: 0,
      requiere: ['armarios', 'cableado', 'puestos', 'switches', 'servidor', 'impresora', 'wifi', 'fibra', 'internet'],
      texto: 'Se enciende todo. Cada ordenador habla con el switch de su nave; el taller y el almacén llegan a las oficinas por la fibra; la tienda llega al servidor por Internet, y los puntos de acceso dan Wi‑Fi.',
      foco: () => V(0, 0, -4), focoDir: V(0, 1, 0.75), dist: 150,
    });
    cajaPedido(p, 9, ['⚡', 'Encender'], C.amarillo);
    p.montar = async ctx => {
      ctx.enfocar(V(0, 0, -4), 900, V(0, 1, 0.75), 150);
      await vaciarCaja(p);
      encenderRed(R, P);
      if (!velocidad.instantaneo) {
        ctx.burbuja('¡Red funcionando!', NAVES.O.c.clone().add(V(0, 8, 0)));
        ctx.confeti();
        await esperar(1200);
      }
    };
  }

  /* ===== 11. Topología ===== */
  {
    const p = nuevaPieza('topologia', {
      nombre: 'La topología', accion: 'Ver la topología', coste: 0, requiere: ['encender'],
      texto: 'Cada nave es una estrella: cada equipo tiene su propio cable hasta el switch. La red completa es un árbol (estrella extendida): del switch de las oficinas salen las fibras al taller y al almacén.',
      foco: () => V(4, 0, -2), focoDir: V(0, 1, 0.55), dist: 150,
    });
    cajaPedido(p, 10, ['Topología', 'estrella · árbol'], 0x9cc3e6);
    const k = p.k;
    p.lineas = [];
    const linea = (a, b, color, r = 0.22) => {
      const t = k.tubo(new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(V(0, 1.2, 0)), b]), r, color, 0.05, 24);
      t.geometry.setDrawRange(0, 0); p.fijo.add(t); p.lineas.push(t); return t;
    };
    for (const id of ['O', 'T', 'A']) {
      const n = NAVES[id], centro = rackPos(n).setY(5);
      n.mesas.forEach(([x, z]) => linea(centro, L(n, x, 3.4, z), C.amarillo, 0.14));
    }
    p.troncales = [linea(rackPos(NAVES.O).setY(7), rackPos(NAVES.T).setY(7), C.fibra, 0.45), linea(rackPos(NAVES.O).setY(7), rackPos(NAVES.A).setY(7), C.fibra, 0.45)];
    p.montar = async ctx => {
      ctx.enfocar(V(4, 0, -2), 900, V(0, 1, 0.55), 150);
      await vaciarCaja(p);
      await animar(1500, t => p.lineas.forEach((l, i) => {
        const u = tramoA(t, i, p.lineas.length, 0.9);
        l.geometry.setDrawRange(0, Math.floor((u * l.geometry.index.count) / 6) * 6);
      }), ease.lineal);
      ['O', 'T', 'A'].forEach(id => ctx.rotulo('Estrella', rackPos(NAVES[id]).add(V(2, 9, 0)), p.id, 'estrella'));
      ctx.rotulo('Árbol (estrella extendida)', V(4, 15, -22), p.id, 'grande');
    };
  }

  /* ===== 12. Tipos de red ===== */
  {
    const p = nuevaPieza('tipos', {
      nombre: 'Tipos de red', accion: 'Ver los tipos de red', coste: 0, requiere: ['encender'],
      texto: 'Los puestos con cable de cada nave forman una LAN; el Wi‑Fi, una WLAN; las tres naves unidas, una LAN de campus; la tienda llega por Internet: una WAN. Y los auriculares Bluetooth del comercial con su móvil, una PAN.',
      tituloMal: 'Llamar MAN a la unión de las naves',
      textoMal: 'Las naves están en el mismo polígono, a menos de 200 m, y la red es de la empresa: es una LAN que cubre varios edificios (de campus), no una MAN.',
      foco: () => V(-8, 0, -14), focoDir: V(0, 1, 0.7), dist: 150,
    });
    cajaPedido(p, 11, ['LAN · WAN', 'tipos de red'], 0x9cc3e6);
    const k = p.k;
    // comercial con auriculares Bluetooth
    const persona = new THREE.Group(); persona.position.copy(L(NAVES.O, -15.5, 0, 9.5));
    poner(persona, k.cil(0.55, 2.2, C.lila, 0.05, 16), 0, 1.1, 0);
    poner(persona, k.esfera(0.55, 0xf2c9a0, 0.05), 0, 2.75, 0);
    const casco = k.toro(0.55, 0.08, 0x1d1b24, 0.03); casco.rotation.y = Math.PI / 2; poner(persona, casco, 0, 2.85, 0);
    poner(persona, k.caja(0.3, 0.55, 0.1, 0x1d1b24, 0.03), 0.65, 1.7, 0.3);
    persona.visible = false; p.fijo.add(persona); p.persona = persona;
    p.montar = async ctx => {
      ctx.enfocar(V(-8, 0, -14), 900, V(0, 1, 0.7), 150);
      await vaciarCaja(p);
      await aparecer(persona, 500);
      const r = (t, pos, c) => { ctx.rotulo(t, pos, p.id, c); return esperar(380); };
      await r('LAN', NAVES.O.c.clone().add(V(-3, 6, 9)));
      await r('WLAN', NAVES.O.c.clone().add(V(9, 9, 4)), 'wifi');
      await r('LAN', NAVES.T.c.clone().add(V(2, 6, 6)));
      await r('LAN', NAVES.A.c.clone().add(V(2, 6, 6)));
      await r('LAN de campus', V(-4, 11, 14), 'grande');
      await r('WAN', NUBE.clone().add(V(0, 5, 0)), 'wan');
      await r('PAN', persona.position.clone().add(V(0, 4.5, 0)), 'pan');
    };
    p.mal = async ctx => {
      ctx.enfocar(V(8, 0, -4), 900, V(0, 1, 0.7), 120);
      await vaciarCaja(p);
      const e = ctx.rotulo('MAN', V(-4, 11, 14), p.id, 'grande');
      await esperar(900);
      if (e) e.classList.add('tachado');
      ctx.burbuja('Mismo polígono y de la empresa: LAN', V(-4, 7, 14), 'peligro');
      await esperar(1600);
    };
  }

  /* ===== 13. Avería ===== */
  {
    const p = nuevaPieza('averia', {
      nombre: 'Prueba de avería (R1)', accion: 'Averiar el switch del taller', coste: 0, requiere: ['encender'],
      botonMal: '¿Y si se rompe el principal?',
      texto: 'Se estropea el switch del taller: solo el taller se queda sin red. Las oficinas, el almacén y la tienda siguen funcionando. Así se cumple R1.',
      tituloMal: 'Avería en el switch de las oficinas',
      textoMal: 'Es el punto débil: de él dependen todas las naves y el servidor. Para protegerse: un switch de repuesto, un SAI, o un enlace de reserva entre taller y almacén (90 m) que convierte el árbol en una malla parcial.',
      foco: () => V(14, 0, -10), focoDir: V(0, 1, 0.7), dist: 130,
    });
    cajaPedido(p, 12, ['Avería', 'prueba R1'], C.rojo);
    const k = p.k;
    p.montar = async ctx => {
      ctx.enfocar(V(14, 0, -10), 900, V(0, 1, 0.7), 130);
      await vaciarCaja(p);
      if (!velocidad.instantaneo) ctx.chispas(rackPos(NAVES.T).add(V(0, 3.6, 0.6)), false);
      caer(R, 'T');
      if (!velocidad.instantaneo) {
        ctx.burbuja('Taller sin red', NAVES.T.c.clone().add(V(0, 6, 0)), 'peligro');
        await esperar(500);
        ctx.burbuja('Las oficinas siguen funcionando (R1)', NAVES.O.c.clone().add(V(0, 7, 0)));
        await esperar(900);
      }
    };
    p.mal = async ctx => {
      ctx.enfocar(V(4, 0, -12), 900, V(0, 1, 0.7), 150);
      await vaciarCaja(p);
      ctx.chispas(rackPos(NAVES.O).add(V(0, 3.6, 0.6)), true);
      caer(R, 'O');
      ctx.burbuja('Punto débil: el switch principal', NAVES.O.c.clone().add(V(0, 8, 0)), 'peligro');
      await esperar(1300);
      const a = rackPos(NAVES.T).setY(0.4), b = rackPos(NAVES.A).setY(0.4);
      const reserva = k.tubo(new THREE.CatmullRomCurve3([a.setY(4.5), V(25.5, 13, -7), b.setY(4.5)]), 0.22, C.fibra, 0.05, 50);
      p.fijo.add(reserva);
      await crecer(reserva, 900);
      ctx.burbuja('Protección: repuesto, SAI o enlace de reserva', V(25.5, 16, -7));
      await esperar(1500);
    };
  }

  return { P, escenario, R };
}

// ---------- Estado de la red ----------
function encenderRed(R, P) {
  R.encendida = true;
  for (const id of Object.keys(R.pantallas)) R.pantallas[id].color.set(PANTALLA.ok);
  for (const id of Object.keys(R.leds)) R.leds[id].color.set(LED.ok);
  if (P.wifi.montado || P.wifi.aps) R.aps = P.wifi.aps.map(ap => ({ pos: ap.position.clone().add(V(0, 5.2, 0)), on: true }));
  // rutas de los paquetes: de cada toma al armario de su nave, y entre naves por la fibra
  R.rutas = [];
  for (const [id, lista] of Object.entries(P.cableado.rutasNave)) {
    lista.forEach(({ pts }) => R.rutas.push(nuevaRuta(pts.map(v => v.clone().setY(0.9)), { nave: id, color: 0x3fbf6a, vel: 9 })));
  }
  for (const id of ['T', 'A']) {
    const pts = P.fibra.trazado[id].map(v => v.clone().setY(Math.max(1.2, v.y)));
    R.rutas.push(nuevaRuta(pts, { nave: id, tronco: true, color: 0xff8a3d, vel: 26 }));
    R.rutas.push(nuevaRuta(pts.slice().reverse(), { nave: id, tronco: true, color: 0xff8a3d, vel: 26 }));
  }
  const a = OP().add(V(0, 0.6, 0)), b = OPK().add(V(0, 0.6, 0));
  R.rutas.push(nuevaRuta([b, b.clone().lerp(NUBE, 0.5).add(V(0, 4, 0)), NUBE.clone(), a.clone().lerp(NUBE, 0.5).add(V(0, 4, 0)), a], { nave: 'K', wan: true, color: 0x8b6fe0, vel: 30 }));
}

function caer(R, id) {
  R.caidas.add(id);
  R.leds[id].color.set(LED.mal);
  if (id === 'O') { for (const k of Object.keys(R.pantallas)) R.pantallas[k].color.set(PANTALLA.mal); }
  else R.pantallas[id].color.set(PANTALLA.mal);
}

// ¿Funciona esta ruta con las averías actuales?
function rutaViva(R, r) {
  if (R.caidas.has('O') && (r.tronco || r.wan || r.nave === 'O' || r.nave === 'T' || r.nave === 'A')) return false;
  return !R.caidas.has(r.nave);
}

// Paquetes, anillos Wi-Fi: se llama en cada fotograma
export function animarRed(R, raiz, dt) {
  R.reloj += dt;
  if (!R.paquetes) {
    R.paquetes = new THREE.Group(); raiz.add(R.paquetes);
    R.geoPaq = new THREE.SphereGeometry(0.32, 10, 8);
    R.matPaq = new Map();
    R.anillos = [];
  }
  const g = R.paquetes;
  if (!R.encendida) { g.visible = false; return; }
  g.visible = true;
  while (g.children.length < R.rutas.length) g.add(new THREE.Mesh(R.geoPaq));
  R.rutas.forEach((r, i) => {
    const m = g.children[i];
    if (!rutaViva(R, r)) { m.visible = false; return; }
    m.visible = true;
    if (!R.matPaq.has(r.color)) R.matPaq.set(r.color, new THREE.MeshBasicMaterial({ color: r.color }));
    m.material = R.matPaq.get(r.color);
    const t = (r.fase + (R.reloj * r.vel) / r.largo) % 1;
    puntoEn(r, t, m.position);
    m.scale.setScalar(r.tronco || r.wan ? 1.6 : 1);
  });
  // anillos de cobertura Wi-Fi
  const vivosAp = R.aps.filter(a => a.on && !R.caidas.has('O'));
  const necesarios = vivosAp.length * 3;
  while (R.anillos.length < necesarios) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 40), new THREE.MeshBasicMaterial({ color: 0x4ac7e8, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; raiz.add(m); R.anillos.push(m);
  }
  R.anillos.forEach((m, i) => {
    const ap = vivosAp[Math.floor(i / 3)];
    if (!ap) { m.visible = false; return; }
    const t = ((R.reloj * 0.45) + (i % 3) / 3) % 1;
    m.visible = true;
    m.position.copy(ap.pos);
    m.scale.setScalar(1 + t * 9);
    m.material.opacity = 0.55 * (1 - t);
  });
}

// ---------- Escenario fijo: terreno, naves, muebles, hornos, lectores ----------
function construirEscenario(R) {
  const g = new THREE.Group();
  const tinta = nuevaTinta(), k = kit(tinta, [tinta]);
  // parcela del polígono
  const parcela = poner(g, k.caja(124, 1, 90, C.cesped, 0.12), 2, -0.5, 1);
  parcela.castShadow = false;
  poner(g, k.caja(124, 0.1, 7, C.asfalto, 0), 2, 0.02, 41);                 // calle del polígono
  for (let x = -54; x <= 58; x += 8) poner(g, k.caja(4, 0.02, 0.4, C.linea, 0), x, 0.09, 41);
  poner(g, k.caja(124, 0.6, 12, 0xcfc4ae, 0.08), 2, 0.3, MUELLE_Z);         // muelle de carga
  // isla de Toledo
  poner(g, k.caja(26, 1, 20, C.cesped, 0.12), NAVES.K.c.x + 1, -0.5, NAVES.K.c.z);
  // naves
  for (const [id, n] of Object.entries(NAVES)) {
    const ng = new THREE.Group(); ng.position.copy(n.c); g.add(ng);
    poner(ng, k.caja(n.W, 0.25, n.D, n.suelo, 0.06), 0, 0.12, 0);
    const alto = 2.6, gr = 0.5;
    poner(ng, k.caja(n.W, alto, gr, C.muro, 0.06), 0, alto / 2, -n.D / 2);                 // fondo
    poner(ng, k.caja(gr, alto, n.D, C.muro, 0.06), -n.W / 2, alto / 2, 0);                 // izquierda
    poner(ng, k.caja(gr, alto, n.D, C.muro, 0.06), n.W / 2, alto / 2, 0);                  // derecha
    const frente = (n.W - 4) / 2;                                                          // frente bajo con puerta
    poner(ng, k.caja(frente, 0.9, gr, C.muro, 0.06), -n.W / 2 + frente / 2, 0.45, n.D / 2);
    poner(ng, k.caja(frente, 0.9, gr, C.muro, 0.06), n.W / 2 - frente / 2, 0.45, n.D / 2);
    poner(ng, k.caja(n.W + 0.1, 0.25, gr + 0.1, C.muroBorde, 0.04), 0, alto + 0.1, -n.D / 2);
    // mesas y sillas
    for (const [x, z] of n.mesas) {
      poner(ng, k.caja(3.0, 0.25, 1.8, C.mesa, 0.05), x, 1.42, z);
      for (const dx of [-1.3, 1.3]) for (const dz of [-0.7, 0.7]) poner(ng, k.caja(0.18, 1.3, 0.18, C.mesa, 0), x + dx, 0.7, z + dz);
      poner(ng, k.caja(1.0, 0.25, 1.0, C.silla, 0.04), x, 0.9, z + 1.6);
      poner(ng, k.caja(1.0, 1.1, 0.22, C.silla, 0.04), x, 1.5, z + 2.05);
    }
  }
  // mesa de reuniones de los comerciales (oficinas)
  { const n = NAVES.O; const m = poner(g, k.cil(2.1, 0.25, C.mesa, 0.05, 28), 0, 0, 0); m.position.copy(L(n, -12.5, 1.42, 5.8));
    const pata = poner(g, k.cil(0.3, 1.3, C.mesa, 0, 10), 0, 0, 0); pata.position.copy(L(n, -12.5, 0.7, 5.8)); }
  // hornos con su terminal (taller): ya los tiene la empresa
  { const n = NAVES.T;
    HORNOS.forEach(z => {
      const h = new THREE.Group(); h.position.copy(L(n, 10.5, 0, z)); g.add(h);
      poner(h, k.caja(3.2, 3.0, 3.0, C.horno, 0.07), 0.6, 1.5, 0);
      poner(h, k.caja(2.0, 1.6, 0.1, C.hornoOsc, 0.04), 0.6, 1.5, 1.55);
      poner(h, k.cil(0.35, 1.4, 0x9aa3b2, 0.04, 12), 1.2, 3.7, -0.6);
      const term = poner(h, k.caja(0.9, 1.2, 0.5, C.pc, 0.05), -1.6, 1.9, 0.6);
      const pant = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.55), R.pantallas.T);
      poner(term, pant, 0, 0.15, 0.26);
      poner(h, k.caja(0.2, 1.3, 0.2, 0x9aa3b2, 0), -1.6, 0.65, 0.6);
    });
    const r = new THREE.Group(); r.position.copy(n.c); g.add(r);
  }
  // almacén: estanterías y lectores de códigos de barras (ya los tiene la empresa)
  { const n = NAVES.A;
    [-5.5, -2].forEach(z => {
      const e = new THREE.Group(); e.position.copy(L(n, 7, 0, z)); g.add(e);
      for (const y of [0.4, 1.6, 2.8]) poner(e, k.caja(7.5, 0.18, 1.6, C.estante, 0.04), 0, y, 0);
      for (const x of [-3.6, 3.6]) poner(e, k.caja(0.2, 3.2, 1.6, 0x8a5a3a, 0.03), x, 1.6, 0);
      for (let i = 0; i < 5; i++) poner(e, k.caja(1.0, 0.8, 1.0, C.carton, 0.04), -2.8 + i * 1.4, 2.1 - (i % 2) * 1.2, 0);
    });
    LECTORES.forEach(([x, z]) => {
      const l = new THREE.Group(); l.position.copy(L(n, x, 0, z)); g.add(l);
      poner(l, k.cil(0.12, 1.6, 0x9aa3b2, 0.03, 8), 0, 0.8, 0);
      poner(l, k.caja(0.5, 0.35, 0.8, C.amarillo, 0.05), 0, 1.75, 0.15);
      poner(l, k.caja(0.3, 0.6, 0.3, C.amarillo, 0.04), 0, 1.4, -0.15);
    });
  }
  return g;
}

// Posiciones útiles para la vista
export const VISTAS = {
  general: { pos: V(0, 108, 132), obj: V(0, 0, 4) },
  final: { pos: V(-4, 104, 112), obj: V(-4, 0, -12) },
};
export { NAVES as naves, rackPos };
