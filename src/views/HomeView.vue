<template>
  <!-- Contenedor principal de la pantalla de inicio -->
  <div class="home-container">
    <!-- Título de bienvenida -->
    <h1>¡Bienvenido al Desafío de la IA!</h1>

    <!-- Sección para elegir la dificultad -->
    <div class="difficulty-selection">
      <h2>Selecciona la Dificultad:</h2>

      <!-- Contenedor de los botones de dificultad -->
      <div class="difficulty-options">
        <!-- Botón: Fácil (siempre desbloqueado) -->
        <button
          :class="[
            'difficulty-button',
            { active: selectedDifficulty === 'facil' },
          ]"
          @click="selectDifficulty('facil')"
        >
          Fácil
        </button>

        <!-- Botón: Normal (bloqueado si no está en unlockedDifficulties) -->
        <button
          :class="[
            'difficulty-button',
            {
              active: selectedDifficulty === 'normal',
              locked: !unlockedDifficulties.includes('normal'),
            },
          ]"
          @click="selectDifficulty('normal')"
          :disabled="!unlockedDifficulties.includes('normal')"
        >
          Normal
          <!-- Icono de candado si está bloqueado -->
          <span
            v-if="!unlockedDifficulties.includes('normal')"
            class="lock-icon"
            >🔒</span
          >
        </button>

        <!-- Botón: Difícil (bloqueado si no está en unlockedDifficulties) -->
        <button
          :class="[
            'difficulty-button',
            {
              active: selectedDifficulty === 'dificil',
              locked: !unlockedDifficulties.includes('dificil'),
            },
          ]"
          @click="selectDifficulty('dificil')"
          :disabled="!unlockedDifficulties.includes('dificil')"
        >
          Difícil
          <!-- Icono de candado si está bloqueado -->
          <span
            v-if="!unlockedDifficulties.includes('dificil')"
            class="lock-icon"
            >🔒</span
          >
        </button>
      </div>
    </div>

    <!-- Botón para iniciar el juego -->
    <button @click="startGame" class="start-game-button">
      Comenzar Desafío
    </button>

    <!-- Botón para activar o desactivar la música -->
    <button @click="toggleMusic" class="music-toggle-button">
      {{ isMusicEnabled ? "Desactivar Música" : "Activar Música" }}
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router"; // Para navegar entre vistas
import useAudio from "@/composables/useAudio.js";

export default {
  name: "HomeView",
  setup() {
    /** Instancia del router para cambiar de vista */
    const router = useRouter();

    /** Dificultad seleccionada por el jugador */
    const selectedDifficulty = ref("facil");

    /** Lista de dificultades desbloqueadas */
    const unlockedDifficulties = ref(["facil"]);

    /** Estado y función para controlar la música */
    const { isMusicEnabled, toggleMusic } = useAudio();

    /** Clave usada para guardar/cargar progreso en localStorage */
    const STORAGE_KEY = "iaChallengeGameProgress";

    /**
     * Carga el progreso guardado desde localStorage.
     * Si hay datos corruptos, los elimina.
     */
    const loadProgress = () => {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        try {
          const parsedProgress = JSON.parse(savedProgress);
          if (parsedProgress.unlockedDifficulties) {
            unlockedDifficulties.value = parsedProgress.unlockedDifficulties;

            // Si la dificultad actual no está desbloqueada, volver a "fácil"
            if (
              !unlockedDifficulties.value.includes(selectedDifficulty.value)
            ) {
              selectedDifficulty.value = "facil";
            }
          }
        } catch (e) {
          console.error("Error al parsear el progreso guardado:", e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    /** Guarda el progreso actual en localStorage */
    const saveProgress = () => {
      const progress = {
        unlockedDifficulties: unlockedDifficulties.value,
        // Aquí podrías añadir más datos como puntajes altos
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    };

    /** Desbloquea una dificultad y guarda el progreso */
    const unlockDifficulty = (level) => {
      if (!unlockedDifficulties.value.includes(level)) {
        unlockedDifficulties.value.push(level);
        saveProgress();
      }
    };

    /** Cambia la dificultad seleccionada si está desbloqueada */
    const selectDifficulty = (difficulty) => {
      if (unlockedDifficulties.value.includes(difficulty)) {
        selectedDifficulty.value = difficulty;
      } else {
        alert(
          `¡Tienes que completar el nivel "${getPreviousDifficulty(
            difficulty
          )}" para desbloquear "${difficulty}"!`
        );
      }
    };

    /** Devuelve la dificultad anterior a la actual */
    const getPreviousDifficulty = (current) => {
      if (current === "normal") return "facil";
      if (current === "dificil") return "normal";
      return null; // 'facil' no tiene anterior
    };

    /** Inicia el juego y navega a GameView con la dificultad seleccionada */
    const startGame = () => {
      router.push({
        name: "game",
        query: { difficulty: selectedDifficulty.value },
      });
    };

    /** Al montar: carga progreso y escucha eventos para desbloquear niveles */
    onMounted(() => {
      loadProgress();
      window.addEventListener("unlockDifficulty", (event) => {
        const levelToUnlock = event.detail.level;
        unlockDifficulty(levelToUnlock);
      });
    });

    /** Al desmontar: limpia el listener para evitar fugas de memoria */
    onUnmounted(() => {
      window.removeEventListener("unlockDifficulty", (event) => {
        const levelToUnlock = event.detail.level;
        unlockDifficulty(levelToUnlock);
      });
    });

    return {
      selectedDifficulty,
      unlockedDifficulties,
      selectDifficulty,
      startGame,
      isMusicEnabled,
      toggleMusic,
    };
  },
};
</script>

<style scoped>
/* Contenedor principal de la pantalla de inicio */
.home-container {
  display: flex; /* Distribuye elementos en columna */
  flex-direction: column;
  align-items: center; /* Centra horizontalmente */
  justify-content: center; /* Centra verticalmente */
  min-height: 100vh; /* Ocupa toda la altura de la ventana */
  background-color: rgba(0, 0, 0, 0.5); /* Fondo negro semi-transparente */
  font-family: "Arial", sans-serif;
  padding: 20px;
}

/* Título principal */
h1 {
  font-size: 3.5em;
  color: #ffffff;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

/* Contenedor de selección de dificultad */
.difficulty-selection {
  background-color: rgba(0, 0, 0, 0.5);
  padding: 30px 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  margin-bottom: 50px;
  text-align: center;
}

/* Subtítulo de la sección de dificultad */
.difficulty-selection h2 {
  font-size: 1.8em;
  color: #ffffff;
  margin-bottom: 25px;
}

/* Contenedor de los botones de dificultad */
.difficulty-options {
  display: flex;
  gap: 25px; /* Espacio entre botones */
  justify-content: center;
}

/* Estilo base de los botones de dificultad */
.difficulty-button {
  padding: 15px 30px;
  font-size: 1.2em;
  font-weight: bold;
  border: 3px solid #ced4da;
  border-radius: 10px;
  background-color: #e9ecef;
  color: #495057;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative; /* Necesario para posicionar el icono de candado */
}

/* Efecto hover para botones habilitados */
.difficulty-button:hover:not(:disabled) {
  background-color: #cfe2ff;
  border-color: #007bff;
  color: #0056b3;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 123, 255, 0.2);
}

/* Estado activo (seleccionado) */
.difficulty-button.active {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 123, 255, 0.3);
}

/* Hover sobre botón activo */
.difficulty-button.active:hover {
  background-color: #0056b3;
}

/* Estado bloqueado */
.difficulty-button.locked {
  background-color: #f0f0f0;
  color: #adb5bd;
  border-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Hover en botón bloqueado (sin cambios visuales) */
.difficulty-button.locked:hover {
  transform: none;
  box-shadow: none;
  background-color: #f0f0f0;
}

/* Icono de candado para dificultades bloqueadas */
.lock-icon {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 1.5em;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 5px;
  line-height: 1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Botón para iniciar el juego */
.start-game-button {
  padding: 18px 45px;
  font-size: 1.8em;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 12px 20px rgba(255, 255, 255, 0.4);
  transition: background-color 0.3s ease, transform 0.2s ease,
    box-shadow 0.3s ease;
}

/* Hover en botón de inicio */
.start-game-button:hover {
  background-color: rgba(0, 0, 0, 1);
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(255, 255, 255, 0.4);
}

/* Estado activo (clic) en botón de inicio */
.start-game-button:active {
  transform: translateY(0);
  box-shadow: 0 5px 10px rgba(40, 167, 69, 0.2);
}

/* Botón para activar/desactivar música */
.music-toggle-button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 1em;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* Hover en botón de música */
.music-toggle-button:hover {
  background-color: #5a6268;
}
</style>
