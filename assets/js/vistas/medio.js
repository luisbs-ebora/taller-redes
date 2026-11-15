// medio.js — «Elige el medio» (Redes locales, Tema 2): casos de clientes y simulador de canales Wi‑Fi de 2,4 GHz.
import { h } from '../util.js';
import { MEDIOS, nombreMedio, crearTanda, corregirCaso, CANALES, ANCHO, centro, sePisan, crearEdificio } from '../practica/Medio.js';

const semillaNueva = () => 1000 + Math.floor(Math.random() * 9000);

function parteCasos() {
  let tanda, hechos = 0, aciertos = 0;
  const marcador = h('span.chip'), numero = h('span.chip'), lista = h('div');
  const pintarMarcador = () => { marcador.textContent = `${aciertos} de ${hechos} bien`; marcador.className = 'chip' + (hechos === tanda.casos.length && aciertos === hechos ? ' ok' : ''); };
  function nueva() {
    tanda = crearTanda(semillaNueva()); hechos = 0; aciertos = 0;
    numero.textContent = 'Tanda ' + tanda.semilla; pintarMarcador();
    lista.replaceChildren(...tanda.casos.map((caso, i) => {
      const pista = h('p.md-pista', { hidden: true });
      const sel = h('select', { 'aria-label': 'Medio para el caso ' + (i + 1) }, h('option', { value: '' }, 'Elige el medio…'), MEDIOS.map(([id, t]) => h('option', { value: id }, t)));
      const caja = h('div.md-caso', h('p', h('strong', `Caso ${i + 1}. `), caso.texto), sel, pista);
      sel.addEventListener('change', () => {
        if (!sel.value) return;
        const r = corregirCaso(caso, sel.value);
        sel.disabled = true; hechos++; if (r.ok) aciertos++;
        caja.classList.add(r.ok ? 'ok' : 'ko'); pista.hidden = false;
        pista.replaceChildren(r.ok ? (r.nota ? h('strong', 'Vale, pero no es lo mejor. ' + r.nota + ' ') : h('strong', 'Bien. ')) : h('strong', 'No. Lo adecuado: ' + caso.buenas.map(nombreMedio).join(' o ') + '. '), caso.porque);
        pintarMarcador();
      });
      return caja;
    }));
  }
  const el = h('section.tarjeta.md-bloque',
    h('h2', h('span.etiqueta', 'Parte 1'), ' ¿Qué medio pondrías?'),
    h('p', 'Seis clientes, seis necesidades. Elige el medio de transmisión para cada uno: al elegir verás si has acertado y por qué.'),
    h('div.md-barra', numero, marcador, h('button.btn.sec', { type: 'button', onclick: nueva }, 'Otra tanda')),
    lista);
  nueva();
  return el;
}

function parteCanales() {
  let edificio, canal;
  const dibujo = h('div.md-espectro'), estado = h('p.md-estado', { role: 'status' });
  const deslizador = h('input', { type: 'range', min: 1, max: CANALES, step: 1, 'aria-label': 'Canal de tu punto de acceso' });
  const salida = h('output');
  const X = f => 30 + (f - 2400) * 8, BASE = 150;
  const joroba = (c, clase, rotulo) => { const x0 = X(centro(c) - ANCHO / 2), x1 = X(centro(c) + ANCHO / 2), xm = X(centro(c));
    return `<path class="${clase}" d="M${x0} ${BASE}C${x0 + 26} ${BASE} ${xm - 52} 42 ${xm} 42S${x1 - 26} ${BASE} ${x1} ${BASE}Z"/><text class="md-rotulo ${clase}" x="${xm}" y="${clase.startsWith('md-tuyo') ? 16 : 34}" text-anchor="middle">${rotulo}</text>`; };
  function pintar() {
    const pisa = edificio.vecinos.filter(v => sePisan(v, canal));
    let marcas = '';
    for (let c = 1; c <= CANALES; c++) marcas += `<path class="md-marca" d="M${X(centro(c))} ${BASE}v6"/><text x="${X(centro(c))}" y="${BASE + 20}" text-anchor="middle"${c === canal ? ' class="md-tuyo-num"' : ''}>${c}</text>`;
    const solapes = pisa.map(v => { const a = Math.max(centro(v), centro(canal)) - ANCHO / 2, b = Math.min(centro(v), centro(canal)) + ANCHO / 2; return `<rect class="md-solape" x="${X(a)}" y="40" width="${X(b) - X(a)}" height="${BASE - 40}"/>`; }).join('');
    dibujo.innerHTML = `<svg viewBox="0 0 700 190" role="img" aria-label="Canales de 2,4 GHz: tu punto de acceso está en el canal ${canal}; los vecinos, en el ${edificio.vecinos.join(' y el ')}">${solapes}${edificio.vecinos.map((v, i) => joroba(v, 'md-vecino', 'Vecino ' + 'AB'[i])).join('')}${joroba(canal, 'md-tuyo' + (pisa.length ? ' md-mal' : ''), 'Tu red')}<path class="md-eje" d="M${X(2400)} ${BASE}H${X(2484)}"/>${marcas}<text x="${X(2442)}" y="186" text-anchor="middle" class="md-leyenda">canal</text></svg>`;
    salida.textContent = 'Canal ' + canal;
    estado.className = 'md-estado ' + (pisa.length ? 'ko' : 'ok');
    estado.textContent = pisa.length
      ? `Te pisas con ${pisa.map(v => 'el vecino del canal ' + v).join(' y con ')}: entre dos canales tiene que haber al menos 5 de distancia.`
      : `Libre: no te pisas con nadie.${[1, 6, 11].includes(canal) ? ' Con el 1, el 6 y el 11 caben tres redes sin molestarse.' : ' Aun así, lo normal es usar el 1, el 6 o el 11: si todo el edificio usa esos tres, nadie se queda a medias entre dos redes.'}`;
  }
  function nuevo() { edificio = crearEdificio(semillaNueva()); canal = edificio.tuyo; deslizador.value = canal; pintar(); }
  deslizador.addEventListener('input', () => { canal = Number(deslizador.value); pintar(); });
  const el = h('section.tarjeta.md-bloque',
    h('h2', h('span.etiqueta', 'Parte 2'), ' Los canales del Wi‑Fi de 2,4 GHz'),
    h('p', 'La banda de 2,4 GHz se reparte en 13 canales, pero cada red ocupa bastante más que su canal: unos 22 MHz, cuando los canales solo están separados 5 MHz. Tus dos vecinos ya han elegido. Mueve tu red hasta un canal donde no te pises con ninguno.'),
    dibujo,
    h('label.md-control', 'Tu canal', deslizador, salida),
    estado,
    h('div.md-barra', h('button.btn.sec', { type: 'button', onclick: nuevo }, 'Otro edificio')));
  nuevo();
  return el;
}

export function vistaMedio() {
  return { el: h('section.md',
    h('div.inicio-cab',
      h('span.etiqueta', 'Tema 2 · Medios de transmisión'),
      h('h1', 'Elige el medio'),
      h('p.lead', 'Cable, fibra o aire: decide qué medio de transmisión necesita cada cliente y coloca tu Wi‑Fi en un canal libre. No se guarda nada y no tiene nota.')),
    parteCasos(), parteCanales(),
    h('p.md-enlace', h('a', { href: 'figuras/fibra-optica.html' }, 'Ver la figura: fibra óptica por dentro →'))) };
}
