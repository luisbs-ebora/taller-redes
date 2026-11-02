// rack.js — El armario rack del aula de 20 puestos (Tema 2, Sección 1), paso a paso en estilo cartoon.
// Medidas en unidades rack: 1 unidad = 1 U = 44,45 mm. El armario mural es de 9 U y 19″ (unas 11 U de ancho).
// Cada paso tiene montar(ctx) y mal(ctx); el material espera en cajas en el suelo.
import * as THREE from 'three';
import { kit, nuevaTinta } from './toon.js';
import { animar, esperar, ease, velocidad } from './anim.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = {
  pared: 0xf7f1e3, suelo: 0xd8c8a8, rack: 0x3a4152, rackClaro: 0x8592a6, panel: 0x2e3340, puerto: 0x1d1b24,
  sw: 0x4a86e8, sai: 0x2e3340, regleta: 0x2e3340, enchufe: 0xff8a3d, carton: 0xd9a066, cartonOsc: 0xb87f45,
  blanco: 0xffffff, crema: 0xfffaf0, datos: 0x4a86e8, luz: 0x1d1b24, amarillo: 0xffd23f, verde: 0x3fbf6a,
  rojo: 0xe5484d, mesa: 0xc98f5a, pc: 0x37405a, monitor: 0x2e3340, lati: 0x4ac7e8, tierra: 0x3fbf6a,
};

export const ALTURA_U = 9;
const W = 11, D = 9, Y0 = 36;                // ancho útil (19″), fondo, base interior del armario
const FRENTE = D + 0.3;                       // z del frente (la pared está en z = 0)
const yU = u => Y0 + ALTURA_U - (u - 0.5);    // centro de la U número u (U1 arriba)
const CANALETA_Y = 52, TOMA = V(-36, 8, 0.4), ENCHUFE = V(10, 30, 0.4);
const xPuerto = i => -W / 2 + 0.6 + i * ((W - 1.2) / 23);   // 24 puertos en una fila

export const ORDEN = ['armario', 'canaleta', 'panel', 'ponchar', 'pasahilos', 'switch', 'bandeja', 'sai', 'regleta', 'latiguillos', 'encender'];
export const VISTAS = {
  general: { pos: V(30, 52, 78), obj: V(-8, 28, 6) },
  final: { pos: V(10, 52, 95), obj: V(-14, 30, 6) },
};
export const ROTULOS = [
  ['Toma 07 (puesto 7)', V(-36, 11.5, 1), 'nave'],
  ['Material', V(-12, 8, 24), 'nave'],
];

// ---------- utilidades ----------
function poner(padre, m, x, y, z) { m.position.set(x, y, z); padre.add(m); return m; }
const tramoA = (t, i, n, solape = 0.55) => {
  const ancho = 1 / (1 + (n - 1) * (1 - solape));
  return Math.min(1, Math.max(0, (t - i * ancho * (1 - solape)) / ancho));
};
async function repartir(items, desde, ms = 1100, altura = 8) {
  const datos = items.map(o => ({ o, dest: o.position.clone(), s: o.scale.clone() }));
  datos.forEach(d => { d.o.position.copy(desde); d.o.scale.setScalar(0.001); d.o.visible = true; });
  await animar(ms, t => datos.forEach((d, i) => {
    const u = ease.suave(tramoA(t, i, datos.length));
    d.o.position.lerpVectors(desde, d.dest, u);
    d.o.position.y += Math.sin(Math.PI * u) * altura;
    d.o.scale.copy(d.s).multiplyScalar(Math.max(0.001, Math.min(1, u * 3)));
  }), ease.lineal);
}
// Desliza un equipo hacia dentro del armario desde delante (como al meterlo en los raíles)
async function meter(obj, ms = 700) {
  const fin = obj.position.clone();
  obj.position.set(fin.x, fin.y, fin.z + 12);
  obj.visible = true;
  await animar(ms, t => obj.position.lerpVectors(V(fin.x, fin.y, fin.z + 12), fin, t), ease.salida);
}
const crecer = (malla, ms) => {
  const total = malla.geometry.index.count, paso = 60;
  malla.geometry.setDrawRange(0, 0);
  return animar(ms, t => malla.geometry.setDrawRange(0, Math.floor((t * total) / paso) * paso), ease.lineal);
};
function polilinea(pts) {
  const c = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) c.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return c;
}
function texturaTexto(lineas, { fondo = '#fffaf0', tinta = '#1d1b24', ancho = 256, alto = 160, tam = [50, 32] } = {}) {
  const cv = document.createElement('canvas'); cv.width = ancho; cv.height = alto;
  const g = cv.getContext('2d');
  g.fillStyle = fondo; g.fillRect(0, 0, ancho, alto);
  g.strokeStyle = tinta; g.lineWidth = 8; g.strokeRect(4, 4, ancho - 8, alto - 8);
  g.fillStyle = tinta; g.textAlign = 'center'; g.textBaseline = 'middle';
  lineas.forEach((l, i) => {
    g.font = `800 ${tam[Math.min(i, tam.length - 1)]}px "Bricolage Grotesque", "Segoe UI", sans-serif`;
    g.fillText(l, ancho / 2, (alto / (lineas.length + 1)) * (i + 1), ancho - 20);
  });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// ---------- construcción ----------
export function construirRack() {
  const R = { encendida: false, leds: new THREE.MeshBasicMaterial({ color: 0x5b6375 }), ruta: null, reloj: 0, puerta: null };
  const escenario = construirEscenario(R);
  const P = {};
  function nuevaPieza(id, datos) {
    const grupo = new THREE.Group(), cuerpo = new THREE.Group(), fijo = new THREE.Group();
    grupo.add(cuerpo); grupo.userData.id = id; fijo.userData.id = id;
    const tinta = nuevaTinta(), tintas = [tinta];
    const p = { id, grupo, cuerpo, fijo, tintas, k: kit(tinta, tintas), hover: 0, salto: 0, montado: false, requiere: [], coste: 0, compra: [], ...datos };
    P[id] = p;
    return p;
  }
  function caja(p, i, lineas, color = C.carton) {
    p.grupo.position.set(-40 + i * 6.2, 0, 24);
    const c = poner(p.cuerpo, p.k.caja(4.6, 3.4, 4, color, 0.08), 0, 1.7, 0);
    poner(c, p.k.caja(4.7, 0.4, 0.9, C.cartonOsc, 0), 0, 1.55, 0);
    const et = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.25), new THREE.MeshBasicMaterial({ map: texturaTexto(lineas) }));
    poner(c, et, 0, -0.15, 2.02);
    p.caja = c;
    p.desde = () => p.grupo.position.clone().add(V(0, 4, 0));
  }
  async function vaciar(p) {
    const c = p.caja;
    await animar(220, t => c.scale.set(1 + 0.12 * t, 1 - 0.15 * t, 1 + 0.12 * t), ease.salida);
    animar(320, t => { c.scale.setScalar(Math.max(0.001, 1 - t)); c.rotation.y = t * 1.5; }, ease.suave).then(() => { p.cuerpo.visible = false; });
  }
  const enfocarRack = (ctx, y = 40.5, dist = 34, dir = V(0.35, 0.35, 1)) => ctx.enfocar(V(0, y, 5), 800, dir, dist);

  /* ===== 1. Armario ===== */
  {
    const p = nuevaPieza('armario', {
      nombre: 'Armario mural de 9 U', accion: 'Colgar el armario', coste: 0,
      compra: [['Armario', 'Armario mural de 19″ y 9 U, con puerta de cristal y llave', 1, 0]],
      texto: 'El aula necesita 5 U (panel, pasahilos, switch, bandeja y regleta) y 2 más para un SAI: con reserva para ampliar, un armario mural de 9 U. Se cuelga anclado a la pared y se conecta a la toma de tierra.',
      tituloMal: 'Armario sin toma de tierra',
      textoMal: 'Si una regleta o un equipo tiene una derivación, la carcasa metálica queda con corriente y da calambre. Además, los cables apantallados solo protegen si la pantalla va a tierra en el armario.',
      foco: () => V(0, 40.5, 5), focoDir: V(0.35, 0.35, 1), dist: 40,
    });
    caja(p, 0, ['Armario', '9 U · 19″']);
    const k = p.k, g = new THREE.Group(); g.position.set(0, 0, 0);
    const ancho = W + 1.6, alto = ALTURA_U + 1.2, yc = Y0 + ALTURA_U / 2;
    poner(g, k.caja(ancho, 0.6, D, C.rack, 0.06), 0, Y0 - 0.3, D / 2 + 0.3);              // suelo del armario
    const techo = poner(g, k.caja(ancho, 0.6, D, C.rackClaro, 0.06, { transparent: true, opacity: 0.22 }), 0, Y0 + ALTURA_U + 0.3, D / 2 + 0.3);   // techo con rejilla (se ve dentro)
    techo.userData.atraviesa = true;
    poner(g, k.caja(0.8, alto, D, C.rack, 0.06), -ancho / 2 + 0.4, yc, D / 2 + 0.3);        // lateral izquierdo
    const der = poner(g, k.caja(0.8, alto, D, C.rackClaro, 0.06, { transparent: true, opacity: 0.25 }), ancho / 2 - 0.4, yc, D / 2 + 0.3); // lateral de cristal
    der.userData.atraviesa = true;
    poner(g, k.caja(ancho, alto, 0.4, 0x6b778c, 0.05), 0, yc, 0.4);                          // fondo
    for (const x of [-W / 2 - 0.15, W / 2 + 0.15]) {                                          // raíles de 19″ con agujeros
      const rail = poner(g, k.caja(0.5, ALTURA_U, 0.3, 0xc9d0da, 0.03), x, yc, FRENTE - 0.6);
      for (let u = 0; u < ALTURA_U * 3; u++) poner(rail, new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.05), new THREE.MeshBasicMaterial({ color: 0x5b6375 })), 0, -ALTURA_U / 2 + 0.17 + u / 3, 0.16);
    }
    // cable verde y amarillo de tierra
    const tierra = k.tubo(new THREE.CatmullRomCurve3([V(-6, Y0 - 0.2, 4), V(-7.5, Y0 - 2, 2), V(-8, Y0 - 6, 0.6), V(-8, 30, 0.6)]), 0.18, C.tierra, 0.04, 30);
    g.add(tierra);
    poner(g, k.caja(1.2, 1.2, 0.4, C.amarillo, 0.04), -8, 30, 0.5);
    // puerta de cristal con bisagra a la izquierda
    const bis = new THREE.Group(); bis.position.set(-ancho / 2, 0, FRENTE + 0.2); g.add(bis);
    const puerta = poner(bis, k.caja(ancho, alto, 0.25, 0x9cc3e6, 0.05, { transparent: true, opacity: 0.3 }), ancho / 2, yc, 0);
    puerta.userData.atraviesa = true;
    poner(bis, k.caja(0.35, 1.4, 0.4, 0xc9d0da, 0.03), ancho - 0.6, yc, 0.25);
    bis.rotation.y = -1.9;
    R.puerta = bis;
    g.visible = false;
    p.fijo.add(g); p.armario = g;
    p.montar = async ctx => {
      enfocarRack(ctx, 38, 46);
      await vaciar(p);
      await repartir([g], p.desde(), 1100, 14);
      for (let u = 1; u <= ALTURA_U; u++) ctx.rotulo('U' + u, V(-W / 2 - 2.2, yU(u), FRENTE), p.id, 'u');
      ctx.burbuja('Anclado a la pared y a tierra', V(-8, 31.5, 1));
    };
    p.mal = async ctx => {
      enfocarRack(ctx, 36, 40);
      await vaciar(p);
      tierra.visible = false;
      await repartir([g], p.desde(), 900, 14);
      await esperar(300);
      ctx.chispas(V(W / 2 + 0.8, Y0 + 1, FRENTE), true);
      ctx.burbuja('¡Calambre! Sin toma de tierra', V(W / 2, Y0 + 4, FRENTE), 'peligro');
      await esperar(900);
    };
  }

  /* ===== 2. Canaleta ===== */
  {
    const p = nuevaPieza('canaleta', {
      nombre: 'Canaleta y cables fijos', accion: 'Tender la canaleta', coste: 0, requiere: ['armario'],
      compra: [['Canaleta', 'Canaleta de PVC con separador', 1, 0], ['Cable', '20 cables fijos (rígidos), uno por toma', 20, 0]],
      texto: 'Desde cada toma de la pared sale un cable fijo que sube por la canaleta hasta el armario. La canaleta tiene separador: los datos por un compartimento y la electricidad por otro, para que no haya interferencias.',
      tituloMal: 'Red y electricidad por el mismo hueco',
      textoMal: 'La corriente eléctrica induce interferencias en los cables de datos: la red va lenta o se corta. Van en canalizaciones distintas, o con separador.',
      foco: () => V(-18, 40, 2), focoDir: V(0.2, 0.25, 1), dist: 62,
    });
    caja(p, 1, ['Canaleta', '+ 20 cables']);
    const k = p.k;
    // canaleta horizontal y bajada al armario y a la toma
    const tramos = [
      { pos: V(-18, CANALETA_Y, 1.2), tam: [38, 2.2, 1.6] },
      { pos: V(0.6, (CANALETA_Y + Y0 + ALTURA_U + 1) / 2, 1.2), tam: [2, CANALETA_Y - Y0 - ALTURA_U + 1, 1.6] },
      { pos: V(-36, (CANALETA_Y + TOMA.y) / 2, 1.2), tam: [2, CANALETA_Y - TOMA.y + 1, 1.6] },
    ];
    p.canaleta = tramos.map(t => {
      const m = poner(p.fijo, k.caja(...t.tam, C.blanco, 0.06), t.pos.x, t.pos.y, t.pos.z);
      m.visible = false; return m;
    });
    const sep = poner(p.fijo, k.caja(38, 0.12, 1.7, 0x9aa3b2, 0), -18, CANALETA_Y, 1.25); sep.visible = false; p.canaleta.push(sep);
    // mazo de cables de datos (arriba) y cable de la luz (abajo)
    p.datos = k.tubo(polilinea([V(-36, TOMA.y + 0.5, 1.2), V(-36, CANALETA_Y + 0.55, 1.2), V(0.6, CANALETA_Y + 0.55, 1.2), V(0.6, Y0 + ALTURA_U + 0.2, 1.2), V(0.3, Y0 + ALTURA_U - 0.6, 2.2)]), 0.42, C.datos, 0.05, 120);
    p.luz = k.tubo(polilinea([V(-37, CANALETA_Y - 0.55, 1.2), V(-2, CANALETA_Y - 0.55, 1.2)]), 0.22, C.luz, 0.04, 40);
    p.datos.geometry.setDrawRange(0, 0); p.luz.geometry.setDrawRange(0, 0);
    p.fijo.add(p.datos, p.luz);
    p.montar = async ctx => {
      ctx.enfocar(V(-18, 40, 2), 800, V(0.2, 0.25, 1), 62);
      await vaciar(p);
      for (const m of p.canaleta) { m.visible = true; }
      await animar(500, t => p.canaleta.forEach(m => m.scale.setScalar(Math.max(0.001, ease.muelle(t)))), ease.lineal);
      await Promise.all([crecer(p.datos, 1200), crecer(p.luz, 900)]);
      ctx.burbuja('Datos arriba · electricidad abajo', V(-18, CANALETA_Y + 3, 2));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(-18, 46, 2), 800, V(0.2, 0.25, 1), 50);
      await vaciar(p);
      p.canaleta.slice(0, 3).forEach(m => { m.visible = true; });
      p.luz.position.y = 1.1;
      await Promise.all([crecer(p.datos, 900), crecer(p.luz, 700)]);
      const rayo = new THREE.Group(); p.fijo.add(rayo);
      for (let i = 0; i < 6; i++) {
        const x0 = -32 + i * 6;
        const pts = [0, 1, 2, 3, 4].map(j => V(x0 + j * 0.9, CANALETA_Y + 1.6 + (j % 2 ? 1.2 : 0), 2.4));
        const r = p.k.tubo(polilinea(pts), 0.14, C.amarillo, 0.03, 20); rayo.add(r);
      }
      await animar(1400, (_, t) => { rayo.visible = Math.floor(t * 12) % 2 === 0; }, ease.lineal);
      ctx.burbuja('¡Interferencias!', V(-18, CANALETA_Y + 4, 2), 'peligro');
      await esperar(900);
    };
  }

  /* ===== 3. Panel de parcheo ===== */
  {
    const p = nuevaPieza('panel', {
      nombre: 'Panel de parcheo', accion: 'Atornillar el panel', coste: 1, requiere: ['armario'],
      compra: [['Panel', 'Panel de parcheo de 24 puertos RJ45 (1 U)', 1, 1]],
      texto: 'Arriba del todo, en la U1, el panel de parcheo de 24 puertos: 20 para las tomas del aula y 4 de reserva. Se atornilla a los raíles con tuercas enjauladas. Por detrás llegan los cables fijos; por delante se conectan los latiguillos.',
      tituloMal: 'Cables fijos directos al switch',
      textoMal: 'El cable fijo es rígido: si se dobla y se mueve cada vez que se cambia algo, se rompe. Y si se cambia el switch hay que rehacerlo todo. Por eso termina en el panel y no se toca nunca.',
      foco: () => V(0, yU(1), FRENTE), focoDir: V(0.15, 0.2, 1), dist: 26,
    });
    caja(p, 2, ['Panel', '24 puertos · 1 U']);
    const k = p.k, g = new THREE.Group(); g.position.set(0, yU(1), FRENTE - 0.9);
    poner(g, k.caja(W + 0.9, 0.9, 1.4, C.panel, 0.05), 0, 0, 0);
    p.puertos = [];
    for (let i = 0; i < 24; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: i === 6 ? C.amarillo : C.puerto });
      p.puertos.push(poner(g, new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.06), mat), xPuerto(i), 0.05, 0.72));
    }
    g.visible = false; p.fijo.add(g); p.grupoPanel = g;
    p.montar = async ctx => {
      ctx.enfocar(V(0, yU(1), FRENTE), 800, V(0.15, 0.2, 1), 26);
      await vaciar(p);
      await meter(g);
      ctx.burbuja('U1 · 20 tomas + 4 de reserva', V(0, yU(1) + 2, FRENTE));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(0, yU(1), FRENTE), 800, V(0.25, 0.35, 1), 28);
      await vaciar(p);
      const sw = poner(p.fijo, p.k.caja(W, 0.9, 5, C.sw, 0.05), 0, yU(1), FRENTE - 2.8); sw.visible = false;
      await meter(sw, 500);
      const cables = [];
      for (let i = 0; i < 6; i++) {
        const x = -4 + i * 1.6, roto = i === 2 || i === 4;
        const c = p.k.tubo(new THREE.CatmullRomCurve3([V(0.6, Y0 + ALTURA_U + 1, 1.5), V(x, Y0 + ALTURA_U + 2.5, FRENTE + 1), V(x, yU(1) + 0.2, FRENTE + 1.2), V(x, yU(1), FRENTE - 0.2)]), 0.12, roto ? C.rojo : C.datos, 0.03, 30);
        p.fijo.add(c); cables.push(c);
      }
      await Promise.all(cables.map((c, i) => esperar(i * 80).then(() => crecer(c, 450))));
      ctx.chispas(V(-0.8, yU(1) + 2, FRENTE + 1), false);
      ctx.burbuja('¡El cable rígido se rompe!', V(0, yU(1) + 4, FRENTE + 1), 'peligro');
      await esperar(1000);
    };
  }

  /* ===== 4. Ponchar y etiquetar ===== */
  {
    const p = nuevaPieza('ponchar', {
      nombre: 'Ponchar y etiquetar', accion: 'Ponchar los cables', coste: 0, requiere: ['panel', 'canaleta'],
      compra: [['Insertadora', 'Herramienta de inserción (punch down) y etiquetas', 1, 0]],
      texto: 'Cada cable fijo se conecta por detrás del panel: los hilos se insertan a presión en los contactos (conexión IDC) con la insertadora. Cada puerto lleva el número de su toma: la toma 07 de la pared llega al puerto 07 del panel.',
      tituloMal: 'Sin etiquetas',
      textoMal: 'Sin numerar, nadie sabe qué cable es cuál sin seguirlo por el techo. Cada cable se etiqueta en sus dos extremos con el mismo código.',
      foco: () => V(0, yU(1), 4.5), focoDir: V(0.25, 0.9, 0.7), dist: 24,
    });
    caja(p, 3, ['Ponchar', 'IDC · etiquetas']);
    const k = p.k;
    p.hilos = [];
    for (let i = 0; i < 20; i++) {
      const c = k.tubo(new THREE.CatmullRomCurve3([V(0.3, Y0 + ALTURA_U - 0.6, 2.2), V(xPuerto(i) * 0.6, yU(1) + 0.6, 4), V(xPuerto(i), yU(1), FRENTE - 1.7)]), 0.07, i === 6 ? C.amarillo : C.datos, 0.02, 16);
      c.geometry.setDrawRange(0, 0); p.fijo.add(c); p.hilos.push(c);
    }
    const herr = new THREE.Group(); herr.position.set(3, yU(1) + 1.5, 4.5);
    poner(herr, k.caja(0.6, 2.6, 0.6, C.amarillo, 0.05), 0, 0.9, 0);
    poner(herr, k.caja(0.2, 0.8, 0.2, 0xc9d0da, 0.03), 0, -0.8, 0);
    herr.visible = false; p.fijo.add(herr);
    p.montar = async ctx => {
      ctx.enfocar(V(0, yU(1), 4.5), 800, V(0.25, 0.9, 0.7), 24);
      await vaciar(p);
      herr.visible = true;
      await animar(1500, t => {
        p.hilos.forEach((c, i) => { const u = tramoA(t, i, 20, 0.7); c.geometry.setDrawRange(0, Math.floor((u * c.geometry.index.count) / 6) * 6); });
        const i = Math.min(19, Math.floor(t * 20)); herr.position.set(xPuerto(i), yU(1) + 1.6 - Math.abs(Math.sin(t * 60)) * 0.5, FRENTE - 1.9);
      }, ease.lineal);
      herr.visible = false;
      ctx.rotulo('07', V(xPuerto(6), yU(1) + 1.1, FRENTE + 0.3), p.id, 'puerto');
      ctx.burbuja('Toma 07 → puerto 07', V(xPuerto(6), yU(1) + 3, FRENTE));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(0, yU(1), 4.5), 800, V(0.25, 0.9, 0.7), 24);
      await vaciar(p);
      p.hilos.forEach(c => { c.geometry.setDrawRange(0, c.geometry.index.count); });
      for (const [i, t] of [[2, '¿Cuál es la 07?'], [12, '¿Y esta de dónde viene?']]) { ctx.burbuja(t, V(xPuerto(i), yU(1) + 3, FRENTE), 'peligro'); await esperar(700); }
      await esperar(900);
    };
  }

  /* ===== 5. Pasahilos ===== */
  {
    const p = nuevaPieza('pasahilos', {
      nombre: 'Pasahilos', accion: 'Atornillar el pasahilos', coste: 1, requiere: ['panel'],
      compra: [['Pasahilos', 'Panel guiacables de 1 U con anillas', 1, 1]],
      texto: 'Debajo del panel, en la U2, el pasahilos: un panel de 1 U con anillas para llevar ordenados los latiguillos entre el panel y el switch.',
      foco: () => V(0, yU(2), FRENTE), focoDir: V(0.15, 0.2, 1), dist: 26,
    });
    caja(p, 4, ['Pasahilos', '1 U']);
    const k = p.k, g = new THREE.Group(); g.position.set(0, yU(2), FRENTE - 0.5);
    poner(g, k.caja(W + 0.9, 0.9, 0.6, C.panel, 0.05), 0, 0, 0);
    for (let i = 0; i < 5; i++) poner(g, k.toro(0.32, 0.08, 0x9aa3b2, 0.03), -4.4 + i * 2.2, 0, 0.55);
    g.visible = false; p.fijo.add(g);
    p.montar = async ctx => {
      ctx.enfocar(V(0, yU(2), FRENTE), 800, V(0.15, 0.2, 1), 26);
      await vaciar(p);
      await meter(g);
      ctx.burbuja('U2 · para ordenar los latiguillos', V(0, yU(2) + 2, FRENTE));
    };
  }

  /* ===== 6. Switch ===== */
  {
    const p = nuevaPieza('switch', {
      nombre: 'Switch de 24 puertos', accion: 'Meter el switch', coste: 1, requiere: ['pasahilos'],
      compra: [['Switch', 'Switch de 24 puertos (1 U)', 1, 1]],
      texto: 'En la U3, el switch de 24 puertos: 20 para las tomas, 1 para el router y 3 libres. Queda justo debajo del panel y el pasahilos, así los latiguillos son cortos.',
      tituloMal: 'Un switch de 16 puertos',
      textoMal: 'Hay 20 tomas y el router: 21 conexiones. Con 16 puertos, 5 se quedan fuera. Cuenta siempre todo lo que va al switch.',
      foco: () => V(0, yU(3), FRENTE), focoDir: V(0.15, 0.2, 1), dist: 26,
    });
    caja(p, 5, ['Switch', '24 puertos · 1 U']);
    const k = p.k;
    const nuevo = (puertos, color) => {
      const g = new THREE.Group(); g.position.set(0, yU(3), FRENTE - 3.3);
      poner(g, k.caja(W - 0.2, 0.85, 6, color, 0.05), 0, 0, 0);
      const paso = puertos === 24 ? (W - 1.2) / 23 : (W * 0.6) / 15, x0 = puertos === 24 ? -W / 2 + 0.6 : -W * 0.3;
      for (let i = 0; i < puertos; i++) poner(g, new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.06), new THREE.MeshBasicMaterial({ color: C.puerto })), x0 + i * paso, 0.05, 3.02);
      for (let i = 0; i < 4; i++) poner(g, new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), R.leds), W / 2 - 0.5 - i * 0.3, 0.25, 3.03);
      g.visible = false; p.fijo.add(g); return g;
    };
    p.sw = nuevo(24, C.sw);
    p.montar = async ctx => {
      ctx.enfocar(V(0, yU(3), FRENTE), 800, V(0.15, 0.2, 1), 26);
      await vaciar(p);
      await meter(p.sw, 800);
      ctx.burbuja('U3 · 20 tomas + router + 3 libres', V(0, yU(3) + 2, FRENTE));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(0, yU(3), FRENTE), 800, V(0.25, 0.3, 1), 30);
      await vaciar(p);
      const peq = nuevo(16, 0x9aa3b2);
      await meter(peq, 600);
      const lat = [];
      for (let i = 0; i < 5; i++) {
        const c = p.k.tubo(new THREE.CatmullRomCurve3([V(2 + i * 0.7, yU(1), FRENTE + 0.4), V(4 + i * 0.6, yU(2.5), FRENTE + 2.5), V(5 + i * 0.5, yU(4.5) - i * 0.4, FRENTE + 2)]), 0.08, C.rojo, 0.02, 20);
        p.fijo.add(c); lat.push(c);
      }
      await Promise.all(lat.map((c, i) => esperar(i * 90).then(() => crecer(c, 400))));
      ctx.burbuja('21 conexiones y 16 puertos: ¡faltan 5!', V(0, yU(3) + 3, FRENTE + 1), 'peligro');
      await esperar(1000);
    };
  }

  /* ===== 7. Bandeja ===== */
  {
    const p = nuevaPieza('bandeja', {
      nombre: 'Bandeja y router', accion: 'Poner la bandeja', coste: 1, requiere: ['switch'],
      compra: [['Bandeja', 'Bandeja de 1 U para equipos que no son de rack', 1, 1]],
      texto: 'En la U4, una bandeja: un estante para lo que no es de rack. Encima va el router del operador, la salida a Internet del aula.',
      foco: () => V(0, yU(4), FRENTE), focoDir: V(0.25, 0.4, 1), dist: 26,
    });
    caja(p, 6, ['Bandeja', '1 U']);
    const k = p.k, g = new THREE.Group(); g.position.set(0, yU(4) - 0.38, FRENTE - 3.6);
    poner(g, k.caja(W - 0.2, 0.15, 7, 0x8592a6, 0.04), 0, 0, 0);
    const router = poner(g, k.caja(4, 0.55, 3, C.crema, 0.05), -2.5, 0.36, 0.5);
    for (let i = 0; i < 3; i++) poner(router, new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), R.leds), 1.4 - i * 0.3, 0.1, 1.52);
    g.visible = false; p.fijo.add(g);
    p.montar = async ctx => {
      ctx.enfocar(V(0, yU(4), FRENTE), 800, V(0.25, 0.4, 1), 26);
      await vaciar(p);
      await meter(g);
      ctx.burbuja('U4 · router del operador', V(0, yU(4) + 2, FRENTE));
    };
  }

  /* ===== 8. SAI ===== */
  {
    const p = nuevaPieza('sai', {
      nombre: 'SAI de rack', accion: 'Meter el SAI abajo', coste: 2, requiere: ['armario'],
      compra: [['SAI', 'SAI de rack (2 U)', 1, 2]],
      texto: 'El SAI mantiene la red encendida durante un corte de luz. Pesa mucho: va abajo, en las U7 y U8. Las U5 y U6 quedan libres para ampliar.',
      tituloMal: 'El SAI arriba',
      textoMal: 'Lo pesado arriba fuerza los anclajes del armario mural y, en uno de suelo, lo hace volcar. Lo pesado, siempre abajo.',
      foco: () => V(0, yU(7.5), FRENTE), focoDir: V(0.25, 0.25, 1), dist: 28,
    });
    caja(p, 7, ['SAI', '2 U · pesa']);
    const k = p.k;
    const nuevoSai = u => {
      const g = new THREE.Group(); g.position.set(0, yU(u + 0.5), FRENTE - 3.9);
      poner(g, k.caja(W - 0.2, 1.85, 7.4, C.sai, 0.06), 0, 0, 0);
      poner(g, k.caja(2.2, 0.8, 0.08, 0x7fb4ff, 0), -3, 0.2, 3.72);
      poner(g, k.cil(0.3, 0.12, C.verde, 0.03, 16), 3.8, 0.2, 3.75).rotation.x = Math.PI / 2;
      g.visible = false; p.fijo.add(g); return g;
    };
    p.saiG = nuevoSai(7);
    p.montar = async ctx => {
      ctx.enfocar(V(0, yU(7.5), FRENTE), 800, V(0.25, 0.25, 1), 28);
      await vaciar(p);
      await meter(p.saiG, 900);
      ctx.burbuja('Lo pesado, abajo', V(0, yU(7.5) + 2.5, FRENTE));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(0, 40, FRENTE), 800, V(0.7, 0.25, 0.8), 40);
      await vaciar(p);
      const arriba = nuevoSai(5);
      await meter(arriba, 800);
      const arm = P.armario.armario, todo = [arm, ...Object.values(P).filter(q => q.montado && q.id !== 'armario').map(q => q.fijo), p.fijo];
      const piv = new THREE.Group(); piv.position.set(0, Y0, 0.4); p.fijo.parent.add(piv);
      // se inclina hacia delante desde abajo y vuelve: los anclajes no aguantan
      const r0 = todo.map(o => ({ o, padre: o.parent }));
      r0.forEach(({ o }) => piv.attach(o));
      await animar(1300, (_, t) => { piv.rotation.x = Math.sin(t * Math.PI * 3) * 0.12 * (1 - t * 0.5); }, ease.lineal);
      ctx.burbuja('¡Lo pesado arriba fuerza los anclajes!', V(0, Y0 + 12, FRENTE), 'peligro');
      await esperar(900);
    };
  }

  /* ===== 9. Regleta ===== */
  {
    const p = nuevaPieza('regleta', {
      nombre: 'Regleta (PDU)', accion: 'Poner la regleta', coste: 1, requiere: ['sai'],
      compra: [['Regleta', 'Regleta de rack con interruptor (1 U)', 1, 1]],
      texto: 'Abajo del todo, en la U9, la regleta: los enchufes de los equipos del armario, con interruptor y protección. Se enchufa a la toma de la pared.',
      foco: () => V(4, yU(9), FRENTE), focoDir: V(0.3, 0.3, 1), dist: 30,
    });
    caja(p, 8, ['Regleta', 'PDU · 1 U']);
    const k = p.k, g = new THREE.Group(); g.position.set(0, yU(9), FRENTE - 0.8);
    poner(g, k.caja(W + 0.9, 0.85, 1.2, C.regleta, 0.05), 0, 0, 0);
    for (let i = 0; i < 6; i++) poner(g, k.caja(0.8, 0.55, 0.1, C.enchufe, 0.02), -4 + i * 1.4, 0, 0.62);
    poner(g, k.caja(0.6, 0.45, 0.15, C.rojo, 0.02), 5, 0, 0.64);
    g.visible = false; p.fijo.add(g);
    p.cable = k.tubo(new THREE.CatmullRomCurve3([V(W / 2, yU(9), FRENTE - 1.4), V(W / 2 + 2, Y0 - 1, 4), V(ENCHUFE.x, ENCHUFE.y + 2, 1.4), V(ENCHUFE.x, ENCHUFE.y, 0.9)]), 0.18, C.luz, 0.04, 40);
    p.cable.geometry.setDrawRange(0, 0); p.fijo.add(p.cable);
    p.montar = async ctx => {
      ctx.enfocar(V(4, yU(9), FRENTE), 800, V(0.3, 0.3, 1), 30);
      await vaciar(p);
      await meter(g);
      await crecer(p.cable, 600);
      ctx.burbuja('U9 · regleta', V(0, yU(9) - 2, FRENTE));
    };
  }

  /* ===== 10. Latiguillos ===== */
  {
    const p = nuevaPieza('latiguillos', {
      nombre: 'Latiguillos', accion: 'Conectar los latiguillos', coste: 0, requiere: ['ponchar', 'switch', 'bandeja'],
      compra: [['Latiguillos', 'Latiguillos cortos Cat 6 (panel → switch y switch → router)', 21, 0]],
      texto: 'Un latiguillo corto por cada toma, del panel al switch, pasando por el pasahilos: del puerto 07 del panel al puerto 7 del switch. Uno más del switch al router. Mover un puesto es cambiar un latiguillo.',
      tituloMal: 'Latiguillos largos y sin ordenar',
      textoMal: 'Con latiguillos largos y sin pasahilos sale una maraña: no se ve qué va a dónde, se enganchan y tapan la ventilación. Latiguillos de la longitud justa, por el pasahilos.',
      foco: () => V(0, yU(2), FRENTE), focoDir: V(0.15, 0.25, 1), dist: 24,
    });
    caja(p, 9, ['Latiguillos', '× 21']);
    const k = p.k;
    p.lat = [];
    for (let i = 0; i < 20; i++) {
      const x = xPuerto(i), xa = -4.4 + Math.round((i / 19) * 4) * 2.2;
      const c = k.tubo(new THREE.CatmullRomCurve3([V(x, yU(1), FRENTE - 0.2), V(x, yU(1) - 0.3, FRENTE + 0.6), V((x + xa) / 2, yU(2), FRENTE + 0.75), V(x, yU(3) + 0.3, FRENTE + 0.6), V(x, yU(3), FRENTE - 0.2)]), 0.07, i === 6 ? C.amarillo : C.lati, 0.02, 24);
      c.geometry.setDrawRange(0, 0); p.fijo.add(c); p.lat.push(c);
    }
    const r = k.tubo(new THREE.CatmullRomCurve3([V(xPuerto(23), yU(3), FRENTE - 0.2), V(xPuerto(23) + 0.4, yU(3.5), FRENTE + 0.6), V(-1, yU(4) - 0.1, FRENTE + 0.4), V(-1.2, yU(4) - 0.05, FRENTE - 2)]), 0.07, C.verde, 0.02, 24);
    r.geometry.setDrawRange(0, 0); p.fijo.add(r); p.lat.push(r);
    p.montar = async ctx => {
      ctx.enfocar(V(0, yU(2), FRENTE), 800, V(0.15, 0.25, 1), 24);
      await vaciar(p);
      await animar(1400, t => p.lat.forEach((c, i) => {
        const u = tramoA(t, i, p.lat.length, 0.75);
        c.geometry.setDrawRange(0, Math.floor((u * c.geometry.index.count) / 6) * 6);
      }), ease.lineal);
      ctx.burbuja('Panel 07 → switch 7', V(xPuerto(6), yU(1) + 2.2, FRENTE + 1));
    };
    p.mal = async ctx => {
      ctx.enfocar(V(0, yU(3), FRENTE), 800, V(0.3, 0.3, 1), 28);
      await vaciar(p);
      const lio = [];
      for (let i = 0; i < 16; i++) {
        const x = xPuerto(i * 1.2);
        const pts = [V(x, yU(1), FRENTE - 0.2)];
        for (let j = 1; j < 6; j++) pts.push(V(x + Math.sin(i * 3 + j) * 4, yU(1) - j * 1.6 + Math.cos(i + j) * 1.2, FRENTE + 1 + Math.abs(Math.sin(i * j)) * 3));
        pts.push(V(xPuerto((i * 7) % 20), yU(3), FRENTE - 0.2));
        const c = p.k.tubo(new THREE.CatmullRomCurve3(pts), 0.07, [C.lati, C.rojo, C.amarillo, C.verde][i % 4], 0.02, 50);
        p.fijo.add(c); lio.push(c);
      }
      await Promise.all(lio.map((c, i) => esperar(i * 50).then(() => crecer(c, 500))));
      ctx.burbuja('¡Una maraña!', V(0, yU(5), FRENTE + 3), 'peligro');
      await esperar(1000);
    };
  }

  /* ===== 11. Cerrar y encender ===== */
  {
    const p = nuevaPieza('encender', {
      nombre: 'Cerrar y encender', accion: 'Cerrar con llave y encender', coste: 0,
      requiere: ['armario', 'canaleta', 'panel', 'ponchar', 'pasahilos', 'switch', 'bandeja', 'sai', 'regleta', 'latiguillos'],
      texto: 'Se cierra la puerta con llave (solo entra el personal técnico) y se enciende. El ordenador del puesto 7 sale por la toma 07, sube por la canaleta, llega al puerto 07 del panel y, por el latiguillo, al puerto 7 del switch y al router.',
      tituloMal: 'Armario abierto y sin llave',
      textoMal: 'Cualquiera puede tocar un latiguillo o el interruptor de la regleta y dejar el aula sin red. El acceso al armario es restringido.',
      foco: () => V(-14, 30, 6), focoDir: V(0.25, 0.3, 1), dist: 100,
    });
    caja(p, 10, ['⚡', 'Encender'], C.amarillo);
    p.montar = async ctx => {
      ctx.enfocar(V(-14, 30, 6), 800, V(0.25, 0.3, 1), 100);
      await vaciar(p);
      if (R.puerta) await animar(800, t => { R.puerta.rotation.y = -1.9 * (1 - t); }, ease.suave);
      R.encendida = true;
      R.leds.color.set(C.verde);
      if (!velocidad.instantaneo) {
        ctx.burbuja('¡Red del aula funcionando!', V(0, Y0 + ALTURA_U + 4, FRENTE));
        ctx.confeti();
        await esperar(1000);
      }
    };
    p.mal = async ctx => {
      ctx.enfocar(V(0, 40, FRENTE), 800, V(0.3, 0.3, 1), 34);
      await vaciar(p);
      R.leds.color.set(C.verde);
      await esperar(500);
      const reg = P.regleta.fijo;
      ctx.burbuja('Clic… ¿qué es este botón?', V(5, yU(9) - 1.5, FRENTE + 1), 'peligro');
      await esperar(700);
      R.leds.color.set(C.rojo);
      ctx.burbuja('¡El aula se ha quedado sin red!', V(0, Y0 + ALTURA_U + 4, FRENTE), 'peligro');
      await esperar(1100);
      void reg;
    };
  }

  // ruta del paquete: PC del puesto 7 → toma 07 → canaleta → panel 07 → latiguillo → switch 7 → router
  R.ruta = nuevaRuta([V(-36, 17.5, 9), V(-36, TOMA.y, 2), V(-36, CANALETA_Y + 0.55, 2), V(0.6, CANALETA_Y + 0.55, 2), V(0.6, Y0 + ALTURA_U + 0.2, 2),
    V(xPuerto(6), yU(1), FRENTE - 1.7), V(xPuerto(6), yU(1), FRENTE + 0.6), V(xPuerto(6), yU(3), FRENTE + 0.6), V(xPuerto(23), yU(3), FRENTE + 0.6), V(-1.2, yU(4), FRENTE - 2)]);
  return { P, escenario, R };
}

function nuevaRuta(pts) {
  const acum = [0];
  for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, acum, largo: acum[acum.length - 1] };
}
function puntoEn(ruta, t, dest) {
  const obj = t * ruta.largo;
  let i = 1;
  while (i < ruta.acum.length - 1 && ruta.acum[i] < obj) i++;
  const tramo = ruta.acum[i] - ruta.acum[i - 1] || 1;
  return dest.lerpVectors(ruta.pts[i - 1], ruta.pts[i], (obj - ruta.acum[i - 1]) / tramo);
}

// Paquetes del puesto 7 al router y LEDs parpadeando
export function animarRack(R, raiz, dt) {
  R.reloj += dt;
  if (!R.paquetes) {
    R.paquetes = new THREE.Group(); raiz.add(R.paquetes);
    const geo = new THREE.SphereGeometry(0.45, 12, 8), mat = new THREE.MeshBasicMaterial({ color: 0x3fbf6a });
    for (let i = 0; i < 3; i++) R.paquetes.add(new THREE.Mesh(geo, mat));
  }
  R.paquetes.visible = R.encendida;
  if (!R.encendida) return;
  R.paquetes.children.forEach((m, i) => puntoEn(R.ruta, ((R.reloj * 22) / R.ruta.largo + i / 3) % 1, m.position));
  R.leds.color.setHex(Math.floor(R.reloj * 6) % 3 ? 0x3fbf6a : 0xb6f0c8);
}

// ---------- Escenario fijo: pared, suelo, mesa del puesto 7, toma y enchufe ----------
function construirEscenario() {
  const g = new THREE.Group();
  const tinta = nuevaTinta(), k = kit(tinta, [tinta]);
  poner(g, k.caja(96, 1, 50, C.suelo, 0.1), -8, -0.5, 24);
  poner(g, k.caja(96, 62, 0.8, C.pared, 0.1), -8, 31, -0.4);
  poner(g, k.caja(96, 2.4, 0.4, 0xe2794f, 0.05), -8, 1.2, 0.2);               // rodapié
  // toma 07 y enchufe de la pared
  poner(g, k.caja(2.2, 2.2, 0.6, C.blanco, 0.05), TOMA.x, TOMA.y, 0.3);
  for (const dx of [-0.45, 0.45]) poner(g, new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.1), new THREE.MeshBasicMaterial({ color: C.puerto })), TOMA.x + dx, TOMA.y, 0.65);
  poner(g, k.caja(2.2, 2.2, 0.6, C.blanco, 0.05), ENCHUFE.x, ENCHUFE.y, 0.3);
  poner(g, k.cil(0.6, 0.2, 0x9aa3b2, 0.03, 16), ENCHUFE.x, ENCHUFE.y, 0.7).rotation.x = Math.PI / 2;
  // mesa del puesto 7 con su ordenador
  const m = new THREE.Group(); m.position.set(-36, 0, 9); g.add(m);
  poner(m, k.caja(20, 0.8, 12, C.mesa, 0.06), 0, 16.6, 0);
  for (const dx of [-9, 9]) for (const dz of [-5, 5]) poner(m, k.caja(0.8, 16.2, 0.8, C.mesa, 0), dx, 8.1, dz);
  poner(m, k.caja(4, 9, 8, C.pc, 0.06), 6, 21.5, -1);
  const mon = poner(m, k.caja(9, 5.5, 0.6, C.monitor, 0.06), -3, 23.5, -3);
  poner(mon, new THREE.Mesh(new THREE.PlaneGeometry(8.2, 4.7), new THREE.MeshBasicMaterial({ color: 0x7fb4ff })), 0, 0, 0.32);
  poner(m, k.caja(0.8, 3, 0.8, C.monitor, 0.03), -3, 18.5, -3);
  poner(m, k.caja(6, 0.4, 2.2, 0xdfe5ee, 0.03), -3, 17.2, 2);
  // latiguillo del PC a la toma
  m.add(k.tubo(new THREE.CatmullRomCurve3([V(6, 18, -5), V(6, 10, -8), V(1, TOMA.y, -8.4), V(0, TOMA.y, -8.4)]), 0.15, C.lati, 0.03, 30));
  return g;
}
