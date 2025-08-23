<template>
  <div class="game-container">
    <div class="minigame-area">
      <component
        :is="currentMiniGameComponent"
        :difficulty="currentDifficulty"
        :aiModifiers="aiGameModifiers"
        @round-finished="handleRoundFinished"
        @update-ia-message="handleIaMessage"
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
// Importaciones necesarias de Vue y librerías externas
import { ref, markRaw, onMounted } from "vue";
import { useRoute } from "vue-router";

// Importación de los componentes de cada minijuego
import PiedraPapelTijera from "../components/MiniGames/PiedraPapelTijera.vue";
import AdivinaNumero from "../components/MiniGames/AdivinaNumero.vue";
import SimonDice from "../components/MiniGames/SimonDice.vue";

// Importación de componentes de la interfaz y la lógica central
import IASprite from "../components/IASprite.vue";
import useGameOrchestrator from "../composables/useGameOrchestrator";

/**
 * @name GameView
 * @description
 * Esta vista es el contenedor principal y el controlador del "Desafío".
 * Se encarga de gestionar el flujo de rondas, seleccionar los minijuegos de forma
 * aleatoria, llevar el puntaje global y comunicarse con el orquestador de la IA
 * para mostrar mensajes y aplicar modificadores.
 */
export default {
  name: "GameView",
  components: {
    PiedraPapelTijera,
    AdivinaNumero,
    SimonDice,
    IASprite,
  },
  setup() {
    // Hook para acceder a la información de la ruta actual (ej. para obtener parámetros GET)
    const route = useRoute();

    // Desestructuración del composable del orquestador para acceder al estado global y funciones de la IA
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

    // --- Estado Reactivo del Desafío ---
    const playerScore = ref(0); // Puntuación global del jugador en el desafío
    const iaScore = ref(0); // Puntuación global de la IA en el desafío
    const currentRound = ref(1); // Ronda actual del desafío
    const totalRounds = ref(3); // Número total de rondas que componen el desafío

    // Determina la dificultad del desafío a partir de los parámetros de la URL, con "normal" como valor por defecto
    const currentDifficulty = ref(route.query.difficulty || "normal");

    // Array con todos los componentes de minijuegos disponibles.
    // 'markRaw' se usa para decirle a Vue que no haga reactivos estos componentes, optimizando el rendimiento.
    const availableMiniGames = [
      markRaw(PiedraPapelTijera),
      markRaw(AdivinaNumero),
      markRaw(SimonDice),
    ];

    const currentMiniGameComponent = ref(null); // Almacena el componente del minijuego que se está jugando
    const playedMiniGames = ref([]); // Guarda los nombres de los juegos ya jugados para evitar repeticiones

    // Banderas para controlar el estado de la interfaz
    const challengeEnded = ref(false); // true si el desafío ha terminado
    const showNextRoundButton = ref(false); // true para mostrar el botón de "Siguiente Ronda"

    /**
     * Se ejecuta cuando el desafío termina (ya sea por rondas o por knockout).
     * Muestra el resultado final, determina el mensaje de la IA y desbloquea la siguiente dificultad si el jugador gana.
     */
    const handleChallengeEnd = () => {
      challengeEnded.value = true;
      showNextRoundButton.value = false;
      console.log("¡Desafío terminado!");
      console.log(
        `Resultado final: Jugador ${playerScore.value} - IA ${iaScore.value}`
      );

      // Lógica para determinar el mensaje final de la IA basado en el resultado
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

      // Si el jugador gana, se dispara un evento global para desbloquear la siguiente dificultad
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
      // Se oculta el componente del minijuego
      currentMiniGameComponent.value = null;
    };

    /**
     * Selecciona aleatoriamente el siguiente minijuego a jugar, evitando repeticiones si es posible.
     * Si se han jugado todos, reinicia la lista.
     */
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
          // Si ya se jugaron todos, se limpia la lista para permitir que se repitan.
          playedMiniGames.value = [];
          const randomIndex = Math.floor(
            Math.random() * availableMiniGames.length
          );
          nextGame = availableMiniGames[randomIndex];
        }

        currentMiniGameComponent.value = nextGame;
        playedMiniGames.value.push(nextGame.name);

        // Llama al orquestador para que decida si la IA debe usar un modificador en esta ronda
        decideAndApplyAiModifiers(
          nextGame.name,
          playerScore.value,
          iaScore.value
        );

        // Muestra un mensaje de bienvenida a la ronda si la IA no está haciendo una intervención especial
        if (!isAiIntervening.value) {
          setAiMessage(`¡Es hora de ${nextGame.name}! ¡Mucha suerte!`, "happy");
        }
      } else {
        // Si ya no quedan rondas, finaliza el desafío
        handleChallengeEnd();
      }
    };

    /**
     * Inicia un nuevo desafío, reiniciando todos los marcadores y estados.
     */
    const startChallenge = () => {
      playerScore.value = 0;
      iaScore.value = 0;
      currentRound.value = 1;
      challengeEnded.value = false;
      showNextRoundButton.value = false;
      playedMiniGames.value = [];

      setGlobalDifficulty(currentDifficulty.value);
      selectNextMiniGame();

      // Muestra el mensaje de bienvenida inicial del desafío
      if (!isAiIntervening.value) {
        setAiMessage(
          `¡Bienvenido al desafío! ¡Demuéstrame de qué eres capaz en dificultad ${currentDifficulty.value}!`,
          "normal",
          4000
        );
      }
    };

    /**
     * Reinicia el desafío completo. Es un alias para startChallenge.
     */
    const resetChallenge = () => {
      startChallenge();
    };

    /**
     * Se ejecuta al pulsar el botón "Siguiente Ronda". Incrementa el contador de ronda y selecciona el próximo juego.
     */
    const goToNextRound = () => {
      showNextRoundButton.value = false;
      currentRound.value++;
      selectNextMiniGame();
    };

    /**
     * Función puente para que los componentes hijos puedan comunicarse con el orquestador. (Obsoleto)
     * @param {string} message - El texto del mensaje.
     * @param {string} expression - La expresión de la IA.
     * @param {boolean} intervene - Si la IA debe hacer una intervención.
     */
    const handleIaMessage = (message, expression, intervene = false) => {
      handleGameMessage(message, expression, intervene);
    };

    /**
     * Gestiona el evento '@round-finished' emitido por un minijuego.
     * Recibe el resultado, actualiza el marcador global y decide si mostrar el botón
     * de siguiente ronda o finalizar el desafío.
     * @param {object} payload - El objeto con el resultado del minijuego.
     * @param {number} payload.playerScore - Puntuación final del jugador.
     * @param {number} payload.iaScore - Puntuación final de la IA.
     */
    const handleRoundFinished = (payload) => {
      console.log("Ronda terminada:", payload);

      let aiReactionMessage = "";
      let aiReactionExpression = "normal";

      // Compara los puntajes del payload para determinar el ganador de la ronda.
      if (payload.playerScore > payload.iaScore) {
        playerScore.value++; // Suma un punto al marcador global del jugador
        aiReactionMessage = "¡Rayos! Ganaste esta ronda. No te confíes.";
        aiReactionExpression = "sad";
        console.log(
          "¡Ganó el jugador la ronda! Puntuación global:",
          playerScore.value
        );
      } else if (payload.iaScore > payload.playerScore) {
        iaScore.value++; // Suma un punto al marcador global de la IA
        aiReactionMessage = "¡Ja! ¡Sabía que ganaría! El futuro es mío.";
        aiReactionExpression = "happy";
        console.log("¡Ganó la IA la ronda! Puntuación global:", iaScore.value);
      } else {
        // Si los puntajes son iguales, es un empate y nadie suma puntos.
        aiReactionMessage =
          "¡Un empate! Interesante... La próxima será decisiva.";
        aiReactionExpression = "thinking";
        console.log("Ronda empatada.");
      }

      // La IA reacciona al resultado de la ronda
      if (!isAiIntervening.value) {
        setAiMessage(aiReactionMessage, aiReactionExpression);
      }

      // Decide si mostrar el botón de siguiente ronda o terminar el desafío
      if (currentRound.value < totalRounds.value) {
        showNextRoundButton.value = true;
      } else {
        handleChallengeEnd();
      }
    };

    /**
     * Hook del ciclo de vida de Vue. Se ejecuta una vez que el componente ha sido montado en el DOM.
     * Es el punto de entrada para iniciar el desafío.
     */
    onMounted(() => {
      startChallenge();
    });

    // Se exponen todas las variables y funciones que necesita la plantilla <template>
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
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
