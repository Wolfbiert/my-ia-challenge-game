<template>
  <div class="simon-dice-game-container">
    <h2>Simón Dice</h2>
    <p class="round-info">Ronda Interna: {{ currentSimonRound }}</p>
    <p class="game-message" :class="messageType">{{ gameMessage }}</p>

    <div class="simon-buttons-grid">
      <div
        v-for="(color, index) in colors"
        :key="color"
        :class="[
          'simon-button',
          color,
          {
            'active-glow': activeLight === color,
            clickable: isPlayerTurn && !isShowingSequence,
          },
        ]"
        @click="handlePlayerClick(index)"
      ></div>
    </div>

    <button
      v-if="!gameStarted && !gameOver"
      @click="startGame"
      class="start-button"
    >
      ¡Empezar!
    </button>

    <button v-if="gameOver" @click="resetGame" class="reset-button">
      Jugar Otra Vez
    </button>
  </div>
</template>

<script>
import { ref, onMounted, watch, markRaw } from "vue"; // Añadimos 'watch' si aún no está

export default {
  name: "SimonDice",
  emits: ["round-finished"],
  props: {
    // <--- ¡NUEVA SECCIÓN DE PROPS!
    difficulty: {
      type: String,
      default: "normal", // Valor por defecto si no se pasa la prop
      validator: (value) => ["facil", "normal", "dificil"].includes(value),
    },
  },

  setup(props, { emit }) {
    // --- Configuración del Juego (ahora dependiente de la dificultad) ---
    const colors = ["red", "blue", "green", "yellow"];
    let initialSequenceLength = 0;
    let roundsToWinSimon = 0;
    let lightDuration = 0; // Duración de la luz para la secuencia de la IA
    let pauseBetweenLights = 0; // Pausa entre luces de la secuencia de la IA

    // Función para configurar los parámetros del juego según la dificultad
    const setGameParameters = (difficulty) => {
      switch (difficulty) {
        case "facil":
          initialSequenceLength = 2;
          roundsToWinSimon = 2; // Gana Simon Dice más rápido
          lightDuration = 800; // Luces más largas
          pauseBetweenLights = 400; // Pausas más largas
          break;
        case "normal":
          initialSequenceLength = 3;
          roundsToWinSimon = 3;
          lightDuration = 600;
          pauseBetweenLights = 300;
          break;
        case "dificil":
          initialSequenceLength = 4;
          roundsToWinSimon = 4; // Más rondas para ganar
          lightDuration = 400; // Luces más cortas
          pauseBetweenLights = 200; // Pausas más cortas
          break;
        default: // Por si acaso, si no se pasa nada válido
          setGameParameters("normal"); // Vuelve a normal
          return;
      }
      // Asegurarse de que el juego se reinicie con la nueva dificultad si ya se está jugando
      if (gameStarted.value || gameOver.value) {
        resetGame();
        startGame(); // Reinicia el juego con los nuevos parámetros
      } else {
        // Si el juego no ha empezado, solo prepara el estado inicial
        resetGame();
      }
    };

    // --- NUEVO: Objetos de Audio ---
    // Creamos objetos de Audio una sola vez para cada color
    // Usamos 'markRaw' porque los objetos Audio no necesitan ser reactivos y
    // Vue podría intentar convertirlos de forma ineficiente.
    const audioMap = markRaw({
      red: new Audio(process.env.BASE_URL + "sounds/red.mp3"),
      blue: new Audio(process.env.BASE_URL + "sounds/blue.mp3"),
      green: new Audio(process.env.BASE_URL + "sounds/green.mp3"),
      yellow: new Audio(process.env.BASE_URL + "sounds/yellow.mp3"),
    });

    // Función para reproducir el sonido de un color
    const playSound = (color) => {
      if (audioMap[color]) {
        audioMap[color].currentTime = 0; // Reinicia el sonido si ya se está reproduciendo
        audioMap[color]
          .play()
          .catch((e) => console.error("Error al reproducir audio:", e));
      }
    };

    // --- Datos Reactivos del Estado del Juego (resto del setup es igual) ---
    const gameStarted = ref(false);
    const gameOver = ref(false);
    const gameMessage = ref('Presiona "¡Empezar!" para jugar.');
    const messageType = ref("info");

    const sequence = ref([]);
    const playerSequence = ref([]);
    const isShowingSequence = ref(false);
    const isPlayerTurn = ref(false);
    const activeLight = ref(null);

    const currentSimonRound = ref(1);

    // --- Lógica del Juego (modificada para sonidos) ---
    const addRandomStepToSequence = () => {
      const randomColorIndex = Math.floor(Math.random() * colors.length);
      sequence.value.push(colors[randomColorIndex]);
    };

    const showSequence = async () => {
      isShowingSequence.value = true;
      isPlayerTurn.value = false;
      gameMessage.value = "¡Memoriza la secuencia!";
      messageType.value = "info";
      playerSequence.value = [];

      await new Promise((resolve) => setTimeout(resolve, 500));

      for (let i = 0; i < sequence.value.length; i++) {
        activeLight.value = sequence.value[i];
        playSound(sequence.value[i]); // <--- ¡Reproducir sonido aquí!
        await new Promise((resolve) => setTimeout(resolve, lightDuration));
        activeLight.value = null;
        await new Promise((resolve) => setTimeout(resolve, pauseBetweenLights));
      }

      isShowingSequence.value = false;
      isPlayerTurn.value = true;
      gameMessage.value = "¡Tu turno! Repite la secuencia.";
      messageType.value = "info";
    };

    const handlePlayerClick = (index) => {
      if (!isPlayerTurn.value || isShowingSequence.value || gameOver.value)
        return;

      const clickedColor = colors[index];
      playerSequence.value.push(clickedColor);
      playSound(clickedColor); // <--- ¡Reproducir sonido al clic del jugador!

      if (
        playerSequence.value[playerSequence.value.length - 1] !==
        sequence.value[playerSequence.value.length - 1]
      ) {
        gameMessage.value = `¡Secuencia incorrecta! Perdiste el mini-juego en la ronda ${currentSimonRound.value}.`;
        messageType.value = "error";
        gameOver.value = true;
        isPlayerTurn.value = false;
        emit("round-finished", { winner: "ia" });
        return;
      }

      if (playerSequence.value.length === sequence.value.length) {
        gameMessage.value = "¡Correcto! Preparando la siguiente ronda...";
        messageType.value = "success";
        isPlayerTurn.value = false;

        setTimeout(() => {
          currentSimonRound.value++;
          if (currentSimonRound.value > roundsToWinSimon) {
            gameMessage.value = "¡Has completado el desafío de Simón Dice!";
            gameOver.value = true;
            emit("round-finished", { winner: "player" });
          } else {
            addRandomStepToSequence();
            showSequence();
          }
        }, 1500);
      }
    };

    const startGame = () => {
      gameStarted.value = true;
      gameOver.value = false;
      currentSimonRound.value = 1;
      sequence.value = [];

      for (let i = 0; i < initialSequenceLength; i++) {
        // Usa la longitud inicial configurada
        addRandomStepToSequence();
      }

      showSequence();
    };

    const resetGame = () => {
      gameStarted.value = false;
      gameOver.value = false;
      gameMessage.value = 'Presiona "¡Empezar!" para jugar.';
      messageType.value = "info";
      currentSimonRound.value = 1;
      sequence.value = [];
      playerSequence.value = [];
      isShowingSequence.value = false;
      isPlayerTurn.value = false;
      activeLight.value = null;
    };

    // --- Lifecycle Hooks y Watchers ---
    onMounted(() => {
      // Configura los parámetros iniciales de acuerdo a la prop 'difficulty' al montarse
      setGameParameters(props.difficulty);
    });

    // Observa los cambios en la prop 'difficulty' y reconfigura el juego
    watch(
      () => props.difficulty,
      (newDifficulty) => {
        setGameParameters(newDifficulty);
      }
    );

    return {
      colors,
      gameStarted,
      gameOver,
      gameMessage,
      messageType,
      sequence,
      playerSequence,
      isShowingSequence,
      isPlayerTurn,
      activeLight,
      currentSimonRound,
      startGame,
      handlePlayerClick,
      resetGame,
    };
  },
};
</script>

<style scoped>
.simon-dice-game-container {
  background-color: #e8f5e9; /* Un verde muy claro para este juego */
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 600px;
  margin: auto;
  color: #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 450px; /* Para asegurar que tenga suficiente espacio */
}

h2 {
  color: #3f51b5; /* Azul índigo para el título */
  margin-bottom: 15px;
  font-size: 2.5em;
}

.round-info {
  font-size: 1.2em;
  font-weight: bold;
  color: #666;
  margin-bottom: 20px;
}

.game-message {
  font-size: 1.5em;
  font-weight: bold;
  margin: 25px 0;
  padding: 10px 20px;
  border-radius: 8px;
  background-color: #e3f2fd; /* Default info color */
  min-height: 2em; /* Para evitar saltos cuando el texto cambia */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80%;
}

.game-message.info {
  color: #1976d2; /* Azul para info */
  background-color: #e3f2fd;
}

.game-message.success {
  color: #388e3c; /* Verde oscuro para éxito */
  background-color: #c8e6c9;
}

.game-message.error {
  color: #d32f2f; /* Rojo oscuro para error */
  background-color: #ffcdd2;
}

/* Contenedor de la cuadrícula de botones de Simón */
.simon-buttons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 columnas iguales */
  grid-template-rows: repeat(2, 1fr); /* 2 filas iguales */
  gap: 20px; /* Espacio entre los botones */
  width: 300px; /* Tamaño del área de juego de Simon */
  height: 300px;
  margin: 30px auto;
  perspective: 1000px; /* Para efectos 3D si se quieren */
}

.simon-button {
  width: 100%;
  height: 100%;
  border-radius: 15px; /* Bordes redondeados */
  cursor: default; /* Por defecto no es clicable */
  transition: background-color 0.2s ease-out, transform 0.1s ease-out,
    box-shadow 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Colores base para cada botón */
.simon-button.red {
  background-color: #ff5252;
} /* Rojo */
.simon-button.blue {
  background-color: #2196f3;
} /* Azul */
.simon-button.green {
  background-color: #4caf50;
} /* Verde */
.simon-button.yellow {
  background-color: #ffeb3b;
} /* Amarillo */

/* Estado de luz activa para la IA */
.simon-button.active-glow {
  filter: brightness(1.5); /* Más brillo */
  transform: scale(1.05); /* Ligeramente más grande */
  box-shadow: 0 0 25px 5px rgba(255, 255, 255, 0.8),
    0 0 15px 5px var(--active-color); /* Doble brillo */
  /* Usaremos JS para establecer --active-color en el estilo del elemento */
}
.simon-button.red.active-glow {
  --active-color: #ff5252;
}
.simon-button.blue.active-glow {
  --active-color: #2196f3;
}
.simon-button.green.active-glow {
  --active-color: #4caf50;
}
.simon-button.yellow.active-glow {
  --active-color: #ffeb3b;
}

/* Cuando el jugador puede hacer clic */
.simon-button.clickable {
  cursor: pointer;
}

.simon-button.clickable:active {
  transform: scale(0.95); /* Efecto de "presionar" */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Botones de control del juego */
.start-button,
.reset-button {
  padding: 12px 30px;
  font-size: 1.4em;
  font-weight: bold;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.start-button {
  background-color: #4caf50; /* Verde iniciar */
  color: white;
}
.start-button:hover {
  background-color: #388e3c;
  transform: translateY(-2px);
}
.start-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.reset-button {
  background-color: #f44336; /* Rojo reiniciar */
  color: white;
}
.reset-button:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
}
.reset-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
