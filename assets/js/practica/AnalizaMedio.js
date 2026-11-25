// AnalizaMedio.js — «Analiza el medio» (1.º ASIR · PAR, Tema 2, secciones 1 a 4): genera un caso por semilla y lo corrige.
// Cinco bloques: ancho de banda y velocidad, cables y fibra (sección 1), cableado estructurado (sección 2), informes de un
// certificador (secciones 1, 2 y 3) y redes inalámbricas (sección 4). La sección 3 (directo, cruzado, consola y
// comprobadores) ya la practica el bloque de ASIR de «Haz el latiguillo».
// Datos y criterios sacados de los apuntes y de las diapositivas de las sesiones 1 a 4 del Tema 2 de PAR:
//  · 1 byte = 8 bits y prefijos decimales; Shannon C = B · log₂(1 + S/N); 3 dB = la mitad, 10 dB = la décima parte.
//  · Categorías 5e/6/6A/7/7A/8 con su clase ISO; cat. 6 lleva 10GBASE-T solo hasta unos 55 m; OM3 300 m y OM4 400 m a 10 Gbit/s.
//  · Canal de 100 m = 90 m de enlace permanente + 10 m de latiguillos; 1 U = 44,45 mm; un puesto por cada 10 m² y dos
//    tomas por puesto; un armario por cada 1000 m²; etiquetas del tipo 1A-B07.
//  · −50 dBm excelente, −67 dBm mínimo para voz y vídeo, por debajo de −80 dBm inestable; 100 mW = 20 dBm de PIRE máximo
//    en 2,4 GHz; solo 1, 6 y 11 no se solapan.
// Los límites de los informes del certificador son orientativos (los muestra el propio informe): lo que se practica es
// leerlos, no sabérselos.
import { azar } from './Analiza.js';

const coma = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('es-ES', { maximumFractionDigits: d, useGrouping: false });
const barajar = (lista, r) => { const l = lista.slice(); for (let i = l.length - 1; i > 0; i--) { const j = r.n(0, i); [l[i], l[j]] = [l[j], l[i]]; } return l; };
const mismas = lista => lista.map(x => [x, x]);
const sacar = (lista, n, r) => barajar(lista, r).slice(0, n);

// Campos. «correcta» es el valor que se compara; «muestra», cómo se enseña al corregir.
const lista = (id, etiqueta, opciones, correcta, porque, extra = {}) => ({ id, etiqueta, tipo: 'lista', opciones, correcta, muestra: (opciones.find(o => o[0] === correcta) || [, correcta])[1], porque, ...extra });
const numero = (id, etiqueta, correcta, porque, { tol = 0.05, dec = 2, unidad = '', ayuda } = {}) => ({ id, etiqueta, tipo: 'numero', correcta, tol, muestra: coma(correcta, dec) + (unidad ? ' ' + unidad : ''), porque, ayuda });
const texto = (id, etiqueta, correcta, porque, { normal, ayuda, ancho = 14 } = {}) => ({ id, etiqueta, tipo: 'texto', correcta, normal, muestra: correcta, porque, ayuda, ancho });

/* ---------- Bloque 1 · Ancho de banda y velocidad ---------- */
const CONCEPTOS = [
  ['Un cable de categoría 6 está especificado hasta 250 MHz.', 'Ancho de banda'],
  ['Un cable de categoría 6A está especificado hasta 500 MHz.', 'Ancho de banda'],
  ['1000BASE-T transmite a 1 Gbit/s.', 'Tasa de transferencia'],
  ['10GBASE-SR transmite a 10 Gbit/s.', 'Tasa de transferencia'],
  ['Una copia de archivos por un enlace de 1 Gbit/s va de verdad a unos 900 Mbit/s.', 'Throughput'],
  ['Medido con iperf3 entre dos equipos, el enlace da 940 Mbit/s.', 'Throughput'],
  ['La barra de descarga del navegador marca lo que llega del archivo, sin cabeceras.', 'Goodput'],
];
const PORQUE_CONCEPTO = 'Ancho de banda: rango de frecuencias del medio, en Hz. Tasa de transferencia: velocidad nominal de la tecnología, en bit/s. Throughput: lo que se consigue de verdad, con cabeceras y reintentos. Goodput: solo los datos útiles para la aplicación.';

function bloqueVelocidad(r) {
  const conceptos = sacar(CONCEPTOS, 2, r);
  const enlace = r.de([['100 Mbit/s', 100], ['1 Gbit/s', 1000], ['2,5 Gbit/s', 2500], ['10 Gbit/s', 10000]]);
  const visto = r.de([112, 110, 96, 87, 58, 11]);
  const archivo = r.de([[4, 'GB', 32000], [2, 'GB', 16000], [750, 'MB', 6000], [10, 'GB', 80000]]);
  const vel = r.de([[100, '100 Mbit/s'], [1000, '1 Gbit/s'], [10000, '10 Gbit/s']]);
  const B = r.de([1, 2, 4, 5, 10, 20]), SN = r.de([3, 7, 15, 31, 63, 127, 255, 1023]), bits = Math.log2(SN + 1);
  const potencia = r.de([100, 200, 80, 40]), perdida = r.de([[3, 2], [6, 4], [10, 10], [13, 20], [20, 100]]);
  const duplica = r.de(['B', 'SN']);
  return {
    titulo: 'Ancho de banda y velocidad', seccion: 'Sección 1',
    grupos: [
      { campos: conceptos.map((c, i) => lista('con' + i, c[0] + ' ¿De qué se habla?', mismas(['Ancho de banda', 'Tasa de transferencia', 'Throughput', 'Goodput']), c[1], PORQUE_CONCEPTO)) },
      { texto: 'Bits y bytes, con prefijos decimales (1 Mbit/s = 1 000 000 bit/s).', campos: [
        numero('mbs', `MB/s que transfiere como máximo un enlace de ${enlace[0]}`, enlace[1] / 8, `Las velocidades van en bits y los tamaños en bytes: ${enlace[0]} ÷ 8 = ${coma(enlace[1] / 8, 1)} MB/s.`, { dec: 1, unidad: 'MB/s' }),
        numero('visto', `Al copiar un archivo ves «${visto} MB/s». ¿Cuántos Mbit/s son?`, visto * 8, `${visto} MB/s × 8 = ${visto * 8} Mbit/s.`, { dec: 0, tol: 0.5, unidad: 'Mbit/s' }),
        numero('copia', `Segundos que tarda, como mínimo, en copiarse un archivo de ${archivo[0]} ${archivo[1]} por un enlace de ${vel[1]}`, archivo[2] / vel[0], `${archivo[0]} ${archivo[1]} = ${archivo[2]} Mbit; ${archivo[2]} ÷ ${vel[0]} = ${coma(archivo[2] / vel[0], 1)} s. En la realidad tarda algo más: el throughput es menor que la tasa nominal.`, { dec: 1, tol: 0.06, unidad: 's', ayuda: 'Sin contar las cabeceras. Con un decimal si hace falta.' }),
      ] },
      { texto: `Teorema de Shannon: C = B · log₂(1 + S/N). Un canal tiene ${B} MHz de ancho de banda y una relación señal/ruido S/N = ${SN}.`, campos: [
        numero('shannon', 'Capacidad máxima del canal, en Mbit/s', B * bits, `log₂(1 + ${SN}) = log₂(${SN + 1}) = ${bits}; C = ${B} MHz × ${bits} = ${B * bits} Mbit/s.`, { dec: 0, tol: 0.05, unidad: 'Mbit/s' }),
        lista('duplica', duplica === 'B' ? 'Si se duplica el ancho de banda y la S/N no cambia, la capacidad…' : 'Si se duplica la S/N y el ancho de banda no cambia, la capacidad…',
          [['doble', 'Se duplica'], ['menos', 'Aumenta, pero menos del doble'], ['igual', 'No cambia']], duplica === 'B' ? 'doble' : 'menos',
          'La capacidad es proporcional a B, pero la S/N va dentro de un logaritmo: duplicarla solo suma 1 bit por hercio, más o menos. Por eso para ir más rápido hace falta más ancho de banda o mucho menos ruido.'),
      ] },
      { texto: 'Pérdidas en decibelios: 3 dB es quedarse con la mitad de la potencia y 10 dB con la décima parte.', campos: [
        numero('db', `Una señal de ${potencia} mW pierde ${perdida[0]} dB. ¿Con cuántos mW se queda?`, potencia / perdida[1], `${perdida[0]} dB = ${perdida[0] === 6 ? '3 + 3 dB: la mitad de la mitad' : perdida[0] === 13 ? '10 + 3 dB: la décima parte y luego la mitad' : perdida[0] === 20 ? '10 + 10 dB: la décima parte de la décima parte' : perdida[0] === 3 ? 'la mitad' : 'la décima parte'}, es decir, dividir entre ${perdida[1]}: ${potencia} ÷ ${perdida[1]} = ${coma(potencia / perdida[1], 2)} mW.`, { dec: 2, tol: 0.01, unidad: 'mW' }),
      ] },
    ],
  };
}

/* ---------- Bloque 2 · Cables y fibra ---------- */
const PANTALLAS = { 'U/UTP': ['No', 'No'], 'F/UTP': ['Lámina', 'No'], 'U/FTP': ['No', 'Lámina'], 'S/FTP': ['Malla', 'Lámina'], 'SF/UTP': ['Malla + lámina', 'No'] };
const CLASES = [['5e', 'D'], ['6', 'E'], ['6A', 'EA'], ['7', 'F'], ['7A', 'FA'], ['8', 'I / II']];
const MEDIO = ['Cat. 6 U/UTP', 'Cat. 6A (U/FTP o F/UTP)', 'Cat. 6A S/FTP o fibra', 'Fibra multimodo OM3/OM4', 'Fibra monomodo OS2', 'Coaxial de 75 Ω'];
const SITUACIONES = [
  ['Los puestos de una oficina nueva, a 1 Gbit/s', 0, 'Barato, fácil de instalar y 1 Gbit/s sobrado a 100 m.'],
  ['Un punto de acceso Wi-Fi 7 a 80 m del armario', 1, '10GBASE-T a 100 m y PoE de más potencia con menos calentamiento.'],
  ['Una nave industrial con soldadoras y motores', 2, 'Hay mucho ruido electromagnético: cable apantallado con malla o, mejor aún, fibra.'],
  ['El troncal entre las plantas de un edificio, a 10 Gbit/s', 3, 'Decenas o cientos de metros a 10 Gbit/s o más: fibra multimodo.'],
  ['El enlace entre dos edificios separados 1 km', 4, 'Distancia larga y sin problemas de tierra ni rayos: fibra monomodo.'],
  ['El acceso a Internet por cable que instala el operador', 5, 'Es la infraestructura del operador (DOCSIS), con coaxial de 75 Ω.'],
];
const COLORES = [['OM3 u OM4', 'Aguamarina'], ['OM1 u OM2', 'Naranja'], ['OM5', 'Lima'], ['monomodo (OS1 u OS2)', 'Amarillo']];
const CONECTORES = [
  ['El pequeño que llevan los transceptores SFP de los switches', 'LC'], ['El cuadrado típico de la fibra hasta el hogar (FTTH)', 'SC'],
  ['El antiguo de bayoneta', 'ST'], ['El multifibra para 40 y 100 Gbit/s', 'MPO/MTP'],
];

function bloqueCables(r) {
  const nombre = r.de(Object.keys(PANTALLAS)), clase = r.de(CLASES), situacion = r.de(SITUACIONES);
  const dist10 = r.de([30, 45, 50, 70, 80, 95]);
  const tramo = r.de([120, 250, 280, 330, 380, 600, 2000]);
  const fibra = tramo <= 300 ? 'OM3' : tramo <= 400 ? 'OM4' : 'OS2';
  const color = r.de(COLORES), conector = r.de(CONECTORES);
  const coax = r.de([['las antenas de un punto de acceso Wi-Fi', '50 Ω'], ['la televisión y el acceso a Internet por cable', '75 Ω'], ['la antigua Ethernet 10BASE2', '50 Ω']]);
  return {
    titulo: 'Cables y fibra', seccion: 'Sección 1',
    grupos: [
      { texto: `Par trenzado: un cable ${nombre} según ISO/IEC 11801.`, campos: [
        lista('pGeneral', 'Pantalla general del cable', mismas(['No', 'Lámina', 'Malla', 'Malla + lámina']), PANTALLAS[nombre][0], 'En X/YTP, la letra antes de la barra es la pantalla general: U sin pantalla, F lámina, S malla, SF malla y lámina.'),
        lista('pPar', 'Pantalla de cada par', mismas(['No', 'Lámina']), PANTALLAS[nombre][1], 'La letra de después de la barra es la pantalla de cada par: UTP sin pantalla, FTP con lámina.'),
        lista('clase', `Clase ISO del canal de categoría ${clase[0]}`, mismas(CLASES.map(c => c[1])), clase[1], 'La categoría (TIA) es del cable y los componentes; la clase (ISO) es del canal instalado: 5e-D, 6-E, 6A-EA, 7-F, 7A-FA, 8-I/II.'),
        lista('diez', `¿Lleva 10GBASE-T a ${dist10} m un cable de categoría 6?`, [['si', 'Sí'], ['no', 'No']], dist10 <= 55 ? 'si' : 'no', 'La categoría 6 solo lleva 10GBASE-T hasta unos 55 m; para 10 Gbit/s a 100 m hace falta 6A.'),
      ] },
      { campos: [
        lista('medio', `¿Qué medio recomiendas? ${situacion[0]}`, MEDIO.map((m, i) => [String(i), m]), String(situacion[1]), situacion[2]),
        lista('fibra', `Fibra para un enlace de ${tramo} m a 10 Gbit/s, la más barata que llega`, [['OM3', 'Multimodo OM3'], ['OM4', 'Multimodo OM4'], ['OS2', 'Monomodo OS2']], fibra, 'A 10 Gbit/s, la OM3 llega a unos 300 m y la OM4 a unos 400 m; más allá, monomodo.'),
        lista('color', `Color habitual de la cubierta de una fibra ${color[0]}`, mismas(['Naranja', 'Aguamarina', 'Lima', 'Amarillo']), color[1], 'Orientativo: naranja OM1/OM2, aguamarina OM3/OM4, lima OM5 y amarillo la monomodo.'),
        lista('conector', `Conector de fibra: ${conector[0]}`, mismas(CONECTORES.map(c => c[1])), conector[1], 'LC en switches y SFP, SC en FTTH, ST el antiguo de bayoneta y MPO/MTP multifibra.'),
        lista('coax', `Impedancia del coaxial de ${coax[0]}`, mismas(['50 Ω', '75 Ω', '100 Ω']), coax[1], 'Coaxial de 50 Ω: antenas y Ethernet antigua. De 75 Ω: televisión y cable de los operadores. 100 Ω es la del par trenzado.'),
      ] },
    ],
  };
}

/* ---------- Bloque 3 · Cableado estructurado ---------- */
const ISO_TIA = [['CD', 'MC', 'Distribuidor de campus'], ['BD', 'IC', 'Distribuidor de edificio'], ['FD', 'HC', 'Distribuidor de planta']];
const SUBSISTEMAS = ['Instalaciones de entrada', 'Sala de equipos', 'Troncal de campus', 'Troncal de edificio', 'Armario de telecomunicaciones', 'Cableado horizontal', 'Área de trabajo'];
const PIEZAS = [
  ['La ONT del operador y las protecciones contra sobretensiones', 0], ['Los switches de núcleo, el cortafuegos y los servidores', 1],
  ['La fibra que une la nave con el edificio de oficinas', 2], ['La fibra que sube de la sala de equipos al armario de la tercera planta', 3],
  ['Los paneles de parcheo y los switches de acceso de una planta', 4], ['El cable fijo que va del panel de parcheo a cada roseta', 5],
  ['La roseta, el latiguillo y el ordenador del usuario', 6],
];
const NORMAS = [
  ['El etiquetado y la administración de la instalación', 'ANSI/TIA-606'], ['La puesta a tierra de las telecomunicaciones', 'ANSI/TIA-607'],
  ['Los espacios y canalizaciones: salas, armarios y bandejas', 'ANSI/TIA-569'], ['Las categorías y los colores T568A y T568B', 'ANSI/TIA-568'],
  ['La infraestructura de los edificios de viviendas en España', 'ICT (RD 346/2011)'], ['El equivalente europeo de la ISO/IEC 11801', 'EN 50173'],
];
const LONGITUD = {
  bien: 'Cumple', permanente: 'No: el enlace permanente pasa de 90 m', latiguillos: 'No: los latiguillos pasan de 10 m en total', canal: 'No: el canal pasa de 100 m',
};
const EQUIPOS_RACK = [['Panel de parcheo de 24 puertos', 1], ['Panel de parcheo de 48 puertos', 2], ['Organizador horizontal', 1], ['Switch de 48 puertos', 1], ['Switch de 24 puertos', 1], ['SAI', 2], ['Regleta PDU', 1], ['Bandeja para el router', 1]];

function bloqueEstructurado(r) {
  const par = r.de(ISO_TIA), deIso = r.prob(0.5);
  const piezas = sacar(PIEZAS, 2, r), norma = r.de(NORMAS);
  // Solo falla una cosa cada vez, y el canal nunca pasa de 100 m: la trampa es que eso no basta.
  const caso = r.de(['bien', 'permanente', 'latiguillos']);
  const len = caso === 'bien' ? [r.n(60, 88), r.n(1, 3), r.n(2, 5)]
    : caso === 'permanente' ? [r.n(91, 94), r.n(1, 2), r.n(1, 3)]
      : [r.n(65, 80), r.n(3, 5), r.n(7, 9)];
  const motivo = caso;
  const tamano = r.de([6, 9, 12, 15]);
  const equipos = sacar(EQUIPOS_RACK, r.n(3, 5), r).filter((e, i, l) => l.slice(0, i + 1).reduce((t, x) => t + x[1], 0) <= tamano);
  const ocupadas = equipos.reduce((t, e) => t + e[1], 0);
  const metros = r.de([180, 240, 320, 450, 600, 760]);
  const planta = r.de([1400, 2200, 2600, 3100]);
  const etiqueta = { planta: r.n(0, 4), armario: r.de(['A', 'B', 'C']), panel: r.de(['A', 'B', 'C', 'D']), puerto: r.n(1, 48) };
  const codigo = `${etiqueta.planta}${etiqueta.armario}-${etiqueta.panel}${String(etiqueta.puerto).padStart(2, '0')}`;
  const leer = r.prob(0.5);
  const otro = { planta: r.n(0, 4), armario: r.de(['A', 'B']), panel: r.de(['A', 'B', 'C']), puerto: r.n(1, 24) };
  const otroCodigo = `${otro.planta}${otro.armario}-${otro.panel}${String(otro.puerto).padStart(2, '0')}`;
  const certifica = r.prob(0.5);
  return {
    titulo: 'Cableado estructurado', seccion: 'Sección 2',
    grupos: [
      { campos: [
        lista('isotia', deIso ? `Nombre en ANSI/TIA-568 del ${par[0]} de la ISO/IEC 11801` : `Nombre en ISO/IEC 11801 del ${par[1]} de la ANSI/TIA-568`,
          deIso ? mismas(['MC', 'IC', 'HC', 'CP']) : mismas(['CD', 'BD', 'FD', 'TO']), deIso ? par[1] : par[0], `${par[0]} (ISO) = ${par[1]} (TIA): ${par[2].toLowerCase()}. CD = MC, BD = IC, FD = HC.`),
        ...piezas.map((p, i) => lista('sub' + i, `¿A qué subsistema pertenece? ${p[0]}`, SUBSISTEMAS.map((s, k) => [String(k), s]), String(p[1]), 'Entrada: frontera con el operador. Sala de equipos: equipos comunes. Troncal de campus: entre edificios; de edificio: de la sala de equipos a cada planta. Armario: concentra el horizontal de la planta. Horizontal: del panel a la toma. Área de trabajo: toma, latiguillo y equipo.')),
        lista('norma', `¿Qué norma regula esto? ${norma[0]}`, mismas(NORMAS.map(n => n[1])), norma[1], 'TIA-568 cableado y categorías; TIA-569 espacios y canalizaciones; TIA-606 administración y etiquetado; TIA-607 tierra; EN 50173 la versión europea de la ISO/IEC 11801; ICT las viviendas.'),
      ] },
      { texto: `Un puesto tiene ${len[0]} m de cable fijo del panel a la roseta, un latiguillo de ${len[1]} m en el armario y otro de ${len[2]} m hasta el PC.`, campos: [
        lista('longitud', '¿Cumple la norma?', Object.entries(LONGITUD), motivo,
          `Enlace permanente ${len[0]} m (máximo 90), latiguillos ${len[1] + len[2]} m (máximo 10 en total) y canal ${len[0] + len[1] + len[2]} m (máximo 100). Que el canal no pase de 100 m no basta: el latiguillo multifilar atenúa más y no se puede «ganar» longitud cambiando uno por otro.`),
        lista('certifica', certifica ? 'El instalador entrega una instalación nueva. ¿Qué tiene que certificar?' : '¿Qué se certifica si se quiere medir con los latiguillos reales puestos?',
          [['permanente', 'El enlace permanente'], ['canal', 'El canal']], certifica ? 'permanente' : 'canal', 'Enlace permanente: solo el cable fijo, sin latiguillos; es lo que se exige al instalador. Canal: con los latiguillos reales, del switch al equipo.'),
      ] },
      { texto: `Un armario mural de ${tamano} U lleva: ${equipos.map(e => e[0].toLowerCase() + ` (${e[1]} U)`).join(', ')}.`, campos: [
        numero('libres', 'Unidades que quedan libres', tamano - ocupadas, `${tamano} U − ${ocupadas} U ocupadas = ${tamano - ocupadas} U.`, { dec: 0, tol: 0.01, unidad: 'U' }),
        numero('mm', `Altura útil del armario en milímetros`, tamano * 44.45, `1 U = 1,75 pulgadas = 44,45 mm; ${tamano} × 44,45 = ${coma(tamano * 44.45, 2)} mm.`, { dec: 2, tol: 0.06, unidad: 'mm', ayuda: 'Con dos decimales' }),
      ] },
      { texto: `Una oficina diáfana de ${metros} m² en una planta de ${planta} m².`, campos: [
        numero('tomas', 'Tomas de usuario que recomienda la norma para la oficina', (metros / 10) * 2, `Un puesto por cada 10 m² (${metros / 10} puestos) y al menos dos tomas por puesto: ${(metros / 10) * 2} tomas.`, { dec: 0, tol: 0.01 }),
        numero('armarios', 'Armarios de planta que hacen falta, como mínimo', Math.ceil(planta / 1000), `Un armario por cada 1000 m² aproximadamente: ${planta} ÷ 1000 → ${Math.ceil(planta / 1000)}. Además, ninguna toma debe quedar a más de 90 m de cable.`, { dec: 0, tol: 0.01 }),
      ] },
      { campos: [
        leer
          ? lista('etiqueta', `Una roseta lleva la etiqueta ${codigo}. ¿A dónde llega su cable?`, barajar([
            [`ok`, `Al puerto ${etiqueta.puerto} del panel ${etiqueta.panel} del armario ${etiqueta.armario} de la planta ${etiqueta.planta}`],
            [`a`, `Al puerto ${etiqueta.puerto} del panel ${etiqueta.armario} del armario ${etiqueta.panel} de la planta ${etiqueta.planta}`],
            [`b`, `Al puerto ${etiqueta.planta} del panel ${etiqueta.panel} del armario ${etiqueta.armario} de la planta ${etiqueta.puerto}`],
            [`c`, `Al puerto ${etiqueta.puerto} del switch ${etiqueta.panel} de la planta ${etiqueta.planta}`],
          ], r), 'ok', 'Esquema de la TIA-606 de los apuntes: planta y armario (1A), guion, panel y puerto (B07). La toma lleva el mismo identificador que el puerto del panel al que va.')
          : texto('etiqueta', `Etiqueta de la toma cableada al puerto ${otro.puerto} del panel ${otro.panel} del armario ${otro.armario} de la planta ${otro.planta}`, otroCodigo,
            'Planta y armario, guion, panel y puerto con dos cifras, como 1A-B07. La misma etiqueta va en los dos extremos del cable.', { normal: v => v.toUpperCase().replace(/\s/g, '').replace(/-([A-Z])(\d)$/, (_, l, n) => `-${l}0${n}`), ayuda: 'Como 1A-B07', ancho: 10 }),
      ] },
    ],
  };
}

/* ---------- Bloque 4 · Informes del certificador ---------- */
// Límites orientativos, en el peor punto del rango de frecuencias. Cada informe los lleva escritos.
const LIMITES = {
  '6-permanente': { nombre: 'Cat. 6 · enlace permanente', il: 30.7, next: 35.3, rl: 10.0, retardo: 498, skew: 44, largo: 90 },
  '6-canal': { nombre: 'Cat. 6 · canal', il: 35.9, next: 33.1, rl: 8.0, retardo: 555, skew: 50, largo: 100 },
  '6A-permanente': { nombre: 'Cat. 6A · enlace permanente', il: 43.8, next: 26.1, rl: 6.0, retardo: 498, skew: 44, largo: 90 },
  '5e-permanente': { nombre: 'Cat. 5e · enlace permanente', il: 21.0, next: 32.3, rl: 12.0, retardo: 498, skew: 44, largo: 90 },
};
export const MEDIDAS = { ninguna: 'Ninguna: el enlace pasa', mapa: 'Mapa de cableado', largo: 'Longitud', il: 'Pérdida de inserción', next: 'NEXT', rl: 'Pérdida de retorno', skew: 'Desviación de retardo' };
export const CAUSAS = {
  ninguna: 'No hay nada que arreglar',
  mapa: 'Un hilo no hace contacto o está en el pin equivocado: hay que rehacer el conector',
  largo: 'El tramo es más largo de lo que permite la norma',
  il: 'Cable de categoría inferior a la certificada, o demasiado largo',
  next: 'Pares destrenzados más de 13 mm al conectar',
  rl: 'Conector de mala calidad o cable aplastado o doblado (bridas, curvatura)',
  skew: 'Pares con longitudes muy distintas o cables mezclados de distinto fabricante',
};
const MAPAS = ['Abierto en el pin 7', 'Abierto en el pin 2', 'Cortocircuito entre 4 y 5', 'Par dividido (3-6 con 4-5)', 'Pares cruzados 1-2 y 3-6'];

function informe(r, fallo) {
  const clave = fallo === 'il' ? '6-permanente' : r.de(Object.keys(LIMITES));
  const L = LIMITES[clave];
  const id = `${r.n(1, 3)}${r.de(['A', 'B'])}-${r.de(['A', 'B', 'C'])}${String(r.n(1, 24)).padStart(2, '0')}`;
  const m = x => Math.round(x * 10) / 10;
  const largo = fallo === 'largo' ? L.largo + r.n(3, 8) + r.n(0, 9) / 10 : m(r.n(Math.round(L.largo * 0.45), L.largo - 3) + r.n(0, 9) / 10);
  const fr = largo / L.largo;
  // Medidas que pasan: con un margen razonable. La que falla: con margen negativo.
  const il = fallo === 'il' ? m(L.il + r.n(10, 45) / 10) : m(L.il * (0.55 + 0.35 * fr) - r.n(0, 10) / 10);
  const next = fallo === 'next' ? m(L.next - r.n(8, 40) / 10) : m(L.next + r.n(25, 90) / 10);
  const rl = fallo === 'rl' ? m(L.rl - r.n(8, 35) / 10) : m(L.rl + r.n(20, 70) / 10);
  const retardo = Math.round(L.retardo * (0.62 + 0.3 * fr));
  const skew = fallo === 'skew' ? L.skew + r.n(6, 30) : r.n(6, Math.round(L.skew * 0.6));
  const mapa = fallo === 'mapa' ? r.de(MAPAS) : 'Correcto';
  const filas = fallo === 'mapa'
    ? [['Mapa de cableado', mapa, 'Correcto']]
    : [['Mapa de cableado', mapa, 'Correcto'], ['Longitud', coma(largo) + ' m', '≤ ' + L.largo + ' m'], ['Pérdida de inserción', coma(il) + ' dB', '≤ ' + coma(L.il) + ' dB'],
      ['NEXT', coma(next) + ' dB', '≥ ' + coma(L.next) + ' dB'], ['Pérdida de retorno', coma(rl) + ' dB', '≥ ' + coma(L.rl) + ' dB'],
      ['Retardo de propagación', retardo + ' ns', '≤ ' + L.retardo + ' ns'], ['Desviación de retardo', skew + ' ns', '≤ ' + L.skew + ' ns']];
  const margenes = fallo === 'mapa' ? null : { il: m(L.il - il), next: m(next - L.next), rl: m(rl - L.rl) };
  return { id, clave, limites: L, filas, fallo, margenes, mapa };
}

function bloqueCertificador(r) {
  const fallos = barajar(['ninguna', 'mapa', 'largo', 'il', 'next', 'rl', 'skew'], r);
  const informes = [informe(r, fallos[0]), informe(r, fallos[1])];
  const grupos = informes.map((inf, k) => {
    const L = inf.limites, letra = 'AB'[k];
    const campos = [
      lista(`res${k}`, 'Resultado del enlace', [['PASS', 'PASS'], ['FAIL', 'FAIL']], inf.fallo === 'ninguna' ? 'PASS' : 'FAIL', 'Basta una medida fuera de su límite para que el enlace dé FAIL. Si el mapa de cableado falla, el certificador ni siquiera sigue midiendo.'),
      lista(`med${k}`, '¿Qué medida falla?', Object.entries(MEDIDAS), inf.fallo, 'Longitud, pérdida de inserción, retardo y desviación no pueden pasar del límite; NEXT y pérdida de retorno no pueden bajar de él (cuanto más alto, mejor).'),
      lista(`cau${k}`, 'Causa más probable', Object.entries(CAUSAS), inf.fallo, 'Atenuación: longitud o categoría. NEXT (diafonía): destrenzado de más. Pérdida de retorno: reflexiones por malos conectores o cable aplastado o doblado. Desviación: pares que tardan distinto. Mapa: hilos mal conectados.'),
    ];
    if (inf.margenes) {
      const cual = r.de(['il', 'next', 'rl']);
      const txt = { il: 'de la pérdida de inserción', next: 'de NEXT', rl: 'de la pérdida de retorno' }[cual];
      const valor = inf.margenes[cual];
      campos.push(numero(`mar${k}`, `Margen ${txt}, en dB`, valor,
        cual === 'il' ? `En la pérdida de inserción el límite es un máximo: margen = límite − medido = ${coma(L.il)} − ${coma(L.il - valor)} = ${coma(valor)} dB. Negativo quiere decir que no pasa.`
          : `En ${cual === 'next' ? 'NEXT' : 'la pérdida de retorno'} el límite es un mínimo: margen = medido − límite = ${coma(L[cual] + valor)} − ${coma(L[cual])} = ${coma(valor)} dB. Negativo quiere decir que no pasa.`,
        { dec: 1, tol: 0.06, unidad: 'dB', ayuda: 'Con signo: negativo si no llega' }));
    }
    return { informe: { titulo: `Informe ${letra} · enlace ${inf.id}`, norma: L.nombre, filas: inf.filas }, campos };
  });
  return { titulo: 'Informes del certificador', seccion: 'Secciones 1, 2 y 3', texto: 'Dos enlaces de la misma obra recién certificados. Los límites son los que trae el informe para esa categoría.', grupos };
}

/* ---------- Bloque 5 · Redes inalámbricas ---------- */
const NORMAS_WIFI = [
  ['802.11n', 'Wi-Fi 4', '2,4 y 5 GHz'], ['802.11ac', 'Wi-Fi 5', 'Solo 5 GHz'], ['802.11ax', 'Wi-Fi 6 / 6E', '2,4, 5 (y 6) GHz'], ['802.11be', 'Wi-Fi 7', '2,4, 5 y 6 GHz'],
];
const ANTIGUAS = [['802.11b', 'Solo 2,4 GHz'], ['802.11g', 'Solo 2,4 GHz'], ['802.11a', 'Solo 5 GHz']];
const BANDAS = [
  ['Una sala de reuniones con 40 portátiles y el AP en el techo de la propia sala', '5 GHz', 'Hay muchos clientes y el AP está cerca: interesan los canales anchos y libres de 5 GHz.'],
  ['Un sensor viejo al fondo del almacén, con dos muros de por medio', '2,4 GHz', 'Hace falta alcance y atravesar paredes: 2,4 GHz. Además, muchos dispositivos antiguos solo tienen esa banda.'],
  ['Portátiles nuevos con Wi-Fi 7 que quieren una banda limpia y canales muy anchos', '6 GHz', 'La banda de 6 GHz es nueva y limpia, pero solo la usan Wi-Fi 6E y Wi-Fi 7, y llega menos lejos.'],
];
const TOPOS = [
  ['Todos los clientes hablan a través de un único punto de acceso, que los une con la red cableada.', 'Infraestructura (BSS)'],
  ['Cinco puntos de acceso con el mismo SSID cubren la planta y el portátil pasa de uno a otro.', 'ESS (itinerancia)'],
  ['Dos portátiles se pasan un archivo directamente, sin punto de acceso.', 'Ad hoc (IBSS)'],
  ['Los puntos de acceso se unen entre sí por radio y solo uno va por cable.', 'Malla (mesh)'],
  ['Dos antenas direccionales unen las redes cableadas de dos edificios.', 'Puente (WDS)'],
];
const FASES = [
  ['El AP envía beacons unas 10 veces por segundo.', 'Descubrimiento'], ['El cliente manda una association request y recibe un AID.', 'Asociación'],
  ['Se hace el saludo de 4 vías y se generan las claves de la sesión.', 'Autenticación de seguridad'], ['El cliente pide su dirección IP por DHCP.', 'Configuración IP'],
  ['Primer intercambio con el AP, por «sistema abierto».', 'Autenticación 802.11'],
];
const SEGURIDAD = [
  ['Un AP que todavía usa WEP', 'Pasarlo a WPA2 o, mejor, WPA3', 'WEP se rompe en minutos.'],
  ['Una empresa de 80 empleados con un servidor RADIUS', 'WPA3-Enterprise (802.1X)', 'Cada usuario entra con sus credenciales o certificado, validados por el RADIUS.'],
  ['Las visitas de una oficina', 'Un SSID aparte para invitados, con su VLAN', 'Separa a los invitados de la red de la empresa.'],
  ['Alguien propone ocultar el SSID y filtrar por MAC para protegerse', 'No protege: hay que cifrar con WPA2/WPA3', 'Ocultar el SSID o filtrar por MAC se saltan con facilidad.'],
];
const OPC_SEGURIDAD = ['Pasarlo a WPA2 o, mejor, WPA3', 'WPA3-Enterprise (802.1X)', 'Un SSID aparte para invitados, con su VLAN', 'No protege: hay que cifrar con WPA2/WPA3', 'Dejar la red abierta'];
const COMANDOS = [
  ['Ver en Windows las redes al alcance con el canal y la señal de cada AP', 'netsh wlan show networks mode=bssid'],
  ['Ver en Windows el estado de la conexión: SSID, BSSID, canal y señal', 'netsh wlan show interfaces'],
  ['Ver en Ubuntu las redes al alcance', 'nmcli device wifi list'],
  ['Conectar desde Ubuntu a la red «Empresa» pidiendo la contraseña', 'nmcli device wifi connect "Empresa" --ask'],
];
const CSMA = [
  ['¿Cómo sabe el emisor que su trama ha chocado?', 'No le llega el ACK', ['No le llega el ACK', 'Detecta la colisión mientras transmite', 'Recibe una señal de atasco']],
  ['¿Para qué sirve RTS/CTS?', 'Para evitar el problema del nodo oculto', ['Para evitar el problema del nodo oculto', 'Para cifrar la trama', 'Para elegir el canal']],
  ['¿Por qué una WLAN no usa CSMA/CD?', 'Una radio no puede transmitir y escuchar a la vez', ['Una radio no puede transmitir y escuchar a la vez', 'Porque el aire no tiene colisiones', 'Porque el AP lo prohíbe']],
];
const SENAL = { exc: 'Excelente', buena: 'Buena: vale para voz y vídeo', baja: 'Por debajo de lo recomendable para voz y vídeo', inest: 'Inestable' };

function bloqueWifi(r) {
  const f = r.de([['2,4 GHz', 2.4e9], ['5 GHz', 5e9], ['6 GHz', 6e9]]);
  const lam = 3e8 / f[1] * 100;
  const norma = r.de(NORMAS_WIFI), deIeee = r.prob(0.5), antigua = r.de(ANTIGUAS);
  const banda = r.de(BANDAS), topo = r.de(TOPOS), fase = r.de(FASES), seg = r.de(SEGURIDAD), cmd = r.de(COMANDOS), csma = r.de(CSMA);
  const d = r.de([0, 1, 2, 3, 5, 6, 7]);      // nunca 4: con canales de 20 MHz, a 4 de distancia apenas se rozan y los apuntes no lo tratan
  const a = r.n(1, 13 - d);
  const b = a + d;
  const rel = d === 0 ? 'mismo' : d < 5 ? 'solapan' : 'libres';
  const mw = r.de([[1, 0], [10, 10], [100, 20], [50, 17], [200, 23], [2, 3], [0.1, -10]]);
  const aDbm = r.prob(0.5);
  const pire = r.de([[50, true], [100, true], [200, false], [500, false]]);
  const dbm = r.de([-45, -50, -60, -64, -72, -76, -84, -88]);
  const calidad = dbm >= -55 ? 'exc' : dbm >= -67 ? 'buena' : dbm > -80 ? 'baja' : 'inest';
  const aps = r.n(3, 8);
  return {
    titulo: 'Redes inalámbricas', seccion: 'Sección 4',
    grupos: [
      { campos: [
        numero('lambda', `Longitud de onda de ${f[0]}, en centímetros (λ = c / f)`, lam, `λ = 300 000 000 m/s ÷ ${f[1].toExponential(1).replace('e+9', ' · 10⁹').replace('.', ',')} Hz = ${coma(lam, 1)} cm. Cuanto más frecuencia, más corta la onda.`, { dec: 1, tol: 0.15, unidad: 'cm', ayuda: 'c = 300 000 km/s. Con un decimal.' }),
        deIeee ? lista('wifiN', `Nombre comercial de ${norma[0]}`, mismas(NORMAS_WIFI.map(n => n[1])), norma[1], 'Wi-Fi 4 = 802.11n, Wi-Fi 5 = 802.11ac, Wi-Fi 6/6E = 802.11ax, Wi-Fi 7 = 802.11be.')
          : lista('wifiN', `Norma IEEE de ${norma[1]}`, mismas(NORMAS_WIFI.map(n => n[0])), norma[0], 'Wi-Fi 4 = 802.11n, Wi-Fi 5 = 802.11ac, Wi-Fi 6/6E = 802.11ax, Wi-Fi 7 = 802.11be.'),
        lista('wifiB', `Bandas de ${antigua[0]}`, mismas(['Solo 2,4 GHz', 'Solo 5 GHz', '2,4 y 5 GHz']), antigua[1], '802.11b y 802.11g: 2,4 GHz. 802.11a: 5 GHz. 802.11n: las dos.'),
        lista('banda', `¿Qué banda usarías? ${banda[0]}`, mismas(['2,4 GHz', '5 GHz', '6 GHz']), banda[1], banda[2]),
      ] },
      { texto: 'Canales y potencia.', campos: [
        lista('tres', 'Tres AP de 2,4 GHz en el mismo pasillo. ¿Qué canales les pones?', mismas(['1, 2 y 3', '1, 6 y 11', '4, 6 y 8', '11, 12 y 13']), '1, 6 y 11', 'En 2,4 GHz los canales se solapan; solo 1, 6 y 11 no se pisan.'),
        lista('canales', `Una red en el canal ${a} y otra en el ${b}`, [['mismo', 'Comparten canal: se reparten el tiempo de aire'], ['solapan', 'Se solapan: se hacen interferencias'], ['libres', 'No se solapan']], rel,
          'Mismo canal: las dos redes se escuchan y se turnan (CSMA/CA). Canales con menos de 5 de diferencia: se solapan y son ruido una para otra. Con 5 o más (como 1, 6 y 11), no se tocan.'),
        aDbm ? numero('dbm', `${coma(mw[0], 1)} mW en dBm`, mw[1], `dBm = decibelios respecto a 1 mW. 1 mW = 0 dBm; cada × 10 suma 10 dB y cada × 2 suma 3 dB: ${coma(mw[0], 1)} mW = ${mw[1]} dBm.`, { dec: 0, tol: 0.5, unidad: 'dBm' })
          : numero('dbm', `${mw[1]} dBm en mW`, mw[0], `0 dBm = 1 mW; cada 10 dB más es × 10 y cada 3 dB más es × 2: ${mw[1]} dBm = ${coma(mw[0], 1)} mW.`, { dec: 1, tol: 0.05, unidad: 'mW' }),
        lista('pire', `¿Puede un AP emitir ${pire[0]} mW de PIRE en 2,4 GHz en Europa?`, [['si', 'Sí'], ['no', 'No']], pire[1] ? 'si' : 'no', 'El límite en Europa en 2,4 GHz es de 100 mW (20 dBm) de PIRE.'),
        lista('senal', `Un portátil ve la red a ${dbm} dBm`, Object.entries(SENAL), calidad, 'En dBm la señal es negativa: −50 dBm es excelente, unos −67 dBm es el mínimo recomendable para voz y vídeo y por debajo de −80 dBm la conexión es inestable.'),
      ] },
      { texto: 'Cómo funciona una WLAN.', campos: [
        lista('topo', topo[0], mismas(TOPOS.map(t => t[1])), topo[1], 'BSS: todo pasa por un AP. ESS: varios AP con el mismo SSID y roaming. Ad hoc: equipo a equipo. Malla: AP unidos por radio. Puente: une dos redes cableadas.'),
        numero('ssid', `Una ESS de ${aps} AP anuncia un solo nombre de red. ¿Cuántos SSID hay?`, 1, 'El SSID es el nombre de la red: en una ESS es uno solo.', { dec: 0, tol: 0.01 }),
        numero('bssid', '¿Y cuántos BSSID?', aps, `El BSSID es la MAC de la radio de cada AP: ${aps}.`, { dec: 0, tol: 0.01 }),
        lista('csma', csma[0], mismas(csma[2]), csma[1], 'CSMA/CA: escuchar, esperar DIFS y un tiempo aleatorio, transmitir y esperar el ACK. Si no llega, se supone colisión. Con RTS/CTS el AP da permiso a la vista de todos.'),
        lista('fase', `¿En qué fase de la conexión está? ${fase[0]}`, mismas(['Descubrimiento', 'Autenticación 802.11', 'Asociación', 'Autenticación de seguridad', 'Configuración IP']), fase[1], 'Descubrimiento (beacons o probes), autenticación 802.11 (sistema abierto), asociación (AID), autenticación de seguridad (WPA2/WPA3) y configuración IP (DHCP).'),
        lista('seg', `¿Qué harías? ${seg[0]}`, mismas(OPC_SEGURIDAD), seg[1], seg[2]),
        lista('cmd', cmd[0], mismas(COMANDOS.map(c => c[1])), cmd[1], 'netsh wlan show interfaces: tu conexión. netsh wlan show networks mode=bssid: lo que hay al alcance. En Ubuntu, nmcli device wifi list y nmcli device wifi connect.'),
      ] },
    ],
  };
}

/** Un caso entero: cinco bloques sacados de la misma semilla. */
export function crearCaso(semilla) {
  const r = azar(semilla);
  return { semilla, bloques: [bloqueVelocidad(r), bloqueCables(r), bloqueEstructurado(r), bloqueCertificador(r), bloqueWifi(r)] };
}

export const campos = caso => caso.bloques.flatMap(b => b.grupos.flatMap(g => g.campos));
const decimal = v => Number(String(v ?? '').trim().replace(/\s/g, '').replace('−', '-').replace(',', '.'));

export function corregir(caso, resp) {
  const lista = campos(caso).map(c => {
    const v = resp[c.id];
    let ok;
    if (c.tipo === 'numero') { const n = decimal(v); ok = String(v ?? '').trim() !== '' && Number.isFinite(n) && Math.abs(n - c.correcta) <= c.tol; }
    else if (c.tipo === 'texto') { const f = c.normal || (x => x.trim()); ok = f(String(v ?? '')) === f(c.correcta); }
    else ok = v === c.correcta;
    return { id: c.id, ok, correcta: c.muestra, porque: c.porque };
  });
  return { lista, aciertos: lista.filter(x => x.ok).length, total: lista.length };
}

/** Respuestas correctas, con el formato que acepta corregir(). */
export function solucion(caso) {
  return Object.fromEntries(campos(caso).map(c => [c.id, c.tipo === 'numero' ? coma(c.correcta, 2) : c.correcta]));
}
