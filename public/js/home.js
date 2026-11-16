// home.js: show the latest alerts, one card each. An alert is made when a verifier approves a report.

const alertsBox = document.getElementById("alerts");
const areaFilter = document.getElementById("area-filter");

async function showAlerts() {
  hideError("error");
  const thanaId = areaFilter.value;
  let url = "/api/alerts";
  if (thanaId) {
    url = "/api/alerts?thana=" + thanaId;
  }

  try {
    const alerts = await getJSON(url);
    alertsBox.innerHTML = alerts.map(alertCard).join("");
    document.getElementById("no-alerts").classList.toggle("d-none", alerts.length > 0);
  } catch (error) {
    showError("error", error.message);
  }
}

// One Bootstrap card per alert. No names or GD numbers: the server never sends them.
function alertCard(alert) {
  const type = THEFT_TYPES[alert.theftType];
  const thana = `${alert.thana.nameEn} / ${alert.thana.nameBn}`;
  const areaLink = `<a href="area.html?id=${alert.thana._id}">See this area</a>`;
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100">
        <div class="card-body">
          <span class="badge bg-danger mb-2">${escapeHtml(type)}</span>
          <h3 class="h6">${escapeHtml(thana)}</h3>
          <p class="mb-2">${escapeHtml(alert.message)}</p>
          <p class="small text-secondary mb-0">${formatDateTime(alert.createdAt)} · ${areaLink}</p>
        </div>
      </div>
    </div>`;
}

async function startPage() {
  await fillThanaSelect("area-filter", "All areas");
  areaFilter.addEventListener("change", showAlerts);
  showAlerts();
}

startPage().catch((error) => showError("error", error.message));
