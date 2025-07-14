<template>
  <div class="piedra-papel-tijera-game-container">
    <h2>Piedra, Papel o Tijera</h2>
    <p class="game-message" :class="messageType">{{ gameMessage }}</p>

    <div class="choices-buttons" v-if="!playerChoice">
      <button @click="playRound('piedra')" :disabled="isAITurn">
        <img src="/images/ppt/rock.png" alt="Piedra" class="choice-icon" />
        <span>Piedra</span>
      </button>
      <button @click="playRound('papel')" :disabled="isAITurn">
        <img src="/images/ppt/paper.png" alt="Papel" class="choice-icon" />
        <span>Papel</span>
      </button>
      <button @click="playRound('tijera')" :disabled="isAITurn">
        <img src="/images/ppt/scissors.png" alt="Tijera" class="choice-icon" />
        <span>Tijera</span>
      </button>
    </div>

    <div
      v-if="playerChoice"
      class="versus-section"
      :class="{ 'final-result': showFinalResult }"
    >
      <div
        :class="[
          'player-display',
          { winner: result === 'player', loser: result === 'ia' },
        ]"
      >
        <img
          :src="`/images/ppt/${playerChoice}.png`"
          :alt="playerChoice"
          class="chosen-icon"
        />
        <p>Tú</p>
      </div>

      <div class="vs-text-container">
        <span v-if="!iaChoice" class="thinking-dots">...</span>
        <span v-if="!iaChoice" class="vs-text">IA Pensando...</span>
        <span v-if="iaChoice" class="vs-text">VS</span>
      </div>

      <div
        :class="[
          'ia-display',
          { winner: result === 'ia', loser: result === 'player' },
        ]"
      >
        <img
          v-if="iaChoice"
          :src="`/images/ppt/${iaChoice}.png`"
          :alt="iaChoice"
          class="chosen-icon"
        />
        <img
          v-else
          src="/images/ppt/thinking.gif"
          alt="IA Pensando"
          class="chosen-icon thinking-gif"
        />
        <p>IA</p>
      </div>
    </div>

    <p v-if="showFinalResult" class="result-message" :class="messageType">
      {{ result }}
    </p>

    <button v-if="showFinalResult" @click="resetGame" class="reset-button">
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

    const isAITurn = ref(false); // <--- NUEVA variable para controlar el turno de la IA
    const showFinalResult = ref(false); // <--- NUEVA variable para controlar la visibilidad del resultado final

    // --- Configuración de IA por Dificultad ---
    let iaPredictionChance = 0;
    let iaDecisionDelay = 0; // <--- NUEVO: Retraso de la decisión de la IA

    const setGameParameters = (difficulty) => {
      switch (difficulty) {
        case "facil":
          iaPredictionChance = 0;
          iaDecisionDelay = 1500; // 1.5 segundos
          break;
        case "normal":
          iaPredictionChance = 0.3;
          iaDecisionDelay = 1800; // 1.8 segundos
          break;
        case "dificil":
          iaPredictionChance = 0.6;
          iaDecisionDelay = 2200; // 2.2 segundos (más suspenso)
          break;
        default:
          iaPredictionChance = 0.3;
          iaDecisionDelay = 1800;
          break;
      }
      resetGame();
    };

    const playRound = async (choice) => {
      // <-- Ahora es async
      playerChoice.value = choice;
      gameMessage.value = `Tú elegiste: ${choice}...`;
      isAITurn.value = true; // La IA está pensando, deshabilitar botones
      showFinalResult.value = false; // Ocultar resultado previo

      // Lógica de la IA (ahora con await para el retraso)
      await new Promise((resolve) => setTimeout(resolve, iaDecisionDelay)); // <--- Retraso aquí

      let chosenIaMove;
      const randomNumber = Math.random();

      if (randomNumber < iaPredictionChance) {
        if (playerChoice.value === "piedra") {
          chosenIaMove = "papel";
        } else if (playerChoice.value === "papel") {
          chosenIaMove = "tijera";
        } else {
          chosenIaMove = "piedra";
        }
        gameMessage.value = "¡La IA ha tomado su decisión!";
      } else {
        const randomIndex = Math.floor(Math.random() * choices.length);
        chosenIaMove = choices[randomIndex];
        gameMessage.value = "La IA ha elegido...";
      }
      iaChoice.value = chosenIaMove;

      // Calcular resultado inmediatamente después de que la IA elija
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

      // Pequeño retraso adicional para la animación de "VS" antes de mostrar el resultado final
      await new Promise((resolve) => setTimeout(resolve, 800)); // Espera para que la animación VS se vea

      showFinalResult.value = true; // Mostrar el mensaje de resultado final
      emit("round-finished", { winner: roundWinner });
      isAITurn.value = false; // Habilitar botones si fuera el caso (aunque resetGame los limpia)
    };

    const resetGame = () => {
      playerChoice.value = null;
      iaChoice.value = null;
      result.value = "";
      gameMessage.value = "Elige tu jugada...";
      messageType.value = "info";
      isAITurn.value = false;
      showFinalResult.value = false;
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
      playerChoice,
      iaChoice,
      result,
      gameMessage,
      messageType,
      choices,
      isAITurn, // Exponer para usar en el template
      showFinalResult, // Exponer para usar en el template
      playRound,
      resetGame,
    };
  },
};
</script>

<style scoped>
.piedra-papel-tijera-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f0f8ff; /* Un color suave de fondo */
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  color: #333;
  width: 100%;
  max-width: 600px;
  margin: auto;
  min-height: 400px; /* Asegurar un alto mínimo para el contenido */
  position: relative; /* Para animaciones absolutas si las añades más tarde */
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2.2em;
}

.game-message {
  font-size: 1.3em;
  margin-bottom: 30px;
  min-height: 1.5em; /* Para evitar saltos de contenido */
}

.game-message.info {
  color: #3498db;
}
.game-message.success {
  color: #27ae60;
}
.game-message.error {
  color: #e74c3c;
}
.game-message.warning {
  color: #f39c12;
}

/* Botones de elección */
.choices-buttons {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}

.choices-buttons button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 15px 25px;
  font-size: 1.1em;
  cursor: pointer;
  display: flex;
  flex-direction: column; /* Icono arriba, texto abajo */
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  min-width: 120px; /* Tamaño mínimo para los botones */
}

.choices-buttons button:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.choices-buttons button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.choices-buttons button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.choice-icon {
  width: 60px; /* Tamaño de los iconos */
  height: 60px;
  object-fit: contain;
}

/* Sección de Enfrentamiento (VS) */
.versus-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  width: 100%;
  position: relative; /* Para que los hijos puedan posicionarse absolutos para la animación */
}

.player-display,
.ia-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background-color: #ecf0f1;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 150px; /* Ancho mínimo para las tarjetas */
  transition: transform 0.5s ease-out, opacity 0.5s ease-out; /* Transiciones para ganador/perdedor */
  position: relative; /* Para la animación de "desaparecer" */
}

.player-display.loser,
.ia-display.loser {
  opacity: 0;
  transform: scale(0.5);
}
.player-display.winner,
.ia-display.winner {
  transform: scale(1.1);
  box-shadow: 0 0 20px 5px rgba(46, 204, 113, 0.6); /* Sombra de brillo para el ganador */
}

.chosen-icon {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

.thinking-gif {
  /* Estilos específicos para el GIF de pensar si lo usas */
  border-radius: 50%; /* Si el gif tiene forma cuadrada */
  animation: thinkingPulse 1.5s infinite alternate; /* Animación de pulsación */
}

@keyframes thinkingPulse {
  from {
    opacity: 0.7;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.vs-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  font-weight: bold;
  color: #555;
  min-width: 80px; /* Espacio para el texto VS */
}

.vs-text {
  font-size: 1.2em; /* Ajusta si es muy grande */
  margin-top: 5px; /* Espacio debajo de los puntos de pensar */
}

.thinking-dots {
  font-size: 3em; /* Puntos grandes para "pensando" */
  animation: blink 1s infinite steps(1, end); /* Animación de parpadeo */
}

@keyframes blink {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

.result-message {
  font-size: 2em;
  font-weight: bold;
  margin-top: 30px;
  animation: fadeInScale 0.5s ease-out; /* Animación para el mensaje de resultado */
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-message.success {
  color: #27ae60;
}
.result-message.error {
  color: #e74c3c;
}
.result-message.info {
  color: #3498db;
}

.reset-button {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 25px;
  font-size: 1.1em;
  cursor: pointer;
  margin-top: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.reset-button:hover {
  background-color: #218838;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}
</style>
