// =========================
// ESTADO DE LA APP
// =========================

const App = {
  ready: false,
  clima: {},
  map: null,
  typing: false
};

// =========================
// SEGURIDAD
// =========================

window.addEventListener("error", e => console.warn("JS Error:", e.message));
window.addEventListener("unhandledrejection", e => console.warn("Promise:", e.reason));

// =========================
// UI CORE
// =========================

const UI = {
  set(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  },

  get(id) {
    return document.getElementById(id);
  },

  show(screen) {
    document.querySelectorAll(".pantalla").forEach(p => p.classList.add("oculto"));
    const el = document.getElementById(screen);
    if (el) el.classList.remove("oculto");
  }
};

// =========================
// HELPERS
// =========================

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// =========================
// NAVEGACIÓN
// =========================

function mostrar(id) {
  UI.show(id);

  if (id === "chat") {
    setTimeout(() => {
      saludarBot(localStorage.getItem("nombreUsuario") || "Usuario");
    }, 200);
  }

  if (id === "mapa" && !App.map) {
    setTimeout(initMapa, 300);
  }
}

// =========================
// VOZ
// =========================

function hablar(texto) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-AR";
    u.rate = 1;
    speechSynthesis.speak(u);
  } catch {}
}

// =========================
// CHAT ENGINE
// =========================

function preguntarIA() {
  const input = UI.get("pregunta");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  responderIA(text);
  input.value = "";
}

function responderIA(texto) {
  const chat = UI.get("chatMensajes");
  if (!chat || App.typing) return;

  App.typing = true;

  const q = texto.toLowerCase();

  let resp = "No entendí 😅";

  if (q.includes("hola")) resp = rand(["Hola 😎", "Sistema activo 🌫️", "Nebulax online"]);
  if (q.includes("niebla")) resp = `Riesgo: ${App.clima.riesgo ?? 0}% 🌫️`;
  if (q.includes("temperatura")) resp = `${App.clima.temp ?? "--"}°C`;

  chat.innerHTML += `<div class="mensaje-usuario">${texto}</div>`;

  setTimeout(() => {
    chat.innerHTML += `<div class="mensaje-ia">Escribiendo...</div>`;
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
      chat.lastElementChild.innerHTML = resp;
      hablar(resp);
      App.typing = false;
    }, 600);
  }, 250);
}

// =========================
// USUARIO SYSTEM
// =========================

function cargarUsuario() {
  let nombre = localStorage.getItem("nombreUsuario");

  if (!nombre) {
    nombre = prompt("¿Cómo te llamás?");
    localStorage.setItem("nombreUsuario", nombre || "Usuario");
  }

  actualizarBienvenida();
  saludarBot(nombre);
}

function saludarBot(nombre) {
  const chat = UI.get("chatMensajes");
  if (!chat) return;

  chat.innerHTML = `
    <div class="mensaje-ia">
      🤖 Hola ${nombre}, Nebulax está activo
    </div>
  `;
}

// =========================
// BIENVENIDA
// =========================

function actualizarBienvenida() {
  const el = UI.get("bienvenidaInicio");
  const nombre = localStorage.getItem("nombreUsuario") || "Usuario";

  if (el) el.innerText = `¡Bienvenido, ${nombre}!`;
}

// =========================
// CLIMA ENGINE
// =========================

async function cargarClima() {
  try {
    UI.set("estadoNiebla", "Cargando clima...");

    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-26.83&longitude=-65.22&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto"
    );

    const d = await res.json();

    const temp = Math.round(d.current.temperature_2m);
    const humedad = Math.round(d.current.relative_humidity_2m);
    const viento = Math.round(d.current.wind_speed_10m);

    const riesgo =
      (humedad > 70 ? 30 : 0) +
      (viento < 10 ? 20 : 0) +
      (temp < 15 ? 20 : 0);

    App.clima = { temp, humedad, viento, riesgo };

    UI.set("temp", temp + "°C");
    UI.set("humedad", humedad + "%");
    UI.set("viento", viento + " km/h");
    UI.set("riesgo", riesgo + "%");

    actualizarConduccion();
 const forecast = document.getElementById("forecastContainer");

    if (forecast) {
      const base = App.clima.temp;

      forecast.innerHTML = `
        <div class="forecast-card">
          <span>Ahora</span>
          <h2>${base}°</h2>
        </div>

        <div class="forecast-card">
          <span>+1h</span>
          <h2>${base - 1}°</h2>
        </div>

        <div class="forecast-card">
          <span>+2h</span>
          <h2>${base - 2}°</h2>
        </div>

        <div class="forecast-card">
          <span>+3h</span>
          <h2>${base - 3}°</h2>
        </div>
      `;
   }
  } catch (e) {
    console.warn("Clima error:", e);
  }
}
// =========================
// CONDUCTOR MODE
// =========================

function actualizarConduccion() {
  const e = UI.get("estadoConduccion");
  const c = UI.get("consejoConduccion");

  if (!e || !c) return;

  const r = App.clima.riesgo ?? 0;

  if (r >= 70) {
    e.innerText = "🔴 Peligro";
    c.innerText = "Reducí velocidad y luces bajas";
  } else if (r >= 40) {
    e.innerText = "🟡 Precaución";
    c.innerText = "Atención en ruta";
  } else {
    e.innerText = "🟢 Seguro";
    c.innerText = "Condiciones normales";
  }
}

// =========================
// MAPA
// =========================

function initMapa() {
  const el = document.getElementById("mapaContainer");
  if (!el || typeof L === "undefined") return;

  if (App.map) return; // evita duplicado

  App.map = L.map("mapaContainer").setView([-26.83, -65.22], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(App.map);

  agregarMarcadoresBase();
}

agregarMarcadoresBase();

// =========================
// AJUSTES
// =========================

function cambiarColor(color) {
  document.documentElement.style.setProperty("--color-principal", color);
  localStorage.setItem("temaColor", color);
}

function guardarNombre() {
  const input = UI.get("inputNombre");
  if (!input) return;

  const nombre = input.value.trim();
  if (!nombre) return;

  localStorage.setItem("nombreUsuario", nombre);

  actualizarBienvenida();
  saludarBot(nombre);
}

// =========================
// INICIO APP
// =========================

window.onload = async () => {
  UI.show("inicio");

  cargarUsuario();

  const color = localStorage.getItem("temaColor");
  if (color) cambiarColor(color);

  const input = UI.get("inputNombre");
  if (input) input.value = localStorage.getItem("nombreUsuario") || "";

  await cargarClima();

  App.ready = true;
};
function agregarMarcadoresBase() {
  if (!App.map) return;

  const puntos = [
    { nombre: "Estación Aráoz", lat: -26.83, lon: -65.14, riesgo: 80 },
    { nombre: "Tacanas", lat: -26.58, lon: -65.33, riesgo: 50 },
    { nombre: "Ranchillos", lat: -26.87, lon: -65.15, riesgo: 20 }
  ];

  puntos.forEach(p => {
    const color = p.riesgo >= 70 ? "red" : p.riesgo >= 40 ? "orange" : "green";

    L.circleMarker([p.lat, p.lon], {
      radius: 10,
      color,
      fillColor: color,
      fillOpacity: 0.6
    })
      .addTo(App.map)
      .bindPopup(`${p.nombre}<br>Riesgo: ${p.riesgo}%`);
  });
}
function escuchar() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert("No soportado");

  const rec = new SR();
  rec.lang = "es-ES";

  UI.set("textoEscuchado", "🎤 Escuchando...");

  rec.start();

  rec.onresult = (e) => {
    const texto = e.results[0][0].transcript;
    UI.set("textoEscuchado", "Vos: " + texto);
    responderIA(texto);
  };
}
function cambiarLocalidad() {
  const sel = document.getElementById("selectorLocalidad");
  if (!sel) return;

  localStorage.setItem("localidad", sel.value);

  cargarClima();
}
const forecast = document.getElementById("forecastContainer");


function abrirCamara() {
  const input = document.getElementById("camaraInput");
  if (input) input.click();
}
function verEstimacion() {
  const el = document.getElementById("resultadoEstimacion");
  if (!el) return;

  const r = App.clima.riesgo ?? 0;

  if (r >= 70) {
    el.innerText = "🔴 Visibilidad muy baja (<200m)";
  } else if (r >= 40) {
    el.innerText = "🟡 Visibilidad media (200–600m)";
  } else {
    el.innerText = "🟢 Buena visibilidad (>600m)";
  }
}
function abrirAjustes() {
  mostrar("ajustes");
}
function cargarCuriosidades() {
  const lista = document.getElementById("listaCuriosidades");
  if (!lista) return;

  const data = JSON.parse(localStorage.getItem("curiosidades")) || [];

  lista.innerHTML = data.map(c => `<li>🌫️ ${c}</li>`).join("");
}

function agregarCuriosidad() {
  const input = document.getElementById("inputCuriosidad");
  if (!input) return;

  const texto = input.value.trim();
  if (!texto) return;

  const data = JSON.parse(localStorage.getItem("curiosidades")) || [];

  data.push(texto);
  localStorage.setItem("curiosidades", JSON.stringify(data));

  input.value = "";
  cargarCuriosidades();
}