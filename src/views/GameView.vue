<template>
  <div class="game-container">
    <div class="minigame-area">
      <component
        :is="currentMiniGameComponent"
        :difficulty="currentDifficulty"
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
        <IASprite :message="aiMessage" :expression="aiExpression" />
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

// --- Importar componentes de la IA ---
import IASprite from "../components/IASprite.vue"; // Subir un nivel (src) y luego bajar a UI
import useGameOrchestrator from "../composables/useGameOrchestrator"; // Subir un nivel (src) y luego bajar a composables

export default {
  name: "GameView",
  components: {
    PiedraPapelTijera,
    AdivinaNumero,
    SimonDice,
    IASprite, // Registrar el componente IASprite
  },
  setup() {
    const route = useRoute();

    // --- Usar el Composable del Orquestador ---
    // Se elimina 'setMinigame' de aquí porque no se usa directamente en este archivo.
    const { aiMessage, aiExpression, setAiMessage } = useGameOrchestrator();

    // --- Datos Reactivos del Marcador Global ---
    const playerScore = ref(0);
    const iaScore = ref(0);
    const currentRound = ref(1); // Ronda actual del desafío
    const totalRounds = ref(3); // Número total de mini-juegos en un desafío

    // --- Dificultad Global del Desafío (Ahora obtenida de la URL) ---
    const currentDifficulty = ref(route.query.difficulty || "facil");

    // --- Gestión de Mini-Juegos ---
    const availableMiniGames = [
      markRaw(PiedraPapelTijera),
      markRaw(AdivinaNumero),
      markRaw(SimonDice),
    ];

    const currentMiniGameComponent = ref(null);
    const playedMiniGames = ref([]);

    // Estado del desafío
    const challengeEnded = ref(false);
    const showNextRoundButton = ref(false);

    // --- Lógica de Dificultad y Desbloqueo ---
    const handleChallengeEnd = () => {
      challengeEnded.value = true;
      showNextRoundButton.value = false;
      console.log("¡Desafío terminado!");
      console.log(
        `Resultado final: Jugador ${playerScore.value} - IA ${iaScore.value}`
      );

      // --- Mensaje final de la IA ---
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
      setAiMessage(finalAiMessage, finalAiExpression, 5000); // Mensaje más largo al final

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
      currentMiniGameComponent.value = null; // O muestra un componente de "Desafío Terminado"
    };

    // --- Lógica de Inicio y Selección de Mini-Juegos ---
    const selectNextMiniGame = () => {
      if (currentRound.value <= totalRounds.value) {
        const unplayedGames = availableMiniGames.filter(
          (game) => !playedMiniGames.value.includes(game.name)
        );

        if (unplayedGames.length > 0) {
          const randomIndex = Math.floor(Math.random() * unplayedGames.length);
          currentMiniGameComponent.value = unplayedGames[randomIndex];
          playedMiniGames.value.push(unplayedGames[randomIndex].name);
        } else {
          // Si se jugaron todos los juegos o el número de rondas es menor que los juegos disponibles,
          // reinicia la lista de jugados y selecciona aleatoriamente de todos.
          playedMiniGames.value = [];
          const randomIndex = Math.floor(
            Math.random() * availableMiniGames.length
          );
          currentMiniGameComponent.value = availableMiniGames[randomIndex];
          playedMiniGames.value.push(availableMiniGames[randomIndex].name);
        }
        // Mensaje de la IA al iniciar nueva ronda/minijuego
        setAiMessage(
          `¡Es hora de ${currentMiniGameComponent.value.name}! ¡Mucha suerte!`,
          "happy"
        );
      } else {
        handleChallengeEnd(); // Llama a la función de fin de desafío
      }
    };

    // Función para inicializar el desafío
    const startChallenge = () => {
      playerScore.value = 0;
      iaScore.value = 0;
      currentRound.value = 1;
      challengeEnded.value = false;
      showNextRoundButton.value = false;
      playedMiniGames.value = [];
      selectNextMiniGame();
      // Mensaje de la IA al iniciar el desafío
      setAiMessage(
        `¡Bienvenido al desafío! ¡Demuéstrame de qué eres capaz en dificultad ${currentDifficulty.value}!`,
        "normal",
        4000
      );
    };

    // Lógica para reiniciar el desafío (botón temporal)
    const resetChallenge = () => {
      startChallenge();
    };

    // --- FUNCIÓN PARA PASAR A LA SIGUIENTE RONDA ---
    const goToNextRound = () => {
      showNextRoundButton.value = false;
      currentRound.value++;
      selectNextMiniGame();
    };

    // --- Manejador de Ronda Terminada ---
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

      setAiMessage(aiReactionMessage, aiReactionExpression); // La IA reacciona

      // Muestra el botón para ir a la siguiente ronda, si aún quedan rondas
      if (currentRound.value < totalRounds.value) {
        showNextRoundButton.value = true;
      } else {
        // Si es la última ronda, manejar el fin del desafío directamente
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
      // Exponer las propiedades de la IA del composable para el template
      aiMessage,
      aiExpression,
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
  position: relative; /* Importante para que IASprite.vue pueda posicionarse absolutamente */
}

.minigame-area {
  flex-grow: 2;
  background-color: #ffffff;
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
  position: relative; /* Si necesitas posicionar algo absoluto dentro del área del minijuego */
}

.ia-sidebar {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 300px;
  min-width: 250px;
  /* Posicionamiento para que el IASprite se alinee dentro */
  position: relative; /* Hace que el IASprite se posicione relativamente a este sidebar */
  height: 100%; /* Ocupa la altura completa del contenedor para mejor posicionamiento vertical de la IA */
}

.scoreboard {
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.ia-display {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* Alinea el contenido (IA Sprite) hacia abajo */
  align-items: center;
  position: relative; /* IMPORTANTE para que IASprite se posicione dentro de este div */
  overflow: hidden; /* En caso de que el sprite se salga un poco */
}

h2,
h3 {
  color: #333;
  margin-bottom: 10px;
}
p {
  color: #555;
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
