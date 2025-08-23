<template>
  <div class="simon-dice-game-container">
    <h2>Simón Dice</h2>
    <div
      class="simon-buttons-grid"
      :class="{ 'sequence-playing': isShowingSequence }"
    >
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
import { ref, onMounted, watch, markRaw } from "vue";
import { Howl } from "howler";
import useGameOrchestrator from "@/composables/useGameOrchestrator";

/**
 * @name SimonDice
 * @description Componente del minijuego clásico "Simón Dice".
 * La IA genera y muestra una secuencia de colores que el jugador debe memorizar y repetir.
 * La dificultad y velocidad aumentan con los niveles y pueden ser alteradas por modificadores.
 */
export default {
  name: "SimonDice",
  emits: ["round-finished"], // Evento para notificar al padre sobre el fin del juego
  props: {
    // La dificultad actual del juego, recibida desde GameView
    difficulty: {
      type: String,
      default: "normal",
      validator: (value) => ["facil", "normal", "dificil"].includes(value),
    },
    // Modificadores de la IA activos para esta ronda, recibidos desde GameView
    aiModifiers: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props, { emit }) {
    // Importa la función para enviar mensajes a la IA
    const { handleGameMessage } = useGameOrchestrator();

    // --- Parámetros y Estado del Juego ---
    const colors = ["red", "blue", "green", "yellow"]; // Colores/botones disponibles

    // Parámetros de juego que se configuran según la dificultad
    let initialSequenceLength = 0;
    let roundsToWinSimon = 0;
    const lightDuration = ref(0); // Duración de cada luz en la secuencia
    const pauseBetweenLights = ref(0); // Pausa entre cada luz
    const nonRepeatingSequenceActive = ref(false); // Bandera para el modificador de secuencia no repetitiva

    // Mapa de sonidos para cada color, usando Howler.js
    // 'markRaw' optimiza el rendimiento al evitar que Vue haga reactivo este objeto complejo
    const soundMap = markRaw({
      red: new Howl({ src: [process.env.BASE_URL + "sounds/red.mp3"] }),
      blue: new Howl({ src: [process.env.BASE_URL + "sounds/blue.mp3"] }),
      green: new Howl({ src: [process.env.BASE_URL + "sounds/green.mp3"] }),
      yellow: new Howl({ src: [process.env.BASE_URL + "sounds/yellow.mp3"] }),
    });

    /**
     * Establece los parámetros de juego (velocidad, longitud de secuencia, etc.)
     * basándose en la dificultad y los modificadores de la IA.
     * @param {string} difficulty - La dificultad base.
     * @param {object} modifiers - El objeto de modificadores de la IA.
     */
    const setGameParametersInternal = (difficulty, modifiers = {}) => {
      let baseInitialSequenceLength,
        baseRoundsToWin,
        baseLightDuration,
        basePauseBetweenLights;

      switch (difficulty) {
        case "facil":
          baseInitialSequenceLength = 2;
          baseRoundsToWin = 2;
          baseLightDuration = 800;
          basePauseBetweenLights = 400;
          break;
        case "normal":
          baseInitialSequenceLength = 3;
          baseRoundsToWin = 3;
          baseLightDuration = 600;
          basePauseBetweenLights = 300;
          break;
        case "dificil":
          baseInitialSequenceLength = 4;
          baseRoundsToWin = 4;
          baseLightDuration = 400;
          basePauseBetweenLights = 200;
          break;
        default:
          setGameParametersInternal("normal", modifiers);
          return;
      }

      let actualSequenceLength = baseInitialSequenceLength;
      let actualLightDuration = baseLightDuration;
      let actualPauseBetweenLights = basePauseBetweenLights;

      // Aplica modificadores de la IA si existen
      if (modifiers.sequenceDifficulty) {
        actualSequenceLength = Math.max(
          1,
          Math.round(
            baseInitialSequenceLength * modifiers.sequenceDifficulty.length
          )
        );
        actualLightDuration = Math.max(
          50,
          Math.round(baseLightDuration * modifiers.sequenceDifficulty.speed)
        );
        actualPauseBetweenLights = Math.max(
          50,
          Math.round(
            basePauseBetweenLights * modifiers.sequenceDifficulty.speed
          )
        );
      }
      if (modifiers.extremeSequence) {
        actualSequenceLength = Math.max(
          1,
          Math.round(
            baseInitialSequenceLength * modifiers.extremeSequence.length
          )
        );
        actualLightDuration = Math.max(
          50,
          Math.round(baseLightDuration * modifiers.extremeSequence.speed)
        );
        actualPauseBetweenLights = Math.max(
          50,
          Math.round(basePauseBetweenLights * modifiers.extremeSequence.speed)
        );
      }

      // Asigna los valores finales a las variables de estado
      initialSequenceLength = actualSequenceLength;
      roundsToWinSimon = baseRoundsToWin;
      lightDuration.value = actualLightDuration;
      pauseBetweenLights.value = actualPauseBetweenLights;
      nonRepeatingSequenceActive.value =
        modifiers.nonRepeatingSequence || false;
    };

    // --- Estado Reactivo del Flujo del Juego ---
    const gameStarted = ref(false); // Indica si se ha presionado "Empezar"
    const gameOver = ref(false); // Indica si el juego ha terminado (ganado o perdido)
    const sequence = ref([]); // La secuencia actual generada por la IA
    const playerSequence = ref([]); // La secuencia que el jugador está introduciendo
    const isShowingSequence = ref(false); // true mientras la IA muestra la secuencia (bloquea input)
    const isPlayerTurn = ref(false); // true cuando es el turno del jugador para repetir la secuencia
    const activeLight = ref(null); // Almacena el color que está iluminado en un momento dado

    const currentSimonRound = ref(1); // Ronda actual dentro del minijuego de Simón Dice

    /**
     * Genera una secuencia completamente nueva de una longitud determinada.
     * @param {number} length - La longitud de la secuencia a generar.
     * @returns {string[]} Un array de colores.
     */
    const generateNewSequence = (length) => {
      const newSeq = [];
      for (let i = 0; i < length; i++) {
        const randomColorIndex = Math.floor(Math.random() * colors.length);
        newSeq.push(colors[randomColorIndex]);
      }
      return newSeq;
    };

    /**
     * Decide si añadir un nuevo paso a la secuencia actual o generar una nueva
     * si el modificador 'nonRepeatingSequence' está activo.
     */
    const addStepOrGenerateNew = () => {
      if (nonRepeatingSequenceActive.value) {
        sequence.value = generateNewSequence(currentSimonRound.value);
      } else {
        const randomColorIndex = Math.floor(Math.random() * colors.length);
        sequence.value.push(colors[randomColorIndex]);
      }
    };

    /**
     * Muestra visualmente la secuencia de colores al jugador, un color a la vez.
     */
    const showSequence = async () => {
      isShowingSequence.value = true;
      isPlayerTurn.value = false;
      playerSequence.value = []; // Limpia la secuencia del jugador antes de mostrar la de Simón
      handleGameMessage(
        `Ronda ${currentSimonRound.value}. ¡Memoriza la secuencia!`,
        "thinking"
      );

      await new Promise((resolve) => setTimeout(resolve, 500)); // Pequeña pausa inicial

      // Itera sobre cada color en la secuencia, lo ilumina y reproduce su sonido
      for (let i = 0; i < sequence.value.length; i++) {
        activeLight.value = sequence.value[i];
        soundMap[sequence.value[i]].play();
        await new Promise((resolve) =>
          setTimeout(resolve, lightDuration.value)
        );
        activeLight.value = null;
        await new Promise((resolve) =>
          setTimeout(resolve, pauseBetweenLights.value)
        );
      }

      isShowingSequence.value = false;
      isPlayerTurn.value = true;
      handleGameMessage("¡Tu turno! Repite la secuencia.", "happy");
    };

    /**
     * Gestiona el clic de un jugador en uno de los botones de color.
     * @param {number} index - El índice del color clickeado en el array `colors`.
     */
    const handlePlayerClick = (index) => {
      // Bloquea el input si no es el turno del jugador o el juego terminó
      if (!isPlayerTurn.value || isShowingSequence.value || gameOver.value)
        return;

      const clickedColor = colors[index];
      playerSequence.value.push(clickedColor);
      soundMap[clickedColor].play();

      // Efecto visual rápido para el botón presionado
      const originalLight = activeLight.value;
      activeLight.value = clickedColor;
      setTimeout(() => {
        activeLight.value = originalLight;
      }, 100);

      // Comprueba si el último color presionado es correcto
      if (
        playerSequence.value[playerSequence.value.length - 1] !==
        sequence.value[playerSequence.value.length - 1]
      ) {
        // El jugador se equivocó
        handleGameMessage(
          `¡Secuencia incorrecta! Perdiste en la ronda ${currentSimonRound.value}.`,
          "sad",
          true
        );
        gameOver.value = true;
        isPlayerTurn.value = false;
        emit("round-finished", { playerScore: 0, iaScore: 1 });
        return;
      }

      // Si el jugador completó la secuencia actual correctamente
      if (playerSequence.value.length === sequence.value.length) {
        handleGameMessage(
          "¡Correcto! Preparando la siguiente ronda...",
          "normal"
        );
        isPlayerTurn.value = false;

        // Pausa antes de la siguiente ronda
        setTimeout(() => {
          currentSimonRound.value++;
          if (currentSimonRound.value > roundsToWinSimon) {
            // El jugador ha ganado el minijuego
            handleGameMessage(
              "¡Has completado el desafío de Simón Dice!",
              "happy",
              true
            );
            gameOver.value = true;
            emit("round-finished", { playerScore: 1, iaScore: 0 });
          } else {
            // Continúa a la siguiente ronda del minijuego
            playerSequence.value = [];
            addStepOrGenerateNew();
            showSequence();
          }
        }, 1500);
      }
    };

    /**
     * Inicia el minijuego desde cero.
     */
    const startGame = () => {
      gameStarted.value = true;
      gameOver.value = false;
      currentSimonRound.value = 1;
      handleGameMessage("El juego ha comenzado. ¡Prepárate!", "happy");

      // Establece los parámetros de dificultad y modificadores
      setGameParametersInternal(props.difficulty, props.aiModifiers);

      // Genera la secuencia inicial
      if (nonRepeatingSequenceActive.value) {
        sequence.value = generateNewSequence(initialSequenceLength);
      } else {
        sequence.value = [];
        for (let i = 0; i < initialSequenceLength; i++) {
          const randomColorIndex = Math.floor(Math.random() * colors.length);
          sequence.value.push(colors[randomColorIndex]);
        }
      }

      playerSequence.value = [];
      showSequence();
    };

    /**
     * Resetea el estado del juego a su estado inicial, antes de presionar "Empezar".
     */
    const resetGame = () => {
      gameStarted.value = false;
      gameOver.value = false;
      handleGameMessage('Presiona "¡Empezar!" para jugar.', "normal");
      currentSimonRound.value = 1;
      sequence.value = [];
      playerSequence.value = [];
      isShowingSequence.value = false;
      isPlayerTurn.value = false;
      activeLight.value = null;

      setGameParametersInternal(props.difficulty, props.aiModifiers);
    };

    /**
     * Hook de ciclo de vida: se ejecuta cuando el componente se monta.
     */
    onMounted(() => {
      setGameParametersInternal(props.difficulty, props.aiModifiers);
    });

    /**
     * Observador: resetea o reinicia el juego si la dificultad o los modificadores cambian desde el padre.
     */
    watch(
      () => [props.difficulty, props.aiModifiers],
      ([newDifficulty, newModifiers]) => {
        const wasGameStarted = gameStarted.value;
        const wasGameOver = gameOver.value;
        setGameParametersInternal(newDifficulty, newModifiers);
        if (wasGameStarted || wasGameOver) {
          resetGame();
          if (wasGameStarted && !wasGameOver) {
            startGame();
          }
        }
      },
      { deep: true }
    );

    // Expone las variables y funciones necesarias para el <template>
    return {
      colors,
      gameStarted,
      gameOver,
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
/* (The CSS remains the same) */
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

/* Añadir clase al grid de botones cuando la secuencia se está mostrando */
.simon-buttons-grid.sequence-playing {
  pointer-events: none; /* Deshabilita clics en el contenedor */
  opacity: 0.7; /* Reduce la opacidad para indicar inactividad */
  filter: blur(1px); /* Efecto de desenfoque sutil */
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.simon-button {
  /* ... (existing styles) ... */
  transition: background-color 0.2s ease-out, transform 0.1s ease-out,
    box-shadow 0.2s ease, filter 0.2s ease;
}

/* Añadir un efecto de click para el jugador, distinto al brillo de la IA */
.simon-button.clickable:active {
  transform: scale(0.92); /* Ligeramente más pequeño que el 0.95 anterior */
  box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.5),
    inset 0 0 10px 3px rgba(0, 0, 0, 0.3); /* Nuevo efecto de sombra interna */
}
</style>
