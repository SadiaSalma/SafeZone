// admin.js: staff accounts, all reports, and thana addresses and phones.

function showDone(message) {
  hideError("error");
  const box = document.getElementById("done");
  box.textContent = message;
  box.classList.remove("d-none");
}

async function loadStaff() {
  const staff = await getJSON("/api/admin/staff");
  document.getElementById("staff-rows").innerHTML = staff.map((person) => `
    <tr>
      <td>${escapeHtml(person.name)}</td>
      <td>${escapeHtml(person.phone)}</td>
      <td><span class="badge bg-secondary">${escapeHtml(person.role)}</span></td>
      <td>${formatDate(person.createdAt)}</td>
    </tr>`).join("");
}

document.getElementById("staff-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const newVerifier = {
    name: document.getElementById("staff-name").value.trim(),
    phone: document.getElementById("staff-phone").value.trim(),
    password: document.getElementById("staff-password").value,
  };
  try {
    await postJSON("/api/admin/staff", newVerifier);
    event.target.reset();
    showDone(`${newVerifier.name} can now log in and review reports.`);
    await loadStaff();
  } catch (error) {
    showError("error", error.message);
  }
});

async function loadReports() {
  const reports = await getJSON("/api/admin/reports");
  document.getElementById("report-rows").innerHTML = reports.map((report) => `
    <tr>
      <td>${formatDate(report.createdAt)}</td>
      <td>${escapeHtml(theftTypeInEnglish(report.theftType))}</td>
      <td>${escapeHtml(report.thana.nameEn)}</td>
      <td>${escapeHtml(report.gdNumber)}</td>
      <td>${escapeHtml(report.status)}</td>
      <td class="small">${escapeHtml(report.reviewNote || "")}</td>
    </tr>`).join("");
}

// Each thana row has its own inputs and Save button.
async function loadThanas() {
  const thanas = await getThanas();
  document.getElementById("thana-rows").innerHTML = thanas.map((thana) => `
    <tr data-id="${thana._id}">
      <td>${escapeHtml(thana.nameEn)}<br><span class="small text-secondary">${escapeHtml(thana.nameBn)}</span></td>
      <td><input class="form-control form-control-sm thana-address" aria-label="Address of ${escapeHtml(thana.nameEn)}"
                 value="${escapeHtml(thana.address)}"></td>
      <td><input class="form-control form-control-sm thana-phone" aria-label="Phone of ${escapeHtml(thana.nameEn)}"
                 value="${escapeHtml(thana.phone)}"></td>
      <td><button class="btn btn-sm btn-outline-primary">Save</button></td>
    </tr>`).join("");
}

document.getElementById("thana-rows").addEventListener("click", async (event) => {
  // The click can land anywhere in the table. We only care about Save buttons.
  if (!event.target.matches("button")) {
    return;
  }
  const row = event.target.closest("tr");
  const changes = {
    address: row.querySelector(".thana-address").value.trim(),
    phone: row.querySelector(".thana-phone").value.trim(),
  };
  try {
    await putJSON("/api/admin/thanas/" + row.dataset.id, changes);
    showDone("Thana saved.");
  } catch (error) {
    showError("error", error.message);
  }
});

async function startPage() {
  const user = await requireStaff();
  if (!user) {
    return;
  }
  if (user.role !== "admin") {
    location.href = "review.html";
    return;
  }
  await loadStaff();
  await loadReports();
  await loadThanas();
}

startPage().catch((error) => showError("error", error.message));
