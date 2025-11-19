<template>
  <div class="simon-container">
    <div class="game-header">
      <h2 class="neon-title">SIMON_SAYS</h2>
      <div class="round-counter">
        <span>RONDA</span>
        <span class="round-val">{{ currentRoundNumber }}</span>
      </div>
    </div>

    <div
      class="simon-board"
      :class="{ locked: isShowingSequence }"
      ref="boardRef"
    >
      <div
        class="simon-btn green"
        ref="btnGreen"
        @mousedown="handleInput('green')"
        @mouseup="releaseInput()"
        @mouseleave="releaseInput()"
      ></div>
      <div
        class="simon-btn red"
        ref="btnRed"
        @mousedown="handleInput('red')"
        @mouseup="releaseInput()"
        @mouseleave="releaseInput()"
      ></div>
      <div
        class="simon-btn yellow"
        ref="btnYellow"
        @mousedown="handleInput('yellow')"
        @mouseup="releaseInput()"
        @mouseleave="releaseInput()"
      ></div>
      <div
        class="simon-btn blue"
        ref="btnBlue"
        @mousedown="handleInput('blue')"
        @mouseup="releaseInput()"
        @mouseleave="releaseInput()"
      ></div>

      <div class="center-hub">
        <div class="hub-label">AI-CORE</div>
      </div>
    </div>

    <div class="controls">
      <button
        v-if="!gameStarted && !gameOver"
        @click="startGame"
        class="neon-btn start"
      >
        INICIAR SECUENCIA
      </button>
      <button v-if="gameOver" @click="resetGame" class="neon-btn retry">
        REINICIAR SISTEMA
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, markRaw } from "vue";
import { Howl } from "howler";
import useGameOrchestrator from "@/composables/useGameOrchestrator";
import gsap from "gsap";
import confetti from "canvas-confetti";

export default {
  name: "SimonDice",
  emits: ["round-finished"],
  props: {
    difficulty: { type: String, default: "normal" },
    aiModifiers: { type: Object, default: () => ({}) },
  },
  setup(props, { emit }) {
    const { handleGameMessage } = useGameOrchestrator();

    // Refs para GSAP
    const boardRef = ref(null);
    const btnGreen = ref(null);
    const btnRed = ref(null);
    const btnYellow = ref(null);
    const btnBlue = ref(null);

    // MAPA DE COLORES NEÓN (Ajustados para máximo brillo)
    const colorConfig = {
      // Green -> Lime Green (más brillante)
      green: { ref: btnGreen, color: "#39ff14" },
      // Red -> Fluorescent Red
      red: { ref: btnRed, color: "#ff073a" },
      // Yellow -> Electric Yellow
      yellow: { ref: btnYellow, color: "#fff01f" },
      // Blue -> Cyan / Electric Blue (El azul puro #0000ff es muy oscuro)
      blue: { ref: btnBlue, color: "#00f3ff" },
    };
    const colors = ["green", "red", "yellow", "blue"];

    // Estado
    const gameStarted = ref(false);
    const gameOver = ref(false);
    const sequence = ref([]);
    const playerSequence = ref([]);
    const isShowingSequence = ref(false);
    const isPlayerTurn = ref(false);

    // CORRECCIÓN LÓGICA: Esta es la ronda del juego (1, 2, 3...)
    const currentRoundNumber = ref(1);
    // Esta es la longitud de la secuencia interna (depende de la dificultad)
    let currentSequenceLength = 0;

    const activeLight = ref(null);

    // Parámetros dinámicos
    let initialSequenceLength = 0;
    let roundsToWinSimon = 0;
    const lightDuration = ref(0);
    const pauseBetweenLights = ref(0);
    let nonRepeatingSequenceActive = false; // Ya no es ref

    // Sonidos
    const soundMap = markRaw({
      green: new Howl({ src: [process.env.BASE_URL + "sounds/green.mp3"] }),
      red: new Howl({ src: [process.env.BASE_URL + "sounds/red.mp3"] }),
      yellow: new Howl({ src: [process.env.BASE_URL + "sounds/yellow.mp3"] }),
      blue: new Howl({ src: [process.env.BASE_URL + "sounds/blue.mp3"] }),
      error: new Howl({ src: [process.env.BASE_URL + "sounds/gameover.mp3"] }),
      win: new Howl({ src: [process.env.BASE_URL + "sounds/win.mp3"] }),
    });

    // --- ANIMACIONES GSAP ---

    const animatePress = (color) => {
      const el = colorConfig[color].ref.value;
      gsap.fromTo(
        el,
        {
          backgroundColor: colorConfig[color].color,
          boxShadow: `0 0 20px ${colorConfig[color].color}, 0 0 60px ${colorConfig[color].color}`,
          scale: 0.95,
          filter: "brightness(1.3)",
        },
        {
          backgroundColor: "", // Vuelve al color base CSS
          boxShadow: "none",
          scale: 1,
          filter: "brightness(1)",
          duration: 0.4,
          ease: "power2.out",
        }
      );
    };

    const animateSequenceStep = (color) => {
      const el = colorConfig[color].ref.value;
      gsap.fromTo(
        el,
        {
          backgroundColor: colorConfig[color].color,
          boxShadow: `0 0 30px ${colorConfig[color].color}, 0 0 80px ${colorConfig[color].color}`,
          scale: 1.05,
          filter: "brightness(1.5)",
        },
        {
          backgroundColor: "", // Vuelve al color base CSS
          boxShadow: "none",
          scale: 1,
          filter: "brightness(1)",
          duration: lightDuration.value / 1000,
          ease: "power1.out",
        }
      );
    };

    const animateError = () => {
      gsap.to(boardRef.value, {
        x: -10,
        duration: 0.05,
        repeat: 5,
        yoyo: true,
      });
      gsap.to(".simon-btn", {
        backgroundColor: "#ff0000",
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        onComplete: () => {
          gsap.to(".simon-btn", { backgroundColor: "" });
        },
      });
    };

    const animateWin = () => {
      const tl = gsap.timeline();
      tl.to([btnGreen.value, btnRed.value, btnBlue.value, btnYellow.value], {
        backgroundColor: (i, el) => {
          if (el === btnGreen.value) return colorConfig.green.color;
          if (el === btnRed.value) return colorConfig.red.color;
          if (el === btnBlue.value) return colorConfig.blue.color;
          return colorConfig.yellow.color;
        },
        duration: 0.1,
        stagger: 0.1,
        repeat: 2,
        yoyo: true,
        onComplete: () => {
          gsap.to(".simon-btn", { backgroundColor: "" });
        },
      });
    };

    // --- LÓGICA DEL JUEGO ---

    const setGameParameters = (difficulty, modifiers = {}) => {
      let base = { len: 2, win: 2, light: 800, pause: 400 };
      if (difficulty === "normal")
        base = { len: 3, win: 3, light: 600, pause: 300 };
      if (difficulty === "dificil")
        base = { len: 4, win: 4, light: 400, pause: 200 };

      if (modifiers.sequenceDifficulty) {
        base.len = Math.max(
          1,
          Math.round(base.len * modifiers.sequenceDifficulty.length)
        );
        base.light = Math.max(
          50,
          Math.round(base.light * modifiers.sequenceDifficulty.speed)
        );
        base.pause = Math.max(
          50,
          Math.round(base.pause * modifiers.sequenceDifficulty.speed)
        );
      }
      if (modifiers.extremeSequence) {
        base.len = Math.max(
          1,
          Math.round(base.len * modifiers.extremeSequence.length)
        );
        base.light = Math.max(
          50,
          Math.round(base.light * modifiers.extremeSequence.speed)
        );
        base.pause = Math.max(
          50,
          Math.round(base.pause * modifiers.extremeSequence.speed)
        );
      }

      initialSequenceLength = base.len;
      roundsToWinSimon = base.win;
      lightDuration.value = base.light;
      pauseBetweenLights.value = base.pause;
      nonRepeatingSequenceActive = modifiers.nonRepeatingSequence || false; // Asignación directa
    };

    const playSound = (color) => {
      if (soundMap[color]) soundMap[color].play();
    };

    const generateSequence = (length) => {
      const newSeq = [];
      for (let i = 0; i < length; i++)
        newSeq.push(colors[Math.floor(Math.random() * 4)]);
      return newSeq;
    };

    const addStep = () => {
      // CORRECCIÓN LÓGICA: Añade un paso a la secuencia, o genera una nueva de la misma longitud si es no repetitiva.
      // La longitud de la secuencia debe ir aumentando con cada ronda.
      currentSequenceLength++;
      if (nonRepeatingSequenceActive) {
        sequence.value = generateSequence(currentSequenceLength);
      } else {
        sequence.value.push(colors[Math.floor(Math.random() * 4)]);
      }
    };

    const showSequence = async () => {
      isShowingSequence.value = true;
      isPlayerTurn.value = false;
      playerSequence.value = [];
      handleGameMessage(
        `MEMORIZA: Secuencia de nivel ${currentRoundNumber.value}`,
        "thinking"
      ); // Muestra la ronda del juego
      await new Promise((r) => setTimeout(r, 1000));

      for (const color of sequence.value) {
        playSound(color);
        animateSequenceStep(color);
        await new Promise((r) =>
          setTimeout(r, lightDuration.value + pauseBetweenLights.value)
        );
      }

      isShowingSequence.value = false;
      isPlayerTurn.value = true;
      handleGameMessage("TU TURNO: Replica el patrón.", "normal");
    };

    const handleInput = (color) => {
      if (!isPlayerTurn.value) return;
      playSound(color);
      animatePress(color);

      playerSequence.value.push(color);
      const index = playerSequence.value.length - 1;

      if (playerSequence.value[index] !== sequence.value[index]) {
        isPlayerTurn.value = false;
        gameOver.value = true;
        if (soundMap.error) soundMap.error.play();
        animateError();
        handleGameMessage(
          "¡ERROR DE SISTEMA! Secuencia incorrecta.",
          "sad",
          true
        );
        emit("round-finished", { playerScore: 0, iaScore: 1 });
        return;
      }

      if (playerSequence.value.length === sequence.value.length) {
        isPlayerTurn.value = false;
        // CORRECCIÓN LÓGICA: Comparamos con roundsToWinSimon para determinar la victoria
        if (currentRoundNumber.value >= roundsToWinSimon) {
          handleGameMessage(
            "¡SINCRO COMPLETA! Has superado a la IA.",
            "happy",
            true
          );
          if (soundMap.win) soundMap.win.play();
          animateWin();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          gameOver.value = true;
          emit("round-finished", { playerScore: 1, iaScore: 0 });
        } else {
          handleGameMessage(
            "Patrón aceptado. Aumentando complejidad...",
            "normal"
          );
          currentRoundNumber.value++; // Avanza a la siguiente ronda del juego
          setTimeout(() => {
            addStep(); // Añade un nuevo paso a la secuencia (ahora más larga)
            showSequence();
          }, 1000);
        }
      }
    };

    const releaseInput = () => {};

    const startGame = () => {
      gameStarted.value = true;
      gameOver.value = false;
      currentRoundNumber.value = 1; // Empieza en la ronda 1 del juego

      setGameParameters(props.difficulty, props.aiModifiers);

      // CORRECCIÓN LÓGICA: Inicializa la longitud de la secuencia
      currentSequenceLength = initialSequenceLength;

      if (nonRepeatingSequenceActive) {
        sequence.value = generateSequence(currentSequenceLength);
      } else {
        sequence.value = [];
        for (let i = 0; i < currentSequenceLength; i++) {
          sequence.value.push(colors[Math.floor(Math.random() * 4)]);
        }
      }
      showSequence();
    };

    const resetGame = () => {
      gameStarted.value = false;
      gameOver.value = false;
      handleGameMessage("Sistema listo. Iniciar secuencia.", "normal");
      currentRoundNumber.value = 1; // Vuelve a la ronda 1
      currentSequenceLength = 0; // Reinicia la longitud de la secuencia
      sequence.value = [];
      playerSequence.value = [];
      setGameParameters(props.difficulty, props.aiModifiers); // Resetea parámetros por si la dificultad cambió
    };

    onMounted(() => {
      setGameParameters(props.difficulty, props.aiModifiers);
    });
    watch(
      () => [props.difficulty, props.aiModifiers],
      () => {
        resetGame();
      },
      { deep: true }
    );

    return {
      colors,
      gameStarted,
      gameOver,
      isShowingSequence,
      isPlayerTurn,
      activeLight,
      currentRoundNumber, // Renombrado para claridad
      startGame,
      resetGame,
      handleInput,
      releaseInput,
      boardRef,
      btnGreen,
      btnRed,
      btnYellow,
      btnBlue,
    };
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap");

.simon-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* ELIMINADO EL FONDO DEL COMPONENTE para que se fusione con el principal */
  /* background: radial-gradient(circle at center, #1a0b2e 0%, #000000 100%); */
  font-family: "Orbitron", sans-serif;
  color: #fff; /* Texto blanco para el fondo oscuro general */
  padding: 20px; /* Un poco de padding si el contenedor principal no lo tiene */
}

.game-header {
  margin-bottom: 20px;
  text-align: center;
}
.neon-title {
  font-size: 2.5rem;
  text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
  margin: 0;
}
.round-counter {
  font-size: 1.2rem;
  color: #aaa;
  margin-top: 5px;
}
.round-val {
  color: #00ffff;
  font-weight: bold;
  font-size: 1.5rem;
  margin-left: 5px;
}

/* --- TABLERO SIMON --- */
.simon-board {
  position: relative;
  width: 320px;
  height: 320px;
  /* Fondo del tablero más sutil, sin sombra principal para fusionar */
  background: rgba(0, 0, 0, 0.5); /* Semi-transparente */
  border-radius: 50%;
  padding: 15px;
  /* box-shadow: 0 0 50px rgba(0,0,0,0.8), inset 0 0 20px #000; */ /* Eliminado */
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px;
  border: 2px solid rgba(0, 255, 255, 0.2); /* Borde sutil neón */
}

.simon-board.locked {
  opacity: 0.8;
  cursor: wait;
}

.simon-btn {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  cursor: pointer;
  transition: filter 0.1s;
  position: relative;
  /* Borde ya definido en los colores base para cada botón */
}

.simon-btn:active {
  transform: scale(0.98);
}

/* Colores Base (Apagados - ¡AHORA MÁS VISIBLES!) */
.green {
  background: #004400; /* Un verde oscuro pero distinguible */
  border-top-left-radius: 100%;
  border: 2px solid #006600; /* Borde más claro para definición */
}
.red {
  background: #440000;
  border-top-right-radius: 100%;
  border: 2px solid #660000;
}
.yellow {
  background: #444400;
  border-bottom-left-radius: 100%;
  border: 2px solid #666600;
}
.blue {
  background: #000044;
  border-bottom-right-radius: 100%;
  border: 2px solid #000066;
}

/* Centro del Tablero (Hub) */
.center-hub {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: #222;
  border-radius: 50%;
  border: 5px solid #111;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  box-shadow: 0 0 15px #000;
}
.hub-label {
  font-size: 0.7rem;
  color: #555;
  letter-spacing: 1px;
}

/* --- CONTROLES --- */
.controls {
  margin-top: 30px;
}
.neon-btn {
  background: transparent;
  border: 2px solid #00ffff;
  color: #00ffff;
  padding: 10px 30px;
  font-family: "Orbitron", sans-serif;
  font-size: 1.1rem;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
  transition: all 0.3s;
}
.neon-btn:hover {
  background: #00ffff;
  color: #000;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
}
.neon-btn.retry {
  border-color: #ff0055;
  color: #ff0055;
  box-shadow: 0 0 10px rgba(255, 0, 85, 0.2);
}
.neon-btn.retry:hover {
  background: #ff0055;
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.6);
}
</style>
