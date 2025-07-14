<template>
  <div class="game-container">
    <div class="minigame-area">
      <PiedraPapelTijera @round-finished="handleRoundFinished" />
    </div>

    <div class="ia-sidebar">
      <div class="scoreboard">
        <h3>Marcador Desafío</h3>
        <p>Tú: {{ playerScore }} | IA: {{ iaScore }}</p>
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
import { ref } from "vue"; // Necesitamos 'ref' para las puntuaciones
import PiedraPapelTijera from "../components/MiniGames/PiedraPapelTijera.vue"; // <-- Importa tu componente

export default {
  name: "GameView",
  components: {
    PiedraPapelTijera, // <-- Declara el componente para que Vue lo reconozca en el template
  },
  setup() {
    // --- Datos Reactivos del Marcador Global ---
    // 'playerScore' y 'iaScore' guardarán las victorias en este desafío global.
    const playerScore = ref(0);
    const iaScore = ref(0);

    // --- Métodos (Lógica Principal del Juego) ---
    // Este método se ejecutará cuando el componente PiedraPapelTijera emita 'round-finished'.
    // 'payload' contendrá el objeto que enviamos ({ winner: 'player' | 'ia' | 'tie' }).
    const handleRoundFinished = (payload) => {
      console.log("Ronda terminada:", payload); // Para depurar en la consola (Ctrl+Shift+I en Electron)

      if (payload.winner === "player") {
        playerScore.value++; // Incrementa la puntuación del jugador.
        console.log("¡Ganó el jugador! Puntuación:", playerScore.value);
      } else if (payload.winner === "ia") {
        iaScore.value++; // Incrementa la puntuación de la IA.
        console.log("¡Ganó la IA! Puntuación:", iaScore.value);
      } else {
        console.log("Ronda empatada."); // No incrementa puntuación en empate.
      }

      // TODO: Aquí en el futuro, podrías añadir lógica para:
      // 1. Decidir si el desafío global ha terminado (ej. "el primero en ganar 3 mini-juegos").
      // 2. Cargar el siguiente mini-juego.
      // 3. Manejar los eventos sorpresa de la IA.
    };

    // 'setup' debe devolver todo lo que quieres que esté disponible en el template.
    return {
      playerScore,
      iaScore,
      handleRoundFinished,
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
</style>
