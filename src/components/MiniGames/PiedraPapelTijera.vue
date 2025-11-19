<template>
  <div class="battle-arena-container">
    <h2 class="arena-title">⚔️ DUELO DE ELEMENTOS ⚔️</h2>

    <div class="battle-hud">
      <div class="hud-panel">
        <span class="label">RONDA</span>
        <span class="value">{{ currentRound }} / {{ totalRounds }}</span>
      </div>
      <div class="hud-score">
        <span class="player-score p-score">{{ playerWins }}</span>
        <span class="vs">VS</span>
        <span class="ia-score">{{ iaWins }}</span>
      </div>
    </div>

    <div
      class="energy-bar-wrapper"
      v-if="gameState === 'playerChoice' && !gameFinished"
    >
      <div class="energy-bar" :style="{ width: timeBarWidth + '%' }"></div>
    </div>

    <div class="battlefield">
      <div
        v-if="gameState === 'playerChoice' && !gameFinished"
        class="player-hand"
      >
        <div class="spell-cards">
          <button
            class="spell-card desestabilizar"
            @click="useAbility('desestabilizar')"
            :disabled="
              abilitiesUsed.desestabilizar ||
              blockedPlayerAbility === 'desestabilizar'
            "
            :class="{
              used: abilitiesUsed.desestabilizar,
              blocked: blockedPlayerAbility === 'desestabilizar',
            }"
          >
            <span>🌀</span> Desestabilizar
          </button>

          <div class="block-group">
            <button
              v-for="type in ['rock', 'paper', 'scissors']"
              :key="type"
              class="spell-card block"
              @click="useAbility('bloqueo', type)"
              :disabled="
                abilitiesUsed.bloqueo || blockedPlayerAbility === 'bloqueo'
              "
              :class="{
                used: abilitiesUsed.bloqueo,
                blocked: blockedPlayerAbility === 'bloqueo',
              }"
            >
              <span>🚫</span>
              {{
                type === "rock"
                  ? "Piedra"
                  : type === "paper"
                  ? "Papel"
                  : "Tijera"
              }}
            </button>
          </div>

          <button
            class="spell-card acertijo"
            @click="useAbility('acertijo')"
            :disabled="
              abilitiesUsed.acertijo || blockedPlayerAbility === 'acertijo'
            "
            :class="{
              used: abilitiesUsed.acertijo,
              blocked: blockedPlayerAbility === 'acertijo',
            }"
          >
            <span>🧩</span> Acertijo
          </button>
        </div>

        <div class="hand-cards">
          <div class="battle-card" @click="playRound('rock')" ref="cardRock">
            <div class="card-inner">
              <img src="/images/ppt/rock.png" alt="Piedra" />
              <span class="card-name">ROCA</span>
              <span class="card-type">FUERZA</span>
            </div>
          </div>
          <div class="battle-card" @click="playRound('paper')" ref="cardPaper">
            <div class="card-inner">
              <img src="/images/ppt/paper.png" alt="Papel" />
              <span class="card-name">PAPEL</span>
              <span class="card-type">INTELIGENCIA</span>
            </div>
          </div>
          <div
            class="battle-card"
            @click="playRound('scissors')"
            ref="cardScissors"
          >
            <div class="card-inner">
              <img src="/images/ppt/scissors.png" alt="Tijera" />
              <span class="card-name">TIJERA</span>
              <span class="card-type">DESTREZA</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!gameFinished" class="clash-zone">
        <div
          class="clash-card player"
          ref="playerClashCard"
          :class="{
            winner:
              result === '¡Ganaste esta ronda!' &&
              gameState === 'showingResult',
            loser:
              result === '¡Perdiste esta ronda!' &&
              gameState === 'showingResult',
            destroyed: roundLoser === 'player' && showExplosion,
          }"
        >
          <img :src="`/images/ppt/${playerChoice || 'rock'}.png`" />
          <div
            class="clash-overlay"
            v-if="
              result === '¡Perdiste esta ronda!' &&
              gameState === 'showingResult'
            "
          ></div>
        </div>

        <div class="clash-center">
          <div
            v-if="gameState === 'iaThinking'"
            class="ia-thinking-effect"
            ref="iaThinkingEffect"
          ></div>
          <span v-else class="vs-text">VS</span>
        </div>

        <div
          class="clash-card ia"
          ref="iaClashCard"
          :class="{
            winner:
              result === '¡Perdiste esta ronda!' &&
              gameState === 'showingResult',
            loser:
              result === '¡Ganaste esta ronda!' &&
              gameState === 'showingResult',
            hidden: gameState === 'iaThinking',
            destroyed: roundLoser === 'ia' && showExplosion,
          }"
        >
          <div v-if="gameState === 'iaThinking'" class="card-back">?</div>
          <img v-else :src="`/images/ppt/${iaChoice || 'rock'}.png`" />

          <div
            class="clash-overlay"
            v-if="
              result === '¡Ganaste esta ronda!' && gameState === 'showingResult'
            "
          ></div>
        </div>
      </div>

      <div v-if="gameFinished" class="end-game-screen">
        <h3>{{ playerWins > iaWins ? "¡VICTORIA!" : "DERROTA" }}</h3>
        <button @click="startGame" class="reset-button">JUGAR OTRA VEZ</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from "vue";
import { Howl } from "howler";
import useGameOrchestrator from "@/composables/useGameOrchestrator.js";
import gsap from "gsap";
import confetti from "canvas-confetti";

export default {
  name: "PiedraPapelTijera",
  emits: ["round-finished"],
  props: {
    difficulty: { type: String, default: "normal" },
    aiModifiers: { type: Object, default: () => ({}) },
  },
  setup(props, { emit }) {
    const { handleGameMessage, aiGameModifiers, decideAndApplyAiModifiers } =
      useGameOrchestrator();

    // Refs para animaciones GSAP
    const playerClashCard = ref(null);
    const iaClashCard = ref(null);
    const iaThinkingEffect = ref(null);

    // Estado del juego
    const playerChoice = ref(null);
    const iaChoice = ref(null);
    const result = ref("");
    const choices = ["rock", "paper", "scissors"];
    const gameState = ref("playerChoice");

    // Estado de la IA
    let iaThinkingInterval = null;
    const iaHasChosen = ref(false);

    // Efectos visuales
    const showExplosion = ref(false);
    const roundLoser = ref(null);
    const explosionTimestamp = ref(Date.now());

    const explosionSound = new Howl({
      src: ["/sounds/explosion.mp3"],
      volume: 0.5,
    });
    const abilitySound = new Howl({
      src: ["/sounds/ability_activate.mp3"],
      volume: 0.7,
    });

    // Puntuación
    const playerWins = ref(0);
    const iaWins = ref(0);
    const totalRounds = 5;
    const currentRound = ref(1);
    const gameFinished = ref(false);

    // Habilidades
    const abilitiesUsed = ref({
      desestabilizar: false,
      bloqueo: false,
      acertijo: false,
    });
    const activeAbility = ref(null);
    const iaBlockedChoice = ref(null);
    const abilityUsedThisRound = ref(false);
    const blockedPlayerAbility = ref(null);

    // Tiempo
    const timeRemaining = ref(0);
    const timeBarWidth = ref(100);
    let timerInterval = null;
    let maxTimePerRound = 0;
    const riddleActive = ref(false);

    // Parámetros IA
    let iaPredictionChance = 0;
    let iaThinkingDuration = 0;
    // Variables que causaban error restauradas a su uso:
    let iaPatternLogic = "random";
    let iaNextPatternMove = null;

    let iaThinkingAnimation = null;

    // --- WATCHERS ---

    watch(
      () => aiGameModifiers.value,
      (newModifiers) => {
        if (newModifiers.blockPlayerAbility) {
          const possibleAbilities = ["desestabilizar", "bloqueo", "acertijo"];
          blockedPlayerAbility.value =
            possibleAbilities[
              Math.floor(Math.random() * possibleAbilities.length)
            ];
        } else {
          blockedPlayerAbility.value = null;
        }
      },
      { immediate: true, deep: true }
    );

    watch(showExplosion, (newValue) => {
      if (newValue) {
        explosionSound.play();
        const target =
          roundLoser.value === "player"
            ? playerClashCard.value
            : iaClashCard.value;
        if (target) {
          gsap.to(target, { x: "+=10", yoyo: true, repeat: 9, duration: 0.05 });
        }
      }
    });

    watch(gameState, (newVal) => {
      if (newVal === "iaThinking") {
        nextTick(() => {
          if (iaThinkingEffect.value) {
            iaThinkingAnimation = gsap.to(iaThinkingEffect.value, {
              rotation: 360,
              scale: 1.2,
              boxShadow: "0 0 20px #f1c40f",
              repeat: -1,
              yoyo: true,
              duration: 1,
              ease: "power1.inOut",
            });
          }
        });
      } else {
        if (iaThinkingAnimation) {
          iaThinkingAnimation.kill();
          iaThinkingAnimation = null;
          if (iaThinkingEffect.value)
            gsap.set(iaThinkingEffect.value, { clearProps: "all" });
        }
      }
    });

    // --- LÓGICA ---

    const setGameParameters = (difficulty) => {
      iaNextPatternMove = null;
      switch (difficulty) {
        case "facil":
          iaPredictionChance = 0;
          iaThinkingDuration = 2000;
          maxTimePerRound = 120000;
          iaPatternLogic = "random";
          break;
        case "normal":
          iaPredictionChance = 0;
          iaThinkingDuration = 3000;
          maxTimePerRound = 60000;
          iaPatternLogic = "random";
          break;
        case "dificil":
          iaPredictionChance = 0.3;
          iaThinkingDuration = 3500;
          maxTimePerRound = 30000;
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
        `Ronda ${currentRound.value} de ${totalRounds}. ¡Elige tu carta!`,
        "info"
      );
      gameState.value = "playerChoice";
      iaHasChosen.value = false;
      showExplosion.value = false;
      roundLoser.value = null;
      activeAbility.value = null;
      iaBlockedChoice.value = null;
      riddleActive.value = false;
      abilityUsedThisRound.value = false;

      // Resetear estilos GSAP de las cartas (solo si existen)
      if (playerClashCard.value)
        gsap.set(playerClashCard.value, { clearProps: "all" });
      if (iaClashCard.value) gsap.set(iaClashCard.value, { clearProps: "all" });

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

    // Lógica COMPLETA restaurada para usar las variables
    const getIaChoice = (
      playerChoiceMade,
      currentAbility,
      actualIaPredictionChance,
      iaErrorChance = 0
    ) => {
      let chosenIaMove;
      const availableChoices = [...choices];

      // 1. Bloqueo del jugador
      if (currentAbility === "bloqueo" && iaBlockedChoice.value) {
        const indexToRemove = availableChoices.indexOf(iaBlockedChoice.value);
        if (indexToRemove > -1) availableChoices.splice(indexToRemove, 1);
      }

      const randomNumber = Math.random();

      // 2. Lógica de Error (Desestabilizar)
      if (iaErrorChance > 0 && playerChoiceMade) {
        if (randomNumber < iaErrorChance) {
          if (playerChoiceMade === "rock") chosenIaMove = "scissors";
          else if (playerChoiceMade === "paper") chosenIaMove = "rock";
          else if (playerChoiceMade === "scissors") chosenIaMove = "paper";

          // Validar si el error cae en una opción bloqueada
          if (
            currentAbility === "bloqueo" &&
            iaBlockedChoice.value === chosenIaMove
          ) {
            const alt = availableChoices.filter(
              (c) => c !== iaBlockedChoice.value
            );
            chosenIaMove =
              alt.length > 0
                ? alt[Math.floor(Math.random() * alt.length)]
                : choices[0];
          }
          return chosenIaMove;
        }
      }

      // 3. Patrón Complejo (Aquí se usan las variables que daban error)
      if (iaPatternLogic === "complex-pattern" && iaNextPatternMove) {
        if (availableChoices.includes(iaNextPatternMove)) {
          chosenIaMove = iaNextPatternMove;
          iaNextPatternMove = null;
        }
      }

      // 4. Predicción
      if (
        !chosenIaMove &&
        randomNumber < actualIaPredictionChance &&
        playerChoiceMade
      ) {
        if (playerChoiceMade === "rock") chosenIaMove = "paper";
        else if (playerChoiceMade === "paper") chosenIaMove = "scissors";
        else if (playerChoiceMade === "scissors") chosenIaMove = "rock";
      }

      // 5. Lógica General (Random o Patrón simple)
      if (!chosenIaMove) {
        if (iaPatternLogic === "random") {
          chosenIaMove =
            availableChoices[
              Math.floor(Math.random() * availableChoices.length)
            ];
        } else if (iaPatternLogic === "complex-pattern") {
          // Sesgo sutil en difícil
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

      // 6. Validación final de bloqueo
      if (
        currentAbility === "bloqueo" &&
        chosenIaMove === iaBlockedChoice.value
      ) {
        const alternatives = availableChoices.filter(
          (c) => c !== iaBlockedChoice.value
        );
        chosenIaMove =
          alternatives.length > 0
            ? alternatives[Math.floor(Math.random() * alternatives.length)]
            : choices[0];
      }

      // Setear siguiente movimiento del patrón si aplica (Aquí se asigna la variable)
      if (iaPatternLogic === "complex-pattern") {
        if (chosenIaMove === "rock") iaNextPatternMove = "paper";
        else if (chosenIaMove === "paper") iaNextPatternMove = "scissors";
        else if (chosenIaMove === "scissors") iaNextPatternMove = "rock";
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
      handleGameMessage(
        `Has invocado: ${choice.toUpperCase()}`,
        "thinking",
        false,
        5000
      );
      gameState.value = "iaThinking";
      showExplosion.value = false;
      iaHasChosen.value = false;
      roundLoser.value = null;

      // NOTA: lastPlayerChoice se eliminó porque ya no usamos la estrategia "counter-player" simple.

      if (activeAbility.value === "desestabilizar") {
        handleGameMessage(
          "¡Desestabilizar! La IA pierde concentración...",
          "sad",
          false,
          3000
        );
        await new Promise((r) => setTimeout(r, 1000));
      } else if (activeAbility.value === "bloqueo") {
        handleGameMessage(
          `¡Bloqueo! ${iaBlockedChoice.value} anulado.`,
          "angry",
          false,
          3000
        );
        await new Promise((r) => setTimeout(r, 1000));
      }

      // IA Piensa
      await new Promise((r) => setTimeout(r, iaThinkingDuration));

      // Decisión Final IA
      let finalIaMove;
      if (activeAbility.value === "acertijo") finalIaMove = preChosenIaMove;
      else if (activeAbility.value === "desestabilizar")
        finalIaMove = getIaChoice(playerChoice.value, null, 0, 0.75);
      else
        finalIaMove = getIaChoice(
          playerChoice.value,
          activeAbility.value,
          iaPredictionChance,
          0
        );

      iaChoice.value = finalIaMove;
      gameState.value = "iaChosen";
      iaHasChosen.value = true;

      // --- ANIMACIÓN GSAP: CHOQUE ---
      await nextTick();
      if (playerClashCard.value && iaClashCard.value) {
        const tl = gsap.timeline();
        // 1. Retroceder
        tl.to([playerClashCard.value, iaClashCard.value], {
          scale: 0.9,
          duration: 0.2,
        })
          // 2. Chocar
          .to(playerClashCard.value, {
            x: 60,
            rotate: 15,
            duration: 0.15,
            ease: "power1.in",
          })
          .to(
            iaClashCard.value,
            { x: -60, rotate: -15, duration: 0.15, ease: "power1.in" },
            "<"
          )
          // 3. Rebote
          .to([playerClashCard.value, iaClashCard.value], {
            x: 0,
            rotate: 0,
            scale: 1.05,
            duration: 0.4,
            ease: "elastic.out(1, 0.5)",
          });

        await new Promise((r) => setTimeout(r, 600));
      }

      // Determinar Ganador
      let roundWinner;
      if (playerChoice.value === iaChoice.value) {
        result.value = "¡Empate!";
        handleGameMessage("Choque igualado. ¡Empate!", "normal");
        roundWinner = "draw";
        roundLoser.value = null;
      } else if (
        (playerChoice.value === "rock" && iaChoice.value === "scissors") ||
        (playerChoice.value === "paper" && iaChoice.value === "rock") ||
        (playerChoice.value === "scissors" && iaChoice.value === "paper")
      ) {
        result.value = "¡Ganaste esta ronda!";
        handleGameMessage("¡Impacto crítico! Ganaste la ronda.", "sad");
        roundWinner = "player";
        roundLoser.value = "ia";
        playerWins.value++;
      } else {
        result.value = "¡Perdiste esta ronda!";
        handleGameMessage("¡Defensa rota! La IA gana la ronda.", "happy");
        roundWinner = "ia";
        roundLoser.value = "player";
        iaWins.value++;
      }

      gameState.value = "showingResult";
      await new Promise((r) => setTimeout(r, 100));

      // --- ANIMACIÓN DE DERROTA (KNOCKOUT) ---
      if (roundWinner !== "draw") {
        explosionSound.play();
        showExplosion.value = true; // Esto activa el brillo rojo/borde si tienes estilos CSS para ello

        const targetCard =
          roundLoser.value === "player"
            ? playerClashCard.value
            : iaClashCard.value;

        // Dirección del golpe: Si pierde el jugador, vuela a la izquierda. Si pierde la IA, a la derecha.
        const knockDir = roundLoser.value === "player" ? -1 : 1;

        if (targetCard) {
          const tl = gsap.timeline();

          // 1. Impacto: La carta retrocede bruscamente y cambia de color
          tl.to(targetCard, {
            x: 30 * knockDir, // Retroceso
            rotation: 10 * knockDir, // Giro por el golpe
            scale: 0.9,
            filter: "brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)", // Flash rojo brillante (daño)
            duration: 0.1,
            ease: "power4.out",
          })
            // 2. Caída: La gravedad hace su trabajo
            .to(targetCard, {
              y: 600, // Cae fuera de la pantalla
              rotation: 90 * knockDir, // Gira mientras cae
              opacity: 0,
              filter: "grayscale(100%) brightness(0.5)", // Se apaga mientras cae
              duration: 0.8,
              ease: "power2.in", // Comienza lento, termina rápido (gravedad)
            });

          await new Promise((r) => setTimeout(r, 900));
        }
      } else {
        // Si es empate, solo una pausa breve
        await new Promise((r) => setTimeout(r, 800));
      }

      riddleActive.value = false;

      // Fin de Juego
      if (playerWins.value === Math.ceil(totalRounds / 2)) {
        handleGameMessage(
          "¡VICTORIA SUPREMA! Has derrotado a la IA.",
          "happy",
          true
        );
        gameFinished.value = true;
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        emit("round-finished", {
          playerScore: playerWins.value,
          iaScore: iaWins.value,
        });
      } else if (iaWins.value === Math.ceil(totalRounds / 2)) {
        handleGameMessage(
          "¡DERROTA! La IA domina el campo de batalla.",
          "angry",
          true
        );
        gameFinished.value = true;
        emit("round-finished", {
          playerScore: playerWins.value,
          iaScore: iaWins.value,
        });
      } else {
        currentRound.value++;
        if (currentRound.value <= totalRounds) {
          await new Promise((r) => setTimeout(r, 1000));
          resetRound();
        } else {
          handleGameMessage(
            "¡Duelo finalizado! Resultado calculado.",
            "normal",
            true
          );
          gameFinished.value = true;
          emit("round-finished", {
            playerScore: playerWins.value,
            iaScore: iaWins.value,
          });
        }
      }
    };

    const useAbility = (abilityName, blockedChoice = null) => {
      if (blockedPlayerAbility.value === abilityName) {
        handleGameMessage(
          `¡Habilidad "${abilityName}" BLOQUEADA por la IA!`,
          "angry"
        );
        return;
      }
      if (abilityUsedThisRound.value) {
        handleGameMessage("Solo una habilidad por turno.", "sad");
        return;
      }
      if (
        abilitiesUsed.value[abilityName] ||
        gameState.value !== "playerChoice"
      ) {
        handleGameMessage("Habilidad agotada o momento incorrecto.", "sad");
        return;
      }

      abilitiesUsed.value[abilityName] = true;
      activeAbility.value = abilityName;
      abilityUsedThisRound.value = true;
      abilitySound.play();

      if (abilityName === "bloqueo") iaBlockedChoice.value = blockedChoice;
      else if (abilityName === "acertijo") {
        const riddle = getRiddle(preChosenIaMove, props.difficulty);
        handleGameMessage(`ENIGMA: "${riddle}"`, "thinking", false, 10000);
        riddleActive.value = true;
      }
    };

    const getRiddle = (iaChoice, difficulty) => {
      const riddles = {
        rock: {
          facil: "Soy fuerte y rompo la madera.",
          normal: "Mi núcleo es duro, no me doblo.",
          dificil: "Soy el principio inmóvil que rompe filos.",
        },
        paper: {
          facil: "Me usas para escribir.",
          normal: "Envuelvo lo duro, me pliego fácil.",
          dificil: "Mi extensión domina la piedra.",
        },
        scissors: {
          facil: "Corto papel.",
          normal: "Mis brazos cruzados son letales.",
          dificil: "Dos caminos convergen para dividir.",
        },
      };
      return riddles[iaChoice]?.[difficulty] || "Adivina...";
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
          handleGameMessage("¡TIEMPO AGOTADO! Elección forzada.", "sad");
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
      (newVal) => {
        setGameParameters(newVal);
        startGame();
      }
    );

    return {
      playerChoice,
      iaChoice,
      result,
      choices,
      gameState,
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
      playerClashCard,
      iaClashCard,
      iaThinkingEffect,
    };
  },
};
</script>

<style scoped>
/* --- CONTENEDOR PRINCIPAL (ARENA) --- */
.battle-arena-container {
  width: 100%;
  height: 100%;
  /* Fondo oscuro y moderno para la arena de batalla */
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  position: relative;
}

.arena-title {
  font-size: 1.8rem;
  margin: 10px 0;
  background: -webkit-linear-gradient(#eee, #333);
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* --- HUD (Marcador y Rondas) --- */
.battle-hud {
  display: flex;
  justify-content: space-between;
  width: 90%;
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 20px;
  border-radius: 8px;
  margin-bottom: 5px;
  border: 1px solid #444;
}

.hud-panel .label {
  display: block;
  font-size: 0.7rem;
  color: #888;
  text-transform: uppercase;
}

.hud-panel .value {
  font-size: 1.2rem;
  font-weight: bold;
}

.hud-score {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  gap: 10px;
  align-items: center;
}

.player-score {
  color: #4caf50;
}
.ia-score {
  color: #f44336;
}
.vs {
  font-size: 0.8rem;
  color: #aaa;
}

/* --- BARRA DE ENERGÍA (TIEMPO) --- */
.energy-bar-wrapper {
  width: 90%;
  height: 6px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.energy-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff9800, #ff5722);
  transition: width 0.1s linear;
}

/* --- CAMPO DE BATALLA --- */
.battlefield {
  flex-grow: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding-bottom: 20px;
}

/* --- MANO DEL JUGADOR (Fase de Selección) --- */
.player-hand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  animation: slideUp 0.5s ease-out;
}

/* Cartas de Hechizo (Habilidades) */
.spell-cards {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 5px;
}

.spell-card {
  background: #34495e;
  border: 1px solid #7f8c8d;
  color: #ecf0f1;
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.spell-card:hover:not(:disabled) {
  background: #3b5998;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.spell-card.used {
  opacity: 0.5;
  cursor: default;
  text-decoration: line-through;
  border-color: #555;
}

.spell-card.blocked {
  border-color: #e74c3c;
  color: #e74c3c;
  background: #2c0505;
  opacity: 0.7;
  cursor: not-allowed;
}
.spell-card.blocked span {
  filter: grayscale(100%);
}

.block-group {
  display: flex;
  gap: 5px;
}

/* Cartas de Batalla (Opciones) */
.hand-cards {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.battle-card {
  width: 110px;
  height: 160px;
  background: linear-gradient(to bottom, #2c3e50, #000);
  border: 2px solid #ecf0f1;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
}

.battle-card:hover {
  transform: translateY(-15px) scale(1.05);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6);
  border-color: #f1c40f; /* Dorado al hacer hover */
}

.card-inner {
  text-align: center;
  z-index: 2;
}

.card-inner img {
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

.card-name {
  display: block;
  font-weight: bold;
  color: #ecf0f1;
  font-size: 1rem;
  letter-spacing: 1px;
}

.card-type {
  display: block;
  font-size: 0.6rem;
  color: #95a5a6;
  margin-top: 5px;
  text-transform: uppercase;
}

/* --- ZONA DE CHOQUE (Fase de Resultado) --- */
.clash-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 80px; /* Espacio inicial para la animación */
  width: 100%;
  height: 100%;
}

.clash-card {
  width: 130px;
  height: 190px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  position: relative;
  /* Importante para GSAP */
  transform-origin: center center;
  overflow: hidden;
}

.clash-card img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.clash-card.player {
  border: 5px solid #4caf50; /* Borde verde jugador */
  background: radial-gradient(circle, #fff, #e8f5e9);
}

.clash-card.ia {
  border: 5px solid #f44336; /* Borde rojo IA */
  background: radial-gradient(circle, #fff, #ffebee);
}

.card-back {
  font-size: 4rem;
  color: #ccc;
  font-weight: 900;
  opacity: 0.5;
}

/* Efecto visual de IA Pensando (Círculo giratorio) */
.ia-thinking-effect {
  width: 40px;
  height: 40px;
  border: 4px dashed #ff9800;
  border-radius: 50%;
  box-shadow: 0 0 10px #ff9800;
  /* La animación de rotación se maneja con GSAP, pero ponemos estilos base */
}

.clash-center {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
}

.vs-text {
  font-size: 2.5rem;
  font-weight: 900;
  font-style: italic;
  color: #fff;
  text-shadow: 3px 3px 0 #000;
}

/* Estados Finales de Ronda */
.clash-card.winner {
  transform: scale(1.1);
  box-shadow: 0 0 40px #f1c40f; /* Brillo dorado */
  z-index: 10;
  border-color: #f1c40f;
}

.clash-card.loser {
  filter: grayscale(100%) brightness(0.5);
  opacity: 0.6;
}

/* Overlay para oscurecer la carta perdedora */
.clash-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

/* Efecto de Explosión (si usaras una imagen, pero ahora usamos destrucción CSS/GSAP) */
.explosion-effect {
  position: absolute;
  width: 180%;
  height: 180%;
  top: -40%;
  left: -40%;
  z-index: 20;
  pointer-events: none;
}

/* --- PANTALLA FINAL DEL JUEGO --- */
.end-game-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 50;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.5s;
}

.end-game-screen h3 {
  font-size: 3.5rem;
  color: #f1c40f;
  text-shadow: 0 0 20px rgba(241, 196, 15, 0.8);
  margin-bottom: 30px;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.reset-button {
  padding: 15px 40px;
  background: #f1c40f;
  color: #000;
  font-weight: bold;
  border: none;
  border-radius: 50px;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(241, 196, 15, 0.5);
  transition: all 0.2s;
}

.reset-button:hover {
  transform: scale(1.1);
  background: #fff;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
