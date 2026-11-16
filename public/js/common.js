// common.js: small helpers every page uses, and the navbar.

// The theft types, with English and Bangla names. The server uses the same keys.
const THEFT_TYPES = {
  mobile_snatching: "Mobile snatching / মোবাইল ছিনতাই",
  pickpocketing: "Pickpocketing / পকেটমার",
  bag_snatching: "Bag snatching / ব্যাগ ছিনতাই",
  bicycle_theft: "Bicycle theft / সাইকেল চুরি",
  motorbike_theft: "Motorbike theft / মোটরসাইকেল চুরি",
  vehicle_theft: "Car or CNG theft / গাড়ি বা সিএনজি চুরি",
  vehicle_parts_theft: "Vehicle parts theft / গাড়ির যন্ত্রাংশ চুরি",
  house_burglary: "House burglary / বাসায় চুরি",
  shop_theft: "Shop theft / দোকানে চুরি",
  other: "Other theft / অন্যান্য চুরি",
};

// Only the English half of a theft type, for small spaces like tables.
function theftTypeInEnglish(key) {
  const fullName = THEFT_TYPES[key] || key;
  return fullName.split(" / ")[0];
}

// Ask the server for something. Answers are JSON.
async function getJSON(url) {
  const response = await fetch(url);
  return readAnswer(response);
}

// Send data to the server as JSON.
async function postJSON(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  return readAnswer(response);
}

// The same, for changing something that already exists.
async function putJSON(url, data) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readAnswer(response);
}

// When something is wrong, the server answers { error: "a sentence" }.
// We turn that into an Error, so every page can show it with showError().
async function readAnswer(response) {
  const answer = await response.json();
  if (!response.ok) {
    throw new Error(answer.error || "Something went wrong. Please try again.");
  }
  return answer;
}

// Show a message in a Bootstrap alert box. The box starts hidden with the class d-none.
function showError(elementId, message) {
  const box = document.getElementById(elementId);
  box.textContent = message;
  box.classList.remove("d-none");
}

function hideError(elementId) {
  document.getElementById(elementId).classList.add("d-none");
}

// Text typed by people must never be put in the page as HTML, or it could run code.
// So we change the few characters that mean something in HTML into safe codes.
function escapeHtml(text) {
  if (text === undefined || text === null) {
    return "";
  }
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// Who is logged in? Gives null when nobody is.
async function getCurrentUser() {
  const answer = await getJSON("/api/me");
  return answer.user;
}

// Pages that need a login call this first.
// It gives the user, or sends the visitor to the login page and gives null.
async function requireLogin() {
  const user = await getCurrentUser();
  if (!user) {
    const thisPage = location.pathname.replace("/", "");
    location.href = "login.html?next=" + thisPage;
    return null;
  }
  return user;
}

// Verifier and admin pages call this. Everyone else is sent to the home page.
async function requireStaff() {
  const user = await requireLogin();
  if (!user) {
    return null;
  }
  if (user.role !== "verifier" && user.role !== "admin") {
    location.href = "index.html";
    return null;
  }
  return user;
}

// The thana list does not change during a visit, so we ask the server only once.
let thanaList = null;
async function getThanas() {
  if (thanaList === null) {
    thanaList = await getJSON("/api/thanas");
  }
  return thanaList;
}

// Fill a <select> with the 49 thanas. The server sends them in A to Z order.
async function fillThanaSelect(selectId, firstOptionText) {
  const select = document.getElementById(selectId);
  const thanas = await getThanas();
  select.innerHTML = `<option value="">${firstOptionText}</option>`;
  for (const thana of thanas) {
    select.add(new Option(`${thana.nameEn} / ${thana.nameBn}`, thana._id));
  }
}

function fillTheftTypeSelect(selectId, firstOptionText) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">${firstOptionText}</option>`;
  for (const [key, label] of Object.entries(THEFT_TYPES)) {
    select.add(new Option(label, key));
  }
}
