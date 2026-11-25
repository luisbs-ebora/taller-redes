// indice.js — Qué hay en el taller, por grupo y por tema. De aquí salen el menú lateral, la portada y la página de cada tema.
// Para añadir una actividad o un tema, basta con añadirlo aquí.
export const INDICE = {
  clave: 'taller-redes',
  grupos: [
    { rotulo: '1.º SMR · Redes locales', temas: [
      { id: 'smr1', n: 'Tema 1', titulo: 'Introducción a las redes locales',
        resumen: 'Qué es una red, qué equipos la forman y cómo se dibuja. Todo sobre la red de una empresa: Cerámicas Ribera del Tajo.',
        items: [
          { href: '#/animado', titulo: 'Red animada', texto: 'La red de Cerámicas Ribera del Tajo montada paso a paso, con el presupuesto y los errores típicos.', chip: 'Disponible' },
          { href: '#/mapas', titulo: 'Mapa físico y diagrama lógico', texto: 'Las oficinas de Cerámicas dibujadas de las dos formas: toca un equipo y mira cómo sale en cada una.', chip: 'Disponible' },
          { href: '#/practica', titulo: 'Práctica: diseña una red', texto: 'Te toca una empresa distinta cada vez, de tres sedes o pequeña: clasifica sus redes, diséñala sobre el plano y haz la compra. La web te corrige.', chip: 'Sin nota' }
        ] },
      { id: 'smr2', n: 'Tema 2', titulo: 'Medios de transmisión y espacios físicos',
        resumen: 'Por dónde viajan los datos: cable de pares, fibra óptica y aire. Y dónde se guarda todo: el armario rack.',
        items: [
          { href: '#/rack', titulo: 'Armario rack', texto: 'Monta el armario de un aula de 20 puestos: panel de parcheo, pasahilos, switch, SAI y regleta, cada cosa en su U.', chip: 'Disponible' },
          { href: 'figuras/fibra-optica.html', titulo: 'Fibra óptica por dentro', texto: 'Una fibra cortada a lo largo: gira el láser, mira cómo rebota la luz en el núcleo, cuándo se escapa y por qué el monomodo llega más lejos.', chip: 'Disponible' },
          { href: 'figuras/wifi.html', titulo: 'La Wi‑Fi por dentro', texto: 'Un piso visto desde arriba: mueve el móvil de habitación en habitación, cambia de banda y pon vecinos en tu canal para ver por qué la señal se cae.', chip: 'Disponible' },
          { href: '#/medio', titulo: 'Práctica: elige el medio', texto: 'Cable, fibra o aire: decide qué medio necesita cada cliente y coloca tu Wi‑Fi de 2,4 GHz en un canal donde no te pises con los vecinos.', chip: 'Sin nota' },
          { href: '#/latiguillo', titulo: 'Práctica: haz el latiguillo', texto: 'Ordena los ocho hilos en los dos RJ45 según la norma, crímpalos y pásales el tester. Después, diagnostica cables con hilos abiertos, cruzados o en corto.', chip: 'Sin nota' },
          { href: 'figuras/rj45.html', titulo: 'El RJ45 por dentro', texto: 'Un conector cortado a lo largo en la prensa de crimpar: mira cómo la cuchilla atraviesa el aislante y qué pasa si el hilo no llega al fondo o no aprietas del todo.', chip: 'Disponible' }
        ] }
    ] },
    { rotulo: '1.º ASIR · PAR', temas: [
      { id: 'par1', n: 'Tema 1', titulo: 'Caracterización de redes de datos',
        resumen: 'Tipos de red, topologías, capas, direcciones y Ethernet, con una figura de CSMA/CD y una práctica de repaso de todo el tema.',
        items: [
          { href: 'figuras/csma-cd.html', titulo: 'CSMA/CD con un hub', texto: 'Cuatro equipos y un hub: haz que envíen a la vez y sigue la colisión, la señal de atasco y la espera al azar de cada uno.', chip: 'Disponible' },
          { href: '#/analiza', titulo: 'Práctica: analiza la red', texto: 'Ocho bloques con un caso distinto cada vez, para repasar todo el tema: tipos de red, topologías, binario y máscaras, capas, encapsulamiento, dominios, la trama Ethernet y CSMA/CD. La web te corrige.', chip: 'Sin nota' }
        ] },
      { id: 'par2', n: 'Tema 2', titulo: 'Integración de equipos en redes cableadas e inalámbricas',
        resumen: 'Medios físicos, cableado estructurado, cables y redes inalámbricas (secciones 1 a 4), con una práctica de repaso y lo que ya hay en el tema de SMR.',
        items: [
          { href: '#/analiza-medio', titulo: 'Práctica: analiza el medio', texto: 'Cinco bloques con un caso distinto cada vez: velocidades y Shannon, cables y fibra, cableado estructurado, informes de un certificador y Wi‑Fi.', chip: 'Disponible' },
          { href: '#/latiguillo', titulo: 'Práctica: haz el latiguillo', texto: 'Crimpa un directo, un cruzado o un cable de consola y pásale el tester. Tiene un bloque para ASIR: qué cable une cada pareja de equipos, qué comprobador hace falta y 9600 8N1.', chip: 'Disponible' },
          { href: 'figuras/fibra-optica.html', titulo: 'Fibra óptica por dentro', texto: 'Figura de SMR, como repaso: la luz rebotando en el núcleo y por qué la monomodo llega más lejos.', chip: 'Repaso' },
          { href: 'figuras/wifi.html', titulo: 'La Wi‑Fi por dentro', texto: 'Figura de SMR, como repaso: atenuación por paredes, 2,4 frente a 5 GHz y canales que se solapan.', chip: 'Repaso' },
        ] }
    ] }
  ]
};
