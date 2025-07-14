<template>
  <div class="game-container">
    <div class="minigame-area">
      <component
        :is="currentMiniGameComponent"
        @round-finished="handleRoundFinished"
      />

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
import PiedraPapelTijera from "../components/MiniGames/PiedraPapelTijera.vue";
import AdivinaNumero from "../components/MiniGames/AdivinaNumero.vue"; // <-- Nueva importación
import SimonDice from "../components/MiniGames/SimonDice.vue"; // <-- Nueva importación

export default {
  name: "GameView",
  components: {
    PiedraPapelTijera,
    AdivinaNumero, // <-- Añade el nuevo componente aquí
    SimonDice, // <-- Añade el nuevo componente aquí
    // Otros mini-juegos se añadirán aquí en el futuro
  },
  setup() {
    // --- Datos Reactivos del Marcador Global ---
    const playerScore = ref(0);
    const iaScore = ref(0);
    const currentRound = ref(1); // Ronda actual del desafío
    const totalRounds = ref(3); // Número total de mini-juegos en un desafío

    // --- NUEVO: Dificultad Global del Desafío ---
    const currentDifficulty = ref("normal"); // Por ahora hardcodeado, luego vendrá de HomeView

    // --- Gestión de Mini-Juegos ---
    // Array de mini-juegos disponibles. Usamos 'markRaw' para que Vue no intente
    // hacer reactivo el componente en sí, solo su instancia cuando se monta.
    // Esto es una buena práctica para componentes dinámicos pasados como valores.
    const availableMiniGames = markRaw([
      PiedraPapelTijera,
      AdivinaNumero, // <-- Añade el nuevo componente aquí
      SimonDice, // <-- Añade el nuevo componente aquí
    ]);

    // El componente actual que se está mostrando en el área del mini-juego.
    // Inicializamos con el primer mini-juego o con una selección aleatoria.
    const currentMiniGameComponent = ref(null);
    const playedMiniGames = ref([]); // Guarda los mini-juegos ya jugados en el desafío actual

    // Estado del desafío
    const challengeEnded = ref(false); // true si el desafío ha terminado

    // --- Lógica de Inicio y Selección de Mini-Juegos ---
    const selectNextMiniGame = () => {
      if (currentRound.value <= totalRounds.value) {
        // Lógica para seleccionar el siguiente juego. Por ahora, seleccionamos aleatoriamente
        // de los disponibles que no se han jugado aún en este desafío.
        const unplayedGames = availableMiniGames.filter(
          (game) => !playedMiniGames.value.includes(game.name) // Filtra por nombre del componente
        );

        if (unplayedGames.length > 0) {
          const randomIndex = Math.floor(Math.random() * unplayedGames.length);
          currentMiniGameComponent.value = unplayedGames[randomIndex];
          playedMiniGames.value.push(unplayedGames[randomIndex].name); // Registra el nombre del juego jugado
        } else {
          // Si ya se jugaron todos los juegos disponibles (raro si totalRounds es menor que availableMiniGames.length)
          // o si solo tenemos 1 juego por ahora y currentRound es 1, simplemente reinicia o selecciona el mismo.
          console.warn(
            "No hay mini-juegos sin jugar disponibles. Reiniciando lista o seleccionando el primero."
          );
          currentMiniGameComponent.value = availableMiniGames[0]; // Temporalmente, selecciona el primero
        }
      } else {
        challengeEnded.value = true;
        console.log("¡Desafío terminado!");
        // TODO: Lógica para mostrar resultados finales y opción de guardar puntuación
        currentMiniGameComponent.value = null; // O muestra un componente de "Desafío Terminado"
      }
    };

    // Función para inicializar el desafío
    const startChallenge = () => {
      playerScore.value = 0;
      iaScore.value = 0;
      currentRound.value = 1;
      challengeEnded.value = false;
      playedMiniGames.value = []; // Reinicia la lista de juegos jugados
      selectNextMiniGame(); // Selecciona el primer mini-juego
    };

    // Lógica para reiniciar el desafío (botón temporal)
    const resetChallenge = () => {
      startChallenge();
    };

    // --- Manejador de Ronda Terminada ---
    // Este método se ejecutará cuando cualquier mini-juego emita 'round-finished'.
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

      // Avanzar a la siguiente ronda
      currentRound.value++;
      // Retraso para que el jugador vea el resultado antes de cargar el siguiente juego
      setTimeout(() => {
        selectNextMiniGame(); // Selecciona el siguiente mini-juego
      }, 1500); // Espera 1.5 segundos
    };

    // --- Lifecycle Hook: mounted ---
    // 'onMounted' es un hook del ciclo de vida de Vue 3.
    // La función dentro de onMounted se ejecuta solo una vez, cuando el componente GameView se ha "montado"
    // en el DOM y está listo para ser usado. Es perfecto para iniciar cosas como el desafío.
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
      handleRoundFinished,
      resetChallenge,
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
</style>
