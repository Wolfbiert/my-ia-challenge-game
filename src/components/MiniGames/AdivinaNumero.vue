<template>
  <div class="hacker-wrapper">
    <div class="hacker-container" ref="containerRef">
      <h2 class="terminal-title">>> SYSTEM_HACK: GUESS_NUM</h2>

      <div class="number-display">
        <span class="label">TARGET_ID:</span>
        <span class="value" :class="{ 'is-revealed': isRevealed }">
          {{ displayValue }}
        </span>
      </div>

      <div class="mission-data">
        <div class="data-row">
          <span class="data-label">SEARCH_RANGE:</span>
          <span class="data-val"
            >[{{ currentMinRange }} - {{ currentMaxRange }}]</span
          >
        </div>
        <div class="data-row">
          <span class="data-label">STATUS:</span>
          <span class="data-val" v-if="gameState === 'playing'">ENCRYPTED</span>
          <span class="data-val error" v-else-if="result === 'lost'"
            >BREACH_FAILED</span
          >
          <span class="data-val success" v-else>ACCESS_GRANTED</span>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-label">
          ATTEMPTS_LOG: {{ attempts }} / {{ currentMaxAttempts }}
        </div>
        <div class="progress-track">
          <div class="progress-fill" ref="progressBarRef"></div>
        </div>
      </div>

      <div class="input-section">
        <div class="input-wrapper">
          <span class="prompt">></span>
          <input
            type="number"
            v-model.number="playerGuess"
            @keyup.enter="checkGuess"
            :disabled="gameState === 'gameOver'"
            autocomplete="off"
            class="hack-input"
          />
          <button
            @click="checkGuess"
            :disabled="gameState === 'gameOver'"
            class="hack-button"
          >
            [ EXECUTE ]
          </button>
        </div>
        <div class="input-hint" v-if="gameState === 'playing'">
          >> INGRESE CÓDIGO ENTRE {{ currentMinRange }} Y {{ currentMaxRange }}
        </div>
      </div>

      <button @click="resetGame" class="reset-button">[ REBOOT_SYSTEM ]</button>

      <div v-if="guessHistory.length > 0" class="console-log">
        <h3>>> SYSTEM_LOGS:</h3>
        <TransitionGroup tag="ul" @enter="onEnterLog" class="log-list">
          <li
            v-for="(item, index) in guessHistory"
            :key="index"
            :data-index="index"
            class="log-entry"
          >
            <span class="log-time"
              >[{{
                new Date().toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }}]</span
            >
            <span class="log-val">TRY: {{ item.guess }}</span>
            <span class="log-msg"> >> {{ item.hint }}</span>
          </li>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from "vue";
import useGameOrchestrator from "@/composables/useGameOrchestrator";
import gsap from "gsap";

export default {
  name: "AdivinaNumero",
  emits: ["round-finished"],
  props: {
    difficulty: {
      type: String,
      default: "normal",
      validator: (value) => ["facil", "normal", "dificil"].includes(value),
    },
    aiModifiers: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const { handleGameMessage } = useGameOrchestrator();

    const containerRef = ref(null);
    const progressBarRef = ref(null);

    const randomNumber = ref(0);
    const playerGuess = ref(null);
    const attempts = ref(0);
    const guessHistory = ref([]);
    const gameState = ref("playing");
    const resultState = ref(""); // 'won' o 'lost' para estilos

    // Ya no usamos hints variables en variables separadas para la UI principal,
    // usamos los rangos reales para el display 'SEARCH_RANGE'
    const currentMaxAttempts = ref(0);
    const currentMinRange = ref(0);
    const currentMaxRange = ref(0);

    const invertHintsActive = ref(false);
    const dynamicRangeShiftActive = ref(false);

    const displayValue = ref("000");
    const isRevealed = ref(false);
    let rollingInterval = null;

    const setGameParameters = (difficulty, modifiers = {}) => {
      let baseMinRange, baseMaxRange, baseMaxAttempts;

      switch (difficulty) {
        case "facil":
          baseMinRange = 1;
          baseMaxRange = 10;
          baseMaxAttempts = 5;
          break;
        case "normal":
          baseMinRange = 1;
          baseMaxRange = 20;
          baseMaxAttempts = 7;
          break;
        case "dificil":
          baseMinRange = 1;
          baseMaxRange = 30;
          baseMaxAttempts = 8;
          break;
        default:
          baseMinRange = 1;
          baseMaxRange = 20;
          baseMaxAttempts = 7;
          break;
      }

      currentMinRange.value =
        modifiers.minRange !== undefined ? modifiers.minRange : baseMinRange;
      currentMaxRange.value =
        modifiers.maxRange !== undefined ? modifiers.maxRange : baseMaxRange;

      if (currentMinRange.value >= currentMaxRange.value) {
        currentMaxRange.value = currentMinRange.value + 5;
      }

      currentMaxAttempts.value = baseMaxAttempts + (modifiers.maxAttempts || 0);
      if (currentMaxAttempts.value <= 0) currentMaxAttempts.value = 1;

      if (modifiers.narrowRange) {
        const midPoint = Math.floor(
          (currentMinRange.value + currentMaxRange.value) / 2
        );
        const rangeAdjustment = Math.floor(
          (currentMaxRange.value - currentMinRange.value) * 0.15
        );
        currentMinRange.value = Math.max(
          currentMinRange.value,
          midPoint - rangeAdjustment
        );
        currentMaxRange.value = Math.min(
          currentMaxRange.value,
          midPoint + rangeAdjustment
        );
        if (currentMinRange.value >= currentMaxRange.value) {
          currentMaxRange.value = currentMinRange.value + 5;
        }
      }

      invertHintsActive.value = modifiers.invertHints || false;
      dynamicRangeShiftActive.value = modifiers.dynamicRangeShift || false;

      initializeGame();
    };

    const generateRandomNumber = () => {
      randomNumber.value =
        Math.floor(
          Math.random() * (currentMaxRange.value - currentMinRange.value + 1)
        ) + currentMinRange.value;
    };

    // --- LÓGICA DE NÚMEROS RODANTES ---
    const startRolling = () => {
      if (rollingInterval) clearInterval(rollingInterval);
      isRevealed.value = false;
      // Intervalo rápido para cambiar el número
      rollingInterval = setInterval(() => {
        // Generar número aleatorio dentro del rango VISUALMENTE
        const val =
          Math.floor(
            Math.random() * (currentMaxRange.value - currentMinRange.value + 1)
          ) + currentMinRange.value;
        // Formatear con ceros a la izquierda si es necesario para que se vea "tech"
        displayValue.value = val.toString().padStart(2, "0");
      }, 60); // Cambia cada 60ms
    };

    const stopRolling = (targetNumber) => {
      clearInterval(rollingInterval);
      rollingInterval = null;
      displayValue.value = targetNumber.toString();
      isRevealed.value = true;

      // Pequeño efecto de "zoom" al detenerse
      const targetEl = document.querySelector(".number-display .value");
      if (targetEl) {
        gsap.fromTo(
          targetEl,
          { scale: 1.5, color: "#fff" },
          {
            scale: 1,
            color: resultState.value === "won" ? "#ffff00" : "#ff0000",
            duration: 0.5,
            ease: "back.out",
          }
        );
      }
    };
    // ----------------------------------

    const initializeGame = () => {
      generateRandomNumber();
      playerGuess.value = null;

      // Mensaje inicial de la IA (ahora más corto ya que la info está en pantalla)
      handleGameMessage(
        "Sistema de seguridad activo. Inicie el descifrado.",
        "normal"
      );

      attempts.value = 0;
      guessHistory.value = [];
      gameState.value = "playing";
      resultState.value = "";

      if (progressBarRef.value) {
        gsap.to(progressBarRef.value, {
          width: "0%",
          duration: 0.5,
          ease: "power2.out",
        });
      }

      // Iniciar el efecto visual
      startRolling();
    };

    // Animaciones (Igual que antes)
    const triggerShake = () => {
      if (containerRef.value) {
        gsap.fromTo(
          containerRef.value,
          { x: -10 },
          {
            x: 10,
            duration: 0.05,
            repeat: 5,
            yoyo: true,
            ease: "none",
            onComplete: () =>
              gsap.to(containerRef.value, { x: 0, duration: 0.1 }),
          }
        );
      }
    };

    const onEnterLog = (el, done) => {
      gsap.fromTo(
        el,
        { opacity: 0, x: -20, height: 0 },
        {
          opacity: 1,
          x: 0,
          height: "auto",
          duration: 0.4,
          ease: "back.out(1.7)",
          onComplete: done,
        }
      );
    };

    watch(attempts, (newVal) => {
      if (progressBarRef.value) {
        const percentage = Math.min(
          (newVal / currentMaxAttempts.value) * 100,
          100
        );
        let color = "#00ff00";
        if (percentage > 50) color = "#ffff00";
        if (percentage > 80) color = "#ff0000";
        gsap.to(progressBarRef.value, {
          width: `${percentage}%`,
          backgroundColor: color,
          duration: 0.6,
          ease: "elastic.out(1, 0.5)",
        });
      }
    });

    const getHotColdHint = (difference) => {
      const rangeSize = currentMaxRange.value - currentMinRange.value;
      if (difference === 0) return "";
      if (difference <= Math.ceil(rangeSize * 0.05))
        return "¡CRÍTICO! Quemando.";
      if (difference <= Math.ceil(rangeSize * 0.15)) return "ALERTA: Caliente.";
      if (difference <= Math.ceil(rangeSize * 0.3)) return "ESTADO: Templado.";
      return "ERROR: Frío.";
    };

    const checkGuess = () => {
      if (gameState.value === "gameOver") return;
      const guess = parseInt(playerGuess.value);

      if (
        isNaN(guess) ||
        playerGuess.value === null ||
        playerGuess.value === ""
      ) {
        handleGameMessage(
          "Error de sintaxis. Ingrese un valor numérico.",
          "sad"
        );
        triggerShake();
        return;
      }

      if (guess < currentMinRange.value || guess > currentMaxRange.value) {
        handleGameMessage(
          `Fuera de rango [${currentMinRange.value} - ${currentMaxRange.value}].`,
          "sad"
        );
        triggerShake();
        return;
      }

      attempts.value++;
      let hintText = "";
      let isCorrect = false;

      if (guess === randomNumber.value) {
        handleGameMessage(
          `¡Acceso concedido! Código ${randomNumber.value} descifrado.`,
          "happy",
          true
        );
        gameState.value = "gameOver";
        resultState.value = "won";
        stopRolling(randomNumber.value); // Detener en el número correcto
        emit("round-finished", { playerScore: 1, iaScore: 0 });
        hintText = ">> ACCESO CONCEDIDO <<";
        isCorrect = true;
      } else if (attempts.value >= currentMaxAttempts.value) {
        handleGameMessage(
          `¡Brecha detectada! El código era ${randomNumber.value}.`,
          "angry",
          true
        );
        gameState.value = "gameOver";
        resultState.value = "lost";
        stopRolling(randomNumber.value); // Detener mostrando la respuesta
        triggerShake();
        emit("round-finished", { playerScore: 0, iaScore: 1 });
        hintText = ">> ACCESO DENEGADO <<";
      } else {
        const difference = Math.abs(guess - randomNumber.value);
        const hotColdHint = getHotColdHint(difference);
        let actualHintIsGreater = guess < randomNumber.value;
        let hintToDisplay = actualHintIsGreater;

        if (invertHintsActive.value) hintToDisplay = !actualHintIsGreater;

        if (hintToDisplay) {
          hintText = `Mayor. ${hotColdHint}`;
          handleGameMessage(`Objetivo MAYOR. ${hotColdHint}`, "thinking");
        } else {
          hintText = `Menor. ${hotColdHint}`;
          handleGameMessage(`Objetivo MENOR. ${hotColdHint}`, "thinking");
        }

        if (dynamicRangeShiftActive.value && !isCorrect) {
          const shiftAmount = Math.floor(Math.random() * 5) + 1;
          if (Math.random() > 0.5) {
            currentMinRange.value += shiftAmount;
            currentMaxRange.value += shiftAmount;
          } else {
            currentMinRange.value -= shiftAmount;
            currentMaxRange.value -= shiftAmount;
          }
          if (currentMinRange.value < 1) currentMinRange.value = 1;
          if (randomNumber.value < currentMinRange.value)
            randomNumber.value = currentMinRange.value;
          if (randomNumber.value > currentMaxRange.value)
            randomNumber.value = currentMaxRange.value;
          triggerShake();
          // Reiniciamos el rolling para que "salte" al nuevo rango visualmente
          startRolling();
        } else {
          triggerShake();
        }
      }

      if (!isNaN(guess)) {
        guessHistory.value.unshift({ guess: guess, hint: hintText });
      }
      playerGuess.value = null;
    };

    const resetGame = () => {
      setGameParameters(props.difficulty, props.aiModifiers);
    };

    onMounted(() => {
      setGameParameters(props.difficulty, props.aiModifiers);
    });

    onUnmounted(() => {
      if (rollingInterval) clearInterval(rollingInterval);
    });

    watch(
      () => [props.difficulty, props.aiModifiers],
      ([newDifficulty, newModifiers]) => {
        setGameParameters(newDifficulty, newModifiers);
      },
      { deep: true }
    );

    return {
      playerGuess,
      attempts,
      currentMaxAttempts,
      currentMinRange,
      currentMaxRange,
      guessHistory,
      gameState,
      result: resultState,
      checkGuess,
      resetGame,
      containerRef,
      progressBarRef,
      displayValue,
      isRevealed,
      onEnterLog,
    };
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=VT323&display=swap");

.hacker-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hacker-container {
  width: 100%;
  max-width: 500px;
  padding: 20px;
  background-color: #0a0a0a;
  border: 2px solid #00ff00;
  border-radius: 5px;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.2);
  font-family: "VT323", monospace;
  color: #00ff00;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-image: linear-gradient(
      rgba(18, 16, 16, 0) 50%,
      rgba(0, 0, 0, 0.25) 50%
    ),
    linear-gradient(
      90deg,
      rgba(255, 0, 0, 0.06),
      rgba(0, 255, 0, 0.02),
      rgba(0, 0, 255, 0.06)
    );
  background-size: 100% 2px, 3px 100%;
}

.terminal-title {
  text-align: center;
  font-size: 1.8rem;
  margin: 0;
  text-shadow: 0 0 5px #00ff00;
  border-bottom: 1px dashed #004400;
  padding-bottom: 5px;
}

/* --- Nuevo Panel de Datos de Misión --- */
.mission-data {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #004400;
  padding-bottom: 5px;
  margin-bottom: 5px;
  font-size: 1.1rem;
}
.data-row {
  display: flex;
  gap: 5px;
}
.data-label {
  color: #008800;
}
.data-val {
  color: #ccffcc;
  font-weight: bold;
}
.data-val.error {
  color: #ff0000;
  text-shadow: 0 0 5px #ff0000;
}
.data-val.success {
  color: #ffff00;
  text-shadow: 0 0 5px #ffff00;
}

/* --- Visualizador de Número --- */
.number-display {
  background-color: #001100;
  border: 1px solid #004400;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 2.5rem;
  height: 60px; /* Altura fija para evitar saltos */
}
.number-display .value {
  color: #00ff00;
  width: 100%;
  text-align: center;
  letter-spacing: 5px;
}
.number-display .value.is-revealed {
  color: #ffff00;
  text-shadow: 0 0 10px #ffff00;
}

/* --- Barra de Progreso --- */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.progress-label {
  font-size: 1rem;
  color: #008800;
}
.progress-track {
  width: 100%;
  height: 15px;
  background-color: #111;
  border: 1px solid #333;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background-color: #00ff00;
  box-shadow: 0 0 10px #00ff00;
}

/* --- Input --- */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.input-hint {
  font-size: 0.9rem;
  color: #006600;
  text-align: center;
  animation: pulse-text 2s infinite;
}
.prompt {
  font-size: 1.5rem;
  animation: blink 1s infinite;
}
.hack-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 2px solid #00ff00;
  color: #00ff00;
  font-family: "VT323", monospace;
  font-size: 1.5rem;
  padding: 5px;
  outline: none;
}
.hack-input::placeholder {
  color: #004400;
}

.hack-button,
.reset-button {
  background: #003300;
  border: 1px solid #00ff00;
  color: #00ff00;
  font-family: "VT323", monospace;
  font-size: 1.2rem;
  padding: 5px 15px;
  cursor: pointer;
  transition: all 0.2s;
}
.hack-button:hover:not(:disabled),
.reset-button:hover {
  background: #00ff00;
  color: #000;
  box-shadow: 0 0 10px #00ff00;
}
.hack-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #555;
  color: #555;
}

.reset-button {
  margin-top: 5px;
  width: 100%;
}

/* --- Historial --- */
.console-log {
  margin-top: 5px;
  border-top: 1px dashed #004400;
  padding-top: 5px;
  max-height: 100px; /* Un poco más pequeño */
  overflow-y: auto;
}
.console-log h3 {
  font-size: 1rem;
  margin: 0 0 5px 0;
  opacity: 0.8;
}
.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.log-entry {
  font-size: 1rem;
  margin-bottom: 2px;
  display: flex;
  gap: 10px;
}
.log-time {
  color: #008800;
}
.log-val {
  color: #ccffcc;
}
.log-msg {
  color: #ffff00;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #001100;
}
::-webkit-scrollbar-thumb {
  background: #004400;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
@keyframes pulse-text {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
</style>
