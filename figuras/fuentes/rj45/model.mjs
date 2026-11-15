// Modelo del crimpado de un RJ45, en el plano de corte de uno de sus ocho hilos.
// Unidades de dibujo; MM convierte a milímetros reales (el conector mide unos 21,4 mm de largo).
export const MM = 9.36;
export const LARGO = 200, ALTO = 80, FONDO = 8;
export const HILO = { z0: 30, z1: 42, cu0: 33.5, cu1: 38.5 };            // aislante y cobre
export const CUCHILLA = { x0: 24, x1: 40, alto: 44, arriba: 94, dientes: [27, 37] };
export const CUNA = { x0: 140, x1: 170, arriba: 88, alto: 30 };          // la cuña que muerde la cubierta
export const CUBIERTA = { z0: 12, z1: 58 };
export const PUNZON = { abierto: 130, recorrido: 50 };
export const ENTRADA = 150;                                              // donde empieza la punta del hilo
export const CICLO = 8.5;
export const CASOS = {
  bien: { fondo: FONDO, pelado: 117, aprieta: 1 },
  corto: { fondo: 62, pelado: 117, aprieta: 1 },
  flojo: { fondo: FONDO, pelado: 117, aprieta: 0.9 },
  cubierta: { fondo: FONDO, pelado: 207, aprieta: 1 },
};
const suave = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
export const alturaPunzon = (aprieta) => PUNZON.abierto - PUNZON.recorrido * aprieta;

/** Estado en el segundo t del ciclo: entra el hilo, baja la crimpadora, sube y se ve el resultado. */
export function estadoEn(t, caso) {
  const punta = ENTRADA + (caso.fondo - ENTRADA) * suave(t / 1.5);
  const baja = suave((t - 2.1) / 0.9) * caso.aprieta, sube = suave((t - 3.6) / 0.7);
  const aprieta = baja * (1 - sube);
  const maximo = t < 3.6 ? baja : caso.aprieta;                            // las piezas se quedan donde las dejó el punzón
  const tope = alturaPunzon(maximo);
  return { punta, aprieta, punzon: alturaPunzon(aprieta), cuchilla: Math.min(CUCHILLA.arriba, tope), cuna: Math.min(CUNA.arriba, tope),
    fase: t < 1.6 ? "entra" : t < 2.1 ? "espera" : t < 3.6 ? "baja" : t < 4.3 ? "sube" : "fin" };
}

/** Qué ha pasado: si la cuchilla toca el cobre y si la cuña ha cogido la cubierta. */
export function resultadoDe(estado, caso) {
  const puntas = estado.cuchilla - CUCHILLA.alto;                           // altura de los dientes
  const debajo = CUCHILLA.dientes.filter((x) => estado.punta <= x).length;  // dientes con hilo debajo
  const atraviesa = puntas <= HILO.cu1;
  const dentro = estado.punta + caso.pelado <= CUNA.x0;                     // la cubierta llega hasta debajo de la cuña
  return { puntas, debajo, atraviesa, contacto: debajo > 0 && atraviesa, dentro, faltaFondo: (estado.punta - FONDO) / MM, faltaCobre: Math.max(0, puntas - HILO.cu1) / MM, peladoMm: caso.pelado / MM };
}
