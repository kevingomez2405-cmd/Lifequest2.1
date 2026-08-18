// ==========================================
// LIFEQUEST - ONBOARDING JAVASCRIPT COMPLETO
// ==========================================

let currentStep = 1;
const totalSteps = 9;

let catalogoMascotas = {};

let userData = {
  nombre: "",
  genero: "",
  dia: "",
  mes: "",
  anio: "",
  peso: "",
  altura: "",
  mision: "",
  materia: "",
  ejercicio: "",
  sueño: "",
  dificultad: "",
  numHabitos: "",
  tiempoLibre: "",
  experiencia: "",
  mascota: "Panda",
  mascotaEmoji: "🐼",
  mascotaCatalogId: 1,
  gamingEnabled: false,
  games: [],
  gamingLimit: 120,
};

// ==========================================
// 1. INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  if (!isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }
  populateDateSelectors();
  updateProgress();
  loadCatalogoMascotas();
});

async function loadCatalogoMascotas() {
  try {
    const catalog = await apiFetch('/mascota/catalog');
    catalog.forEach(c => {
      catalogoMascotas[c.NOMBRE] = c.ID_CATALOGO;
    });
    if (catalog.length > 0) {
      userData.mascotaCatalogId = catalog[0].ID_CATALOGO;
    }
  } catch (e) {
    console.error('Error cargando catálogo mascotas:', e);
  }
}

function populateDateSelectors() {
  const diaSelect = document.getElementById("dia");
  const anioSelect = document.getElementById("anio");

  for (let i = 1; i <= 31; i++) {
    const option = document.createElement("option");
    option.value = i.toString().padStart(2, "0");
    option.textContent = i;
    diaSelect.appendChild(option);
  }

  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 10; i >= currentYear - 80; i--) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    anioSelect.appendChild(option);
  }
}

// ==========================================
// 2. NAVEGACIÓN
// ==========================================
function nextStep(step) {
  if (validateCurrentStep()) {
    saveCurrentStepData();
    changeStep(step, "left");
  }
}

function prevStep(step) {
  changeStep(step, "right");
}

function changeStep(newStep, direction) {
  const currentStepEl = document.getElementById(`step-${currentStep}`);
  const newStepEl = document.getElementById(`step-${newStep}`);

  currentStepEl.classList.add(
    direction === "left" ? "exit-left" : "exit-right",
  );

  setTimeout(() => {
    currentStepEl.classList.remove("active", "exit-left", "exit-right");
    newStepEl.classList.add("active");
    currentStep = newStep;
    updateProgress();

    if (currentStep === 5) {
      showSpecificOptions();
    }
    if (currentStep === 9) {
      calculateSummary();
    }
  }, 280);
}

function updateProgress() {
  const percentage = (currentStep / totalSteps) * 100;
  document.getElementById("progress-fill").style.width = `${percentage}%`;
  document.getElementById("current-step-num").textContent = currentStep;
}

// ==========================================
// 3. VALIDACIÓN
// ==========================================
function validateCurrentStep() {
  if (currentStep === 2) {
    const nombre = document.getElementById("nombre").value.trim();
    const genero = document.querySelector('input[name="genero"]:checked');
    if (!nombre) {
      alert("Por favor, ingresa tu nombre.");
      return false;
    }
    if (!genero) {
      alert("Por favor, selecciona cómo te identificas.");
      return false;
    }
  }
  if (currentStep === 3) {
    const dia = document.getElementById("dia").value;
    const mes = document.getElementById("mes").value;
    const anio = document.getElementById("anio").value;
    if (!dia || !mes || !anio) {
      alert("Por favor, completa tu fecha de nacimiento.");
      return false;
    }
  }
  if (currentStep === 4 && !userData.mision) {
    alert("Por favor, selecciona un tipo de misión.");
    return false;
  }
  if (currentStep === 5) {
    if (userData.mision === "Estudiar" && !userData.materia) {
      alert("Por favor, selecciona una materia.");
      return false;
    }
    if (userData.mision === "Ejercicio" && !userData.ejercicio) {
      alert("Por favor, selecciona un tipo de ejercicio.");
      return false;
    }
    if (userData.mision === "Dormir" && !userData.sueño) {
      alert("Por favor, selecciona una opción de sueño.");
      return false;
    }
    if (!userData.dificultad) {
      alert("Por favor, selecciona la dificultad/intensidad.");
      return false;
    }
  }
  if (currentStep === 6) {
    const habitos = document.getElementById("num-habitos").value;
    const tiempo = document.getElementById("tiempo-libre").value;
    const exp = document.getElementById("experiencia").value;
    if (!habitos || !tiempo || !exp) {
      alert("Por favor, completa todos los campos de compromiso.");
      return false;
    }
  }
  if (currentStep === 7 && !userData.mascota) {
    alert("¡Debes elegir una mascota para continuar!");
    return false;
  }
  return true;
}

// ==========================================
// 4. GUARDAR DATOS
// ==========================================
function saveCurrentStepData() {
  if (currentStep === 2) {
    userData.nombre = document.getElementById("nombre").value.trim();
    userData.genero = document.querySelector(
      'input[name="genero"]:checked',
    ).value;
  }
  if (currentStep === 3) {
    userData.dia = document.getElementById("dia").value;
    userData.mes = document.getElementById("mes").value;
    userData.anio = document.getElementById("anio").value;
    userData.peso = document.getElementById("peso").value;
    userData.altura = document.getElementById("altura").value;
  }
  if (currentStep === 6) {
    userData.numHabitos = document.getElementById("num-habitos").value;
    userData.tiempoLibre = document.getElementById("tiempo-libre").value;
    userData.experiencia = document.getElementById("experiencia").value;
  }
  if (currentStep === 8) {
    saveGamingData();
  }
}

// ==========================================
// 5. SELECTORES DE MISIÓN
// ==========================================
function selectMission(card, mission) {
  document
    .querySelectorAll(".mission-card")
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
  userData.mision = mission;
}

function showSpecificOptions() {
  document.getElementById("options-estudiar").style.display = "none";
  document.getElementById("options-ejercicio").style.display = "none";
  document.getElementById("options-dormir").style.display = "none";

  const title = document.getElementById("step5-title");
  const subtitle = document.getElementById("step5-subtitle");

  if (userData.mision === "Estudiar") {
    document.getElementById("options-estudiar").style.display = "block";
    title.textContent = "¿Qué vas a estudiar?";
    subtitle.textContent = "Selecciona la materia y dificultad";
  } else if (userData.mision === "Ejercicio") {
    document.getElementById("options-ejercicio").style.display = "block";
    title.textContent = "¿Qué ejercicio te gustaría hacer?";
    subtitle.textContent = "Selecciona el tipo e intensidad";
  } else if (userData.mision === "Dormir") {
    document.getElementById("options-dormir").style.display = "block";
    title.textContent = "¿Cómo quieres dormir mejor?";
    subtitle.textContent = "Selecciona qué quieres mejorar";
  }
}

function selectSubject(card, subject) {
  document
    .querySelectorAll(".subject-card")
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
  userData.materia = subject;
}

function selectExercise(card, exercise) {
  document
    .querySelectorAll(".exercise-card")
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
  userData.ejercicio = exercise;
}

function selectSleep(card, sleep) {
  document
    .querySelectorAll(".sleep-card")
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
  userData.sueño = sleep;
}

function selectDifficulty(card, difficulty) {
  document
    .querySelectorAll(".difficulty-card")
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
  userData.dificultad = difficulty;
}

// ==========================================
// 6. MASCOTA (ANIMACIÓN CORREGIDA)
// ==========================================
function selectMascot(card, name, emoji, catalogId) {
  document
    .querySelectorAll(".mascot-card")
    .forEach((c) => c.classList.remove("selected"));
  card.classList.add("selected");
  userData.mascota = name;
  userData.mascotaEmoji = emoji;
  if (catalogId) {
    userData.mascotaCatalogId = catalogId;
  } else if (catalogoMascotas[name]) {
    userData.mascotaCatalogId = catalogoMascotas[name];
  }

  const emojiEl = document.getElementById("temp-mascot-emoji");

  emojiEl.classList.add("pop-effect");

  setTimeout(() => {
    emojiEl.textContent = emoji;
  }, 150);

  setTimeout(() => {
    emojiEl.classList.remove("pop-effect");
  }, 350);
}

// ==========================================
// 7. GAMING BALANCE
// ==========================================
function toggleGamingOptions() {
  const checkbox = document.getElementById("gaming-enabled");
  const options = document.getElementById("gaming-options");
  options.style.display = checkbox.checked ? "block" : "none";
}

function saveGamingData() {
  const gamingEnabled = document.getElementById("gaming-enabled").checked;
  if (gamingEnabled) {
    const selectedGames = Array.from(
      document.querySelectorAll('input[name="games"]:checked'),
    ).map((cb) => cb.value);
    userData.gamingEnabled = true;
    userData.games = selectedGames;
    userData.gamingLimit = parseInt(
      document.getElementById("gaming-limit").value,
    );
  } else {
    userData.gamingEnabled = false;
    userData.games = [];
    userData.gamingLimit = 0;
  }
}

// ==========================================
// 8. RESUMEN
// ==========================================
function calculateSummary() {
  document.getElementById("resumen-nombre").textContent =
    userData.nombre || "-";

  let misionText = userData.mision || "-";
  if (userData.mision === "Estudiar" && userData.materia) {
    misionText += ` - ${userData.materia}`;
  } else if (userData.mision === "Ejercicio" && userData.ejercicio) {
    misionText += ` - ${userData.ejercicio}`;
  } else if (userData.mision === "Dormir" && userData.sueño) {
    misionText += ` - ${userData.sueño}`;
  }
  document.getElementById("resumen-mision").textContent = misionText;

  document.getElementById("resumen-dificultad").textContent =
    userData.dificultad || "-";
  document.getElementById("resumen-mascota").textContent =
    userData.mascota || "-";

  let gamingText = "No configurado";
  if (userData.gamingEnabled && userData.games.length > 0) {
    gamingText = `${userData.games.join(", ")} (${userData.gamingLimit} min/día)`;
  }
  document.getElementById("resumen-gaming").textContent = gamingText;
}

// ==========================================
// 9. FINALIZAR - GUARDAR EN API
// ==========================================
async function finishOnboarding() {
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  btn.disabled = true;

  try {
    // 1. Guardar perfil
    const birthYear = parseInt(userData.anio);
    const edad = new Date().getFullYear() - birthYear;
    const tiempoMap = {
      "15": "15_MIN", "30": "30_MIN", "60": "1_HORA",
      "120": "2_HORAS", "180": "MAS_DE_2_HORAS"
    };
    const nivelMap = {
      principiante: "PRINCIPIANTE", basico: "PRINCIPIANTE",
      intermedio: "INTERMEDIO", avanzado: "AVANZADO", experto: "AVANZADO"
    };

    await apiFetch('/profile', {
      method: 'POST',
      body: JSON.stringify({
        edad: edad,
        peso: parseFloat(userData.peso) || 60,
        altura: userData.altura ? (parseFloat(userData.altura) > 10 ? parseFloat(userData.altura) / 100 : parseFloat(userData.altura)) : 1.70,
        objetivo: userData.mision || 'Bienestar general',
        nivelFisico: nivelMap[userData.experiencia] || 'PRINCIPIANTE',
        tiempoDisponible: tiempoMap[userData.tiempoLibre] || '30_MIN',
        condicionFisica: nivelMap[userData.experiencia] || 'PRINCIPIANTE'
      })
    });

    // 2. Adoptar mascota
    await apiFetch('/mascota/adopt', {
      method: 'POST',
      body: JSON.stringify({
        catalogoId: userData.mascotaCatalogId,
        nombre: userData.mascota
      })
    });

    // 3. Crear misión inicial
    let missionName = userData.mision || "Misión inicial";
    if (userData.mision === "Estudiar" && userData.materia) {
      missionName = `Estudiar ${userData.materia}`;
    } else if (userData.mision === "Ejercicio" && userData.ejercicio) {
      missionName = `Ejercicio: ${userData.ejercicio}`;
    } else if (userData.mision === "Dormir" && userData.sueño) {
      missionName = `Dormir mejor: ${userData.sueño}`;
    }

    const dificultadMap = {
      facil: "FACIL", basico: "FACIL",
      medio: "MEDIA", intermedio: "MEDIA",
      dificil: "DIFICIL", avanzado: "DIFICIL"
    };

    const tipoMap = {
      "Estudiar": "ESTUDIO",
      "Ejercicio": "SALUD",
      "Dormir": "HABITO"
    };

    await apiFetch('/missions', {
      method: 'POST',
      body: JSON.stringify({
        nombre: missionName,
        descripcion: `Misión inicial del onboarding - ${missionName}`,
        dificultad: dificultadMap[userData.dificultad] || "MEDIA",
        tipo: tipoMap[userData.mision] || "PERSONAL"
      })
    });

    // 4. Vincular juegos si aplica
    if (userData.gamingEnabled && userData.games.length > 0) {
      try {
        const videojuegos = await apiFetch('/gaming/games');
        for (const gameName of userData.games) {
          const game = videojuegos.find(v =>
            v.NOMBRE.toLowerCase() === gameName.toLowerCase()
          );
          if (game) {
            await apiFetch('/gaming/link', {
              method: 'POST',
              body: JSON.stringify({
                videojuegoId: game.ID_VIDEOJUEGO,
                usuarioJuego: gameName
              })
            });
          }
        }
      } catch (e) {
        console.error('Error vinculando juegos:', e);
      }
    }

    // Guardar datos localmente para la UI del dashboard
    localStorage.setItem("lifequest_user", JSON.stringify({
      name: userData.nombre,
      level: 1, xp: 0, maxXp: 1000, coins: 50,
      mascot: userData.mascota,
      mascotEmoji: userData.mascotaEmoji,
      onboardingCompleted: true,
    }));

    alert(
      `¡Bienvenido ${userData.nombre}! Tu ${userData.mascota} está listo para la aventura.`,
    );
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error('Error guardando onboarding:', err);
    alert('Error al guardar: ' + err.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
