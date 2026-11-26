const FUNES_CENTER = [42.2915, -1.7912];
const STORAGE_KEY = "funes-juego-misiones";

const loadingScreen = document.getElementById("loading-screen");
const loadingImage = document.getElementById("loading-image");
const missionList = document.getElementById("mission-list");
const progressText = document.getElementById("progress");

let missions = loadMissions();
let selectedMissionId = null;

const map = L.map("map").setView(FUNES_CENTER, 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const missionMarkers = L.layerGroup().addTo(map);

function loadMissions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMissions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
}

function renderMissions() {
  missionMarkers.clearLayers();
  missionList.innerHTML = "";

  let completed = 0;

  missions.forEach((mission, index) => {
    if (mission.done) completed++;

    const marker = L.marker([mission.lat, mission.lng]).addTo(missionMarkers);
    marker.bindTooltip(mission.name);
    marker.on("click", () => {
      selectedMissionId = mission.id;
      renderMissions();
    });

    const card = document.createElement("div");
    card.className = `mission-card${mission.done ? " done" : ""}`;

    const title = document.createElement("strong");
    title.textContent = mission.name;

    const status = document.createElement("span");
    status.textContent = mission.done ? "Completada" : "Pendiente";

    card.append(title, status);

    if (selectedMissionId === mission.id && !mission.done) {
      const completeButton = document.createElement("button");
      completeButton.textContent = "Marcar como visitada";
      completeButton.addEventListener("click", () => {
        mission.done = true;
        selectedMissionId = null;
        saveMissions();
        renderMissions();
      });
      card.appendChild(completeButton);
    }

    missionList.appendChild(card);
  });

  progressText.textContent = `Completadas: ${completed} / ${missions.length}`;
}

map.on("click", (event) => {
  const nextNumber = missions.length + 1;

  missions.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: `Punto de misión ${nextNumber}`,
    lat: event.latlng.lat,
    lng: event.latlng.lng,
    done: false
  });

  saveMissions();
  renderMissions();
});

document.getElementById("start-button").addEventListener("click", () => {
  loadingScreen.classList.add("hidden");
  loadingScreen.style.display = "none";
  setTimeout(() => map.invalidateSize(), 100);
});

document.getElementById("locate-button").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Este navegador no permite obtener la ubicación.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = [
        position.coords.latitude,
        position.coords.longitude
      ];

      map.setView(location, 17);
      L.circleMarker(location, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#28734b",
        fillOpacity: 1
      }).addTo(map).bindPopup("Estás aquí").openPopup();
    },
    () => alert("No se pudo obtener la ubicación. Revisa los permisos del navegador.")
  );
});

document.getElementById("clear-button").addEventListener("click", () => {
  if (!confirm("¿Borrar todas las misiones guardadas en este dispositivo?")) return;

  missions = [];
  selectedMissionId = null;
  saveMissions();
  renderMissions();
});

// Alterna entre las dos imágenes de carga al abrir la página.
const loadingImages = [
  "images/carga_1.jpg",
  "images/carga_2.jpg"
];
loadingImage.src = loadingImages[Math.floor(Math.random() * loadingImages.length)];

renderMissions();
