<template>
  <div class="game-container">
    <div class="minigame-area">
      <component
        :is="currentMiniGameComponent"
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
        <h3>Área de la IA</h3>
        <p>Mensajes de la IA irán aquí.</p>
        <div class="ia-placeholder">🤖</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, markRaw, onMounted } from "vue"; // markRaw es importante para componentes dinámicos
import { useRoute } from "vue-router";
import PiedraPapelTijera from "../components/MiniGames/PiedraPapelTijera.vue";
import AdivinaNumero from "../components/MiniGames/AdivinaNumero.vue";
import SimonDice from "../components/MiniGames/SimonDice.vue";

export default {
  name: "GameView",
  components: {
    PiedraPapelTijera,
    AdivinaNumero,
    SimonDice,
    // Otros mini-juegos se añadirán aquí en el futuro
  },
  setup() {
    const route = useRoute();

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
    const showNextRoundButton = ref(false); // <-- ¡NUEVA REFERENCIA PARA EL BOTÓN!

    // --- Lógica de Dificultad y Desbloqueo ---
    const handleChallengeEnd = () => {
      challengeEnded.value = true;
      showNextRoundButton.value = false; // Asegurarse de que el botón no aparezca al final
      console.log("¡Desafío terminado!");
      console.log(
        `Resultado final: Jugador ${playerScore.value} - IA ${iaScore.value}`
      );

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
      showNextRoundButton.value = false; // Asegurar que no se muestre al inicio
      playedMiniGames.value = [];
      selectNextMiniGame();
    };

    // Lógica para reiniciar el desafío (botón temporal)
    const resetChallenge = () => {
      startChallenge();
    };

    // --- NUEVA FUNCIÓN PARA PASAR A LA SIGUIENTE RONDA ---
    const goToNextRound = () => {
      showNextRoundButton.value = false; // Oculta el botón "Siguiente Ronda"
      currentRound.value++; // Incrementa la ronda actual
      selectNextMiniGame(); // Selecciona el próximo mini-juego para la nueva ronda
    };

    // --- Manejador de Ronda Terminada ---
    const handleRoundFinished = (payload) => {
      console.log("Ronda terminada:", payload);

      if (payload.winner === "player") {
        playerScore.value++;
        console.log("¡Ganó el jugador! Puntuación:", playerScore.value);
      } else if (payload.winner === "ia") {
        iaScore.value++;
        console.log("¡Ganó la IA! Puntuación:", iaScore.value);
      } else {
        console.log("Ronda empatada.");
      }

      // NO incrementamos currentRound aquí, lo haremos en goToNextRound
      // Y lo más importante: NO llamamos a selectNextMiniGame() directamente
      // en un setTimeout. En su lugar, mostramos el botón.

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

    // 'setup' debe devolver todo lo que quieres que esté disponible en el template.
    return {
      playerScore,
      iaScore,
      currentRound,
      totalRounds,
      currentMiniGameComponent,
      challengeEnded,
      currentDifficulty,
      showNextRoundButton, // <-- ¡Importante: exponer la nueva ref!
      handleRoundFinished,
      resetChallenge,
      goToNextRound, // <-- ¡Importante: exponer la nueva función!
    };
  },
};
</script>

<style scoped>
/* Mantén tus estilos CSS que definiste anteriormente para GameView.
   No es necesario cambiarlos a menos que quieras ajustar el layout. */
.game-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  gap: 20px;
  height: calc(100vh - 40px);
  box-sizing: border-box;
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
}

.ia-sidebar {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 300px;
  min-width: 250px;
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
  justify-content: center;
  align-items: center;
}

.ia-placeholder {
  font-size: 80px;
  margin-top: 10px;
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
  margin-top: 20px; /* Espacio arriba del botón */
}

.action-button.primary {
  background-color: #007bff; /* Un color azul para la acción principal */
  color: white;
}

.action-button.primary:hover {
  background-color: #0056b3;
}

.action-button.secondary {
  background-color: #6c757d; /* Un color gris o menos llamativo */
  color: white;
}

.action-button.secondary:hover {
  background-color: #5a6268;
}
</style>
