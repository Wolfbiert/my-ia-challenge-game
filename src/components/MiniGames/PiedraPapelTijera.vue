<template>
  <div class="piedra-papel-tijera-game-container">
    <h2>Piedra, Papel o Tijera</h2>

    <div class="score-display">
      <p>Ronda: {{ currentRound }} / {{ totalRounds }}</p>
      <p>Tú: {{ playerWins }} | IA: {{ iaWins }}</p>
    </div>

    <div
      v-if="gameState === 'playerChoice' && !gameFinished"
      class="time-bar-container"
    >
      <div class="time-bar" :style="{ width: timeBarWidth + '%' }"></div>
    </div>

    <div class="controls-section">
      <div
        class="abilities-section"
        v-if="gameState === 'playerChoice' && !gameFinished"
      >
        <h3>Tus Habilidades (1 uso c/u)</h3>

        <button
          @click="useAbility('desestabilizar')"
          :disabled="
            abilitiesUsed.desestabilizar ||
            blockedPlayerAbility === 'desestabilizar'
          "
          :class="{
            'used-ability': abilitiesUsed.desestabilizar,
            'is-blocked': blockedPlayerAbility === 'desestabilizar',
          }"
        >
          Desestabilizar
        </button>

        <button
          @click="useAbility('bloqueo', 'rock')"
          :disabled="
            abilitiesUsed.bloqueo || blockedPlayerAbility === 'bloqueo'
          "
          :class="{
            'used-ability': abilitiesUsed.bloqueo,
            'is-blocked': blockedPlayerAbility === 'bloqueo',
          }"
        >
          Bloquear Piedra
        </button>
        <button
          @click="useAbility('bloqueo', 'paper')"
          :disabled="
            abilitiesUsed.bloqueo || blockedPlayerAbility === 'bloqueo'
          "
          :class="{
            'used-ability': abilitiesUsed.bloqueo,
            'is-blocked': blockedPlayerAbility === 'bloqueo',
          }"
        >
          Bloquear Papel
        </button>
        <button
          @click="useAbility('bloqueo', 'scissors')"
          :disabled="
            abilitiesUsed.bloqueo || blockedPlayerAbility === 'bloqueo'
          "
          :class="{
            'used-ability': abilitiesUsed.bloqueo,
            'is-blocked': blockedPlayerAbility === 'bloqueo',
          }"
        >
          Bloquear Tijera
        </button>
        <button
          @click="useAbility('acertijo')"
          :disabled="
            abilitiesUsed.acertijo || blockedPlayerAbility === 'acertijo'
          "
          :class="{
            'used-ability': abilitiesUsed.acertijo,
            'is-blocked': blockedPlayerAbility === 'acertijo',
          }"
        >
          Acertijo
        </button>
      </div>

      <div
        class="choices-buttons"
        v-if="gameState === 'playerChoice' && !gameFinished"
      >
        <button @click="playRound('rock')">
          <img src="/images/ppt/rock.png" alt="Piedra" class="choice-icon" />
          <span>Piedra</span>
        </button>
        <button @click="playRound('paper')">
          <img src="/images/ppt/paper.png" alt="Papel" class="choice-icon" />
          <span>Papel</span>
        </button>
        <button @click="playRound('scissors')">
          <img
            src="/images/ppt/scissors.png"
            alt="Tijera"
            class="choice-icon"
          />
          <span>Tijera</span>
        </button>
      </div>

      <div
        v-if="gameState !== 'playerChoice' || gameFinished"
        class="versus-section"
      >
        <div
          :class="[
            'player-display',
            {
              winner:
                result === '¡Ganaste esta ronda!' &&
                gameState === 'showingResult',
              loser:
                result === '¡Perdiste esta ronda!' &&
                gameState === 'showingResult',
              'round-over-loser':
                gameState === 'roundOver' && roundLoser === 'player',
              'game-finished-winner': gameFinished && playerWins > iaWins,
              'game-finished-loser': gameFinished && playerWins < iaWins,
            },
          ]"
        >
          <img
            :src="`/images/ppt/${playerChoice || 'rock'}.png`"
            :alt="playerChoice"
            class="chosen-icon"
          />
          <p>Tú</p>
          <img
            v-if="showExplosion && roundLoser === 'player'"
            :src="`/images/ppt/explosion.gif?t=${explosionTimestamp}`"
            alt="Explosión"
            class="explosion-gif player-explosion"
          />
        </div>

        <div class="vs-text-container">
          <template v-if="gameState === 'iaThinking'">
            <img
              src="/images/ppt/thinking.gif"
              alt="IA Pensando"
              class="thinking-gif"
            />
            <span class="vs-text">IA Pensando...</span>
            <span class="thinking-dots">...</span>
          </template>
          <span v-else-if="iaChoice" class="vs-text big-vs">VS</span>
        </div>

        <div
          :class="[
            'ia-display',
            {
              winner:
                result === '¡Perdiste esta ronda!' &&
                gameState === 'showingResult',
              loser:
                result === '¡Ganaste esta ronda!' &&
                gameState === 'showingResult',
              'round-over-loser':
                gameState === 'roundOver' && roundLoser === 'ia',
              'game-finished-winner': gameFinished && iaWins > playerWins,
              'game-finished-loser': gameFinished && iaWins < playerWins,
            },
          ]"
        >
          <img
            v-if="gameState === 'iaThinking' && iaThinkingDisplayChoice"
            :src="`/images/ppt/${iaThinkingDisplayChoice}.png`"
            alt="Elección IA"
            class="chosen-icon iterating-icon"
          />
          <img
            v-else-if="
              gameState === 'iaChosen' ||
              gameState === 'showingResult' ||
              gameState === 'roundOver' ||
              gameFinished
            "
            :src="`/images/ppt/${iaChoice || 'rock'}.png`"
            :alt="iaChoice"
            class="chosen-icon"
            :class="{ 'ia-chosen-animation': iaHasChosen }"
          />
          <p>IA</p>
          <img
            v-if="showExplosion && roundLoser === 'ia'"
            :src="`/images/ppt/explosion.gif?t=${explosionTimestamp}`"
            alt="Explosión"
            class="explosion-gif ia-explosion"
          />
        </div>
      </div>
    </div>

    <button v-if="gameFinished" @click="startGame" class="reset-button">
      Jugar de Nuevo
    </button>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from "vue";
import { Howl } from "howler";
import useGameOrchestrator from "@/composables/useGameOrchestrator.js";

export default {
  name: "PiedraPapelTijera",
  emits: ["round-finished"], // <-- 'update-ia-message' eliminado
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
    const { handleGameMessage, aiGameModifiers, decideAndApplyAiModifiers } =
      useGameOrchestrator(); // <-- Usando la función del orquestador

    const playerChoice = ref(null);
    const iaChoice = ref(null);
    const result = ref("");
    const choices = ["rock", "paper", "scissors"];

    const gameState = ref("playerChoice");
    const iaThinkingDisplayChoice = ref(null);
    let iaThinkingInterval = null;
    const iaHasChosen = ref(false);
    const showExplosion = ref(false);
    const roundLoser = ref(null);
    const explosionTimestamp = ref(Date.now());

    const playerWins = ref(0);
    const iaWins = ref(0);
    const totalRounds = 5;
    const currentRound = ref(1);
    const gameFinished = ref(false);

    const abilitiesUsed = ref({
      desestabilizar: false,
      bloqueo: false,
      acertijo: false,
    });
    const activeAbility = ref(null);
    const iaBlockedChoice = ref(null);
    const abilityUsedThisRound = ref(false);

    const blockedPlayerAbility = ref(null);

    watch(
      () => aiGameModifiers.value,
      (newModifiers) => {
        if (newModifiers.blockPlayerAbility) {
          const possibleAbilities = ["desestabilizar", "bloqueo", "acertijo"];
          const abilityToBlock =
            possibleAbilities[
              Math.floor(Math.random() * possibleAbilities.length)
            ];
          blockedPlayerAbility.value = abilityToBlock;
        } else {
          blockedPlayerAbility.value = null;
        }
      },
      { immediate: true, deep: true }
    );
    const timeRemaining = ref(0);
    const timeBarWidth = ref(100);
    let timerInterval = null;
    let maxTimePerRound = 0;
    const riddleActive = ref(false);

    const explosionSound = new Howl({
      src: ["/sounds/explosion.mp3"],
      volume: 0.5,
    });
    const abilitySound = new Howl({
      src: ["/sounds/ability_activate.mp3"],
      volume: 0.7,
    });

    let iaPredictionChance = 0;
    let iaThinkingDuration = 0;
    let iaPatternLogic = "random";

    const setGameParameters = (difficulty) => {
      switch (difficulty) {
        case "facil":
          iaPredictionChance = 0;
          iaThinkingDuration = 2000;
          maxTimePerRound = 120 * 1000;
          iaPatternLogic = "random";
          break;
        case "normal":
          iaPredictionChance = 0;
          iaThinkingDuration = 3000;
          maxTimePerRound = 60 * 1000;
          iaPatternLogic = "random";
          break;
        case "dificil":
          iaPredictionChance = 0.3;
          iaThinkingDuration = 3500;
          maxTimePerRound = 30 * 1000;
          iaPatternLogic = "complex-pattern";
          break;
      }
    };

    const startGame = () => {
      playerWins.value = 0;
      iaWins.value = 0;
      currentRound.value = 1;
      gameFinished.value = false;
      abilitiesUsed.value = {
        desestabilizar: false,
        bloqueo: false,
        acertijo: false,
      };
      activeAbility.value = null;
      iaBlockedChoice.value = null;
      abilityUsedThisRound.value = false;
      resetRound();
    };

    const resetRound = () => {
      playerChoice.value = null;
      iaChoice.value = null;
      result.value = "";
      handleGameMessage(
        `Ronda ${currentRound.value} de ${totalRounds}. Elige tu jugada...`,
        "info"
      ); // <-- USANDO EL ORQUESTADOR
      gameState.value = "playerChoice";
      iaThinkingDisplayChoice.value = null;
      iaHasChosen.value = false;
      showExplosion.value = false;
      roundLoser.value = null;
      activeAbility.value = null;
      iaBlockedChoice.value = null;
      riddleActive.value = false;
      abilityUsedThisRound.value = false;

      setGameParameters(props.difficulty);
      blockedPlayerAbility.value = null;

      decideAndApplyAiModifiers(
        "PiedraPapelTijera",
        playerWins.value,
        iaWins.value
      );

      if (iaThinkingInterval) {
        clearInterval(iaThinkingInterval);
        iaThinkingInterval = null;
      }
      startTimer();
    };

    const getIaChoice = (
      playerChoiceMade,
      currentAbility,
      actualIaPredictionChance,
      iaErrorChance = 0
    ) => {
      let chosenIaMove;
      const availableChoices = [...choices];

      if (currentAbility === "bloqueo" && iaBlockedChoice.value) {
        const indexToRemove = availableChoices.indexOf(iaBlockedChoice.value);
        if (indexToRemove > -1) {
          availableChoices.splice(indexToRemove, 1);
        }
      }

      const randomNumber = Math.random();

      if (iaErrorChance > 0 && playerChoiceMade) {
        if (randomNumber < iaErrorChance) {
          if (playerChoiceMade === "rock") chosenIaMove = "scissors";
          else if (playerChoiceMade === "paper") chosenIaMove = "rock";
          else if (playerChoiceMade === "scissors") chosenIaMove = "paper";

          if (
            currentAbility === "bloqueo" &&
            iaBlockedChoice.value === chosenIaMove
          ) {
            const alternatives = availableChoices.filter(
              (c) => c !== iaBlockedChoice.value
            );
            if (alternatives.length > 0) {
              chosenIaMove =
                alternatives[Math.floor(Math.random() * alternatives.length)];
            } else {
              chosenIaMove =
                choices[Math.floor(Math.random() * choices.length)];
            }
          }
          return chosenIaMove;
        }
      }

      if (randomNumber < actualIaPredictionChance && playerChoiceMade) {
        if (playerChoiceMade === "rock") chosenIaMove = "paper";
        else if (playerChoiceMade === "paper") chosenIaMove = "scissors";
        else if (playerChoiceMade === "scissors") chosenIaMove = "rock";
      }

      if (!chosenIaMove) {
        if (iaPatternLogic === "random") {
          chosenIaMove =
            availableChoices[
              Math.floor(Math.random() * availableChoices.length)
            ];
        } else if (iaPatternLogic === "complex-pattern") {
          const bias = Math.random();
          if (bias < 0.5 && availableChoices.includes("paper"))
            chosenIaMove = "paper";
          else if (bias < 0.75 && availableChoices.includes("rock"))
            chosenIaMove = "rock";
          else if (availableChoices.includes("scissors"))
            chosenIaMove = "scissors";
          else
            chosenIaMove =
              availableChoices[
                Math.floor(Math.random() * availableChoices.length)
              ];
        } else {
          chosenIaMove =
            availableChoices[
              Math.floor(Math.random() * availableChoices.length)
            ];
        }
      }

      if (
        currentAbility === "bloqueo" &&
        chosenIaMove === iaBlockedChoice.value
      ) {
        const alternativeChoices = availableChoices.filter(
          (c) => c !== iaBlockedChoice.value
        );
        if (alternativeChoices.length > 0) {
          chosenIaMove =
            alternativeChoices[
              Math.floor(Math.random() * alternativeChoices.length)
            ];
        } else {
          chosenIaMove = choices[Math.floor(Math.random() * choices.length)];
        }
      }

      return chosenIaMove;
    };

    let preChosenIaMove = null;
    const preCalculateIaChoice = () => {
      preChosenIaMove = getIaChoice(null, null, iaPredictionChance, 0);
    };

    const playRound = async (choice) => {
      stopTimer();
      playerChoice.value = choice;
      handleGameMessage(`Tú elegiste: ${choice}...`, "thinking"); // <-- USANDO EL ORQUESTADOR
      gameState.value = "iaThinking";
      showExplosion.value = false;
      iaHasChosen.value = false;
      roundLoser.value = null;

      if (activeAbility.value === "desestabilizar") {
        handleGameMessage(
          "¡Habilidad 'Desestabilizar' activada! La IA está desorientada...",
          "sad"
        ); // <-- USANDO EL ORQUESTADOR
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else if (activeAbility.value === "bloqueo") {
        handleGameMessage(
          `¡Habilidad 'Bloqueo' activada! La IA NO puede usar ${iaBlockedChoice.value}...`,
          "angry"
        ); // <-- USANDO EL ORQUESTADOR
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      let currentChoiceIndex = 0;
      iaThinkingInterval = setInterval(() => {
        iaThinkingDisplayChoice.value = choices[currentChoiceIndex];
        currentChoiceIndex = (currentChoiceIndex + 1) % choices.length;
      }, 150);
      await new Promise((resolve) => setTimeout(resolve, iaThinkingDuration));
      clearInterval(iaThinkingInterval);

      let finalIaMove;

      if (activeAbility.value === "acertijo") {
        finalIaMove = preChosenIaMove;
      } else if (activeAbility.value === "desestabilizar") {
        finalIaMove = getIaChoice(playerChoice.value, null, 0, 0.75);
      } else {
        finalIaMove = getIaChoice(
          playerChoice.value,
          activeAbility.value,
          iaPredictionChance,
          0
        );
      }

      iaChoice.value = finalIaMove;
      iaThinkingDisplayChoice.value = finalIaMove;
      gameState.value = "iaChosen";
      iaHasChosen.value = true;
      await new Promise((resolve) => setTimeout(resolve, 600));

      let roundWinner;
      if (playerChoice.value === iaChoice.value) {
        result.value = "¡Empate!";
        handleGameMessage("¡Empate! Un digno rival.", "normal"); // <-- USANDO EL ORQUESTADOR
        roundWinner = "draw";
        roundLoser.value = null;
      } else if (
        (playerChoice.value === "rock" && iaChoice.value === "scissors") ||
        (playerChoice.value === "paper" && iaChoice.value === "rock") ||
        (playerChoice.value === "scissors" && iaChoice.value === "paper")
      ) {
        result.value = "¡Ganaste esta ronda!";
        handleGameMessage("¡Ganaste esta ronda! ¡Maldición!", "sad"); // <-- USANDO EL ORQUESTADOR
        roundWinner = "player";
        roundLoser.value = "ia";
        playerWins.value++;
      } else {
        result.value = "¡Perdiste esta ronda!";
        handleGameMessage("¡Perdiste! ¡Gané esta vez!", "happy"); // <-- USANDO EL ORQUESTADOR
        roundWinner = "ia";
        roundLoser.value = "player";
        iaWins.value++;
      }

      gameState.value = "showingResult";
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (roundWinner !== "draw") {
        explosionTimestamp.value = Date.now();
        showExplosion.value = true;
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 50));
        explosionSound.play();

        await new Promise((resolve) => setTimeout(resolve, 300));
        gameState.value = "roundOver";

        await new Promise((resolve) => setTimeout(resolve, 1200));
        showExplosion.value = false;
      } else {
        showExplosion.value = false;
        await new Promise((resolve) => setTimeout(resolve, 800));
        gameState.value = "roundOver";
      }

      riddleActive.value = false;

      if (playerWins.value === Math.ceil(totalRounds / 2)) {
        handleGameMessage(
          "¡FELICIDADES! ¡Has ganado el desafío de Piedra, Papel o Tijera!",
          "happy",
          true // Intervención de la IA
        ); // <-- USANDO EL ORQUESTADOR
        gameFinished.value = true;
        emit("round-finished", {
          playerScore: playerWins.value,
          iaScore: iaWins.value,
        });
      } else if (iaWins.value === Math.ceil(totalRounds / 2)) {
        handleGameMessage(
          "¡OH NO! La IA te ha ganado en Piedra, Papel o Tijera.",
          "angry",
          true // Intervención de la IA
        ); // <-- USANDO EL ORQUESTADOR
        gameFinished.value = true;
        emit("round-finished", {
          playerScore: playerWins.value,
          iaScore: iaWins.value,
        });
      } else {
        currentRound.value++;
        if (currentRound.value <= totalRounds) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          resetRound();
        } else {
          handleGameMessage(
            "¡Fin del juego! Resultado final. Puedes jugar de nuevo.",
            "normal",
            true // Intervención de la IA
          ); // <-- USANDO EL ORQUESTADOR
          gameFinished.value = true;
          emit("round-finished", {
            playerScore: playerWins.value,
            iaScore: iaWins.value,
          });
        }
      }
    };

    const useAbility = (abilityName, blockedChoice = null) => {
      // NUEVA LÍNEA para verificar si la habilidad está bloqueada por la IA
      if (blockedPlayerAbility.value === abilityName) {
        handleGameMessage(
          `¡Habilidad "${abilityName}" está bloqueada por la IA esta ronda!`,
          "angry"
        ); // <-- USANDO EL ORQUESTADOR
        return;
      }
      if (abilityUsedThisRound.value) {
        handleGameMessage("Ya has usado una habilidad en esta ronda.", "sad"); // <-- USANDO EL ORQUESTADOR
        return;
      }

      if (
        abilitiesUsed.value[abilityName] ||
        gameState.value !== "playerChoice"
      ) {
        handleGameMessage(
          `Ya usaste la habilidad "${abilityName}" o no es el momento.`,
          "sad"
        ); // <-- USANDO EL ORQUESTADOR
        return;
      }

      abilitiesUsed.value[abilityName] = true;
      activeAbility.value = abilityName;
      abilityUsedThisRound.value = true;
      abilitySound.play();

      if (abilityName === "bloqueo") {
        iaBlockedChoice.value = blockedChoice;
        handleGameMessage(
          `¡Habilidad 'Bloqueo' activada! La IA no podrá usar ${blockedChoice} esta ronda. Elige tu jugada.`,
          "thinking"
        ); // <-- USANDO EL ORQUESTADOR
      } else if (abilityName === "desestabilizar") {
        handleGameMessage(
          `¡Habilidad 'Desestabilizar' activada! La IA tiene una alta probabilidad de equivocarse esta ronda. Elige tu jugada.`,
          "thinking"
        ); // <-- USANDO EL ORQUESTADOR
      } else if (abilityName === "acertijo") {
        const riddle = getRiddle(preChosenIaMove, props.difficulty);
        handleGameMessage(`Acertijo de la IA: "${riddle}"`, "thinking"); // <-- USANDO EL ORQUESTADOR
        riddleActive.value = true;
      }
    };

    const getRiddle = (iaChoice, difficulty) => {
      const riddles = {
        rock: {
          facil: "Soy fuerte y rompo la madera. ¿Qué soy?",
          normal:
            "Mi núcleo es duro, pero mi superficie puede ser pulida. No me doblo fácilmente.",
          dificil:
            "En el arte de los encuentros, anulo lo afilado y soy la base de toda construcción. Soy el principio inmóvil.",
        },
        paper: {
          facil: "Me usas para escribir y me doblo fácilmente. ¿Qué soy?",
          normal:
            "Puedo cubrir lo más duro y envolver lo que se afila. Me pliego con facilidad.",
          dificil:
            "Mi extensión es infinita, mi abrazo puede ser envolvente o sofocante. Domino el origen de la palabra.",
        },
        scissors: {
          facil: "Tengo dos hojas y corto papel. ¿Qué soy?",
          normal:
            "Mis brazos se cruzan en un abrazo letal, cortando la extensión blanda.",
          dificil:
            "Soy el filo de la decisión, la separación del continuo. Dos caminos que convergen para dividir.",
        },
      };
      return riddles[iaChoice][difficulty] || "Mmm... ¡Tendrás que adivinar!";
    };

    const startTimer = () => {
      timeRemaining.value = maxTimePerRound;
      timeBarWidth.value = 100;

      if (timerInterval) clearInterval(timerInterval);

      timerInterval = setInterval(() => {
        timeRemaining.value -= 100;
        timeBarWidth.value = (timeRemaining.value / maxTimePerRound) * 100;

        if (timeRemaining.value <= 0) {
          clearInterval(timerInterval);
          timeRemaining.value = 0;
          timeBarWidth.value = 0;
          handleGameMessage(
            "¡Tiempo agotado! Tu elección fue aleatoria.",
            "sad"
          ); // <-- USANDO EL ORQUESTADOR
          riddleActive.value = false;
          playRound(choices[Math.floor(Math.random() * choices.length)]);
        }
      }, 100);

      preCalculateIaChoice();
    };

    const stopTimer = () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    };

    onMounted(() => {
      setGameParameters(props.difficulty);
      startGame();
    });

    watch(
      () => props.difficulty,
      (newDifficulty) => {
        setGameParameters(newDifficulty);
        startGame();
      }
    );

    return {
      playerChoice,
      iaChoice,
      result,
      choices,
      gameState,
      iaThinkingDisplayChoice,
      iaHasChosen,
      showExplosion,
      roundLoser,
      explosionTimestamp,
      playerWins,
      iaWins,
      currentRound,
      totalRounds,
      gameFinished,
      abilitiesUsed,
      timeRemaining,
      timeBarWidth,
      riddleActive,
      blockedPlayerAbility,
      playRound,
      startGame,
      useAbility,
      iaBlockedChoice,
      abilityUsedThisRound,
    };
  },
};
</script>

<style scoped>
.piedra-papel-tijera-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f0f8ff;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  color: #333;
  width: 100%;
  max-width: 600px;
  margin: auto;
  min-height: 450px;
  position: relative;
  overflow: hidden;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2.2em;
}

.game-message {
  font-size: 1.3em;
  margin-bottom: 30px;
  min-height: 1.5em;
  text-align: center;
}

.game-message.info {
  color: #3498db;
}
.game-message.success {
  color: #27ae60;
}
.game-message.error {
  color: #e74c3c;
}
.game-message.warning {
  color: #f39c12;
}

/* Botones de elección */
.choices-buttons {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  justify-content: center;
}

.choices-buttons button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 15px 25px;
  font-size: 1.1em;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}

.choices-buttons button:hover {
  background-color: #2980b9;
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.choice-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

/* Sección de Enfrentamiento (VS) */
.versus-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 100px; /* 🔄 ANTES: 60px */
  margin-top: 40px; /* 🔄 ANTES: 20px */
  width: 100%;
  position: relative;
  min-height: 180px;
  overflow: hidden;
}

.player-display,
.ia-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background-color: #ecf0f1;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  /* Transición para winner/loser y también para la clase de desaparición */
  transition: transform 0.5s ease-out, opacity 0.5s ease-out,
    box-shadow 0.3s ease;
  position: relative;
  z-index: 1;
}

/* Animación de entrada para el icono de la IA cuando ya ha elegido */
.ia-chosen-animation {
  animation: iaEnter 0.4s ease-out forwards;
}
@keyframes iaEnter {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Para el icono que itera mientras la IA piensa */
.iterating-icon {
  animation: popIn 0.2s ease-out;
}
@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0.5;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Clases para ganador/perdedor (se activan en gameState 'showingResult') */
.player-display.loser,
.ia-display.loser {
  /* La escala se aplica solo cuando es perdedor y se muestra el resultado */
  transform: scale(0.5) translateY(20px);
  opacity: 1; /* Es visible cuando se está mostrando el resultado y es perdedor */
}

.player-display.winner,
.ia-display.winner {
  transform: scale(1.1);
  box-shadow: 0 0 20px 5px rgba(46, 204, 113, 0.6);
}

/* NUEVA REGLA: El perdedor se desvanece y achica cuando la ronda ha terminado */
/* Esto se activa después de la explosión (gameState cambia a 'roundOver') */
.player-display.round-over-loser,
.ia-display.round-over-loser {
  opacity: 0; /* Lo hace completamente transparente */
  transform: scale(0); /* Lo achica a cero */
  /* La transición ya está definida en .player-display, .ia-display */
}

/* Iconos de elección del VS (dentro de player-display/ia-display) */
.chosen-icon {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

/* Centro: VS / IA Pensando */
.vs-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #555;
  min-width: 80px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  text-align: center;
}

.vs-text {
  font-size: 1.5em;
  margin-top: 5px;
}

.vs-text.big-vs {
  font-size: 3em;
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.thinking-dots {
  font-size: 3em;
  animation: blink 1s infinite steps(1, end);
}
@keyframes blink {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

.thinking-gif {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  animation: thinkingPulse 1.5s infinite alternate;
}
@keyframes thinkingPulse {
  from {
    opacity: 0.7;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* GIF de Explosión */
.explosion-gif {
  position: absolute;
  display: block;
  width: 100%; /* 🔄 ANTES: 150px */
  height: 100%; /* 🔄 ANTES: 150px */
  object-fit: contain;
  z-index: 3;
  animation: explode 1.2s forwards; /* 🔄 Duración ajustada para que desaparezca más rápido */
  pointer-events: none; /* 🔒 Asegura que no bloquee clics debajo */
}

/* Posicionar la explosión sobre el jugador o la IA */
.player-explosion {
  top: 0; /* 🔄 ANTES: 50% */
  left: 0; /* 🔄 ANTES: 50% */
  transform: none; /* 🔄 ANTES: translate(-50%, -50%) */
  width: 100%;
  height: 100%;
}

.ia-explosion {
  top: 0;
  left: 0;
  transform: none;
  width: 100%;
  height: 100%;
}

@keyframes explode {
  0% {
    opacity: 1;
    transform: scale(0.1);
  }
  10% {
    opacity: 1;
    transform: scale(0.8);
  }
  80% {
    opacity: 1;
    transform: scale(1.5);
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}

.result-message {
  font-size: 2em;
  font-weight: bold;
  margin-top: 30px;
  animation: fadeInScale 0.5s ease-out;
}
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-message.success {
  color: #27ae60;
}
.result-message.error {
  color: #e74c3c;
}
.result-message.info {
  color: #3498db;
}

.reset-button {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 25px;
  font-size: 1.1em;
  cursor: pointer;
  margin-top: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.reset-button:hover {
  background-color: #218838;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.score-display {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 20px;
  font-size: 1.4em;
  font-weight: bold;
  color: #555;
  background-color: #e0f2f7;
  padding: 10px;
  border-radius: 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.score-display p {
  margin: 0;
}

.time-bar-container {
  width: 90%;
  height: 15px;
  background-color: #ddd;
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.1);
}

.time-bar {
  height: 100%;
  background-color: #e74c3c; /* Rojo para el tiempo que se agota */
  transition: width 0.1s linear; /* Transición suave para el decrecimiento */
  border-radius: 10px;
}

.abilities-section {
  display: flex;
  flex-wrap: wrap; /* Permite que los botones se ajusten en varias líneas */
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f7f7f7;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.abilities-section h3 {
  width: 100%; /* El título ocupa todo el ancho */
  text-align: center;
  margin-bottom: 10px;
  color: #3f51b5;
  font-size: 1.1em;
}

.abilities-section button {
  background-color: #8bc34a; /* Verde lima para habilidades */
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 15px;
  font-size: 0.9em;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap; /* Evita que el texto se rompa */
}

.abilities-section button:hover:not(:disabled) {
  background-color: #689f38;
  transform: translateY(-2px);
}

.abilities-section button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}

.abilities-section button.used-ability {
  background-color: #9e9e9e; /* Gris para habilidades usadas */
  cursor: not-allowed;
}

/* Nuevas clases para resultado final del juego */
.player-display.game-finished-winner,
.ia-display.game-finished-winner {
  transform: scale(1.15) rotate(5deg); /* Un poco más de "fiesta" */
  box-shadow: 0 0 30px 8px rgba(0, 255, 0, 0.7); /* Brillo verde intenso */
}

.player-display.game-finished-loser,
.ia-display.game-finished-loser {
  opacity: 0.2;
  transform: scale(0.6) rotate(-5deg); /* Se encoge y se desvanece */
}

/* Asegurarse de que los botones de elección estén deshabilitados si el juego terminó */
.choices-buttons button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-button {
  background-color: #007bff; /* Azul para el botón de Reiniciar Juego Completo */
  color: white;
}
.reset-button:hover {
  background-color: #0056b3;
}

.is-blocked {
  cursor: not-allowed;
  opacity: 0.5;
  filter: grayscale(100%);
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.is-blocked:hover {
  background-color: var(--color-background-soft);
  color: var(--color-text);
  transform: none;
}
</style>
