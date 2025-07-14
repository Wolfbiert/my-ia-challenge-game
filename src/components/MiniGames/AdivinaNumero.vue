<template>
  <div class="adivina-numero-game-container">
    <h2>Adivina el Número</h2>
    <p class="attempts-info">Intentos restantes: {{ attemptsLeft }}</p>

    <p class="game-message" :class="messageType">{{ gameMessage }}</p>

    <div class="guess-input-section" v-if="!gameOver">
      <input
        type="number"
        v-model.number="playerGuess"
        :min="minNumber"
        :max="maxNumber"
        placeholder="Introduce tu número"
        @keyup.enter="checkGuess"
        class="guess-input"
      />
      <button
        @click="checkGuess"
        :disabled="attemptsLeft === 0"
        class="guess-button"
      >
        Adivinar
      </button>
    </div>

    <div class="game-over-section" v-if="gameOver">
      <p>
        El número secreto era: <strong>{{ secretNumber }}</strong>
      </p>
      <button @click="resetGame" class="reset-button">Jugar Otra Vez</button>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from "vue";

export default {
  name: "AdivinaNumero", // Nombre del componente

  // La propiedad 'emits' declara los eventos que este componente puede emitir.
  emits: ["round-finished"],

  setup(props, { emit }) {
    // --- Datos del Juego ---
    const secretNumber = ref(0);
    const playerGuess = ref(null);
    const gameMessage = ref("Adivina el número secreto entre 0 y 100.");
    const messageType = ref("info"); // Para aplicar estilos dinámicos (info, success, error)
    const attemptsLeft = ref(7); // Número de intentos
    const maxAttempts = 7; // Total de intentos para reiniciar
    const gameOver = ref(false); // Bandera para saber si el juego ha terminado

    // --- Parámetros del Rango (pueden ser props en el futuro) ---
    const minNumber = 0;
    const maxNumber = 100;

    // --- Lógica del Juego ---
    const generateSecretNumber = () => {
      secretNumber.value =
        Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      console.log("Número secreto (para depuración):", secretNumber.value); // Solo para desarrollo
    };

    const checkGuess = () => {
      if (gameOver.value) return; // No permitir más jugadas si el juego ya terminó

      // Validar entrada del jugador
      if (
        playerGuess.value === null ||
        playerGuess.value < minNumber ||
        playerGuess.value > maxNumber
      ) {
        gameMessage.value = `Por favor, introduce un número válido entre ${minNumber} y ${maxNumber}.`;
        messageType.value = "error";
        return;
      }

      attemptsLeft.value--; // Reduce los intentos restantes

      if (playerGuess.value === secretNumber.value) {
        gameMessage.value = `¡Felicidades! Adivinaste el número ${secretNumber.value}.`;
        messageType.value = "success";
        gameOver.value = true;
        emit("round-finished", { winner: "player" }); // El jugador ganó la ronda
      } else if (attemptsLeft.value === 0) {
        gameMessage.value = `¡Oh no! Se te acabaron los intentos. El número era ${secretNumber.value}.`;
        messageType.value = "error";
        gameOver.value = true;
        emit("round-finished", { winner: "ia" }); // La IA ganó la ronda
      } else if (playerGuess.value < secretNumber.value) {
        gameMessage.value = `El número es más ALTO.`;
        messageType.value = "info";
      } else {
        gameMessage.value = `El número es más BAJO.`;
        messageType.value = "info";
      }

      // Limpiar la entrada después de cada intento
      playerGuess.value = null;
    };

    const resetGame = () => {
      generateSecretNumber();
      playerGuess.value = null;
      gameMessage.value = `Adivina el número secreto entre ${minNumber} y ${maxNumber}.`;
      messageType.value = "info";
      attemptsLeft.value = maxAttempts; // Restablecer intentos
      gameOver.value = false;
    };

    // --- Lifecycle Hook ---
    // Se ejecuta cuando el componente se monta por primera vez.
    onMounted(() => {
      resetGame(); // Genera el primer número secreto al iniciar el juego
    });

    // Opcional: watch para depuración o efectos secundarios
    watch(attemptsLeft, (newValue) => {
      if (newValue <= 2 && newValue > 0 && !gameOver.value) {
        gameMessage.value = `¡Quedan pocos intentos! ${newValue} restantes.`;
        messageType.value = "warning";
      }
    });

    // Se exponen las variables y funciones para que estén disponibles en el template
    return {
      secretNumber,
      playerGuess,
      gameMessage,
      messageType,
      attemptsLeft,
      minNumber,
      maxNumber,
      gameOver,
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
