// LIFEQUEST DASHBOARD - LÓGICA COMPLETA CON API

let userData = {
  name: "Usuario",
  email: "usuario@correo.com",
  level: 2,
  xp: 0,
  maxXp: 1000,
  coins: 50,
  mascot: "Loro",
  mascotEmoji: "🦜",
  onboardingCompleted: false,
  inventory: [],
  equipped: { mascot: null, ropa: null, accesorio: null },
  streak: 0,
  completedMissions: 0,
};

let missions = [];
let missionsRaw = [];
let selectedMissionId = null;
let allAchievements = [];
let storeItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  try {
    await Promise.all([
      loadUserData(),
      loadMissions(),
      loadStoreItems(),
      loadAchievements(),
    ]);
  } catch (e) {
    console.error('Error cargando datos:', e);
  }

  updateUI();
  renderMissions();
  renderHomeMissions();
  renderStore();
  renderEvidences();
  initMissionForm();
  renderAchievements();
  resumeGamingSession();
  checkAndUnlockAchievements();
});

// ==========================================
// CARGAR DATOS DESDE LA API
// ==========================================
async function loadUserData() {
  try {
    const user = await apiFetch('/users/me');
    const stats = await apiFetch('/users/stats');

    userData.name = user.NOMBRE + ' ' + user.APELLIDO;
    userData.email = user.CORREO;
    userData.level = stats.nivel || 1;
    userData.xp = user.EXPERIENCIA_TOTAL || 0;
    userData.maxXp = user.EXPERIENCIA_REQUERIDA || 1000;
    userData.coins = user.MONEDAS || 0;
    userData.completedMissions = stats.misionesCompletadas || 0;
    userData.streak = stats.racha || 0;

    try {
      const mascota = await apiFetch('/mascota/favorite');
      if (mascota) {
        userData.mascot = mascota.NOMBRE;
        userData.mascotEmoji = getMascotEmoji(mascota.nombre_catalogo);
      }
    } catch (e) {
      console.error('Error loading mascot:', e);
    }

    const bioDisplay = document.getElementById('bio-display');
    if (bioDisplay) {
      const bio = user.FOTO_PERFIL_URL || '';
      if (bio) {
        bioDisplay.textContent = bio;
        bioDisplay.classList.add('has-content');
        const editInput = document.getElementById('edit-bio');
        if (editInput) editInput.value = bio;
      }
    }

    const profileEmoji = document.getElementById('profile-mascot-emoji');
    if (profileEmoji) profileEmoji.textContent = userData.mascotEmoji;
    const profileMascotName = document.getElementById('profile-mascot-current-name');
    if (profileMascotName) profileMascotName.textContent = userData.mascot || 'Sin mascota';
  } catch (err) {
    console.error('Error loading user data:', err);
    const stored = localStorage.getItem("lifequest_user");
    if (stored) userData = { ...userData, ...JSON.parse(stored) };
  }
}

function getMascotEmoji(name) {
  if (!name) return '🐾';
  const normalized = name.trim().toLowerCase();
  const emojis = { 'panda': '🐼', 'camaleón': '🦎', 'camaleon': '🦎', 'loro': '🦜' };
  return emojis[normalized] || '🐾';
}

async function loadMissions() {
  try {
    const data = await apiFetch('/missions');
    missionsRaw = data;
    missions = data.map(m => {
      const tipoMap = { ESTUDIO: 'estudio', SALUD: 'ejercicio', HABITO: 'sueno', VIDEOJUEGO: 'otro', PERSONAL: 'otro' };
      return {
        id: m.ID_MISION,
        name: m.NOMBRE_MISION,
        type: tipoMap[m.tipo_plantilla] || (m.nombre_plantilla || 'otro').toLowerCase(),
        difficulty: (m.DIFICULTAD || 'MEDIA').toLowerCase(),
        xp: m.EXP_OTORGADA,
        completed: m.estado_progreso === 'COMPLETADA',
        progress: m.PORCENTAJE || 0,
      };
    });
  } catch (err) {
    console.error('Error loading missions:', err);
    missions = [
      { id: 1, name: "Hacer ejercicio 30 min", type: "ejercicio", difficulty: "medio", xp: 50, completed: false },
      { id: 2, name: "Leer 20 páginas", type: "estudio", difficulty: "bajo", xp: 20, completed: true },
    ];
  }
}

async function loadStoreItems() {
  try {
    storeItems = await apiFetch('/store');
  } catch (err) {
    console.error('Error loading store:', err);
    storeItems = [
      { ID_ITEM: 1, NOMBRE: "Sombrero", PRECIO: 50, TIPO: "ropa" },
      { ID_ITEM: 2, NOMBRE: "Gafas Cool", PRECIO: 75, TIPO: "accesorio" },
      { ID_ITEM: 3, NOMBRE: "Mochila", PRECIO: 100, TIPO: "ropa" },
    ];
  }
}

async function loadAchievements() {
  try {
    const data = await apiFetch('/achievements');
    allAchievements = data.map(a => ({
      id: a.id,
      name: a.nombre,
      desc: a.descripcion,
      icon: getAchievementIcon(a.tipoCondicion),
      unlocked: a.unlocked,
    }));
  } catch (err) {
    console.error('Error loading achievements:', err);
    allAchievements = [
      { id: 1, name: "Primeros Pasos", desc: "Completa tu primera misión", icon: "fa-shoe-prints", unlocked: false },
      { id: 2, name: "Gamer Saludable", desc: "Completa una misión gamer", icon: "fa-gamepad", unlocked: false },
      { id: 3, name: "En Ascenso", desc: "Alcanza el nivel 5", icon: "fa-rocket", unlocked: false },
      { id: 4, name: "Imparable", desc: "Mantén una racha de 7 días", icon: "fa-fire", unlocked: false },
    ];
  }
}

function getAchievementIcon(tipo) {
  const icons = {
    'MISIONES': 'fa-shoe-prints', 'VIDEOJUEGOS': 'fa-gamepad',
    'NIVEL': 'fa-rocket', 'RACHA': 'fa-fire',
    'MONEDAS': 'fa-coins', 'HABITOS': 'fa-check-double',
  };
  return icons[tipo] || 'fa-trophy';
}

// ==========================================
// UI
// ==========================================
function updateUI() {
  document.getElementById("user-name").textContent = userData.name;
  document.getElementById("profile-name").textContent = userData.name;
  document.getElementById("user-level").textContent = userData.level;
  document.getElementById("profile-level").textContent = userData.level;
  document.getElementById("current-xp").textContent = userData.xp;
  document.getElementById("max-xp").textContent = userData.maxXp;
  document.getElementById("user-coins").textContent = userData.coins;
  document.getElementById("store-coins").textContent = userData.coins;
  document.getElementById("display-mascot").textContent = userData.mascotEmoji;

  const streakEl = document.getElementById("streak-value");
  if (streakEl) streakEl.textContent = userData.streak;

  const completedEl = document.getElementById("completed-value");
  if (completedEl) completedEl.textContent = userData.completedMissions;

  document.getElementById("profile-name").textContent = userData.name || "Usuario";
  document.getElementById("profile-level").textContent = userData.level || 1;
  document.getElementById("profile-mascot-name").textContent = userData.mascot || "Sin mascota";
  document.getElementById("profile-current-xp").textContent = userData.xp || 0;
  document.getElementById("profile-max-xp").textContent = userData.maxXp || 1000;

  const xpPercentage = (userData.xp / userData.maxXp) * 100;
  document.getElementById("xp-fill").style.width = `${xpPercentage}%`;

  const profileXpPercentage = ((userData.xp || 0) / (userData.maxXp || 1000)) * 100;
  document.getElementById("profile-xp-fill").style.width = `${profileXpPercentage}%`;
}

function switchTab(tabName) {
  if (tabName === "ranking") {
    renderRanking();
  }
  document.querySelectorAll(".content-section").forEach((section) => section.classList.remove("active"));
  document.getElementById(`section-${tabName}`).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
  const tabs = ["inicio", "misiones", "ranking", "tienda", "perfil"];
  const index = tabs.indexOf(tabName);
  if (index !== -1) {
    document.querySelectorAll(".nav-btn")[index].classList.add("active");
  }
}

// ==========================================
// MISIONES
// ==========================================
function renderMissions(filter = "activas") {
  const allList = document.getElementById("all-mission-list");
  allList.innerHTML = "";

  const filteredMissions = missions.filter((mission) => {
    if (filter === "activas") return !mission.completed;
    if (filter === "completadas") return mission.completed;
    return true;
  });

  if (filteredMissions.length === 0) {
    allList.innerHTML = '<p style="text-align: center; color: var(--gray-text); padding: 20px;">No hay misiones</p>';
    return;
  }

  const icons = { estudio: "📚", ejercicio: "💪", sueno: "😴", otro: "🎯" };

  filteredMissions.forEach((mission) => {
    allList.innerHTML += `
      <div class="mission-card ${mission.completed ? "completed" : ""} ${selectedMissionId === mission.id ? "selected" : ""}" onclick="selectMission(${mission.id})">
        <div class="mission-icon ${mission.type}">${icons[mission.type] || "🎯"}</div>
        <div class="mission-details">
          <div class="mission-name">${mission.name}</div>
          <div class="mission-meta">
            <span>${mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}</span>
            <span class="mission-xp">+${mission.xp} XP</span>
          </div>
        </div>
      </div>
    `;
  });
}

function selectMission(id) {
  selectedMissionId = id;
  const activeTab = document.querySelector(".tab-btn.active");
  const filter = activeTab ? activeTab.textContent.toLowerCase() : "activas";
  renderMissions(filter);
}

async function completeSelectedMission() {
  if (!selectedMissionId) {
    showNotification("Selecciona una misión primero", "error");
    return;
  }

  const mission = missions.find((m) => m.id === selectedMissionId);
  if (mission && mission.completed) {
    showNotification("Esta misión ya está completada", "error");
    return;
  }

  openEvidenceModal();
}

function filterMissions(type) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
  renderMissions(type);
}

function renderHomeMissions() {
  const homeList = document.getElementById("home-mission-list");
  if (!homeList) return;

  const activeMissions = missions.filter(m => !m.completed).slice(0, 3);
  const icons = { estudio: "📚", ejercicio: "💪", sueno: "😴", otro: "🎯" };

  if (activeMissions.length === 0) {
    homeList.innerHTML = '<p style="text-align:center;color:var(--gray-text);padding:20px;">No hay misiones activas</p>';
    return;
  }

  homeList.innerHTML = "";
  activeMissions.forEach(mission => {
    homeList.innerHTML += `
      <div class="mission-card" onclick="switchTab('misiones')">
        <div class="mission-icon ${mission.type}">${icons[mission.type] || "🎯"}</div>
        <div class="mission-details">
          <div class="mission-name">${mission.name}</div>
          <div class="mission-meta">
            <span>${mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}</span>
            <span class="mission-xp">+${mission.xp} XP</span>
          </div>
        </div>
      </div>
    `;
  });
}

function openMissionModal() {
  document.getElementById("mission-modal").classList.add("active");
}

function closeMissionModal() {
  document.getElementById("mission-modal").classList.remove("active");
  document.getElementById("mission-form").reset();
}

function initMissionForm() {
  const form = document.getElementById("mission-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("mission-name").value.trim();
      const type = document.getElementById("mission-type").value;
      const difficulty = document.getElementById("mission-difficulty").value;

      const diffMap = { bajo: "FACIL", medio: "MEDIA", alto: "DIFICIL" };

      try {
        const result = await apiFetch('/missions', {
          method: 'POST',
          body: JSON.stringify({
            nombre: name,
            descripcion: `Misión creada por el usuario: ${name}`,
            dificultad: diffMap[difficulty] || "MEDIA",
          }),
        });

        missions.unshift({
          id: result.id,
          name: name,
          type: type,
          difficulty: difficulty,
          xp: result.exp,
          completed: false,
        });

        showNotification("Misión creada", "success");
        closeMissionModal();
        renderMissions("activas");
      } catch (err) {
        showNotification(err.message || "Error al crear misión", "error");
      }
    });
  }
}

// ==========================================
// EVIDENCIAS
// ==========================================
let selectedEvidenceFile = null;

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("evidence-file-input");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedEvidenceFile = file;
        document.getElementById("evidence-file-name").textContent = file.name;
      }
    });
  }
});

function openEvidenceModal() {
  selectedEvidenceFile = null;
  const fileInput = document.getElementById("evidence-file-input");
  if (fileInput) fileInput.value = '';
  const nameEl = document.getElementById("evidence-file-name");
  if (nameEl) nameEl.textContent = "Arrastra una foto o video aquí";
  document.getElementById("evidence-modal").classList.add("active");
}

function closeEvidenceModal() {
  document.getElementById("evidence-modal").classList.remove("active");
  selectedEvidenceFile = null;
  const fileInput = document.getElementById("evidence-file-input");
  if (fileInput) fileInput.value = '';
}

async function uploadEvidence() {
  if (!selectedEvidenceFile) {
    showNotification("Selecciona un archivo primero", "error");
    return;
  }

  if (!selectedMissionId) {
    showNotification("Selecciona una misión primero", "error");
    return;
  }

  const mission = missions.find(m => m.id === selectedMissionId);
  if (!mission) {
    showNotification("Misión no encontrada", "error");
    return;
  }

  if (mission.completed) {
    showNotification("Esta misión ya está completada", "error");
    return;
  }

  const btn = document.getElementById("btn-submit-evidence");
  const originalText = btn.textContent;
  btn.textContent = "Subiendo...";
  btn.disabled = true;

  try {
    const missionData = missionsRaw.find(m => m.ID_MISION === selectedMissionId);
    const progresoId = missionData ? missionData.ID_PROGRESO : null;

    if (!progresoId) {
      const progressData = await apiFetch(`/missions`);
      const found = progressData.find(m => m.ID_MISION === selectedMissionId);
      if (found && found.ID_PROGRESO) {
        await uploadFileAndComplete(selectedEvidenceFile, found.ID_PROGRESO);
      } else {
        throw new Error("No se encontró el progreso de la misión");
      }
    } else {
      await uploadFileAndComplete(selectedEvidenceFile, progresoId);
    }
  } catch (err) {
    showNotification(err.message || "Error al subir evidencia", "error");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function uploadFileAndComplete(file, progresoId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('progresoId', progresoId);

  const token = getToken();
  const res = await fetch('/api/upload/evidence', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const uploadResult = await res.json();
  if (!res.ok) {
    throw new Error(uploadResult.error || 'Error al subir archivo');
  }

  const completeResult = await apiFetch(`/missions/${selectedMissionId}/complete`, {
    method: 'PUT'
  });

  mission = missions.find(m => m.id === selectedMissionId);
  if (mission) {
    mission.completed = true;
  }
  userData.xp = completeResult.xpGanado ? userData.xp + completeResult.xpGanado : userData.xp;
  userData.coins = userData.coins + completeResult.monedasGanadas;

  if (completeResult.levelUp) {
    userData.level++;
    showNotification(`¡Subiste al nivel ${userData.level}!`, "success");
  }

  let msg = `¡Evidencia subida y misión completada! +${completeResult.xpGanado} XP, +${completeResult.monedasGanadas} monedas`;
  if (completeResult.nextMission) {
    msg += ` | Nueva misión: ${completeResult.nextMission.nombre}`;
  }
  showNotification(msg, "success");

  closeEvidenceModal();
  await loadUserData();
  updateUI();
  await loadMissions();
  renderMissions("activas");
  renderHomeMissions();
  renderEvidences();
  selectedMissionId = null;
  verificarLogros();
  checkAndUnlockAchievements();
}

async function renderEvidences() {
  const evidenceList = document.getElementById("evidence-list");
  if (!evidenceList) return;

  try {
    const data = await apiFetch('/evidences');
    evidenceList.innerHTML = "";
    data.forEach((ev) => {
      evidenceList.innerHTML += `
        <div class="evidence-card">
          <div class="evidence-icon"><i class="fas fa-image"></i></div>
          <div class="evidence-info">
            <div class="evidence-name">${ev.NOMBRE_MISION || 'Evidencia'}</div>
            <div class="evidence-date">${ev.FECHA_ENVIO || '-'}</div>
          </div>
          <div class="evidence-status ${ev.ESTADO === 'VALIDADA' ? 'approved' : 'pending'}">${ev.ESTADO === 'VALIDADA' ? 'Aprobada' : 'Pendiente'}</div>
        </div>
      `;
    });
  } catch (err) {
    evidenceList.innerHTML = '<p style="text-align:center; color:var(--gray-text); padding:20px;">Error al cargar evidencias</p>';
  }
}

// ==========================================
// TIENDA
// ==========================================
function renderStore() {
  const storeGrid = document.getElementById("store-items");
  if (!storeGrid) return;
  storeGrid.innerHTML = "";
  storeItems.forEach((item) => {
    storeGrid.innerHTML += `
      <div class="store-item">
        <div class="store-item-icon">${getItemEmoji(item.TIPO)}</div>
        <div class="store-item-name">${item.NOMBRE}</div>
        <div class="store-item-price"><i class="fas fa-coins"></i> ${item.PRECIO}</div>
        <button class="btn-buy" onclick="buyItem(${item.ID_ITEM})">Comprar</button>
      </div>
    `;
  });
}

function getItemEmoji(tipo) {
  const emojis = { 'SOMBRERO': '🎩', 'GAFAS': '🕶️', 'MOCHILA': '🎒', 'ACCESORIO': '💎' };
  return emojis[tipo] || '🎁';
}

async function buyItem(id) {
  const item = storeItems.find((i) => i.ID_ITEM === id);
  if (!item) return;

  if (userData.coins < item.PRECIO) {
    showNotification("No tienes suficientes monedas", "error");
    return;
  }

  try {
    const result = await apiFetch(`/store/buy/${id}`, { method: 'POST' });
    userData.coins = result.user.MONEDAS;
    updateUI();
    showNotification(`¡Compraste ${item.NOMBRE}!`, "success");
  } catch (err) {
    showNotification(err.message || "Error al comprar", "error");
  }
}

// ==========================================
// LOGROS
// ==========================================
function renderAchievements() {
  const grid = document.getElementById("achievements-grid");
  const unlockedCountEl = document.getElementById("unlocked-count");
  const totalCountEl = document.getElementById("total-count");

  if (!grid) return;

  grid.innerHTML = "";
  let unlockedCount = 0;

  allAchievements.forEach((ach) => {
    const cardClass = ach.unlocked ? "unlocked" : "locked";
    const iconClass = ach.unlocked ? ach.icon : "fa-lock";

    grid.innerHTML += `
      <div class="achievement-card ${cardClass}">
        <i class="fas ${iconClass} ach-icon"></i>
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div>
      </div>
    `;

    if (ach.unlocked) unlockedCount++;
  });

  if (unlockedCountEl) unlockedCountEl.textContent = unlockedCount;
  if (totalCountEl) totalCountEl.textContent = allAchievements.length;
}

async function verificarLogros() {
  try {
    const data = await apiFetch('/achievements');
    allAchievements = data.map(a => ({
      id: a.id,
      name: a.nombre,
      desc: a.descripcion,
      icon: getAchievementIcon(a.tipoCondicion),
      unlocked: a.unlocked,
    }));
    renderAchievements();
  } catch (e) {
    console.error('Error verificando logros:', e);
  }
}

// ==========================================
// PERFIL
// ==========================================
let isEditingBio = false;

function toggleBioEdit() {
  isEditingBio = !isEditingBio;
  const display = document.getElementById('bio-display');
  const editArea = document.getElementById('bio-edit-area');
  const editBtn = document.getElementById('btn-edit-bio');
  const saveBtn = document.getElementById('btn-save-bio');

  if (isEditingBio) {
    display.style.display = 'none';
    editArea.style.display = 'block';
    editBtn.style.display = 'none';
    saveBtn.style.display = 'flex';
  } else {
    display.style.display = 'block';
    editArea.style.display = 'none';
    editBtn.style.display = 'flex';
    saveBtn.style.display = 'none';
  }
}

async function saveProfileChanges() {
  const bio = document.getElementById("edit-bio").value.trim();

  if (bio.length > 50) {
    showNotification("La biografía no puede tener más de 50 caracteres", "error");
    return;
  }

  try {
    await apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ FOTO_PERFIL_URL: bio || null }),
    });

    const display = document.getElementById('bio-display');
    if (bio) {
      display.textContent = bio;
      display.classList.add('has-content');
    } else {
      display.textContent = 'Agrega una biografía para tu perfil...';
      display.classList.remove('has-content');
    }

    toggleBioEdit();
    showNotification("Perfil actualizado correctamente", "success");
  } catch (err) {
    showNotification(err.message || "Error al guardar perfil", "error");
  }
}

// ==========================================
// CAMBIAR MASCOTA
// ==========================================
function openMascotChangeModal() {
  document.getElementById("mascot-modal").classList.add("active");
}

function closeMascotChangeModal() {
  document.getElementById("mascot-modal").classList.remove("active");
}

async function changeMascot(catalogId, name, emoji) {
  try {
    await apiFetch('/mascota/adopt', {
      method: 'POST',
      body: JSON.stringify({
        catalogoId: catalogId,
        nombre: name
      }),
    });

    userData.mascot = name;
    userData.mascotEmoji = emoji;

    document.getElementById("display-mascot").textContent = emoji;
    document.getElementById("profile-mascot-name").textContent = name;
    const profileEmoji = document.getElementById("profile-mascot-emoji");
    if (profileEmoji) profileEmoji.textContent = emoji;
    const profileMascotName = document.getElementById("profile-mascot-current-name");
    if (profileMascotName) profileMascotName.textContent = name;

    closeMascotChangeModal();
    showNotification(`¡Tu nueva mascota es ${name}! ${emoji}`, "success");
  } catch (err) {
    showNotification(err.message || "Error al cambiar mascota", "error");
  }
}

// ==========================================
// AUTO-UNLOCK LOGROS
// ==========================================
async function checkAndUnlockAchievements() {
  try {
    const result = await apiFetch('/achievements/check', { method: 'POST' });
    if (result && result.unlocked && result.unlocked.length > 0) {
      for (const ach of result.unlocked) {
        showNotification(`🏆 ¡Logro desbloqueado: ${ach.nombre}!`, "success");
      }
      await verificarLogros();
    }
  } catch (e) {
    console.error('Error checking achievements:', e);
  }
}

// ==========================================
// RANKING
// ==========================================
async function renderRanking() {
  const rankingList = document.getElementById("ranking-list");
  if (!rankingList) return;

  try {
    const ranking = await apiFetch('/ranking');

    const top3 = ranking.slice(0, 3);
    for (let i = 0; i < 3; i++) {
      if (top3[i]) {
        document.getElementById(`podium-${i + 1}-name`).textContent = top3[i].nombre;
        document.getElementById(`podium-${i + 1}-xp`).textContent = `${top3[i].xp} XP`;
      }
    }

    rankingList.innerHTML = "";
    for (let i = 3; i < ranking.length; i++) {
      const user = ranking[i];
      const isCurrent = user.isCurrentUser ? "current-user" : "";

      rankingList.innerHTML += `
        <div class="ranking-item ${isCurrent}">
          <div class="rank-number">#${i + 1}</div>
          <div class="rank-avatar">👤</div>
          <div class="rank-info">
            <span class="rank-name">${user.nombre} ${user.apellido}</span>
            <span class="rank-level">Nivel ${user.nivel}</span>
          </div>
          <div class="rank-xp">${user.xp} XP</div>
        </div>
      `;
    }
  } catch (err) {
    rankingList.innerHTML = '<p style="text-align:center;color:var(--gray-text);padding:20px;">Error al cargar ranking</p>';
  }
}

// ==========================================
// SESIÓN GAMER
// ==========================================
let gamingTimerInterval = null;
let gamingSeconds = 0;
let isGaming = false;
let currentGame = "";
let stretchingMissionActive = false;

function startGamingSession(gameName) {
  if (isGaming) return;

  if (!gameName) {
    gameName = prompt("¿Qué juego vas a jugar?") || "Juego genérico";
  }

  isGaming = true;
  currentGame = gameName;
  gamingSeconds = 0;
  stretchingMissionActive = false;

  document.getElementById("btn-start-gaming").style.display = "none";
  document.getElementById("btn-stop-gaming").style.display = "flex";
  document.getElementById("gaming-status").textContent =
    `Jugando: ${gameName} - ¡Gana XP cada 15 min!`;

  gamingTimerInterval = setInterval(() => {
    gamingSeconds++;
    updateGamingTimerUI();
    checkGamingMilestones();
  }, 1000);
}

function promptGameSelection() {
  if (isGaming) return;
  const gameName = prompt("¿Qué juego vas a jugar?");
  if (gameName) {
    startGamingSession(gameName);
  }
}

function checkGamingMilestones() {
  if (gamingSeconds === 900) {
    userData.xp += 20;
    userData.coins += 10;
    apiFetch('/gaming/session-log', {
      method: 'POST',
      body: JSON.stringify({ minutos: 15 }),
    }).catch(() => {});
    updateUI();
    showNotification(`¡15 min de ${currentGame}! +20 XP, +10 monedas`, "success");
    verificarLogros();
  }

  if (gamingSeconds === 1800) {
    showNotification(`Llevas 30 min jugando ${currentGame}. ¡Toma agua!`, "info");
  }

  if (gamingSeconds === 3600) {
    showNotification("1 hora de juego. Considera descansar pronto.", "error");
  }

  if (gamingSeconds === 7200 && !stretchingMissionActive) {
    stretchingMissionActive = true;
    createStretchingMission();
  }
}

function createStretchingMission() {
  clearInterval(gamingTimerInterval);

  const stretchingMission = {
    id: Date.now(),
    name: `🧘 Descanso activo - ${currentGame}`,
    type: "ejercicio",
    difficulty: "bajo",
    xp: 50,
    completed: false,
    isStretching: true,
  };

  missions.push(stretchingMission);
  showStretchingModal();

  showNotification(
    "¡2 horas de juego! Completa la misión de estiramientos para ganar +50 XP",
    "error",
  );
}

function showStretchingModal() {
  const modal = document.getElementById("evidence-modal");
  const title = modal.querySelector("h3");
  const nameEl = document.getElementById("evidence-file-name");

  title.textContent = "Misión de Estiramientos";
  nameEl.textContent = `Has jugado 2 horas de ${currentGame}. Haz 10 min de estiramientos y sube una foto para ganar +50 XP y continuar.`;

  const submitBtn = document.getElementById("btn-submit-evidence");
  submitBtn.textContent = "Subir Evidencia y Ganar XP";
  submitBtn.onclick = () => submitStretchingEvidence();

  modal.classList.add("active");
}

async function submitStretchingEvidence() {
  const stretchingMission = missions.find((m) => m.isStretching);

  if (stretchingMission) {
    try {
      await apiFetch('/evidences', {
        method: 'POST',
        body: JSON.stringify({
          progresoId: stretchingMission.id,
          urlFoto: 'evidence/stretching_' + Date.now() + '.jpg',
        }),
      });
    } catch (e) {
      console.error('Error subiendo evidencia:', e);
    }

    stretchingMission.completed = true;
  }

  userData.xp += 50;
  userData.coins += 20;
  updateUI();
  closeEvidenceModal();

  showNotification(
    "¡Estiramientos verificados! +50 XP, +20 monedas. ¡Puedes seguir jugando!",
    "success",
  );

  stretchingMissionActive = false;
  gamingSeconds = 0;

  const title = document.getElementById("evidence-modal").querySelector("h3");
  title.textContent = "Subir Evidencia";
  const nameEl = document.getElementById("evidence-file-name");
  if (nameEl) nameEl.textContent = "Arrastra una foto o video aquí";
  const submitBtn = document.getElementById("btn-submit-evidence");
  submitBtn.textContent = "Enviar";
  submitBtn.onclick = uploadEvidence;
}

function stopGamingSession() {
  if (!isGaming) return;

  clearInterval(gamingTimerInterval);
  isGaming = false;

  const totalMinutes = Math.floor(gamingSeconds / 60);

  apiFetch('/gaming/session-log', {
    method: 'POST',
    body: JSON.stringify({ minutos: totalMinutes }),
  }).catch(() => {});

  document.getElementById("btn-start-gaming").style.display = "flex";
  document.getElementById("btn-stop-gaming").style.display = "none";
  document.getElementById("gaming-status").textContent =
    `Sesión finalizada: ${totalMinutes} min jugados`;
  document.getElementById("gaming-timer").textContent = "00:00";

  showNotification(
    `Sesión de ${currentGame} completada. ¡Total: ${totalMinutes} minutos!`,
    "success",
  );
}

function resumeGamingSession() {
  const savedSession = sessionStorage.getItem("gamingSession");
  if (savedSession) {
    const session = JSON.parse(savedSession);
    currentGame = session.game;
    gamingSeconds = session.seconds;
    isGaming = true;

    document.getElementById("btn-start-gaming").style.display = "none";
    document.getElementById("btn-stop-gaming").style.display = "flex";
    document.getElementById("gaming-status").textContent = `Jugando: ${currentGame}`;
    updateGamingTimerUI();

    gamingTimerInterval = setInterval(() => {
      gamingSeconds++;
      updateGamingTimerUI();
      checkGamingMilestones();
      sessionStorage.setItem("gamingSession", JSON.stringify({
        game: currentGame, startTime: Date.now(), seconds: gamingSeconds,
      }));
    }, 1000);
  }
}

function updateGamingTimerUI() {
  const min = Math.floor(gamingSeconds / 60).toString().padStart(2, "0");
  const sec = (gamingSeconds % 60).toString().padStart(2, "0");
  document.getElementById("gaming-timer").textContent = `${min}:${sec}`;
}

// ==========================================
// UTILS
// ==========================================
function logout() {
  if (confirm("¿Cerrar sesión?")) {
    clearToken();
    localStorage.removeItem("lifequest_user");
    sessionStorage.removeItem("gamingSession");
    window.location.href = "index.html";
  }
}

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
