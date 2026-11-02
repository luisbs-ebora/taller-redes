/**
 * MotorRed — Genera encargos de «diseña la red de una empresa» y los corrige.
 * El mismo archivo funciona en el navegador (práctica) y en Apps Script (examen).
 * En la web se copia como assets/js/practica/MotorRed.js.
 *
 * Caso = una empresa con una sede principal (oficinas), dos sedes más en el mismo recinto,
 * a veces una sede remota que llega por Internet, distancias entre sedes, Wi-Fi en la principal
 * y requisitos R1–R5 como los del proyecto «La red de Cerámicas Ribera del Tajo».
 */
var MotorRed = (function () {

  // ---------- Catálogo de InfoTajo Distribución (ficticio, precios con IVA) ----------
  var CATALOGO = [
    { cod: 'OR-01', grupo: 'Ordenadores y monitores', nombre: 'Sobremesa de oficina «Office S»', det: 'Intel Core i3 · 8 GB · SSD 256 GB · Ethernet 1 Gbps · sin Wi-Fi · sin monitor', precio: 520 },
    { cod: 'OR-02', grupo: 'Ordenadores y monitores', nombre: 'Sobremesa de oficina «Office M»', det: 'Intel Core i5 · 16 GB · SSD 512 GB · Ethernet 1 Gbps · sin Wi-Fi · sin monitor', precio: 690 },
    { cod: 'OR-03', grupo: 'Ordenadores y monitores', nombre: 'Sobremesa gaming «Gamer X»', det: 'Ryzen 7 · 32 GB · SSD 2 TB · gráfica dedicada · 2,5 Gbps y Wi-Fi 6 · sin monitor', precio: 1450 },
    { cod: 'OR-04', grupo: 'Ordenadores y monitores', nombre: 'Portátil «Travel 14»', det: 'Core i5 · 16 GB · SSD 512 GB · pantalla 14" · Wi-Fi 6 y Bluetooth', precio: 850 },
    { cod: 'OR-05', grupo: 'Ordenadores y monitores', nombre: 'Monitor de 24"', det: 'Full HD · HDMI · cable incluido', precio: 140 },
    { cod: 'SV-01', grupo: 'Servidor y almacenamiento', nombre: 'NAS de 2 bahías', det: 'Para 2 discos (se compran aparte) · 1 puerto Ethernet', precio: 380, bahias: 2, puertos: 1 },
    { cod: 'SV-02', grupo: 'Servidor y almacenamiento', nombre: 'NAS de 4 bahías', det: 'Para 4 discos (se compran aparte) · 2 puertos Ethernet', precio: 620, bahias: 4, puertos: 2 },
    { cod: 'SV-03', grupo: 'Servidor y almacenamiento', nombre: 'Disco duro para NAS de 4 TB', det: 'Para funcionar 24 horas al día', precio: 140 },
    { cod: 'SV-04', grupo: 'Servidor y almacenamiento', nombre: 'Disco duro para NAS de 8 TB', det: 'Para funcionar 24 horas al día', precio: 250 },
    { cod: 'SV-05', grupo: 'Servidor y almacenamiento', nombre: 'SAI de 1000 VA', det: 'Mantiene encendidos el servidor y el switch unos minutos si se va la luz', precio: 220 },
    { cod: 'IM-01', grupo: 'Impresión', nombre: 'Multifunción láser color en red', det: 'Imprime, escanea y copia · Ethernet y Wi-Fi', precio: 480 },
    { cod: 'IM-02', grupo: 'Impresión', nombre: 'Impresora de tinta', det: 'Solo imprime · conexión USB (sin red)', precio: 150 },
    { cod: 'SW-08', grupo: 'Switches', nombre: 'Switch de 8 puertos', det: 'No gestionable · 1 Gbps · de sobremesa', precio: 35, puertos: 8, poe: 0 },
    { cod: 'SW-16', grupo: 'Switches', nombre: 'Switch de 16 puertos', det: 'No gestionable · 1 Gbps · para armario rack', precio: 95, puertos: 16, poe: 0 },
    { cod: 'SW-24', grupo: 'Switches', nombre: 'Switch de 24 puertos', det: 'No gestionable · 1 Gbps · para armario rack', precio: 160, puertos: 24, poe: 0 },
    { cod: 'SW-24P', grupo: 'Switches', nombre: 'Switch de 24 puertos con PoE', det: 'Para armario rack · 8 puertos dan corriente (PoE)', precio: 290, puertos: 24, poe: 8 },
    { cod: 'WF-01', grupo: 'Wi-Fi y router', nombre: 'Punto de acceso Wi-Fi 6 de techo', det: 'Hasta unos 50 usuarios · se alimenta por PoE (puerto PoE o inyector WF-02)', precio: 160 },
    { cod: 'WF-02', grupo: 'Wi-Fi y router', nombre: 'Inyector PoE', det: 'Da corriente a un punto de acceso por el cable de red', precio: 25 },
    { cod: 'WF-03', grupo: 'Wi-Fi y router', nombre: 'Router Wi-Fi doméstico', det: 'Router con Wi-Fi y 4 puertos, como el de una casa', precio: 90 },
    { cod: 'FO-01', grupo: 'Fibra óptica', nombre: 'Pareja de conversores de fibra a RJ-45', det: 'Uno para cada extremo de un enlace de fibra', precio: 120 },
    { cod: 'FO-02', grupo: 'Fibra óptica', nombre: 'Cable de fibra óptica exterior (por metro)', det: 'Para tender entre edificios · precio por metro', precio: 2.5, porMetro: true },
    { cod: 'CU-01', grupo: 'Cableado de cobre', nombre: 'Bobina de cable de par trenzado Cat 6', det: '305 metros · para interior', precio: 160 },
    { cod: 'CU-02', grupo: 'Cableado de cobre', nombre: 'Latiguillo Cat 6 de 2 m', det: 'Une el equipo con la toma, o dos aparatos dentro del armario', precio: 3 },
    { cod: 'CU-03', grupo: 'Cableado de cobre', nombre: 'Toma de red de pared doble', det: 'Roseta con 2 conectores RJ-45', precio: 8 },
    { cod: 'AR-01', grupo: 'Armarios', nombre: 'Armario rack de pared 9U', det: 'Con regleta · caben un switch, un NAS y un SAI', precio: 180 },
    { cod: 'AR-02', grupo: 'Armarios', nombre: 'Armario rack de suelo 22U', det: 'Con regleta y ventilación · para instalaciones grandes', precio: 420 }
  ];
  var POR_COD = {};
  CATALOGO.forEach(function (p) { POR_COD[p.cod] = p; });
  var SWITCHES = ['SW-08', 'SW-16', 'SW-24', 'SW-24P'];
  var M_POR_TOMA = 25, M_BOBINA = 305, LIMITE_COBRE = 100, M2_POR_AP = 300, PUERTOS_ROUTER = 4;

  // ---------- Opciones para clasificar redes ----------
  var ALCANCES = ['PAN', 'LAN', 'WLAN', 'MAN', 'WAN'];
  var MEDIOS = ['Cableada', 'Inalámbrica'];
  var PROPIEDAD = ['Privada', 'Pública o de operador'];

  // ---------- Azar con semilla (mismo caso para la misma semilla) ----------
  function azar(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function entre(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
  function elegir(r, lista) { return lista[Math.floor(r() * lista.length)]; }
  function barajar(r, lista) {
    var l = lista.slice();
    for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = l[i]; l[i] = l[j]; l[j] = t; }
    return l;
  }
  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------- Crear un caso ----------
  function crearCaso(def, seed) {
    var r = azar(seed);
    var pl = elegir(r, def.plantillas);
    var ids = ['A', 'B', 'C'];
    var sedes = pl.sedes.map(function (s, i) {
      var principal = i === 0;
      return {
        id: ids[i], nombre: s.nombre, principal: principal,
        puestos: principal ? entre(r, 6, 14) : entre(r, 2, 7),
        existentes: s.existentes ? { texto: s.existentes, n: entre(r, 2, 5) } : null
      };
    });
    var A = sedes[0];
    A.m2 = entre(r, 5, 14) * 50;                       // 250–700 m²
    A.aps = Math.ceil(A.m2 / M2_POR_AP);
    A.portatiles = entre(r, 2, 5);
    A.impresora = true; A.servidor = true; A.router = true;

    // Distancias (m). Al menos un tramo desde la principal supera 100 m.
    var dAB = entre(r, 7, 20) * 10, dAC = entre(r, 7, 20) * 10, dBC = entre(r, 4, 16) * 10;
    if (dAB <= LIMITE_COBRE && dAC <= LIMITE_COBRE) dAB = entre(r, 12, 20) * 10;
    var tramos = [{ id: 'A-B', a: 'A', b: 'B', m: dAB }, { id: 'A-C', a: 'A', b: 'C', m: dAC }, { id: 'B-C', a: 'B', b: 'C', m: dBC }];

    var remota = null;
    if (pl.remota && r() < (def.probRemota == null ? 0.7 : def.probRemota)) {
      remota = { id: 'R', nombre: pl.remota, puestos: entre(r, 2, 6) };
    }
    // R1: una avería en una sede secundaria no puede dejar sin red a la otra
    var orden = r() < 0.5 ? ['B', 'C'] : ['C', 'B'];
    var r1 = { averia: orden[0], protegida: orden[1] };

    var caso = {
      ejercicio: def.id, seed: seed, version: 1,
      titulo: def.titulo || 'Diseña la red',
      empresa: pl.empresa, actividad: pl.actividad, recinto: pl.recinto || 'el mismo polígono',
      sedes: sedes, tramos: tramos, remota: remota, r1: r1,
      m2PorAp: M2_POR_AP, mPorToma: M_POR_TOMA, limiteCobre: LIMITE_COBRE
    };
    caso.tipos = crearTipos(r, caso, pl);
    var ej = solucionEjemplo(caso);
    caso.presupuesto = Math.ceil((ej.total * (1.05 + r() * 0.04)) / 500) * 500;
    caso.solucionEjemplo = ej;
    return caso;
  }

  function crearTipos(r, caso, pl) {
    var A = caso.sedes[0];
    var lista = [
      { texto: 'Los ' + A.puestos + ' puestos de «' + A.nombre + '» conectados por cable', sol: ['LAN', 'Cableada', 'Privada'] },
      { texto: 'La Wi-Fi de «' + A.nombre + '» para los portátiles y las visitas', sol: ['WLAN', 'Inalámbrica', 'Privada'] },
      { texto: 'La unión entre las tres sedes ' + (/^el /.test(caso.recinto) ? 'del ' + caso.recinto.slice(3) : 'de ' + caso.recinto), sol: ['LAN', 'Cableada', 'Privada'], nota: 'Están en el mismo recinto y la red es de la empresa: es una LAN que cubre varios edificios (de campus), no una MAN.' },
      caso.remota
        ? { texto: 'La conexión entre «' + A.nombre + '» y «' + caso.remota.nombre + '» a través de Internet', sol: ['WAN', 'Cableada', 'Pública o de operador'] }
        : { texto: 'La conexión de la empresa a Internet con la fibra del operador', sol: ['WAN', 'Cableada', 'Pública o de operador'] },
      { texto: pl.pan || 'Los auriculares Bluetooth que un comercial usa con su móvil', sol: ['PAN', 'Inalámbrica', 'Privada'] }
    ];
    if (r() < 0.5) lista[1] = { texto: 'La red de fibra del ayuntamiento que une los edificios municipales de la ciudad', sol: ['MAN', 'Cableada', 'Pública o de operador'] };
    return barajar(r, lista);
  }

  // ---------- Cuentas que dependen del diseño ----------
  // Aparatos con cable que van al switch de una sede, según el diseño del alumno.
  function aparatos(caso, resp, sedeId) {
    var s = sede(caso, sedeId);
    if (sedeId === 'R') return { min: caso.remota.puestos, max: caso.remota.puestos };
    var base = s.puestos + (s.existentes ? s.existentes.n : 0);
    var enl = enlacesDe(resp, sedeId).length;
    if (!s.principal) return { min: base + enl, max: base + enl };
    var d = (resp.sedes && resp.sedes[sedeId]) || {};
    var aps = Number(d.aps) || 0;
    var nas = POR_COD[nasElegido(resp)] ? POR_COD[nasElegido(resp)].puertos : 1;
    var fijo = base + 1 /* impresora */ + aps + 1 /* router del operador */ + enl;
    return { min: fijo + 1, max: fijo + nas };   // el NAS de 2 puertos puede usar 1 o 2
  }
  function tomas(caso, sedeId, aps) {
    if (sedeId === 'R') return caso.remota.puestos;
    var s = sede(caso, sedeId);
    var n = s.puestos + (s.existentes ? s.existentes.n : 0);
    if (s.principal) n += 1 + (aps || 0);
    return n;
  }
  function sede(caso, id) {
    if (id === 'R') return caso.remota;
    for (var i = 0; i < caso.sedes.length; i++) if (caso.sedes[i].id === id) return caso.sedes[i];
    return null;
  }
  function enlacesDe(resp, sedeId) {
    var e = (resp && resp.enlaces) || {};
    return Object.keys(e).filter(function (k) { return e[k] && k.split('-').indexOf(sedeId) >= 0; });
  }
  function nasElegido(resp) {
    var c = (resp && resp.compra) || {};
    if (Number(c['SV-02']) > 0) return 'SV-02';
    if (Number(c['SV-01']) > 0) return 'SV-01';
    return null;
  }

  // ¿Qué sedes llegan a la principal? (sin las caídas)
  function alcanzables(caso, resp, caidas) {
    caidas = caidas || {};
    var e = (resp && resp.enlaces) || {};
    var vistos = {};
    if (caidas.A) return vistos;
    var cola = ['A']; vistos.A = true;
    while (cola.length) {
      var x = cola.shift();
      Object.keys(e).forEach(function (k) {
        if (!e[k]) return;
        var t = caso.tramos.filter(function (q) { return q.id === k; })[0];
        if (!t) return;
        if (e[k] === 'cobre' && t.m > LIMITE_COBRE) return;   // el cobre de más de 100 m no funciona
        var p = k.split('-'), otro = p[0] === x ? p[1] : p[1] === x ? p[0] : null;
        if (otro && !vistos[otro] && !caidas[otro]) { vistos[otro] = true; cola.push(otro); }
      });
    }
    return vistos;
  }

  // Lo que se compra solo por el diseño del plano (switches, armarios, puntos de acceso)
  function compraDelPlano(caso, resp) {
    var lineas = {};
    var suma = function (cod, n) { if (cod && n > 0) lineas[cod] = (lineas[cod] || 0) + n; };
    var sedesTodas = caso.sedes.map(function (s) { return s.id; }).concat(caso.remota ? ['R'] : []);
    sedesTodas.forEach(function (id) {
      var d = (resp.sedes && resp.sedes[id]) || {};
      if (SWITCHES.indexOf(d.switch) >= 0) suma(d.switch, 1);
      if (d.armario === 'AR-01' || d.armario === 'AR-02') suma(d.armario, 1);
      if (id === 'A') suma('WF-01', Number(d.aps) || 0);
    });
    return lineas;
  }
  function totalCompra(caso, resp) {
    var lineas = compraDelPlano(caso, resp);
    var c = (resp && resp.compra) || {};
    Object.keys(c).forEach(function (k) { var n = Number(c[k]) || 0; if (n > 0 && POR_COD[k]) lineas[k] = (lineas[k] || 0) + n; });
    var total = 0;
    Object.keys(lineas).forEach(function (k) { total += POR_COD[k].precio * lineas[k]; });
    return { lineas: lineas, total: Math.round(total * 100) / 100 };
  }

  // ---------- Solución de ejemplo (en estrella desde la principal) ----------
  function solucionEjemplo(caso) {
    var A = caso.sedes[0];
    var resp = { tipos: caso.tipos ? caso.tipos.map(function (t) { return t.sol.slice(); }) : [], sedes: {}, enlaces: {}, compra: {}, puntoDebil: 'A' };
    caso.tramos.forEach(function (t) {
      if (t.a === 'A') resp.enlaces[t.id] = t.m > LIMITE_COBRE ? 'fibra' : 'cobre';
    });
    var grande = caso.sedes.reduce(function (n, s) { return n + s.puestos; }, 0) + (caso.remota ? caso.remota.puestos : 0) >= 20;
    var nas = grande ? 'SV-02' : 'SV-01';
    resp.compra[nas] = 1;
    resp.compra['SV-03'] = grande ? 4 : 2;
    resp.compra['SV-05'] = 1;
    caso.sedes.forEach(function (s) {
      var d = { aps: s.principal ? A.aps : 0, armario: 'AR-01' };
      resp.sedes[s.id] = d;
      var n = aparatos(caso, resp, s.id).max;
      d.cuenta = n;
      d.switch = s.principal ? 'SW-24P' : n <= 8 ? 'SW-08' : n <= 16 ? 'SW-16' : 'SW-24';
      if (!s.principal && n >= 8) d.switch = n < 16 ? 'SW-16' : 'SW-24';   // algo de margen para crecer
    });
    if (caso.remota) resp.sedes.R = { switch: caso.remota.puestos > PUERTOS_ROUTER ? 'SW-08' : '', armario: '', cuenta: caso.remota.puestos };
    var puestosCampo = caso.sedes.reduce(function (n, s) { return n + s.puestos; }, 0);
    var otros = puestosCampo - A.puestos + (caso.remota ? caso.remota.puestos : 0);
    resp.compra['OR-02'] = A.puestos;
    resp.compra['OR-01'] = otros;
    resp.compra['OR-05'] = A.puestos + otros;
    resp.compra['OR-04'] = A.portatiles;
    resp.compra['IM-01'] = 1;
    var nTomas = 0, metrosCobre = 0, rosetas = 0;
    caso.sedes.forEach(function (s) { var t = tomas(caso, s.id, resp.sedes[s.id].aps); nTomas += t; rosetas += Math.ceil(t / 2); });
    if (caso.remota) { nTomas += caso.remota.puestos; rosetas += Math.ceil(caso.remota.puestos / 2); }
    var fibras = 0, metrosFibra = 0;
    caso.tramos.forEach(function (t) {
      if (resp.enlaces[t.id] === 'fibra') { fibras++; metrosFibra += t.m; }
      if (resp.enlaces[t.id] === 'cobre') metrosCobre += t.m;
    });
    resp.compra['CU-01'] = Math.ceil((nTomas * M_POR_TOMA + metrosCobre) / M_BOBINA);
    resp.compra['CU-03'] = rosetas;
    resp.compra['CU-02'] = nTomas * 2;
    if (fibras) { resp.compra['FO-01'] = fibras; resp.compra['FO-02'] = Math.ceil((metrosFibra * 1.1) / 10) * 10; }
    var tot = totalCompra(caso, resp);
    return { respuesta: resp, total: tot.total, lineas: tot.lineas };
  }

  // ---------- Versión para el alumno (sin soluciones) ----------
  function casoPublico(caso) {
    var c = clonar(caso);
    delete c.solucionEjemplo;
    c.tipos = c.tipos.map(function (t) { return { texto: t.texto }; });
    c.catalogo = CATALOGO;
    c.opciones = { alcance: ALCANCES, medio: MEDIOS, propiedad: PROPIEDAD };
    return c;
  }

  // ---------- Corrección ----------
  var MAXIMOS = { tipos: 1.5, puertos: 2, enlaces: 1.5, compra: 3, wifi: 0.5, averias: 1, presupuesto: 0.5 };
  var NOMBRES = { tipos: 'Tipos de red', puertos: 'Puertos y switches', enlaces: 'Enlaces entre sedes', compra: 'Compra', wifi: 'Wi-Fi (R2)', averias: 'Averías (R1 y punto débil)', presupuesto: 'Presupuesto (R5)' };

  function corregir(def, caso, resp) {
    resp = resp || {};
    resp.sedes = resp.sedes || {}; resp.enlaces = resp.enlaces || {}; resp.compra = resp.compra || {};
    var detalle = [];
    var bloques = {};
    Object.keys(MAXIMOS).forEach(function (k) { bloques[k] = 0; });
    function anota(bloque, ok, puntos, texto, ayuda) {
      var p = ok === true ? puntos : typeof ok === 'number' ? Math.round(puntos * ok * 100) / 100 : 0;
      bloques[bloque] += p;
      detalle.push({ bloque: bloque, ok: ok === true || ok === 1, parcial: typeof ok === 'number' && ok > 0 && ok < 1, puntos: p, max: puntos, texto: texto, ayuda: ok === true ? '' : (ayuda || '') });
    }
    var c = resp.compra;
    var n = function (cod) { return Math.max(0, Number(c[cod]) || 0); };
    var A = caso.sedes[0];

    // 1. Tipos de red: 0,3 por red con los tres criterios bien
    var valorTipo = MAXIMOS.tipos / caso.tipos.length;
    caso.tipos.forEach(function (t, i) {
      var r = (resp.tipos || [])[i] || [];
      var ok = r[0] === t.sol[0] && r[1] === t.sol[1] && r[2] === t.sol[2];
      anota('tipos', ok, valorTipo, t.texto + ': ' + t.sol.join(' · '),
        ok ? '' : 'Has puesto: ' + (r.filter(Boolean).join(' · ') || 'nada') + '. ' + (t.nota || ''));
    });

    // 2. Puertos: en cada sede, cuenta bien hecha y switch con puertos suficientes
    var ids = caso.sedes.map(function (s) { return s.id; }).concat(caso.remota ? ['R'] : []);
    var valorSede = MAXIMOS.puertos / ids.length / 2;
    ids.forEach(function (id) {
      var s = sede(caso, id), d = resp.sedes[id] || {};
      var esp = aparatos(caso, resp, id);
      var cuenta = Number(d.cuenta);
      var okCuenta = cuenta >= esp.min && cuenta <= esp.max;
      var rango = esp.min === esp.max ? String(esp.min) : esp.min + ' o ' + esp.max;
      anota('puertos', okCuenta, valorSede, s.nombre + ': aparatos con cable contados',
        'Con tu diseño salen ' + rango + '. Cuenta todo lo que va por cable al switch: puestos' + (s.existentes ? ', ' + s.existentes.texto : '') +
        (s.principal ? ', impresora, NAS, puntos de acceso, router del operador' : '') + (id !== 'R' ? ' y un puerto por cada enlace con otra sede' : '') + '.');
      var cap = id === 'R' && !d.switch ? PUERTOS_ROUTER : d.switch && POR_COD[d.switch] ? POR_COD[d.switch].puertos : 0;
      var okSw = cap >= esp.max || (cap >= esp.min && esp.min !== esp.max);
      anota('puertos', okSw, valorSede, s.nombre + ': ' + (d.switch ? d.switch + ' (' + cap + ' puertos)' : id === 'R' ? 'router del operador (4 puertos)' : 'sin switch'),
        'Hacen falta ' + esp.max + ' puertos y ' + (d.switch || (id === 'R' ? 'el router' : 'eso')) + ' tiene ' + cap + '.');
    });

    // 3. Enlaces entre sedes
    var llega = alcanzables(caso, resp);
    var todas = caso.sedes.every(function (s) { return llega[s.id]; });
    anota('enlaces', todas, 0.5, 'Todas las sedes conectadas con la principal (R4)',
      'Hay sedes sin conexión: ' + caso.sedes.filter(function (s) { return !llega[s.id]; }).map(function (s) { return s.nombre; }).join(', ') + '. Revisa los enlaces y el límite de 100 m del par trenzado.');
    var largos = caso.tramos.filter(function (t) { return resp.enlaces[t.id] === 'cobre' && t.m > LIMITE_COBRE; });
    anota('enlaces', largos.length === 0 && todas, 0.5, 'Ningún tramo de par trenzado pasa de 100 m',
      largos.length ? largos.map(function (t) { return nombreTramo(caso, t) + ' (' + t.m + ' m)'; }).join(', ') + ': ahí hace falta fibra.' : 'Primero tienen que estar todas las sedes conectadas.');
    var fibras = caso.tramos.filter(function (t) { return resp.enlaces[t.id] === 'fibra'; });
    var mFibra = fibras.reduce(function (s, t) { return s + t.m; }, 0);
    var okConv = n('FO-01') >= fibras.length, okMetros = n('FO-02') >= mFibra && n('FO-02') <= mFibra * 1.5 + 20;
    anota('enlaces', fibras.length === 0 ? todas : (okConv ? 0.5 : 0) + (okMetros ? 0.5 : 0), 0.5,
      fibras.length ? 'Material de la fibra: ' + fibras.length + ' pareja(s) de conversores y ' + mFibra + ' m de fibra con algo de margen' : 'Sin enlaces de fibra',
      (!okConv ? 'Cada enlace de fibra necesita una pareja de conversores FO-01 (tienes ' + n('FO-01') + ', hacen falta ' + fibras.length + '). ' : '') +
      (!okMetros ? 'Metros de fibra: tus tramos suman ' + mFibra + ' m; compra esa cantidad y un poco de margen (tienes ' + n('FO-02') + ' m).' : ''));

    // 4. Compra
    var sobremesa = n('OR-01') + n('OR-02') + n('OR-03');
    var puestos = caso.sedes.reduce(function (s, x) { return s + x.puestos; }, 0) + (caso.remota ? caso.remota.puestos : 0);
    anota('compra', sobremesa === puestos, 0.4, 'Ordenadores de sobremesa: ' + puestos, 'Has comprado ' + sobremesa + '. Cuenta los puestos de todas las sedes' + (caso.remota ? ' y la de ' + caso.remota.nombre : '') + '.');
    anota('compra', n('OR-05') === sobremesa && sobremesa > 0, 0.3, 'Un monitor por sobremesa', 'Los sobremesa no traen monitor: ' + sobremesa + ' sobremesa y ' + n('OR-05') + ' monitores.');
    anota('compra', n('OR-04') === A.portatiles, 0.2, 'Portátiles: ' + A.portatiles, 'Has comprado ' + n('OR-04') + '.');
    anota('compra', n('OR-03') === 0 && sobremesa > 0, 0.3, 'Sin ordenadores gaming', 'El OR-03 es un PC gaming: para trabajar en una oficina sobra y dispara el presupuesto.');
    var nas = nasElegido(resp), discos = n('SV-03') + n('SV-04');
    var bah = nas ? POR_COD[nas].bahias : 0;
    anota('compra', !!nas && discos >= 2 && discos <= bah, 0.3, 'Servidor NAS con sus discos (R3)',
      !nas ? 'Falta el servidor de archivos (NAS).' : discos < 2 ? 'Los discos se compran aparte: pon al menos 2 para guardar todo duplicado.' : 'Tu NAS tiene ' + bah + ' bahías y compras ' + discos + ' discos.');
    anota('compra', n('IM-01') >= 1 && n('IM-02') === 0, 0.3, 'Impresora en red', n('IM-02') ? 'La IM-02 solo tiene USB: no se comparte en red.' : 'Falta la multifunción en red IM-01.');
    var apsA = Number((resp.sedes.A || {}).aps) || 0;
    var nTomas = ids.reduce(function (s, id) { return s + tomas(caso, id, id === 'A' ? apsA : 0); }, 0);
    var mCobreEnlaces = caso.tramos.filter(function (t) { return resp.enlaces[t.id] === 'cobre'; }).reduce(function (s, t) { return s + t.m; }, 0);
    var mNecesarios = nTomas * M_POR_TOMA + mCobreEnlaces;
    anota('compra', n('CU-01') * M_BOBINA >= mNecesarios, 0.3, 'Cable suficiente: ' + nTomas + ' tomas × 25 m' + (mCobreEnlaces ? ' + ' + mCobreEnlaces + ' m de enlaces' : '') + ' = ' + mNecesarios + ' m',
      'Con ' + n('CU-01') + ' bobina(s) tienes ' + n('CU-01') * M_BOBINA + ' m. Hacen falta ' + Math.ceil(mNecesarios / M_BOBINA) + ' bobinas de 305 m.');
    var minRosetas = Math.ceil(nTomas / 2);
    anota('compra', n('CU-03') >= minRosetas, 0.2, 'Tomas de pared: al menos ' + minRosetas + ' dobles para ' + nTomas + ' conectores', 'Tienes ' + n('CU-03') + '. Cada toma doble da 2 conectores.');
    anota('compra', n('CU-02') >= nTomas, 0.2, 'Latiguillos: al menos uno por toma (' + nTomas + ')', 'Tienes ' + n('CU-02') + '.');
    var sinArmario = caso.sedes.filter(function (s) { var d = resp.sedes[s.id] || {}; return !d.armario; });
    anota('compra', sinArmario.length === 0, 0.25, 'Un armario en cada sede del recinto (R3)', 'Sin armario: ' + sinArmario.map(function (s) { return s.nombre; }).join(', ') + '.');
    anota('compra', n('WF-03') === 0 && sobremesa > 0, 0.25, 'Sin router doméstico', 'El router lo pone el operador y el Wi-Fi lo dan los puntos de acceso: el WF-03 sobra.');

    // 5. Wi-Fi (R2): puntos de acceso suficientes y con corriente
    var dA = resp.sedes.A || {};
    var poeSwitch = dA.switch && POR_COD[dA.switch] ? POR_COD[dA.switch].poe : 0;
    var alimentados = Math.min(apsA, poeSwitch + n('WF-02'));
    anota('wifi', apsA >= A.aps, 0.25, 'Puntos de acceso para ' + A.m2 + ' m²: ' + A.aps, apsA ? 'Cada uno cubre unos 300 m²: con ' + apsA + ' no llega a toda la nave.' : 'No hay puntos de acceso: no se cumple R2.');
    anota('wifi', apsA > 0 && alimentados >= apsA, 0.25, 'Los puntos de acceso tienen corriente (PoE o inyector)', apsA ? 'Hay ' + apsA + ' punto(s) de acceso y solo ' + alimentados + ' con corriente. Usa un switch con PoE (SW-24P) o un inyector WF-02 para cada uno.' : '');

    // 6. Averías: R1 y punto débil
    var caidas = {}; caidas[caso.r1.averia] = true;
    var llegaR1 = alcanzables(caso, resp, caidas);
    anota('averias', !!llegaR1[caso.r1.protegida] && todas, 0.5,
      'R1: si se avería el switch de «' + sede(caso, caso.r1.averia).nombre + '», «' + sede(caso, caso.r1.protegida).nombre + '» sigue con red',
      !todas ? 'Primero todas las sedes tienen que llegar a la principal.' : 'En tu diseño «' + sede(caso, caso.r1.protegida).nombre + '» llega a la principal pasando por «' + sede(caso, caso.r1.averia).nombre + '». Únela directamente con la principal.');
    anota('averias', resp.puntoDebil === 'A', 0.5, 'Punto débil: el switch de «' + A.nombre + '»',
      'De él dependen todas las sedes y el servidor. Protección: un switch de repuesto, un SAI o un enlace de reserva.');

    // 7. Presupuesto (R5)
    var tot = totalCompra(caso, resp);
    anota('presupuesto', tot.total > 0 && tot.total <= caso.presupuesto, 0.5, 'Dentro de los ' + miles(caso.presupuesto) + ' €',
      'Tu compra suma ' + miles(tot.total) + ' €' + (tot.total > caso.presupuesto ? ': te pasas en ' + miles(tot.total - caso.presupuesto) + ' €.' : '.'));

    var nota = 0;
    Object.keys(bloques).forEach(function (k) { bloques[k] = Math.round(bloques[k] * 100) / 100; nota += bloques[k]; });
    return { nota: Math.round(nota * 100) / 100, bloques: bloques, maximos: MAXIMOS, nombres: NOMBRES, detalle: detalle, total: tot.total, faltaGrave: false };
  }

  function nombreTramo(caso, t) { return sede(caso, t.a).nombre + ' – ' + sede(caso, t.b).nombre; }
  function miles(x) { var s = (Math.round(x * 100) / 100).toFixed(x % 1 ? 2 : 0).replace('.', ','); return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  return {
    CATALOGO: CATALOGO, POR_COD: POR_COD, MAXIMOS: MAXIMOS, NOMBRES: NOMBRES, LIMITE_COBRE: LIMITE_COBRE,
    crearCaso: crearCaso, casoPublico: casoPublico, corregir: corregir,
    alcanzables: alcanzables, totalCompra: totalCompra, compraDelPlano: compraDelPlano, solucionEjemplo: solucionEjemplo,
    miles: miles
  };
})();

if (typeof module !== 'undefined') module.exports = MotorRed;
