// analiza.js — «Analiza la red» (1.º ASIR · PAR, Tema 1): práctica autocorregida, sin nota y sin guardar nada.
import { h } from '../util.js';
import { crearCaso, corregir, NOMBRES_CAPA } from '../practica/Analiza.js';

const hex2 = b => b.toString(16).toUpperCase().padStart(2, '0');

// Dibujo de la red: el router arriba y, bajo cada interfaz, su switch o su hub con los equipos.
function dibujoRed(red) {
  const PASO = 34, cajas = [], lineas = [];
  let x = 20;
  const columnas = red.interfaces.map(i => { const hojas = i.pcs + i.hub, ancho = Math.max(hojas, 2) * PASO + 24, c = { i, x, ancho }; x += ancho + 18; return c; });
  const total = x + 2, cx = total / 2;
  const caja = (px, py, w, alto, clase, texto) => cajas.push(`<rect class="an-${clase}" x="${px - w / 2}" y="${py - alto / 2}" width="${w}" height="${alto}" rx="${clase === 'pc' ? 3 : 7}"/>` + (texto ? `<text x="${px}" y="${py + 4}" text-anchor="middle">${texto}</text>` : ''));
  const linea = (x1, y1, x2, y2) => lineas.push(`<path d="M${x1} ${y1}L${x2} ${y2}"/>`);
  let sw = 0, hub = 0;
  columnas.forEach((c, k) => {
    const medio = c.x + c.ancho / 2, primero = medio - ((c.i.pcs + c.i.hub - 1) * PASO) / 2;
    linea(cx + (k - (columnas.length - 1) / 2) * 26, 44, medio, 88);
    caja(medio, 104, 74, 30, c.i.tipo, c.i.tipo === 'switch' ? 'SW' + ++sw : 'HUB' + ++hub);
    for (let p = 0; p < c.i.pcs; p++) { const px = primero + p * PASO; linea(medio, 119, px, 168); caja(px, 178, 22, 18, 'pc'); }
    if (c.i.hub) {
      const hx = primero + (c.i.pcs + (c.i.hub - 1) / 2) * PASO;
      linea(medio, 119, hx, 166); caja(hx, 180, 64, 26, 'hub', 'HUB' + ++hub);
      for (let p = 0; p < c.i.hub; p++) { const px = primero + (c.i.pcs + p) * PASO; linea(hx, 193, px, 232); caja(px, 242, 22, 18, 'pc'); }
    }
  });
  caja(cx, 30, 96, 30, 'router', 'ROUTER');
  const alto = red.interfaces.some(i => i.hub) ? 262 : 200;
  return `<svg class="an-red" viewBox="0 0 ${total} ${alto}" style="max-width:${Math.max(total, 420)}px" role="img" aria-label="Esquema de la red del caso"><g class="an-lineas">${lineas.join('')}</g>${cajas.join('')}</svg>`;
}

function volcadoTexto(bytes) {
  const filas = [];
  for (let i = 0; i < bytes.length; i += 16) filas.push(i.toString(16).padStart(4, '0') + '   ' + bytes.slice(i, i + 8).map(hex2).join(' ') + '  ' + bytes.slice(i + 8, i + 16).map(hex2).join(' '));
  return filas.join('\n') + '  …';
}

export function vistaAnaliza() {
  let caso, campos = {}, corregido = false;
  const cuerpo = h('div');
  const marcador = h('span.chip', 'Sin corregir');

  const campo = (id, etiqueta, control, ayuda) => {
    const pista = h('p.an-pista', { hidden: true });
    campos[id] = { control, pista };
    return h('div.an-campo', { 'data-id': id }, h('label', { for: 'an-' + id }, etiqueta), control, ayuda ? h('small', ayuda) : null, pista);
  };
  const texto = (id, ancho, attrs = {}) => h('input', { id: 'an-' + id, type: 'text', autocomplete: 'off', spellcheck: 'false', style: `width:${ancho}ch`, ...attrs });
  const numero = id => texto(id, 9, { inputmode: 'decimal' });
  const lista = (id, opciones) => h('select', { id: 'an-' + id }, h('option', { value: '' }, 'Elige…'), opciones.map(([v, t]) => h('option', { value: v }, t)));
  const siNo = id => lista(id, [['si', 'Sí'], ['no', 'No']]);

  function pintar() {
    campos = {}; corregido = false;
    marcador.textContent = 'Sin corregir'; marcador.className = 'chip';
    const { red, trama, csma, capas, encap, extra } = caso;
    const capaOSI = id => lista(id, NOMBRES_CAPA.map((n, i) => [String(i + 1), `${i + 1} · ${n}`]));
    const pduNombre = encap.tcp ? 'segmento TCP' : 'datagrama UDP';
    cuerpo.replaceChildren(
      h('section.tarjeta.an-bloque',
        h('h2', h('span.etiqueta', 'Bloque 1'), ' Dispositivos, capas y direcciones'),
        h('p', 'Indica la capa más alta del modelo OSI que procesa cada dispositivo para decidir qué hace con los datos.'),
        h('div.an-campos', capas.dispositivos.map((d, i) => campo('disp' + i, d.nombre, capaOSI('disp' + i)))),
        h('p', 'Ahora al revés: ¿qué capa OSI se encarga de cada función? ¿Y en qué capa buscarías primero esta avería?'),
        h('div.an-campos',
          extra.funciones.map((f, i) => campo('fun' + i, f[0], capaOSI('fun' + i))),
          campo('incidencia', 'Avería: ' + extra.incidencia[0], capaOSI('incidencia'))),
        h('div.an-campos',
          campo('pdu', `¿Cómo se llama la PDU de la capa ${capas.pdu.capa}?`, lista('pdu', ['Bit', 'Trama', 'Paquete', 'Segmento', 'Datos'].map(x => [x, x]))),
          campo('direccion', `¿Qué dirección se usa en la capa de ${capas.direccion.capa} de TCP/IP?`, lista('direccion', ['Nombre de dominio', 'Puerto', 'Dirección IP', 'Dirección MAC'].map(x => [x, x]))))),
      h('section.tarjeta.an-bloque',
        h('h2', h('span.etiqueta', 'Bloque 2'), ' Encapsulamiento'),
        h('p', 'Una aplicación envía ', h('strong', encap.app + ' bytes'), ' de datos por ', h('strong', encap.tcp ? 'TCP' : 'UDP'), ' sobre IPv4 y Ethernet, con las cabeceras de tamaño mínimo.'),
        h('div.an-campos',
          campo('segmento', `Tamaño del ${pduNombre}, en bytes`, numero('segmento')),
          campo('paquete', 'Tamaño del paquete IPv4, en bytes', numero('paquete')),
          campo('tramaTam', 'Tamaño de la trama Ethernet, en bytes', numero('tramaTam'), 'Con la FCS y sin el preámbulo'),
          campo('protoIP', 'Valor del campo Protocolo de la cabecera IPv4', numero('protoIP'))),
        h('div.an-campos',
          campo('puerto', `Puerto del servidor de ${extra.servicio[0]}`, numero('puerto')),
          campo('transporte', `${extra.servicio[0]} viaja normalmente sobre…`, lista('transporte', [['TCP', 'TCP'], ['UDP', 'UDP']])),
          campo('protoCapa', `Capa de TCP/IP a la que pertenece ${extra.protoCapa[0]}`, lista('protoCapa', ['Acceso a la red', 'Internet', 'Transporte', 'Aplicación'].map(x => [x, x])))),
        h('p', 'El paquete sale con TTL = ', h('strong', String(encap.ttl)), ' y atraviesa ', h('strong', String(encap.routers)), encap.routers === 1 ? ' router' : ' routers', ' hasta llegar al equipo de destino.'),
        h('div.an-campos',
          campo('tramas', '¿Cuántas tramas distintas se crean en todo el camino?', numero('tramas')),
          campo('ttlFinal', '¿Con qué TTL llega al destino?', numero('ttlFinal')),
          campo('cambian', '¿Qué direcciones cambian en cada salto?', lista('cambian', [['mac', 'Las direcciones MAC'], ['ip', 'Las direcciones IP'], ['dos', 'Las MAC y las IP'], ['ninguna', 'Ninguna']])))),
      h('section.tarjeta.an-bloque',
        h('h2', h('span.etiqueta', 'Bloque 3'), ' Dominios de colisión y de difusión'),
        h('p', 'Esta es la red de una empresa. Cada cuadrado pequeño es un equipo.'),
        h('div.an-figura', { html: dibujoRed(red) }),
        h('div.an-campos',
          campo('colision', '¿Cuántos dominios de colisión hay?', numero('colision')),
          campo('difusion', '¿Cuántos dominios de difusión hay?', numero('difusion')))),
      h('section.tarjeta.an-bloque',
        h('h2', h('span.etiqueta', 'Bloque 4'), ' Ethernet: variantes y trama'),
        h('p', 'Antes, una variante: ', h('strong', extra.variante[0]), '.'),
        h('div.an-campos',
          campo('varVel', '¿A qué velocidad trabaja?', lista('varVel', ['10 Mbit/s', '100 Mbit/s', '1 Gbit/s', '10 Gbit/s'].map(x => [x, x]))),
          campo('varMedio', '¿Qué medio usa?', lista('varMedio', ['Par trenzado', 'Fibra multimodo', 'Fibra monomodo', 'Coaxial'].map(x => [x, x])))),
        h('p', 'Has capturado esta trama. La captura no incluye el preámbulo, el SFD ni la FCS, y solo se ve el principio. La capa superior ha entregado ', h('strong', trama.datos + ' bytes'), ' de datos.'),
        h('pre.an-volcado', volcadoTexto(trama.volcado)),
        h('div.an-campos',
          campo('destino', 'MAC de destino', texto('destino', 20), 'Con guiones: 00-1A-2B-3C-4D-5E'),
          campo('origen', 'MAC de origen', texto('origen', 20)),
          campo('protocolo', '¿Qué protocolo transporta?', lista('protocolo', [['IPv4', 'IPv4'], ['IPv6', 'IPv6'], ['ARP', 'ARP']])),
          campo('esDifusion', '¿Es una trama de difusión?', siNo('esDifusion')),
          campo('relleno', 'Bytes de relleno que se añaden', numero('relleno'), 'Si no hace falta, escribe 0'),
          campo('tamano', 'Tamaño total de la trama, en bytes', numero('tamano'), 'Con la FCS y sin el preámbulo'),
          campo('enCable', 'Bytes que ocupa en el cable', numero('enCable'), 'Con la FCS, el preámbulo y el SFD'),
          campo('binario', `El último byte de la MAC de origen (${hex2(trama.octeto)}) en binario`, texto('binario', 12, { inputmode: 'numeric' }), '8 bits'),
          campo('tipoDecimal', `El campo Tipo (0x${trama.tipo}) en decimal`, numero('tipoDecimal')))),
      h('section.tarjeta.an-bloque',
        h('h2', h('span.etiqueta', 'Bloque 5'), ' CSMA/CD: la espera aleatoria'),
        h('p', 'Un equipo conectado a un hub a 10 Mbit/s acaba de sufrir su colisión número ', h('strong', String(csma.n)), ' con la misma trama.'),
        h('div.an-campos',
          campo('tope', 'Número máximo de ranuras que puede tener que esperar', numero('tope')),
          campo('valores', '¿Entre cuántos valores distintos elige?', numero('valores')),
          campo('espera', 'Espera máxima, en microsegundos', numero('espera'), 'Con un decimal')),
        h('p', 'En otra colisión, el equipo A saca ', h('strong', String(csma.kA)), csma.kA === 1 ? ' ranura' : ' ranuras', ' y el equipo B saca ', h('strong', String(csma.kB)), '.'),
        h('div.an-campos', campo('quien', '¿Qué ocurre después?', lista('quien', [['A', 'Envía primero A'], ['B', 'Envía primero B'], ['chocan', 'Vuelven a chocar']]))),
        h('p', 'Y un caso distinto: ', h('strong', csma.enlace.texto), '.'),
        h('div.an-campos', campo('aplica', '¿Se aplica CSMA/CD en ese enlace?', siNo('aplica'))),
        h('p.an-enlace', h('a', { href: 'figuras/csma-cd.html' }, 'Ver la figura: CSMA/CD con un hub →'))));
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
    corregido = true;
    marcador.textContent = `${r.aciertos} de ${r.total}`;
    marcador.className = 'chip ' + (r.aciertos === r.total ? 'ok' : '');
    marcador.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const numeroCaso = h('span.chip');
  const el = h('section.an',
    h('div.inicio-cab',
      h('span.etiqueta', '1.º ASIR · Planificación y administración de redes · Tema 1'),
      h('h1', 'Analiza la red'),
      h('p.lead', 'Cinco bloques con un caso distinto cada vez: dispositivos y capas, encapsulamiento, dominios, la trama Ethernet y la espera de CSMA/CD. Al corregir verás la respuesta y el porqué. No se guarda nada y no tiene nota.')),
    h('div.an-barra', numeroCaso, marcador,
      h('button.btn', { type: 'button', onclick: comprobar }, 'Corregir'),
      h('button.btn.sec', { type: 'button', onclick: () => { if (!corregido && Object.values(campos).some(c => c.control.value) && !confirm('Vas a cambiar de caso sin corregir este. ¿Seguro?')) return; nuevo(); window.scrollTo({ top: 0 }); } }, 'Otro caso')),
    cuerpo,
    h('div.an-barra', h('button.btn', { type: 'button', onclick: comprobar }, 'Corregir')));
  const pedida = Number(new URLSearchParams(location.hash.split('?')[1] || '').get('caso'));
  nuevo(Number.isInteger(pedida) && pedida > 0 ? pedida : undefined);
  return { el };
}
