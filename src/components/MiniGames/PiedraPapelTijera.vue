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
            winner:
              result === '¡Ganaste esta ronda!' &&
              gameState === 'showingResult',
            loser:
              result === '¡Perdiste esta ronda!' &&
              gameState === 'showingResult',
            'round-over-loser':
              gameState === 'roundOver' && roundLoser === 'player',
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
          v-if="showExplosion && roundLoser === 'player'"
          :src="`/images/ppt/explosion.gif?t=${explosionTimestamp}`"
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
            winner:
              result === '¡Perdiste esta ronda!' &&
              gameState === 'showingResult',
            loser:
              result === '¡Ganaste esta ronda!' &&
              gameState === 'showingResult',
            'round-over-loser':
              gameState === 'roundOver' && roundLoser === 'ia',
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
          v-if="showExplosion && roundLoser === 'ia'"
          :src="`/images/ppt/explosion.gif?t=${explosionTimestamp}`"
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
import { ref, onMounted, watch, nextTick } from "vue";
import { Howl } from "howler";

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
    const messageType = ref("info");
    const choices = ["rock", "paper", "scissors"];

    const gameState = ref("playerChoice");
    const iaThinkingDisplayChoice = ref(null);
    let iaThinkingInterval = null;
    const iaHasChosen = ref(false);
    const showExplosion = ref(false);
    const roundLoser = ref(null);
    const explosionTimestamp = ref(Date.now());

    const explosionSound = new Howl({
      src: ["/sounds/explosion.mp3"],
      volume: 0.5,
    });

    let iaPredictionChance = 0;
    let iaThinkingDuration = 0;

    const setGameParameters = (difficulty) => {
      switch (difficulty) {
        case "facil":
          iaPredictionChance = 0;
          iaThinkingDuration = 2500;
          break;
        case "normal":
          iaPredictionChance = 0.3;
          iaThinkingDuration = 3500;
          break;
        case "dificil":
          iaPredictionChance = 0.6;
          iaThinkingDuration = 4000;
          break;
      }
      resetGame();
    };

    const playRound = async (choice) => {
      playerChoice.value = choice;
      gameMessage.value = `Tú elegiste: ${choice}...`;
      gameState.value = "iaThinking";
      showExplosion.value = false;
      iaHasChosen.value = false;
      roundLoser.value = null;

      // IA piensa
      let currentChoiceIndex = 0;
      iaThinkingInterval = setInterval(() => {
        iaThinkingDisplayChoice.value = choices[currentChoiceIndex];
        currentChoiceIndex = (currentChoiceIndex + 1) % choices.length;
      }, 150);
      await new Promise((resolve) => setTimeout(resolve, iaThinkingDuration));
      clearInterval(iaThinkingInterval);

      // Elección IA
      let chosenIaMove;
      const randomNumber = Math.random();
      if (randomNumber < iaPredictionChance) {
        chosenIaMove =
          choice === "rock"
            ? "paper"
            : choice === "paper"
            ? "scissors"
            : "rock";
        gameMessage.value = "¡La IA ha tomado su decisión!";
      } else {
        chosenIaMove = choices[Math.floor(Math.random() * choices.length)];
        gameMessage.value = "La IA ha elegido...";
      }

      iaChoice.value = chosenIaMove;
      iaThinkingDisplayChoice.value = chosenIaMove;
      gameState.value = "iaChosen";
      iaHasChosen.value = true;
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Resultado
      let roundWinner;
      if (playerChoice.value === iaChoice.value) {
        result.value = "¡Empate!";
        messageType.value = "info";
        roundWinner = "draw";
        roundLoser.value = null;
      } else if (
        (playerChoice.value === "rock" && iaChoice.value === "scissors") ||
        (playerChoice.value === "paper" && iaChoice.value === "rock") ||
        (playerChoice.value === "scissors" && iaChoice.value === "paper")
      ) {
        result.value = "¡Ganaste esta ronda!";
        messageType.value = "success";
        roundWinner = "player";
        roundLoser.value = "ia";
      } else {
        result.value = "¡Perdiste esta ronda!";
        messageType.value = "error";
        roundWinner = "ia";
        roundLoser.value = "player";
      }

      gameState.value = "showingResult";
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (roundWinner !== "draw") {
        explosionTimestamp.value = Date.now(); // reinicio del GIF
        showExplosion.value = true;
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 50));
        explosionSound.play();

        // 💥 Poca espera: mostrar explosión y hacer desaparecer al perdedor casi al instante
        await new Promise((resolve) => setTimeout(resolve, 300));
        gameState.value = "roundOver"; // activa clase CSS que oculta al perdedor

        await new Promise((resolve) => setTimeout(resolve, 1200));
        showExplosion.value = false;
      } else {
        showExplosion.value = false;
        await new Promise((resolve) => setTimeout(resolve, 800));
        gameState.value = "roundOver";
      }

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
      showExplosion.value = false;
      roundLoser.value = null;
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
      gameState,
      iaThinkingDisplayChoice,
      iaHasChosen,
      showExplosion,
      roundLoser,
      explosionTimestamp,
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
  min-height: 450px;
  position: relative;
  overflow: hidden;
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
  justify-content: space-between;
  gap: 100px; /* 🔄 ANTES: 60px */
  margin-top: 40px; /* 🔄 ANTES: 20px */
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
  /* Transición para winner/loser y también para la clase de desaparición */
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
  animation: popIn 0.2s ease-out;
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
  /* La escala se aplica solo cuando es perdedor y se muestra el resultado */
  transform: scale(0.5) translateY(20px);
  opacity: 1; /* Es visible cuando se está mostrando el resultado y es perdedor */
}

.player-display.winner,
.ia-display.winner {
  transform: scale(1.1);
  box-shadow: 0 0 20px 5px rgba(46, 204, 113, 0.6);
}

/* NUEVA REGLA: El perdedor se desvanece y achica cuando la ronda ha terminado */
/* Esto se activa después de la explosión (gameState cambia a 'roundOver') */
.player-display.round-over-loser,
.ia-display.round-over-loser {
  opacity: 0; /* Lo hace completamente transparente */
  transform: scale(0); /* Lo achica a cero */
  /* La transición ya está definida en .player-display, .ia-display */
}

/* Iconos de elección del VS (dentro de player-display/ia-display) */
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
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  text-align: center;
}

.vs-text {
  font-size: 1.5em;
  margin-top: 5px;
}

.vs-text.big-vs {
  font-size: 3em;
  animation: fadeIn 0.5s ease-out;
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
  width: 80px;
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
  display: block;
  width: 100%; /* 🔄 ANTES: 150px */
  height: 100%; /* 🔄 ANTES: 150px */
  object-fit: contain;
  z-index: 3;
  animation: explode 1.2s forwards; /* 🔄 Duración ajustada para que desaparezca más rápido */
  pointer-events: none; /* 🔒 Asegura que no bloquee clics debajo */
}

/* Posicionar la explosión sobre el jugador o la IA */
.player-explosion {
  top: 0; /* 🔄 ANTES: 50% */
  left: 0; /* 🔄 ANTES: 50% */
  transform: none; /* 🔄 ANTES: translate(-50%, -50%) */
  width: 100%;
  height: 100%;
}

.ia-explosion {
  top: 0;
  left: 0;
  transform: none;
  width: 100%;
  height: 100%;
}

@keyframes explode {
  0% {
    opacity: 1;
    transform: scale(0.1);
  }
  10% {
    opacity: 1;
    transform: scale(0.8);
  }
  80% {
    opacity: 1;
    transform: scale(1.5);
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
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
