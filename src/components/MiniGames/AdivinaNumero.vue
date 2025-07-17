<template>
  <div class="guess-number-game-container">
    <h2>Adivina el Número 🔢</h2>

    <p class="game-message" :class="messageType">
      <span v-html="message" />
      <span
        v-if="
          gameState === 'playing' && playerGuess !== null && playerGuess !== ''
        "
      >
        (Estás buscando entre {{ minRangeHint }} y {{ maxRangeHint }})
      </span>
    </p>

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
  emits: ["round-finished"],
  props: {
    difficulty: {
      type: String,
      default: "normal",
      validator: (value) => ["facil", "normal", "dificil"].includes(value),
    },
    // --- NUEVO: Prop para modificadores de la IA ---
    aiModifiers: {
      type: Object,
      default: () => ({}), // Valor por defecto un objeto vacío
    },
  },
  setup(props, { emit }) {
    const randomNumber = ref(0);
    const playerGuess = ref(null);
    const message = ref("");
    const messageType = ref("info");
    const attempts = ref(0);
    const guessHistory = ref([]);
    const gameState = ref("playing");

    const minRangeHint = ref(0);
    const maxRangeHint = ref(0);

    // --- CAMBIO: Estas variables ahora serán reactivas y prefijadas con 'current' ---
    const currentMaxAttempts = ref(0);
    const currentMinRange = ref(0);
    const currentMaxRange = ref(0);

    const motivationalPhrases = [
      "¡No te rindas! 💪",
      "¡Sigue intentando! 🔁",
      "¡Tú puedes! ⭐",
      "¡Confía en tu instinto! 👁️",
      "¡El próximo será el correcto! 🎯",
    ];

    // --- CAMBIO: Usa currentMaxAttempts ---
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
          baseMaxAttempts = 7;
          break;
        case "dificil":
          baseMinRange = 1;
          baseMaxRange = 30;
          baseMaxAttempts = 8;
          break;
        default:
          baseMinRange = 1;
          baseMaxRange = 20;
          baseMaxAttempts = 7;
          break;
      }

      // --- APLICAR MODIFICADORES DE LA IA ---
      currentMinRange.value =
        modifiers.minRange !== undefined ? modifiers.minRange : baseMinRange;
      currentMaxRange.value =
        modifiers.maxRange !== undefined ? modifiers.maxRange : baseMaxRange;

      // Asegúrate de que el rango no se invierta si la IA lo ajusta de forma extraña
      if (currentMinRange.value >= currentMaxRange.value) {
        currentMaxRange.value = currentMinRange.value + 5; // Asegura un rango mínimo de 5
      }

      currentMaxAttempts.value = baseMaxAttempts + (modifiers.maxAttempts || 0);
      // Asegúrate de que los intentos no sean negativos o cero
      if (currentMaxAttempts.value <= 0) {
        currentMaxAttempts.value = 1;
      }

      // Si `narrowRange` es verdadero, ajusta el rango un poco más
      if (modifiers.narrowRange) {
        const midPoint = Math.floor(
          (currentMinRange.value + currentMaxRange.value) / 2
        );
        const rangeAdjustment = Math.floor(
          (currentMaxRange.value - currentMinRange.value) * 0.15
        ); // Reduce el 15% del rango
        currentMinRange.value = Math.max(
          currentMinRange.value,
          midPoint - rangeAdjustment
        );
        currentMaxRange.value = Math.min(
          currentMaxRange.value,
          midPoint + rangeAdjustment
        );
        // Vuelve a verificar que el rango no se invierta
        if (currentMinRange.value >= currentMaxRange.value) {
          currentMaxRange.value = currentMinRange.value + 5;
        }
      }

      initializeGame();
    };

    const generateRandomNumber = () => {
      // --- CAMBIO: Usar currentMinRange y currentMaxRange ---
      randomNumber.value =
        Math.floor(
          Math.random() * (currentMaxRange.value - currentMinRange.value + 1)
        ) + currentMinRange.value;
    };

    const initializeGame = () => {
      generateRandomNumber();
      playerGuess.value = null;
      // --- CAMBIO: Usar currentMinRange, currentMaxRange, currentMaxAttempts ---
      message.value = `Adivina un número entre ${currentMinRange.value} y ${currentMaxRange.value}. Tienes ${currentMaxAttempts.value} intentos.`;
      messageType.value = "info";
      attempts.value = 0;
      guessHistory.value = [];
      gameState.value = "playing";
      // --- CAMBIO: Usar currentMinRange y currentMaxRange para las pistas ---
      minRangeHint.value = currentMinRange.value;
      maxRangeHint.value = currentMaxRange.value;
    };

    const getHotColdHint = (difference) => {
      // Removed currentMaxRange from params, use ref
      const rangeSize = currentMaxRange.value - currentMinRange.value; // Use currentMaxRange.value
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
        message.value = "Por favor, ingresa un número válido.";
        messageType.value = "warning";
        return;
      }

      // --- CAMBIO: Usar currentMinRange y currentMaxRange ---
      if (guess < currentMinRange.value || guess > currentMaxRange.value) {
        message.value = `El número debe estar entre ${currentMinRange.value} y ${currentMaxRange.value}.`;
        messageType.value = "warning";
        return;
      }

      attempts.value++;
      let hintText = "";

      if (guess === randomNumber.value) {
        message.value = `¡Felicidades! Adivinaste el número ${randomNumber.value} en ${attempts.value} intentos.`;
        messageType.value = "success";
        gameState.value = "gameOver";
        emit("round-finished", { winner: "player" });
        hintText = "¡Correcto!";
      } else if (attempts.value >= currentMaxAttempts.value) {
        // --- CAMBIO: Usar currentMaxAttempts ---
        message.value = `¡Se acabaron los intentos! El número era ${randomNumber.value}. Perdiste esta ronda.`;
        messageType.value = "error";
        gameState.value = "gameOver";
        emit("round-finished", { winner: "ia" });
        hintText = "¡Fallaste! Se acabaron los intentos.";
      } else {
        const difference = Math.abs(guess - randomNumber.value);
        // --- CAMBIO: getHotColdHint ya no necesita el argumento maxRange ---
        const hotColdHint = getHotColdHint(difference);
        const phrase =
          motivationalPhrases[
            Math.floor(Math.random() * motivationalPhrases.length)
          ];

        if (guess < randomNumber.value) {
          hintText = `Mayor. ${hotColdHint}`;
          // --- CAMBIO: Usar currentMaxAttempts ---
          message.value = `El número es mayor. ${hotColdHint}<br>${phrase} Te quedan ${
            currentMaxAttempts.value - attempts.value
          } intentos.`;
          if (guess >= minRangeHint.value) {
            minRangeHint.value = guess + 1;
          }
        } else {
          hintText = `Menor. ${hotColdHint}`;
          // --- CAMBIO: Usar currentMaxAttempts ---
          message.value = `El número es menor. ${hotColdHint}<br>${phrase} Te quedan ${
            currentMaxAttempts.value - attempts.value
          } intentos.`;
          if (guess <= maxRangeHint.value) {
            maxRangeHint.value = guess - 1;
          }
        }
        messageType.value = "info";
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
      // --- CAMBIO: Pasar también los aiModifiers ---
      setGameParameters(props.difficulty, props.aiModifiers);
    };

    onMounted(() => {
      // --- CAMBIO: Llamar con props.aiModifiers al inicio ---
      setGameParameters(props.difficulty, props.aiModifiers);
    });

    watch(
      () => [props.difficulty, props.aiModifiers], // Observar ambos props
      ([newDifficulty, newModifiers]) => {
        // Desestructurar para obtener ambos valores
        setGameParameters(newDifficulty, newModifiers);
      },
      { deep: true } // Observar cambios profundos en aiModifiers (ya que es un objeto)
    );

    return {
      playerGuess,
      message,
      messageType,
      attempts,
      // --- CAMBIO: Exponer currentMaxAttempts, currentMinRange, currentMaxRange ---
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
.guess-number-game-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border-radius: 10px;
  background-color: #f5f5f5;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-family: "Segoe UI", sans-serif;
}

h2 {
  text-align: center;
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
