import { ref, readonly } from "vue";

// Estado global de la IA y el juego
const aiMessage = ref("");
const aiExpression = ref("normal"); // 'normal', 'happy', 'sad', 'angry', 'thinking'
const currentMinigame = ref("PiedraPapelTijera");
const globalDifficulty = ref("normal");

// Estado de los modificadores de la IA para el juego actual
const aiGameModifiers = ref({});

// Estado para la intervención central de la IA
const isAiIntervening = ref(false);
let interventionTimeout = null;

const setAiMessage = (message, expression = "normal", duration = 3000) => {
  clearTimeout(interventionTimeout);
  isAiIntervening.value = false; // Ensure not in intervention mode for normal messages

  aiMessage.value = message;
  aiExpression.value = expression;

  if (message) {
    setTimeout(() => {
      aiMessage.value = "";
      aiExpression.value = "normal";
    }, duration);
  }
};

const interveneAi = (message, expression = "normal", duration = 4000) => {
  clearTimeout(interventionTimeout);

  isAiIntervening.value = true;
  aiMessage.value = message;
  aiExpression.value = expression;

  interventionTimeout = setTimeout(() => {
    isAiIntervening.value = false;
    aiMessage.value = "";
    aiExpression.value = "normal";
  }, duration);
};

const setMinigame = (gameName) => {
  currentMinigame.value = gameName;
  setAiMessage(`¡Genial! Juguemos a ${gameName}.`, "happy");
};

const setGlobalDifficulty = (difficulty) => {
  globalDifficulty.value = difficulty;
  setAiMessage(
    `¡Prepara tu mente! La dificultad es ${difficulty}.`,
    "thinking"
  );
};

// --- Definición de probabilidades de modificadores por dificultad ---
const modifierProbabilities = {
  // ... (El objeto modifierProbabilities se mantiene igual)
};

const decideAndApplyAiModifiers = (gameName, playerScore, iaScore) => {
  aiGameModifiers.value = {}; // Reinicia los modificadores

  let messageToDisplay = "";
  let expressionToUse = "normal";
  let shouldIntervene = false;
  let modifierApplied = false;

  const currentDifficultyProbabilities =
    modifierProbabilities[gameName]?.[globalDifficulty.value];

  if (currentDifficultyProbabilities) {
    const orderedModifiers = [];
    if (gameName === "SimonDice" && globalDifficulty.value === "dificil") {
      if (currentDifficultyProbabilities.extremeSequence) {
        orderedModifiers.push({
          name: "extremeSequence",
          config: currentDifficultyProbabilities.extremeSequence,
        });
      }
      for (const modifierName in currentDifficultyProbabilities) {
        if (modifierName !== "extremeSequence") {
          orderedModifiers.push({
            name: modifierName,
            config: currentDifficultyProbabilities[modifierName],
          });
        }
      }
    } else {
      for (const modifierName in currentDifficultyProbabilities) {
        orderedModifiers.push({
          name: modifierName,
          config: currentDifficultyProbabilities[modifierName],
        });
      }
    }

    for (const { name: modifierName, config } of orderedModifiers) {
      const rand = Math.random();

      let adjustedChance = config.chance;
      const scoreDifference = playerScore - iaScore;

      if (scoreDifference > 0) {
        adjustedChance *= 1.2;
      } else if (scoreDifference < 0) {
        adjustedChance *= 0.8;
      }
      adjustedChance = Math.min(adjustedChance, 1.0);

      if (rand < adjustedChance) {
        aiGameModifiers.value[modifierName] = config.value;
        messageToDisplay = config.message;
        expressionToUse = config.expression;
        shouldIntervene = config.intervene;
        modifierApplied = true;
        break;
      }
    }
  }

  if (!modifierApplied) {
    if (globalDifficulty.value === "facil") {
      messageToDisplay = `¡Vamos, tú puedes con este ${gameName}!`;
      expressionToUse = "happy";
    } else if (globalDifficulty.value === "normal") {
      messageToDisplay = `¡Que empiece la acción en ${gameName}!`;
      expressionToUse = "normal";
    } else if (globalDifficulty.value === "dificil") {
      messageToDisplay = `¡Prepárate! ¡Esta ronda de ${gameName} no será sencilla!`;
      expressionToUse = "thinking";
    }
    shouldIntervene = false;
  }

  if (messageToDisplay) {
    if (shouldIntervene) {
      interveneAi(messageToDisplay, expressionToUse);
    } else {
      setAiMessage(messageToDisplay, expressionToUse);
    }
  }
};

// --- NUEVA FUNCIÓN para manejar mensajes de los minijuegos ---
const handleGameMessage = (message, expression, intervene = false) => {
  if (intervene) {
    interveneAi(message, expression);
  } else {
    setAiMessage(message, expression);
  }
};

export default function useGameOrchestrator() {
  return {
    aiMessage: readonly(aiMessage),
    aiExpression: readonly(aiExpression),
    aiGameModifiers: readonly(aiGameModifiers),
    isAiIntervening: readonly(isAiIntervening),

    currentMinigame: readonly(currentMinigame),
    globalDifficulty: readonly(globalDifficulty),

    setAiMessage,
    setMinigame,
    setGlobalDifficulty,
    decideAndApplyAiModifiers,
    interveneAi,
    handleGameMessage, // Exportamos la nueva función
  };
}
