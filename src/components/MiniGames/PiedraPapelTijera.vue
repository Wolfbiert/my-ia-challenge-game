<template>
  <div class="piedra-papel-tijera-game-container">
    <h2>Piedra, Papel o Tijera</h2>

    <div class="score-display">
      <p>Ronda: {{ currentRound }} / {{ totalRounds }}</p>
      <p>Tú: {{ playerWins }} | IA: {{ iaWins }}</p>
    </div>

    <p class="game-message" :class="messageType">{{ gameMessage }}</p>

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
          :disabled="abilitiesUsed.desestabilizar"
          :class="{ 'used-ability': abilitiesUsed.desestabilizar }"
        >
          Desestabilizar
        </button>
        <button
          @click="useAbility('bloqueo', 'rock')"
          :disabled="abilitiesUsed.bloqueo"
          :class="{ 'used-ability': abilitiesUsed.bloqueo }"
        >
          Bloquear Piedra
        </button>
        <button
          @click="useAbility('bloqueo', 'paper')"
          :disabled="abilitiesUsed.bloqueo"
          :class="{ 'used-ability': abilitiesUsed.bloqueo }"
        >
          Bloquear Papel
        </button>
        <button
          @click="useAbility('bloqueo', 'scissors')"
          :disabled="abilitiesUsed.bloqueo"
          :class="{ 'used-ability': abilitiesUsed.bloqueo }"
        >
          Bloquear Tijera
        </button>
        <button
          @click="useAbility('acertijo')"
          :disabled="abilitiesUsed.acertijo"
          :class="{ 'used-ability': abilitiesUsed.acertijo }"
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

    <p v-if="gameFinished" class="result-message" :class="messageType">
      {{ gameMessage }}
    </p>

    <button v-if="gameFinished" @click="startGame" class="reset-button">
      Jugar de Nuevo
    </button>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from "vue";
import { Howl } from "howler"; // Asegúrate de que Howl esté importado

export default {
  name: "PiedraPapelTijera",
  emits: ["round-finished"],
  props: {
    difficulty: {
      type: String,
      default: "normal",
      validator: (value) => ["facil", "normal", "dificil"].includes(value),
    },
    // Añadimos prop para los modificadores de la IA de useGameOrchestrator
    aiModifiers: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    // ... (variables de estado existentes)
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

    // --- NUEVAS VARIABLES DE ESTADO Y CONSTANTES ---
    const playerWins = ref(0);
    const iaWins = ref(0);
    const totalRounds = 5; // Mejor de 5 rondas
    const currentRound = ref(1);
    const gameFinished = ref(false);

    // Estado de las habilidades del jugador
    const abilitiesUsed = ref({
      desestabilizar: false,
      bloqueo: false,
      acertijo: false,
    });
    const activeAbility = ref(null); // Para saber qué habilidad está activa en la ronda
    const iaBlockedChoice = ref(null); // Almacena la elección bloqueada por el jugador

    // Barra de tiempo
    const timeRemaining = ref(0);
    const timeBarWidth = ref(100); // Para la visual de la barra
    let timerInterval = null;
    let maxTimePerRound = 0; // Se definirá según la dificultad

    // Sonidos (asegúrate de que los archivos existan)
    const explosionSound = new Howl({
      src: ["/sounds/explosion.mp3"],
      volume: 0.5,
    });
    // Puedes añadir sonidos para las habilidades aquí
    const abilitySound = new Howl({
      src: ["/sounds/ability_activate.mp3"], // Crea un sonido genérico o específico
      volume: 0.7,
    });

    // Probabilidades y duraciones (ajustadas)
    let iaPredictionChance = 0; // Probabilidad de la IA de predecir el movimiento del jugador
    let iaThinkingDuration = 0;
    // Nuevo: Probabilidad de que la IA cambie su elección con "Desestabilizar" o "Acertijo"
    let iaCounterAbilityChance = 0;
    // Nuevo: Patrón o sesgo de la IA (por defecto, para el modo normal)
    let iaPatternLogic = "random"; // 'random', 'counter-player', 'sequential'
    let iaNextPatternMove = null; // Inicializado a null para el patrón secuencial
    // Almacena la última elección del jugador para patrones de la IA
    let lastPlayerChoice = null;
    // --- FIN NUEVAS VARIABLES ---

    // ... (setGameParameters existente)
    const setGameParameters = (difficulty) => {
      // Reiniciar iaNextPatternMove al cambiar la dificultad para evitar comportamientos no deseados
      iaNextPatternMove = null;
      switch (difficulty) {
        case "facil":
          iaPredictionChance = 0; // IA no predice
          iaThinkingDuration = 2000; // Piensa menos
          iaCounterAbilityChance = 0; // No contrarresta habilidades
          maxTimePerRound = 8000; // Más tiempo para el jugador
          iaPatternLogic = "random"; // Siempre aleatoria en fácil
          break;
        case "normal":
          iaPredictionChance = 0.3; // IA predice con 30% de chance
          iaThinkingDuration = 3000; // Piensa normal
          iaCounterAbilityChance = 0.2; // 20% de chance de contrarrestar
          maxTimePerRound = 5000; // Tiempo normal
          iaPatternLogic = "counter-player"; // Intenta contrarrestar al jugador a veces
          break;
        case "dificil":
          iaPredictionChance = 0.6; // IA predice con 60% de chance
          iaThinkingDuration = 3500; // Piensa más
          iaCounterAbilityChance = 0.4; // 40% de chance de contrarrestar
          maxTimePerRound = 3000; // Menos tiempo
          iaPatternLogic = "complex-pattern"; // Patrones más complejos o agresivos
          break;
      }
      // NO llamar a resetGame aquí, para evitar recursión y asegurar que los watchers lo manejen
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
      resetRound(); // Inicia la primera ronda
    };

    const resetRound = () => {
      // Renombrado de resetGame a resetRound para claridad
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
      activeAbility.value = null; // Reiniciar habilidad activa
      iaBlockedChoice.value = null; // Reiniciar bloqueo

      if (iaThinkingInterval) {
        clearInterval(iaThinkingInterval);
        iaThinkingInterval = null;
      }
      startTimer(); // Iniciar el temporizador para la elección del jugador
    };

    const getIaChoice = (playerChoiceMade, currentAbility) => {
      let chosenIaMove;
      const availableChoices = [...choices]; // Copia de las opciones

      // Aplicar habilidad "Bloqueo"
      if (currentAbility === "bloqueo" && iaBlockedChoice.value) {
        const indexToRemove = availableChoices.indexOf(iaBlockedChoice.value);
        if (indexToRemove > -1) {
          availableChoices.splice(indexToRemove, 1); // Quita la opción bloqueada
        }
      }

      // Lógica de la IA (considerando patrones y dificultad)
      const randomNumber = Math.random();

      // Priorizar iaNextPatternMove si está establecido y es un patrón complejo
      if (iaPatternLogic === "complex-pattern" && iaNextPatternMove) {
        if (availableChoices.includes(iaNextPatternMove)) {
          chosenIaMove = iaNextPatternMove;
          iaNextPatternMove = null; // Consumir el movimiento de patrón para la siguiente ronda
        }
      }

      // Si no se ha elegido un movimiento por patrón o si el patrón no se aplica
      if (!chosenIaMove) {
        // La IA intenta contrarrestar al jugador (basado en iaPredictionChance)
        if (randomNumber < iaPredictionChance && playerChoiceMade) {
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
            // Intenta contrarrestar la última jugada del jugador si no lo hizo ahora
            if (lastPlayerChoice === "rock") chosenIaMove = "paper";
            else if (lastPlayerChoice === "paper") chosenIaMove = "scissors";
            else if (lastPlayerChoice === "scissors") chosenIaMove = "rock";
            // Fallback si la IA no tiene una buena contra o la opción está bloqueada
            if (!availableChoices.includes(chosenIaMove)) {
              chosenIaMove =
                availableChoices[
                  Math.floor(Math.random() * availableChoices.length)
                ];
            }
          } else if (iaPatternLogic === "complex-pattern") {
            // Implementar un patrón más complejo aquí, ej. IA prefiere Papel
            // O una secuencia predefinida, o basada en el score.
            // Por ahora, lo haremos un poco más sesgado.
            const bias = Math.random();
            if (bias < 0.5 && availableChoices.includes("paper"))
              chosenIaMove = "paper"; // IA prefiere papel
            else if (bias < 0.75 && availableChoices.includes("rock"))
              chosenIaMove = "rock";
            else if (availableChoices.includes("scissors"))
              chosenIaMove = "scissors";
            else
              chosenIaMove =
                availableChoices[
                  Math.floor(Math.random() * availableChoices.length)
                ]; // Fallback
          } else {
            chosenIaMove =
              availableChoices[
                Math.floor(Math.random() * availableChoices.length)
              ];
          }
        }
      }

      // Asegurarse de que la elección de la IA no sea la bloqueada (doble chequeo después de toda la lógica)
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
          // Si solo queda una opción y es la bloqueada (debería ser imposible con 3 opciones)
          chosenIaMove = choices[Math.floor(Math.random() * choices.length)]; // Fallback seguro
        }
      }

      // Opcional: Establecer el iaNextPatternMove para la siguiente ronda aquí, basado en la elección actual de la IA
      if (iaPatternLogic === "complex-pattern") {
        if (chosenIaMove === "rock") iaNextPatternMove = "paper";
        else if (chosenIaMove === "paper") iaNextPatternMove = "scissors";
        else if (chosenIaMove === "scissors") iaNextPatternMove = "rock";
      }

      return chosenIaMove;
    };

    const playRound = async (choice) => {
      stopTimer(); // Detener el temporizador una vez que el jugador elige
      playerChoice.value = choice;
      gameMessage.value = `Tú elegiste: ${choice}...`;
      gameState.value = "iaThinking";
      showExplosion.value = false;
      iaHasChosen.value = false;
      roundLoser.value = null;

      // Almacenar la elección del jugador para la lógica de patrón de la IA
      lastPlayerChoice = choice;

      // Reacciones de la IA a las habilidades activas (antes de su elección final)
      if (activeAbility.value === "desestabilizar") {
        gameMessage.value =
          "¡Habilidad 'Desestabilizar' activada! La IA está desorientada...";
        iaPredictionChance = 0; // IA elige completamente al azar
        // iaCounterAbilityChance se podría dejar como está o también a 0, según el nivel de desorientación
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Pequeña pausa para el mensaje
      } else if (activeAbility.value === "bloqueo") {
        gameMessage.value = `¡Habilidad 'Bloqueo' activada! La IA NO puede usar ${iaBlockedChoice.value}...`;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else if (activeAbility.value === "acertijo") {
        gameMessage.value =
          "¡Habilidad 'Acertijo' activada! La IA te plantea un enigma...";
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // IA piensa (animación)
      let currentChoiceIndex = 0;
      iaThinkingInterval = setInterval(() => {
        iaThinkingDisplayChoice.value = choices[currentChoiceIndex];
        currentChoiceIndex = (currentChoiceIndex + 1) % choices.length;
      }, 150);
      await new Promise((resolve) => setTimeout(resolve, iaThinkingDuration));
      clearInterval(iaThinkingInterval);

      // --- Elección FINAL de la IA ---
      let chosenIaMove = getIaChoice(playerChoice.value, activeAbility.value);

      // NUEVO: Lógica para que la IA contrarreste habilidades si iaCounterAbilityChance lo permite
      if (
        activeAbility.value &&
        iaCounterAbilityChance > 0 &&
        Math.random() < iaCounterAbilityChance
      ) {
        if (activeAbility.value === "desestabilizar") {
          gameMessage.value = "¡La IA ha contrarrestado tu Desestabilización!";
          messageType.value = "error"; // O warning
          // La IA recupera su lógica normal para esta ronda
          setGameParameters(props.difficulty); // Reestablece los parámetros de dificultad, incluyendo iaPredictionChance
          chosenIaMove = getIaChoice(playerChoice.value, null); // Re-calcula la elección sin la habilidad de desestabilizar
        } else if (activeAbility.value === "bloqueo") {
          gameMessage.value = `¡La IA ha anulado tu Bloqueo de ${iaBlockedChoice.value}!`;
          messageType.value = "error"; // O warning
          iaBlockedChoice.value = null; // La IA anula el bloqueo
          chosenIaMove = getIaChoice(playerChoice.value, null); // Re-calcula la elección sin bloqueo
        }
        // Para "acertijo", la contrarresta podría ser dando una pista falsa o siendo más directa
        else if (activeAbility.value === "acertijo") {
          gameMessage.value = `¡La IA te devuelve el acertijo con una respuesta directa!`;
          messageType.value = "error";
          // Podrías forzar a la IA a elegir su 'chosenIaMove' sin acertijo si lo deseas
        }
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Pequeña pausa para el mensaje de contrataque
        resetMessageState(); // Restaurar el mensaje o mantener el nuevo
      }

      // Si se usó "Acertijo", mostrar el acertijo en lugar de la elección directa
      if (activeAbility.value === "acertijo" && messageType.value !== "error") {
        // Solo si no fue contrarrestado
        const riddle = getRiddle(chosenIaMove, props.difficulty);
        gameMessage.value = `Acertijo de la IA: "${riddle}"`;
        messageType.value = "warning";
        // Permitir un poco más de tiempo para leer el acertijo, pero la IA YA eligió
        await new Promise((resolve) => setTimeout(resolve, 2000));
        messageType.value = "info"; // Restaurar
        gameMessage.value = "La IA ha elegido..."; // Mensaje antes de revelar
      }

      iaChoice.value = chosenIaMove;
      iaThinkingDisplayChoice.value = chosenIaMove;
      gameState.value = "iaChosen";
      iaHasChosen.value = true;
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Resultado
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
        playerWins.value++; // Sumar victoria al jugador
      } else {
        result.value = "¡Perdiste esta ronda!";
        messageType.value = "error";
        roundWinner = "ia";
        roundLoser.value = "player";
        iaWins.value++; // Sumar victoria a la IA
      }

      gameState.value = "showingResult";
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (roundWinner !== "draw") {
        explosionTimestamp.value = Date.now(); // reinicio del GIF
        showExplosion.value = true;
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 50));
        explosionSound.play();

        await new Promise((resolve) => setTimeout(resolve, 300));
        gameState.value = "roundOver"; // activa clase CSS que oculta al perdedor

        await new Promise((resolve) => setTimeout(resolve, 1200));
        showExplosion.value = false;
      } else {
        showExplosion.value = false;
        await new Promise((resolve) => setTimeout(resolve, 800));
        gameState.value = "roundOver";
      }

      // --- Fin de la ronda, verificar el estado del juego ---
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
        // Si el juego no ha terminado, pasar a la siguiente ronda
        currentRound.value++;
        if (currentRound.value <= totalRounds) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Pequeña pausa antes de la siguiente ronda
          resetRound();
        } else {
          // Esto debería ser un caso de empate si no se alcanzó la victoria en totalRounds
          // O una victoria si totalRounds es par y hay un desempate.
          // Para "mejor de 5", esto no debería alcanzarse si el juego termina antes.
          gameMessage.value =
            "¡Fin del juego! Resultado final. Puedes jugar de nuevo.";
          gameFinished.value = true;
          emit("round-finished", { winner: "draw", score: playerWins.value });
        }
      }
    };

    const useAbility = (abilityName, blockedChoice = null) => {
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
      activeAbility.value = abilityName; // Marca la habilidad activa para esta ronda
      abilitySound.play(); // Reproducir sonido al activar

      if (abilityName === "bloqueo") {
        iaBlockedChoice.value = blockedChoice; // Guardar la elección a bloquear
        gameMessage.value = `¡Habilidad 'Bloqueo' activada! La IA no podrá usar ${blockedChoice} esta ronda. Elige tu jugada.`;
        messageType.value = "info";
      } else if (abilityName === "desestabilizar") {
        gameMessage.value = `¡Habilidad 'Desestabilizar' activada! La IA elegirá al azar esta ronda. Elige tu jugada.`;
        messageType.value = "info";
        // La lógica de 'desestabilizar' se aplicará dentro de getIaChoice o playRound
      } else if (abilityName === "acertijo") {
        gameMessage.value = `¡Habilidad 'Acertijo' activada! La IA te dará una pista. ¡Piensa rápido!`;
        messageType.value = "info";
        // La lógica de 'acertijo' se aplicará dentro de playRound
      }

      // Reiniciar mensaje y tipo después de un corto tiempo, si es necesario
      setTimeout(() => {
        resetMessageState();
      }, 1500);
    };

    const resetMessageState = () => {
      if (!activeAbility.value) {
        // Solo si no hay una habilidad activa que mantenga un mensaje
        gameMessage.value = "Elige tu jugada...";
        messageType.value = "info";
      }
    };

    // --- Acertijos de la IA ---
    const getRiddle = (iaChoice, difficulty) => {
      const riddles = {
        rock: {
          facil: "Soy fuerte y rompo la madera. ¿Qué soy?", // Tijera
          normal:
            "Mi núcleo es duro, pero mi superficie puede ser pulida. No me doblo fácilmente.",
          dificil:
            "En el arte de los encuentros, anulo lo afilado y soy la base de toda construcción. Soy el principio inmóvil.",
        },
        paper: {
          facil: "Me usas para escribir y me doblo fácilmente. ¿Qué soy?", // Piedra
          normal:
            "Puedo cubrir lo más duro y envolver lo que se afila. Me pliego con facilidad.",
          dificil:
            "Mi extensión es infinita, mi abrazo puede ser envolvente o sofocante. Domino el origen de la palabra.",
        },
        scissors: {
          facil: "Tengo dos hojas y corto papel. ¿Qué soy?", // Papel
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
        timeRemaining.value -= 100; // Decremento en milisegundos
        timeBarWidth.value = (timeRemaining.value / maxTimePerRound) * 100;

        if (timeRemaining.value <= 0) {
          clearInterval(timerInterval);
          timeRemaining.value = 0;
          timeBarWidth.value = 0;
          gameMessage.value = "¡Tiempo agotado! Tu elección fue aleatoria.";
          playRound(choices[Math.floor(Math.random() * choices.length)]); // Elección aleatoria
        }
      }, 100); // Actualiza cada 100ms
    };

    const stopTimer = () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    };

    onMounted(() => {
      setGameParameters(props.difficulty); // Configura los parámetros iniciales
      startGame(); // Inicia el juego completo al montarse
    });

    watch(
      () => props.difficulty,
      (newDifficulty) => {
        setGameParameters(newDifficulty); // Ajusta parámetros
        startGame(); // Reinicia el juego cuando cambia la dificultad
      }
    );

    // No olvides añadir `iaBlockedChoice` al return del setup
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
      // Funciones
      playRound,
      startGame, // Ahora el botón de reinicio llamará directamente a startGame
      useAbility, // Habilidad
      iaBlockedChoice, // Para el v-if del bloqueo
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
</style>
