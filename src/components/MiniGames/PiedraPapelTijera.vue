<template>
  <div class="piedra-papel-tijera-game-container">
    <h2>Piedra, Papel o Tijera</h2>
    <p class="game-message" :class="messageType">{{ gameMessage }}</p>

    <div class="choices-buttons" v-if="gameState === 'playerChoice'">
      <button @click="playRound('rock')">
        <img src="/images/ppt/rock.png" alt="Piedra" class="choice-icon" />
        <span>Piedra</span>
      </button>
      <button @click="playRound('paper')">
        <img src="/images/ppt/paper.png" alt="Papel" class="choice-icon" />
        <span>Papel</span>
      </button>
      <button @click="playRound('scissors')">
        <img src="/images/ppt/scissors.png" alt="Tijera" class="choice-icon" />
        <span>Tijera</span>
      </button>
    </div>

    <div v-if="gameState !== 'playerChoice'" class="versus-section">
      <div
        :class="[
          'player-display',
          {
            winner: result === 'player' && gameState === 'showingResult',
            loser: result === 'ia' && gameState === 'showingResult',
          },
        ]"
      >
        <img
          :src="`/images/ppt/${playerChoice}.png`"
          :alt="playerChoice"
          class="chosen-icon"
        />
        <p>Tú</p>
        <img
          v-if="showExplosion && result === 'ia'"
          src="/images/ppt/explosion.gif"
          alt="Explosión"
          class="explosion-gif player-explosion"
        />
      </div>

      <div class="vs-text-container">
        <template v-if="gameState === 'iaThinking'">
          <img
            src="/images/ppt/thinking.gif"
            alt="IA Pensando"
            class="thinking-gif"
          />
          <span class="vs-text">IA Pensando...</span>
          <span class="thinking-dots">...</span>
        </template>
        <span v-else-if="iaChoice" class="vs-text big-vs">VS</span>
      </div>

      <div
        :class="[
          'ia-display',
          {
            winner: result === 'ia' && gameState === 'showingResult',
            loser: result === 'player' && gameState === 'showingResult',
          },
        ]"
      >
        <img
          v-if="gameState === 'iaThinking' && iaThinkingDisplayChoice"
          :src="`/images/ppt/${iaThinkingDisplayChoice}.png`"
          alt="Elección IA"
          class="chosen-icon iterating-icon"
        />
        <img
          v-else-if="
            gameState === 'iaChosen' ||
            gameState === 'showingResult' ||
            gameState === 'roundOver'
          "
          :src="`/images/ppt/${iaChoice}.png`"
          :alt="iaChoice"
          class="chosen-icon"
          :class="{ 'ia-chosen-animation': iaHasChosen }"
        />
        <p>IA</p>
        <img
          v-if="showExplosion && result === 'player'"
          src="/images/ppt/explosion.gif"
          alt="Explosión"
          class="explosion-gif ia-explosion"
        />
      </div>
    </div>

    <p
      v-if="gameState === 'roundOver'"
      class="result-message"
      :class="messageType"
    >
      {{ result }}
    </p>

    <button
      v-if="gameState === 'roundOver'"
      @click="resetGame"
      class="reset-button"
    >
      Jugar Otra Ronda
    </button>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";

// Vamos a importar una función para reproducir sonidos
import { Howl } from "howler"; // Asume que ya tienes Howler.js instalado.
// Si no, lo instalas: npm install howler

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
    const choices = ["rock", "paper", "scissors"]; // Asegúrate de que coincida con tus nombres de archivo PNG

    // --- NUEVOS ESTADOS PARA LA SECUENCIA ---
    const gameState = ref("playerChoice"); // 'playerChoice', 'iaThinking', 'iaChosen', 'showingResult', 'roundOver'
    const iaThinkingDisplayChoice = ref(null); // Para iterar los PNGs mientras la IA "piensa"
    let iaThinkingInterval = null; // Para el ID del setInterval
    const iaHasChosen = ref(false); // Para la animación de la elección final de la IA
    const showExplosion = ref(false); // Para controlar el GIF de explosión
    const explosionSound = new Howl({
      src: ["/sounds/explosion.mp3"], // Ruta a tu archivo de sonido de explosión
      volume: 0.5,
    });

    // --- Configuración de IA por Dificultad ---
    let iaPredictionChance = 0;
    let iaThinkingDuration = 0; // Duración total de la fase de pensamiento de la IA

    const setGameParameters = (difficulty) => {
      switch (difficulty) {
        case "facil":
          iaPredictionChance = 0;
          iaThinkingDuration = 2500; // Antes 1800ms, ahora 2.5 segundos
          break;
        case "normal":
          iaPredictionChance = 0.3;
          iaThinkingDuration = 3500; // Antes 2500ms, ahora 3.5 segundos
          break;
        case "dificil":
          iaPredictionChance = 0.6;
          iaThinkingDuration = 4000; // Antes 3000ms, ahora 4.0 segundos
          break;
        default:
          iaPredictionChance = 0.3;
          iaThinkingDuration = 3500;
          break;
      }
      resetGame();
    };

    const playRound = async (choice) => {
      playerChoice.value = choice;
      gameMessage.value = `Tú elegiste: ${choice}...`;
      gameState.value = "iaThinking";
      showExplosion.value = false; // Resetear al inicio de la ronda
      iaHasChosen.value = false; // Asegurar que esto se resetee también

      // 1. Fase de "IA Pensando"
      let currentChoiceIndex = 0;
      iaThinkingInterval = setInterval(() => {
        iaThinkingDisplayChoice.value = choices[currentChoiceIndex];
        currentChoiceIndex = (currentChoiceIndex + 1) % choices.length;
      }, 150);
      await new Promise((resolve) => setTimeout(resolve, iaThinkingDuration));
      clearInterval(iaThinkingInterval);

      // Lógica de la IA para elegir
      let chosenIaMove;
      const randomNumber = Math.random();
      if (randomNumber < iaPredictionChance) {
        if (playerChoice.value === "rock") {
          chosenIaMove = "paper";
        } else if (playerChoice.value === "paper") {
          chosenIaMove = "scissors";
        } else {
          chosenIaMove = "rock";
        }
        gameMessage.value = "¡La IA ha tomado su decisión!";
      } else {
        const randomIndex = Math.floor(Math.random() * choices.length);
        chosenIaMove = choices[randomIndex];
        gameMessage.value = "La IA ha elegido...";
      }
      iaChoice.value = chosenIaMove;
      iaThinkingDisplayChoice.value = chosenIaMove;

      // 2. Fase "IA Elegida"
      gameState.value = "iaChosen";
      iaHasChosen.value = true;
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 3. Calcular resultado
      let roundWinner;
      if (playerChoice.value === iaChoice.value) {
        result.value = "¡Empate!";
        messageType.value = "info";
        roundWinner = "draw";
      } else if (
        (playerChoice.value === "rock" && iaChoice.value === "scissors") ||
        (playerChoice.value === "paper" && iaChoice.value === "rock") ||
        (playerChoice.value === "scissors" && iaChoice.value === "paper")
      ) {
        result.value = "¡Ganaste esta ronda!";
        messageType.value = "success";
        roundWinner = "player";
      } else {
        result.value = "¡Perdiste esta ronda!";
        messageType.value = "error";
        roundWinner = "ia";
      }

      // --- VERIFICACIÓN Y ACTIVACIÓN DE LA EXPLOSIÓN ---
      console.log(
        `Resultado calculado: ${roundWinner}, Jugador elegido: ${playerChoice.value}, IA elegido: ${iaChoice.value}`
      ); // DEBUG
      console.log(`¿Debería haber explosión? ${roundWinner !== "draw"}`); // DEBUG

      if (roundWinner !== "draw") {
        // Establecer el valor de 'result' antes de activar showExplosion
        // para que la condición del v-if se cumpla (result === 'ia' o result === 'player')
        // ya que el v-if del GIF usa 'result'

        showExplosion.value = true; // <-- ¡Esto activa la variable!
        explosionSound.play(); // Reproducir sonido de explosión

        console.log(
          `showExplosion.value justo antes de mostrar gif: ${showExplosion.value}`
        ); // DEBUG
      }

      // Fase de "Mostrando Resultado"
      // Ahora aplicamos el 'gameState' para que se activen las clases 'winner'/'loser'
      // Esto debería ocurrir *después* de que showExplosion.value ya sea true.
      gameState.value = "showingResult";

      // Dale tiempo al GIF y a las animaciones CSS para que se muestren.
      // 1.5 segundos es un buen tiempo para ver la explosión antes de pasar a la siguiente ronda.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 5. Transición al estado de fin de ronda
      gameState.value = "roundOver";
      emit("round-finished", { winner: roundWinner });
    };

    const resetGame = () => {
      playerChoice.value = null;
      iaChoice.value = null;
      result.value = "";
      gameMessage.value = "Elige tu jugada...";
      messageType.value = "info";
      gameState.value = "playerChoice";
      iaThinkingDisplayChoice.value = null;
      iaHasChosen.value = false;
      showExplosion.value = false; // Asegurar que se resetee
      if (iaThinkingInterval) {
        clearInterval(iaThinkingInterval);
        iaThinkingInterval = null;
      }
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
      gameState, // Exponer el nuevo estado global del juego
      iaThinkingDisplayChoice, // Exponer para la iteración de la IA
      iaHasChosen, // Exponer para la animación de la elección de la IA
      showExplosion, // Exponer para el GIF de explosión
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
  background-color: #f0f8ff;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  color: #333;
  width: 100%;
  max-width: 600px;
  margin: auto;
  min-height: 450px; /* Un poco más de alto para las animaciones */
  position: relative;
  overflow: hidden; /* Para contener las explosiones si se salen */
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2.2em;
}

.game-message {
  font-size: 1.3em;
  margin-bottom: 30px;
  min-height: 1.5em;
  text-align: center;
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
  justify-content: center;
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
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}

.choices-buttons button:hover {
  background-color: #2980b9;
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.choice-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

/* Sección de Enfrentamiento (VS) */
.versus-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px; /* Aumentado de 20px a 60px para más espacio */
  margin-top: 20px;
  width: 100%;
  position: relative;
  min-height: 180px;
  overflow: hidden;
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
  min-width: 150px;
  transition: transform 0.5s ease-out, opacity 0.5s ease-out,
    box-shadow 0.3s ease;
  position: relative;
  z-index: 1;
}

/* Animación de entrada para el icono de la IA cuando ya ha elegido */
.ia-chosen-animation {
  animation: iaEnter 0.4s ease-out forwards;
}
@keyframes iaEnter {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Para el icono que itera mientras la IA piensa */
.iterating-icon {
  animation: popIn 0.2s ease-out; /* Una pequeña animación al cambiar */
}
@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0.5;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Clases para ganador/perdedor (se activan en gameState 'showingResult') */
.player-display.loser,
.ia-display.loser {
  /*opacity: 1; */
  transform: scale(0.5) translateY(20px);
}
.player-display.winner,
.ia-display.winner {
  transform: scale(1.1);
  box-shadow: 0 0 20px 5px rgba(46, 204, 113, 0.6);
}

.chosen-icon {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

/* Centro: VS / IA Pensando */
.vs-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #555;
  min-width: 80px;
  position: absolute; /* Centrado absoluto */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  text-align: center;
}

.vs-text {
  font-size: 1.5em; /* Ajustado para mejor legibilidad */
  margin-top: 5px;
}

.vs-text.big-vs {
  font-size: 3em;
  animation: fadeIn 0.5s ease-out; /* Animación para el VS cuando aparece */
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.thinking-dots {
  font-size: 3em;
  animation: blink 1s infinite steps(1, end);
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

.thinking-gif {
  width: 80px; /* Ajusta tamaño del GIF de pensando */
  height: 80px;
  border-radius: 50%;
  animation: thinkingPulse 1.5s infinite alternate;
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

/* GIF de Explosión */
.explosion-gif {
  position: absolute;
  width: 150px;
  height: 150px;
  object-fit: contain;
  z-index: 3;
  animation: explode 1.2s forwards; /* Aumentado a 1.2s para más tiempo de visualización */
}

/* Posicionar la explosión sobre el jugador o la IA */
.player-explosion {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.ia-explosion {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes explode {
  0% {
    opacity: 1;
    transform: scale(0.1);
  }
  10% {
    opacity: 1;
    transform: scale(0.8);
  } /* Alcanza tamaño visible rápido */
  80% {
    opacity: 1;
    transform: scale(1.5);
  } /* Mantiene la opacidad 1 por más tiempo */
  100% {
    opacity: 0;
    transform: scale(1.8);
  } /* Se desvanece al final */
}

.result-message {
  font-size: 2em;
  font-weight: bold;
  margin-top: 30px;
  animation: fadeInScale 0.5s ease-out;
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
