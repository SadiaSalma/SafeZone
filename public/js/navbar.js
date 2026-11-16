// navbar.js: the blue bar at the top of every page.

// One link in the navbar. The link to the page we are on is shown as active.
function navLink(href, text) {
  const thisPage = location.pathname.split("/").pop() || "index.html";
  let active = "";
  if (href === thisPage) {
    active = "active";
  }
  return `<li class="nav-item"><a class="nav-link ${active}" href="${href}">${text}</a></li>`;
}

// Build the navbar inside <nav id="navbar"></nav>. The links depend on who is logged in.
async function drawNavbar() {
  const nav = document.getElementById("navbar");
  const user = await getCurrentUser();

  let links = navLink("index.html", "Home") + navLink("map.html", "Map")
    + navLink("area.html", "Areas") + navLink("help.html", "Help");
  if (user) {
    links += navLink("report.html", "Report a theft") + navLink("my-reports.html", "My reports");
  }
  if (user && (user.role === "verifier" || user.role === "admin")) {
    links += navLink("review.html", "Review");
  }
  if (user && user.role === "admin") {
    links += navLink("admin.html", "Admin");
  }

  let account = `<a class="btn btn-light btn-sm" href="login.html">Log in</a>`;
  if (user) {
    account = `<span class="navbar-text me-2">${escapeHtml(user.name)}</span>
               <button id="logout-button" class="btn btn-outline-light btn-sm">Log out</button>`;
  }

  nav.className = "navbar navbar-expand-lg navbar-dark bg-primary";
  nav.innerHTML = `
    <div class="container">
      <a class="navbar-brand fw-bold" href="index.html">SafeZone</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav-menu"
              aria-controls="nav-menu" aria-expanded="false" aria-label="Open menu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="nav-menu">
        <ul class="navbar-nav me-auto">${links}</ul>
        <div class="d-flex align-items-center">${account}</div>
      </div>
    </div>`;

  if (user) {
    document.getElementById("logout-button").addEventListener("click", logOut);
  }
}

async function logOut() {
  await postJSON("/api/logout");
  location.href = "index.html";
}

drawNavbar();
