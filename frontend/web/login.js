(() => {
  "use strict";

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const message = document.getElementById("form-message");
  const button = document.getElementById("submit-button");
  const buttonLabel = document.getElementById("button-label");
  const togglePassword = document.getElementById("toggle-password");
  const successPanel = document.getElementById("success-panel");
  const successDetail = document.getElementById("success-detail");
  let accessTokenInMemory = null;

  const config = window.ELIBRARY_CONFIG || {};
  const apiBaseUrl = String(config.apiBaseUrl || "http://localhost:3000/api").replace(/\/+$/, "");

  function clearErrors() {
    emailError.textContent = "";
    passwordError.textContent = "";
    emailInput.removeAttribute("aria-invalid");
    passwordInput.removeAttribute("aria-invalid");
    message.hidden = true;
    message.classList.remove("success");
    successPanel.hidden = true;
  }

  function setFieldError(input, node, text) {
    input.setAttribute("aria-invalid", "true");
    node.textContent = text;
  }

  function setMessage(text, success) {
    message.textContent = text;
    message.hidden = false;
    message.classList.toggle("success", Boolean(success));
  }

  function validForm() {
    let valid = true;
    const email = emailInput.value.trim();
    if (!email) {
      setFieldError(emailInput, emailError, "Email wajib diisi.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(emailInput, emailError, "Masukkan format email yang benar.");
      valid = false;
    }
    if (!passwordInput.value) {
      setFieldError(passwordInput, passwordError, "Kata sandi wajib diisi.");
      valid = false;
    }
    return valid;
  }

  togglePassword.addEventListener("click", () => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    togglePassword.textContent = show ? "Sembunyi" : "Lihat";
    togglePassword.setAttribute("aria-pressed", String(show));
    togglePassword.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  });

  emailInput.addEventListener("input", () => {
    emailInput.removeAttribute("aria-invalid");
    emailError.textContent = "";
  });
  passwordInput.addEventListener("input", () => {
    passwordInput.removeAttribute("aria-invalid");
    passwordError.textContent = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    if (!validForm()) return;

    button.disabled = true;
    buttonLabel.textContent = "Memeriksa...";
    message.hidden = true;

    try {
      const response = await fetch(apiBaseUrl + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        throw new Error("Respons server bukan JSON yang valid.");
      }

      if (!response.ok) {
        const errorText = data && data.error && data.error.message
          ? data.error.message
          : (data && data.message ? data.message : "Login gagal. Periksa email dan kata sandi.");
        throw new Error(errorText);
      }

      if (typeof data.accessToken !== "string" || !data.accessToken) {
        throw new Error("Respons login belum memuat accessToken sesuai kontrak API.");
      }

      // Token sengaja tidak disimpan di localStorage/sessionStorage.
      accessTokenInMemory = data.accessToken;
      passwordInput.value = "";
      const user = data.user && typeof data.user === "object" ? data.user : {};
      const displayName = user.name || user.email || emailInput.value.trim();
      const role = user.role || "belum dikirim server";
      successDetail.textContent = "Pengguna: " + displayName + " · Role: " + role +
        ". Token aktif hanya selama halaman ini terbuka.";
      successPanel.hidden = false;
      setMessage("Autentikasi berhasil.", true);
      form.dataset.authenticated = "true";
    } catch (error) {
      if (error instanceof TypeError) {
        setMessage("Tidak dapat terhubung ke API. Pastikan backend aktif, URL API benar, dan CORS dikonfigurasi.");
      } else {
        setMessage(error && error.message ? error.message : "Terjadi kesalahan saat login.");
      }
    } finally {
      button.disabled = false;
      buttonLabel.textContent = "Masuk";
    }
  });

  // Variabel ini hanya menunjukkan token yang dipegang di memori prototipe.
  // Halaman ini belum menjadi sistem sesi/route guard produksi.
  void accessTokenInMemory;
})();