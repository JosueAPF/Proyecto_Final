/* =====================================================================
   SIMULADOR 3D — MODELADO MATEMÁTICO DE UN TEATRO
   main.js

   Organización del archivo (léelo en este orden):
     1. Constantes del modelo matemático (las mismas cifras del informe)
     2. Contenido de cada sección: texto, fórmulas (LaTeX) y gráficas
     3. Construcción de la interfaz (nav izquierda + panel derecho)
     4. Motor Chart.js: una función genérica que dibuja cualquier función
     5. Motor Three.js: escena, terreno, raycasting, resaltado, cámara
     6. Arranque de la aplicación

   Cada bloque está comentado pensando en un estudiante de Pre-Cálculo
   que quiere entender qué hace el código, no solo copiarlo.
   ===================================================================== */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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
      "El terreno se organiza en <strong>tres franjas rectangulares paralelas</strong> que abarcan todo el ancho de 200 m. Esta disposición permite describir las tres superficies con una sola variable independiente, sin perder coherencia con el área total.",
      "En el visor 3D, el orden de las franjas —de la entrada hacia el fondo— es <strong>parqueo → teatro → área verde</strong>. Este orden es una decisión de representación del equipo (el informe no especifica una secuencia exacta); lo importante, matemáticamente, es que las tres franjas suman el ancho completo y que el área verde y el parqueo son complementarias.",
      "El tanque cilíndrico se representa sobre el techo del teatro, como símbolo y sin escala real respecto al edificio — tal como lo indica el informe original.",
    ],
    table: {
      headers: ["Zona", "Dimensiones", "Área"],
      rows: [
        ["Parqueo", "200 m × 75 m", "15,000 m²"],
        ["Teatro", "200 m × 50 m", "10,000 m²"],
        ["Área verde", "200 m × 175 m", "35,000 m²"],
      ],
      highlightRow: -1,
    },
    callout: "Verificación: 15,000 + 10,000 + 35,000 = <b>60,000 m²</b>, exactamente el área del terreno.",
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
    kicker: "Función lineal",
    title: "Perímetro del parqueo",
    body: [
      "Este perímetro es el del <strong>rectángulo de parqueo</strong>, no el del terreno completo: 200 m de ancho fijo (el mismo del terreno) por x m de profundidad, la variable de diseño.",
      "La pendiente 2 indica que cada metro adicional de profundidad del parqueo incrementa en 2 m su perímetro — cada uno de los dos lados de longitud x se contabiliza, además de los dos lados de 200 m.",
      "Con el valor de diseño x = 75 m, el perímetro del parqueo resulta P(75) = 550 m.",
    ],
    formulas: [
      { latex: "P(x) = 2(200 + x) = 400 + 2x", caption: "Perímetro del parqueo en función de x" },
      { latex: "P(75) = 400 + 2(75) = 550\\text{ m}", caption: "Evaluación con el valor de diseño" },
    ],
    tags: ["Función lineal", "Pendiente = 2"],
    chart: { key: "P", highlightX: 75, highlightLabel: "x = 75 m → 550 m" },
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

  // En pantallas angostas, abrir el panel automáticamente al seleccionar.
  if (window.matchMedia("(max-width: 900px)").matches) {
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
  P: { fn: (x) => 400 + 2 * x, domain: [0, 250], xLabel: "x (m)", yLabel: "P(x) (m)", name: "P(x) = 400 + 2x" },
  I: { fn: (t) => -2000 * t * t + 10000 * t + 100000, domain: [0, 5], xLabel: "t (unidades de Q10)", yLabel: "I(t) (Q)", name: "I(t) = −2,000t² + 10,000t + 100,000" },
};

let chartInstances = []; // referencias activas, para destruirlas al cambiar de panel

/** Crea el contenedor + <canvas> + gráfica Chart.js para una función dada. */
function buildChartBlock(cfg) {
  const def = FUNCTION_DEFS[cfg.key];
  const wrap = document.createElement("div");
  wrap.className = "chart-wrap";

  const canvas = document.createElement("canvas");
  canvas.height = 190;
  wrap.appendChild(canvas);

  const readout = document.createElement("div");
  readout.className = "chart-readout";
  readout.innerHTML = `<span>${def.name}</span><b>${cfg.highlightLabel || ""}</b>`;
  wrap.appendChild(readout);

  // Muestreo de la función en su dominio
  const [a, b] = def.domain;
  const steps = 60;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    points.push({ x, y: def.fn(x) });
  }

  const highlightPoint = cfg.highlightX != null
    ? { x: cfg.highlightX, y: def.fn(cfg.highlightX) }
    : null;

  // El canvas debe existir en el DOM antes de instanciar Chart.js,
  // así que la creación real se difiere con requestAnimationFrame.
  requestAnimationFrame(() => {
    const chart = new Chart(canvas.getContext("2d"), {
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
          ...(highlightPoint ? [{
            label: "Valor de diseño",
            data: [highlightPoint],
            borderColor: "#B9822E",
            backgroundColor: "#B9822E",
            pointRadius: 5,
            pointHoverRadius: 6,
            showLine: false,
          }] : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 550 },
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
            title: { display: true, text: def.xLabel, font: { family: "IBM Plex Sans", size: 11 }, color: "#565F55" },
            grid: { color: "#E9E5D8" },
            ticks: { color: "#8A9186", font: { size: 10 } },
          },
          y: {
            title: { display: true, text: def.yLabel, font: { family: "IBM Plex Sans", size: 11 }, color: "#565F55" },
            grid: { color: "#E9E5D8" },
            ticks: { color: "#8A9186", font: { size: 10 } },
          },
        },
      },
    });
    chartInstances.push(chart);
  });

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
const pointerDownPos = new THREE.Vector2();
let selectableObjects = [];  // meshes/objetos que responden a clic
let selectionRegistry = {};  // id -> { object3D, meshes[] } para resaltar
let selectedId = null;
let highlightRing;

const cameraAnim = { active: false, t0: 0, duration: 900, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3() };

const DEFAULT_VIEW = {
  pos: new THREE.Vector3(210, 190, 300),
  target: new THREE.Vector3(0, 5, 150),
};

// Vistas de cámara asociadas a cada objeto seleccionable (posición + mira)
const CAMERA_VIEWS = {
  ground_parqueo: { pos: new THREE.Vector3(90, 85, 40), target: new THREE.Vector3(0, 0, 37.5) },
  ground_verde: { pos: new THREE.Vector3(140, 140, 260), target: new THREE.Vector3(0, 0, 212) },
  tank_group: { pos: new THREE.Vector3(55, 55, 165), target: new THREE.Vector3(60, 28, 108) },
  perimeter_group: { pos: new THREE.Vector3(95, 78, 42), target: new THREE.Vector3(0, 0, 37.5) },
  entrance_group: { pos: new THREE.Vector3(45, 30, -10), target: new THREE.Vector3(0, 4, 8) },
  theatre_building: { pos: new THREE.Vector3(120, 70, 60), target: new THREE.Vector3(0, 14, 100) },
};

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

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(DEFAULT_VIEW.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 40;
  controls.maxDistance = 520;
  controls.update();

  // --- Luces: ambiente suave + sol direccional con sombra ---
  scene.add(new THREE.HemisphereLight(0xF3F1E6, 0x8B8D7E, 0.75));
  const sun = new THREE.DirectionalLight(0xFFF6E3, 1.15);
  sun.position.set(180, 260, 120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -220;
  sun.shadow.camera.right = 220;
  sun.shadow.camera.top = 220;
  sun.shadow.camera.bottom = -220;
  sun.shadow.camera.far = 700;
  sun.shadow.bias = -0.0006;
  scene.add(sun);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  buildTerrain();
  buildHighlightRing();

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

/** Construye el terreno completo: franjas, edificio, tanque, entrada y perímetro. */
function buildTerrain() {
  const W = MODEL.terrenoAncho;   // 200 — eje x
  const L = MODEL.terrenoLargo;   // 300 — eje z
  const halfW = W / 2;

  // Orden de franjas a lo largo de z, desde la entrada (z=0) hacia el fondo:
  const zParqueoStart = 0, zParqueoEnd = MODEL.xDiseno;                       // 0–75
  const zTeatroStart = zParqueoEnd, zTeatroEnd = zTeatroStart + MODEL.teatroLargo; // 75–125
  const zVerdeStart = zTeatroEnd, zVerdeEnd = L;                              // 125–300

  // --- Base del terreno ---
  const baseGeo = new THREE.PlaneGeometry(W + 10, L + 10);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xEDE9DB, roughness: 1 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, -0.05, L / 2);
  base.receiveShadow = true;
  scene.add(base);

  // --- Zona: Parqueo ---
  addZone("ground_parqueo", 0x8B8D86, W, zParqueoEnd - zParqueoStart, 0, (zParqueoStart + zParqueoEnd) / 2, makeParkingTexture());

  // --- Zona: Área verde (con algunos árboles decorativos, no seleccionables) ---
  addZone("ground_verde", 0x7C9473, W, zVerdeEnd - zVerdeStart, 0, (zVerdeStart + zVerdeEnd) / 2, null);
  scatterTrees(zVerdeStart, zVerdeEnd, halfW);

  // --- Franja base del teatro (para que el suelo bajo el edificio tenga el
  //     mismo lenguaje visual que las otras dos zonas) ---
  addZone(null, 0xCFC7AE, W, zTeatroEnd - zTeatroStart, -0.01, (zTeatroStart + zTeatroEnd) / 2, null, false);

  // --- Edificio del teatro ---
  buildTheatreBuilding(zTeatroStart, zTeatroEnd, halfW);

  // --- Tanque cilíndrico (sobre el techo del teatro) ---
  buildTank(zTeatroStart, zTeatroEnd);

  // --- Entrada principal ---
  buildEntrance();

  // --- Perímetro (marco seleccionable alrededor del PARQUEO, no del terreno) ---
  buildPerimeter(W, zParqueoStart, zParqueoEnd);
}

/** Crea una franja rectangular del terreno; si id no es null, es seleccionable. */
function addZone(id, color, width, depth, y, zCenter, texture, selectable = true) {
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
  mesh.position.set(0, y, zCenter);
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

function buildTheatreBuilding(zStart, zEnd, halfW) {
  const group = new THREE.Group();
  const depth = zEnd - zStart;
  const width = MODEL.terrenoAncho * 0.82; // ligeramente menor al ancho total, deja retiro visual
  const height = 16;

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xC9BFA0, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xB2A57F, roughness: 0.7 });

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth * 0.86), wallMat);
  main.position.set(0, height / 2, zStart + depth / 2);
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  // Torre escénica (fly tower): volumen más alto característico de teatros
  const towerH = 9;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(width * 0.42, towerH, depth * 0.5), roofMat);
  tower.position.set(0, height + towerH / 2, zStart + depth * 0.62);
  tower.castShadow = true;
  group.add(tower);

  // Marquesina/entrada sobre la cara frontal (hacia el parqueo, z pequeño)
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 1.1, 8), roofMat);
  canopy.position.set(0, height * 0.42, zStart - 3.5);
  canopy.castShadow = true;
  group.add(canopy);

  scene.add(group);
  group.userData.selectId = "theatre_building";
  registerSelectable("theatre_building", [main, tower, canopy], group);

  return group;
}

function buildTank(zStart, zEnd) {
  const group = new THREE.Group();
  const roofY = 16; // debe coincidir con la altura del edificio
  const legH = 4.2;
  const tankX = MODEL.terrenoAncho * 0.82 * 0.28;      // cerca de una esquina del techo
  const tankZ = zStart + (zEnd - zStart) * 0.28;

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

/** Marco que traza el contorno del rectángulo de PARQUEO (200 × x), no el
 * perímetro del terreno completo — el modelo P(x) = 400 + 2x corresponde
 * únicamente a esta franja. */
function buildPerimeter(W, zStart, zEnd) {
  const group = new THREE.Group();
  const depth = zEnd - zStart;
  const mat = new THREE.MeshStandardMaterial({ color: 0x9AA38F, roughness: 0.6 });
  const h = 0.9, th = 0.9;
  // Cuatro tramos: frente, fondo, izquierda, derecha — bordeando solo el parqueo
  const front = new THREE.Mesh(new THREE.BoxGeometry(W + th, h, th), mat);
  front.position.set(0, h / 2, zStart);
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + th, h, th), mat);
  back.position.set(0, h / 2, zEnd);
  const left = new THREE.Mesh(new THREE.BoxGeometry(th, h, depth + th), mat);
  left.position.set(-W / 2, h / 2, zStart + depth / 2);
  const right = new THREE.Mesh(new THREE.BoxGeometry(th, h, depth + th), mat);
  right.position.set(W / 2, h / 2, zStart + depth / 2);
  [front, back, left, right].forEach((m) => { m.castShadow = true; group.add(m); });

  scene.add(group);
  group.userData.selectId = "perimeter_group";
  registerSelectable("perimeter_group", [front, back, left, right], group);
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
  camera.aspect = holder.clientWidth / holder.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(holder.clientWidth, holder.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  updateCameraAnim();
  if (highlightRing.visible) {
    highlightRing.rotation.z += 0.006;
    highlightRing.material.opacity = 0.65 + Math.sin(performance.now() * 0.003) * 0.2;
  }
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
  document.getElementById("scrim").hidden = false;
}
function closePanels() {
  document.getElementById("info-panel").classList.remove("open");
  document.getElementById("side-nav").classList.remove("open");
  document.getElementById("scrim").hidden = true;
}

function wireUI() {
  document.getElementById("btn-toggle-nav").addEventListener("click", () => {
    document.getElementById("side-nav").classList.add("open");
    document.getElementById("scrim").hidden = false;
  });
  document.getElementById("btn-toggle-panel").addEventListener("click", () => {
    openPanel();
  });
  document.getElementById("scrim").addEventListener("click", closePanels);
  document.getElementById("btn-reset-view").addEventListener("click", resetView);
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
