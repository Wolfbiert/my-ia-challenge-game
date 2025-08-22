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
  // Probabilidades para Adivina el Número
  AdivinaNumero: {
    facil: {
      maxAttempts: {
        chance: 0.3,
        value: 1,
        message: "Veo que te cuesta un poco... ¡Te daré una ayudita esta vez!",
        expression: "happy",
        intervene: false,
        duration: 6000,
      },
    },
    normal: {
      maxAttempts: {
        chance: 0.4,
        value: -2,
        message: "¡No te voy a dejar ganar tan fácil! Un pequeño ajuste...",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
      narrowRange: {
        chance: 0.2,
        value: true,
        message:
          "Esto está muy reñido... ¡Veremos si puedes con un desafío extra!",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
    },
    dificil: {
      maxAttempts: {
        chance: 0.5,
        value: -3,
        message: "¡Me estás desafiando, humano! ¡Esta vez el desafío es mayor!",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
      narrowRange: {
        chance: 0.3,
        value: true,
        message: "No creas que será tan sencillo. ¡El espacio se reduce!",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
      invertHints: {
        chance: 0.2,
        value: true,
        message: "¡Cuidado! Las pistas mienten. ¡Jajaja!",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
      dynamicRangeShift: {
        chance: 0.15,
        value: true,
        message:
          "¡El universo de números es... inestable! ¡Prepárate para la incertidumbre!",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
    },
  },
  // --- Probabilidades para Piedra, Papel o Tijera (ejemplo futuro) ---
  PiedraPapelTijera: {
    facil: {
      // Sin intervención agresiva. La IA no bloquea habilidades en fácil.
    },
    normal: {
      blockPlayerAbility: {
        chance: 0.25, // 25% de probabilidad de bloquear una habilidad
        value: "random", // Indica que se bloqueará una habilidad aleatoria
        message:
          "¡Humano! ¡Mi influencia bloquea una de tus habilidades esta ronda!",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
    },
    dificil: {
      blockPlayerAbility: {
        chance: 0.4, // 40% de probabilidad de bloquear una habilidad
        value: "random", // Bloquea una habilidad aleatoria
        message:
          "¡Mis circuitos están activos! ¡Una de tus ventajas ha sido anulada!",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
    },
  },
  // --- NUEVO: Probabilidades para Simon Dice ---
  SimonDice: {
    facil: {
      // Podríamos poner un modificador de ayuda si queremos, ej. secuencia ligeramente más corta
      // sequenceDifficulty: { chance: 0.2, value: { length: 0.8, speed: 1.0 }, message: '¡No te estreses! Un poco más fácil para ti.', expression: 'happy', intervene: false }
    },
    normal: {
      sequenceDifficulty: {
        chance: 0.3,
        value: { length: 1.2, speed: 0.8 }, // 20% más larga, 20% más rápida
        message: "¡Sube la velocidad! ¿Puedes seguirme?",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
    },
    dificil: {
      sequenceDifficulty: {
        chance: 0.4,
        value: { length: 1.5, speed: 0.6 }, // 50% más larga, 40% más rápida
        message:
          "¡Mis secuencias son un desafío para los más audaces! ¡Demuéstrame tu memoria!",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
      nonRepeatingSequence: {
        chance: 0.2, // 20% de probabilidad
        value: true,
        message:
          "¡El patrón... ha desaparecido! ¡Cada ronda es un nuevo enigma!",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
      // Posibilidad de secuencia EXTREMADAMENTE difícil
      extremeSequence: {
        chance: 0.05, // 5% de probabilidad de ser casi imposible
        value: { length: 2.5, speed: 0.3 }, // 150% más larga (2.5x), 70% más rápida (0.3x)
        message:
          "¡Estás a punto de experimentar mis límites! ¡Intenta no colapsar!",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
    },
  },
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
