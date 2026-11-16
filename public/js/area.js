// area.js: numbers and two charts for one thana.
// The chosen area is in the address of the page, for example area.html?id=6afac18b...

const areaSelect = document.getElementById("area");

async function showArea(thanaId) {
  // The answer looks like:
  // { thana, total: 6, byType: { mobile_snatching: 3, ... }, byHour: [24 numbers], alerts: [...] }
  const area = await getJSON("/api/areas/" + thanaId);
  const thana = area.thana;

  document.getElementById("area-name").textContent = `${thana.nameEn} / ${thana.nameBn}`;
  document.getElementById("area-station").textContent =
    `${thana.stationEn}: ${thana.address || "address not listed"} · ${thana.phone}`;
  document.getElementById("total").textContent = area.total;
  document.getElementById("top-type").textContent = mostCommonType(area.byType);
  document.getElementById("busy-hour").textContent = busiestHour(area.byHour);

  // Show the section before drawing the charts: Chart.js cannot measure a hidden canvas.
  document.getElementById("area-details").classList.remove("d-none");
  drawTypeChart(area.byType);
  drawHourChart(area.byHour);
  showAreaAlerts(area.alerts);
}

function mostCommonType(byType) {
  let bestType = null;
  let bestCount = 0;
  for (const type in byType) {
    if (byType[type] > bestCount) {
      bestType = type;
      bestCount = byType[type];
    }
  }
  if (bestType === null) {
    return "–";
  }
  return theftTypeInEnglish(bestType);
}

function busiestHour(byHour) {
  let bestHour = null;
  let bestCount = 0;
  for (let hour = 0; hour < 24; hour++) {
    if (byHour[hour] > bestCount) {
      bestHour = hour;
      bestCount = byHour[hour];
    }
  }
  if (bestHour === null) {
    return "–";
  }
  return `${hourLabel(bestHour)} – ${hourLabel((bestHour + 1) % 24)}`;
}

// 0 -> "12 am", 13 -> "1 pm"
function hourLabel(hour) {
  let twelveHour = hour % 12;
  if (twelveHour === 0) {
    twelveHour = 12;
  }
  if (hour < 12) {
    return twelveHour + " am";
  }
  return twelveHour + " pm";
}

function drawTypeChart(byType) {
  const types = Object.keys(byType);
  const labels = types.map(theftTypeInEnglish);
  const counts = types.map((type) => byType[type]);

  new Chart(document.getElementById("type-chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ label: "Thefts", data: counts, backgroundColor: "#1d4ed8" }],
    },
    options: {
      indexAxis: "y", // bars go across, so long type names fit
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { precision: 0 } } }, // whole numbers only: there is no half a theft
    },
  });
}

function drawHourChart(byHour) {
  const labels = [];
  for (let hour = 0; hour < 24; hour++) {
    labels.push(hourLabel(hour));
  }

  new Chart(document.getElementById("hour-chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ label: "Thefts", data: byHour, backgroundColor: "#b45309" }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { precision: 0 } } },
    },
  });
}

function showAreaAlerts(alerts) {
  const list = document.getElementById("area-alerts");
  if (alerts.length === 0) {
    list.innerHTML = `<li class="list-group-item text-secondary">No alerts in this area yet.</li>`;
    return;
  }

  let html = "";
  for (const alert of alerts) {
    html += `
      <li class="list-group-item">
        <div>${escapeHtml(alert.message)}</div>
        <div class="small text-secondary">${formatDateTime(alert.createdAt)}</div>
      </li>`;
  }
  list.innerHTML = html;
}

async function startPage() {
  await fillThanaSelect("area", "Choose an area");

  // Choosing an area opens this page again with the area in the address, so it can be shared.
  areaSelect.addEventListener("change", () => {
    location.href = "area.html?id=" + areaSelect.value;
  });

  const thanaId = new URLSearchParams(location.search).get("id");
  if (thanaId) {
    areaSelect.value = thanaId;
    await showArea(thanaId);
  }
}

startPage().catch((error) => showError("error", error.message));
