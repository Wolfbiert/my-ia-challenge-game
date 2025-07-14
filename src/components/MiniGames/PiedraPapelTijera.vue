<template>
  <div class="piedra-papel-tijera-game-container">
    <h2>Piedra, Papel o Tijera</h2>
    <p class="game-message" :class="messageType">{{ gameMessage }}</p>

    <div class="choices-buttons">
      <button @click="playRound('piedra')" :disabled="playerChoice !== null">
        Piedra
      </button>
      <button @click="playRound('papel')" :disabled="playerChoice !== null">
        Papel
      </button>
      <button @click="playRound('tijera')" :disabled="playerChoice !== null">
        Tijera
      </button>
    </div>

    <div v-if="playerChoice" class="round-summary">
      <p>Tú elegiste: {{ playerChoice }}</p>
      <p>La IA eligió: {{ iaChoice }}</p>
      <p class="result" :class="messageType">{{ result }}</p>
    </div>

    <button v-if="result" @click="resetGame" class="reset-button">
      Jugar Otra Ronda
    </button>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";

export default {
  name: "PiedraPapelTijera",
  emits: ["round-finished"],
  props: {
    difficulty: {
      type: String,
      default: "normal",
      validator: (value) => ["facil", "normal", "dificil"].includes(value),
    },
  },
  setup(props, { emit }) {
    const playerChoice = ref(null);
    const iaChoice = ref(null);
    const result = ref("");
    const gameMessage = ref("Elige tu jugada...");
    const messageType = ref("info"); // info, success, error, warning
    const choices = ["piedra", "papel", "tijera"];

    // --- Configuración de IA por Dificultad ---
    let iaPredictionChance = 0; // Probabilidad de que la IA intente predecir la jugada ganadora

    const setGameParameters = (difficulty) => {
      switch (difficulty) {
        case "facil":
          iaPredictionChance = 0; // IA totalmente aleatoria
          break;
        case "normal":
          iaPredictionChance = 0.3; // 30% de probabilidad de "predecir"
          break;
        case "dificil":
          iaPredictionChance = 0.6; // 60% de probabilidad de "predecir"
          break;
        default:
          iaPredictionChance = 0.3; // Por defecto a normal
          break;
      }
      resetGame(); // Reinicia el juego con los nuevos parámetros de dificultad
    };

    const playRound = (choice) => {
      playerChoice.value = choice;
      gameMessage.value = `Tú elegiste: ${choice}...`;

      // Lógica de la IA
      let chosenIaMove;
      const randomNumber = Math.random(); // Número aleatorio entre 0 y 1

      if (randomNumber < iaPredictionChance) {
        // La IA intenta predecir y elegir una jugada ganadora
        // Supone que el jugador elegirá una jugada para perder contra la IA
        if (playerChoice.value === "piedra") {
          chosenIaMove = "papel"; // Papel le gana a piedra
        } else if (playerChoice.value === "papel") {
          chosenIaMove = "tijera"; // Tijera le gana a papel
        } else {
          // playerChoice.value === 'tijera'
          chosenIaMove = "piedra"; // Piedra le gana a tijera
        }
        gameMessage.value += " ¡La IA ha intentado predecir!";
      } else {
        // La IA elige aleatoriamente
        const randomIndex = Math.floor(Math.random() * choices.length);
        chosenIaMove = choices[randomIndex];
        gameMessage.value += " La IA elige...";
      }
      iaChoice.value = chosenIaMove;

      setTimeout(() => {
        let roundWinner;
        if (playerChoice.value === iaChoice.value) {
          result.value = "¡Empate!";
          messageType.value = "info";
          roundWinner = "draw";
        } else if (
          (playerChoice.value === "piedra" && iaChoice.value === "tijera") ||
          (playerChoice.value === "papel" && iaChoice.value === "piedra") ||
          (playerChoice.value === "tijera" && iaChoice.value === "papel")
        ) {
          result.value = "¡Ganaste esta ronda!";
          messageType.value = "success";
          roundWinner = "player";
        } else {
          result.value = "¡Perdiste esta ronda!";
          messageType.value = "error";
          roundWinner = "ia";
        }
        emit("round-finished", { winner: roundWinner });
      }, 1000); // Pequeño retraso para mostrar la elección de la IA
    };

    const resetGame = () => {
      playerChoice.value = null;
      iaChoice.value = null;
      result.value = "";
      gameMessage.value = "Elige tu jugada...";
      messageType.value = "info";
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
      playerChoice,
      iaChoice,
      result,
      gameMessage,
      messageType,
      choices,
      playRound,
      resetGame,
    };
  },
};
</script>

<style scoped>
/* Estilos para el contenedor principal del mini-juego */
.ppt-game-container {
  background-color: #f4f9f4; /* Un fondo suave para el mini-juego */
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px; /* Limita el ancho del juego */
  margin: auto; /* Centra el contenedor en el área del mini-juego */
}

h2 {
  color: #333;
  margin-bottom: 25px;
}

.player-choices {
  display: flex;
  justify-content: center;
  gap: 20px; /* Espacio entre los botones */
  margin-bottom: 30px;
}

.choice-button {
  padding: 15px 30px;
  font-size: 1.2em;
  font-weight: bold;
  border: none;
  border-radius: 50px; /* Botones muy redondeados */
  cursor: pointer;
  background-color: #84d8a1; /* Un verde vibrante */
  color: white;
  text-transform: uppercase;
  transition: background-color 0.3s ease, transform 0.1s ease; /* Para el efecto al hacer hover/active */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.choice-button:hover {
  background-color: #6ac086;
  transform: translateY(-2px); /* Pequeño efecto de "levantar" */
}

.choice-button:active {
  transform: translateY(0); /* Efecto de "presionar" */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-display {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #e6ffe6; /* Fondo ligero para los resultados */
}

.results-display p {
  font-size: 1.1em;
  margin: 10px 0;
  color: #444;
}

.results-display h3 {
  font-size: 1.8em;
  margin-top: 15px;
  color: #28a745; /* Color para el resultado (puedes cambiarlo según el resultado) */
}

.reset-button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 1em;
  background-color: #007bff; /* Azul para reiniciar */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reset-button:hover {
  background-color: #0056b3;
}

.waiting-message {
  font-style: italic;
  color: #777;
}
</style>
