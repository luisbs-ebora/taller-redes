// disenio.js — «Diseña la red de una empresa» en modo práctica o examen.
// Práctica: el caso se genera y se corrige en el navegador. Examen: lo hace el Apps Script.
import { h, progreso } from '../util.js';
import { llamar, scriptConfigurado, motor } from '../api.js';
import { EXAMEN_ACTIVO } from '../config.js';

const miles = n => { const r = Math.round(n * 100) / 100; return (r % 1 ? r.toFixed(2).replace('.', ',') : String(r)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
const euros = n => miles(n) + ' €';
const PESTANAS = [['encargo', '1 · Encargo'], ['tipos', '2 · Tipos de red'], ['plano', '3 · Plano'], ['compra', '4 · Compra'], ['averias', '5 · Averías']];
const SWITCHES = ['SW-08', 'SW-16', 'SW-24', 'SW-24P'];
const MEDIOS = [['', 'Sin enlace'], ['cobre', 'Par trenzado'], ['fibra', 'Fibra óptica']];
const POS = { A: [170, 262], B: [505, 165], C: [505, 352], R: [125, 50] };

export async function vistaDisenio(modo) {
  const examen = modo === 'examen';
  const clave = `sesion:red:${modo}`;
  let s = progreso.get(clave) || null;   // { casoId, caso, resp, pestana, fase, codigo, limite, resultado }
  const guardar = () => progreso.set(clave, s);
  const raiz = h('div.disenio');

  // ---------- Reloj del examen ----------
  const reloj = h('div.reloj', { role: 'timer' });
  let enviando = false;
  const restante = () => s && s.limite ? Date.parse(s.limite) - (Date.now() + (s.desfase || 0)) : null;
  function tic() {
    const ms = restante();
    if (ms === null || !s || s.fase !== 'trabajo') { reloj.hidden = true; return; }
    reloj.hidden = false;
    const seg = Math.max(0, Math.ceil(ms / 1000));
    reloj.textContent = `Tiempo: ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
    reloj.classList.toggle('poco', seg <= 300);
    if (seg === 0 && !enviando) entregar(true);
  }
  const intervalo = examen ? setInterval(tic, 1000) : null;

  function cabecera(sub) {
    return h('div.ej-cab',
      h('div', h('span.etiqueta', examen ? 'Examen' : 'Práctica'), h('h1', examen ? (s && s.caso && s.caso.titulo) || 'Examen práctico' : 'Diseña la red de una empresa'), sub ? h('p.lead', sub) : null),
      examen && s && s.fase === 'trabajo' ? reloj : null);
  }

  // ---------- Inicio ----------
  function pintarInicio(msg) {
    const aviso = h('div.mensaje.error', { role: 'alert', hidden: !msg }, msg || '');
    const fallo = e => { aviso.hidden = false; aviso.textContent = e.message; boton.disabled = false; };
    let boton;
    if (examen && !EXAMEN_ACTIVO) {
      raiz.replaceChildren(cabecera(), h('div.mensaje', 'El examen todavía no está abierto. Mientras tanto, puedes hacer la práctica todas las veces que quieras.'),
        h('div.fila', { style: 'margin-top:16px' }, h('a.btn.azul', { href: '#/practica' }, 'Ir a la práctica')));
      return;
    }
    if (examen) {
      const codigo = h('input.campo', { type: 'text', autocomplete: 'off', maxlength: 12, placeholder: 'Tu código', 'aria-label': 'Código de examen', style: 'text-transform:uppercase;max-width:220px' });
      boton = h('button.btn.azul', { type: 'button' }, 'Empezar el examen');
      boton.addEventListener('click', async () => {
        const c = codigo.value.trim().toUpperCase();
        if (!c) { fallo(new Error('Escribe tu código.')); return; }
        boton.disabled = true;
        try {
          const r = await llamar('examen-empezar', { codigo: c });
          s = { casoId: r.casoId, caso: r.caso, codigo: c, alumno: r.alumno, resp: respVacia(r.caso), pestana: 'encargo', fase: 'trabajo', limite: r.limite, desfase: r.ahora ? Date.parse(r.ahora) - Date.now() : 0 };
          if (r.reanudado && progreso.get(clave) && progreso.get(clave).casoId === r.casoId) s.resp = progreso.get(clave).resp;
          guardar(); pintar();
        } catch (e) { fallo(e); }
      });
      raiz.replaceChildren(cabecera('Diseña la red de una empresa: tipos de red, plano, compra y averías. Tienes un solo intento.'),
        h('div.tarjeta', { style: 'padding:20px;max-width:560px' },
          h('p', 'Escribe el código que te ha dado el profesor. Al empezar, corre el tiempo. Si se cierra la página, vuelve a entrar con el mismo código: recuperas tu examen.'),
          h('div.fila', codigo, boton), aviso));
      if (!scriptConfigurado()) fallo(new Error('La web aún no está conectada con la hoja de notas. Avisa al profesor.'));
      return;
    }
    boton = h('button.btn.azul', { type: 'button' }, 'Empezar con una empresa');
    boton.addEventListener('click', async () => {
      boton.disabled = true;
      try {
        const r = await llamar('practica-empezar', { ejercicio: 'red-practica' });
        s = { casoId: r.casoId, caso: r.caso, resp: respVacia(r.caso), pestana: 'encargo', fase: 'trabajo' };
        guardar(); pintar();
      } catch (e) { fallo(e); }
    });
    raiz.replaceChildren(cabecera('Te toca una empresa con tres sedes. Clasificas sus redes, diseñas la red sobre el plano, haces la compra con el catálogo de InfoTajo y pruebas qué pasa si algo se avería. Al final, la web te corrige y te dice qué mejorar.'),
      h('div.tarjeta', { style: 'padding:20px;max-width:640px' },
        h('p', 'Es como el proyecto de Cerámicas Ribera del Tajo, pero con otras empresas. No cuenta para nota: puedes repetir todas las veces que quieras.'),
        h('div.fila', boton, h('a.btn.sec', { href: '#/animado' }, 'Ver la red de Cerámicas paso a paso')), aviso));
  }

  function respVacia(caso) {
    const sedes = {};
    caso.sedes.forEach(x => { sedes[x.id] = { cuenta: '', switch: '', armario: '', aps: x.principal ? 0 : undefined }; });
    if (caso.remota) sedes.R = { cuenta: '', switch: '' };
    return { tipos: caso.tipos.map(() => ['', '', '']), sedes, enlaces: {}, compra: {}, puntoDebil: '' };
  }

  // ---------- Trabajo ----------
  let M = null;
  async function pintar() {
    if (!s) return pintarInicio();
    if (s.fase === 'resultado') return pintarResultado();
    if (!M) M = (await motor()).M;
    const pest = s.pestana || 'encargo';
    const tabs = h('nav.dz-tabs', { role: 'tablist' }, PESTANAS.map(([id, txt]) =>
      h('button', { type: 'button', role: 'tab', 'aria-selected': String(id === pest), onclick: () => { s.pestana = id; guardar(); pintar(); } }, txt)));
    const cuerpo = { encargo: pEncargo, tipos: pTipos, plano: pPlano, compra: pCompra, averias: pAverias }[pest]();
    const total = M.totalCompra(s.caso, s.resp).total;
    const pasa = total > s.caso.presupuesto;
    const i = PESTANAS.findIndex(p => p[0] === pest);
    const sig = PESTANAS[i + 1];
    const pie = h('div.dz-pie',
      h('div.dz-total' + (pasa ? '.pasa' : ''), h('span', 'Compra'), h('b', euros(total)), h('small', ' de ' + euros(s.caso.presupuesto))),
      h('div.fila',
        i > 0 ? h('button.btn.sec', { type: 'button', onclick: () => { s.pestana = PESTANAS[i - 1][0]; guardar(); pintar(); } }, '◀ Anterior') : null,
        sig ? h('button.btn.azul', { type: 'button', onclick: () => { s.pestana = sig[0]; guardar(); pintar(); window.scrollTo(0, 0); } }, 'Siguiente ▶')
          : h('button.btn.azul', { type: 'button', onclick: () => confirmar() }, examen ? 'Entregar el examen' : 'Comprobar mi diseño')));
    raiz.replaceChildren(cabecera(), tabs, h('div.dz-cuerpo', cuerpo), pie);
    tic();
  }

  const C = () => s.caso;
  const nombre = id => id === 'R' ? C().remota.nombre : C().sedes.find(x => x.id === id).nombre;
  const cambio = (fn, repintar = false) => ev => { fn(ev.target.value, ev); guardar(); if (repintar) pintar(); else actualizarTotal(); };
  function actualizarTotal() {
    const t = M.totalCompra(s.caso, s.resp).total;
    const el = raiz.querySelector('.dz-total');
    if (!el) return;
    el.querySelector('b').textContent = euros(t);
    el.classList.toggle('pasa', t > s.caso.presupuesto);
    raiz.querySelectorAll('[data-subtotal]').forEach(x => { const cod = x.dataset.subtotal; const n = cantidad(cod); x.textContent = n ? euros(n * M.POR_COD[cod].precio) : ''; });
  }

  // 1. Encargo
  function pEncargo() {
    const c = C(), A = c.sedes[0];
    const filas = c.sedes.map(x => h('tr', h('th', x.nombre + (x.principal ? ' (principal)' : '')), h('td',
      `${x.puestos} puestos (ordenador de sobremesa)`,
      x.existentes ? ` · ${x.existentes.n} ${x.existentes.texto}, que ya tiene la empresa: solo hay que conectarlos por cable` : '',
      x.principal ? ` · 1 servidor de archivos · 1 impresora multifunción en red · Wi‑Fi en toda la sede (${x.m2} m²) para ${x.portatiles} portátiles de los comerciales (hay que comprarlos) y las visitas` : '')));
    if (c.remota) filas.push(h('tr', h('th', c.remota.nombre), h('td', `${c.remota.puestos} puestos (ordenador de sobremesa). Está en otra ciudad: tiene que abrir los archivos del servidor a través de Internet.`)));
    return h('div.dz-encargo',
      h('div.tarjeta.encargo',
        h('span.etiqueta', 'El cliente'), h('h2', { style: 'font-size:26px;margin:4px 0 6px' }, c.empresa),
        h('p', `${c.empresa} ${c.actividad}. Tiene tres sedes en ${c.recinto}${c.remota ? ' y otra en ' + c.remota.nombre.replace(/^\w+ de /, '') : ''}. No tiene ningún equipo informático: hay que comprarlo todo, ordenadores incluidos.`)),
      h('h3', 'Qué hay que conectar'),
      h('div.tabla', h('table', h('tbody', filas))),
      h('h3', 'Distancias entre sedes'),
      h('div.tabla', h('table', h('thead', h('tr', h('th', 'Tramo'), h('th', 'Distancia'))), h('tbody', c.tramos.map(t => h('tr', h('td', `${nombre(t.a)} → ${nombre(t.b)}`), h('td', t.m + ' m')))))),
      h('h3', 'Lo que exige la dirección'),
      h('ol.dz-req',
        h('li', h('b', 'R1. '), `Una avería en el switch de «${nombre(c.r1.averia)}» no puede dejar sin red a «${nombre(c.r1.protegida)}».`),
        h('li', h('b', 'R2. '), `Wi‑Fi en toda la sede «${A.nombre}» para los portátiles y las visitas.`),
        h('li', h('b', 'R3. '), `Los datos se guardan en un servidor central en «${A.nombre}», en un lugar protegido.`),
        h('li', h('b', 'R4. '), 'Todas las sedes conectadas entre sí, respetando el límite de 100 m del par trenzado.'),
        h('li', h('b', 'R5. '), `No superar los ${euros(c.presupuesto)}, IVA incluido.`)),
      h('div.nota',
        h('b', 'Datos técnicos'),
        h('ul',
          h('li', 'Un cable de par trenzado no debe superar los 100 m en un mismo tramo.'),
          h('li', 'Dentro de las sedes, calcula 25 m de cable por cada toma de red de pared.'),
          h('li', `Cada punto de acceso cubre unos ${c.m2PorAp} m².`),
          h('li', 'Internet: el operador pone la fibra y su router (con 4 puertos) en la sede principal' + (c.remota ? ' y en ' + c.remota.nombre : '') + '. No se compra.'),
          h('li', 'Obra y mano de obra (zanjas, canaletas, instalación) las paga la empresa aparte: tú presupuestas solo equipos y material.'))));
  }

  // 2. Tipos de red
  function pTipos() {
    const c = C();
    const sel = (opciones, valor, i, k, etiqueta) => h('select.campo', { 'aria-label': etiqueta, onchange: cambio(v => { s.resp.tipos[i][k] = v; }) },
      h('option', { value: '' }, '—'), opciones.map(o => h('option', { value: o, selected: valor === o }, o)));
    return h('div',
      h('p.lead.peq', 'Clasifica cada red según los tres criterios: alcance, medio y propiedad.'),
      h('div.tabla', h('table.dz-tipos',
        h('thead', h('tr', h('th', 'Red'), h('th', 'Alcance'), h('th', 'Medio'), h('th', 'Propiedad'))),
        h('tbody', c.tipos.map((t, i) => {
          const r = s.resp.tipos[i] || ['', '', ''];
          return h('tr', h('td', t.texto),
            h('td', sel(c.opciones.alcance, r[0], i, 0, 'Alcance')),
            h('td', sel(c.opciones.medio, r[1], i, 1, 'Medio')),
            h('td', sel(c.opciones.propiedad, r[2], i, 2, 'Propiedad')));
        })))));
  }

  // Plano en SVG (se usa en Plano y en Averías)
  function plano(caidas) {
    const c = C(), NS = 'http://www.w3.org/2000/svg';
    const el = (tag, at = {}, ...hijos) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); hijos.forEach(x => e.append(x)); return e; };
    const svg = el('svg', { viewBox: '0 0 680 420', class: 'dz-plano', role: 'img', 'aria-label': 'Plano de las sedes y sus enlaces' });
    svg.append(el('rect', { x: 20, y: 100, width: 654, height: 312, rx: 18, class: 'recinto' }));
    svg.append(el('text', { x: 660, y: 404, class: 'recinto-txt', 'text-anchor': 'end' }, c.recinto));
    const llega = caidas ? M.alcanzables(c, s.resp, caidas) : null;
    c.tramos.forEach(t => {
      const [x1, y1] = POS[t.a], [x2, y2] = POS[t.b];
      const medio = s.resp.enlaces[t.id] || '';
      const malo = medio === 'cobre' && t.m > M.LIMITE_COBRE;
      svg.append(el('line', { x1, y1, x2, y2, class: 'enlace ' + (medio || 'nada') + (malo ? ' malo' : '') }));
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      svg.append(el('rect', { x: mx - 34, y: my - 13, width: 68, height: 26, rx: 13, class: 'dist ' + (medio || 'nada') }));
      svg.append(el('text', { x: mx, y: my + 5, 'text-anchor': 'middle', class: 'dist-txt' }, (malo ? '✗ ' : '') + t.m + ' m'));
    });
    if (c.remota) {
      svg.append(el('path', { d: 'M 125 79 C 140 130, 160 180, 170 222', class: 'wan' }));
      svg.append(el('text', { x: 162, y: 140, class: 'wan-txt' }, 'Internet'));
    }
    const ids = c.sedes.map(x => x.id).concat(c.remota ? ['R'] : []);
    ids.forEach(id => {
      const [x, y] = POS[id], d = s.resp.sedes[id] || {};
      let estado = '';
      if (caidas) estado = caidas[id] ? 'caida' : id === 'R' ? (llega.A ? 'ok' : 'sin') : llega[id] ? 'ok' : 'sin';
      const g = el('g', { class: 'sede ' + estado + (id === 'A' ? ' principal' : '') });
      const w = id === 'R' ? 150 : 170, hgt = id === 'R' ? 58 : 76;
      g.append(el('rect', { x: x - w / 2, y: y - hgt / 2, width: w, height: hgt, rx: 12 }));
      g.append(el('text', { x, y: y - hgt / 2 + 22, 'text-anchor': 'middle', class: 'nom' }, nombre(id)));
      const sw = d.switch ? `${d.switch} · ${M.POR_COD[d.switch].puertos} puertos` : id === 'R' ? 'Router (4 puertos)' : 'Sin switch';
      if (!(id === 'R' && caidas)) g.append(el('text', { x, y: y - hgt / 2 + 42, 'text-anchor': 'middle', class: 'det' }, sw));
      if (id !== 'R') g.append(el('text', { x, y: y - hgt / 2 + 60, 'text-anchor': 'middle', class: 'det' },
        caidas ? (caidas[id] ? '¡Switch averiado!' : estado === 'ok' ? 'Con red ✓' : 'Sin red ✗') : `Cuenta: ${d.cuenta || '?'}${id === 'A' ? ` · AP: ${d.aps || 0}` : ''}`));
      else if (caidas) g.append(el('text', { x, y: y - hgt / 2 + 42, 'text-anchor': 'middle', class: 'det' }, estado === 'ok' ? 'Llega al servidor ✓' : 'Sin servidor ✗'));
      svg.append(g);
    });
    return svg;
  }

  // 3. Plano
  function pPlano() {
    const c = C();
    const ids = c.sedes.map(x => x.id).concat(c.remota ? ['R'] : []);
    const fichas = ids.map(id => {
      const d = s.resp.sedes[id];
      const campos = [
        h('label.dz-campo', h('span', 'Aparatos con cable que van al switch'),
          h('input.campo', { type: 'number', min: 0, max: 60, value: d.cuenta, oninput: cambio(v => { d.cuenta = v; }), onchange: () => pintar() })),
        h('label.dz-campo', h('span', 'Switch'),
          h('select.campo', { onchange: cambio(v => { d.switch = v; }, true) },
            h('option', { value: '' }, id === 'R' ? 'Ninguno (al router del operador, 4 puertos)' : 'Ninguno'),
            SWITCHES.map(k => h('option', { value: k, selected: d.switch === k }, `${k} · ${M.POR_COD[k].nombre} · ${euros(M.POR_COD[k].precio)}`))))];
      if (id !== 'R') campos.push(h('label.dz-campo', h('span', 'Armario'),
        h('select.campo', { onchange: cambio(v => { d.armario = v; }, true) },
          h('option', { value: '' }, 'Ninguno'),
          ['AR-01', 'AR-02'].map(k => h('option', { value: k, selected: d.armario === k }, `${k} · ${M.POR_COD[k].nombre} · ${euros(M.POR_COD[k].precio)}`)))));
      if (id === 'A') campos.push(h('label.dz-campo', h('span', 'Puntos de acceso Wi‑Fi (WF-01)'),
        h('input.campo', { type: 'number', min: 0, max: 6, value: d.aps || 0, oninput: cambio(v => { d.aps = Math.max(0, Number(v) || 0); }), onchange: () => pintar() })));
      return h('fieldset.dz-sede', h('legend', nombre(id)), campos);
    });
    const enlaces = h('fieldset.dz-sede', h('legend', 'Enlaces entre sedes'),
      c.tramos.map(t => h('label.dz-campo', h('span', `${nombre(t.a)} ↔ ${nombre(t.b)} · ${t.m} m`),
        h('select.campo', { onchange: cambio(v => { if (v) s.resp.enlaces[t.id] = v; else delete s.resp.enlaces[t.id]; }, true) },
          MEDIOS.map(([v, txt]) => h('option', { value: v, selected: (s.resp.enlaces[t.id] || '') === v }, txt))))),
      h('p.dz-ayuda', 'No hace falta unir todas con todas: basta con que cada sede llegue a la principal.'));
    return h('div.dz-plano-grid',
      h('div', plano(), h('p.dz-leyenda', h('span.l-cobre', 'Par trenzado'), h('span.l-fibra', 'Fibra óptica'), h('span.l-nada', 'Sin enlace'))),
      h('div.dz-formas', h('p.dz-ayuda', 'Cuenta en cada sede todo lo que va por cable a su switch (también lo que ya tiene la empresa y los enlaces con otras sedes) y elige un switch con puertos suficientes. Los switches, armarios y puntos de acceso que elijas aquí se añaden solos a la compra.'), fichas, enlaces));
  }

  // 4. Compra
  function cantidad(cod) {
    const del = M.compraDelPlano(s.caso, s.resp);
    return (del[cod] || 0) + (Number(s.resp.compra[cod]) || 0);
  }
  function pCompra() {
    const del = M.compraDelPlano(s.caso, s.resp);
    const grupos = {};
    s.caso.catalogo.forEach(p => { (grupos[p.grupo] = grupos[p.grupo] || []).push(p); });
    return h('div',
      h('p.lead.peq', 'Elige cuántas unidades compras de cada producto. Lo que ya has elegido en el plano (switches, armarios y puntos de acceso) aparece marcado y se cambia allí.'),
      Object.entries(grupos).map(([g, lista]) => h('section.dz-grupo', h('h3', g),
        h('div.tabla', h('table.dz-cat', h('tbody', lista.map(p => {
          const plano = del[p.cod] || 0;
          const enPlano = ['SW-08', 'SW-16', 'SW-24', 'SW-24P', 'AR-01', 'AR-02', 'WF-01'].includes(p.cod);
          const n = cantidad(p.cod);
          return h('tr' + (n ? '.elegido' : ''),
            h('td.cod', p.cod),
            h('td', h('b', p.nombre), h('small', p.det)),
            h('td.precio', euros(p.precio) + (p.porMetro ? '/m' : '')),
            h('td.cant', enPlano
              ? h('span.chip', plano ? `${plano} · del plano` : 'en el plano')
              : h('input.campo', { type: 'number', min: 0, max: 2000, value: s.resp.compra[p.cod] || '', 'aria-label': 'Cantidad de ' + p.cod + (p.porMetro ? ' en metros' : ''), placeholder: p.porMetro ? 'metros' : '0',
                oninput: cambio(v => { const k = Math.max(0, Math.floor(Number(v) || 0)); if (k) s.resp.compra[p.cod] = k; else delete s.resp.compra[p.cod]; }) })),
            h('td.sub', { 'data-subtotal': p.cod }, n ? euros(n * p.precio) : ''));
        })))))));
  }

  // 5. Averías
  let caidas = {};
  function pAverias() {
    const c = C();
    const botones = c.sedes.map(x => h('button.btn.sec.peq', { type: 'button', 'aria-pressed': String(!!caidas[x.id]), onclick: () => { caidas = caidas[x.id] ? {} : { [x.id]: true }; pintar(); } },
      caidas[x.id] ? `Arreglar el switch de «${x.nombre}»` : `Averiar el switch de «${x.nombre}»`));
    return h('div.dz-plano-grid',
      h('div', plano(caidas)),
      h('div.dz-formas',
        h('p.dz-ayuda', 'Rompe el switch de una sede y mira en el plano qué se queda sin red con TU diseño. Comprueba así el requisito R1.'),
        h('div.dz-botones', botones),
        h('div.nota', h('b', 'R1. '), `Una avería en el switch de «${nombre(c.r1.averia)}» no puede dejar sin red a «${nombre(c.r1.protegida)}».`),
        h('label.dz-campo', h('span', '¿Qué switch es el punto débil, el que deja sin red a más equipos si se avería?'),
          h('select.campo', { onchange: cambio(v => { s.resp.puntoDebil = v; }) },
            h('option', { value: '' }, '—'), c.sedes.map(x => h('option', { value: x.id, selected: s.resp.puntoDebil === x.id }, `El switch de «${x.nombre}»`))))));
  }

  // ---------- Entregar ----------
  function confirmar() {
    const faltan = [];
    if (s.resp.tipos.some(t => t.some(x => !x))) faltan.push('Tipos de red sin terminar');
    if (Object.keys(s.resp.enlaces).length === 0) faltan.push('No hay enlaces entre sedes');
    if (!Object.keys(s.resp.compra).length) faltan.push('La compra está vacía');
    if (!s.resp.puntoDebil) faltan.push('Falta el punto débil (Averías)');
    const dlg = h('dialog.dz-dialogo',
      h('h2', examen ? '¿Entregar el examen?' : '¿Comprobar tu diseño?'),
      faltan.length ? h('div', h('p', 'Te falta:'), h('ul', faltan.map(f => h('li', f)))) : h('p', 'Has rellenado todas las partes.'),
      h('p', examen ? 'Después ya no podrás cambiar nada.' : 'Podrás volver a tu diseño y corregirlo.'),
      h('div.fila', h('button.btn.azul', { type: 'button', onclick: () => { dlg.close(); dlg.remove(); entregar(false); } }, examen ? 'Entregar' : 'Comprobar'),
        h('button.btn.sec', { type: 'button', onclick: () => { dlg.close(); dlg.remove(); } }, 'Seguir trabajando')));
    document.body.append(dlg); dlg.showModal();
  }
  async function entregar(auto) {
    if (enviando || !s) return;
    enviando = true;
    try {
      if (examen) {
        const r = await llamar('examen-entregar', { codigo: s.codigo, casoId: s.casoId, respuesta: s.resp });
        s.fase = 'resultado'; s.resultado = r; s.auto = auto;
      } else {
        const r = await llamar('practica-entregar', { casoId: s.casoId, respuesta: s.resp });
        s.fase = 'resultado'; s.resultado = r.resultado; s.ejemplo = r.solucionEjemplo;
      }
      guardar(); pintar(); window.scrollTo(0, 0);
    } catch (e) {
      const m = h('div.mensaje.error', { role: 'alert', style: 'margin-top:12px' }, e.message);
      raiz.append(m);
    } finally { enviando = false; }
  }

  // ---------- Resultado ----------
  function pintarResultado() {
    if (examen) {
      const r = s.resultado || {};
      raiz.replaceChildren(...[cabecera(),
        h('div.mensaje.ok', s.auto ? 'Se acabó el tiempo: tu examen se ha entregado solo.' : 'Examen entregado.'),
        r.nota != null ? h('div.tarjeta.dz-nota', { style: 'margin-top:16px' }, h('span', 'Tu nota'), h('b', String(r.nota).replace('.', ',')), h('small', 'sobre 10')) : h('p', 'El profesor te dará la nota.'),
        r.resultado ? detalle(r.resultado) : null].filter(Boolean));
      progreso.set(clave, undefined);
      return;
    }
    const r = s.resultado;
    raiz.replaceChildren(cabecera(),
      h('div.dz-resumen',
        h('div.tarjeta.dz-nota', h('span', 'Nota de la práctica'), h('b', String(r.nota).replace('.', ',')), h('small', 'sobre 10')),
        h('div.fila',
          h('button.btn.azul', { type: 'button', onclick: () => { s.fase = 'trabajo'; guardar(); pintar(); } }, 'Volver a mi diseño y corregirlo'),
          h('button.btn.sec', { type: 'button', onclick: () => verEjemplo() }, 'Ver una solución de ejemplo'),
          h('button.btn.sec', { type: 'button', onclick: () => { s = null; progreso.set(clave, undefined); pintarInicio(); } }, 'Otra empresa'))),
      detalle(r), h('div#dz-ejemplo'));
  }
  function detalle(r) {
    return h('div.dz-detalle', Object.keys(r.maximos).map(b => {
      const items = r.detalle.filter(d => d.bloque === b);
      const pct = r.maximos[b] ? (r.bloques[b] / r.maximos[b]) * 100 : 0;
      return h('section.tarjeta',
        h('header', h('h3', r.nombres[b]), h('span.dz-pts', `${miles(r.bloques[b])} / ${miles(r.maximos[b])}`)),
        h('div.barra', h('i', { style: `width:${pct}%` })),
        h('ul', items.map(d => h('li.' + (d.ok ? 'ok' : d.parcial ? 'medio' : 'ko'),
          h('span.ic', d.ok ? '✓' : d.parcial ? '½' : '✗'), h('div', h('span', d.texto), d.ayuda ? h('small', d.ayuda) : null)))));
    }));
  }
  function verEjemplo() {
    const e = s.ejemplo; if (!e) return;
    const c = C(), r = e.respuesta;
    const lineas = Object.entries(e.lineas).map(([cod, n]) => {
      const p = s.caso.catalogo.find(x => x.cod === cod);
      return h('tr', h('td.cod', cod), h('td', p.nombre), h('td', String(n) + (p.porMetro ? ' m' : '')), h('td', euros(n * p.precio)));
    });
    const caja = raiz.querySelector('#dz-ejemplo');
    caja.replaceChildren(h('section.tarjeta', { style: 'padding:18px 20px;margin-top:20px' },
      h('h2', { style: 'font-size:24px' }, 'Una solución de ejemplo'),
      h('p', 'Hay otras igual de válidas. Esta une cada sede directamente con la principal (estrella extendida), usa fibra en los tramos de más de 100 m y pone un SW-24P en la principal para alimentar los puntos de acceso por PoE.'),
      h('ul', c.sedes.map(x => h('li', h('b', x.nombre + ': '), `${r.sedes[x.id].cuenta} aparatos con cable → ${r.sedes[x.id].switch}`, x.principal ? ` · ${r.sedes[x.id].aps} puntos de acceso` : '')),
        c.remota ? h('li', h('b', c.remota.nombre + ': '), r.sedes.R.switch ? `${c.remota.puestos} puestos → ${r.sedes.R.switch}` : `${c.remota.puestos} puestos → al router del operador`) : null,
        c.tramos.filter(t => r.enlaces[t.id]).map(t => h('li', h('b', `${nombre(t.a)} ↔ ${nombre(t.b)}: `), r.enlaces[t.id] === 'fibra' ? `fibra óptica (${t.m} m)` : `par trenzado (${t.m} m)`))),
      h('div.tabla', h('table', h('thead', h('tr', h('th', 'Código'), h('th', 'Producto'), h('th', 'Cantidad'), h('th', 'Total'))), h('tbody', lineas,
        h('tr', h('td'), h('th', 'Total'), h('td'), h('th', euros(e.total))))))));
    caja.scrollIntoView({ behavior: 'smooth' });
  }

  // ---------- Arranque ----------
  if (s && s.fase === 'resultado' && examen) s = null;
  if (s && examen && restante() !== null && restante() <= 0 && s.fase === 'trabajo') { /* se entregará en el primer tic */ }
  await pintar();
  return { el: raiz, destruir() { if (intervalo) clearInterval(intervalo); } };
}
