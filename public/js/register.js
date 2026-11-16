// register.js: create a victim account. The server logs the new person in straight away.

const registerForm = document.getElementById("register-form");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError("error");

  const account = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value,
  };

  try {
    await postJSON("/api/register", account);
    location.href = "report.html";
  } catch (error) {
    showError("error", error.message);
  }
});
