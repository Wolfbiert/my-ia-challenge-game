<template>
  <!-- Contenedor principal de la vista del juego -->
  <div class="game-container">
    <!-- Área central donde se carga el minijuego actual y sus acciones -->
    <div class="minigame-area">
      <!-- Componente de minijuego actual (dinámico según la ronda).
           Props:
           - difficulty: dificultad actual del desafío
           - aiModifiers: modificadores de reglas/IA para esta ronda
           Eventos:
           - round-finished: notifica resultado de la ronda
           - update-ia-message: actualiza el mensaje mostrado por la IA -->
      <component
        :is="currentMiniGameComponent"
        :difficulty="currentDifficulty"
        :aiModifiers="aiGameModifiers"
        @round-finished="handleRoundFinished"
        @update-ia-message="handleIaMessage"
      />

      <!-- Botón: avanzar a la siguiente ronda (visible cuando corresponde) -->
      <button
        v-if="showNextRoundButton"
        @click="goToNextRound"
        class="action-button secondary"
      >
        Siguiente Ronda
      </button>

      <!-- Botón: reiniciar el desafío completo (visible al finalizar) -->
      <button
        v-if="challengeEnded"
        @click="resetChallenge"
        class="action-button primary"
      >
        Reiniciar Desafío
      </button>
    </div>

    <!-- Barra lateral con marcador y sprite de la IA -->
    <div class="ia-sidebar">
      <!-- Marcador de puntajes y progreso de rondas -->
      <div class="scoreboard">
        <h3>Marcador Desafío</h3>
        <p>Tú: {{ playerScore }} | IA: {{ iaScore }}</p>
        <p>Rondas: {{ currentRound }}/{{ totalRounds }}</p>
      </div>

      <!-- Visualización de la IA (mensaje, expresión y modo intervención) -->
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
    // Acceso a la ruta actual para leer la dificultad desde query params
    const route = useRoute();

    // Estado y funciones provenientes del orquestador de juego (IA)
    const {
      aiMessage,
      aiExpression,
      aiGameModifiers,
      isAiIntervening,
      setAiMessage,
      decideAndApplyAiModifiers,
      setGlobalDifficulty,
      handleGameMessage,
    } = useGameOrchestrator();

    // Marcadores y control de rondas
    const playerScore = ref(0);
    const iaScore = ref(0);
    const currentRound = ref(1);
    const totalRounds = ref(3);

    // Dificultad actual (por defecto "normal" si no viene en la URL)
    const currentDifficulty = ref(route.query.difficulty || "normal");

    // Lista de minijuegos disponibles (markRaw evita reactividad innecesaria)
    const availableMiniGames = [
      markRaw(PiedraPapelTijera),
      markRaw(AdivinaNumero),
      markRaw(SimonDice),
    ];

    // Estado del minijuego actual y los ya jugados
    const currentMiniGameComponent = ref(null);
    const playedMiniGames = ref([]);

    // Flags de control de flujo del desafío
    const challengeEnded = ref(false);
    const showNextRoundButton = ref(false);

    // Finaliza el desafío, muestra mensaje final y desbloquea dificultad si corresponde
    const handleChallengeEnd = () => {
      challengeEnded.value = true;
      showNextRoundButton.value = false;

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

      // Desbloqueo de dificultad si el jugador gana
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
        }
      }

      currentMiniGameComponent.value = null;
    };

    // Selecciona el próximo minijuego de forma aleatoria, evitando repetir hasta agotar la lista
    const selectNextMiniGame = () => {
      if (currentRound.value <= totalRounds.value) {
        const unplayedGames = availableMiniGames.filter(
          (game) => !playedMiniGames.value.includes(game.name)
        );

        let nextGame;
        if (unplayedGames.length > 0) {
          nextGame =
            unplayedGames[Math.floor(Math.random() * unplayedGames.length)];
        } else {
          playedMiniGames.value = [];
          nextGame =
            availableMiniGames[
              Math.floor(Math.random() * availableMiniGames.length)
            ];
        }

        currentMiniGameComponent.value = nextGame;
        playedMiniGames.value.push(nextGame.name);

        // Aplica modificadores de IA según el minijuego y puntajes
        decideAndApplyAiModifiers(
          nextGame.name,
          playerScore.value,
          iaScore.value
        );

        // Mensaje de inicio de ronda si la IA no interviene
        if (!isAiIntervening.value) {
          setAiMessage(`¡Es hora de ${nextGame.name}! ¡Mucha suerte!`, "happy");
        }
      } else {
        handleChallengeEnd();
      }
    };

    // Inicia un nuevo desafío desde cero
    const startChallenge = () => {
      playerScore.value = 0;
      iaScore.value = 0;
      currentRound.value = 1;
      challengeEnded.value = false;
      showNextRoundButton.value = false;
      playedMiniGames.value = [];

      setGlobalDifficulty(currentDifficulty.value);
      selectNextMiniGame();

      if (!isAiIntervening.value) {
        setAiMessage(
          `¡Bienvenido al desafío! ¡Demuéstrame de qué eres capaz en dificultad ${currentDifficulty.value}!`,
          "normal",
          4000
        );
      }
    };

    // Reinicia el desafío
    const resetChallenge = () => {
      startChallenge();
    };

    // Avanza a la siguiente ronda
    const goToNextRound = () => {
      showNextRoundButton.value = false;
      currentRound.value++;
      selectNextMiniGame();
    };

    // Maneja mensajes enviados desde los minijuegos hacia la IA
    const handleIaMessage = (message, expression, intervene = false) => {
      handleGameMessage(message, expression, intervene);
    };

    // Procesa el resultado de una ronda y actualiza marcador y mensajes
    const handleRoundFinished = (payload) => {
      let aiReactionMessage = "";
      let aiReactionExpression = "normal";

      if (payload.playerScore > payload.iaScore) {
        playerScore.value++;
        aiReactionMessage = "¡Rayos! Ganaste esta ronda. No te confíes.";
        aiReactionExpression = "sad";
      } else if (payload.iaScore > payload.playerScore) {
        iaScore.value++;
        aiReactionMessage = "¡Ja! ¡Sabía que ganaría! El futuro es mío.";
        aiReactionExpression = "happy";
      } else {
        aiReactionMessage =
          "¡Un empate! Interesante... La próxima será decisiva.";
        aiReactionExpression = "thinking";
      }

      if (!isAiIntervening.value) {
        setAiMessage(aiReactionMessage, aiReactionExpression);
      }

      if (currentRound.value < totalRounds.value) {
        showNextRoundButton.value = true;
      } else {
        handleChallengeEnd();
      }
    };

    // Al montar la vista, inicia el desafío
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
      isAiIntervening,
      handleIaMessage,
    };
  },
};
</script>

<style scoped>
/* Contenedor principal del área de juego:
   - Distribuye en dos columnas: minijuego y barra lateral
   - Centrado horizontal, alineado arriba
   - Altura total de la ventana menos padding */
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

/* Área donde se renderiza el minijuego actual:
   - Ocupa más espacio que la barra lateral
   - Fondo semitransparente, borde verde, esquinas redondeadas
   - Centra contenido y aplica sombra */
.minigame-area {
  flex-grow: 2;
  background-color: rgba(0, 0, 0, 0.5);
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

/* Barra lateral de la IA:
   - Columna con marcador y sprite
   - Ancho fijo mínimo/máximo */
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

/* Marcador de puntajes:
   - Fondo semitransparente, borde claro, esquinas redondeadas
   - Centrado de texto y sombra ligera */
.scoreboard {
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Títulos del marcador y otras secciones */
h2,
h3 {
  color: #ffffff;
  margin-bottom: 10px;
}

/* Texto general */
p {
  color: #ffffff;
}

/* Botones de acción (base):
   - Padding, tipografía, bordes redondeados
   - Transición de color en hover */
.action-button {
  padding: 12px 25px;
  font-size: 1.1em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 20px;
}

/* Botón primario (ej. reiniciar desafío) */
.action-button.primary {
  background-color: #007bff;
  color: white;
}

.action-button.primary:hover {
  background-color: #0056b3;
}

/* Botón secundario (ej. siguiente ronda) */
.action-button.secondary {
  background-color: #6c757d;
  color: white;
}

.action-button.secondary:hover {
  background-color: #5a6268;
}
</style>
