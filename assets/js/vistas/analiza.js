// analiza.js — «Analiza la red» (1.º ASIR · PAR, Tema 1): práctica autocorregida, sin nota y sin guardar nada.
import { h } from '../util.js';
import { crearCaso, corregir, NOMBRES_CAPA, NOMBRES_ELEMENTO, EFECTOS, CONCEPTOS, ERRORES_DIR, macTexto, puntos } from '../practica/Analiza.js';

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
    const { red, trama, csma, capas, encap, extra, topo, tipos, arq, num } = caso;
    const bloque = (n, titulo, ...hijos) => h('section.tarjeta.an-bloque', { id: 'an-bloque-' + n }, h('h2', h('span.etiqueta', 'Bloque ' + n), ' ' + titulo, h('span.chip.an-nota', { hidden: true })), ...hijos);
    const mismas = x => x.map(v => [v, v]);
    const capaOSI = id => lista(id, NOMBRES_CAPA.map((n, i) => [String(i + 1), `${i + 1} · ${n}`]));
    const pduNombre = encap.tcp ? 'segmento TCP' : 'datagrama UDP';
    cuerpo.replaceChildren(
      bloque(1, 'Tipos de red y conmutación',
        h('p', 'Una empresa de transportes tiene varias redes y conexiones. Clasifica estas dos.'),
        tipos.redes.map((x, i) => [
          h('p', h('strong', x[0] + '.')),
          h('div.an-campos',
            campo(`red${i}alc`, 'Alcance', lista(`red${i}alc`, mismas(['PAN', 'LAN', 'WLAN', 'MAN', 'WAN']))),
            campo(`red${i}tit`, 'Titularidad', lista(`red${i}tit`, mismas(['Privada', 'Pública']))),
            campo(`red${i}med`, 'Medio', lista(`red${i}med`, mismas(['Cableada', 'Inalámbrica']))))]),
        h('div.an-campos',
          campo('funcional', tipos.funcional[0] + '. ¿Qué modelo es?', lista('funcional', [['cs', 'Cliente-servidor'], ['p2p', 'Entre iguales (P2P)']])),
          campo('elemento', tipos.elemento[0] + ' es…', lista('elemento', Object.entries(NOMBRES_ELEMENTO))),
          campo('conmutacion', tipos.conmutacion[0] + '. ¿De qué conmutación se habla?', lista('conmutacion', [['circuitos', 'De circuitos'], ['paquetes', 'De paquetes']])),
          campo('tecnologia', tipos.tecnologia[0] + '. ¿Qué tecnología de transmisión es?', lista('tecnologia', [['difusion', 'Difusión'], ['punto', 'Punto a punto']])),
          campo('hito', '¿Qué fue antes?', lista('hito', tipos.hitos.map((x, i) => [String(i), x[0]]))),
          campo('ipPrivada', `La dirección ${tipos.ip[0]} es…`, lista('ipPrivada', [['privada', 'Privada'], ['publica', 'Pública']])),
          campo('copia', `Segundos que tarda en copiarse un archivo de ${tipos.copia.cantidad} ${tipos.copia.unidad} por un enlace de ${tipos.copia.velocidad >= 1000 ? '1 Gbit/s' : tipos.copia.velocidad + ' Mbit/s'}`, numero('copia'), 'En condiciones ideales. Toma 1 MB = 8 Mbit y 1 GB = 8000 Mbit'))),
      bloque(2, 'Topologías y arquitectura por capas',
        h('div.an-campos',
          campo('topoFisica', 'Topología física: ' + topo.fisica[0], lista('topoFisica', mismas(['Bus', 'Anillo', 'Estrella', 'Estrella extendida', 'Malla']))),
          campo('topoLogica', `Topología lógica de ${topo.logica[0]}`, lista('topoLogica', mismas(['Difusión', 'Paso de testigo', 'Conmutación punto a punto']))),
          campo('wan', 'Entre sedes: ' + arq.wan[0], lista('wan', mismas(['Punto a punto', 'Concentrador y radios', 'Malla'])))),
        h('div.an-campos',
          campo('enlaces', `Enlaces que hacen falta para unir ${arq.enlaces.n} equipos en ${arq.enlaces.topologia === 'estrella' ? 'estrella' : 'anillo simple'}`, numero('enlaces')),
          campo('malla', `Enlaces de una malla completa entre ${topo.sedes} sedes`, numero('malla'))),
        h('p', '¿Qué pasa en cada avería?'),
        h('div.an-campos', arq.fallos.map((f, i) => campo('fallo' + i, f[0], lista('fallo' + i, Object.entries(EFECTOS))))),
        h('p', 'Arquitectura por capas: ¿a qué concepto corresponde cada descripción?'),
        h('div.an-campos', arq.definiciones.map((d, i) => campo('def' + i, d[0], lista('def' + i, mismas(CONCEPTOS)))))),
      bloque(3, 'Números, máscaras y direcciones',
        h('p', 'Sin calculadora. El binario, siempre con 8 bits.'),
        h('div.an-campos',
          campo('nDecBin', `${num.dec} en binario`, texto('nDecBin', 12, { inputmode: 'numeric' })),
          campo('nBinDec', `${num.bin.toString(2).padStart(8, '0')} en decimal`, numero('nBinDec')),
          campo('nHexDec', `${hex2(num.hex)} (hexadecimal) en decimal`, numero('nHexDec')),
          campo('nDecHex', `${num.aHex} en hexadecimal`, texto('nDecHex', 6)),
          campo('nBits', `Bits que tiene ${num.bits[0]}`, numero('nBits')),
          campo('nComb', `Combinaciones distintas que se pueden formar con ${num.comb} bits`, numero('nComb'))),
        h('p', 'Máscaras y prefijos.'),
        h('div.an-campos',
          campo('nPrefijo', `Prefijo de la máscara ${puntos([0, 0, 0, 0].map((_, i) => Math.max(0, Math.min(8, num.prefijoDe - 8 * i))).map(b => 256 - 2 ** (8 - b)))}`, texto('nPrefijo', 6), 'Por ejemplo, /24'),
          campo('nMascara', `Máscara en decimal del prefijo /${num.mascaraDe}`, texto('nMascara', 18), 'Por ejemplo, 255.255.255.0'),
          campo('nValida', `¿Es válida la máscara ${num.valida[0]}?`, siNo('nValida'))),
        h('p', 'Un equipo tiene la dirección ', h('strong', puntos(num.red.ip)), ' con la máscara ', h('strong', puntos(num.red.mascara)), '.'),
        h('div.an-campos',
          campo('nRed', 'Dirección de red (operación AND)', texto('nRed', 18)),
          campo('nMisma', `¿Está en su misma red el equipo ${puntos(num.otra.ip)}, con la misma máscara?`, siNo('nMisma'))),
        h('p', 'Direcciones del inventario.'),
        h('div.an-campos',
          campo('nRara', `En el inventario aparece ${num.rara[0]}. ¿Es correcta?`, lista('nRara', Object.entries(ERRORES_DIR))),
          campo('nOui', `OUI de la MAC ${macTexto(num.mac1)}`, texto('nOui', 12), 'Con guiones'),
          campo('nFab', `¿Es del mismo fabricante la tarjeta ${macTexto(num.mac2)}?`, siNo('nFab')),
          campo('nIG', `La MAC ${macTexto(num.ig.mac)} es…`, lista('nIG', [['individual', 'Individual (unicast)'], ['grupo', 'De grupo (multicast o difusión)']])))),
      bloque(4, 'Dispositivos, capas y direcciones',
        h('p', 'Indica la capa más alta del modelo OSI que procesa cada dispositivo para decidir qué hace con los datos.'),
        h('div.an-campos', capas.dispositivos.map((d, i) => campo('disp' + i, d.nombre, capaOSI('disp' + i)))),
        h('p', 'Ahora al revés: ¿qué capa OSI se encarga de cada función? ¿Y en qué capa buscarías primero esta avería?'),
        h('div.an-campos',
          extra.funciones.map((f, i) => campo('fun' + i, f[0], capaOSI('fun' + i))),
          campo('incidencia', 'Avería: ' + extra.incidencia[0], capaOSI('incidencia'))),
        h('div.an-campos',
          campo('pdu', `¿Cómo se llama la PDU de la capa ${capas.pdu.capa}?`, lista('pdu', ['Bit', 'Trama', 'Paquete', 'Segmento', 'Datos'].map(x => [x, x]))),
          campo('direccion', `¿Qué dirección se usa en la capa de ${capas.direccion.capa} de TCP/IP?`, lista('direccion', ['Nombre de dominio', 'Puerto', 'Dirección IP', 'Dirección MAC'].map(x => [x, x]))))),
      bloque(5, 'Encapsulamiento',
        h('p', 'Una aplicación envía ', h('strong', encap.app + ' bytes'), ' de datos por ', h('strong', encap.tcp ? 'TCP' : 'UDP'), ' sobre IPv4.'),
        h('p.nota', 'Tamaño de las cabeceras: TCP, 20 bytes; UDP, 8 bytes; IPv4, 20 bytes.'),
        h('div.an-campos',
          campo('segmento', `Tamaño del ${pduNombre}, en bytes`, numero('segmento')),
          campo('paquete', 'Tamaño del paquete IPv4, en bytes', numero('paquete')),
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
      bloque(6, 'Dominios de colisión y de difusión',
        h('p', 'Esta es la red de una empresa. Cada cuadrado pequeño es un equipo.'),
        h('div.an-figura', { html: dibujoRed(red) }),
        h('div.an-campos',
          campo('colision', '¿Cuántos dominios de colisión hay?', numero('colision')),
          campo('difusion', '¿Cuántos dominios de difusión hay?', numero('difusion')))),
      bloque(7, 'Ethernet: variantes y trama',
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
      bloque(8, 'CSMA/CD: la espera aleatoria',
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
    for (const b of cuerpo.querySelectorAll('.an-bloque')) {
      const todos = b.querySelectorAll('.an-campo').length, bien = b.querySelectorAll('.an-campo.ok').length, nota = b.querySelector('.an-nota');
      nota.hidden = false; nota.textContent = `${bien} de ${todos}`; nota.classList.toggle('ok', bien === todos);
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
      h('p.lead', 'Ocho bloques que recorren el tema, con un caso distinto cada vez. Puedes hacer solo los que quieras repasar: al corregir verás la nota de cada bloque, la respuesta y el porqué. No se guarda nada y no tiene nota.'),
      h('nav.an-indice', { 'aria-label': 'Bloques' }, ['Tipos de red', 'Topologías', 'Números y máscaras', 'Capas', 'Encapsulamiento', 'Dominios', 'Trama Ethernet', 'CSMA/CD'].map((t, i) => h('button.btn.sec.peq', { type: 'button', onclick: () => document.getElementById('an-bloque-' + (i + 1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, `${i + 1} · ${t}`)))),
    h('div.an-barra', numeroCaso, marcador,
      h('button.btn', { type: 'button', onclick: comprobar }, 'Corregir'),
      h('button.btn.sec', { type: 'button', onclick: () => { if (!corregido && Object.values(campos).some(c => c.control.value) && !confirm('Vas a cambiar de caso sin corregir este. ¿Seguro?')) return; nuevo(); window.scrollTo({ top: 0 }); } }, 'Otro caso')),
    cuerpo,
    h('div.an-barra', h('button.btn', { type: 'button', onclick: comprobar }, 'Corregir')));
  const pedida = Number(new URLSearchParams(location.hash.split('?')[1] || '').get('caso'));
  nuevo(Number.isInteger(pedida) && pedida > 0 ? pedida : undefined);
  return { el };
}
