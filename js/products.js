/* ============================================================
   LECTORA DE ESTRELLAS — Catálogo de productos
   Fuente única de verdad. Edita aquí para actualizar todo.
   ============================================================ */

const PRODUCTS = {

  /* ── AGENDAS & CALENDARIOS ──────────────────────────── */

  'agenda-lunar-2026': {
    id: 'agenda-lunar-2026',
    name: 'Agenda Lunar 2026',
    category: 'agendas',
    price: 899,
    originalPrice: 1050,
    badge: 'Best Seller',
    badgeType: 'bestseller',
    sku: 'AGENDALUNAR26',
    digital: false,
    images: [
      'images/productos/agenda-lunar-2026-1.jpg',
      'images/productos/agenda-lunar-2026-2.jpg',
      'images/productos/agenda-lunar-2026-3.jpg',
    ],
    description: `La Agenda Lunar 2026 es tu compañera cósmica para sincronizarte con los ciclos de la luna cada día del año. Diseñada con intención y magia para ayudarte a planear, reflexionar y crecer alineada al cosmos.`,
    features: [
      'Portada ilustrada edición 2026 con acabados especiales',
      'Vista semanal con fases lunares marcadas',
      'Secciones de intención mensual y reflexión lunar',
      'Calendario de retrógrados y eventos astrológicos',
      'Papel de alta calidad 90g, tapa dura con espiral dorado',
      'Incluye stickers y separadores exclusivos',
    ],
    specs: 'Tamaño A5 · 380 páginas · Espiral dorado · Tapa dura',
    shipping: true,
    shippingNote: 'Envío a todo el mundo',
  },

  'diario-lunar-2026': {
    id: 'diario-lunar-2026',
    name: 'Diario Lunar 2026 · Edición Limitada',
    category: 'agendas',
    price: 250,
    badge: 'Edición Limitada',
    badgeType: 'limited',
    sku: 'DIARIOLUNARLIM26',
    digital: false,
    images: [
      'images/productos/diario-lunar-2026-1.jpg',
      'images/productos/diario-lunar-2026-2.jpg',
    ],
    description: `El Diario Lunar 2026 Edición Limitada es el espacio sagrado para tu escritura intuitiva, seguimiento de sueños y conexión con los ciclos de la luna. Edición numerada y limitada.`,
    features: [
      'Edición limitada y numerada',
      'Páginas pautadas para journaling libre',
      'Fases lunares mensuales ilustradas',
      'Tapa ilustrada exclusiva',
    ],
    specs: 'Tamaño A5 · 200 páginas · Espiral',
    shipping: true,
    shippingNote: 'Gratis en compra de Colección Lunar 2026 completa',
  },

  'calendario-mini-lunar-2026': {
    id: 'calendario-mini-lunar-2026',
    name: 'Calendario Mini de Escritorio Lunar 2026',
    category: 'agendas',
    price: 120,
    sku: 'CALMINI26',
    digital: false,
    images: [
      'images/productos/calendario-mini-1.jpg',
      'images/productos/calendario-mini-2.jpg',
    ],
    description: `El calendario mini de escritorio lunar 2026 es el accesorio perfecto para tener el cosmos siempre a la vista. Compacto, funcional y lleno de magia lunar.`,
    features: [
      'Formato mini de escritorio con soporte incluido',
      'Fases lunares de todo el año',
      'Diseño ilustrado colección 2026',
      'Papel de alta calidad',
    ],
    specs: '10×14 cm · 13 hojas · Soporte incluido',
    shipping: true,
    shippingNote: 'Envío a todo el mundo',
  },

  'print-calendario-lunar-2026': {
    id: 'print-calendario-lunar-2026',
    name: 'Print Calendario Lunar 2026',
    category: 'prints',
    price: 250,
    sku: 'PRINTCAL26',
    digital: false,
    images: [
      'images/productos/print-calendario-lunar-1.jpg',
      'images/productos/print-calendario-lunar-2.jpg',
    ],
    description: `El print del calendario lunar 2026 con todas las fases del año en un diseño ilustrado de gran formato. Perfecto para enmarcar y decorar tu espacio sagrado.`,
    features: [
      'Formato cartel para enmarcar',
      'Todas las fases lunares del año 2026',
      'Impresión de alta resolución en papel premium',
      'Diseño ilustrado exclusivo Lectora de Estrellas',
    ],
    specs: '30×42 cm · Papel premium 250g · Sin marco',
    shipping: true,
    shippingNote: 'Envío a todo el mundo — llega enrollado protegido',
  },

  /* ── CUADERNOS DE TRABAJO ───────────────────────────── */

  'workbook-zodiac-elements-duo': {
    id: 'workbook-zodiac-elements-duo',
    name: 'Workbook Zodiac Elements Duo',
    category: 'cuadernos',
    price: 350,
    sku: 'WBZODIAC',
    digital: false,
    images: [
      'images/productos/workbook-zodiac-1.jpg',
      'images/productos/workbook-zodiac-2.jpg',
    ],
    description: `Explora los cuatro elementos a través de los signos zodiacales en este workbook de trabajo profundo. Una herramienta guiada para profundizar en tu autoconocimiento a través de la astrología práctica.`,
    features: [
      'Ejercicios guiados por elemento (fuego, tierra, aire, agua)',
      'Perfil astrológico de cada signo del zodíaco',
      'Espacio para reflexión y escritura intuitiva',
      'Papel de alta calidad 90g',
    ],
    specs: 'Tamaño A5 · Espiral dorado · Edición bilingüe',
    shipping: true,
    shippingNote: 'Envío a todo el mundo',
  },

  'workbook-emociones-ciclos': {
    id: 'workbook-emociones-ciclos',
    name: 'La Astrología de mis Emociones y Ciclos de Vida',
    category: 'cuadernos',
    price: 350,
    sku: 'WBEMOCIONES',
    digital: false,
    images: [
      'images/productos/emociones-ciclos-1.jpg',
      'images/productos/emociones-ciclos-2.jpg',
    ],
    description: `Aprende a usar la astrología para entender tus emociones y los ciclos de tu vida. Una guía práctica para conectar los tránsitos planetarios con tu mundo emocional y tus etapas de vida.`,
    features: [
      'Guía de emociones por signo y elemento',
      'Mapa de ciclos de vida astrológicos',
      'Ejercicios de reflexión emocional',
      'Disponible en inglés · Español próximamente',
    ],
    specs: 'Tamaño A5 · Espiral dorado · English version available',
    languageOptions: [
      { id: 'es', label: 'Español', available: false, note: 'Próximamente' },
      { id: 'en', label: 'English', available: true },
    ],
    shipping: true,
    shippingNote: 'Envío a todo el mundo',
  },

  /* ── LIBRETAS ───────────────────────────────────────── */

  'libretas': {
    id: 'libretas',
    name: 'Libretas Artesanales',
    category: 'libretas',
    price: 250, // base price, some at 200
    sku: 'LIBRETA',
    digital: false,
    images: [
      'images/productos/libreta-mistica-1.jpg',
      'images/productos/libreta-sol-luna-1.jpg',
      'images/productos/libreta-fases-1.jpg',
      'images/productos/libreta-as-above-1.jpg',
      'images/productos/libreta-power-1.jpg',
      'images/productos/libreta-musa-1.jpg',
    ],
    description: `Libretas artesanales creadas con intención y magia. Ideales para journaling intuitivo, diarios personales, grimorios de tus aprendizajes witchy, introspección y escritura emocional. Cada página es un espacio sagrado para conectar contigo y dejar que tu luz se exprese.`,
    features: [
      'Papel de alta calidad 90g sin ácido',
      'Tapas ilustradas con diseños exclusivos',
      'Espiral dorado resistente',
      'Formato A5 · 200 páginas pautadas',
    ],
    specs: 'Tamaño A5 · 200 páginas · Espiral dorado',
    designs: [
      { id: 'mistica', name: 'Libreta Mística', price: 250, image: 'images/productos/libreta-mistica-1.jpg', sku: 'LIB-MIST' },
      { id: 'sol-luna', name: 'Libreta Sol & Luna', price: 250, image: 'images/productos/libreta-sol-luna-1.jpg', sku: 'LIB-SOL' },
      { id: 'fases-lunares', name: 'Libreta Fases Lunares', price: 200, image: 'images/productos/libreta-fases-1.jpg', sku: 'LIB-FASES' },
      { id: 'as-above', name: 'Libreta As Above So Below', price: 250, image: 'images/productos/libreta-as-above-1.jpg', sku: 'LIB-ASABOVE' },
      { id: 'power-of-your-light', name: 'Libreta Power of Your Light', price: 250, image: 'images/productos/libreta-power-1.jpg', sku: 'LIB-POWER' },
      { id: 'musa-lunar', name: 'Libreta Musa Lunar', price: 200, image: 'images/productos/libreta-musa-1.jpg', sku: 'LIB-MUSA' },
    ],
    shipping: true,
    shippingNote: 'Envío a todo el mundo',
  },

  /* ── BUNDLES ────────────────────────────────────────── */

  'bundles': {
    id: 'bundles',
    name: 'Bundles',
    category: 'bundles',
    price: 570, // base price
    sku: 'BUNDLE',
    digital: false,
    images: [
      'images/productos/bundle-mistica-1.jpg',
      'images/productos/bundle-sol-luna-1.jpg',
    ],
    description: `Los bundles incluyen una libreta artesanal de tu diseño favorito más una mini libreta y un notepad de regalo. El kit perfecto para tu práctica de journaling y escritura intuitiva.`,
    features: [
      '1 Libreta artesanal A5 del diseño elegido',
      '1 Mini libreta de regalo',
      '1 Notepad de regalo',
      'Empaque especial para regalo',
    ],
    specs: 'Libreta A5 + Mini libreta + Notepad · Empaque regalo',
    designs: [
      { id: 'mistica', name: 'Bundle Mística', price: 570, image: 'images/productos/bundle-mistica-1.jpg', sku: 'BUN-MIST' },
      { id: 'sol-luna', name: 'Bundle Sol & Luna', price: 570, image: 'images/productos/bundle-sol-luna-1.jpg', sku: 'BUN-SOL' },
      { id: 'fases-lunares', name: 'Bundle Fases Lunares', price: 500, image: 'images/productos/bundle-fases-1.jpg', sku: 'BUN-FASES' },
      { id: 'as-above', name: 'Bundle As Above So Below', price: 570, image: 'images/productos/bundle-as-above-1.jpg', sku: 'BUN-ASABOVE' },
      { id: 'power-of-your-light', name: 'Bundle Power of Your Light', price: 570, image: 'images/productos/bundle-power-1.jpg', sku: 'BUN-POWER' },
      { id: 'musa-lunar', name: 'Bundle Musa Lunar', price: 500, image: 'images/productos/bundle-musa-1.jpg', sku: 'BUN-MUSA' },
    ],
    shipping: true,
    shippingNote: 'Envío a todo el mundo',
  },

  /* ── DIARIO ZODIACAL ────────────────────────────────── */

  'diario-zodiacal': {
    id: 'diario-zodiacal',
    name: 'Diario Zodiacal',
    category: 'libretas',
    price: 200,
    sku: 'DIARIOZOD',
    digital: false,
    images: [
      'images/productos/diario-zodiacal-aries.jpg',
      'images/productos/diario-zodiacal-tauro.jpg',
    ],
    description: `El Diario Zodiacal es tu compañero para explorar la energía de tu signo solar. Elige la portada de tu signo zodiacal — mismo interior, cada uno con la ilustración característica de su signo.`,
    features: [
      'Portada ilustrada con tu signo zodiacal',
      'Interior idéntico con páginas para journaling libre',
      'Papel de alta calidad 90g',
      'Espiral dorado',
    ],
    specs: 'Tamaño A5 · 200 páginas · Espiral dorado',
    signs: [
      { id: 'aries', name: 'Aries ♈', image: 'images/productos/diario-zodiacal-aries.jpg' },
      { id: 'tauro', name: 'Tauro ♉', image: 'images/productos/diario-zodiacal-tauro.jpg' },
      { id: 'geminis', name: 'Géminis ♊', image: 'images/productos/diario-zodiacal-geminis.jpg' },
      { id: 'cancer', name: 'Cáncer ♋', image: 'images/productos/diario-zodiacal-cancer.jpg' },
      { id: 'leo', name: 'Leo ♌', image: 'images/productos/diario-zodiacal-leo.jpg' },
      { id: 'virgo', name: 'Virgo ♍', image: 'images/productos/diario-zodiacal-virgo.jpg' },
      { id: 'libra', name: 'Libra ♎', image: 'images/productos/diario-zodiacal-libra.jpg' },
      { id: 'escorpio', name: 'Escorpio ♏', image: 'images/productos/diario-zodiacal-escorpio.jpg' },
      { id: 'sagitario', name: 'Sagitario ♐', image: 'images/productos/diario-zodiacal-sagitario.jpg' },
      { id: 'capricornio', name: 'Capricornio ♑', image: 'images/productos/diario-zodiacal-capricornio.jpg' },
      { id: 'acuario', name: 'Acuario ♒', image: 'images/productos/diario-zodiacal-acuario.jpg' },
      { id: 'piscis', name: 'Piscis ♓', image: 'images/productos/diario-zodiacal-piscis.jpg' },
    ],
    shipping: true,
    shippingNote: 'Envío a todo el mundo',
  },

  /* ── PRINTS ─────────────────────────────────────────── */

  'print-carta-astral': {
    id: 'print-carta-astral',
    name: 'Print Carta Astral',
    category: 'prints',
    price: 650,
    sku: 'PRINTCARTA',
    digital: false,
    images: [
      'images/productos/print-carta-astral-normal.jpg',
    ],
    description: `Tu carta astral única, ilustrada a mano y enmarcada. Diseño clásico con todos los planetas, casas y aspectos de tu carta natal, con presentación premium lista para colgar.`,
    features: [
      'Diseño único basado en tus datos de nacimiento exactos',
      'Impresión de alta resolución en papel premium',
      'Enmarcada lista para colgar',
      'Incluye datos de planetas, casas y aspectos',
      'Tiempo de producción: 5-7 días hábiles',
    ],
    specs: '30×40 cm enmarcada · Papel 250g · Marco incluido',
    requiresForm: true,
    formFields: [
      { id: 'nombre', label: 'Nombre', type: 'text', required: true },
      { id: 'apellido', label: 'Apellido', type: 'text', required: true },
      { id: 'dia', label: 'Día de nacimiento', type: 'number', min: 1, max: 31, required: true },
      { id: 'mes', label: 'Mes de nacimiento', type: 'select', required: true,
        options: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] },
      { id: 'anio', label: 'Año de nacimiento', type: 'number', min: 1920, max: 2010, required: true },
      { id: 'hora', label: 'Hora de nacimiento', type: 'time', required: true },
      { id: 'ampm', label: 'AM / PM', type: 'select', required: true, options: ['AM', 'PM'] },
      { id: 'lugar', label: 'Lugar de nacimiento', type: 'text', placeholder: 'Ciudad, País', required: true },
    ],
    shipping: true,
    shippingNote: 'Envío a todo el mundo — producción 5-7 días hábiles',
  },

  'print-carta-astral-infantil': {
    id: 'print-carta-astral-infantil',
    name: 'Print Carta Astral Infantil',
    category: 'prints',
    price: 650,
    sku: 'PRINTCARTAINF',
    digital: false,
    images: [
      'images/productos/print-carta-astral-infantil.jpg',
    ],
    description: `La carta astral de tu bebé o niñ@ en un diseño ilustrado especial. Perfecta como regalo de nacimiento o cumpleaños. Elige el color de fondo, ingresa los datos de nacimiento y recibe un print único hecho a mano.`,
    features: [
      'Diseño ilustrado infantil exclusivo',
      '5 colores de fondo disponibles: azul, rosa, lila, amarillo, verde',
      'Diseño único basado en los datos de nacimiento',
      'Impresión de alta resolución en papel premium',
      'Enmarcada lista para colgar',
      'Tiempo de producción: 5-7 días hábiles',
    ],
    specs: '30×40 cm enmarcada · Papel 250g · Marco incluido',
    requiresForm: true,
    colorOptions: [
      { id: 'azul',     name: 'Azul',     hex: '#7BB8E8' },
      { id: 'rosa',     name: 'Rosa',     hex: '#F0A8C0' },
      { id: 'lila',     name: 'Lila',     hex: '#C4A0D4' },
      { id: 'amarillo', name: 'Amarillo', hex: '#F5D87A' },
      { id: 'verde',    name: 'Verde',    hex: '#8ECFA0' },
    ],
    formFields: [
      { id: 'nombre', label: 'Nombre', type: 'text', required: true },
      { id: 'apellido', label: 'Apellido', type: 'text', required: true },
      { id: 'dia', label: 'Día de nacimiento', type: 'number', min: 1, max: 31, required: true },
      { id: 'mes', label: 'Mes de nacimiento', type: 'select', required: true,
        options: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] },
      { id: 'anio', label: 'Año de nacimiento', type: 'number', min: 1920, max: 2030, required: true },
      { id: 'hora', label: 'Hora de nacimiento', type: 'time', required: true },
      { id: 'ampm', label: 'AM / PM', type: 'select', required: true, options: ['AM', 'PM'] },
      { id: 'lugar', label: 'Lugar de nacimiento', type: 'text', placeholder: 'Ciudad, País', required: true },
    ],
    shipping: true,
    shippingNote: 'Envío a todo el mundo — producción 5-7 días hábiles',
  },

  /* ── DIGITALES ──────────────────────────────────────── */

  'agenda-lunar-2026-digital': {
    id: 'agenda-lunar-2026-digital',
    name: 'Agenda Lunar 2026 Digital Interactiva',
    category: 'digitales',
    price: 299,
    badge: 'Digital',
    badgeType: 'digital',
    sku: 'AGENDADIGITAL26',
    digital: true,
    images: [
      'images/productos/agenda-digital-1.jpg',
      'images/productos/agenda-digital-2.jpg',
    ],
    description: `La versión digital e interactiva de la Agenda Lunar 2026. Descárgala en PDF y úsala en tu tablet o dispositivo favorito con todos los hipervínculos y elementos interactivos funcionales.`,
    features: [
      'PDF interactivo con hipervínculos internos',
      'Compatible con GoodNotes, Notability y cualquier app de PDF',
      'Fases lunares y eventos astrológicos 2026',
      'Descarga inmediata al comprar',
      'Acceso permanente al archivo',
    ],
    specs: 'Formato PDF · Descarga digital · Sin envío físico',
    shipping: false,
    downloadNote: 'Recibes el link de descarga en tu email al confirmar el pago',
    downloadUrl: 'https://drive.google.com/file/d/19-dxPsVDaT1ON00t10NnjZi8yBd3dKW5/view?usp=share_link',
  },

  'calendario-astrologico-digital-2026': {
    id: 'calendario-astrologico-digital-2026',
    name: 'Calendario Astrológico Digital 2026',
    category: 'digitales',
    price: 199,
    badge: 'Digital',
    badgeType: 'digital',
    sku: 'CALASTRODIGITAL26',
    digital: true,
    images: [
      'images/productos/calendario-astro-digital-1.jpg',
    ],
    description: `El calendario astrológico 2026 completo en formato digital. Todos los tránsitos, retrógrados, lunas llenas y nuevas, temporadas zodiacales y eventos cósmicos del año.`,
    features: [
      'Todos los eventos astrológicos 2026',
      'Fases lunares y eclipses',
      'Retrógrados planetarios',
      'Formato PDF de alta resolución',
      'Descarga inmediata al comprar',
    ],
    specs: 'Formato PDF · Descarga digital · Sin envío físico',
    shipping: false,
    downloadNote: 'Recibes el link de descarga en tu email al confirmar el pago',
    downloadUrl: 'https://drive.google.com/file/d/1DiKupYBO9yw-n1rbFbernhOTc312SMsf/view?usp=share_link',
  },
};

// Category labels for display
const CATEGORIES = {
  agendas:   { label: 'Agendas & Calendarios', icon: '🌙' },
  cuadernos: { label: 'Cuadernos de trabajo',  icon: '📓' },
  libretas:  { label: 'Libretas & Bundles',     icon: '✨' },
  bundles:   { label: 'Bundles',                icon: '🎁' },
  prints:    { label: 'Prints',                 icon: '🖼️' },
  digitales: { label: 'Productos digitales',    icon: '💫' },
};

window.PRODUCTS = PRODUCTS;
window.CATEGORIES = CATEGORIES;
