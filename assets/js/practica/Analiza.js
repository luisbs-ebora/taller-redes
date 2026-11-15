// Analiza.js — «Analiza la red» (1.º ASIR · PAR, Tema 1, sección 6): genera un caso distinto por semilla y lo corrige.
// Cinco bloques: dispositivos y capas, encapsulamiento, dominios de colisión y de difusión, la trama Ethernet II
// y el retroceso de CSMA/CD.
// Las reglas son las de los apuntes: hub = un dominio de colisión; switch = uno por puerto; router = uno por interfaz
// y separa la difusión; trama de 64 a 1518 bytes; espera de 0 a 2ⁿ − 1 ranuras (tope en n = 10) de 512 tiempos de bit.

export const NOMBRES_CAPA = ['Física', 'Enlace de datos', 'Red', 'Transporte', 'Sesión', 'Presentación', 'Aplicación'];

export function azar(semilla) {
  let s = (semilla >>> 0) || 1;
  const sig = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  return { n: (a, b) => a + Math.floor(sig() * (b - a + 1)), de: lista => lista[Math.floor(sig() * lista.length)], prob: p => sig() < p };
}

const hex2 = b => b.toString(16).toUpperCase().padStart(2, '0');
export const macTexto = bytes => bytes.map(hex2).join('-');
const PROTOCOLOS = [
  { hex: '0800', nombre: 'IPv4', datos: [28, 40, 60, 84, 576, 1200, 1500] },
  { hex: '86DD', nombre: 'IPv6', datos: [48, 72, 120, 1280, 1500] },
  { hex: '0806', nombre: 'ARP', datos: [28] },
];
const ENLACES = [
  { texto: 'un PC conectado a un switch en dúplex completo', aplica: false, porque: 'En dúplex completo cada sentido tiene su propio camino y el enlace solo une dos dispositivos: no hay colisiones y CSMA/CD se desactiva.' },
  { texto: 'tres PC conectados a un mismo hub', aplica: true, porque: 'El hub es un medio compartido: obliga a trabajar en semidúplex y ahí se aplica CSMA/CD.' },
  { texto: 'dos switches unidos por fibra a 10 Gbit/s', aplica: false, porque: 'Las variantes de 10 Gbit/s y superiores ni siquiera contemplan el semidúplex: no hay CSMA/CD.' },
  { texto: 'un PC en semidúplex conectado a un hub', aplica: true, porque: 'Semidúplex sobre un medio compartido: es justo el caso para el que existe CSMA/CD.' },
];

const CAPAS = NOMBRES_CAPA;
const DISPOSITIVOS = [
  { nombre: 'Concentrador (hub)', capa: 1, porque: 'Es un repetidor multipuerto: trabaja con señales y bits, sin entender direcciones.' },
  { nombre: 'Repetidor', capa: 1, porque: 'Solo regenera la señal para ampliar la distancia: capa física.' },
  { nombre: 'Convertidor de medios (cobre a fibra)', capa: 1, porque: 'Convierte la señal de un medio a otro: no lee direcciones, es de capa física.' },
  { nombre: 'Switch (conmutador)', capa: 2, porque: 'Lee las direcciones MAC de las tramas y envía cada una solo por el puerto del destino.' },
  { nombre: 'Switch gestionable con una IP para administrarlo', capa: 2, porque: 'La IP solo sirve para administrarlo: para reenviar las tramas sigue usando las direcciones MAC.' },
  { nombre: 'Punto de acceso inalámbrico', capa: 2, porque: 'Une la red Wi-Fi con la cableada a nivel de enlace.' },
  { nombre: 'Puente (bridge)', capa: 2, porque: 'Une dos segmentos filtrando las tramas por su MAC.' },
  { nombre: 'Router (encaminador)', capa: 3, porque: 'Lee la dirección IP de destino de cada paquete para elegir la ruta.' },
  { nombre: 'Switch multicapa', capa: 3, porque: 'Además de conmutar, encamina entre redes: llega a la capa de red.' },
  { nombre: 'Cortafuegos que filtra por puertos', capa: 4, porque: 'Los puertos son de la capa de transporte.' },
  { nombre: 'Proxy web', capa: 7, porque: 'Es intermediario de un servicio concreto: trabaja en la capa de aplicación.' },
];
const PDUS = [
  { capa: 'de enlace de datos', pdu: 'Trama' }, { capa: 'de red', pdu: 'Paquete' }, { capa: 'de transporte cuando se usa TCP', pdu: 'Segmento' }, { capa: 'física', pdu: 'Bit' },
];
const DIRECCIONES = [
  { capa: 'transporte', dir: 'Puerto', porque: 'El puerto identifica a la aplicación dentro del equipo.' },
  { capa: 'Internet', dir: 'Dirección IP', porque: 'La dirección IP identifica al equipo en el conjunto de redes.' },
  { capa: 'acceso a la red', dir: 'Dirección MAC', porque: 'La dirección MAC identifica a la interfaz dentro de la red local.' },
];

const FUNCIONES = [
  ['Direccionamiento lógico y encaminamiento entre redes', 3], ['Codificación de caracteres, como ASCII o UTF-8', 6], ['Establecer, mantener y cerrar el diálogo entre las aplicaciones', 5],
  ['Organizar los bits en tramas', 2], ['Definir los conectores, el tipo de cable y la forma de la señal', 1], ['Identificar cada aplicación con un número de puerto', 4],
  ['Ofrecer a los programas protocolos como HTTP o DNS', 7], ['Detectar errores con el código FCS', 2], ['Decidir quién transmite cuando el medio es compartido', 2],
  ['Comprimir y cifrar los datos', 6], ['Poner puntos de sincronización para retomar una transferencia', 5], ['Entregar los datos en orden y sin pérdidas de extremo a extremo', 4],
];
const INCIDENCIAS = [
  ['El LED de enlace de la tarjeta de red está apagado.', 1, 'Sin enlace no hay señal: es un problema físico (cable, conector o puerto).'],
  ['El equipo tiene enlace, pero su dirección IPv4 es 169.254.30.8 y no sale de su red.', 3, 'No tiene una IP, máscara y puerta de enlace correctas: capa de red.'],
  ['Se puede navegar escribiendo direcciones IP, pero no escribiendo nombres.', 7, 'Falla la resolución de nombres (DNS), que es un servicio de la capa de aplicación.'],
  ['El servidor responde al ping, pero el programa no conecta: el cortafuegos tiene cerrado su puerto.', 4, 'Los puertos son de la capa de transporte.'],
  ['El cable está bien y hay enlace, pero el adaptador de red está deshabilitado y su MAC no aparece en el switch.', 2, 'El enlace físico está bien; lo que falla es el nivel de enlace (la interfaz y su MAC).'],
  ['Desde que alguien pisó el cable, llegan muchas tramas dañadas.', 1, 'El origen es el cable, capa física, aunque el error se detecte en la capa 2 con la FCS.'],
];
const SERVICIOS = [['HTTP', 80, 'TCP'], ['HTTPS', 443, 'TCP'], ['DNS', 53, 'UDP'], ['SMTP', 25, 'TCP'], ['SSH', 22, 'TCP'], ['Telnet', 23, 'TCP'], ['IMAP', 143, 'TCP'], ['POP3', 110, 'TCP'], ['SNMP', 161, 'UDP']];
const PROTOCOLOS_CAPA = [['IPv4', 'Internet'], ['ICMP', 'Internet'], ['Ethernet', 'Acceso a la red'], ['Wi‑Fi', 'Acceso a la red'], ['TCP', 'Transporte'], ['UDP', 'Transporte'], ['HTTP', 'Aplicación'], ['DNS', 'Aplicación'], ['DHCP', 'Aplicación']];
const VARIANTES = [
  ['10BASE-T', '10 Mbit/s', 'Par trenzado'], ['100BASE-TX', '100 Mbit/s', 'Par trenzado'], ['1000BASE-T', '1 Gbit/s', 'Par trenzado'], ['10GBASE-T', '10 Gbit/s', 'Par trenzado'],
  ['1000BASE-SX', '1 Gbit/s', 'Fibra multimodo'], ['10GBASE-SR', '10 Gbit/s', 'Fibra multimodo'], ['10GBASE-LR', '10 Gbit/s', 'Fibra monomodo'], ['10BASE2', '10 Mbit/s', 'Coaxial'], ['100BASE-FX', '100 Mbit/s', 'Fibra multimodo'],
];

export function crearCaso(semilla) {
  const r = azar(semilla);
  // Bloque 1 · La red: un router y, en cada interfaz, un switch (a veces con un hub colgando) o un hub.
  const interfaces = Array.from({ length: r.n(2, 3) }, () => r.prob(0.7)
    ? { tipo: 'switch', pcs: r.n(2, 5), hub: r.prob(0.5) ? r.n(2, 4) : 0 }
    : { tipo: 'hub', pcs: r.n(3, 5), hub: 0 });
  if (!interfaces.some(i => i.tipo === 'switch')) interfaces[0] = { tipo: 'switch', pcs: r.n(2, 5), hub: 0 };
  if (!interfaces.some(i => i.tipo === 'hub' || i.hub)) interfaces.find(i => i.tipo === 'switch').hub = r.n(2, 4);
  const colision = interfaces.reduce((t, i) => t + (i.tipo === 'hub' ? 1 : i.pcs + (i.hub ? 1 : 0) + 1), 0);

  // Bloque 2 · La trama.
  const byte = () => r.n(0, 255);
  const mac = () => { const m = Array.from({ length: 6 }, byte); m[0] &= 0xfe; return m; };   // individual: bit menos significativo a 0
  const esDifusion = r.prob(0.3);
  const protocolo = r.de(PROTOCOLOS);
  const destino = esDifusion || protocolo.nombre === 'ARP' && r.prob(0.6) ? Array(6).fill(255) : mac();
  const origen = mac();
  const datos = r.de(protocolo.datos);
  const tipo = [parseInt(protocolo.hex.slice(0, 2), 16), parseInt(protocolo.hex.slice(2), 16)];
  const volcado = [...destino, ...origen, ...tipo, ...Array.from({ length: 10 }, byte)];

  // Bloque 3 · CSMA/CD.
  const n = r.n(1, 12);
  const tope = 2 ** Math.min(n, 10) - 1;
  const kA = r.n(0, Math.min(tope, 7));
  const kB = r.prob(0.35) ? kA : r.n(0, Math.min(tope, 7));

  // Bloques nuevos (se sortean al final para no cambiar los casos ya existentes de los otros bloques).
  const resto = [...DISPOSITIVOS], dispositivos = [];
  while (dispositivos.length < 4) { const d = resto.splice(r.n(0, resto.length - 1), 1)[0]; if (!dispositivos.some(x => x.capa === d.capa) || dispositivos.length >= 3) dispositivos.push(d); }
  const tcp = r.prob(0.6);
  const app = r.de(tcp ? [200, 512, 800, 1200, 1460] : [40, 120, 512, 1200, 1472]);
  const cab = tcp ? 20 : 8, routers = r.n(1, 5), ttl = r.de([64, 128]);

  const pdu = r.de(PDUS), direccion = r.de(DIRECCIONES);
  // Añadidos tras revisar las hojas de ejercicios 4, 5 y 6 (se sortean al final para no cambiar lo anterior).
  const f1 = r.de(FUNCIONES), f2 = r.de(FUNCIONES.filter(f => f[1] !== f1[1]));
  const incidencia = r.de(INCIDENCIAS), servicio = r.de(SERVICIOS), protoCapa = r.de(PROTOCOLOS_CAPA), variante = r.de(VARIANTES);

  return {
    semilla,
    extra: { funciones: [f1, f2], incidencia, servicio, protoCapa, variante },
    capas: { dispositivos, pdu, direccion },
    encap: { tcp, app, cab, segmento: app + cab, paquete: app + cab + 20, trama: app + cab + 20 + 18, protocolo: tcp ? 6 : 17, routers, ttl, tramas: routers + 1, ttlFinal: ttl - routers },
    red: { interfaces, colision, difusion: interfaces.length },
    trama: { destino, origen, tipo: protocolo.hex, protocolo: protocolo.nombre, esDifusion: destino.every(b => b === 255), datos, relleno: Math.max(0, 46 - datos), tamano: 14 + Math.max(46, datos) + 4, volcado, octeto: origen[5], tipoDecimal: parseInt(protocolo.hex, 16) },
    csma: { n, tope, valores: tope + 1, espera: Math.round(tope * 51.2 * 10) / 10, kA, kB, quien: kA === kB ? 'chocan' : kA < kB ? 'A' : 'B', enlace: r.de(ENLACES) },
  };
}

const soloHex = t => String(t ?? '').toUpperCase().replace(/[^0-9A-F]/g, '');
const entero = t => /^\s*\d+\s*$/.test(String(t ?? '')) ? parseInt(t, 10) : NaN;
const decimal = t => { const v = String(t ?? '').trim().replace(/\s|µs/g, '').replace(',', '.'); return /^\d+(\.\d+)?$/.test(v) ? parseFloat(v) : NaN; };
const es = (n, sing, plur) => `${n} ${n === 1 ? sing : plur}`;

/** Devuelve la lista de apartados con { id, ok, correcta, porque } y los aciertos. */
export function corregir(caso, resp) {
  const { red, trama, csma, capas, encap, extra } = caso;
  const partes = red.interfaces.map((i, k) => i.tipo === 'hub'
    ? `interfaz ${k + 1}: 1 (el hub y todo lo que cuelga de él)`
    : `interfaz ${k + 1}: ${i.pcs + (i.hub ? 1 : 0) + 1} (${es(i.pcs, 'puerto con PC', 'puertos con PC')}${i.hub ? ', 1 puerto con el hub' : ''} y 1 puerto hacia el router)`);
  const que = csma.quien === 'chocan' ? 'Vuelven a chocar' : `Envía primero ${csma.quien}`;
  const lista = [
    ...capas.dispositivos.map((d, i) => ({ id: 'disp' + i, ok: entero(resp['disp' + i]) === d.capa, correcta: `Capa ${d.capa} (${CAPAS[d.capa - 1]})`, porque: d.porque })),
    ...extra.funciones.map((f, i) => ({ id: 'fun' + i, ok: entero(resp['fun' + i]) === f[1], correcta: `Capa ${f[1]} (${CAPAS[f[1] - 1]})`, porque: 'De abajo arriba: física (señal), enlace (tramas, MAC, acceso al medio), red (IP, rutas), transporte (puertos, fiabilidad), sesión (diálogo), presentación (formato, cifrado) y aplicación (protocolos de servicio).' })),
    { id: 'incidencia', ok: entero(resp.incidencia) === extra.incidencia[1], correcta: `Capa ${extra.incidencia[1]} (${CAPAS[extra.incidencia[1] - 1]})`, porque: extra.incidencia[2] },
    { id: 'pdu', ok: resp.pdu === capas.pdu.pdu, correcta: capas.pdu.pdu, porque: 'De arriba abajo: datos, segmento (TCP) o datagrama (UDP), paquete, trama y bits.' },
    { id: 'direccion', ok: resp.direccion === capas.direccion.dir, correcta: capas.direccion.dir, porque: capas.direccion.porque },
    { id: 'segmento', ok: entero(resp.segmento) === encap.segmento, correcta: String(encap.segmento), porque: `${encap.app} + ${encap.cab} de cabecera ${encap.tcp ? 'TCP' : 'UDP'} = ${encap.segmento} bytes.` },
    { id: 'paquete', ok: entero(resp.paquete) === encap.paquete, correcta: String(encap.paquete), porque: `${encap.segmento} + 20 de cabecera IPv4 = ${encap.paquete} bytes.` },
    { id: 'tramaTam', ok: entero(resp.tramaTam) === encap.trama, correcta: String(encap.trama), porque: `${encap.paquete} + 14 de cabecera Ethernet + 4 de FCS = ${encap.trama} bytes.` },
    { id: 'protoIP', ok: entero(resp.protoIP) === encap.protocolo, correcta: String(encap.protocolo), porque: 'El campo Protocolo de IPv4 vale 1 para ICMP, 6 para TCP y 17 para UDP.' },
    { id: 'puerto', ok: entero(resp.puerto) === extra.servicio[1], correcta: String(extra.servicio[1]), porque: `${extra.servicio[0]} usa el puerto ${extra.servicio[1]} del servidor, sobre ${extra.servicio[2]}.` },
    { id: 'transporte', ok: resp.transporte === extra.servicio[2], correcta: extra.servicio[2], porque: extra.servicio[2] === 'UDP' ? 'Es un servicio de consultas cortas: usa UDP, sin conexión y con menos retardo.' : 'Necesita que todo llegue y en orden: usa TCP, orientado a conexión y fiable.' },
    { id: 'protoCapa', ok: resp.protoCapa === extra.protoCapa[1], correcta: extra.protoCapa[1], porque: 'Acceso a la red: Ethernet y Wi‑Fi. Internet: IP e ICMP. Transporte: TCP y UDP. Aplicación: HTTP, DNS, DHCP, SMTP…' },
    { id: 'cambian', ok: resp.cambian === 'mac', correcta: 'Las direcciones MAC', porque: 'Las MAC solo tienen sentido dentro de cada red local y cambian en cada salto; las IP de origen y destino se mantienen de extremo a extremo.' },
    { id: 'tramas', ok: entero(resp.tramas) === encap.tramas, correcta: String(encap.tramas), porque: `Cada router desencapsula hasta IP y crea una trama nueva para el siguiente enlace: ${encap.routers} ${encap.routers === 1 ? 'router' : 'routers'} son ${encap.tramas} enlaces y ${encap.tramas} tramas. Las MAC cambian en cada salto; las IP no.` },
    { id: 'ttlFinal', ok: entero(resp.ttlFinal) === encap.ttlFinal, correcta: String(encap.ttlFinal), porque: `Cada router resta 1 al TTL: ${encap.ttl} − ${encap.routers} = ${encap.ttlFinal}.` },
    { id: 'colision', ok: entero(resp.colision) === red.colision, correcta: String(red.colision), porque: `Cada puerto usado de un switch es un dominio de colisión; un hub es uno solo para todos sus puertos. ${partes.join('; ')}.` },
    { id: 'difusion', ok: entero(resp.difusion) === red.difusion, correcta: String(red.difusion), porque: 'Ni el hub ni el switch separan la difusión; el router sí: hay un dominio de difusión por cada interfaz del router.' },
    { id: 'destino', ok: soloHex(resp.destino) === trama.destino.map(hex2).join(''), correcta: macTexto(trama.destino), porque: 'La MAC de destino son los 6 primeros bytes de la trama.' },
    { id: 'origen', ok: soloHex(resp.origen) === trama.origen.map(hex2).join(''), correcta: macTexto(trama.origen), porque: 'La MAC de origen son los 6 bytes siguientes (del 7.º al 12.º).' },
    { id: 'protocolo', ok: resp.protocolo === trama.protocolo, correcta: trama.protocolo, porque: `Los bytes 13.º y 14.º son el campo Tipo: 0x${trama.tipo}. 0x0800 es IPv4, 0x86DD es IPv6 y 0x0806 es ARP.` },
    { id: 'esDifusion', ok: resp.esDifusion === (trama.esDifusion ? 'si' : 'no'), correcta: trama.esDifusion ? 'Sí' : 'No', porque: trama.esDifusion ? 'El destino es FF-FF-FF-FF-FF-FF, la dirección de difusión: la reciben todos los equipos del dominio de difusión.' : 'El destino no es FF-FF-FF-FF-FF-FF, así que no es una difusión.' },
    { id: 'relleno', ok: entero(resp.relleno) === trama.relleno, correcta: String(trama.relleno), porque: trama.relleno ? `El campo de datos mide como mínimo 46 bytes: 46 − ${trama.datos} = ${trama.relleno} bytes de relleno.` : `Los datos ya miden ${trama.datos} bytes, 46 o más: no hace falta relleno.` },
    { id: 'tamano', ok: entero(resp.tamano) === trama.tamano, correcta: String(trama.tamano), porque: `6 + 6 + 2 + ${Math.max(46, trama.datos)} + 4 = ${trama.tamano} bytes. El preámbulo y el SFD no se cuentan.` },
    { id: 'enCable', ok: entero(resp.enCable) === trama.tamano + 8, correcta: String(trama.tamano + 8), porque: `En el cable van además los 7 bytes del preámbulo y 1 del SFD: ${trama.tamano} + 8 = ${trama.tamano + 8} bytes.` },
    { id: 'binario', ok: String(resp.binario ?? '').replace(/\s/g, '') === trama.octeto.toString(2).padStart(8, '0'), correcta: trama.octeto.toString(2).padStart(8, '0'), porque: `Cada cifra hexadecimal son 4 bits: ${hex2(trama.octeto)[0]} = ${parseInt(hex2(trama.octeto)[0], 16).toString(2).padStart(4, '0')} y ${hex2(trama.octeto)[1]} = ${parseInt(hex2(trama.octeto)[1], 16).toString(2).padStart(4, '0')}.` },
    { id: 'tipoDecimal', ok: entero(resp.tipoDecimal) === trama.tipoDecimal, correcta: String(trama.tipoDecimal), porque: `0x${trama.tipo} = ${[...trama.tipo].map((c, i) => `${parseInt(c, 16)}·16${['³', '²', '¹', '⁰'][i]}`).join(' + ')} = ${trama.tipoDecimal}. Es 1536 o más, así que el campo es un Tipo (Ethernet II) y no una longitud.` },
    { id: 'varVel', ok: resp.varVel === extra.variante[1], correcta: extra.variante[1], porque: `El número del principio es la velocidad en Mbit/s (con G, en Gbit/s): ${extra.variante[0]} va a ${extra.variante[1]}.` },
    { id: 'varMedio', ok: resp.varMedio === extra.variante[2], correcta: extra.variante[2], porque: 'El final indica el medio: T y TX, par trenzado; SX y SR, fibra multimodo; LR, fibra monomodo; FX, fibra; un número (2, 5), coaxial.' },
    { id: 'tope', ok: entero(resp.tope) === csma.tope, correcta: String(csma.tope), porque: csma.n > 10 ? `El exponente deja de crecer a partir de 10: 2¹⁰ − 1 = 1023, aunque sea la colisión número ${csma.n}.` : `Tras la colisión número ${csma.n} se elige entre 0 y 2^${csma.n} − 1 = ${csma.tope} ranuras.` },
    { id: 'valores', ok: entero(resp.valores) === csma.valores, correcta: String(csma.valores), porque: `De 0 a ${csma.tope} hay ${csma.valores} valores posibles (el 0 también cuenta).` },
    { id: 'espera', ok: Math.abs(decimal(resp.espera) - csma.espera) < 0.06, correcta: String(csma.espera).replace('.', ',') + ' µs', porque: `Una ranura son 512 tiempos de bit: 51,2 µs a 10 Mbit/s. ${csma.tope} × 51,2 = ${String(csma.espera).replace('.', ',')} µs.` },
    { id: 'quien', ok: resp.quien === csma.quien, correcta: que, porque: csma.quien === 'chocan' ? 'Los dos esperan lo mismo, así que vuelven a transmitir a la vez y chocan otra vez.' : `${csma.quien} espera menos ranuras y transmite primero. Si al otro se le acaba la espera mientras tanto, encuentra el medio ocupado y aguarda a que quede libre.` },
    { id: 'aplica', ok: resp.aplica === (csma.enlace.aplica ? 'si' : 'no'), correcta: csma.enlace.aplica ? 'Sí' : 'No', porque: csma.enlace.porque },
  ];
  return { lista, aciertos: lista.filter(x => x.ok).length, total: lista.length };
}

/** Respuestas correctas de un caso, con el formato que acepta corregir(). */
export function solucion(caso) {
  const { red, trama, csma, capas, encap, extra } = caso;
  return { fun0: extra.funciones[0][1], fun1: extra.funciones[1][1], incidencia: extra.incidencia[1], puerto: extra.servicio[1], transporte: extra.servicio[2], protoCapa: extra.protoCapa[1], cambian: 'mac', enCable: trama.tamano + 8, varVel: extra.variante[1], varMedio: extra.variante[2], ...Object.fromEntries(capas.dispositivos.map((d, i) => ['disp' + i, d.capa])), pdu: capas.pdu.pdu, direccion: capas.direccion.dir, segmento: encap.segmento, paquete: encap.paquete, tramaTam: encap.trama, protoIP: encap.protocolo, tramas: encap.tramas, ttlFinal: encap.ttlFinal, colision: red.colision, difusion: red.difusion, destino: macTexto(trama.destino), origen: macTexto(trama.origen), protocolo: trama.protocolo, esDifusion: trama.esDifusion ? 'si' : 'no', relleno: trama.relleno, tamano: trama.tamano, binario: trama.octeto.toString(2).padStart(8, '0'), tipoDecimal: trama.tipoDecimal, tope: csma.tope, valores: csma.valores, espera: String(csma.espera).replace('.', ','), quien: csma.quien, aplica: csma.enlace.aplica ? 'si' : 'no' };
}
