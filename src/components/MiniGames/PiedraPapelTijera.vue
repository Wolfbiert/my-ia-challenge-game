<template>
  <div class="ppt-game-container">
    <h2>Piedra, Papel o Tijera</h2>

    <div class="player-choices">
      <button @click="makeChoice('piedra')" class="choice-button">
        Piedra
      </button>
      <button @click="makeChoice('papel')" class="choice-button">Papel</button>
      <button @click="makeChoice('tijera')" class="choice-button">
        Tijera
      </button>
    </div>

    <div v-if="playerChoice" class="results-display">
      <p>Tú elegiste: **{{ playerChoice.toUpperCase() }}**</p>
      <p>La IA eligió: **{{ iaChoice.toUpperCase() }}**</p>
      <h3>¡{{ result }}!</h3>
      <button @click="resetGame" class="reset-button">Jugar Otra Ronda</button>
    </div>
    <div v-else class="waiting-message">
      <p>Haz tu elección...</p>
    </div>
  </div>
</template>

<script>
import { ref } from "vue"; // Importamos 'ref' para crear variables reactivas

export default {
  name: "PiedraPapelTijera",

  // El segundo argumento 'context' nos da acceso a la función 'emit'.
  // Podemos desestructurarlo para usar 'emit' directamente.
  setup(props, { emit }) {
    // <-- ¡CAMBIO AQUÍ!
    // --- Datos Reactivos ---
    const playerChoice = ref(null);
    const iaChoice = ref(null);
    const result = ref("");
    const choices = ["piedra", "papel", "tijera"];

    // --- Métodos (Lógica del Juego) ---
    const makeChoice = (choice) => {
      playerChoice.value = choice;
      iaChoice.value = choices[Math.floor(Math.random() * choices.length)];

      if (playerChoice.value === iaChoice.value) {
        result.value = "Empate";
        // Podemos emitir un evento 'round-finished' incluso para empates si GameView necesita saberlo
        emit("round-finished", { winner: "tie" }); // <-- 'emit' ahora está definido
      } else if (
        (playerChoice.value === "piedra" && iaChoice.value === "tijera") ||
        (playerChoice.value === "papel" && iaChoice.value === "piedra") ||
        (playerChoice.value === "tijera" && iaChoice.value === "papel")
      ) {
        result.value = "Ganaste";
        emit("round-finished", { winner: "player" }); // <-- 'emit' ahora está definido
      } else {
        result.value = "Perdiste";
        emit("round-finished", { winner: "ia" }); // <-- 'emit' ahora está definido
      }
    };

    const resetGame = () => {
      playerChoice.value = null;
      iaChoice.value = null;
      result.value = "";
    };

    return {
      playerChoice,
      iaChoice,
      result,
      makeChoice,
      resetGame,
      choices,
    };
  },

  emits: ["round-finished"],
};
</script>

<style scoped>
/* Estilos para el contenedor principal del mini-juego */
.ppt-game-container {
  background-color: #f4f9f4; /* Un fondo suave para el mini-juego */
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px; /* Limita el ancho del juego */
  margin: auto; /* Centra el contenedor en el área del mini-juego */
}

h2 {
  color: #333;
  margin-bottom: 25px;
}

.player-choices {
  display: flex;
  justify-content: center;
  gap: 20px; /* Espacio entre los botones */
  margin-bottom: 30px;
}

.choice-button {
  padding: 15px 30px;
  font-size: 1.2em;
  font-weight: bold;
  border: none;
  border-radius: 50px; /* Botones muy redondeados */
  cursor: pointer;
  background-color: #84d8a1; /* Un verde vibrante */
  color: white;
  text-transform: uppercase;
  transition: background-color 0.3s ease, transform 0.1s ease; /* Para el efecto al hacer hover/active */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.choice-button:hover {
  background-color: #6ac086;
  transform: translateY(-2px); /* Pequeño efecto de "levantar" */
}

.choice-button:active {
  transform: translateY(0); /* Efecto de "presionar" */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-display {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #e6ffe6; /* Fondo ligero para los resultados */
}

.results-display p {
  font-size: 1.1em;
  margin: 10px 0;
  color: #444;
}

.results-display h3 {
  font-size: 1.8em;
  margin-top: 15px;
  color: #28a745; /* Color para el resultado (puedes cambiarlo según el resultado) */
}

.reset-button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 1em;
  background-color: #007bff; /* Azul para reiniciar */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reset-button:hover {
  background-color: #0056b3;
}

.waiting-message {
  font-style: italic;
  color: #777;
}
</style>
