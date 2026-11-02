// api.js — Práctica: se genera y corrige en el navegador (no cuenta para nota).
//          Examen: lo genera y corrige el Apps Script (la página solo envía y muestra).
import { URL_SCRIPT } from './config.js';

export function scriptConfigurado() { return /^https:\/\/script\.google(usercontent)?\.com\//.test(URL_SCRIPT) || URL_SCRIPT.startsWith('/'); }

let motorListo = null;
function cargarScript(src) {
  return new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = () => ko(new Error('No se pudo cargar el corrector de la práctica.'));
    document.head.append(s);
  });
}
export async function motor() {
  if (!motorListo) motorListo = cargarScript('assets/js/practica/MotorRed.js').then(() => cargarScript('assets/js/practica/Ejercicios.js'))
    .catch(e => { motorListo = null; throw e; });
  await motorListo;
  return { M: window.MotorRed, EJ: window.EJERCICIOS_RED };
}
// El caso de práctica se identifica por su semilla: con la misma semilla se vuelve a generar idéntico.
async function casoDesdeId(casoId) {
  const m = /^L-([\w-]+)-(\d+)$/.exec(String(casoId || ''));
  if (!m) throw new Error('Este caso de práctica no es válido. Empieza otro.');
  const { M, EJ } = await motor();
  const def = EJ[m[1]];
  if (!def) throw new Error('Ejercicio desconocido.');
  return { M, def, caso: M.crearCaso(def, Number(m[2])) };
}

export async function llamar(accion, datos = {}) {
  if (accion === 'practica-empezar') {
    const seed = Math.floor(Math.random() * 2147483647);
    const casoId = `L-${datos.ejercicio}-${seed}`;
    const { M, caso } = await casoDesdeId(casoId);
    return { ok: true, casoId, caso: M.casoPublico(caso) };
  }
  if (accion === 'practica-entregar') {
    const { M, def, caso } = await casoDesdeId(datos.casoId);
    return { ok: true, resultado: M.corregir(def, caso, JSON.parse(JSON.stringify(datos.respuesta))), solucionEjemplo: caso.solucionEjemplo };
  }
  if (!scriptConfigurado()) throw new Error('La web aún no está conectada con la hoja de notas. Avisa al profesor.');
  let r;
  try {
    // text/plain evita la petición previa CORS que Apps Script no admite
    r = await fetch(URL_SCRIPT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ accion, ...datos }), redirect: 'follow' });
  } catch (e) {
    throw new Error('No hay conexión con el servidor. Comprueba Internet y vuelve a intentarlo.');
  }
  let j;
  try { j = await r.json(); } catch (e) { throw new Error('Respuesta inesperada del servidor.'); }
  if (!j.ok) throw new Error(j.error || 'Error desconocido.');
  return j;
}
