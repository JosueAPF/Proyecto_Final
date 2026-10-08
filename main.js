/* =====================================================================
  Brenda Susana Echeverria Nova
  Reivini Nicolle Figueroa Vides
  Allan Francisco Figueroa Vides
  Josue Abraham Porras Figueroa
   ===================================================================== */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * Mismo criterio que el breakpoint "modo cajón" de styles.css: ancho
 * angosto (tablets en vertical) O dispositivo táctil sin mouse/trackpad
 * (tablets grandes en horizontal, como el iPad Pro de 12.9" a 1366px,
 * que por ancho solo quedaría en modo escritorio). Si cambias el CSS,
 * actualiza esta cadena también para que ambos coincidan.
 */
const MOBILE_LAYOUT_QUERY = "(max-width: 1024px), (hover: none) and (pointer: coarse)";

/* =====================================================================
   1. CONSTANTES DEL MODELO MATEMÁTICO
   Estas cifras son las mismas que aparecen en el informe: dimensiones
   del terreno, valor de diseño x = 75 m, y datos del tanque cilíndrico.
   Mantenerlas centralizadas evita "números mágicos" repetidos en el
   código y permite recalcular todo si un valor cambia.
   ===================================================================== */
const MODEL = {
  terrenoAncho: 200,      // m — ancho fijo del terreno (eje x del croquis)
  terrenoLargo: 300,      // m — largo total del terreno (eje z del croquis)
  terrenoArea: 60000,     // m²

  teatroLargo: 50,        // m — 10,000 m² ÷ 200 m
  teatroArea: 10000,      // m²

  xDiseno: 75,             // m — valor de diseño adoptado para el parqueo
  parqueoArea: 15000,      // m² — AP(75)

  verdeArea: 35000,        // m² — AV(75)

  tanqueRadio: 10,         // m
  tanqueAltura: 30 / Math.PI, // ≈ 9.55 m
  tanqueVolumen: 3000,      // m³

  perimetro: 550,          // m — P(75)

  precioOptimo: 75,        // Q — p(2.5)
  asistenciaOptima: 1500,  // espectadores — E(2.5)
  ingresoMaximo: 112500,   // Q — I(2.5)
  tOptimo: 2.5,
};

/* =====================================================================
   2. CONTENIDO DE CADA SECCIÓN
   Cada entrada describe lo que se muestra en el panel derecho:
   - navLabel: texto en la nav izquierda (null = no aparece en la nav,
     se usa solo cuando el usuario hace clic directo sobre un objeto 3D)
   - linkedObject: id del objeto 3D asociado (o null si es una sección
     puramente narrativa del informe)
   - body: párrafos de explicación (arreglo de cadenas HTML simples)
   - formulas: fórmulas en LaTeX, renderizadas con KaTeX
   - table: tabla de datos opcional {headers, rows, highlightRow}
   - chart: configuración de gráfica opcional (ver sección 4)
   ===================================================================== */
const contentData = {

  introduccion: {
    navLabel: "Introducción",
    linkedObject: null,
    kicker: "Presentación del proyecto",
    title: "Modelado matemático de un teatro",
    body: [
      "Este proyecto traduce el encargo de diseño de un teatro —construido sobre un terreno de <strong>200 m × 300 m</strong>— en seis modelos matemáticos: dos funciones de área, una función racional para el tanque de agua, una función de perímetro y una función cuadrática de ingreso que se optimiza mediante el vértice de la parábola.",
      "El enunciado original solo fija dos datos: las dimensiones del terreno y la capacidad del tanque (3,000 m³). Todo lo demás —el ancho del parqueo, el precio del boleto, la asistencia esperada— se construyó como un <em>supuesto de diseño</em> explícito, no como un dato impuesto.",
      "Usa el visor 3D para explorar el terreno: cada zona, el tanque y el ingreso principal son objetos que puedes seleccionar. Al hacerlo, este panel mostrará la función que los describe, su dominio y una gráfica interactiva.",
    ],
  },

  datos: {
    navLabel: "Datos y Supuestos",
    linkedObject: null,
    kicker: "Origen de cada cifra",
    title: "Datos del problema y supuestos del modelo",
    body: [
      "El trabajo distingue de forma explícita entre lo que el enunciado <strong>proporciona</strong> y lo que el equipo <strong>supuso</strong> para poder construir las funciones solicitadas. Esta separación permite recalcular el modelo si cambian los supuestos.",
    ],
    table: {
      headers: ["Elemento", "Valor", "Origen"],
      rows: [
        ["Terreno total", "200 × 300 = 60,000 m²", "Dato del enunciado"],
        ["Capacidad del tanque", "3,000 m³", "Dato del enunciado"],
        ["Área del teatro", "10,000 m² (largo 50 m)", "Supuesto de diseño"],
        ["Radio del tanque", "10 m", "Supuesto de diseño"],
        ["Capacidad de espectadores", "2,000", "Supuesto de diseño"],
        ["Precio inicial del boleto", "Q100", "Supuesto de diseño"],
        ["Asistencia inicial", "1,000 espectadores", "Supuesto de diseño"],
        ["Incremento de asistencia", "+200 por cada −Q10", "Supuesto de diseño"],
      ],
    },
    callout: "Notación: <b>x</b> se usa únicamente para medidas de longitud (metros) y <b>t</b> para la variable del modelo de ingreso, evitando que un mismo símbolo represente dos magnitudes distintas.",
  },

  croquis: {
    navLabel: "Croquis",
    linkedObject: null,
    kicker: "Disposición de las áreas",
    title: "Croquis y disposición del terreno",
    body: [
      "Según la Figura 1 del informe, el área verde ocupa la <strong>franja superior de ancho completo</strong> (200 m). El teatro y el parqueo comparten la <strong>franja inferior</strong>, colocados lado a lado y cerca de la entrada principal: el teatro a la izquierda y el parqueo a la derecha.",
      "Esa franja inferior tiene una profundidad de 125 m (los 300 m del terreno menos los 175 m de área verde). Dentro de ella, el ancho de cada zona se ajusta para reproducir exactamente las áreas requeridas por el modelo: 80 m para el teatro y 120 m para el parqueo.",
      "El tanque cilíndrico se representa sobre el techo del teatro, como símbolo y sin escala real respecto al edificio — tal como lo indica el informe original.",
    ],
    table: {
      headers: ["Zona", "Dimensiones (visor 3D)", "Área"],
      rows: [
        ["Teatro", "80 m × 125 m", "10,000 m²"],
        ["Parqueo", "120 m × 125 m", "15,000 m²"],
        ["Área verde", "200 m × 175 m", "35,000 m²"],
      ],
      highlightRow: -1,
    },
    callout: "Nota de representación: el visor 3D prioriza fidelidad visual a la Figura 1 del informe. El modelo algebraico AP(x) = 200x trata el parqueo como si su lado mayor coincidiera con los 200 m del terreno — una simplificación habitual para reducir el área a una sola variable x, independiente de la forma exacta con que se dibuje el lote.<br><br>Verificación: 10,000 + 15,000 + 35,000 = <b>60,000 m²</b>, exactamente el área del terreno.",
  },

  parqueo: {
    navLabel: "Área de Parqueo",
    linkedObject: "ground_parqueo",
    kicker: "Función lineal de área",
    title: "Área de parqueo",
    body: [
      "El parqueo es un rectángulo cuyo largo es el ancho completo del terreno (200 m) y cuyo ancho es la variable de diseño <b>x</b>.",
      "La pendiente 200 tiene una lectura directa: cada metro adicional de ancho asignado al parqueo aporta 200 m² de superficie.",
      "El valor de diseño x = 75 m se obtuvo a partir de un estándar de planificación: 2,000 espectadores ÷ 4 = 500 espacios de estacionamiento, y 500 × 30 m² por vehículo = 15,000 m². Igualando <b>200x = 15,000</b> se despeja x = 75 m.",
    ],
    formulas: [
      { latex: "AP(x) = 200x", caption: "Área de parqueo en función del ancho x" },
      { latex: "\\text{Dom}(AP) = \\{\\,x \\in \\mathbb{R} \\mid 0 < x < 250\\,\\}", caption: "Dominio: el parqueo debe existir y debe quedar terreno para el área verde" },
    ],
    tags: ["Función lineal", "Pendiente = 200"],
    chart: { key: "AP", highlightX: 75, highlightLabel: "x = 75 m → 15,000 m²" },
  },

  verde: {
    navLabel: "Área Verde",
    linkedObject: "ground_verde",
    kicker: "Función lineal complementaria",
    title: "Área verde",
    body: [
      "El área verde es la superficie restante después de descontar el teatro (10,000 m²) y el parqueo (200x) del terreno total (60,000 m²).",
      "Su pendiente, −200, es exactamente la opuesta a la del parqueo: el terreno es una cantidad fija, así que cada metro cuadrado que gana una zona lo pierde la otra.",
      "Verificación de consistencia: la suma de las tres áreas es constante para cualquier x admisible, porque los términos en x se cancelan algebraicamente.",
    ],
    formulas: [
      { latex: "AV(x) = 50{,}000 - 200x", caption: "Área verde en función del ancho de parqueo x" },
      { latex: "AP(x) + A_{teatro} + AV(x) = 60{,}000", caption: "Verificación: la suma permanece constante en todo el dominio" },
    ],
    tags: ["Función lineal", "Pendiente = −200"],
    chart: { key: "AV", highlightX: 75, highlightLabel: "x = 75 m → 35,000 m²" },
  },

  tanque: {
    navLabel: "Volumen del Tanque",
    linkedObject: "tank_group",
    kicker: "Función racional",
    title: "Volumen del tanque cilíndrico",
    body: [
      "El enunciado fija la capacidad en 3,000 m³ pero no las dimensiones. Como el volumen de un cilindro depende de radio <b>y</b> altura, existen infinitas combinaciones (r, h) que cumplen esa capacidad.",
      "Al despejar la altura de la fórmula del volumen se obtiene una función racional: la altura decrece con el <b>cuadrado</b> del radio, de modo que duplicar el radio reduce la altura necesaria a la cuarta parte.",
      "Se adoptó r = 10 m como supuesto de diseño operativamente razonable, lo que da una altura de aproximadamente 9.55 m.",
    ],
    formulas: [
      { latex: "V = \\pi r^2 h = 3{,}000", caption: "Volumen del cilindro (dato fijo)" },
      { latex: "h(r) = \\dfrac{3{,}000}{\\pi r^2}", caption: "Altura en función del radio, a capacidad constante" },
      { latex: "h(10) = \\dfrac{3{,}000}{\\pi (10)^2} = \\dfrac{30}{\\pi} \\approx 9.55\\text{ m}", caption: "Evaluación con el radio de diseño" },
    ],
    tags: ["Función racional", "Asíntotas en r=0 y h=0"],
    chart: { key: "h", highlightX: 10, highlightLabel: "r = 10 m → h ≈ 9.55 m" },
  },

  perimetro: {
    navLabel: "Perímetro",
    linkedObject: "perimeter_group",
    kicker: "Función constante",
    title: "Perímetro del parque",
    body: [
      "terreno completo asignado al proyecto 200 m × 300 m"
    ],
    formulas: [
      { latex: "P(x) = 2(200 + 300) = 1{,}000\\text{ m}", caption: "Perímetro del terreno completo (el parque), constante para todo x en su dominio" },
    ],
    tags: ["Función constante", "No depende de x"],
    chart: { key: "P", highlightX: 75, highlightLabel: "Constante: 1,000 m para todo x" },
  },

  taquilla: {
    navLabel: "Ingreso de Taquilla",
    linkedObject: "entrance_group",
    kicker: "Función cuadrática y optimización",
    title: "Ingreso en taquilla y su optimización",
    body: [
      "El ingreso es precio × asistencia. Ambas magnitudes están relacionadas de forma inversa, así que se modelan en función de <b>t</b>: el número de reducciones de Q10 aplicadas al precio inicial de Q100.",
      "Al multiplicar precio y asistencia se obtiene una función cuadrática que abre hacia abajo (a = −2,000 &lt; 0), por lo que su vértice es un máximo.",
      "El dominio se restringe a [0, 5] porque la asistencia no puede superar los 2,000 espectadores de capacidad.",
      "En t = 2.5 (una reducción de Q25) el ingreso alcanza su máximo: boleto a <b>Q75</b>, <b>1,500</b> espectadores, ingreso de <b>Q112,500</b>.",
    ],
    formulas: [
      { latex: "p(t) = 100 - 10t \\qquad E(t) = 1{,}000 + 200t", caption: "Precio y asistencia en función de t" },
      { latex: "I(t) = -2{,}000t^2 + 10{,}000t + 100{,}000", caption: "Función de ingreso (producto de p(t) y E(t))" },
      { latex: "t = \\dfrac{-b}{2a} = \\dfrac{-10{,}000}{2(-2{,}000)} = 2.5", caption: "Vértice de la parábola — punto de ingreso máximo" },
    ],
    tags: ["Función cuadrática", "Máximo en el vértice"],
    chart: { key: "I", highlightX: 2.5, highlightLabel: "t = 2.5 → Q112,500" },
  },

  // Solo accesible haciendo clic directo sobre el edificio en el visor 3D
  // (no aparece en la navegación principal, que sigue el índice del informe).
  edificioTeatro: {
    navLabel: null,
    linkedObject: "theatre_building",
    kicker: "Elemento fijo del modelo",
    title: "Edificio del teatro",
    body: [
      "A diferencia del parqueo y el área verde, la superficie del teatro se trató como un <strong>supuesto de diseño fijo</strong>: 10,000 m². Como el ancho está fijado por el terreno (200 m), el largo queda determinado directamente.",
      "El tanque cilíndrico se apoya sobre el techo del edificio como representación simbólica, sin relación de escala con la estructura.",
    ],
    formulas: [
      { latex: "\\text{Largo} = \\dfrac{10{,}000\\text{ m}^2}{200\\text{ m}} = 50\\text{ m}", caption: "Largo del teatro, con área y ancho fijos" },
    ],
    tags: ["Valor fijo", "10,000 m²"],
  },
};

// Orden de la navegación izquierda (sigue el índice del informe)
const navOrder = [
  "introduccion", "datos", "croquis", "parqueo", "verde",
  "tanque", "perimetro", "taquilla",
];

/* =====================================================================
   3. CONSTRUCCIÓN DE LA INTERFAZ
   ===================================================================== */

let activeId = null;

function renderNav() {
  const list = document.getElementById("nav-list");
  list.innerHTML = "";
  navOrder.forEach((id) => {
    const entry = contentData[id];
    const li = document.createElement("li");
    li.className = "nav-item" + (entry.linkedObject ? " is-linked" : "");
    li.dataset.id = id;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = entry.navLabel;
    btn.addEventListener("click", () => selectContentWithCleanup(id, { fromNav: true }));
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function setActiveNav(id) {
  document.querySelectorAll(".nav-item").forEach((li) => {
    li.classList.toggle("active", li.dataset.id === id);
  });
}

/** Construye el HTML de una fila de tabla, resaltando la fila indicada. */
function buildTable(table) {
  const rows = table.rows.map((r, i) => {
    const cells = r.map((c, ci) => `<td class="${ci > 0 ? "num" : ""}">${c}</td>`).join("");
    return `<tr class="${i === table.highlightRow ? "highlight" : ""}">${cells}</tr>`;
  }).join("");
  const headers = table.headers.map((h) => `<th>${h}</th>`).join("");
  return `<table class="data-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * Dibuja en el panel derecho el contenido de una sección y, si aplica,
 * enfoca la cámara y resalta el objeto 3D asociado.
 */
function selectContent(id, opts = {}) {
  const entry = contentData[id];
  if (!entry) return;
  activeId = id;
  setActiveNav(id);

  const root = document.getElementById("info-panel-content");
  root.innerHTML = "";

  const kicker = document.createElement("p");
  kicker.className = "panel-kicker";
  kicker.textContent = entry.kicker;
  root.appendChild(kicker);

  const title = document.createElement("h2");
  title.className = "panel-title";
  title.textContent = entry.title;
  root.appendChild(title);

  if (entry.tags) {
    const wrap = document.createElement("div");
    entry.tags.forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      wrap.appendChild(span);
    });
    root.appendChild(wrap);
  }

  const bodyWrap = document.createElement("div");
  bodyWrap.className = "panel-body";
  (entry.body || []).forEach((p) => {
    const el = document.createElement("p");
    el.innerHTML = p;
    bodyWrap.appendChild(el);
  });
  root.appendChild(bodyWrap);

  if (entry.callout) {
    const c = document.createElement("div");
    c.className = "callout";
    c.innerHTML = entry.callout;
    root.appendChild(c);
  }

  if (entry.list) {
    const ul = document.createElement("ul");
    ul.className = "list-plain";
    entry.list.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    root.appendChild(ul);
  }

  if (entry.table) {
    const label = document.createElement("p");
    label.className = "panel-section-label";
    label.textContent = "Datos";
    root.appendChild(label);
    const tableWrap = document.createElement("div");
    tableWrap.className = "table-scroll";
    tableWrap.innerHTML = buildTable(entry.table);
    root.appendChild(tableWrap);
  }

  if (entry.formulas) {
    const label = document.createElement("p");
    label.className = "panel-section-label";
    label.textContent = "Modelo matemático";
    root.appendChild(label);
    entry.formulas.forEach((f) => {
      const box = document.createElement("div");
      box.className = "formula-box";
      const mathEl = document.createElement("div");
      renderFormula(mathEl, f.latex);
      box.appendChild(mathEl);
      if (f.caption) {
        const cap = document.createElement("p");
        cap.className = "formula-caption";
        cap.textContent = f.caption;
        box.appendChild(cap);
      }
      root.appendChild(box);
    });
  }

  if (entry.chart) {
    const label = document.createElement("p");
    label.className = "panel-section-label";
    label.textContent = "Gráfica interactiva";
    root.appendChild(label);
    root.appendChild(buildChartBlock(entry.chart));
  }

  // En pantallas angostas o táctiles (el mismo criterio que activa los
  // cajones colapsables en CSS), abrir el panel automáticamente al
  // seleccionar algo, ya que ahí empieza oculto por defecto.
  if (window.matchMedia(MOBILE_LAYOUT_QUERY).matches) {
    openPanel();
  }

  // Si el elemento tiene un objeto 3D asociado, resaltarlo y enfocar cámara.
  if (entry.linkedObject && !opts.skipSceneSync) {
    highlightObjectById(entry.linkedObject);
    focusCameraOn(entry.linkedObject);
  } else if (!opts.skipSceneSync) {
    highlightObjectById(null);
  }
}

function renderFormula(el, latex) {
  try {
    window.katex.render(latex, el, { throwOnError: false, displayMode: true });
  } catch (e) {
    el.textContent = latex;
  }
}

/* =====================================================================
   4. MOTOR DE GRÁFICAS (Chart.js)
   Una sola función genérica sabe dibujar cualquiera de las cinco
   funciones del modelo a partir de su "clave" (AP, AV, h, P, I).
   ===================================================================== */

const FUNCTION_DEFS = {
  AP: { fn: (x) => 200 * x, domain: [0, 250], xLabel: "x (m)", yLabel: "AP(x) (m²)", name: "AP(x) = 200x" },
  AV: { fn: (x) => 50000 - 200 * x, domain: [0, 250], xLabel: "x (m)", yLabel: "AV(x) (m²)", name: "AV(x) = 50,000 − 200x" },
  h: { fn: (r) => 3000 / (Math.PI * r * r), domain: [2, 40], xLabel: "r (m)", yLabel: "h(r) (m)", name: "h(r) = 3,000 / (πr²)" },
  P: { fn: () => 1000, domain: [0, 250], xLabel: "x (m)", yLabel: "P(x) (m)", name: "P(x) = 1,000 m (constante)", yMin: 0, yMax: 1300 },
  I: { fn: (t) => -2000 * t * t + 10000 * t + 100000, domain: [0, 5], xLabel: "t (unidades de Q10)", yLabel: "I(t) (Q)", name: "I(t) = −2,000t² + 10,000t + 100,000" },
};

let chartInstances = []; // referencias activas, para destruirlas al cambiar de panel

/**
 * Crea el contenedor + <canvas> + gráfica Chart.js para una función dada,
 * con un control deslizante que el usuario puede arrastrar para mover el
 * punto resaltado a lo largo de la curva y leer su valor en vivo — así la
 * gráfica es realmente interactiva y no solo una imagen con tooltip.
 */
function buildChartBlock(cfg) {
  const def = FUNCTION_DEFS[cfg.key];
  const wrap = document.createElement("div");
  wrap.className = "chart-wrap";

  // El <canvas> necesita un contenedor con ALTURA PROPIA Y EXPLÍCITA.
  // Chart.js con maintainAspectRatio:false mide el tamaño de su padre
  // para dibujar — si el padre solo tiene "padding" (altura automática,
  // como .chart-wrap), no hay una altura real de la que partir y la
  // gráfica termina colapsada a 0px (invisible). Por eso el <canvas> va
  // dentro de un div dedicado con height fija en CSS (.chart-canvas-box).
  const canvasBox = document.createElement("div");
  canvasBox.className = "chart-canvas-box";
  const canvas = document.createElement("canvas");
  canvasBox.appendChild(canvas);
  wrap.appendChild(canvasBox);

  // --- Control deslizante: mueve el punto resaltado sobre la curva ---
  const [a, b] = def.domain;
  const sliderWrap = document.createElement("div");
  sliderWrap.className = "chart-slider-wrap";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "chart-slider";
  slider.min = String(a);
  slider.max = String(b);
  slider.step = String((b - a) / 300);
  const startX = cfg.highlightX != null ? cfg.highlightX : (a + b) / 2;
  slider.value = String(startX);
  const sliderLabel = document.createElement("label");
  sliderLabel.className = "chart-slider-label";
  sliderWrap.appendChild(sliderLabel);
  sliderWrap.appendChild(slider);
  wrap.appendChild(sliderWrap);

  const readout = document.createElement("div");
  readout.className = "chart-readout";
  readout.innerHTML = `<span>${def.name}</span><b></b>`;
  wrap.appendChild(readout);
  const readoutValue = readout.querySelector("b");

  const fmt = (n) => n.toLocaleString("es-GT", { maximumFractionDigits: 2 });
  function describe(x) {
    const y = def.fn(x);
    const xName = def.xLabel.split(" ")[0];
    const yName = def.yLabel.split(" ")[0];
    sliderLabel.textContent = `Mueve ${xName}:`;
    readoutValue.textContent = `${xName} = ${fmt(x)} → ${yName} = ${fmt(y)}`;
    return y;
  }
  describe(startX);

  // Muestreo de la función en su dominio (curva fija de fondo)
  const steps = 120;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    points.push({ x, y: def.fn(x) });
  }

  // El canvas debe existir en el DOM (con su tamaño final ya calculado
  // por CSS) antes de instanciar Chart.js. Un solo requestAnimationFrame
  // puede dispararse antes de que el navegador termine de aplicar el
  // layout; encadenar dos rAF garantiza que ya hubo un frame completo de
  // render de por medio.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (typeof Chart === "undefined") {
      // Chart.js no cargó (p. ej. sin conexión a internet: se sirve desde
      // un CDN externo). Lo mostramos explícitamente en vez de quedarnos
      // en silencio, para que quede claro que no es un problema del
      // control deslizante sino de la librería externa.
      const err = document.createElement("p");
      err.className = "chart-error";
      err.textContent = "No se pudo cargar la librería de gráficas (Chart.js). Revisa tu conexión a internet y recarga la página.";
      canvasBox.replaceWith(err);
      console.error("[simulador] Chart.js no está disponible en window.Chart");
      return;
    }

    let chart;
    try {
      chart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
          datasets: [
            {
              label: def.name,
              data: points,
              borderColor: "#1F5C4E",
              backgroundColor: "rgba(31, 92, 78, 0.08)",
              borderWidth: 2,
              pointRadius: 0,
              fill: true,
              tension: 0.15,
            },
            {
              label: "Punto seleccionado",
              data: [{ x: startX, y: def.fn(startX) }],
              borderColor: "#B9822E",
              backgroundColor: "#B9822E",
              pointRadius: 6,
              pointHoverRadius: 7,
              showLine: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 300 },
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#20241F",
              titleFont: { family: "IBM Plex Mono", size: 11 },
              bodyFont: { family: "IBM Plex Mono", size: 11 },
              callbacks: {
                title: (items) => `${def.xLabel.split(" ")[0]} = ${items[0].parsed.x.toFixed(2)}`,
                label: (item) => `${def.yLabel.split(" ")[0]} = ${item.parsed.y.toLocaleString("es-GT", { maximumFractionDigits: 2 })}`,
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              min: a,
              max: b,
              title: { display: true, text: def.xLabel, font: { family: "IBM Plex Sans", size: 11 }, color: "#565F55" },
              grid: { color: "#E9E5D8" },
              ticks: { color: "#8A9186", font: { size: 10 } },
            },
            y: {
              min: def.yMin,
              max: def.yMax,
              title: { display: true, text: def.yLabel, font: { family: "IBM Plex Sans", size: 11 }, color: "#565F55" },
              grid: { color: "#E9E5D8" },
              ticks: { color: "#8A9186", font: { size: 10 } },
            },
          },
          // Al hacer clic/tocar directamente sobre la curva, el punto
          // resaltado y el control deslizante saltan a ese valor de x.
          onClick: (evt) => {
            const xScale = chart.scales.x;
            const canvasRect = chart.canvas.getBoundingClientRect();
            const xPixel = evt.native
              ? evt.native.clientX - canvasRect.left
              : evt.x;
            let x = xScale.getValueForPixel(xPixel);
            x = Math.min(b, Math.max(a, x));
            slider.value = String(x);
            slider.dispatchEvent(new Event("input"));
          },
        },
      });
    } catch (e) {
      console.error("[simulador] Error creando la gráfica Chart.js:", e);
      const err = document.createElement("p");
      err.className = "chart-error";
      err.textContent = "Ocurrió un error al dibujar la gráfica. Revisa la consola del navegador (F12) para más detalles.";
      canvasBox.replaceWith(err);
      return;
    }

    chartInstances.push(chart);

    slider.addEventListener("input", () => {
      const x = parseFloat(slider.value);
      const y = describe(x);
      chart.data.datasets[1].data = [{ x, y }];
      chart.update("none");
    });

    // Aseguramos un primer redibujo con el tamaño real ya asentado,
    // por si el contenedor cambió de tamaño entre el primer y segundo rAF.
    chart.resize();
  }));

  return wrap;
}

function destroyCharts() {
  chartInstances.forEach((c) => c.destroy());
  chartInstances = [];
}

// Cada vez que se reconstruye el panel derecho hay que limpiar gráficas viejas.
const originalSelectContent = selectContent;
// (envolvemos la función para asegurar limpieza sin duplicar lógica arriba)
function selectContentWithCleanup(id, opts) {
  destroyCharts();
  originalSelectContent(id, opts);
}

/* =====================================================================
   5. MOTOR THREE.JS — ESCENA, TERRENO, RAYCASTING, RESALTADO
   ===================================================================== */

let scene, camera, renderer, controls, raycaster, pointer;
let hemiLight, sunLight;           // referencias para poder animar el clima
let rainPoints = null;             // sistema de partículas de lluvia (se crea una sola vez)
let currentWeather = "sunny";      // "sunny" | "rainy"
let currentLampLevel = 0;          // 0 = postes apagados, 1 = encendidos (se anima junto al clima)
let lampPosts = [];                // { bulb, halo, light } de cada poste, para prenderlos/apagarlos juntos
const pointerDownPos = new THREE.Vector2();
let selectableObjects = [];  // meshes/objetos que responden a clic
let animatedCreatures = [];  // figuras decorativas (personas, perro, cometa) con vida propia por cuadro
let selectionRegistry = {};  // id -> { object3D, meshes[] } para resaltar
let selectedId = null;
let highlightRing;

const cameraAnim = { active: false, t0: 0, duration: 900, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3() };

const DEFAULT_VIEW = {
  pos: new THREE.Vector3(210, 190, 300),
  target: new THREE.Vector3(0, 5, 150),
};

// Vistas de cámara asociadas a cada objeto seleccionable (posición + mira).
// Coordenadas alineadas con la nueva disposición: teatro y tanque a la
// izquierda (x ≈ −60), parqueo a la derecha (x ≈ 40), área verde al fondo.
const CAMERA_VIEWS = {
  ground_parqueo: { pos: new THREE.Vector3(150, 95, 15), target: new THREE.Vector3(40, 0, 62.5) },
  ground_verde: { pos: new THREE.Vector3(140, 140, 262), target: new THREE.Vector3(0, 0, 212.5) },
  tank_group: { pos: new THREE.Vector3(-165, 62, 105), target: new THREE.Vector3(-74, 24, 47) },
  perimeter_group: { pos: DEFAULT_VIEW.pos.clone(), target: DEFAULT_VIEW.target.clone() },
  entrance_group: { pos: new THREE.Vector3(45, 30, -10), target: new THREE.Vector3(0, 4, 8) },
  theatre_building: { pos: new THREE.Vector3(-165, 78, 150), target: new THREE.Vector3(-60, 14, 62.5) },
};

// =====================================================================
// CLIMA DINÁMICO
// Dos presets (soleado / lluvioso) que afectan luz solar, luz ambiente,
// color del cielo y densidad de la niebla. El cambio entre uno y otro
// se anima suavemente (ver weatherAnim + updateWeatherAnim), igual que
// la cámara se anima al seleccionar un objeto.
// =====================================================================
const WEATHER_PRESETS = {
  sunny: {
    sky: new THREE.Color(0xEFEDE4),
    fogColor: new THREE.Color(0xEFEDE4),
    fogNear: 420,
    fogFar: 900,
    sunColor: new THREE.Color(0xFFF6E3),
    sunIntensity: 1.15,
    hemiSky: new THREE.Color(0xF3F1E6),
    hemiGround: new THREE.Color(0x8B8D7E),
    hemiIntensity: 0.75,
    rainOpacity: 0,
    lamp: 0, // postes de luz apagados con sol
  },
  rainy: {
    sky: new THREE.Color(0xA9AFAF),
    fogColor: new THREE.Color(0xA9AFAF),
    fogNear: 130,
    fogFar: 460,
    sunColor: new THREE.Color(0xC7D0D2),
    sunIntensity: 0.32,
    hemiSky: new THREE.Color(0x9AA3A6),
    hemiGround: new THREE.Color(0x6B6F6D),
    hemiIntensity: 0.55,
    rainOpacity: 0.55,
    lamp: 1, // postes de luz encendidos: cualquier clima que no sea soleado
  },
};

const weatherAnim = { active: false, t0: 0, duration: 1400, from: null, to: null };

function initThree() {
  const holder = document.getElementById("canvas-holder");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xEFEDE4);
  scene.fog = new THREE.Fog(0xEFEDE4, 420, 900);

  camera = new THREE.PerspectiveCamera(42, holder.clientWidth / holder.clientHeight, 0.1, 2000);
  camera.position.copy(DEFAULT_VIEW.pos);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(holder.clientWidth, holder.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  holder.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "none"; // gestos táctiles controlan la cámara, no la página

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(DEFAULT_VIEW.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 40;
  controls.maxDistance = 520;
  controls.update();

  // --- Luces: ambiente suave + sol direccional con sombra ---
  hemiLight = new THREE.HemisphereLight(0xF3F1E6, 0x8B8D7E, 0.75);
  scene.add(hemiLight);
  sunLight = new THREE.DirectionalLight(0xFFF6E3, 1.15);
  sunLight.position.set(180, 260, 120);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -220;
  sunLight.shadow.camera.right = 220;
  sunLight.shadow.camera.top = 220;
  sunLight.shadow.camera.bottom = -220;
  sunLight.shadow.camera.far = 700;
  sunLight.shadow.bias = -0.0006;
  scene.add(sunLight);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  buildTerrain();
  buildHighlightRing();
  buildRain();
  wireWeatherUI();

  // Distinguimos un "clic" real de un arrastre de OrbitControls: solo se
  // interpreta como selección si el puntero se movió muy poco entre
  // pointerdown y pointerup.
  renderer.domElement.addEventListener("pointerdown", (e) => {
    pointerDownPos.set(e.clientX, e.clientY);
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    if (Math.hypot(dx, dy) < 6) onPointerUp(e);
  });
  window.addEventListener("resize", onResize);

  // El evento "resize" de window no siempre se dispara cuando el tamaño
  // de #canvas-holder cambia por otras causas: un breakpoint de CSS que
  // entra en juego, DevTools cambiando de preset de dispositivo, o los
  // cajones de navegación abriéndose/cerrándose (que no cambian el ancho
  // de la ventana, solo el del contenedor). ResizeObserver cubre todos
  // esos casos observando el propio contenedor directamente.
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => onResize());
    ro.observe(holder);
  }

  animate();
}

/** Textura procedural sencilla de asfalto con líneas de parqueo. */
function makeParkingTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#8B8D86";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 4;
  for (let x = 16; x < 256; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, 236);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Altura del relieve suave del área verde en el punto (x, z) del mundo.
 * Combina unas pocas ondas seno/coseno con una caída radial (falloff)
 * hacia los bordes de la franja, así que el relieve es 0 fuera del área
 * verde y crece suavemente hacia el centro — nunca hay un "escalón"
 * brusco contra el parqueo, el teatro o el perímetro.
 * Se reutiliza para: la malla de relieve, la fuente, las flores y los
 * árboles nuevos, para que todos se asienten sobre el mismo terreno.
 */
function terrainHeightAt(x, z) {
  const zStart = MODEL.terrenoLargo - MODEL.verdeArea / MODEL.terrenoAncho; // 125
  const zEnd = MODEL.terrenoLargo;                                          // 300
  const cz = (zStart + zEnd) / 2;
  const halfW = MODEL.terrenoAncho / 2;
  const rx = halfW - 14;
  const rz = (zEnd - zStart) / 2 - 14;
  const nx = x / rx;
  const nz = (z - cz) / rz;
  const d = Math.sqrt(nx * nx + nz * nz);
  if (d >= 1) return 0;
  const falloff = (1 - d * d) * (1 - d * d); // suave, sin bordes duros
  // Dos ondas remapeadas a [0,1] antes de combinarlas: así el relieve
  // son siempre montículos hacia arriba, nunca hondonadas por debajo
  // de la franja plana original (evita que la malla quede "enterrada").
  const waveA = (Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.05) + 1) / 2;
  const waveB = (Math.sin(x * 0.11 - z * 0.08 + 2.1) + 1) / 2;
  const mound = waveA * 0.65 + waveB * 0.35;
  return mound * falloff * 0.62; // amplitud máxima ≈ 0.6 m — "leve" a propósito
}

/** Construye el terreno completo: franjas, edificio, tanque, entrada y perímetro. */
function buildTerrain() {
  const W = MODEL.terrenoAncho;   // 200 — eje x
  const L = MODEL.terrenoLargo;   // 300 — eje z
  const halfW = W / 2;

  // Disposición según la Figura 1 del informe: el área verde ocupa la
  // franja superior de ancho completo; el teatro y el parqueo comparten,
  // lado a lado, la franja inferior cercana a la entrada principal.
  const bandDepth = L - MODEL.verdeArea / W;              // 300 − 175 = 125 m
  const zVerdeStart = bandDepth, zVerdeEnd = L;            // 125–300
  const zBandCenter = bandDepth / 2;

  const teatroWidth = MODEL.teatroArea / bandDepth;        // 10,000 / 125 = 80 m
  const parqueoWidth = MODEL.parqueoArea / bandDepth;       // 15,000 / 125 = 120 m
  const xTeatro = -halfW + teatroWidth / 2;                 // −60 (izquierda)
  const xParqueo = -halfW + teatroWidth + parqueoWidth / 2; // 40 (derecha)

  // --- Base del terreno ---
  const baseGeo = new THREE.PlaneGeometry(W + 10, L + 10);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xEDE9DB, roughness: 1 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, -0.05, L / 2);
  base.receiveShadow = true;
  scene.add(base);

  // --- Zona: Parqueo (derecha de la franja inferior) ---
  const parkTex = makeParkingTexture();
  addZone("ground_parqueo", 0x8B8D86, parqueoWidth, bandDepth, 0, zBandCenter, parkTex, true, xParqueo);

  // --- Zona: Área verde (franja superior, ancho completo) ---
  addZone("ground_verde", 0x7C9473, W, zVerdeEnd - zVerdeStart, 0, (zVerdeStart + zVerdeEnd) / 2, null);
  scatterTrees(zVerdeStart, zVerdeEnd, halfW);

  // --- Franja base del teatro (izquierda de la franja inferior) ---
  addZone(null, 0xCFC7AE, teatroWidth, bandDepth, -0.01, zBandCenter, null, false, xTeatro);

  // --- Edificio del teatro ---
  buildTheatreBuilding(xTeatro, zBandCenter, teatroWidth, bandDepth);

  // --- Tanque cilíndrico (sobre el techo del teatro) ---
  buildTank(xTeatro, zBandCenter, teatroWidth, bandDepth);

  // --- Entrada principal (centrada, sobre el borde frontal) ---
  buildEntrance();

  // --- Perímetro (marco del TERRENO COMPLETO — "el parque" del informe) ---
  buildPerimeter(W, L);

  // --- Vida en la escena: personas, familia, perro, cometa y autos ---
  // Puramente decorativo: no son seleccionables ni afectan el raycasting,
  // igual que los árboles del área verde.
  buildLife({ xTeatro, xParqueo, teatroWidth, parqueoWidth, bandDepth, zVerdeStart, zVerdeEnd, halfW });

  // --- Mejoras del jardín: relieve suave, fuente, flores y árboles
  //     ornamentales. Se AGREGAN sobre lo anterior, sin quitar nada. ---
  buildGardenEnhancements({ zVerdeStart, zVerdeEnd, halfW });

  // --- Postes de luz: siempre visibles, su farol solo se enciende
  //     cuando el clima no es soleado (ver WEATHER_PRESETS / applyLampLevel). ---
  buildLampPosts({ xParqueo, parqueoWidth });
}

/** Crea una franja rectangular del terreno; si id no es null, es seleccionable. */
function addZone(id, color, width, depth, y, zCenter, texture, selectable = true, xCenter = 0) {
  const mat = new THREE.MeshStandardMaterial({
    color: texture ? 0xffffff : color,
    map: texture || null,
    roughness: 0.95,
  });
  if (texture) {
    texture.repeat.set(width / 20, depth / 20);
  }
  const geo = new THREE.BoxGeometry(width, 0.5, depth);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(xCenter, y, zCenter);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  scene.add(mesh);

  if (id) {
    mesh.userData.selectId = id;
    registerSelectable(id, [mesh], mesh);
  }
  return mesh;
}

function scatterTrees(zStart, zEnd, halfW) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B5A3E, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x5C7A54, roughness: 0.9 });
  const rand = mulberry32(7); // semilla fija: el bosque siempre se ve igual
  for (let i = 0; i < 26; i++) {
    const x = (rand() * 2 - 1) * (halfW - 12);
    const z = zStart + 12 + rand() * (zEnd - zStart - 24);
    const s = 0.7 + rand() * 0.6;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.45 * s, 2.2 * s, 6), trunkMat);
    trunk.position.set(x, 1.1 * s, z);
    trunk.castShadow = true;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(2.1 * s, 4.2 * s, 7), leafMat);
    leaf.position.set(x, 3.6 * s, z);
    leaf.castShadow = true;
    scene.add(trunk, leaf);
  }
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTheatreBuilding(xCenter, zCenter, footprintWidth, footprintDepth) {
  const group = new THREE.Group();
  const width = footprintWidth * 0.8;   // retiro visual respecto al lote asignado
  const depth = footprintDepth * 0.55;
  const height = 16;

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xC9BFA0, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xB2A57F, roughness: 0.7 });

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  main.position.set(xCenter, height / 2, zCenter);
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  // Torre escénica (fly tower): volumen más alto característico de teatros
  const towerH = 9;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(width * 0.42, towerH, depth * 0.5), roofMat);
  tower.position.set(xCenter, height + towerH / 2, zCenter + depth * 0.15);
  tower.castShadow = true;
  group.add(tower);

  // Marquesina/entrada sobre la cara frontal (hacia la entrada, z pequeño)
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, 1.1, 8), roofMat);
  canopy.position.set(xCenter, height * 0.42, zCenter - depth / 2 - 3.5);
  canopy.castShadow = true;
  group.add(canopy);

  scene.add(group);
  group.userData.selectId = "theatre_building";
  registerSelectable("theatre_building", [main, tower, canopy], group);

  return group;
}

function buildTank(xCenter, zCenter, footprintWidth, footprintDepth) {
  const group = new THREE.Group();
  const roofY = 16; // debe coincidir con la altura del edificio
  const legH = 4.2;
  const buildingWidth = footprintWidth * 0.8;
  const buildingDepth = footprintDepth * 0.55;
  const tankX = xCenter - buildingWidth * 0.24;   // cerca de una esquina del techo
  const tankZ = zCenter - buildingDepth * 0.22;

  const legMat = new THREE.MeshStandardMaterial({ color: 0x6E6A5C, roughness: 0.6, metalness: 0.2 });
  const tankMat = new THREE.MeshStandardMaterial({ color: 0xAEB4B8, roughness: 0.35, metalness: 0.55 });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x1F5C4E, roughness: 0.5, metalness: 0.2 });

  const legGeo = new THREE.CylinderGeometry(0.45, 0.45, legH, 10);
  const legOffsets = [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]];
  legOffsets.forEach(([dx, dz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(tankX + dx, roofY + legH / 2, tankZ + dz);
    leg.castShadow = true;
    group.add(leg);
  });

  // Radio y altura reales del modelo, escalados suavemente para lectura visual
  // (el informe indica explícitamente que el tanque se representa "sin escala").
  const rVis = MODEL.tanqueRadio * 0.62;
  const hVis = MODEL.tanqueAltura * 0.62;

  const tank = new THREE.Mesh(new THREE.CylinderGeometry(rVis, rVis, hVis, 28), tankMat);
  tank.position.set(tankX, roofY + legH + hVis / 2, tankZ);
  tank.castShadow = true;
  group.add(tank);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(rVis + 0.05, rVis + 0.05, hVis * 0.14, 28), bandMat);
  band.position.set(tankX, roofY + legH + hVis / 2, tankZ);
  group.add(band);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(rVis * 1.02, hVis * 0.22, 28), tankMat);
  cap.position.set(tankX, roofY + legH + hVis + (hVis * 0.22) / 2, tankZ);
  cap.castShadow = true;
  group.add(cap);

  scene.add(group);
  group.userData.selectId = "tank_group";
  registerSelectable("tank_group", group.children.slice(), group);
}

function buildEntrance() {
  const group = new THREE.Group();
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xDCD6C6, roughness: 0.8 });
  const lintelMat = new THREE.MeshStandardMaterial({ color: 0x1F5C4E, roughness: 0.5 });
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0xD8CFB4, roughness: 0.95 });

  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 0.4, 32), plazaMat);
  plaza.position.set(0, 0.22, 4);
  plaza.receiveShadow = true;
  group.add(plaza);

  [-9, 9].forEach((dx) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.5, 1.6), pillarMat);
    pillar.position.set(dx, 3.75, -1);
    pillar.castShadow = true;
    group.add(pillar);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(20.5, 1.1, 1.8), lintelMat);
  lintel.position.set(0, 7.6, -1);
  lintel.castShadow = true;
  group.add(lintel);

  scene.add(group);
  group.userData.selectId = "entrance_group";
  registerSelectable("entrance_group", group.children, group);
}

/** Marco que traza el contorno del TERRENO COMPLETO (200 × 300) — es lo que
 * el informe llama "el parque": P(x) = 2(200+300) = 1,000 m, constante,
 * sin relación con la distribución interna de teatro/parqueo/área verde. */
function buildPerimeter(W, L) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x9AA38F, roughness: 0.6 });
  const h = 0.9, th = 0.9;
  // Cuatro tramos: frente, fondo, izquierda, derecha — todo el perímetro del lote
  const front = new THREE.Mesh(new THREE.BoxGeometry(W + th, h, th), mat);
  front.position.set(0, h / 2, 0);
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + th, h, th), mat);
  back.position.set(0, h / 2, L);
  const left = new THREE.Mesh(new THREE.BoxGeometry(th, h, L + th), mat);
  left.position.set(-W / 2, h / 2, L / 2);
  const right = new THREE.Mesh(new THREE.BoxGeometry(th, h, L + th), mat);
  right.position.set(W / 2, h / 2, L / 2);
  [front, back, left, right].forEach((m) => { m.castShadow = true; group.add(m); });

  scene.add(group);
  group.userData.selectId = "perimeter_group";
  registerSelectable("perimeter_group", [front, back, left, right], group);
}

/* =====================================================================
   VIDA EN LA ESCENA — personas, familia, perro y cometa en el área
   verde; autos estacionados en el parqueo. Todo esto es puramente
   decorativo: nunca se agrega a `selectableObjects`, así que no
   interfiere con el raycasting ni con el resto de la lógica de la app.
   ===================================================================== */

/**
 * Crea una figura humana muy simplificada (estilo "muñeco de escala" de
 * una maqueta de arquitectura): esfera para la cabeza, cilindro para el
 * torso, y cuatro extremidades articuladas por un pivote en su base, de
 * modo que rotarlas basta para simular el vaivén de caminar.
 */
function createFigure({ shirtColor = 0x3C5A52, pantsColor = 0x3A3F3A, skinColor = 0xC9A57B, scale = 1 } = {}) {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.9 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85 });

  const hipY = 0.95 * scale;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24 * scale, 12, 10), skinMat);
  head.position.set(0, hipY + 0.82 * scale, 0);
  head.castShadow = true;
  group.add(head);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21 * scale, 0.25 * scale, 0.72 * scale, 8), shirtMat);
  torso.position.set(0, hipY + 0.36 * scale, 0);
  torso.castShadow = true;
  group.add(torso);

  // Una "extremidad" es un pivote (para rotar) que contiene el cilindro
  // desplazado hacia abajo, de modo que el pivote actúa como articulación.
  function limb(mat, len, radius, x, y) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.82, len, 6), mat);
    mesh.position.set(0, -len / 2, 0);
    mesh.castShadow = true;
    pivot.add(mesh);
    group.add(pivot);
    return pivot;
  }

  const legL = limb(pantsMat, 0.92 * scale, 0.085 * scale, -0.11 * scale, hipY);
  const legR = limb(pantsMat, 0.92 * scale, 0.085 * scale, 0.11 * scale, hipY);
  const armL = limb(shirtMat, 0.66 * scale, 0.065 * scale, -0.3 * scale, hipY + 0.68 * scale);
  const armR = limb(shirtMat, 0.66 * scale, 0.065 * scale, 0.3 * scale, hipY + 0.68 * scale);

  return { group, legL, legR, armL, armR };
}

/**
 * Hace que una figura camine en un círculo alrededor de `center`, con
 * radio, velocidad angular y fase propios. El ciclo de piernas/brazos se
 * deriva del ángulo recorrido, así que el paso siempre se ve natural sin
 * importar la velocidad.
 */
function addLoopWalker({ center, radius, speed, phase = 0, shirtColor, pantsColor, scale = 1 }) {
  const fig = createFigure({ shirtColor, pantsColor, scale });
  scene.add(fig.group);
  const state = { angle: phase };
  return {
    update(delta) {
      state.angle += delta * speed;
      const x = center.x + Math.cos(state.angle) * radius;
      const z = center.z + Math.sin(state.angle) * radius;
      const dx = -Math.sin(state.angle), dz = Math.cos(state.angle); // tangente = dirección de avance
      const strideRate = 6.2 / scale;
      const bob = Math.abs(Math.sin(state.angle * strideRate)) * 0.05 * scale;
      fig.group.position.set(x, bob + terrainHeightAt(x, z), z);
      fig.group.rotation.y = Math.atan2(dx, dz);
      const swing = Math.sin(state.angle * strideRate) * 0.5;
      fig.legL.rotation.x = swing;
      fig.legR.rotation.x = -swing;
      fig.armL.rotation.x = -swing * 0.7;
      fig.armR.rotation.x = swing * 0.7;
    },
  };
}

/** Figura de pie con un ligero balanceo, para las escenas donde alguien
 * simplemente está parado (ej. junto a la entrada) en vez de caminar. */
function addIdleFigure({ position, rotationY = 0, shirtColor, pantsColor, scale = 1, phase = 0 }) {
  const fig = createFigure({ shirtColor, pantsColor, scale });
  fig.group.position.copy(position);
  fig.group.rotation.y = rotationY;
  scene.add(fig.group);
  return {
    update(delta, elapsed) {
      const sway = Math.sin(elapsed * 1.1 + phase) * 0.03;
      fig.group.rotation.z = sway;
      fig.armL.rotation.x = Math.sin(elapsed * 0.9 + phase) * 0.06;
      fig.armR.rotation.x = -Math.sin(elapsed * 0.9 + phase) * 0.06;
    },
  };
}

/** Perro muy simplificado: cuerpo tipo cápsula, cabeza, cola y cuatro
 * patas que alternan en pares diagonales al trotar. */
function createDog(scale = 1) {
  const group = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0x8A6A45, roughness: 0.92 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17 * scale, 0.46 * scale, 4, 8), furMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0.27 * scale, 0);
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 10, 8), furMat);
  head.position.set(0.4 * scale, 0.33 * scale, 0);
  head.castShadow = true;
  group.add(head);

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * scale, 0.05 * scale, 0.3 * scale, 6), furMat);
  tail.position.set(-0.4 * scale, 0.4 * scale, 0);
  tail.rotation.z = Math.PI * 0.65;
  tail.castShadow = true;
  group.add(tail);

  const legs = [];
  [[-0.15, 0.13], [-0.15, -0.13], [0.15, 0.13], [0.15, -0.13]].forEach(([lx, lz]) => {
    const pivot = new THREE.Group();
    pivot.position.set(lx * scale, 0.25 * scale, lz * scale);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.032 * scale, 0.032 * scale, 0.25 * scale, 6), furMat);
    leg.position.set(0, -0.125 * scale, 0);
    leg.castShadow = true;
    pivot.add(leg);
    group.add(pivot);
    legs.push(pivot);
  });

  return { group, tail, legs };
}

/** Igual que addLoopWalker, pero para el perro: trote más rápido y patas
 * en pares diagonales (delantera-izq + trasera-der, y viceversa). */
function addDogWalker({ center, radius, speed, phase = 0, scale = 0.85 }) {
  const dog = createDog(scale);
  scene.add(dog.group);
  const state = { angle: phase };
  return {
    update(delta) {
      state.angle += delta * speed;
      const x = center.x + Math.cos(state.angle) * radius;
      const z = center.z + Math.sin(state.angle) * radius;
      const dx = -Math.sin(state.angle), dz = Math.cos(state.angle);
      const trot = state.angle * 9;
      dog.group.position.set(x, Math.abs(Math.sin(trot)) * 0.045 * scale + terrainHeightAt(x, z), z);
      dog.group.rotation.y = Math.atan2(dx, dz);
      const swing = Math.sin(trot) * 0.6;
      dog.legs[0].rotation.x = swing;   // delantera izquierda
      dog.legs[3].rotation.x = swing;   // trasera derecha (par diagonal)
      dog.legs[1].rotation.x = -swing;  // delantera derecha
      dog.legs[2].rotation.x = -swing;  // trasera izquierda
      dog.tail.rotation.y = Math.sin(trot * 1.4) * 0.5;
    },
  };
}

/** Persona de pie sosteniendo el hilo de una cometa que flota y se
 * balancea en lo alto. El hilo es una línea cuyos dos extremos se
 * recalculan cada cuadro: la mano de la figura y la cometa. */
function buildKiteFlyer(position) {
  const fig = createFigure({ shirtColor: 0xB9822E, pantsColor: 0x3A3F3A, scale: 1 });
  fig.group.position.copy(position);
  fig.armL.rotation.x = -1.15; // brazo en alto, sosteniendo el hilo
  scene.add(fig.group);

  const kiteGroup = new THREE.Group();
  const kiteMat = new THREE.MeshStandardMaterial({ color: 0xC9573F, roughness: 0.55, side: THREE.DoubleSide });
  const kiteShape = new THREE.Shape();
  kiteShape.moveTo(0, 0.55);
  kiteShape.lineTo(0.42, 0);
  kiteShape.lineTo(0, -0.55);
  kiteShape.lineTo(-0.42, 0);
  kiteShape.closePath();
  const kite = new THREE.Mesh(new THREE.ShapeGeometry(kiteShape), kiteMat);
  kiteGroup.add(kite);

  const bowMat = new THREE.MeshBasicMaterial({ color: 0xF6EBD8 });
  for (let i = 0; i < 4; i++) {
    const bow = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), bowMat);
    bow.position.set(0, -0.62 - i * 0.2, 0);
    kiteGroup.add(bow);
  }

  const kiteBaseY = 22;
  const kiteBaseX = position.x + 4;
  const kiteBaseZ = position.z + 3;
  kiteGroup.position.set(kiteBaseX, kiteBaseY, kiteBaseZ);
  scene.add(kiteGroup);

  const handAnchor = new THREE.Vector3(position.x - 0.3, position.y + 1.55, position.z);
  const stringGeo = new THREE.BufferGeometry().setFromPoints([handAnchor, kiteGroup.position]);
  const stringMat = new THREE.LineBasicMaterial({ color: 0x8A9186 });
  const string = new THREE.Line(stringGeo, stringMat);
  scene.add(string);

  return {
    update(delta, elapsed) {
      kiteGroup.position.y = kiteBaseY + Math.sin(elapsed * 0.6) * 1.4;
      kiteGroup.position.x = kiteBaseX + Math.sin(elapsed * 0.35) * 1.1;
      kiteGroup.rotation.z = Math.sin(elapsed * 0.6) * 0.16;
      kiteGroup.rotation.x = Math.PI * 0.07;
      const posAttr = string.geometry.attributes.position;
      posAttr.setXYZ(0, handAnchor.x, handAnchor.y, handAnchor.z);
      posAttr.setXYZ(1, kiteGroup.position.x, kiteGroup.position.y, kiteGroup.position.z);
      posAttr.needsUpdate = true;
    },
  };
}

/** Auto estacionado, muy simplificado: caja para la carrocería, caja más
 * pequeña y oscura para la cabina/vidrios, y cuatro ruedas cilíndricas. */
function buildCar(x, z, color, rotationY) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x2A3A3A, roughness: 0.2, metalness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1C1C1C, roughness: 0.85 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 1.9), bodyMat);
  body.position.set(0, 0.75, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.72, 1.68), glassMat);
  cabin.position.set(-0.15, 1.48, 0);
  cabin.castShadow = true;
  group.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 12);
  [[-1.4, -1.0], [-1.4, 1.0], [1.4, -1.0], [1.4, 1.0]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.38, wz);
    group.add(wheel);
  });

  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  scene.add(group);
}

/** Coloca varios autos dentro del lote de parqueo, en dos filas que
 * siguen las líneas pintadas de la textura de asfalto, dejando un
 * margen amplio para no invadir la plaza de la entrada principal. */
function buildParkedCars(xParqueo, parqueoWidth, bandDepth) {
  const bodyColors = [0x2F4A45, 0x8A2F2F, 0x555A63, 0xB9822E, 0x37423A, 0x6E6A5C, 0x3D5A73];
  const left = xParqueo - parqueoWidth / 2 + 16;
  const right = xParqueo + parqueoWidth / 2 - 16;
  const cols = [left, left + (right - left) * 0.33, left + (right - left) * 0.66, right];
  const rows = [bandDepth * 0.34, bandDepth * 0.66, bandDepth * 0.92];

  let i = 0;
  rows.forEach((z, rowIdx) => {
    cols.forEach((x, colIdx) => {
      // Se dejan un par de espacios vacíos para que no se vea "empacado".
      if (rowIdx === 1 && colIdx === 2) return;
      if (rowIdx === 2 && colIdx === 0) return;
      buildCar(x, z, bodyColors[i % bodyColors.length], colIdx % 2 === 0 ? 0 : Math.PI);
      i++;
    });
  });
}

/**
 * Ensambla toda la "vida" decorativa de la escena y devuelve el arreglo
 * de criaturas animadas para que animate() las actualice cada cuadro.
 */
function buildLife({ xTeatro, xParqueo, teatroWidth, parqueoWidth, bandDepth, zVerdeStart, zVerdeEnd, halfW }) {
  const creatures = [];

  // --- Autos estacionados en el parqueo (estáticos, sin costo por cuadro) ---
  buildParkedCars(xParqueo, parqueoWidth, bandDepth);

  // --- Familia paseando en el área verde: dos adultos y un niño, en
  //     órbitas concéntricas con radios y fases ligeramente distintos
  //     para que no caminen "en fila india" perfecta. ---
  const verdeCenter = new THREE.Vector3(-10, 0, zVerdeStart + (zVerdeEnd - zVerdeStart) * 0.55);
  creatures.push(addLoopWalker({ center: verdeCenter, radius: 46, speed: 0.075, phase: 0, shirtColor: 0x2F4A45, pantsColor: 0x35322C, scale: 1 }));
  creatures.push(addLoopWalker({ center: verdeCenter, radius: 46, speed: 0.075, phase: 0.28, shirtColor: 0x8A5A63, pantsColor: 0x3A3F3A, scale: 0.95 }));
  creatures.push(addLoopWalker({ center: verdeCenter, radius: 40, speed: 0.11, phase: 0.6, shirtColor: 0xB9822E, pantsColor: 0x2F4A45, scale: 0.62 })); // niño

  // --- El perro de la familia, trotando en una órbita más cerrada ---
  creatures.push(addDogWalker({ center: verdeCenter, radius: 34, speed: 0.19, phase: 1.4, scale: 0.8 }));

  // --- Otra persona caminando sola, al otro extremo del área verde ---
  const soloCenter = new THREE.Vector3(55, 0, zVerdeStart + (zVerdeEnd - zVerdeStart) * 0.3);
  creatures.push(addLoopWalker({ center: soloCenter, radius: 22, speed: -0.09, phase: 2.1, shirtColor: 0x3D5A73, pantsColor: 0x2E2B26, scale: 1.02 }));

  // --- Alguien volando una cometa, cerca del fondo del área verde ---
  const kitePos = new THREE.Vector3(60, 0, zVerdeEnd - 28);
  creatures.push(buildKiteFlyer(kitePos));

  // --- Un par de personas de pie cerca de la entrada / taquilla ---
  creatures.push(addIdleFigure({ position: new THREE.Vector3(-7, 0, 11), rotationY: 0.5, shirtColor: 0x6E4C17, pantsColor: 0x3A3F3A, scale: 1, phase: 0 }));
  creatures.push(addIdleFigure({ position: new THREE.Vector3(6.5, 0, 9.5), rotationY: -0.4, shirtColor: 0x1F5C4E, pantsColor: 0x35322C, scale: 0.97, phase: 1.8 }));

  animatedCreatures = animatedCreatures.concat(creatures);
}

/* =====================================================================
   MEJORAS DEL JARDÍN — relieve de terreno, fuente, flores y árboles
   ornamentales. Todo esto se AGREGA sobre el área verde existente: no
   modifica la zona seleccionable (`ground_verde`), los árboles originales
   de scatterTrees(), ni a las personas/perro/cometa de buildLife(). Solo
   ajusta su altura (terrainHeightAt) para que "se paren" bien sobre el
   nuevo relieve.
   ===================================================================== */

/** Malla decorativa de relieve: un plano subdividido, desplazado en Y con
 * terrainHeightAt(), apoyado justo encima de la franja plana y
 * seleccionable del área verde (que sigue existiendo, intacta, debajo). */
function buildGreenRelief() {
  const zStart = MODEL.terrenoLargo - MODEL.verdeArea / MODEL.terrenoAncho; // 125
  const zEnd = MODEL.terrenoLargo;                                          // 300
  const zCenter = (zStart + zEnd) / 2;
  const width = MODEL.terrenoAncho - 4;
  const depth = (zEnd - zStart) - 4;

  const geo = new THREE.PlaneGeometry(width, depth, 48, 40);
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const localX = posAttr.getX(i);
    const localY = posAttr.getY(i);
    const worldX = localX;
    const worldZ = zCenter - localY; // ver nota de rotación más abajo
    posAttr.setZ(i, terrainHeightAt(worldX, worldZ));
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ color: 0x7FA079, roughness: 0.92 });
  const relief = new THREE.Mesh(geo, mat);
  // rotation.x = -90° hace que el eje local Z (donde desplazamos la
  // altura) pase a ser el eje mundial Y (arriba), y el local Y pase a
  // ser −Z mundial — por eso worldZ = zCenter − localY arriba.
  relief.rotation.x = -Math.PI / 2;
  relief.position.set(0, 0.27, zCenter);
  relief.receiveShadow = true;
  scene.add(relief);
}

/** Fuente circular con agua animada (pulso suave del chorro central). */
function buildFountain(x, z) {
  const baseY = 0.27 + terrainHeightAt(x, z);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xD8D2C2, roughness: 0.85 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x3D6E7A, roughness: 0.15, metalness: 0.35 });
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xCDEFF2, roughness: 0.1, transparent: true, opacity: 0.75 });

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.9, 0.6, 32), stoneMat);
  rim.position.set(x, baseY + 0.3, z);
  rim.castShadow = true;
  rim.receiveShadow = true;
  scene.add(rim);

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.15, 4.15, 0.42, 32), waterMat);
  basin.position.set(x, baseY + 0.44, z);
  scene.add(basin);

  const tier = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 1.1, 20), stoneMat);
  tier.position.set(x, baseY + 0.95, z);
  tier.castShadow = true;
  scene.add(tier);

  const jetBaseY = baseY + 2.2;
  const jet = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.7, 12), jetMat);
  jet.position.set(x, jetBaseY, z);
  scene.add(jet);

  return {
    update(delta, elapsed) {
      const pulse = 1 + Math.sin(elapsed * 2.4) * 0.14;
      jet.scale.set(1, pulse, 1);
      jet.position.y = jetBaseY + Math.sin(elapsed * 2.4) * 0.15;
    },
  };
}

/**
 * Macizo (patch) de flores: pequeños icosaedros de colores distribuidos
 * al azar (con semilla fija, para que sea reproducible) dentro de un
 * anillo entre innerRadius y radius alrededor de `center`. Usa un
 * InstancedMesh por color, así que aunque haya muchas flores, cada color
 * se dibuja en una sola llamada — muy liviano.
 */
function buildFlowerPatch(center, radius, count, colorPalette, seed, innerRadius = 0) {
  const rand = mulberry32(seed);
  const geo = new THREE.IcosahedronGeometry(0.16, 0);
  const dummy = new THREE.Object3D();
  const perColor = Math.ceil(count / colorPalette.length);

  colorPalette.forEach((color) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const inst = new THREE.InstancedMesh(geo, mat, perColor);
    for (let i = 0; i < perColor; i++) {
      const a = rand() * Math.PI * 2;
      const r = innerRadius + Math.sqrt(rand()) * (radius - innerRadius);
      const x = center.x + Math.cos(a) * r;
      const z = center.z + Math.sin(a) * r;
      const y = 0.32 + terrainHeightAt(x, z) + rand() * 0.04;
      dummy.position.set(x, y, z);
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      const s = 0.7 + rand() * 0.6;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.castShadow = true;
    inst.receiveShadow = true;
    scene.add(inst);
  });
}

/** Árboles ornamentales de copa redonda (caducifolios), en una paleta
 * verde/dorada/rojiza — especies DISTINTAS a las coníferas ya sembradas
 * por scatterTrees(). Se agregan aparte, con su propia semilla, así que
 * los árboles originales no se tocan ni se reposicionan. */
function scatterOrnamentalTrees(zStart, zEnd, halfW) {
  const rand = mulberry32(19); // semilla distinta a la de scatterTrees (7)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B5A3E, roughness: 1 });
  const canopyPalette = [0x8AA662, 0xC9A227, 0xA1462F]; // verde, dorado, rojizo — como en la referencia
  for (let i = 0; i < 16; i++) {
    const x = (rand() * 2 - 1) * (halfW - 12);
    const z = zStart + 12 + rand() * (zEnd - zStart - 24);
    const s = 0.8 + rand() * 0.7;
    const y0 = 0.27 + terrainHeightAt(x, z);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: canopyPalette[Math.floor(rand() * canopyPalette.length)],
      roughness: 0.9,
    });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.4 * s, 2.0 * s, 6), trunkMat);
    trunk.position.set(x, y0 + 1.0 * s, z);
    trunk.castShadow = true;
    scene.add(trunk);

    // Copa redondeada (caducifolio), a diferencia del cono de las coníferas.
    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 1), canopyMat);
    canopy.position.set(x, y0 + 2.9 * s, z);
    canopy.castShadow = true;
    scene.add(canopy);
  }
}

/** Ensambla todas las mejoras del jardín. La fuente se agrega a
 * `animatedCreatures` para que su chorro de agua se anime cada cuadro,
 * igual que la gente y el perro. */
function buildGardenEnhancements({ zVerdeStart, zVerdeEnd, halfW }) {
  buildGreenRelief();
  scatterOrnamentalTrees(zVerdeStart, zVerdeEnd, halfW);

  // Fuente central, lejos de las rutas de paseo de la familia y del
  // caminante solitario (ver comentario de posiciones en buildLife).
  const fountainCenter = new THREE.Vector3(-70, 0, 235);
  const fountain = buildFountain(fountainCenter.x, fountainCenter.z);
  animatedCreatures.push(fountain);

  // Anillo de flores alrededor de la fuente (fuera de su borde de piedra)
  // y dos macizos adicionales en esquinas tranquilas del área verde.
  buildFlowerPatch(fountainCenter, 9.5, 90, [0xC9577A, 0x8A5FA8, 0xE0B23A, 0xF4F1E6], 21, 5.5);
  buildFlowerPatch(new THREE.Vector3(-82, 0, 288), 6, 46, [0xC9577A, 0xE0B23A], 34);
  buildFlowerPatch(new THREE.Vector3(80, 0, 140), 6, 46, [0x8A5FA8, 0xF4F1E6], 47);
}

/* =====================================================================
   POSTES DE LUZ
   El poste (base, tubo, farol) SIEMPRE es visible, de día o de noche —
   es mobiliario urbano, no debería desaparecer. Lo único que se anima
   es el encendido: intensidad de la luz puntual, brillo del foco y
   halo cálido alrededor, todo atado a `currentLampLevel` (0 = apagado
   con sol, 1 = encendido con cualquier otro clima). Se agrega sobre la
   escena existente, sin tocar el parqueo, el jardín ni la entrada.
   ===================================================================== */

let glowTexture = null; // textura de resplandor compartida por todos los postes

/** Textura radial suave (blanco cálido → transparente) para el halo. */
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,214,140,0.95)");
  grad.addColorStop(1, "rgba(255,214,140,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** Un poste completo: base, tubo, farol (con foco emisivo), halo tipo
 * sprite y una PointLight real. Devuelve las piezas que cambian con el
 * clima para registrarlas en `lampPosts`. */
function buildLampPost(x, z) {
  if (!glowTexture) glowTexture = makeGlowTexture();

  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2E2F2C, roughness: 0.55, metalness: 0.4 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x23241F, roughness: 0.5, metalness: 0.5 });
  // El foco empieza "apagado" (emissiveIntensity 0); applyLampLevel() lo enciende.
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0x3A3220, emissive: 0xFFC77A, emissiveIntensity: 0, roughness: 0.3,
  });

  const baseY = terrainHeightAt(x, z) + 0.27;
  const poleHeight = 6.2;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.4, 10), capMat);
  base.position.set(x, baseY + 0.2, z);
  base.castShadow = true;
  group.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, poleHeight, 8), metalMat);
  pole.position.set(x, baseY + 0.4 + poleHeight / 2, z);
  pole.castShadow = true;
  group.add(pole);

  const lampY = baseY + 0.4 + poleHeight;

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.5, 10), capMat);
  cap.position.set(x, lampY + 0.35, z);
  cap.castShadow = true;
  group.add(cap);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), bulbMat);
  bulb.position.set(x, lampY, z);
  group.add(bulb);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture, color: 0xFFD58A, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.scale.set(3, 3, 1);
  halo.position.set(x, lampY, z);
  group.add(halo);

  // Sin sombra propia (castShadow=false por defecto): son muchas luces
  // pequeñas y decorativas, no vale la pena el costo de recalcular sombras.
  const light = new THREE.PointLight(0xFFC77A, 0, 17, 2);
  light.position.set(x, lampY - 0.15, z);
  group.add(light);

  scene.add(group);
  return { bulb, halo, light };
}

/** Aplica el nivel de encendido (0..1) a todos los postes de una vez. */
function applyLampLevel(level) {
  lampPosts.forEach(({ bulb, halo, light }) => {
    bulb.material.emissiveIntensity = level * 1.6;
    halo.material.opacity = level * 0.6;
    light.intensity = level * 1.3;
  });
}

/** Coloca los postes: dos filas en el parqueo, dos flanqueando la
 * entrada, y dos más como "luces de jardín" en el área verde — todos en
 * posiciones que no chocan con los autos, la fuente ni las rutas donde
 * caminan las personas/el perro. */
function buildLampPosts({ xParqueo, parqueoWidth }) {
  const left = xParqueo - parqueoWidth / 2 + 10;
  const right = xParqueo + parqueoWidth / 2 - 10;
  const positions = [
    [left, 15], [right, 15], [left, 110], [right, 110],   // parqueo
    [-16, 2], [16, 2],                                     // entrada
    [75, 150], [-85, 150],                                 // jardín
  ];
  positions.forEach(([x, z]) => {
    lampPosts.push(buildLampPost(x, z));
  });
  applyLampLevel(currentLampLevel); // arrancan apagados (clima inicial: soleado)
}

function registerSelectable(id, meshes, groupOrMesh) {
  meshes.forEach((m) => {
    if (!m.userData.selectId) m.userData.selectId = id;
    selectableObjects.push(m);
  });
  selectionRegistry[id] = { object3D: groupOrMesh, meshes };
}

/** Anillo dorado que aparece bajo el objeto seleccionado. */
function buildHighlightRing() {
  const geo = new THREE.RingGeometry(1, 1.12, 48);
  const mat = new THREE.MeshBasicMaterial({ color: 0xB9822E, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  highlightRing = new THREE.Mesh(geo, mat);
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.visible = false;
  scene.add(highlightRing);
}

/* =====================================================================
   LLUVIA
   Un solo THREE.LineSegments con muchos trazos verticales cortos (dos
   vértices cada uno). Cada cuadro se desplazan hacia abajo "a mano"
   escribiendo directamente en el arreglo de posiciones — más liviano
   que crear/destruir miles de objetos.
   ===================================================================== */
const RAIN_COUNT = 900;
const RAIN_BOUNDS = { xMin: -110, xMax: 110, zMin: -20, zMax: 310, yMin: 20, yMax: 150 };

function buildRain() {
  const positions = new Float32Array(RAIN_COUNT * 2 * 3); // 2 vértices (inicio/fin) por gota
  const speeds = new Float32Array(RAIN_COUNT);
  const lengths = new Float32Array(RAIN_COUNT);

  for (let i = 0; i < RAIN_COUNT; i++) {
    const x = THREE.MathUtils.randFloat(RAIN_BOUNDS.xMin, RAIN_BOUNDS.xMax);
    const y = THREE.MathUtils.randFloat(RAIN_BOUNDS.yMin, RAIN_BOUNDS.yMax);
    const z = THREE.MathUtils.randFloat(RAIN_BOUNDS.zMin, RAIN_BOUNDS.zMax);
    const len = THREE.MathUtils.randFloat(1.6, 3.2);
    writeDrop(positions, i, x, y, z, len);
    speeds[i] = THREE.MathUtils.randFloat(70, 110);
    lengths[i] = len;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xCBD6D8, transparent: true, opacity: 0, depthWrite: false });
  rainPoints = new THREE.LineSegments(geo, mat);
  rainPoints.userData.speeds = speeds;
  rainPoints.userData.lengths = lengths;
  rainPoints.visible = false;
  rainPoints.frustumCulled = false; // el volumen de lluvia es más grande que cualquier objeto de la escena
  scene.add(rainPoints);
}

function writeDrop(arr, i, x, topY, z, len) {
  const base = i * 6;
  arr[base] = x; arr[base + 1] = topY; arr[base + 2] = z;
  arr[base + 3] = x; arr[base + 4] = topY - len; arr[base + 5] = z;
}

/** Hace caer cada gota; al tocar el suelo reaparece arriba en una
 * posición (x, z) nueva, para que la lluvia nunca se vea repetitiva. */
function updateRain(delta) {
  if (!rainPoints || !rainPoints.visible) return;
  const posAttr = rainPoints.geometry.attributes.position;
  const arr = posAttr.array;
  const speeds = rainPoints.userData.speeds;
  const lengths = rainPoints.userData.lengths;

  for (let i = 0; i < RAIN_COUNT; i++) {
    const base = i * 6;
    let topY = arr[base + 1] - speeds[i] * delta;
    let x = arr[base];
    let z = arr[base + 2];
    if (topY < 0) {
      topY = RAIN_BOUNDS.yMax;
      x = THREE.MathUtils.randFloat(RAIN_BOUNDS.xMin, RAIN_BOUNDS.xMax);
      z = THREE.MathUtils.randFloat(RAIN_BOUNDS.zMin, RAIN_BOUNDS.zMax);
    }
    arr[base] = x; arr[base + 1] = topY; arr[base + 2] = z;
    arr[base + 3] = x; arr[base + 4] = topY - lengths[i]; arr[base + 5] = z;
  }
  posAttr.needsUpdate = true;
}

/* =====================================================================
   CONTROL DE CLIMA
   ===================================================================== */

/** Copia los valores que la escena tiene AHORA MISMO (no el preset), para
 * que si el usuario cambia de clima a mitad de una transición, la nueva
 * transición arranque desde donde realmente está la escena, sin saltos. */
function snapshotCurrentWeather() {
  return {
    sky: scene.background.clone(),
    fogColor: scene.fog.color.clone(),
    fogNear: scene.fog.near,
    fogFar: scene.fog.far,
    sunColor: sunLight.color.clone(),
    sunIntensity: sunLight.intensity,
    hemiSky: hemiLight.color.clone(),
    hemiGround: hemiLight.groundColor.clone(),
    hemiIntensity: hemiLight.intensity,
    rainOpacity: rainPoints ? rainPoints.material.opacity : 0,
    lamp: currentLampLevel,
  };
}

function setWeather(mode) {
  if (mode === currentWeather) return;
  currentWeather = mode;
  if (mode === "rainy" && rainPoints) rainPoints.visible = true; // visible ya; la opacidad sube durante la transición
  weatherAnim.from = snapshotCurrentWeather();
  weatherAnim.to = WEATHER_PRESETS[mode];
  weatherAnim.t0 = performance.now();
  weatherAnim.active = true;
  updateWeatherButtons();
}

/** Interpola suavemente entre el clima anterior y el nuevo. Se llama una
 * vez por cuadro desde animate(), igual que la animación de cámara. */
function updateWeatherAnim() {
  if (!weatherAnim.active) return;
  const elapsed = performance.now() - weatherAnim.t0;
  const t = Math.min(1, elapsed / weatherAnim.duration);
  const e = easeInOutCubic(t);
  const { from, to } = weatherAnim;

  scene.background.copy(from.sky).lerp(to.sky, e);
  scene.fog.color.copy(from.fogColor).lerp(to.fogColor, e);
  scene.fog.near = THREE.MathUtils.lerp(from.fogNear, to.fogNear, e);
  scene.fog.far = THREE.MathUtils.lerp(from.fogFar, to.fogFar, e);

  sunLight.color.copy(from.sunColor).lerp(to.sunColor, e);
  sunLight.intensity = THREE.MathUtils.lerp(from.sunIntensity, to.sunIntensity, e);

  hemiLight.color.copy(from.hemiSky).lerp(to.hemiSky, e);
  hemiLight.groundColor.copy(from.hemiGround).lerp(to.hemiGround, e);
  hemiLight.intensity = THREE.MathUtils.lerp(from.hemiIntensity, to.hemiIntensity, e);

  if (rainPoints) {
    rainPoints.material.opacity = THREE.MathUtils.lerp(from.rainOpacity, to.rainOpacity, e);
  }

  currentLampLevel = THREE.MathUtils.lerp(from.lamp, to.lamp, e);
  applyLampLevel(currentLampLevel);

  if (t >= 1) {
    weatherAnim.active = false;
    if (currentWeather === "sunny" && rainPoints) rainPoints.visible = false; // ya llegó a 0 de opacidad
  }
}

function updateWeatherButtons() {
  const sunnyBtn = document.getElementById("btn-weather-sunny");
  const rainyBtn = document.getElementById("btn-weather-rainy");
  if (!sunnyBtn || !rainyBtn) return;
  sunnyBtn.classList.toggle("active", currentWeather === "sunny");
  sunnyBtn.setAttribute("aria-pressed", String(currentWeather === "sunny"));
  rainyBtn.classList.toggle("active", currentWeather === "rainy");
  rainyBtn.setAttribute("aria-pressed", String(currentWeather === "rainy"));
}

function wireWeatherUI() {
  const sunnyBtn = document.getElementById("btn-weather-sunny");
  const rainyBtn = document.getElementById("btn-weather-rainy");
  if (!sunnyBtn || !rainyBtn) return;
  sunnyBtn.addEventListener("click", () => setWeather("sunny"));
  rainyBtn.addEventListener("click", () => setWeather("rainy"));
  updateWeatherButtons();
}

/** Aplica un tinte emisivo dorado a los materiales de un objeto seleccionado. */
function applyHighlight(id) {
  Object.entries(selectionRegistry).forEach(([key, entry]) => {
    entry.meshes.forEach((m) => {
      if (!m.material || !("emissive" in m.material)) return;
      m.material.emissive = m.material.emissive || new THREE.Color(0x000000);
      m.material.emissive.set(key === id ? 0x3a2a06 : 0x000000);
    });
  });
}

function highlightObjectById(id) {
  selectedId = id;
  applyHighlight(id);

  if (!id || !selectionRegistry[id]) {
    highlightRing.visible = false;
    return;
  }
  const box = new THREE.Box3().setFromObject(selectionRegistry[id].object3D);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const radius = Math.max(size.x, size.z) * 0.62 + 3;
  highlightRing.geometry.dispose();
  highlightRing.geometry = new THREE.RingGeometry(radius * 0.94, radius, 48);
  highlightRing.position.set(center.x, Math.max(box.min.y + 0.15, 0.15), center.z);
  highlightRing.visible = true;
}

function focusCameraOn(id) {
  const view = CAMERA_VIEWS[id] || DEFAULT_VIEW;
  startCameraAnim(view.pos, view.target);
}

function startCameraAnim(toPos, toTarget) {
  cameraAnim.fromPos.copy(camera.position);
  cameraAnim.fromTarget.copy(controls.target);
  cameraAnim.toPos.copy(toPos);
  cameraAnim.toTarget.copy(toTarget);
  cameraAnim.t0 = performance.now();
  cameraAnim.active = true;
}

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function updateCameraAnim() {
  if (!cameraAnim.active) return;
  const elapsed = performance.now() - cameraAnim.t0;
  const t = Math.min(1, elapsed / cameraAnim.duration);
  const e = easeInOutCubic(t);
  camera.position.lerpVectors(cameraAnim.fromPos, cameraAnim.toPos, e);
  controls.target.lerpVectors(cameraAnim.fromTarget, cameraAnim.toTarget, e);
  if (t >= 1) cameraAnim.active = false;
}

/* --- Raycasting: clic/tap sobre el visor --- */
function onPointerUp(event) {
  const holder = document.getElementById("canvas-holder");
  const rect = holder.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(selectableObjects, false);
  if (hits.length === 0) return;

  const id = hits[0].object.userData.selectId;
  if (!id) return;

  // ¿Este objeto corresponde a un ítem de la navegación principal, o solo
  // es accesible desde el visor (como el edificio del teatro)?
  const navEntry = navOrder.find((n) => contentData[n].linkedObject === id);
  if (navEntry) {
    selectContentWithCleanup(navEntry, { fromScene: true });
  } else if (id === "theatre_building") {
    activeId = "edificioTeatro";
    setActiveNav(null);
    renderPanelOnly("edificioTeatro");
    highlightObjectById(id);
    focusCameraOn(id);
  }
}

/** Igual que selectContent pero sin volver a mover la cámara (ya se movió). */
function renderPanelOnly(id) {
  destroyCharts();
  selectContent(id, { skipSceneSync: true });
}

function onResize() {
  const holder = document.getElementById("canvas-holder");
  const w = holder.clientWidth;
  const h = holder.clientHeight;
  // En DevTools, al cambiar de preset de dispositivo, el contenedor puede
  // reportar momentáneamente 0x0 (antes de que el layout/CSS termine de
  // aplicarse). Si llamamos a renderer.setSize(0,0) el canvas queda roto
  // (altura/anchura 0) y no vuelve a recuperarse solo. Nos lo saltamos y
  // reintentamos en el próximo frame hasta que haya un tamaño real.
  if (w <= 0 || h <= 0) {
    requestAnimationFrame(onResize);
    return;
  }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

const sceneClock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  updateCameraAnim();
  if (highlightRing.visible) {
    highlightRing.rotation.z += 0.006;
    highlightRing.material.opacity = 0.65 + Math.sin(performance.now() * 0.003) * 0.2;
  }
  const delta = Math.min(sceneClock.getDelta(), 0.1); // limita saltos si la pestaña estuvo en segundo plano
  const elapsed = sceneClock.getElapsedTime();
  animatedCreatures.forEach((c) => c.update(delta, elapsed));
  updateWeatherAnim();
  updateRain(delta);
  controls.update();
  renderer.render(scene, camera);
}

function resetView() {
  activeId = null;
  setActiveNav(null);
  highlightObjectById(null);
  startCameraAnim(DEFAULT_VIEW.pos, DEFAULT_VIEW.target);
}

/* =====================================================================
   6. ARRANQUE DE LA APLICACIÓN
   ===================================================================== */

function openPanel() {
  document.getElementById("info-panel").classList.add("open");
  document.getElementById("side-nav").classList.remove("open");
  document.getElementById("scrim").hidden = false;
}
function openNav() {
  document.getElementById("side-nav").classList.add("open");
  document.getElementById("info-panel").classList.remove("open");
  document.getElementById("scrim").hidden = false;
}
function closePanels() {
  document.getElementById("info-panel").classList.remove("open");
  document.getElementById("side-nav").classList.remove("open");
  document.getElementById("scrim").hidden = true;
  // El contenedor del canvas puede haber cambiado de tamaño al
  // mostrarse/ocultarse los cajones; forzamos un recálculo del render.
  requestAnimationFrame(onResize);
}

function wireUI() {
  document.getElementById("btn-toggle-nav").addEventListener("click", () => {
    const nav = document.getElementById("side-nav");
    if (nav.classList.contains("open")) {
      closePanels();
    } else {
      openNav();
    }
  });
  document.getElementById("btn-toggle-panel").addEventListener("click", () => {
    const panel = document.getElementById("info-panel");
    if (panel.classList.contains("open")) {
      closePanels();
    } else {
      openPanel();
    }
  });
  document.getElementById("scrim").addEventListener("click", closePanels);
  document.getElementById("btn-reset-view").addEventListener("click", resetView);

  // Botones "X" dentro de los cajones, si existen en el HTML (ver index.html).
  const closeNavBtn = document.getElementById("btn-close-nav");
  if (closeNavBtn) closeNavBtn.addEventListener("click", closePanels);
  const closePanelBtn = document.getElementById("btn-close-panel");
  if (closePanelBtn) closePanelBtn.addEventListener("click", closePanels);
}

function init() {
  renderNav();
  wireUI();
  initThree();
  selectContentWithCleanup("introduccion");

  requestAnimationFrame(() => {
    setTimeout(() => {
      document.getElementById("loading-overlay").classList.add("hidden");
    }, 250);
  });
}

init();
