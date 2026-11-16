// login.js: send the phone number and password, then go back to the page that asked for a login.

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError("error");

  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;

  try {
    await postJSON("/api/login", { phone, password });
    // "next" is the page that sent the person here, for example login.html?next=report.html
    const next = new URLSearchParams(location.search).get("next");
    // Only go back to one of our own pages, never to another website.
    if (next && /^[a-z-]+\.html$/.test(next)) {
      location.href = next;
    } else {
      location.href = "index.html";
    }
  } catch (error) {
    showError("error", error.message);
  }
});
