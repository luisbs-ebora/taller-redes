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

  return {
    semilla,
    capas: { dispositivos, pdu: r.de(PDUS), direccion: r.de(DIRECCIONES) },
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
  const { red, trama, csma, capas, encap } = caso;
  const partes = red.interfaces.map((i, k) => i.tipo === 'hub'
    ? `interfaz ${k + 1}: 1 (el hub y todo lo que cuelga de él)`
    : `interfaz ${k + 1}: ${i.pcs + (i.hub ? 1 : 0) + 1} (${es(i.pcs, 'puerto con PC', 'puertos con PC')}${i.hub ? ', 1 puerto con el hub' : ''} y 1 puerto hacia el router)`);
  const que = csma.quien === 'chocan' ? 'Vuelven a chocar' : `Envía primero ${csma.quien}`;
  const lista = [
    ...capas.dispositivos.map((d, i) => ({ id: 'disp' + i, ok: entero(resp['disp' + i]) === d.capa, correcta: `Capa ${d.capa} (${CAPAS[d.capa - 1]})`, porque: d.porque })),
    { id: 'pdu', ok: resp.pdu === capas.pdu.pdu, correcta: capas.pdu.pdu, porque: 'De arriba abajo: datos, segmento (TCP) o datagrama (UDP), paquete, trama y bits.' },
    { id: 'direccion', ok: resp.direccion === capas.direccion.dir, correcta: capas.direccion.dir, porque: capas.direccion.porque },
    { id: 'segmento', ok: entero(resp.segmento) === encap.segmento, correcta: String(encap.segmento), porque: `${encap.app} + ${encap.cab} de cabecera ${encap.tcp ? 'TCP' : 'UDP'} = ${encap.segmento} bytes.` },
    { id: 'paquete', ok: entero(resp.paquete) === encap.paquete, correcta: String(encap.paquete), porque: `${encap.segmento} + 20 de cabecera IPv4 = ${encap.paquete} bytes.` },
    { id: 'tramaTam', ok: entero(resp.tramaTam) === encap.trama, correcta: String(encap.trama), porque: `${encap.paquete} + 14 de cabecera Ethernet + 4 de FCS = ${encap.trama} bytes.` },
    { id: 'protoIP', ok: entero(resp.protoIP) === encap.protocolo, correcta: String(encap.protocolo), porque: 'El campo Protocolo de IPv4 vale 1 para ICMP, 6 para TCP y 17 para UDP.' },
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
    { id: 'binario', ok: String(resp.binario ?? '').replace(/\s/g, '') === trama.octeto.toString(2).padStart(8, '0'), correcta: trama.octeto.toString(2).padStart(8, '0'), porque: `Cada cifra hexadecimal son 4 bits: ${hex2(trama.octeto)[0]} = ${parseInt(hex2(trama.octeto)[0], 16).toString(2).padStart(4, '0')} y ${hex2(trama.octeto)[1]} = ${parseInt(hex2(trama.octeto)[1], 16).toString(2).padStart(4, '0')}.` },
    { id: 'tipoDecimal', ok: entero(resp.tipoDecimal) === trama.tipoDecimal, correcta: String(trama.tipoDecimal), porque: `0x${trama.tipo} = ${[...trama.tipo].map((c, i) => `${parseInt(c, 16)}·16${['³', '²', '¹', '⁰'][i]}`).join(' + ')} = ${trama.tipoDecimal}. Es 1536 o más, así que el campo es un Tipo (Ethernet II) y no una longitud.` },
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
  const { red, trama, csma, capas, encap } = caso;
  return { ...Object.fromEntries(capas.dispositivos.map((d, i) => ['disp' + i, d.capa])), pdu: capas.pdu.pdu, direccion: capas.direccion.dir, segmento: encap.segmento, paquete: encap.paquete, tramaTam: encap.trama, protoIP: encap.protocolo, tramas: encap.tramas, ttlFinal: encap.ttlFinal, colision: red.colision, difusion: red.difusion, destino: macTexto(trama.destino), origen: macTexto(trama.origen), protocolo: trama.protocolo, esDifusion: trama.esDifusion ? 'si' : 'no', relleno: trama.relleno, tamano: trama.tamano, binario: trama.octeto.toString(2).padStart(8, '0'), tipoDecimal: trama.tipoDecimal, tope: csma.tope, valores: csma.valores, espera: String(csma.espera).replace('.', ','), quien: csma.quien, aplica: csma.enlace.aplica ? 'si' : 'no' };
}
