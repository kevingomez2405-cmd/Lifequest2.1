// LIFEQUEST - CONFIGURACIÓN JS

let configData = {
  idioma: 'ESPAÑOL',
  tema: 'CLARO',
  notificaciones: true,
  googleVinculado: false,
};

let userName = '';
let userApellido = '';
let userEmail = '';
let isDirty = false;

document.addEventListener("DOMContentLoaded", async () => {
  if (!isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  await Promise.all([
    loadUserProfile(),
    loadConfig(),
    loadLinkedGames(),
  ]);
});

async function loadUserProfile() {
  try {
    const user = await apiFetch('/users/me');
    userName = user.NOMBRE || '';
    userApellido = user.APELLIDO || '';
    userEmail = user.CORREO || '';

    document.getElementById('cfg-user-name').textContent = userName + ' ' + userApellido;
    document.getElementById('cfg-user-email').textContent = userEmail;
    document.getElementById('cfg-user-level').textContent = 'Nivel ' + (user.FK_ID_NIVEL || 1);
    document.getElementById('cfg-name-value').textContent = userName + ' ' + userApellido;
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

async function loadConfig() {
  try {
    const config = await apiFetch('/config');
    if (config) {
      configData.idioma = config.IDIOMA || 'ESPAÑOL';
      configData.tema = config.TEMA || 'CLARO';
      configData.notificaciones = config.NOTIFICACIONES !== false;
      configData.googleVinculado = config.GOOGLE_VINCULADO === true || config.GOOGLE_VINCULADO === 1;

      document.getElementById('cfg-idioma').value = configData.idioma;
      document.getElementById('cfg-tema').value = configData.tema;
      document.getElementById('cfg-notificaciones').checked = configData.notificaciones;

      const googleBadge = document.getElementById('cfg-google-status');
      if (configData.googleVinculado) {
        googleBadge.textContent = 'Vinculada';
        googleBadge.className = 'status-badge connected';
      } else {
        googleBadge.textContent = 'No vinculada';
        googleBadge.className = 'status-badge disconnected';
      }
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
}

async function loadLinkedGames() {
  const container = document.getElementById('cfg-games-list');
  try {
    const linked = await apiFetch('/gaming/linked');
    if (!linked || linked.length === 0) {
      container.innerHTML = `
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-icon teal"><i class="fas fa-gamepad"></i></div>
            <div class="config-item-text">
              <span class="config-item-label">Sin juegos vinculados</span>
              <span class="config-item-desc">Vincula juegos desde el onboarding o la tienda</span>
            </div>
          </div>
        </div>`;
      return;
    }

    const gameEmojis = {
      'Fortnite': '🎯', 'Free Fire': '🔥', 'League of Legends': '⚔️',
      'Minecraft': '⛏️', 'Roblox': '🧱', 'Valorant': '💥',
    };

    container.innerHTML = '';
    linked.forEach(game => {
      const emoji = gameEmojis[game.nombre_juego] || '🎮';
      container.innerHTML += `
        <div class="config-item">
          <div class="config-item-left">
            <div class="config-item-icon teal"><span style="font-size:18px;">${emoji}</span></div>
            <div class="config-item-text">
              <span class="config-item-label">${game.nombre_juego}</span>
              <span class="config-item-desc">${game.PLATAFORMA || 'Multiplataforma'} · @${game.USUARIO_JUEGO}</span>
            </div>
          </div>
          <div class="config-item-right">
            <span class="status-badge connected">Activo</span>
          </div>
        </div>`;
    });
  } catch (err) {
    container.innerHTML = `
      <div class="config-item">
        <div class="config-item-left">
          <div class="config-item-icon teal"><i class="fas fa-gamepad"></i></div>
          <div class="config-item-text">
            <span class="config-item-label">Sin juegos vinculados</span>
          </div>
        </div>
      </div>`;
  }
}

function markDirty() {
  isDirty = true;
  document.getElementById('btn-save-config').style.display = 'flex';
}

async function saveConfig() {
  const btn = document.getElementById('btn-save-config');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  btn.disabled = true;

  try {
    await apiFetch('/config', {
      method: 'PUT',
      body: JSON.stringify({
        idioma: document.getElementById('cfg-idioma').value,
        tema: document.getElementById('cfg-tema').value,
        notificaciones: document.getElementById('cfg-notificaciones').checked,
      }),
    });

    showNotification('Configuración guardada correctamente', 'success');
    isDirty = false;
    btn.style.display = 'none';
  } catch (err) {
    showNotification(err.message || 'Error al guardar', 'error');
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

// ==========================================
// MODALS
// ==========================================
function openModal(type) {
  if (type === 'name') {
    document.getElementById('input-nombre').value = userName;
    document.getElementById('input-apellido').value = userApellido;
  }
  document.getElementById('modal-' + type).classList.add('active');
}

function closeModal(type) {
  document.getElementById('modal-' + type).classList.remove('active');
}

async function saveName() {
  const nombre = document.getElementById('input-nombre').value.trim();
  const apellido = document.getElementById('input-apellido').value.trim();

  if (!nombre || !apellido) {
    showNotification('Nombre y apellido son obligatorios', 'error');
    return;
  }

  try {
    await apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ NOMBRE: nombre, APELLIDO: apellido }),
    });

    userName = nombre;
    userApellido = apellido;
    document.getElementById('cfg-user-name').textContent = nombre + ' ' + apellido;
    document.getElementById('cfg-name-value').textContent = nombre + ' ' + apellido;

    showNotification('Nombre actualizado', 'success');
    closeModal('name');
  } catch (err) {
    showNotification(err.message || 'Error al actualizar nombre', 'error');
  }
}

async function savePassword() {
  const currentPass = document.getElementById('input-current-pass').value;
  const newPass = document.getElementById('input-new-pass').value;
  const confirmPass = document.getElementById('input-confirm-pass').value;

  if (!currentPass || !newPass || !confirmPass) {
    showNotification('Todos los campos son obligatorios', 'error');
    return;
  }

  if (newPass.length < 8) {
    showNotification('La nueva contraseña debe tener al menos 8 caracteres', 'error');
    return;
  }

  if (newPass !== confirmPass) {
    showNotification('Las contraseñas no coinciden', 'error');
    return;
  }

  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: currentPass,
        newPassword: newPass,
      }),
    });

    showNotification('Contraseña cambiada correctamente', 'success');
    closeModal('password');
    document.getElementById('input-current-pass').value = '';
    document.getElementById('input-new-pass').value = '';
    document.getElementById('input-confirm-pass').value = '';
  } catch (err) {
    showNotification(err.message || 'Error al cambiar contraseña', 'error');
  }
}

async function exportData() {
  try {
    const [user, stats, config, mascotas, missions, achievements, habits] = await Promise.all([
      apiFetch('/users/me').catch(() => null),
      apiFetch('/users/stats').catch(() => null),
      apiFetch('/config').catch(() => null),
      apiFetch('/mascota').catch(() => []),
      apiFetch('/missions').catch(() => []),
      apiFetch('/achievements').catch(() => []),
      apiFetch('/habito').catch(() => []),
    ]);

    const exportObj = {
      exportDate: new Date().toISOString(),
      app: 'LifeQuest 2.0',
      perfil: user,
      estadisticas: stats,
      configuracion: config,
      mascotas: Array.isArray(mascotas) ? mascotas : [],
      misiones: Array.isArray(missions) ? missions : [],
      logros: Array.isArray(achievements) ? achievements : [],
      habitos: Array.isArray(habits) ? habits : [],
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifequest_datos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Datos exportados correctamente', 'success');
    closeModal('export');
  } catch (err) {
    showNotification('Error al exportar datos', 'error');
  }
}

function confirmDelete() {
  showNotification('La eliminación de cuenta no está habilitada aún', 'error');
  closeModal('delete');
}

// ==========================================
// NAVIGATION
// ==========================================
function goBack() {
  if (isDirty) {
    if (confirm('Tienes cambios sin guardar. ¿Deseas salir?')) {
      window.location.href = 'dashboard.html';
    }
  } else {
    window.location.href = 'dashboard.html';
  }
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  const icon = type === "success" ? "check-circle" : "exclamation-circle";
  notification.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
  Object.assign(notification.style, {
    position: "fixed", top: "20px", right: "20px",
    padding: "15px 20px",
    background: type === "success" ? "#4CAF50" : "#f44336",
    color: "white", borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    display: "flex", alignItems: "center", gap: "10px",
    zIndex: "10000", animation: "slideIn 0.3s ease",
  });
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

if (!document.getElementById("notif-style")) {
  const style = document.createElement("style");
  style.id = "notif-style";
  style.innerHTML = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
  document.head.appendChild(style);
}
