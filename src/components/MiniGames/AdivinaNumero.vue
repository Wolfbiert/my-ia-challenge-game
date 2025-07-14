<template>
  <div class="guess-number-game-container">
    <h2>Adivina el Número</h2>
    <p class="game-message" :class="messageType">{{ message }}</p>
    <p class="attempts-info">Intentos: {{ attempts }} / {{ maxAttempts }}</p>

    <div class="input-section">
      <input
        type="number"
        v-model.number="playerGuess"
        :placeholder="`Ingresa un número entre ${minRange} y ${maxRange}`"
        @keyup.enter="checkGuess"
      />
      <button @click="checkGuess">Adivinar</button>
    </div>

    <button @click="resetGame" class="reset-button">Reiniciar</button>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";

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
    const messageType = ref("info"); // info, success, error, warning
    const attempts = ref(0);
    let maxAttempts = 0; // Dependerá de la dificultad
    let minRange = 0; // Rango mínimo
    let maxRange = 0; // Rango máximo

    // Función para configurar los parámetros del juego según la dificultad
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
          maxAttempts = 8; // Más intentos pero rango más grande
          break;
        default: // Por defecto a normal
          minRange = 1;
          maxRange = 20;
          maxAttempts = 7;
          break;
      }
      initializeGame(); // Reinicia el juego con los nuevos parámetros
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
    };

    const checkGuess = () => {
      if (playerGuess.value === null || playerGuess.value === "") {
        message.value = "Por favor, ingresa un número.";
        messageType.value = "warning";
        return;
      }

      attempts.value++;

      if (parseInt(playerGuess.value) === randomNumber.value) {
        message.value = `¡Felicidades! Adivinaste el número ${randomNumber.value} en ${attempts.value} intentos.`;
        messageType.value = "success";
        emit("round-finished", { winner: "player" });
      } else if (attempts.value >= maxAttempts) {
        message.value = `¡Se acabaron los intentos! El número era ${randomNumber.value}. Perdiste esta ronda.`;
        messageType.value = "error";
        emit("round-finished", { winner: "ia" });
      } else if (parseInt(playerGuess.value) < randomNumber.value) {
        message.value = `El número es mayor. Te quedan ${
          maxAttempts - attempts.value
        } intentos.`;
        messageType.value = "info";
      } else {
        message.value = `El número es menor. Te quedan ${
          maxAttempts - attempts.value
        } intentos.`;
        messageType.value = "info";
      }
      playerGuess.value = null; // Limpiar el input
    };

    const resetGame = () => {
      initializeGame();
    };

    onMounted(() => {
      // Configura los parámetros iniciales de acuerdo a la prop 'difficulty' al montarse
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
      maxAttempts, // Retornar maxAttempts para mostrarlo en el template si quieres
      minRange, // Retornar para mostrar en el template
      maxRange, // Retornar para mostrar en el template
      checkGuess,
      resetGame,
    };
  },
};
</script>

<style scoped>
.adivina-numero-game-container {
  background-color: #f7fef7; /* Fondo más claro para este juego */
  padding: 35px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 550px;
  margin: auto;
  color: #333;
}

h2 {
  color: #28a745; /* Verde vibrante */
  margin-bottom: 20px;
  font-size: 2.2em;
}

.attempts-info {
  font-size: 1.1em;
  color: #666;
  margin-bottom: 15px;
}

.game-message {
  font-size: 1.4em;
  font-weight: bold;
  margin: 25px 0;
  padding: 10px;
  border-radius: 5px;
  background-color: #e0f7fa; /* Default info color */
}

.game-message.info {
  color: #007bff; /* Azul para info */
  background-color: #e0f7fa;
}

.game-message.success {
  color: #28a745; /* Verde para éxito */
  background-color: #d4edda;
}

.game-message.error {
  color: #dc3545; /* Rojo para error */
  background-color: #f8d7da;
}

.game-message.warning {
  color: #ffc107; /* Amarillo para advertencia */
  background-color: #fff3cd;
}

.guess-input-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
}

.guess-input {
  padding: 12px 15px;
  font-size: 1.2em;
  border: 2px solid #ccc;
  border-radius: 8px;
  width: 120px;
  text-align: center;
  outline: none;
  transition: border-color 0.3s ease;
}

.guess-input:focus {
  border-color: #28a745;
}

.guess-button {
  padding: 12px 25px;
  font-size: 1.2em;
  background-color: #28a745; /* Verde vibrante */
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.guess-button:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-2px);
}

.guess-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.guess-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.game-over-section {
  margin-top: 30px;
  font-size: 1.2em;
}

.reset-button {
  padding: 10px 20px;
  font-size: 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s ease;
}

.reset-button:hover {
  background-color: #0056b3;
}
</style>
