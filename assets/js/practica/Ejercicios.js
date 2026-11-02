/**
 * Ejercicios.gs — Empresas de la PRÁCTICA (públicas: se copian a la web como assets/js/practica/Ejercicios.js).
 * Las del examen están en Examen.gs, que NO se sube a la web.
 * Cada plantilla: la sede principal (oficinas) va la primera; las otras dos tienen aparatos que ya tiene la empresa.
 */
var EJERCICIOS_RED = {
  'red-practica': {
    id: 'red-practica',
    titulo: 'Diseña la red de una empresa',
    probRemota: 0.7,
    plantillas: [
      { empresa: 'Bodegas Alberche', actividad: 'elabora y vende vino', recinto: 'la finca de la bodega',
        sedes: [{ nombre: 'Oficinas' }, { nombre: 'Bodega', existentes: 'sensores de temperatura de los depósitos' }, { nombre: 'Embotelladora', existentes: 'terminales de la línea de embotellado' }],
        remota: 'Tienda de Talavera', pan: 'Los auriculares Bluetooth del enólogo conectados a su móvil' },
      { empresa: 'Transportes Sierra de Gredos', actividad: 'reparte mercancía por toda la provincia', recinto: 'el polígono',
        sedes: [{ nombre: 'Oficinas' }, { nombre: 'Taller de camiones', existentes: 'equipos de diagnosis con cable de red' }, { nombre: 'Almacén', existentes: 'lectores de códigos de barras con cable' }],
        remota: 'Delegación de Madrid', pan: 'El reloj inteligente de la jefa de tráfico conectado a su móvil' },
      { empresa: 'Muebles Oropesa', actividad: 'fabrica y vende muebles de madera', recinto: 'el polígono',
        sedes: [{ nombre: 'Oficinas' }, { nombre: 'Carpintería', existentes: 'máquinas de corte (CNC) con cable de red' }, { nombre: 'Exposición', existentes: 'pantallas del catálogo con cable de red' }],
        remota: 'Tienda de Toledo', pan: 'El ratón y el teclado Bluetooth del portátil del diseñador' },
      { empresa: 'Granja Escuela El Tiétar', actividad: 'recibe grupos de colegios para actividades en el campo', recinto: 'la granja',
        sedes: [{ nombre: 'Recepción y oficinas' }, { nombre: 'Aulas', existentes: 'pizarras digitales con cable de red' }, { nombre: 'Establos', existentes: 'cámaras de vigilancia con cable de red' }],
        remota: null, pan: 'Los auriculares Bluetooth de la monitora conectados a su móvil' },
      { empresa: 'Camping Río Alberche', actividad: 'alquila parcelas y bungalós junto al río', recinto: 'el camping',
        sedes: [{ nombre: 'Recepción' }, { nombre: 'Restaurante', existentes: 'terminales de cobro (TPV) con cable de red' }, { nombre: 'Supermercado', existentes: 'cajas registradoras con cable de red' }],
        remota: 'Oficina de reservas de Talavera', pan: 'El altavoz Bluetooth de la animadora conectado a su móvil' }
    ]
  }
};

/** Busca un ejercicio por su id: primero los de práctica, luego los de examen (si existe Examen.gs). */
function ejercicio_(id) {
  if (EJERCICIOS_RED[id]) return EJERCICIOS_RED[id];
  if (typeof EXAMENES_RED !== 'undefined' && EXAMENES_RED[id]) return EXAMENES_RED[id];
  return null;
}

if (typeof module !== 'undefined') module.exports = { EJERCICIOS_RED: EJERCICIOS_RED, ejercicio_: ejercicio_ };
