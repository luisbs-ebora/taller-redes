// Analiza.js — «Analiza la red» (1.º ASIR · PAR, Tema 1): genera un caso distinto por semilla y lo corrige.
// Ocho bloques, uno o dos por sección de los apuntes: tipos de red y conmutación (sección 1), topologías y arquitectura
// por capas (2), números, máscaras y direcciones (3), dispositivos y capas (4), encapsulamiento (5) y, de la sección 6,
// dominios de colisión y de difusión, la trama Ethernet II y el retroceso de CSMA/CD.
// Las reglas son las de los apuntes: hub = un dominio de colisión; switch = uno por puerto; router = uno por interfaz
// y separa la difusión; trama de 64 a 1518 bytes; espera de 0 a 2ⁿ − 1 ranuras (tope en n = 10) de 512 tiempos de bit.
// Los bloques de las secciones 1 a 3 salen de las hojas de ejercicios 1, 2 y 3 y de sus solucionarios.

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

const TOPOLOGIAS = [
  ['Cada equipo tiene su propio cable hasta un único switch.', 'Estrella'],
  ['Hay un switch por planta y todos se unen a un switch central.', 'Estrella extendida'],
  ['Todos los equipos comparten un cable coaxial con un terminador en cada punta.', 'Bus'],
  ['Cada nodo se une con el siguiente hasta cerrar un círculo; en la red del operador es doble y de fibra.', 'Anillo'],
  ['Cada sede tiene enlaces con varias otras, de modo que hay caminos alternativos.', 'Malla'],
];
const LOGICAS = [
  ['unos equipos conectados a un hub', 'Difusión', 'El hub repite cada señal por todos sus puertos: físicamente es una estrella, pero lógicamente se comporta como un bus.'],
  ['unos equipos conectados a un switch', 'Conmutación punto a punto', 'El switch envía cada trama solo por el puerto del destino.'],
  ['una red Wi‑Fi', 'Difusión', 'Todos comparten el mismo canal: lo que transmite uno lo reciben todos.'],
  ['una red Token Ring', 'Paso de testigo', 'Solo transmite quien tiene el testigo, aunque físicamente fuera una estrella.'],
];

// ---------- Sección 1 (hoja de ejercicios 1): tipos de red, elementos, conmutación y velocidad ----------
const REDES = [
  ['La red de los 25 ordenadores de la sede, conectados por cable a los switches', 'LAN', 'Privada', 'Cableada', 'Es la red de un edificio, de la propia empresa y por cable.'],
  ['La conexión que une las sedes de tres ciudades a través de un operador', 'WAN', 'Pública', 'Cableada', 'Une ciudades distintas y la red es del operador: la empresa solo contrata el servicio. Lo normal es que vaya por fibra.'],
  ['Los auriculares Bluetooth que un comercial usa con su móvil', 'PAN', 'Privada', 'Inalámbrica', 'Son unos pocos metros alrededor de una persona.'],
  ['La red Wi‑Fi para clientes de la sala de espera de la oficina', 'WLAN', 'Privada', 'Inalámbrica', 'Aunque la usen los clientes, es de la empresa, que decide quién entra.'],
  ['La red móvil 5G con la que los comerciales se conectan desde la carretera', 'WAN', 'Pública', 'Inalámbrica', 'Cubre todo el país y es de un operador que presta servicio por contrato.'],
  ['La fibra que une dos edificios de la empresa separados 300 m dentro de la misma parcela', 'LAN', 'Privada', 'Cableada', 'Dos edificios próximos de la misma organización (un campus) siguen siendo una LAN, aunque el enlace sea de fibra.'],
  ['El anillo de fibra propio con el que un ayuntamiento une sus sedes repartidas por la ciudad', 'MAN', 'Privada', 'Cableada', 'Abarca una ciudad: es una red metropolitana. Aquí el anillo es del propio ayuntamiento.'],
  ['El reloj inteligente enlazado por Bluetooth con el móvil', 'PAN', 'Privada', 'Inalámbrica', 'Son unos pocos metros alrededor de una persona.'],
  ['Los portátiles de la oficina conectados al punto de acceso Wi‑Fi de la empresa', 'WLAN', 'Privada', 'Inalámbrica', 'Es la versión inalámbrica de la LAN de la empresa.'],
  ['La línea de fibra del proveedor de Internet que llega hasta el router de la sede', 'WAN', 'Pública', 'Cableada', 'Es la red del operador, que presta servicio a terceros mediante contrato.'],
];
const FUNCIONAL = [
  ['Los empleados guardan sus documentos en un servidor de ficheros de la sede', 'cs'],
  ['Dos comerciales se pasan una presentación compartiendo una carpeta directamente entre sus portátiles', 'p2p'],
  ['Todos los puestos imprimen a través de un servidor de impresión', 'cs'],
  ['Cuatro equipos comparten archivos entre sí y ninguno hace de equipo central', 'p2p'],
  ['Los navegadores de la oficina piden las páginas a un servidor web', 'cs'],
];
const CONMUTACION = [
  ['Se reserva un camino exclusivo entre los dos extremos durante toda la comunicación, aunque nadie transmita', 'circuitos'],
  ['La información se divide en fragmentos independientes que pueden ir por caminos distintos y se reensamblan en el destino', 'paquetes'],
  ['Es la de la red telefónica tradicional', 'circuitos'],
  ['Es la aportación clave de ARPANET en 1969', 'paquetes'],
  ['Aprovecha mejor los enlaces cuando el tráfico va a ráfagas, como al navegar', 'paquetes'],
];
const TECNOLOGIA = [
  ['La Wi‑Fi de la biblioteca, que va más lenta cuantos más alumnos se conectan', 'difusion', 'Todos comparten el mismo canal de radio y solo puede transmitir uno a la vez: cuantos más son, menos toca a cada uno.'],
  ['Los enlaces entre los routers de un operador', 'punto', 'Cada enlace une solo dos equipos y el mensaje va de router en router hasta el destino.'],
  ['Una Ethernet antigua con todos los equipos en el mismo cable coaxial', 'difusion', 'Todos comparten el mismo cable: lo que transmite uno llega a todos.'],
  ['El camino que muestra tracert, salto a salto, hasta un servidor de Internet', 'punto', 'Fuera de la red local los paquetes viajan de router en router por enlaces que unen solo dos equipos.'],
];
const ELEMENTOS = [
  ['Un switch', 'intermedio'], ['Una impresora de red', 'final'], ['Un cortafuegos', 'intermedio'], ['La fibra óptica', 'medio'], ['El DNS', 'servicio'],
  ['Un punto de acceso Wi‑Fi', 'intermedio'], ['Un servidor', 'final'], ['Un teléfono IP', 'final'], ['El DHCP', 'servicio'], ['Un router', 'intermedio'],
  ['El cable de par trenzado', 'medio'], ['Una cámara de videovigilancia IP', 'final'], ['Las ondas de radio de la Wi‑Fi', 'medio'],
];
export const NOMBRES_ELEMENTO = { final: 'Dispositivo final', intermedio: 'Dispositivo intermedio', medio: 'Medio de transmisión', servicio: 'Servicio o protocolo' };
const HITOS = [
  ['La patente del teléfono', 1876, '1876'], ['La primera conexión de ARPANET', 1969, '1969'], ['El desarrollo de Ethernet en Xerox PARC', 1973, '1973'],
  ['La adopción de TCP/IP en ARPANET', 1983, '1983'], ['La World Wide Web del CERN', 1990, '1989-1991'], ['La norma IEEE 802.11, base de la Wi‑Fi', 1997, '1997'],
  ['El lanzamiento comercial de la red 5G en España', 2019, '2019'],
];
const IPS = [['10.4.7.20', true], ['172.16.5.9', true], ['172.31.200.1', true], ['192.168.1.50', true], ['172.32.0.5', false], ['192.169.1.1', false], ['8.8.8.8', false], ['11.0.0.7', false], ['172.15.9.9', false], ['193.168.1.1', false]];

// ---------- Sección 2 (hoja de ejercicios 2): topologías comparadas y arquitectura por capas ----------
export const EFECTOS = { toda: 'Toda la red se queda sin servicio', uno: 'Solo afecta a ese equipo', rama: 'Se queda sin red esa rama; el resto sigue', otro: 'Nadie se queda sin red: el tráfico va por otro camino' };
const FALLOS = [
  ['En un bus, se corta el cable troncal', 'toda', 'Todos comparten ese único cable: si se corta, la señal deja de llegar o rebota y afecta a todos.'],
  ['En un bus, se avería uno de los equipos', 'uno', 'El cable troncal sigue entero: un equipo averiado no afecta al resto.'],
  ['En una estrella, se avería el cable de un equipo', 'uno', 'Cada equipo tiene su propio cable hasta el dispositivo central: solo se queda sin red ese equipo.'],
  ['En una estrella, falla el switch central', 'toda', 'El dispositivo central es un punto único de fallo.'],
  ['En un anillo simple, se corta un enlace', 'toda', 'En un anillo simple, la caída de un nodo o de un enlace interrumpe la comunicación.'],
  ['En una estrella extendida, falla el switch de la segunda planta', 'rama', 'Un switch intermedio caído deja sin servicio a toda su rama; las demás plantas siguen funcionando.'],
  ['En una malla, se corta un enlace', 'otro', 'Hay caminos alternativos: el tráfico va por otra ruta.'],
  ['En un anillo doble de fibra, se corta uno de los dos anillos', 'otro', 'El tráfico puede circular en sentido contrario por el otro anillo.'],
];
export const CONCEPTOS = ['Protocolo', 'Servicio', 'Interfaz', 'PDU', 'Capa o nivel', 'Arquitectura propietaria', 'Arquitectura abierta'];
const DEFINICIONES = [
  ['Reglas que siguen la misma capa de dos equipos distintos para entenderse', 'Protocolo'],
  ['Lo que una capa ofrece a la capa inmediatamente superior', 'Servicio'],
  ['Punto de contacto entre dos capas adyacentes de un mismo equipo', 'Interfaz'],
  ['Bloque de datos más la información de control que intercambian dos capas pares', 'PDU'],
  ['Conjunto de funciones relacionadas que resuelve una parte de la comunicación', 'Capa o nivel'],
  ['Arquitectura de un fabricante concreto, como SNA o AppleTalk', 'Arquitectura propietaria'],
  ['Arquitectura cuyas especificaciones son públicas, como TCP/IP', 'Arquitectura abierta'],
];
const WAN = [
  ['Un enlace dedicado entre dos sedes', 'Punto a punto'],
  ['Las sucursales solo se conectan con la sede central, y todo lo que se envían entre ellas pasa por la central', 'Concentrador y radios'],
  ['Varias sedes con enlaces entre sí, para que el fallo de un enlace no aísle a ninguna', 'Malla'],
];

// ---------- Sección 3 (hoja de ejercicios 3): numeración, máscaras, AND y direcciones MAC ----------
const MASCARAS = [['255.255.255.0', true], ['255.255.240.0', true], ['255.255.255.192', true], ['255.254.0.0', true], ['255.255.255.250', false], ['255.0.255.0', false], ['255.255.255.193', false], ['255.240.255.0', false], ['255.255.0.255', false]];
export const ERRORES_DIR = { bien: 'Es correcta', octeto: 'No: un octeto pasa de 255', digitos: 'No: le faltan o le sobran dígitos', nohex: 'No: tiene un dígito que no es hexadecimal' };
const DIRECCIONES_RARAS = [
  ['la dirección IPv4 192.168.1.256', 'octeto', '256 necesitaría 9 bits: un octeto tiene 8 y va de 0 a 255.'],
  ['la dirección IPv4 10.300.2.1', 'octeto', '300 no cabe en un octeto, que va de 0 a 255.'],
  ['la MAC 00-1A-2B-3C-4D', 'digitos', 'Solo tiene 10 dígitos: una MAC son 12 dígitos hexadecimales (48 bits, 6 octetos).'],
  ['la MAC 00-1A-2B-3C-4D-5E-6F', 'digitos', 'Tiene 14 dígitos: una MAC son 12 dígitos hexadecimales (48 bits, 6 octetos).'],
  ['la MAC 00-1A-2G-3C-4D-5E', 'nohex', 'G no es un dígito hexadecimal: van del 0 al 9 y de la A a la F.'],
  ['la MAC 3C-52-0A-10-20-30', 'bien', 'Son 12 dígitos hexadecimales válidos.'],
  ['la MAC 08:00:27:5c:e0:01', 'bien', 'En Linux se escribe con dos puntos y en minúsculas, pero es la misma notación: 12 dígitos hexadecimales.'],
  ['la dirección IPv4 172.16.45.130', 'bien', 'Sus cuatro octetos están entre 0 y 255.'],
];
const BITS = [['una dirección IPv4', 32], ['una dirección MAC', 48], ['una dirección IPv6', 128], ['un octeto', 8], ['un dígito hexadecimal', 4], ['un número de puerto TCP o UDP', 16]];
const OUIS = [[0x00, 0x1A, 0x2B], [0x3C, 0x52, 0x0A], [0x08, 0x00, 0x27], [0xB8, 0x27, 0xEB], [0x00, 0x50, 0x56]];
const aOctetos = n => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const deOctetos = o => ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
const mascaraDe = p => (p ? (0xffffffff << (32 - p)) >>> 0 : 0);
const bin8 = v => v.toString(2).padStart(8, '0');
export const puntos = o => o.join('.');

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

  const topo = { fisica: r.de(TOPOLOGIAS), logica: r.de(LOGICAS), sedes: r.n(4, 9) };   // sección 2, también al final

  // Secciones 1, 2 y 3 (hojas de ejercicios 1, 2 y 3). También al final, para no cambiar los casos anteriores.
  const red0 = r.de(REDES), red1 = r.de(REDES.filter(x => x[1] !== red0[1]));
  const hito0 = r.de(HITOS), hito1 = r.de(HITOS.filter(x => x[1] !== hito0[1]));
  const [cantidad, unidad] = r.de([[500, 'MB'], [800, 'MB'], [100, 'MB'], [1, 'GB'], [2, 'GB'], [4, 'GB'], [5, 'GB']]);
  const megabits = cantidad * (unidad === 'GB' ? 8000 : 8), velocidad = r.de([100, 100, 1000, 10]);
  const tipos = { redes: [red0, red1], funcional: r.de(FUNCIONAL), conmutacion: r.de(CONMUTACION), tecnologia: r.de(TECNOLOGIA), elemento: r.de(ELEMENTOS), hitos: [hito0, hito1],
    copia: { cantidad, unidad, megabits, velocidad, segundos: megabits / velocidad }, ip: r.de(IPS) };

  const fallo0 = r.de(FALLOS), fallo1 = r.de(FALLOS.filter(x => x[1] !== fallo0[1]));
  const def0 = r.de(DEFINICIONES), def1 = r.de(DEFINICIONES.filter(x => x !== def0));
  const arq = { enlaces: { topologia: r.de(['estrella', 'anillo simple']), n: r.n(5, 12) }, fallos: [fallo0, fallo1], definiciones: [def0, def1], wan: r.de(WAN) };

  const prefijo = r.de([18, 19, 20, 21, 22, 26, 27, 28]);
  const ip = prefijo <= 22 ? [172, 16 + r.n(0, 15), r.n(1, 254), r.n(1, 254)] : [192, 168, r.n(0, 254), r.n(1, 254)];
  const mascara = mascaraDe(prefijo), bloque = 2 ** (32 - prefijo), redDir = (deOctetos(ip) & mascara) >>> 0;
  const misma = r.prob(0.5), salto = r.n(1, bloque - 2);
  const otra = misma ? redDir + (redDir + salto === deOctetos(ip) ? (salto % (bloque - 2)) + 1 : salto) : redDir + bloque + salto;
  const mac1 = [...r.de(OUIS), byte(), byte(), byte()], mismoFab = r.prob(0.5);
  const mac2 = [...(mismoFab ? mac1.slice(0, 3) : r.de(OUIS.filter(o => o[0] !== mac1[0] || o[1] !== mac1[1])) ), byte(), byte(), byte()];
  const grupo = r.prob(0.5), primero = (r.n(0, 127) << 1) | (grupo ? 1 : 0);
  const num = {
    dec: r.n(17, 254), bin: r.n(17, 254), hex: r.n(16, 255), aHex: r.n(16, 255),
    prefijoDe: r.de([8, 12, 16, 19, 20, 22, 24, 25, 26, 27, 30]), mascaraDe: r.de([10, 16, 18, 20, 21, 23, 24, 26, 28]),
    valida: r.de(MASCARAS), red: { ip, prefijo, mascara: aOctetos(mascara), red: aOctetos(redDir) }, otra: { ip: aOctetos(otra >>> 0), misma },
    rara: r.de(DIRECCIONES_RARAS), mac1, mac2, mismoFab, ig: { mac: [primero, byte(), byte(), byte(), byte(), byte()], grupo }, bits: r.de(BITS), comb: r.de([4, 8, 10, 16]),
  };

  return {
    semilla,
    topo, tipos, arq, num,
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
  const { red, trama, csma, capas, encap, extra, topo } = caso;
  const partes = red.interfaces.map((i, k) => i.tipo === 'hub'
    ? `interfaz ${k + 1}: 1 (el hub y todo lo que cuelga de él)`
    : `interfaz ${k + 1}: ${i.pcs + (i.hub ? 1 : 0) + 1} (${es(i.pcs, 'puerto con PC', 'puertos con PC')}${i.hub ? ', 1 puerto con el hub' : ''} y 1 puerto hacia el router)`);
  const que = csma.quien === 'chocan' ? 'Vuelven a chocar' : `Envía primero ${csma.quien}`;
  const { tipos, arq, num } = caso;
  const sinEspacios = t => String(t ?? '').replace(/\s/g, '');
  const mascaraTexto = p => puntos(aOctetos(mascaraDe(p)));
  const enBinario = o => o.map(bin8).join('.');
  const parcial = Math.min(3, Math.floor(num.red.prefijo / 8));   // el octeto donde la máscara deja de ser 255
  const antes = tipos.hitos[0][1] < tipos.hitos[1][1] ? 0 : 1;
  const nuevos = [
    ...tipos.redes.flatMap((x, i) => [
      { id: `red${i}alc`, ok: resp[`red${i}alc`] === x[1], correcta: x[1], porque: x[4] },
      { id: `red${i}tit`, ok: resp[`red${i}tit`] === x[2], correcta: x[2], porque: x[2] === 'Privada' ? 'Es privada la red que pertenece a una organización, que la gestiona y decide quién accede.' : 'Es pública la red que pertenece a un operador que presta servicio a terceros mediante contrato, aunque la empresa pague por usarla.' },
      { id: `red${i}med`, ok: resp[`red${i}med`] === x[3], correcta: x[3], porque: x[3] === 'Cableada' ? 'Usa un medio guiado (par trenzado o fibra).' : 'Usa ondas de radio.' },
    ]),
    { id: 'funcional', ok: resp.funcional === tipos.funcional[1], correcta: tipos.funcional[1] === 'cs' ? 'Cliente-servidor' : 'Entre iguales (P2P)', porque: 'Cliente-servidor: unos equipos ofrecen el servicio y otros lo piden. Entre iguales: todos hacen a la vez de cliente y de servidor.' },
    { id: 'conmutacion', ok: resp.conmutacion === tipos.conmutacion[1], correcta: tipos.conmutacion[1] === 'circuitos' ? 'Conmutación de circuitos' : 'Conmutación de paquetes', porque: 'Circuitos: camino exclusivo reservado durante toda la comunicación (telefonía tradicional). Paquetes: fragmentos independientes que comparten los enlaces (ARPANET, Internet).' },
    { id: 'tecnologia', ok: resp.tecnologia === tipos.tecnologia[1], correcta: tipos.tecnologia[1] === 'difusion' ? 'Difusión' : 'Punto a punto', porque: tipos.tecnologia[2] },
    { id: 'elemento', ok: resp.elemento === tipos.elemento[1], correcta: NOMBRES_ELEMENTO[tipos.elemento[1]], porque: 'Finales: origen o destino de la información. Intermedios: conectan y dirigen el tráfico (switch, router, punto de acceso, cortafuegos). Medios: por donde viaja la señal. Servicios y protocolos: el software que hace útil la red.' },
    { id: 'hito', ok: resp.hito === String(antes), correcta: tipos.hitos[antes][0], porque: `${tipos.hitos[0][0]}: ${tipos.hitos[0][2]}. ${tipos.hitos[1][0]}: ${tipos.hitos[1][2]}.` },
    { id: 'copia', ok: Math.abs(decimal(resp.copia) - tipos.copia.segundos) < 0.06, correcta: String(tipos.copia.segundos).replace('.', ',') + ' s', porque: `${tipos.copia.cantidad} ${tipos.copia.unidad} = ${tipos.copia.cantidad} × ${tipos.copia.unidad === 'GB' ? '8000' : '8'} = ${tipos.copia.megabits} Mbit. ${tipos.copia.megabits} ÷ ${tipos.copia.velocidad} = ${String(tipos.copia.segundos).replace('.', ',')} s. Ojo: la velocidad va en bits y el tamaño en bytes (1 B = 8 b).` },
    { id: 'ipPrivada', ok: resp.ipPrivada === (tipos.ip[1] ? 'privada' : 'publica'), correcta: tipos.ip[1] ? 'Privada' : 'Pública', porque: 'Son privadas las que empiezan por 10, las de 172.16 a 172.31 y las 192.168. El resto son públicas.' },

    { id: 'enlaces', ok: entero(resp.enlaces) === arq.enlaces.n, correcta: String(arq.enlaces.n), porque: arq.enlaces.topologia === 'estrella' ? 'En la estrella hay un enlace por equipo, hasta el dispositivo central.' : 'En el anillo cada equipo se une con el siguiente hasta cerrar el círculo: tantos enlaces como equipos.' },
    ...arq.fallos.map((f, i) => ({ id: 'fallo' + i, ok: resp['fallo' + i] === f[1], correcta: EFECTOS[f[1]], porque: f[2] })),
    ...arq.definiciones.map((d, i) => ({ id: 'def' + i, ok: resp['def' + i] === d[1], correcta: d[1], porque: 'El protocolo es horizontal (la misma capa en dos equipos); la interfaz y el servicio son verticales (capas contiguas del mismo equipo).' })),
    { id: 'wan', ok: resp.wan === arq.wan[1], correcta: arq.wan[1], porque: 'Punto a punto: un enlace entre dos sedes. Concentrador y radios (hub and spoke): una estrella con la sede central en medio. Malla: enlaces entre varias sedes.' },

    { id: 'nDecBin', ok: sinEspacios(resp.nDecBin) === bin8(num.dec), correcta: bin8(num.dec), porque: `Con los pesos 128, 64, 32, 16, 8, 4, 2 y 1: ${[128, 64, 32, 16, 8, 4, 2, 1].filter(w => num.dec & w).join(' + ')} = ${num.dec}.` },
    { id: 'nBinDec', ok: entero(resp.nBinDec) === num.bin, correcta: String(num.bin), porque: `Se suman los pesos donde hay un 1: ${[128, 64, 32, 16, 8, 4, 2, 1].filter(w => num.bin & w).join(' + ')} = ${num.bin}.` },
    { id: 'nHexDec', ok: entero(resp.nHexDec) === num.hex, correcta: String(num.hex), porque: `${hex2(num.hex)} = ${num.hex >> 4}·16 + ${num.hex & 15} = ${num.hex}.` },
    { id: 'nDecHex', ok: soloHex(resp.nDecHex).replace(/^0+(?=.)/, '') === num.aHex.toString(16).toUpperCase(), correcta: hex2(num.aHex), porque: `${num.aHex} : 16 = ${num.aHex >> 4} y resto ${num.aHex & 15}: ${hex2(num.aHex)[0]} y ${hex2(num.aHex)[1]}.` },
    { id: 'nPrefijo', ok: entero(String(resp.nPrefijo ?? '').replace('/', '')) === num.prefijoDe, correcta: '/' + num.prefijoDe, porque: `En binario es ${enBinario(aOctetos(mascaraDe(num.prefijoDe)))}: tiene ${num.prefijoDe} bits a 1.` },
    { id: 'nMascara', ok: sinEspacios(resp.nMascara) === mascaraTexto(num.mascaraDe), correcta: mascaraTexto(num.mascaraDe), porque: `${num.mascaraDe} unos seguidos y el resto ceros: ${enBinario(aOctetos(mascaraDe(num.mascaraDe)))}.` },
    { id: 'nValida', ok: resp.nValida === (num.valida[1] ? 'si' : 'no'), correcta: num.valida[1] ? 'Sí' : 'No', porque: `En binario es ${enBinario(num.valida[0].split('.').map(Number))}. ${num.valida[1] ? 'Los unos van seguidos y a la izquierda.' : 'Los unos no van todos seguidos a la izquierda: hay algún 0 por medio.'}` },
    { id: 'nRed', ok: sinEspacios(resp.nRed) === puntos(num.red.red), correcta: puntos(num.red.red), porque: `La máscara /${num.red.prefijo} es ${puntos(num.red.mascara)}. Los octetos con 255 se copian y los que tienen 0 quedan a 0. En el octeto ${parcial + 1}: ${bin8(num.red.ip[parcial])} AND ${bin8(num.red.mascara[parcial])} = ${bin8(num.red.red[parcial])} = ${num.red.red[parcial]}.` },
    { id: 'nMisma', ok: resp.nMisma === (num.otra.misma ? 'si' : 'no'), correcta: num.otra.misma ? 'Sí' : 'No', porque: `Al aplicarle la misma máscara, ${puntos(num.otra.ip)} da ${puntos(aOctetos((deOctetos(num.otra.ip) & deOctetos(num.red.mascara)) >>> 0))}. ${num.otra.misma ? 'Es la misma dirección de red.' : 'No coincide con ' + puntos(num.red.red) + '.'}` },
    { id: 'nRara', ok: resp.nRara === num.rara[1], correcta: ERRORES_DIR[num.rara[1]], porque: num.rara[2] },
    { id: 'nOui', ok: soloHex(resp.nOui) === num.mac1.slice(0, 3).map(hex2).join(''), correcta: macTexto(num.mac1.slice(0, 3)), porque: 'El OUI son los 3 primeros octetos (24 bits): identifican al fabricante. Los otros 3 los asigna el fabricante a cada interfaz.' },
    { id: 'nFab', ok: resp.nFab === (num.mismoFab ? 'si' : 'no'), correcta: num.mismoFab ? 'Sí' : 'No', porque: `Sus OUI son ${macTexto(num.mac1.slice(0, 3))} y ${macTexto(num.mac2.slice(0, 3))}: ${num.mismoFab ? 'coinciden' : 'son distintos'}.` },
    { id: 'nIG', ok: resp.nIG === (num.ig.grupo ? 'grupo' : 'individual'), correcta: num.ig.grupo ? 'De grupo' : 'Individual', porque: `El primer octeto es ${hex2(num.ig.mac[0])} = ${bin8(num.ig.mac[0])}: su bit de menor peso es ${num.ig.mac[0] & 1}. Con 0 es individual (unicast); con 1, de grupo (multicast o difusión).` },
    { id: 'nBits', ok: entero(resp.nBits) === num.bits[1], correcta: String(num.bits[1]), porque: 'Un dígito hexadecimal, 4 bits; un octeto, 8; un puerto, 16; una IPv4, 32; una MAC, 48; una IPv6, 128.' },
    { id: 'nComb', ok: entero(String(resp.nComb ?? '').replace(/\./g, '')) === 2 ** num.comb, correcta: String(2 ** num.comb), porque: `Con n bits hay 2ⁿ combinaciones: 2^${num.comb} = ${2 ** num.comb}.` },
  ];
  const lista = [
    ...nuevos,
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
    { id: 'topoFisica', ok: resp.topoFisica === topo.fisica[1], correcta: topo.fisica[1], porque: 'Bus: un cable compartido. Anillo: un círculo cerrado. Estrella: todos a un dispositivo central. Estrella extendida: varias estrellas unidas por un switch superior. Malla: enlaces redundantes entre nodos.' },
    { id: 'topoLogica', ok: resp.topoLogica === topo.logica[1], correcta: topo.logica[1], porque: topo.logica[2] },
    { id: 'malla', ok: entero(resp.malla) === topo.sedes * (topo.sedes - 1) / 2, correcta: String(topo.sedes * (topo.sedes - 1) / 2), porque: `En una malla completa hacen falta n·(n − 1)/2 enlaces: ${topo.sedes}·${topo.sedes - 1}/2 = ${topo.sedes * (topo.sedes - 1) / 2}.` },
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
  const { red, trama, csma, capas, encap, extra, tipos, arq, num } = caso;
  const nuevas = {
    ...Object.fromEntries(tipos.redes.flatMap((x, i) => [[`red${i}alc`, x[1]], [`red${i}tit`, x[2]], [`red${i}med`, x[3]]])),
    funcional: tipos.funcional[1], conmutacion: tipos.conmutacion[1], tecnologia: tipos.tecnologia[1], elemento: tipos.elemento[1],
    hito: String(tipos.hitos[0][1] < tipos.hitos[1][1] ? 0 : 1), copia: String(tipos.copia.segundos).replace('.', ','), ipPrivada: tipos.ip[1] ? 'privada' : 'publica',
    enlaces: arq.enlaces.n, fallo0: arq.fallos[0][1], fallo1: arq.fallos[1][1], def0: arq.definiciones[0][1], def1: arq.definiciones[1][1], wan: arq.wan[1],
    nDecBin: bin8(num.dec), nBinDec: num.bin, nHexDec: num.hex, nDecHex: hex2(num.aHex), nPrefijo: '/' + num.prefijoDe, nMascara: puntos(aOctetos(mascaraDe(num.mascaraDe))),
    nValida: num.valida[1] ? 'si' : 'no', nRed: puntos(num.red.red), nMisma: num.otra.misma ? 'si' : 'no', nRara: num.rara[1], nOui: macTexto(num.mac1.slice(0, 3)),
    nFab: num.mismoFab ? 'si' : 'no', nIG: num.ig.grupo ? 'grupo' : 'individual', nBits: num.bits[1], nComb: 2 ** num.comb,
  };
  return { ...nuevas, topoFisica: caso.topo.fisica[1], topoLogica: caso.topo.logica[1], malla: caso.topo.sedes * (caso.topo.sedes - 1) / 2, fun0: extra.funciones[0][1], fun1: extra.funciones[1][1], incidencia: extra.incidencia[1], puerto: extra.servicio[1], transporte: extra.servicio[2], protoCapa: extra.protoCapa[1], cambian: 'mac', enCable: trama.tamano + 8, varVel: extra.variante[1], varMedio: extra.variante[2], ...Object.fromEntries(capas.dispositivos.map((d, i) => ['disp' + i, d.capa])), pdu: capas.pdu.pdu, direccion: capas.direccion.dir, segmento: encap.segmento, paquete: encap.paquete, tramaTam: encap.trama, protoIP: encap.protocolo, tramas: encap.tramas, ttlFinal: encap.ttlFinal, colision: red.colision, difusion: red.difusion, destino: macTexto(trama.destino), origen: macTexto(trama.origen), protocolo: trama.protocolo, esDifusion: trama.esDifusion ? 'si' : 'no', relleno: trama.relleno, tamano: trama.tamano, binario: trama.octeto.toString(2).padStart(8, '0'), tipoDecimal: trama.tipoDecimal, tope: csma.tope, valores: csma.valores, espera: String(csma.espera).replace('.', ','), quien: csma.quien, aplica: csma.enlace.aplica ? 'si' : 'no' };
}
