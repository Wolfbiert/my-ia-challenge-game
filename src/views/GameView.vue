<template>
  <div class="game-container">
    <div class="minigame-area">
      <component
        :is="currentMiniGameComponent"
        :difficulty="currentDifficulty"
        :aiModifiers="aiGameModifiers"
        @round-finished="handleRoundFinished"
      />

      <button
        v-if="showNextRoundButton"
        @click="goToNextRound"
        class="action-button secondary"
      >
        Siguiente Ronda
      </button>

      <button
        v-if="challengeEnded"
        @click="resetChallenge"
        class="action-button primary"
      >
        Reiniciar Desafío
      </button>
    </div>

    <div class="ia-sidebar">
      <div class="scoreboard">
        <h3>Marcador Desafío</h3>
        <p>Tú: {{ playerScore }} | IA: {{ iaScore }}</p>
        <p>Rondas: {{ currentRound }}/{{ totalRounds }}</p>
      </div>

      <div class="ia-display">
        <IASprite
          :message="aiMessage"
          :expression="aiExpression"
          :isIntervening="isAiIntervening"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, markRaw, onMounted } from "vue";
import { useRoute } from "vue-router";
import PiedraPapelTijera from "../components/MiniGames/PiedraPapelTijera.vue";
import AdivinaNumero from "../components/MiniGames/AdivinaNumero.vue";
import SimonDice from "../components/MiniGames/SimonDice.vue";

import IASprite from "../components/IASprite.vue";
import useGameOrchestrator from "../composables/useGameOrchestrator";

export default {
  name: "GameView",
  components: {
    PiedraPapelTijera,
    AdivinaNumero,
    SimonDice,
    IASprite,
  },
  setup() {
    const route = useRoute();

    const {
      aiMessage,
      aiExpression,
      aiGameModifiers,
      isAiIntervening,
      setAiMessage,
      decideAndApplyAiModifiers,
      setGlobalDifficulty,
    } = useGameOrchestrator();

    const playerScore = ref(0);
    const iaScore = ref(0);
    const currentRound = ref(1);
    const totalRounds = ref(3);

    const currentDifficulty = ref(route.query.difficulty || "normal");

    const availableMiniGames = [
      markRaw(PiedraPapelTijera),
      markRaw(AdivinaNumero),
      markRaw(SimonDice),
    ];

    const currentMiniGameComponent = ref(null);
    const playedMiniGames = ref([]);

    const challengeEnded = ref(false);
    const showNextRoundButton = ref(false);

    const handleChallengeEnd = () => {
      challengeEnded.value = true;
      showNextRoundButton.value = false;
      console.log("¡Desafío terminado!");
      console.log(
        `Resultado final: Jugador ${playerScore.value} - IA ${iaScore.value}`
      );

      let finalAiMessage = "";
      let finalAiExpression = "normal";
      if (playerScore.value > iaScore.value) {
        finalAiMessage = "¡Me has superado esta vez! ¡Bien jugado, humano!";
        finalAiExpression = "sad";
      } else if (iaScore.value > playerScore.value) {
        finalAiMessage = "¡Jajaja! ¡Soy invencible! El desafío es mío.";
        finalAiExpression = "happy";
      } else {
        finalAiMessage =
          "Un empate... ¡Qué emocionante! ¡La próxima vez no tendré piedad!";
        finalAiExpression = "thinking";
      }
      setAiMessage(finalAiMessage, finalAiExpression, 5000);

      if (playerScore.value > iaScore.value) {
        let nextDifficultyToUnlock = null;
        if (currentDifficulty.value === "facil") {
          nextDifficultyToUnlock = "normal";
        } else if (currentDifficulty.value === "normal") {
          nextDifficultyToUnlock = "dificil";
        }

        if (nextDifficultyToUnlock) {
          window.dispatchEvent(
            new CustomEvent("unlockDifficulty", {
              detail: { level: nextDifficultyToUnlock },
            })
          );
          console.log(`¡Nivel "${nextDifficultyToUnlock}" desbloqueado!`);
        }
      }
      currentMiniGameComponent.value = null;
    };

    const selectNextMiniGame = () => {
      if (currentRound.value <= totalRounds.value) {
        const unplayedGames = availableMiniGames.filter(
          (game) => !playedMiniGames.value.includes(game.name)
        );

        let nextGame;
        if (unplayedGames.length > 0) {
          const randomIndex = Math.floor(Math.random() * unplayedGames.length);
          nextGame = unplayedGames[randomIndex];
        } else {
          playedMiniGames.value = [];
          const randomIndex = Math.floor(
            Math.random() * availableMiniGames.length
          );
          nextGame = availableMiniGames[randomIndex];
        }

        currentMiniGameComponent.value = nextGame;
        playedMiniGames.value.push(nextGame.name);

        // La IA decide sus modificadores para el *próximo* juego
        // Esta función ahora llama a interveneAi internamente si se cumplen las condiciones
        decideAndApplyAiModifiers(
          nextGame.name,
          playerScore.value,
          iaScore.value
        );

        // Si la IA no está interviniendo (por ejemplo, si no aplica modificadores),
        // entonces muestra un mensaje normal de inicio de ronda.
        // Esto previene que dos mensajes de IA se solapen.
        if (!isAiIntervening.value) {
          setAiMessage(`¡Es hora de ${nextGame.name}! ¡Mucha suerte!`, "happy");
        }
      } else {
        handleChallengeEnd();
      }
    };

    const startChallenge = () => {
      playerScore.value = 0;
      iaScore.value = 0;
      currentRound.value = 1;
      challengeEnded.value = false;
      showNextRoundButton.value = false;
      playedMiniGames.value = [];

      // Establecer la dificultad global en el composable
      setGlobalDifficulty(currentDifficulty.value);

      selectNextMiniGame(); // Esto ya llamará a decideAndApplyAiModifiers para el primer juego

      // Mensaje de inicio de desafío. Si la IA interviene en la primera ronda, este mensaje
      // puede ser sobrescrito o retrasado, lo cual es un comportamiento deseable.
      if (!isAiIntervening.value) {
        setAiMessage(
          `¡Bienvenido al desafío! ¡Demuéstrame de qué eres capaz en dificultad ${currentDifficulty.value}!`,
          "normal",
          4000
        );
      }
    };

    const resetChallenge = () => {
      startChallenge();
    };

    const goToNextRound = () => {
      showNextRoundButton.value = false;
      currentRound.value++;
      selectNextMiniGame();
    };

    const handleRoundFinished = (payload) => {
      console.log("Ronda terminada:", payload);

      let aiReactionMessage = "";
      let aiReactionExpression = "normal";

      if (payload.winner === "player") {
        playerScore.value++;
        aiReactionMessage = "¡Rayos! Ganaste esta ronda. No te confíes.";
        aiReactionExpression = "sad";
        console.log("¡Ganó el jugador! Puntuación:", playerScore.value);
      } else if (payload.winner === "ia") {
        iaScore.value++;
        aiReactionMessage = "¡Ja! ¡Sabía que ganaría! El futuro es mío.";
        aiReactionExpression = "happy";
        console.log("¡Ganó la IA! Puntuación:", iaScore.value);
      } else {
        aiReactionMessage =
          "¡Un empate! Interesante... La próxima será decisiva.";
        aiReactionExpression = "thinking";
        console.log("Ronda empatada.");
      }

      // Asegúrate de que este mensaje no se muestre si la IA ya está interviniendo
      if (!isAiIntervening.value) {
        setAiMessage(aiReactionMessage, aiReactionExpression);
      }

      if (currentRound.value < totalRounds.value) {
        showNextRoundButton.value = true;
      } else {
        handleChallengeEnd();
      }
    };

    onMounted(() => {
      startChallenge();
    });

    return {
      playerScore,
      iaScore,
      currentRound,
      totalRounds,
      currentMiniGameComponent,
      challengeEnded,
      currentDifficulty,
      showNextRoundButton,
      handleRoundFinished,
      resetChallenge,
      goToNextRound,
      aiMessage,
      aiExpression,
      aiGameModifiers,
      isAiIntervening, // <-- Exponer isAiIntervening
    };
  },
};
</script>

<style scoped>
.game-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  gap: 20px;
  height: calc(100vh - 40px);
  box-sizing: border-box;
  position: relative;
}

.minigame-area {
  flex-grow: 2;
  background-color: rgba(0, 0, 0, 0.5); /* Negro semi-transparente */
  border: 2px solid #42b983;
  border-radius: 15px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.ia-sidebar {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 300px;
  min-width: 250px;
  position: relative;
  height: 100%;
}

.scoreboard {
  background-color: rgba(0, 0, 0, 0.5); /* Negro semi-transparente */
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.ia-display {
  background-color: rgba(0, 0, 0, 0.5); /* Negro semi-transparente */
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  overflow: hidden;
}

h2,
h3 {
  color: #ffffff;
  margin-bottom: 10px;
}
p {
  color: #ffffff;
}

.action-button {
  padding: 12px 25px;
  font-size: 1.1em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 20px;
}

.action-button.primary {
  background-color: #007bff;
  color: white;
}

.action-button.primary:hover {
  background-color: #0056b3;
}

.action-button.secondary {
  background-color: #6c757d;
  color: white;
}

.action-button.secondary:hover {
  background-color: #5a6268;
}
</style>
