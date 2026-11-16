// map.js: the public map of approved thefts. The server only sends the moved point (publicPlace).

const theftMap = L.map("theft-map").setView([23.78, 90.4], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(theftMap);

// All theft points sit in one layer, so a new filter can clear them in one go.
const theftLayer = L.layerGroup().addTo(theftMap);

async function showThefts() {
  hideError("error");
  const params = new URLSearchParams({ days: document.getElementById("days-filter").value });
  const type = document.getElementById("type-filter").value;
  if (type) params.set("type", type);

  try {
    const thefts = await getJSON("/api/map?" + params);
    theftLayer.clearLayers();
    for (const theft of thefts) {
      addTheftPoint(theft);
    }
    document.getElementById("map-count").textContent = `${thefts.length} approved thefts shown.`;
  } catch (error) {
    showError("error", error.message);
  }
}

function addTheftPoint(theft) {
  const [lng, lat] = theft.publicPlace.coordinates;
  const type = THEFT_TYPES[theft.theftType];
  const thana = theft.thana.nameEn;
  L.circleMarker([lat, lng], { radius: 8, color: "#b45309", fillColor: "#b45309", fillOpacity: 0.6 })
    .bindPopup(`<strong>${escapeHtml(type)}</strong><br>${escapeHtml(thana)}<br>${formatDateTime(theft.happenedAt)}`)
    .addTo(theftLayer);
}

// The search box above the map (see area-search.js).
setUpAreaSearch(theftMap, "Orange dots are approved thefts near here.");

fillTheftTypeSelect("type-filter", "All types");
document.getElementById("type-filter").addEventListener("change", showThefts);
document.getElementById("days-filter").addEventListener("change", showThefts);
showThefts();
