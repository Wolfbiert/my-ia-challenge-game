<script>
import { ref, onMounted, watch, nextTick } from "vue";
import { Howl } from "howler";

export default {
  name: "PiedraPapelTijera",
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
    const playerChoice = ref(null);
    const iaChoice = ref(null);
    const result = ref("");
    const gameMessage = ref("Elige tu jugada...");
    const messageType = ref("info");
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

    const timeRemaining = ref(0);
    const timeBarWidth = ref(100);
    let timerInterval = null;
    let maxTimePerRound = 0;
    const riddleActive = ref(false); // Cambiado a booleano para mayor claridad

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
    let iaNextPatternMove = null;
    let lastPlayerChoice = null;

    const setGameParameters = (difficulty) => {
      iaNextPatternMove = null;
      switch (difficulty) {
        case "facil":
          iaPredictionChance = 0;
          iaThinkingDuration = 2000;
          maxTimePerRound = 120 * 1000;
          iaPatternLogic = "random";
          break;
        case "normal":
          iaPredictionChance = 0.3;
          iaThinkingDuration = 3000;
          maxTimePerRound = 60 * 1000;
          iaPatternLogic = "counter-player";
          break;
        case "dificil":
          iaPredictionChance = 0.6;
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
      gameMessage.value = `Ronda ${currentRound.value} de ${totalRounds}. Elige tu jugada...`;
      messageType.value = "info";
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

      if (iaThinkingInterval) {
        clearInterval(iaThinkingInterval);
        iaThinkingInterval = null;
      }
      startTimer();
    };

    // [CAMBIO 1]: Añadir 'iaErrorChance' como nuevo parámetro
    const getIaChoice = (
      playerChoiceMade,
      currentAbility,
      actualIaPredictionChance,
      iaErrorChance = 0 // Nuevo parámetro con valor por defecto de 0
    ) => {
      let chosenIaMove;
      const availableChoices = [...choices];

      // Aplicar habilidad "Bloqueo"
      if (currentAbility === "bloqueo" && iaBlockedChoice.value) {
        const indexToRemove = availableChoices.indexOf(iaBlockedChoice.value);
        if (indexToRemove > -1) {
          availableChoices.splice(indexToRemove, 1);
        }
      }

      const randomNumber = Math.random();

      // [CAMBIO 2]: Lógica para la habilidad "Desestabilizar"
      if (iaErrorChance > 0 && playerChoiceMade) {
        // Si Desestabilizar está activa y el jugador ha hecho una elección
        if (randomNumber < iaErrorChance) {
          // La IA comete un error y elige la jugada que pierde contra el jugador
          if (playerChoiceMade === "rock")
            chosenIaMove = "scissors"; // Roca pierde contra Tijera
          else if (playerChoiceMade === "paper")
            chosenIaMove = "rock"; // Papel pierde contra Roca
          else if (playerChoiceMade === "scissors") chosenIaMove = "paper"; // Tijera pierde contra Papel

          // Asegurarse de que el movimiento de error no esté bloqueado
          if (
            currentAbility === "bloqueo" &&
            iaBlockedChoice.value === chosenIaMove
          ) {
            // Si el movimiento de error está bloqueado, elige al azar de los disponibles
            const alternatives = availableChoices.filter(
              (c) => c !== iaBlockedChoice.value
            );
            if (alternatives.length > 0) {
              chosenIaMove =
                alternatives[Math.floor(Math.random() * alternatives.length)];
            } else {
              // Si todo está bloqueado (caso muy raro), elige al azar de todas las opciones
              chosenIaMove =
                choices[Math.floor(Math.random() * choices.length)];
            }
          }
          return chosenIaMove; // Retorna el movimiento erróneo
        }
      }

      // Lógica de patrón compleja (si ya se determinó un nextPatternMove)
      if (iaPatternLogic === "complex-pattern" && iaNextPatternMove) {
        if (availableChoices.includes(iaNextPatternMove)) {
          chosenIaMove = iaNextPatternMove;
          iaNextPatternMove = null;
        }
      }

      if (!chosenIaMove) {
        // La IA intenta contrarrestar al jugador (basado en actualIaPredictionChance)
        if (randomNumber < actualIaPredictionChance && playerChoiceMade) {
          if (playerChoiceMade === "rock") chosenIaMove = "paper";
          else if (playerChoiceMade === "paper") chosenIaMove = "scissors";
          else if (playerChoiceMade === "scissors") chosenIaMove = "rock";
        } else {
          // Lógica basada en patrones o aleatoriedad
          if (iaPatternLogic === "random") {
            chosenIaMove =
              availableChoices[
                Math.floor(Math.random() * availableChoices.length)
              ];
          } else if (iaPatternLogic === "counter-player" && lastPlayerChoice) {
            if (lastPlayerChoice === "rock") chosenIaMove = "paper";
            else if (lastPlayerChoice === "paper") chosenIaMove = "scissors";
            else if (lastPlayerChoice === "scissors") chosenIaMove = "rock";
            if (!availableChoices.includes(chosenIaMove)) {
              chosenIaMove =
                availableChoices[
                  Math.floor(Math.random() * availableChoices.length)
                ];
            }
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
      }

      // Doble chequeo por si la IA elige la opción bloqueada
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

      if (iaPatternLogic === "complex-pattern") {
        if (chosenIaMove === "rock") iaNextPatternMove = "paper";
        else if (chosenIaMove === "paper") iaNextPatternMove = "scissors";
        else if (chosenIaMove === "scissors") iaNextPatternMove = "rock";
      }

      return chosenIaMove;
    };

    let preChosenIaMove = null;
    const preCalculateIaChoice = () => {
      // Para el acertijo, no queremos que el pre-cálculo considere el error chance
      preChosenIaMove = getIaChoice(null, null, iaPredictionChance, 0);
    };

    const playRound = async (choice) => {
      stopTimer();
      playerChoice.value = choice;
      gameMessage.value = `Tú elegiste: ${choice}...`;
      gameState.value = "iaThinking";
      showExplosion.value = false;
      iaHasChosen.value = false;
      roundLoser.value = null;

      lastPlayerChoice = choice;

      if (activeAbility.value === "desestabilizar") {
        gameMessage.value =
          "¡Habilidad 'Desestabilizar' activada! La IA está desorientada...";
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else if (activeAbility.value === "bloqueo") {
        gameMessage.value = `¡Habilidad 'Bloqueo' activada! La IA NO puede usar ${iaBlockedChoice.value}...`;
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
      }
      // [CAMBIO 3]: Modificar la llamada a getIaChoice cuando Desestabilizar está activa
      else if (activeAbility.value === "desestabilizar") {
        // La IA tiene un 75% de probabilidad de cometer el error (elegir la que pierde contra el jugador)
        finalIaMove = getIaChoice(playerChoice.value, null, 0, 0.75);
      } else {
        finalIaMove = getIaChoice(
          playerChoice.value,
          activeAbility.value,
          iaPredictionChance,
          0 // Asegurarse de que no haya error chance en el juego normal
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
        messageType.value = "info";
        roundWinner = "draw";
        roundLoser.value = null;
      } else if (
        (playerChoice.value === "rock" && iaChoice.value === "scissors") ||
        (playerChoice.value === "paper" && iaChoice.value === "rock") ||
        (playerChoice.value === "scissors" && iaChoice.value === "paper")
      ) {
        result.value = "¡Ganaste esta ronda!";
        messageType.value = "success";
        roundWinner = "player";
        roundLoser.value = "ia";
        playerWins.value++;
      } else {
        result.value = "¡Perdiste esta ronda!";
        messageType.value = "error";
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
        gameMessage.value =
          "¡FELICIDADES! ¡Has ganado el desafío de Piedra, Papel o Tijera!";
        messageType.value = "success";
        gameFinished.value = true;
        emit("round-finished", { winner: "player", score: playerWins.value });
      } else if (iaWins.value === Math.ceil(totalRounds / 2)) {
        gameMessage.value =
          "¡OH NO! La IA te ha ganado en Piedra, Papel o Tijera.";
        messageType.value = "error";
        gameFinished.value = true;
        emit("round-finished", { winner: "ia", score: iaWins.value });
      } else {
        currentRound.value++;
        if (currentRound.value <= totalRounds) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          resetRound();
        } else {
          gameMessage.value =
            "¡Fin del juego! Resultado final. Puedes jugar de nuevo.";
          gameFinished.value = true;
          emit("round-finished", { winner: "draw", score: playerWins.value });
        }
      }
    };

    const useAbility = (abilityName, blockedChoice = null) => {
      if (abilityUsedThisRound.value) {
        gameMessage.value = "Ya has usado una habilidad en esta ronda.";
        messageType.value = "warning";
        setTimeout(() => {
          resetMessageState();
        }, 2000);
        return;
      }

      if (
        abilitiesUsed.value[abilityName] ||
        gameState.value !== "playerChoice"
      ) {
        gameMessage.value = `Ya usaste la habilidad "${abilityName}" o no es el momento.`;
        messageType.value = "warning";
        setTimeout(() => {
          resetMessageState();
        }, 2000);
        return;
      }

      abilitiesUsed.value[abilityName] = true;
      activeAbility.value = abilityName;
      abilityUsedThisRound.value = true;
      abilitySound.play();

      if (abilityName === "bloqueo") {
        iaBlockedChoice.value = blockedChoice;
        gameMessage.value = `¡Habilidad 'Bloqueo' activada! La IA no podrá usar ${blockedChoice} esta ronda. Elige tu jugada.`;
        messageType.value = "info";
        setTimeout(() => {
          resetMessageState();
        }, 1500);
      } else if (abilityName === "desestabilizar") {
        gameMessage.value = `¡Habilidad 'Desestabilizar' activada! La IA tiene una alta probabilidad de equivocarse esta ronda. Elige tu jugada.`; // [CAMBIO 4]: Mensaje actualizado
        messageType.value = "info";
        setTimeout(() => {
          resetMessageState();
        }, 1500);
      } else if (abilityName === "acertijo") {
        const riddle = getRiddle(preChosenIaMove, props.difficulty);
        gameMessage.value = `Acertijo de la IA: "${riddle}"`;
        messageType.value = "warning";
        riddleActive.value = true;
      }
    };

    const resetMessageState = () => {
      if (riddleActive.value) return;

      if (
        !activeAbility.value ||
        (activeAbility.value === "acertijo" && !riddleActive.value)
      ) {
        gameMessage.value = "Elige tu jugada...";
        messageType.value = "info";
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
          gameMessage.value = "¡Tiempo agotado! Tu elección fue aleatoria.";
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
      gameMessage,
      messageType,
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
      playRound,
      startGame,
      useAbility,
      iaBlockedChoice,
      abilityUsedThisRound,
    };
  },
};
</script>
