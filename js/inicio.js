document.addEventListener("DOMContentLoaded", () => {
  console.log("LifeQuest cargado correctamente");

  if (isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  initNavigation();
  initValidations();
  initCodeInputs();
  initFormSubmissions();
});

function initNavigation() {
  const radios = document.querySelectorAll('input[name="auth-view"]');
  const forms = document.querySelectorAll(".auth-form");

  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      forms.forEach((form) => (form.style.display = ""));
      const targetForm = document.querySelector(
        `.form-${e.target.id.replace("view-", "")}`,
      );
      if (targetForm) {
        targetForm.style.display = "block";
      }
      clearAllErrors();
    });
  });

  const checkedRadio = document.querySelector('input[name="auth-view"]:checked');
  if (checkedRadio) {
    checkedRadio.dispatchEvent(new Event("change"));
  }
}

function initValidations() {
  const inputs = document.querySelectorAll(".input-group input");

  inputs.forEach((input) => {
    input.addEventListener("focus", () => clearError(input));

    input.addEventListener("blur", () => {
      if (input.value.trim() !== "") {
        validateSingleField(input);
      }
    });
  });
}

function validateSingleField(input) {
  const type = input.type;

  if (type === "checkbox") {
    if (!input.checked) {
      showError(input, "Debes aceptar para continuar.");
      return false;
    }
    return true;
  }

  const value = input.value.trim();
  const placeholder = (input.placeholder || "").toLowerCase();

  if (value === "") {
    showError(input, "Este campo es obligatorio.");
    return false;
  }

  if (type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      showError(input, "El correo no es válido (falta @ o .).");
      return false;
    }
  }

  if (type === "password") {
    if (value.length < 8) {
      showError(input, "La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
  }

  if (placeholder.includes("confirmar")) {
    const form = input.closest("form");
    const passInput = form.querySelector(
      'input[type="password"]:not([placeholder*="Confirmar"])',
    );
    if (passInput && value !== passInput.value) {
      showError(input, "Las contraseñas no coinciden.");
      return false;
    }
  }

  clearError(input);
  const group = input.closest(".input-group");
  if (group) group.classList.add("valid");
  return true;
}

function showError(input, message) {
  const group = input.closest(".input-group");
  group.classList.remove("valid");
  group.classList.add("invalid");

  let errorSpan = group.querySelector(".error-message");
  if (!errorSpan) {
    errorSpan = document.createElement("span");
    errorSpan.className = "error-message";
    group.appendChild(errorSpan);
  }
  errorSpan.textContent = message;
}

function clearError(input) {
  const group = input.closest(".input-group");
  if (!group) return;
  group.classList.remove("invalid");
  const errorSpan = group.querySelector(".error-message");
  if (errorSpan) errorSpan.remove();
}

function clearAllErrors() {
  document.querySelectorAll(".input-group").forEach((group) => {
    group.classList.remove("invalid", "valid");
    const errorSpan = group.querySelector(".error-message");
    if (errorSpan) errorSpan.remove();
  });
}

function initCodeInputs() {
  const codeInputs = document.querySelectorAll(".code-digit");
  if (codeInputs.length === 0) return;

  codeInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      if (!/^\d$/.test(e.target.value)) {
        e.target.value = "";
        return;
      }
      if (e.target.value && index < codeInputs.length - 1) {
        codeInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        codeInputs[index - 1].focus();
      }
    });
  });
}

function initFormSubmissions() {
  const loginForm = document.querySelector(".form-login");
  const registerForm = document.querySelector(".form-register");
  const forgotForm = document.querySelector(".form-forgot");
  const codeForm = document.querySelector(".form-code");
  const newpassForm = document.querySelector(".form-newpass");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputs = loginForm.querySelectorAll("input[required]");
      let isValid = true;
      inputs.forEach((input) => {
        if (!validateSingleField(input)) isValid = false;
      });
      if (!isValid) {
        showNotification("Por favor corrige los errores en rojo.", "error");
        return;
      }

      const btn = loginForm.querySelector(".btn-primary");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      btn.disabled = true;

      try {
        const email = loginForm.querySelector('input[type="email"]').value.trim();
        const password = loginForm.querySelector('input[type="password"]').value;
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        setToken(data.token);
        localStorage.setItem("lifequest_user", JSON.stringify(data.user));

        showNotification("¡Datos correctos! Entrando...", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
      } catch (err) {
        showNotification(err.message || "Error al iniciar sesión", "error");
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputs = registerForm.querySelectorAll("input[required]");
      let isValid = true;
      inputs.forEach((input) => {
        if (!validateSingleField(input)) isValid = false;
      });
      if (!isValid) {
        showNotification("Por favor corrige los errores en rojo.", "error");
        return;
      }

      const btn = registerForm.querySelector(".btn-primary");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      btn.disabled = true;

      try {
        const nombre = registerForm.querySelector('input[placeholder*="Nombre"]')?.value.trim() || "";
        const apellido = registerForm.querySelector('input[placeholder*="Apellido"]')?.value.trim() || "";
        const email = registerForm.querySelector('input[type="email"]').value.trim();
        const password = registerForm.querySelector('input[type="password"]').value;

        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ nombre, apellido, email, password })
        });

        setToken(data.token);
        localStorage.setItem("lifequest_user", JSON.stringify(data.user));

        showNotification("¡Registro exitoso! Bienvenido...", "success");
        setTimeout(() => {
          window.location.href = "onboarding.html";
        }, 1000);
      } catch (err) {
        showNotification(err.message || "Error al registrarse", "error");
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showNotification("Código enviado (simulado)", "success");
      setTimeout(() => {
        document.getElementById("view-code").checked = true;
      }, 1000);
    });
  }

  if (codeForm) {
    codeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showNotification("Código verificado", "success");
      setTimeout(() => {
        document.getElementById("view-newpass").checked = true;
      }, 1000);
    });
  }

  if (newpassForm) {
    newpassForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showNotification("Contraseña actualizada", "success");
      setTimeout(() => {
        document.getElementById("view-login").checked = true;
      }, 1000);
    });
  }
}

function showNotification(message, type = "info") {
  if (document.querySelector(".custom-notification")) return;

  const notification = document.createElement("div");
  notification.className = "custom-notification";
  const icon = type === "success" ? "check-circle" : "exclamation-circle";

  notification.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 20px",
    background: type === "success" ? "#4CAF50" : "#f44336",
    color: "white",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    zIndex: "10000",
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "14px",
    fontWeight: "600",
    animation: "slideIn 0.3s ease",
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

if (!document.getElementById("notif-style")) {
  const style = document.createElement("style");
  style.id = "notif-style";
  style.innerHTML = `
    @keyframes slideIn { 
      from { transform: translateX(100%); opacity: 0; } 
      to { transform: translateX(0); opacity: 1; } 
    }
  `;
  document.head.appendChild(style);
}
