// analizaMedio.js — «Analiza el medio» (1.º ASIR · PAR, Tema 2): práctica autocorregida, sin nota y sin guardar nada.
// Pinta los bloques que da practica/AnalizaMedio.js; usa los mismos estilos que «Analiza la red».
import { h } from '../util.js';
import { crearCaso, corregir } from '../practica/AnalizaMedio.js';

const CORTOS = ['Velocidad', 'Cables y fibra', 'Cableado estructurado', 'Certificador', 'Inalámbricas'];

export function vistaAnalizaMedio() {
  let caso, campos = {}, corregido = false;
  const cuerpo = h('div');
  const marcador = h('span.chip', 'Sin corregir');
  const numeroCaso = h('span.chip');

  function control(c) {
    if (c.tipo === 'lista') return h('select', { id: 'am-' + c.id }, h('option', { value: '' }, 'Elige…'), c.opciones.map(([v, t]) => h('option', { value: v }, t)));
    return h('input', { id: 'am-' + c.id, type: 'text', autocomplete: 'off', spellcheck: 'false', style: `width:${c.tipo === 'numero' ? 10 : c.ancho || 14}ch`, inputmode: c.tipo === 'numero' ? 'decimal' : 'text' });
  }
  function campo(c) {
    const ctl = control(c), pista = h('p.an-pista', { hidden: true });
    campos[c.id] = { control: ctl, pista };
    return h('div.an-campo', { 'data-id': c.id }, h('label', { for: 'am-' + c.id }, c.etiqueta), ctl,
      c.ayuda || (c.tipo === 'numero' && c.muestra.includes(' ')) ? h('small', c.ayuda || 'En ' + c.muestra.split(' ').slice(1).join(' ')) : null, pista);
  }
  function tabla(inf) {
    return h('div.am-informe',
      h('div.am-informe-cab', h('strong', inf.titulo), h('span', inf.norma)),
      h('table', h('thead', h('tr', h('th', 'Prueba'), h('th', 'Medido'), h('th', 'Límite'))),
        h('tbody', inf.filas.map(f => h('tr', h('td', f[0]), h('td', f[1]), h('td', f[2]))))),
      inf.filas.length === 1 ? h('p.nota', 'El certificador se detiene: con el mapa de cableado mal no sigue midiendo.') : null);
  }

  function pintar() {
    campos = {}; corregido = false;
    marcador.textContent = 'Sin corregir'; marcador.className = 'chip';
    cuerpo.replaceChildren(...caso.bloques.map((b, n) => h('section.tarjeta.an-bloque', { id: 'am-bloque-' + (n + 1) },
      h('h2', h('span.etiqueta', `Bloque ${n + 1} · ${b.seccion}`), ' ' + b.titulo, h('span.chip.an-nota', { hidden: true })),
      b.texto ? h('p', b.texto) : null,
      ...b.grupos.flatMap(g => [
        g.texto ? h('p', g.texto) : null,
        g.informe ? tabla(g.informe) : null,
        h('div.an-campos', g.campos.map(campo)),
      ]),
      n === 4 ? h('p.an-enlace', 'Para repasar la idea con un dibujo: ', h('a', { href: 'figuras/wifi.html' }, 'La Wi‑Fi por dentro →'), ' (es de SMR: allí los canales se dibujan de 22 MHz).') : null,
      n === 1 ? h('p.an-enlace', h('a', { href: 'figuras/fibra-optica.html' }, 'Ver la figura: Fibra óptica por dentro →')) : null)));
  }

  function nuevo(semilla) {
    caso = crearCaso(semilla ?? (1000 + Math.floor(Math.random() * 9000)));
    numeroCaso.textContent = 'Caso ' + caso.semilla;
    pintar();
  }

  function comprobar() {
    const resp = Object.fromEntries(Object.entries(campos).map(([id, c]) => [id, c.control.value]));
    const r = corregir(caso, resp);
    for (const x of r.lista) {
      const c = campos[x.id], caja = c.control.closest('.an-campo');
      caja.classList.toggle('ok', x.ok); caja.classList.toggle('ko', !x.ok);
      c.pista.hidden = false;
      c.pista.replaceChildren(x.ok ? 'Bien. ' : h('strong', 'Correcto: ' + x.correcta + '. '), x.porque);
    }
    for (const b of cuerpo.querySelectorAll('.an-bloque')) {
      const todos = b.querySelectorAll('.an-campo').length, bien = b.querySelectorAll('.an-campo.ok').length, nota = b.querySelector('.an-nota');
      nota.hidden = false; nota.textContent = `${bien} de ${todos}`; nota.classList.toggle('ok', bien === todos);
    }
    corregido = true;
    marcador.textContent = `${r.aciertos} de ${r.total}`;
    marcador.className = 'chip ' + (r.aciertos === r.total ? 'ok' : '');
    marcador.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const el = h('section.an',
    h('div.inicio-cab',
      h('span.etiqueta', '1.º ASIR · Planificación y administración de redes · Tema 2'),
      h('h1', 'Analiza el medio'),
      h('p.lead', 'Cinco bloques de las secciones 1 a 4 del tema, con un caso distinto cada vez: velocidades, cables y fibra, cableado estructurado, informes de un certificador y redes inalámbricas. Haz solo los bloques que quieras repasar: al corregir verás la nota de cada uno, la respuesta y el porqué. No se guarda nada y no tiene nota.'),
      h('p.nota', 'Los cables directos, cruzados y de consola (sección 3) se practican en «Haz el latiguillo», en su bloque para ASIR.'),
      h('nav.an-indice', { 'aria-label': 'Bloques' }, CORTOS.map((t, i) => h('button.btn.sec.peq', { type: 'button', onclick: () => document.getElementById('am-bloque-' + (i + 1)).scrollIntoView({ behavior: 'smooth' }) }, `${i + 1} · ${t}`)))),
    h('div.an-barra', numeroCaso, marcador,
      h('button.btn', { type: 'button', onclick: comprobar }, 'Corregir'),
      h('button.btn.sec', { type: 'button', onclick: () => { if (!corregido && Object.values(campos).some(c => c.control.value) && !confirm('Vas a cambiar de caso sin corregir este. ¿Seguro?')) return; nuevo(); window.scrollTo({ top: 0 }); } }, 'Otro caso')),
    cuerpo,
    h('div.an-barra', h('button.btn', { type: 'button', onclick: comprobar }, 'Corregir')));
  const pedida = Number(new URLSearchParams(location.hash.split('?')[1] || '').get('caso'));
  nuevo(Number.isInteger(pedida) && pedida > 0 ? pedida : undefined);
  return { el };
}
