// animado.js — Escena animada paso a paso en estilo cartoon (la red de Cerámicas, el armario rack…).
// Modo libre (el alumno toca las cajas o lo ya montado) y modo clase (el profesor avanza paso a paso).
// Recibe la definición de la escena (E): construir(), ORDEN, VISTAS, contador (hud) y textos.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { h } from '../util.js';
import { animar, esperar, ease, actualizarAnimaciones, cancelarAnimaciones, alMomento, velocidad } from '../animado/anim.js';
import { TINTA, SELECCION } from '../animado/toon.js';

const LENTO = 2.2;
export async function vistaAnimado(E) {
  const { ORDEN, VISTAS, hud: HUD, textos: T } = E;
  const MAXIMO = HUD.max;
  /* ---------- Interfaz ---------- */
  const lienzo = h('canvas.am-lienzo', { 'aria-label': T.aria });
  const pista = h('p.am-pista', T.pista);
  const pasos = h('ol.am-pasos');
  const progresoBarra = h('span'), cuenta = h('span.am-cuenta');
  const panel = h('aside.am-panel', { 'aria-label': 'Pasos de la instalación' },
    h('div.am-panel-cab', h('h2', 'Pasos'), cuenta),
    h('div.am-progreso', progresoBarra), pasos,
    h('p.am-nota', 'Puedes hacerlo en otro orden: si algo no toca, te avisa.'));

  const fTitulo = h('h2'), fTexto = h('p'), fCompra = h('ul.rd-compra'), fReq = h('p.am-requiere', { hidden: true });
  const btnAccion = h('button.am-btn.am-principal', { type: 'button' });
  const btnMal = h('button.am-btn.am-peligro', { type: 'button' }, '¿Y si lo hago mal?');
  const ficha = h('section.am-ficha', { hidden: true, 'aria-live': 'polite' },
    h('button.am-cerrar', { type: 'button', 'aria-label': 'Cerrar', onclick: () => cerrarFicha() }, '×'),
    fTitulo, fTexto, fCompra, fReq, h('div.am-ficha-botones', btnAccion, btnMal));

  // Presupuesto
  const pGastado = h('b'), pQueda = h('span'), pBarra = h('span'), pUltimo = h('div.rd-ultimo');
  const presu = h('div.rd-presu', { 'aria-live': 'polite' },
    h('div.rd-presu-cab', HUD.cab),
    h('div.rd-presu-cifra', pGastado, h('small', ' de ' + HUD.fmt(MAXIMO))),
    h('div.rd-presu-barra', pBarra), pQueda, pUltimo);

  const aviso = h('div.am-aviso', { role: 'status' });
  const tooltip = h('div.am-tooltip');
  const capaBurbujas = h('div.am-burbujas');
  const capaRotulos = h('div.am-burbujas.rd-rotulos');
  const destello = h('div.am-destello');
  const sin3d = h('div.am-sin3d', { hidden: true }, h('p', 'Este navegador no puede mostrar gráficos 3D (WebGL). Prueba con otro navegador o actualízalo.'));

  // Barra del modo clase
  const cPaso = h('span.am-clase-paso'), cTitulo = h('h2'), cTexto = h('p'), cCompra = h('p.rd-clase-compra');
  const bAnt = h('button.am-btn', { type: 'button', title: 'Flecha izquierda' }, '◀ Anterior');
  const bRep = h('button.am-btn', { type: 'button', title: 'Tecla R' }, '↻ Repetir');
  const bSig = h('button.am-btn.am-principal', { type: 'button', title: 'Flecha derecha o espacio' }, 'Siguiente ▶');
  const bMal = h('button.am-btn.am-peligro', { type: 'button', title: 'Tecla M' }, '¿Y si lo hago mal?');
  const bVel = h('button.am-btn', { type: 'button', title: 'Tecla L', 'aria-pressed': 'false' }, 'Velocidad: normal');
  const bSalir = h('button.am-btn', { type: 'button' }, 'Salir');
  const barraClase = h('div.am-barra-clase',
    h('div.am-clase-info', cPaso, cTitulo, cTexto, cCompra),
    h('div.am-clase-controles', bAnt, bRep, bSig, bMal, bVel, bSalir));

  const dialogo = h('dialog.am-final',
    h('h2', T.finTitulo),
    h('p', T.finTexto),
    h('div.am-ficha-botones',
      h('button.am-btn.am-principal', { type: 'button', onclick: () => { dialogo.close(); construir([], true); } }, 'Volver a empezar'),
      h('button.am-btn', { type: 'button', onclick: () => dialogo.close() }, 'Seguir mirando')));

  const escenaEl = h('div.am-escena.rd-escena' + (T.clase ? '.' + T.clase : ''), lienzo, capaRotulos, pista, panel, presu, ficha, aviso, tooltip, capaBurbujas, destello, barraClase, sin3d, dialogo);

  const bClase = h('button.btn.azul', { type: 'button', onclick: () => entrarClase() }, 'Modo clase (proyector)');
  const bVista = h('button.btn.sec', { type: 'button', onclick: () => irA(VISTAS.general.pos, VISTAS.general.obj) }, 'Vista general');
  const bNuevo = h('button.btn.sec', { type: 'button', onclick: () => construir([], true) }, 'Empezar de nuevo');
  const bLento = h('button.btn.sec', { type: 'button', 'aria-pressed': 'false', onclick: () => cambiarVelocidad() }, 'Más lento');

  const el = h('div.animado',
    h('div.am-cab',
      h('div', h('span.etiqueta', T.etiqueta), h('h1', T.titulo), h('p.lead', T.lead)),
      h('div.fila', bClase, bVista, bNuevo, bLento)),
    escenaEl,
    h('p.am-atajos', 'Modo clase con teclado o presentador: ', h('kbd', '→'), ' o ', h('kbd', 'espacio'), ' siguiente · ', h('kbd', '←'), ' anterior · ', h('kbd', 'R'), ' repetir · ', h('kbd', 'M'), ' error · ', h('kbd', 'L'), ' lento · ', h('kbd', 'Esc'), ' salir'));

  /* ---------- Estado ---------- */
  let renderer, escena, camara, controles, raiz, ro, luzChispa;
  let P = {}, R = null, hecho = new Set(), ocupado = false, seleccion = null, encima = null;
  let clase = false, pantallaCompleta = false, generacion = 0, mensajeMal = null;
  let gastado = 0, extra = 0, mostrado = 0;
  const particulas = [], burbujas = [], rotulos = [], temporizadores = new Set();

  const despues = (ms, fn) => { const t = setTimeout(() => { temporizadores.delete(t); fn(); }, ms); temporizadores.add(t); };

  const ctx = {
    get piezas() { return P; },
    enfocar: (p, ms = 750, dir, dist) => { if (!velocidad.instantaneo) return enfocar(p, ms, dir, dist); },
    burbuja: (t, p, tipo) => { if (!velocidad.instantaneo) burbuja(t, p, tipo); },
    chispas: (p, fuerte) => { if (!velocidad.instantaneo) chispas(p, fuerte); },
    confeti: () => { if (!velocidad.instantaneo) confeti(); },
    presupuesto: d => { extra += d; pintarPresupuesto(true); },
    rotulo: (t, p, dueno, clase) => rotulo(t, p, clase),
  };

  /* ---------- Escena ---------- */
  function iniciar() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
    } catch (e) {
      sin3d.hidden = false;
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    escena = new THREE.Scene();
    escena.background = new THREE.Color(E.fondo || 0xdcecf4);
    camara = new THREE.PerspectiveCamera(36, 1, 1, 900);
    camara.position.copy(VISTAS.general.pos);
    controles = new OrbitControls(camara, lienzo);
    controles.target.copy(VISTAS.general.obj);
    controles.enableDamping = true;
    controles.maxPolarAngle = 1.3;
    controles.minDistance = (E.distancias || [10, 280])[0];
    controles.maxDistance = (E.distancias || [10, 280])[1];

    escena.add(new THREE.AmbientLight(0xffffff, 1.2));
    const sol = new THREE.DirectionalLight(0xfff4e0, 2.2);
    sol.position.set(-60, 110, 70);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    const sb = E.sombra || 95; Object.assign(sol.shadow.camera, { left: -sb, right: sb, top: sb * 0.9, bottom: -sb * 0.9, near: 1, far: 320 });
    sol.target.position.set(0, 0, 0);
    escena.add(sol.target);
    sol.shadow.bias = -0.0008;
    escena.add(sol);
    luzChispa = new THREE.PointLight(0xffc23a, 0, 50);
    escena.add(luzChispa);

    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.ShadowMaterial({ opacity: 0.1 }));
    sombra.rotation.x = -Math.PI / 2; sombra.position.y = -1.05; sombra.receiveShadow = true;
    escena.add(sombra);

    ro = new ResizeObserver(ajustar);
    ro.observe(escenaEl);
    ajustar();

    const reloj = new THREE.Clock(), proy = new THREE.Vector3();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(reloj.getDelta(), 0.05);
      actualizarAnimaciones(performance.now());
      for (const p of Object.values(P)) {
        const meta = p === encima && !p.montado && !ocupado && p.accion ? 0.8 : 0;
        p.hover += (meta - p.hover) * Math.min(1, dt * 12);
        p.cuerpo.position.y = p.hover + p.salto;
      }
      if (R && E.animar) E.animar(R, raiz, dt);
      for (let i = particulas.length - 1; i >= 0; i--) {
        const q = particulas[i];
        q.v.y -= q.g * dt;
        if (q.freno) q.v.multiplyScalar(Math.pow(0.6, dt));
        q.m.position.addScaledVector(q.v, dt);
        q.m.rotation.x += q.giro * dt; q.m.rotation.y += q.giro * 0.7 * dt;
        q.vida -= dt;
        if (q.vida < 0.4) q.m.scale.setScalar(Math.max(0.001, q.vida / 0.4));
        if (q.vida <= 0 || q.m.position.y < -1) { escena.remove(q.m); particulas.splice(i, 1); }
      }
      controles.update();
      renderer.render(escena, camara);
      const w = lienzo.clientWidth, hh = lienzo.clientHeight;
      for (const b of burbujas.concat(rotulos)) {
        proy.copy(b.pos).project(camara);
        const fuera = proy.z > 1;
        b.el.style.transform = `translate(${((proy.x + 1) / 2) * w}px, ${((1 - proy.y) / 2) * hh}px)`;
        b.el.style.visibility = fuera ? 'hidden' : '';
      }
    });

    lienzo.addEventListener('pointerdown', alPulsar);
    lienzo.addEventListener('pointerup', alSoltar);
    lienzo.addEventListener('dblclick', alDobleClic);
    lienzo.addEventListener('pointermove', alMover);
    lienzo.addEventListener('pointerleave', () => { encima = null; tooltip.classList.remove('visible'); });
    addEventListener('keydown', alTeclado);
    document.addEventListener('fullscreenchange', alCambiarPantalla);

    construir([], true);
  }

  // Monta de golpe (sin animación) los pasos indicados. Con intro, las cajas caen con rebote.
  async function construir(ids, intro = false) {
    const mia = ++generacion;
    cancelarAnimaciones();
    if (raiz) { escena.remove(raiz); raiz.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    particulas.splice(0).forEach(q => escena.remove(q.m));
    rotulos.splice(0).forEach(r => r.el.remove());
    raiz = new THREE.Group();
    escena.add(raiz);
    const red = E.construir();
    P = red.P; R = red.R;
    raiz.add(red.escenario);
    for (const p of Object.values(P)) raiz.add(p.grupo, p.fijo);
    (E.rotulos || []).forEach(([t, pos, c]) => rotulo(t, pos, c));
    hecho = new Set(); seleccion = null; encima = null; mensajeMal = null; extra = 0;
    if (!clase) cerrarFicha();
    ocupado = true;
    await alMomento(async () => {
      for (const id of ids) { await P[id].montar(ctx); P[id].montado = true; hecho.add(id); }
    });
    if (mia !== generacion) return;
    ocupado = false;
    gastado = ids.reduce((s, id) => s + P[id].coste, 0);
    pintarPresupuesto(false);
    if (intro) {
      irA(VISTAS.general.pos, VISTAS.general.obj, 900);
      ORDEN.forEach((id, i) => {
        const p = P[id];
        p.salto = 18;
        esperar(120 + i * 60).then(() => animar(750, t => { p.salto = 18 * (1 - t); }, ease.rebote));
      });
    }
    refrescar();
  }

  /* ---------- Cámara ---------- */
  function enfocar(punto, ms, dirFija, dist) {
    const t0 = controles.target.clone(), c0 = camara.position.clone();
    const dir = dirFija ? dirFija.clone().normalize() : c0.clone().sub(t0).normalize();
    if (dir.y < 0.45) { dir.y = 0.45; dir.normalize(); }
    const d = dist || Math.min(c0.distanceTo(t0), 120);
    const c1 = punto.clone().addScaledVector(dir, d);
    return animar(ms, t => {
      controles.target.lerpVectors(t0, punto, t);
      camara.position.lerpVectors(c0, c1, t);
    });
  }
  // Modo clase: después de cada paso, la cámara va al sitio del paso siguiente
  function enfocarSiguiente() {
    const id = siguienteId();
    if (!id) return irA(VISTAS.final.pos, VISTAS.final.obj, 900);
    const p = P[id];
    return enfocar(p.foco(), 900, p.focoDir || new THREE.Vector3(0, 1, 0.75), p.dist || 120);
  }
  function irA(pos, obj, ms = 900) {
    if (!controles) return;
    const t0 = controles.target.clone(), c0 = camara.position.clone();
    return animar(ms, t => {
      controles.target.lerpVectors(t0, obj, t);
      camara.position.lerpVectors(c0, pos, t);
    });
  }
  function ajustar() {
    if (!renderer) return;
    const r = escenaEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    const px = !clase && r.width > 820 ? panel.offsetWidth + 24 : 0;
    const py = clase ? barraClase.offsetHeight : 0;
    camara.aspect = (r.width + px) / (r.height + py);
    const visible = r.width / r.height;
    camara.fov = Math.min(72, Math.max(36, (2 * Math.atan(Math.tan((31 * Math.PI) / 180) / visible) * 180) / Math.PI));
    if (px || py) camara.setViewOffset(r.width + px, r.height + py, px, py, r.width, r.height);
    else camara.clearViewOffset();
    camara.updateProjectionMatrix();
  }

  /* ---------- Efectos ---------- */
  function burbuja(texto, pos, tipo = '') {
    const b = h('div.am-burbuja' + (tipo ? '.' + tipo : ''), h('span', texto));
    capaBurbujas.append(b);
    const reg = { el: b, pos: pos.clone() };
    burbujas.push(reg);
    despues(2300 * velocidad.factor, () => { b.remove(); burbujas.splice(burbujas.indexOf(reg), 1); });
  }
  function rotulo(texto, pos, tipo = '') {
    const r = h('div.rd-rotulo' + (tipo ? '.' + tipo : ''), h('span', texto));
    capaRotulos.append(r);
    rotulos.push({ el: r, pos: pos.clone() });
    return r;
  }
  const geoChispa = new THREE.OctahedronGeometry(0.45);
  const matChispa = [0xffd23f, 0xff8a3d, 0xffffff].map(c => new THREE.MeshBasicMaterial({ color: c }));
  function chispas(pos, fuerte = true) {
    const n = fuerte ? 46 : 26, f = fuerte ? 1 : 0.6;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geoChispa, matChispa[i % 3]);
      m.position.copy(pos);
      escena.add(m);
      const k = E.escala || 1; m.scale.setScalar(Math.max(0.4, k));
      particulas.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 22 * f * k, (Math.random() * 16 + 5) * f * k, (Math.random() - 0.5) * 22 * f * k), vida: 0.6 + Math.random() * 0.5, g: 34 * k, giro: 10 });
    }
    luzChispa.position.copy(pos).add(new THREE.Vector3(0, 2, 0));
    animar(700, t => { luzChispa.intensity = 1500 * f * (1 - t); }, ease.salida);
    if (fuerte) { destello.classList.remove('activo'); void destello.offsetWidth; destello.classList.add('activo'); }
  }
  const geoConfeti = new THREE.PlaneGeometry(1.4, 0.8);
  const colConfeti = [0xff6a3d, 0xffd23f, 0x4a86e8, 0x3fbf6a, 0x8b6fe0, 0xe5484d].map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  function confeti() {
    const c = controles.target;
    for (let i = 0; i < 220; i++) {
      const m = new THREE.Mesh(geoConfeti, colConfeti[i % colConfeti.length]);
      const k = E.escala || 1; m.position.set(c.x + (Math.random() - 0.5) * 110 * k, c.y + (40 + Math.random() * 20) * k, c.z + (Math.random() - 0.5) * 80 * k); m.scale.setScalar(Math.max(0.35, k));
      m.rotation.set(Math.random() * 6, Math.random() * 6, 0);
      escena.add(m);
      particulas.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 8, -Math.random() * 6, (Math.random() - 0.5) * 8), vida: 4 + Math.random() * 2, g: 7, giro: 5, freno: true });
    }
  }

  /* ---------- Presupuesto ---------- */
  function pintarPresupuesto(animado) {
    const objetivo = gastado + extra;
    const pinta = v => {
      pGastado.textContent = HUD.fmt(v);
      const pasa = v > MAXIMO;
      presu.classList.toggle('pasado', pasa);
      pBarra.style.width = Math.min(100, (v / MAXIMO) * 100) + '%';
      pQueda.textContent = pasa ? HUD.pasa(v - MAXIMO) : HUD.queda(MAXIMO - v);
    };
    if (!animado || velocidad.instantaneo) { mostrado = objetivo; pinta(objetivo); return; }
    const desde = mostrado;
    animar(900, t => { mostrado = desde + (objetivo - desde) * t; pinta(mostrado); }, ease.salida);
  }
  function anunciarCompra(p) {
    if (!p.compra.length) { pUltimo.replaceChildren(); return; }
    pUltimo.replaceChildren(...p.compra.map(l => h('div', h('b', l[0]), HUD.resto(l))));
    pUltimo.classList.remove('nuevo'); void pUltimo.offsetWidth; pUltimo.classList.add('nuevo');
  }
  const lineaCompra = p => p.compra.length ? HUD.prefijo + p.compra.map(l => l[0] + HUD.resto(l)).join(' · ') : '';

  /* ---------- Lógica de pasos ---------- */
  const faltan = p => p.requiere.filter(r => !hecho.has(r));
  const nombres = ids => ids.map(r => P[r].nombre).join(', ');
  const puedeMal = p => p.mal && !p.montado && !faltan(p).length;
  const siguienteId = () => ORDEN.find(id => !hecho.has(id));

  function tintar(p, color) { p.tintas.forEach(t => t.color.set(color)); }

  let tAviso;
  function avisar(texto, tipo = '') {
    aviso.textContent = texto;
    aviso.className = 'am-aviso visible ' + tipo;
    clearTimeout(tAviso);
    tAviso = setTimeout(() => { aviso.className = 'am-aviso'; }, 5600 * velocidad.factor);
  }

  async function sacudir(p) {
    await animar(480, (_, t) => { p.cuerpo.position.x = Math.sin(t * Math.PI * 7) * 0.6 * (1 - t); }, ease.lineal);
    p.cuerpo.position.x = 0;
  }

  async function intentar(p) {
    if (ocupado || p.montado || !p.montar) return;
    const falta = faltan(p);
    if (falta.length) {
      sacudir(p);
      avisar('Todavía no. Antes: ' + nombres(falta) + '.', 'cuidado');
      return;
    }
    const mia = generacion;
    ocupado = true; mensajeMal = null; refrescar();
    tintar(p, TINTA);
    p.hover = 0;
    anunciarCompra(p);
    gastado += p.coste;
    pintarPresupuesto(true);
    try { await p.montar(ctx); } finally { if (mia === generacion) ocupado = false; }
    if (mia !== generacion) return;
    p.montado = true;
    hecho.add(p.id);
    if (seleccion === p && !clase) tintar(p, SELECCION);
    refrescar();
    if (hecho.size === ORDEN.length && !clase) {
      await esperar(1600);
      if (mia !== generacion) return;
      cerrarFicha();
      dialogo.showModal();
    } else if (clase) enfocarSiguiente();
  }

  // Enseña el error típico del paso y luego deja la escena como estaba.
  async function verMal(p) {
    if (ocupado || !puedeMal(p)) return;
    const mia = generacion;
    const estado = ORDEN.filter(id => hecho.has(id));
    const idSel = seleccion && seleccion.id;
    ocupado = true; mensajeMal = p; refrescar();
    tintar(p, TINTA);
    p.hover = 0;
    avisar(p.tituloMal + ': ' + p.textoMal, 'peligro');
    try { await p.mal(ctx); await esperar(1300); } finally { if (mia === generacion) ocupado = false; }
    if (mia !== generacion) return;
    await construir(estado);
    mensajeMal = P[p.id];
    if (idSel && !clase) seleccionar(P[idSel]);
    refrescar();
    if (clase) enfocarSiguiente();
  }

  /* ---------- Pintar interfaz ---------- */
  function refrescar() {
    pintarPasos();
    mostrarFicha();
    pintarClase();
  }

  function pintarPasos() {
    const sig = siguienteId();
    pasos.replaceChildren(...ORDEN.map((id, i) => {
      const p = P[id], listo = hecho.has(id);
      const estado = listo ? 'hecho' : !faltan(p).length ? 'disponible' : 'bloqueado';
      return h('li.' + estado + (id === sig ? '.siguiente' : ''),
        h('button', { type: 'button', onclick: () => { seleccionar(p); if (!ocupado) enfocar(p.montado ? p.foco() : p.grupo.position.clone(), 700, p.montado ? p.focoDir : new THREE.Vector3(0, 1, 1.1), p.montado ? p.dist : 60); } },
          h('span.am-num', listo ? '✓' : String(i + 1)), h('span.am-txt', p.nombre)));
    }));
    progresoBarra.style.width = (hecho.size / ORDEN.length) * 100 + '%';
    cuenta.textContent = `${hecho.size} de ${ORDEN.length}`;
  }

  function seleccionar(p) {
    if (seleccion && seleccion !== p) tintar(seleccion, TINTA);
    seleccion = p;
    if (!ocupado) tintar(p, SELECCION);
    pista.classList.add('oculta');
    if (!ocupado && !p.montado) animar(440, t => { p.salto = Math.sin(Math.PI * t) * 1.8; }, ease.lineal);
    mostrarFicha();
  }

  function mostrarFicha() {
    const p = seleccion;
    if (!p || clase) { ficha.hidden = true; return; }
    ficha.hidden = false;
    fTitulo.textContent = p.nombre;
    fTexto.textContent = p.texto;
    fCompra.replaceChildren(...p.compra.map(l => h('li', h('b', l[0]), ' ', l[1], h('span', HUD.resto(l)))));
    fCompra.hidden = !p.compra.length;
    const falta = faltan(p);
    fReq.hidden = !(falta.length && !p.montado);
    fReq.textContent = falta.length ? 'Antes: ' + nombres(falta) : '';
    btnAccion.hidden = !p.accion;
    btnAccion.disabled = ocupado || p.montado;
    btnAccion.textContent = p.montado ? '✓ Hecho' : p.accion || '';
    btnMal.textContent = p.botonMal || '¿Y si lo hago mal?';
    btnMal.hidden = !p.mal || p.montado;
    btnMal.disabled = ocupado || !puedeMal(p);
    btnMal.title = puedeMal(p) ? p.tituloMal : 'Primero: ' + nombres(falta);
  }
  function cerrarFicha() {
    if (seleccion) tintar(seleccion, TINTA);
    seleccion = null;
    ficha.hidden = true;
  }

  function pintarClase() {
    if (!clase) return;
    const n = hecho.size;
    const actual = ORDEN[n];
    const p = actual && P[actual];
    barraClase.classList.toggle('error', !!mensajeMal);
    if (mensajeMal) {
      cPaso.textContent = `Paso ${ORDEN.indexOf(mensajeMal.id) + 1} de ${ORDEN.length} · ${mensajeMal.botonMal ? 'Punto débil' : 'Así NO'}`;
      cTitulo.textContent = mensajeMal.tituloMal;
      cTexto.textContent = mensajeMal.textoMal;
      cCompra.textContent = '';
    } else if (p) {
      cPaso.textContent = `Paso ${n + 1} de ${ORDEN.length}`;
      cTitulo.textContent = p.nombre;
      cTexto.textContent = p.texto;
      cCompra.textContent = lineaCompra(p);
    } else {
      cPaso.textContent = 'Terminado';
      cTitulo.textContent = T.claseFinTitulo;
      cTexto.textContent = T.claseFinTexto;
      cCompra.textContent = '';
    }
    bAnt.disabled = ocupado || n === 0;
    bRep.disabled = ocupado || n === 0;
    bSig.disabled = ocupado;
    bSig.textContent = p ? 'Siguiente ▶' : 'Volver a empezar';
    bMal.textContent = (p && p.botonMal) || '¿Y si lo hago mal?';
    bMal.disabled = ocupado || !p || !puedeMal(p);
    bMal.hidden = !p || !p.mal;
    requestAnimationFrame(ajustar);
  }

  /* ---------- Modo clase ---------- */
  async function entrarClase() {
    if (!renderer) return;
    clase = true;
    escenaEl.classList.add('clase');
    cerrarFicha();
    pista.classList.add('oculta');
    try {
      if (escenaEl.requestFullscreen) { await escenaEl.requestFullscreen(); pantallaCompleta = true; }
    } catch (e) { pantallaCompleta = false; }
    let i = 0;
    while (i < ORDEN.length && hecho.has(ORDEN[i])) i++;
    if (i !== hecho.size) await construir(ORDEN.slice(0, i));
    mensajeMal = null;
    refrescar();
    ajustar();
    enfocarSiguiente();
    bSig.focus();
  }
  function salirClase() {
    if (!clase) return;
    clase = false;
    escenaEl.classList.remove('clase');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    pantallaCompleta = false;
    refrescar();
    ajustar();
  }
  function alCambiarPantalla() {
    if (!document.fullscreenElement && clase && pantallaCompleta) salirClase();
    else requestAnimationFrame(ajustar);
  }
  async function siguiente() {
    const id = siguienteId();
    if (ocupado) return;
    if (!id) { await construir([], true); return; }
    await intentar(P[id]);
  }
  async function anterior() {
    if (ocupado || !hecho.size) return;
    await construir(ORDEN.slice(0, hecho.size - 1));
    enfocarSiguiente();
  }
  async function repetir() {
    if (ocupado || !hecho.size) return;
    const n = hecho.size;
    await construir(ORDEN.slice(0, n - 1));
    await intentar(P[ORDEN[n - 1]]);
  }
  function malActual() {
    const id = siguienteId();
    if (id) verMal(P[id]);
  }
  function cambiarVelocidad() {
    velocidad.factor = velocidad.factor === 1 ? LENTO : 1;
    const lento = velocidad.factor !== 1;
    escenaEl.style.setProperty('--am-vel', velocidad.factor);
    bVel.textContent = 'Velocidad: ' + (lento ? 'lenta' : 'normal');
    bVel.setAttribute('aria-pressed', String(lento));
    bLento.setAttribute('aria-pressed', String(lento));
    bLento.textContent = lento ? 'Velocidad normal' : 'Más lento';
  }

  bSig.addEventListener('click', siguiente);
  bAnt.addEventListener('click', anterior);
  bRep.addEventListener('click', repetir);
  bMal.addEventListener('click', malActual);
  bVel.addEventListener('click', cambiarVelocidad);
  bSalir.addEventListener('click', salirClase);
  btnAccion.addEventListener('click', () => seleccion && intentar(seleccion));
  btnMal.addEventListener('click', () => seleccion && verMal(seleccion));

  function alTeclado(ev) {
    if (ev.target.closest && ev.target.closest('input, textarea, select')) return;
    if (!clase) { if (ev.key === 'Escape') cerrarFicha(); return; }
    const k = ev.key.toLowerCase();
    if (['arrowright', 'pagedown', ' '].includes(k)) { ev.preventDefault(); siguiente(); }
    else if (['arrowleft', 'pageup'].includes(k)) { ev.preventDefault(); anterior(); }
    else if (k === 'r') repetir();
    else if (k === 'm') malActual();
    else if (k === 'l') cambiarVelocidad();
    else if (k === 'escape') salirClase();
  }

  /* ---------- Ratón ---------- */
  const ray = new THREE.Raycaster(), raton = new THREE.Vector2();
  function piezaEn(ev) {
    const r = lienzo.getBoundingClientRect();
    raton.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(raton, camara);
    const objetivos = Object.values(P).flatMap(p => [p.grupo, p.fijo]);
    for (const hit of ray.intersectObjects(objetivos, true)) {
      let o = hit.object, visible = true;
      for (let q = o; q; q = q.parent) if (!q.visible) { visible = false; break; }
      if (!visible || o.userData.atraviesa) continue;
      while (o && !o.userData.id) o = o.parent;
      if (o) return P[o.userData.id];
    }
    return null;
  }
  let abajo = null;
  function alPulsar(ev) { abajo = { x: ev.clientX, y: ev.clientY }; }
  function alSoltar(ev) {
    if (!abajo || Math.hypot(ev.clientX - abajo.x, ev.clientY - abajo.y) > 6) { abajo = null; return; }
    abajo = null;
    if (clase) return;
    const p = piezaEn(ev);
    if (p) seleccionar(p); else cerrarFicha();
  }
  function alDobleClic(ev) { if (clase) return; const p = piezaEn(ev); if (p) intentar(p); }
  function alMover(ev) {
    if (ev.pointerType !== 'mouse') return;
    const p = piezaEn(ev);
    encima = p;
    lienzo.style.cursor = p ? 'pointer' : 'grab';
    if (p) {
      tooltip.textContent = p.nombre + (p.montado ? ' ✓' : '');
      tooltip.style.transform = `translate(${ev.offsetX + 16}px, ${ev.offsetY + 14}px)`;
      tooltip.classList.add('visible');
    } else tooltip.classList.remove('visible');
  }

  return {
    el,
    montado: iniciar,
    destruir() {
      generacion++;
      if (renderer) { cancelarAnimaciones(); velocidad.factor = 1; }
      temporizadores.forEach(clearTimeout); temporizadores.clear();
      clearTimeout(tAviso);
      removeEventListener('keydown', alTeclado);
      document.removeEventListener('fullscreenchange', alCambiarPantalla);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (ro) ro.disconnect();
      if (renderer) {
        renderer.setAnimationLoop(null);
        escena.traverse(o => { if (o.geometry) o.geometry.dispose(); });
        renderer.dispose();
        renderer.forceContextLoss();
      }
      if (controles) controles.dispose();
    }
  };
}
