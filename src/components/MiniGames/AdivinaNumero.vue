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
import useGameOrchestrator from "@/composables/useGameOrchestrator";

/**
 * @name AdivinaNumero
 * @description Este componente contiene la lógica y el estado para el minijuego "Adivina el Número".
 * Es responsable de generar un número aleatorio basado en la dificultad y los modificadores de la IA,
 * procesar los intentos del jugador, dar retroalimentación y determinar al ganador.
 */
export default {
  name: "AdivinaNumero",
  // Define los eventos personalizados que este componente puede enviar a su padre
  emits: ["round-finished"],
  // Define las propiedades (props) que este componente acepta de su padre
  props: {
    // La dificultad actual del juego
    difficulty: {
      type: String,
      default: "normal",
      validator: (value) => ["facil", "normal", "dificil"].includes(value),
    },
    // Los modificadores activos del orquestador de la IA
    aiModifiers: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    // Importa la función centralizada para manejar mensajes desde el orquestador
    const { handleGameMessage } = useGameOrchestrator();

    // --- Estado Reactivo del Juego ---
    const randomNumber = ref(0); // El número secreto que la IA ha elegido
    const playerGuess = ref(null); // El número ingresado por el jugador en el campo de texto
    const attempts = ref(0); // El número actual de intentos realizados por el jugador
    const guessHistory = ref([]); // Una lista de los intentos previos y las pistas dadas
    const gameState = ref("playing"); // El estado actual del juego ('playing', 'gameOver')

    // Rango de la pista que se muestra al jugador
    const minRangeHint = ref(0);
    const maxRangeHint = ref(0);

    // Parámetros del juego que pueden ser alterados por la dificultad y los modificadores
    const currentMaxAttempts = ref(0);
    const currentMinRange = ref(0);
    const currentMaxRange = ref(0);

    // Banderas para los modificadores activos de la IA
    const invertHintsActive = ref(false);
    const dynamicRangeShiftActive = ref(false);

    /**
     * Propiedad computada que calcula el ancho de la barra de progreso
     * basándose en la cantidad de intentos utilizados.
     */
    const progressWidth = computed(
      () => (attempts.value / currentMaxAttempts.value) * 100
    );

    /**
     * Configura los parámetros del juego (rango, intentos) basándose en la dificultad seleccionada
     * y aplica cualquier modificador de la IA que esté activo.
     * @param {string} difficulty - La dificultad base ('facil', 'normal', 'dificil').
     * @param {object} modifiers - Los modificadores de la IA a aplicar.
     */
    const setGameParameters = (difficulty, modifiers = {}) => {
      let baseMinRange, baseMaxRange, baseMaxAttempts;

      // Establece los valores base según la dificultad
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

    /**
     * Genera un nuevo número secreto aleatorio dentro del rango actual.
     */
    const generateRandomNumber = () => {
      randomNumber.value =
        Math.floor(
          Math.random() * (currentMaxRange.value - currentMinRange.value + 1)
        ) + currentMinRange.value;
    };

    /**
     * Reinicia el estado del juego para comenzar una nueva ronda sin cambiar los parámetros.
     */
    const initializeGame = () => {
      generateRandomNumber();
      playerGuess.value = null;
      attempts.value = 0;
      guessHistory.value = [];
      gameState.value = "playing";
      minRangeHint.value = currentMinRange.value;
      maxRangeHint.value = currentMaxRange.value;
    };

    /**
     * Proporciona una pista de "Frío" o "Caliente" basándose en qué tan cerca está el intento del número secreto.
     * @param {number} difference - La diferencia absoluta entre el intento y el número secreto.
     * @returns {string} El texto de la pista.
     */
    const getHotColdHint = (difference) => {
      const rangeSize = currentMaxRange.value - currentMinRange.value;
      if (difference === 0) return "";
      if (difference <= Math.ceil(rangeSize * 0.05)) return "¡Estás quemando!";
      if (difference <= Math.ceil(rangeSize * 0.15)) return "Caliente.";
      if (difference <= Math.ceil(rangeSize * 0.3)) return "Templado.";
      return "Frío.";
    };

    /**
     * La función principal del bucle de juego. Se llama cuando el jugador envía un intento.
     * Valida la entrada, la compara con el número secreto, proporciona pistas y
     * finaliza el juego si es necesario.
     */
    const checkGuess = () => {
      if (gameState.value === "gameOver") return;

      const guess = parseInt(playerGuess.value);

      // Validación de la entrada
      if (
        isNaN(guess) ||
        playerGuess.value === null ||
        playerGuess.value === ""
      ) {
        handleGameMessage("Por favor, ingresa un número válido.", "sad");
        return;
      }

      if (guess < currentMinRange.value || guess > currentMaxRange.value) {
        handleGameMessage(
          `El número debe estar entre ${currentMinRange.value} y ${currentMaxRange.value}.`,
          "sad"
        );
        return;
      }

      attempts.value++;
      let hintText = "";
      let isCorrect = false;

      if (guess === randomNumber.value) {
        // El jugador gana
        handleGameMessage(
          `¡Felicidades! Adivinaste el número ${randomNumber.value} en ${attempts.value} intentos.`,
          "happy",
          true // Intervención de la IA al ganar
        );
        gameState.value = "gameOver";
        emit("round-finished", { playerScore: 1, iaScore: 0 }); // Emite el resultado al padre
        hintText = "¡Correcto!";
        isCorrect = true;
      } else if (attempts.value >= currentMaxAttempts.value) {
        // El jugador pierde (se quedó sin intentos)
        handleGameMessage(
          `¡Se acabaron los intentos! El número era ${randomNumber.value}.`,
          "angry",
          true // Intervención de la IA al perder
        );
        gameState.value = "gameOver";
        emit("round-finished", { playerScore: 0, iaScore: 1 }); // Emite el resultado al padre
        hintText = "¡Fallaste! Se acabaron los intentos.";
      } else {
        // El juego continúa, se proporciona una pista
        const difference = Math.abs(guess - randomNumber.value);
        const hotColdHint = getHotColdHint(difference);

        let actualHintIsGreater = guess < randomNumber.value;
        let hintToDisplay = actualHintIsGreater;

        // Invierte la pista si el modificador 'invertHints' está activo
        if (invertHintsActive.value) {
          hintToDisplay = !actualHintIsGreater;
        }

        // Actualiza el texto de la pista y el rango visual
        if (hintToDisplay) {
          hintText = `Mayor. ${hotColdHint}`;
          handleGameMessage(
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
          handleGameMessage(
            `El número es menor. ${hotColdHint} Te quedan ${
              currentMaxAttempts.value - attempts.value
            } intentos.`,
            "thinking"
          );
          if (!actualHintIsGreater && guess <= maxRangeHint.value) {
            maxRangeHint.value = guess - 1;
          }
        }

        // Aplica el modificador 'dynamicRangeShift' si está activo
        if (dynamicRangeShiftActive.value && !isCorrect) {
          const shiftAmount = Math.floor(Math.random() * 5) + 1;
          if (Math.random() > 0.5) {
            currentMinRange.value += shiftAmount;
            currentMaxRange.value += shiftAmount;
          } else {
            currentMinRange.value -= shiftAmount;
            currentMaxRange.value -= shiftAmount;
          }
          // Se asegura de que el rango mínimo no sea menor a 1.
          if (currentMinRange.value < 1) currentMinRange.value = 1;

          // Si el número secreto quedó fuera del nuevo rango, se lo ajusta para que siga siendo adivinable.
          if (randomNumber.value < currentMinRange.value) {
            randomNumber.value = currentMinRange.value;
          }
          if (randomNumber.value > currentMaxRange.value) {
            randomNumber.value = currentMaxRange.value;
          }
          // Actualiza las pistas visuales para el jugador con el nuevo rango.
          minRangeHint.value = currentMinRange.value;
          maxRangeHint.value = currentMaxRange.value;
        }
      }

      // Añade el intento actual y su pista resultante al historial
      if (
        !isNaN(guess) &&
        playerGuess.value !== null &&
        playerGuess.value !== ""
      ) {
        guessHistory.value.push({ guess: guess, hint: hintText });
      }

      playerGuess.value = null; // Limpia el campo de entrada para el siguiente intento
    };

    /**
     * Reinicia el juego a su estado inicial, respetando la dificultad y los modificadores actuales.
     */
    const resetGame = () => {
      setGameParameters(props.difficulty, props.aiModifiers);
    };

    /**
     * Hook del ciclo de vida de Vue que se ejecuta cuando el componente se monta por primera vez.
     * Configura los parámetros iniciales del juego.
     */
    onMounted(() => {
      setGameParameters(props.difficulty, props.aiModifiers);
    });

    /**
     * Un observador (watcher) que detecta cambios en las props (dificultad o modificadores)
     * desde el componente padre y reinicia el juego con los nuevos parámetros.
     */
    watch(
      () => [props.difficulty, props.aiModifiers],
      ([newDifficulty, newModifiers]) => {
        setGameParameters(newDifficulty, newModifiers);
      },
      { deep: true } // 'deep' es necesario para detectar cambios dentro del objeto aiModifiers
    );

    // Expone todo el estado y las funciones necesarias para ser usadas en el <template>
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
