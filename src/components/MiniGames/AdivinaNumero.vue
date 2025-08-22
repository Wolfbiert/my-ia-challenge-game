<template>
  <div class="guess-number-game-container">
    <h2>Adivina el Número 🔢</h2>

    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
    </div>

    <p class="attempts-info">
      Intentos: {{ attempts }} / {{ currentMaxAttempts }}
    </p>

    <div class="input-section">
      <input
        type="number"
        v-model.number="playerGuess"
        :placeholder="`Ingresa un número entre ${currentMinRange} y ${currentMaxRange}`"
        @keyup.enter="checkGuess"
        :disabled="gameState === 'gameOver'"
      />
      <button @click="checkGuess" :disabled="gameState === 'gameOver'">
        Adivinar
      </button>
    </div>

    <button @click="resetGame" class="reset-button">🔄 Reiniciar</button>

    <div v-if="guessHistory.length > 0" class="guess-history">
      <h3>📜 Historial de Intentos:</h3>
      <ul>
        <li v-for="(item, index) in guessHistory" :key="index">
          <strong>{{ item.guess }}</strong> – {{ item.hint }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from "vue";

export default {
  name: "AdivinaNumero",
  emits: ["round-finished", "update-ia-message"],
  props: {
    difficulty: {
      type: String,
      default: "normal",
      validator: (value) => ["facil", "normal", "dificil"].includes(value),
    },
    aiModifiers: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const randomNumber = ref(0);
    const playerGuess = ref(null);
    const attempts = ref(0);
    const guessHistory = ref([]);
    const gameState = ref("playing");

    const minRangeHint = ref(0);
    const maxRangeHint = ref(0);

    const currentMaxAttempts = ref(0);
    const currentMinRange = ref(0);
    const currentMaxRange = ref(0);

    const invertHintsActive = ref(false);
    const dynamicRangeShiftActive = ref(false);

    const progressWidth = computed(
      () => (attempts.value / currentMaxAttempts.value) * 100
    );

    const setGameParameters = (difficulty, modifiers = {}) => {
      let baseMinRange, baseMaxRange, baseMaxAttempts;

      switch (difficulty) {
        case "facil":
          baseMinRange = 1;
          baseMaxRange = 10;
          baseMaxAttempts = 5;
          break;
        case "normal":
          baseMinRange = 1;
          baseMaxRange = 20;
          baseMaxAttempts = 5;
          break;
        case "dificil":
          baseMinRange = 1;
          baseMaxRange = 30;
          baseMaxAttempts = 6;
          break;
        default:
          baseMinRange = 1;
          baseMaxRange = 20;
          baseMaxAttempts = 7;
          break;
      }

      currentMinRange.value =
        modifiers.minRange !== undefined ? modifiers.minRange : baseMinRange;
      currentMaxRange.value =
        modifiers.maxRange !== undefined ? modifiers.maxRange : baseMaxRange;

      if (currentMinRange.value >= currentMaxRange.value) {
        currentMaxRange.value = currentMinRange.value + 5;
      }

      currentMaxAttempts.value = baseMaxAttempts + (modifiers.maxAttempts || 0);
      if (currentMaxAttempts.value <= 0) {
        currentMaxAttempts.value = 1;
      }

      if (modifiers.narrowRange) {
        const midPoint = Math.floor(
          (currentMinRange.value + currentMaxRange.value) / 2
        );
        const rangeAdjustment = Math.floor(
          (currentMaxRange.value - currentMinRange.value) * 0.15
        );
        currentMinRange.value = Math.max(
          currentMinRange.value,
          midPoint - rangeAdjustment
        );
        currentMaxRange.value = Math.min(
          currentMaxRange.value,
          midPoint + rangeAdjustment
        );
        if (currentMinRange.value >= currentMaxRange.value) {
          currentMaxRange.value = currentMinRange.value + 5;
        }
      }

      invertHintsActive.value = modifiers.invertHints || false;
      dynamicRangeShiftActive.value = modifiers.dynamicRangeShift || false;

      initializeGame();
    };

    const generateRandomNumber = () => {
      randomNumber.value =
        Math.floor(
          Math.random() * (currentMaxRange.value - currentMinRange.value + 1)
        ) + currentMinRange.value;
    };

    const initializeGame = () => {
      generateRandomNumber();
      playerGuess.value = null;
      // EMITIR MENSAJE INICIAL AL ORCHESTATOR
      emit(
        "update-ia-message",
        `Adivina un número entre ${currentMinRange.value} y ${currentMaxRange.value}. Tienes ${currentMaxAttempts.value} intentos.`,
        "normal"
      );
      attempts.value = 0;
      guessHistory.value = [];
      gameState.value = "playing";
      minRangeHint.value = currentMinRange.value;
      maxRangeHint.value = currentMaxRange.value;
    };

    const getHotColdHint = (difference) => {
      const rangeSize = currentMaxRange.value - currentMinRange.value;
      if (difference === 0) return "";
      if (difference <= Math.ceil(rangeSize * 0.05)) return "¡Estás quemando!";
      if (difference <= Math.ceil(rangeSize * 0.15)) return "Caliente.";
      if (difference <= Math.ceil(rangeSize * 0.3)) return "Templado.";
      return "Frío.";
    };

    const checkGuess = () => {
      if (gameState.value === "gameOver") return;

      const guess = parseInt(playerGuess.value);

      if (
        isNaN(guess) ||
        playerGuess.value === null ||
        playerGuess.value === ""
      ) {
        emit(
          "update-ia-message",
          "Por favor, ingresa un número válido.",
          "sad"
        );
        return;
      }

      if (guess < currentMinRange.value || guess > currentMaxRange.value) {
        emit(
          "update-ia-message",
          `El número debe estar entre ${currentMinRange.value} y ${currentMaxRange.value}.`,
          "sad"
        );
        return;
      }

      attempts.value++;
      let hintText = "";
      let isCorrect = false;

      if (guess === randomNumber.value) {
        emit(
          "update-ia-message",
          `¡Felicidades! Adivinaste el número ${randomNumber.value} en ${attempts.value} intentos.`,
          "happy"
        );
        gameState.value = "gameOver";
        emit("round-finished", { winner: "player" });
        hintText = "¡Correcto!";
        isCorrect = true;
      } else if (attempts.value >= currentMaxAttempts.value) {
        emit(
          "update-ia-message",
          `¡Se acabaron los intentos! El número era ${randomNumber.value}.`,
          "angry"
        );
        gameState.value = "gameOver";
        emit("round-finished", { winner: "ia" });
        hintText = "¡Fallaste! Se acabaron los intentos.";
      } else {
        const difference = Math.abs(guess - randomNumber.value);
        const hotColdHint = getHotColdHint(difference);

        let actualHintIsGreater = guess < randomNumber.value;
        let hintToDisplay = actualHintIsGreater;

        if (invertHintsActive.value) {
          hintToDisplay = !actualHintIsGreater;
        }

        if (hintToDisplay) {
          hintText = `Mayor. ${hotColdHint}`;
          emit(
            "update-ia-message",
            `El número es mayor. ${hotColdHint} Te quedan ${
              currentMaxAttempts.value - attempts.value
            } intentos.`,
            "thinking"
          );
          if (actualHintIsGreater && guess >= minRangeHint.value) {
            minRangeHint.value = guess + 1;
          }
        } else {
          hintText = `Menor. ${hotColdHint}`;
          emit(
            "update-ia-message",
            `El número es menor. ${hotColdHint} Te quedan ${
              currentMaxAttempts.value - attempts.value
            } intentos.`,
            "thinking"
          );
          if (!actualHintIsGreater && guess <= maxRangeHint.value) {
            maxRangeHint.value = guess - 1;
          }
        }

        if (dynamicRangeShiftActive.value && !isCorrect) {
          const shiftAmount = Math.floor(Math.random() * 5) + 1;
          if (Math.random() > 0.5) {
            currentMinRange.value += shiftAmount;
            currentMaxRange.value += shiftAmount;
          } else {
            currentMinRange.value -= shiftAmount;
            currentMaxRange.value -= shiftAmount;
          }
          if (currentMinRange.value < 1) currentMinRange.value = 1;
          if (randomNumber.value < currentMinRange.value) {
            randomNumber.value = currentMinRange.value;
          }
          if (randomNumber.value > currentMaxRange.value) {
            randomNumber.value = currentMaxRange.value;
          }
          minRangeHint.value = currentMinRange.value;
          maxRangeHint.value = currentMaxRange.value;
        }
      }

      if (
        !isNaN(guess) &&
        playerGuess.value !== null &&
        playerGuess.value !== ""
      ) {
        guessHistory.value.push({ guess: guess, hint: hintText });
      }

      playerGuess.value = null;
    };

    const resetGame = () => {
      setGameParameters(props.difficulty, props.aiModifiers);
    };

    onMounted(() => {
      setGameParameters(props.difficulty, props.aiModifiers);
    });

    watch(
      () => [props.difficulty, props.aiModifiers],
      ([newDifficulty, newModifiers]) => {
        setGameParameters(newDifficulty, newModifiers);
      },
      { deep: true }
    );

    return {
      playerGuess,
      attempts,
      currentMaxAttempts,
      currentMinRange,
      currentMaxRange,
      guessHistory,
      gameState,
      minRangeHint,
      maxRangeHint,
      checkGuess,
      resetGame,
      progressWidth,
    };
  },
};
</script>

<style scoped>
/* (El CSS se mantiene igual que antes, no hay cambios directos necesarios aquí para los nuevos modificadores) */

.guess-number-game-container {
  /* Eliminamos el max-width para que se expanda */
  /* max-width: 400px; */
  margin: auto;
  padding: 20px;
  border-radius: 10px;
  background-color: #f5f5f5;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-family: "Segoe UI", sans-serif;

  /* NUEVOS AJUSTES PARA EXPANDIR Y CENTRAR CONTENIDO */
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centra verticalmente el contenido */
  align-items: center; /* Centra horizontalmente el contenido */
  box-sizing: border-box; /* Asegura que el padding no cause desbordamiento */
}

h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.game-message {
  font-weight: bold;
  margin-bottom: 10px;
}

.game-message.success {
  color: green;
}

.game-message.error {
  color: red;
}

.game-message.warning {
  color: orange;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  width: 80%; /* Haz que la sección de entrada ocupe la mayor parte del ancho */
}

input[type="number"] {
  flex: 1;
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.reset-button {
  margin-bottom: 15px;
  background-color: #28a745;
}

.guess-history {
  margin-top: 20px;
}

.guess-history ul {
  padding-left: 20px;
}

.progress-bar-container {
  width: 100%;
  height: 12px;
  background-color: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s ease;
}

.attempts-info {
  font-size: 14px;
  margin-bottom: 8px;
  text-align: center;
}
</style>
