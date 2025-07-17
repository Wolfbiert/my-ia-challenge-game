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

    <p class="attempts-info">Intentos: {{ attempts }} / {{ maxAttempts }}</p>

    <div class="input-section">
      <input
        type="number"
        v-model.number="playerGuess"
        :placeholder="`Ingresa un número entre ${minRange} y ${maxRange}`"
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

    let maxAttempts = 0;
    let minRange = 0;
    let maxRange = 0;

    const motivationalPhrases = [
      "¡No te rindas! 💪",
      "¡Sigue intentando! 🔁",
      "¡Tú puedes! ⭐",
      "¡Confía en tu instinto! 👁️",
      "¡El próximo será el correcto! 🎯",
    ];

    const progressWidth = computed(() => (attempts.value / maxAttempts) * 100);

    const setGameParameters = (difficulty) => {
      switch (difficulty) {
        case "facil":
          minRange = 1;
          maxRange = 10;
          maxAttempts = 5;
          break;
        case "normal":
          minRange = 1;
          maxRange = 20;
          maxAttempts = 7;
          break;
        case "dificil":
          minRange = 1;
          maxRange = 30;
          maxAttempts = 8;
          break;
        default:
          minRange = 1;
          maxRange = 20;
          maxAttempts = 7;
          break;
      }
      initializeGame();
    };

    const generateRandomNumber = () => {
      randomNumber.value =
        Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
    };

    const initializeGame = () => {
      generateRandomNumber();
      playerGuess.value = null;
      message.value = `Adivina un número entre ${minRange} y ${maxRange}. Tienes ${maxAttempts} intentos.`;
      messageType.value = "info";
      attempts.value = 0;
      guessHistory.value = [];
      gameState.value = "playing";
      minRangeHint.value = minRange;
      maxRangeHint.value = maxRange;
    };

    const getHotColdHint = (difference, currentMaxRange) => {
      const rangeSize = currentMaxRange - minRange;
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

      if (guess < minRange || guess > maxRange) {
        message.value = `El número debe estar entre ${minRange} y ${maxRange}.`;
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
      } else if (attempts.value >= maxAttempts) {
        message.value = `¡Se acabaron los intentos! El número era ${randomNumber.value}. Perdiste esta ronda.`;
        messageType.value = "error";
        gameState.value = "gameOver";
        emit("round-finished", { winner: "ia" });
        hintText = "¡Fallaste! Se acabaron los intentos.";
      } else {
        const difference = Math.abs(guess - randomNumber.value);
        const hotColdHint = getHotColdHint(difference, maxRange);
        const phrase =
          motivationalPhrases[
            Math.floor(Math.random() * motivationalPhrases.length)
          ];

        if (guess < randomNumber.value) {
          hintText = `Mayor. ${hotColdHint}`;
          message.value = `El número es mayor. ${hotColdHint}<br>${phrase} Te quedan ${
            maxAttempts - attempts.value
          } intentos.`;
          if (guess >= minRangeHint.value) {
            minRangeHint.value = guess + 1;
          }
        } else {
          hintText = `Menor. ${hotColdHint}`;
          message.value = `El número es menor. ${hotColdHint}<br>${phrase} Te quedan ${
            maxAttempts - attempts.value
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
      setGameParameters(props.difficulty);
    };

    onMounted(() => {
      setGameParameters(props.difficulty);
    });

    watch(
      () => props.difficulty,
      (newDifficulty) => {
        setGameParameters(newDifficulty);
      }
    );

    return {
      playerGuess,
      message,
      messageType,
      attempts,
      maxAttempts,
      minRange,
      maxRange,
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
