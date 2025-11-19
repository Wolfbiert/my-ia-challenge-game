<template>
  <div class="home-container">
    <h1>¡Bienvenido al Desafío de la IA!</h1>

    <div class="difficulty-selection">
      <h2>Selecciona la Dificultad:</h2>
      <div class="difficulty-options">
        <button
          :class="[
            'difficulty-button',
            { active: selectedDifficulty === 'facil' },
          ]"
          @click="selectDifficulty('facil')"
        >
          Fácil
        </button>
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
          <span
            v-if="!unlockedDifficulties.includes('normal')"
            class="lock-icon"
            >🔒</span
          >
        </button>
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
          <span
            v-if="!unlockedDifficulties.includes('dificil')"
            class="lock-icon"
            >🔒</span
          >
        </button>
      </div>
    </div>

    <button @click="startGame" class="start-game-button">
      Comenzar Desafío
    </button>

    <button @click="toggleMusic" class="music-toggle-button">
      {{ isMusicEnabled ? "Desactivar Música" : "Activar Música" }}
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import useAudio from "@/composables/useAudio.js";

export default {
  name: "HomeView",
  setup() {
    const router = useRouter();
    const selectedDifficulty = ref("facil");
    const unlockedDifficulties = ref(["facil"]);
    const { isMusicEnabled, toggleMusic } = useAudio();

    const STORAGE_KEY = "iaChallengeGameProgress";

    const loadProgress = () => {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        try {
          const parsedProgress = JSON.parse(savedProgress);
          if (parsedProgress.unlockedDifficulties) {
            unlockedDifficulties.value = parsedProgress.unlockedDifficulties;
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

    const saveProgress = () => {
      const progress = {
        unlockedDifficulties: unlockedDifficulties.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    };

    const unlockDifficulty = (level) => {
      if (!unlockedDifficulties.value.includes(level)) {
        unlockedDifficulties.value.push(level);
        saveProgress();
      }
    };

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

    const getPreviousDifficulty = (current) => {
      if (current === "normal") return "facil";
      if (current === "dificil") return "normal";
      return null;
    };

    const startGame = () => {
      router.push({
        name: "game",
        query: { difficulty: selectedDifficulty.value },
      });
    };

    // --- Corrección del EventListener ---
    // Definimos el manejador de eventos como una función constante
    // para que la referencia sea la misma al añadir y al remover.
    const handleUnlockEvent = (event) => {
      const levelToUnlock = event.detail.level;
      unlockDifficulty(levelToUnlock);
    };

    onMounted(() => {
      loadProgress();
      window.addEventListener("unlockDifficulty", handleUnlockEvent);
    });

    onUnmounted(() => {
      window.removeEventListener("unlockDifficulty", handleUnlockEvent);
    });
    // ------------------------------------

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
/* Los estilos se mantienen exactamente igual */
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  font-family: "Arial", sans-serif;
  padding: 20px;
}

h1 {
  font-size: 3.5em;
  color: #ffffff;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.difficulty-selection {
  background-color: rgba(0, 0, 0, 0.5);
  padding: 30px 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  margin-bottom: 50px;
  text-align: center;
}

.difficulty-selection h2 {
  font-size: 1.8em;
  color: #ffffff;
  margin-bottom: 25px;
}

.difficulty-options {
  display: flex;
  gap: 25px;
  justify-content: center;
}

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
  position: relative;
}

.difficulty-button:hover:not(:disabled) {
  background-color: #cfe2ff;
  border-color: #007bff;
  color: #0056b3;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 123, 255, 0.2);
}

.difficulty-button.active {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 123, 255, 0.3);
}

.difficulty-button.active:hover {
  background-color: #0056b3;
}

.difficulty-button.locked {
  background-color: #f0f0f0;
  color: #adb5bd;
  border-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.7;
}

.difficulty-button.locked:hover {
  transform: none;
  box-shadow: none;
  background-color: #f0f0f0;
}

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

.start-game-button:hover {
  background-color: rgba(0, 0, 0, 1);
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(255, 255, 255, 0.4);
}

.start-game-button:active {
  transform: translateY(0);
  box-shadow: 0 5px 10px rgba(40, 167, 69, 0.2);
}

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

.music-toggle-button:hover {
  background-color: #5a6268;
}
</style>
