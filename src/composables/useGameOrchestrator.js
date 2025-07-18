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

// --- NUEVO: Definición de probabilidades de modificadores por dificultad ---
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
      }, // Dar +1 intento
      // Otros modificadores para fácil si es necesario
    },
    normal: {
      maxAttempts: {
        chance: 0.4,
        value: -2,
        message: "¡No te voy a dejar ganar tan fácil! Un pequeño ajuste...",
        expression: "angry",
        intervene: true,
      }, // Quitar -1 intento
      narrowRange: {
        chance: 0.2,
        value: true,
        message:
          "Esto está muy reñido... ¡Veremos si puedes con un desafío extra!",
        expression: "thinking",
        intervene: true,
      }, // Estrechar rango
    },
    dificil: {
      maxAttempts: {
        chance: 0.5,
        value: -3,
        message: "¡Me estás desafiando, humano! ¡Esta vez el desafío es mayor!",
        expression: "angry",
        intervene: true,
      },
      narrowRange: {
        chance: 0.3,
        value: true,
        message: "No creas que será tan sencillo. ¡El espacio se reduce!",
        expression: "thinking",
        intervene: true,
      },
      invertHints: {
        chance: 0.2,
        value: true,
        message: "¡Cuidado! Las pistas mienten. ¡Jajaja!",
        expression: "thinking",
        intervene: true,
      },
      dynamicRangeShift: {
        chance: 0.15,
        value: true,
        message:
          "¡El universo de números es... inestable! ¡Prepárate para la incertidumbre!",
        expression: "angry",
        intervene: true,
      },
      // Podríamos añadir probabilidades más bajas para que la IA se jacte si va ganando mucho, etc.
      // Ejemplo: aiBoast: { chance: 0.1, message: '¡Qué fácil me lo pones! ¡Jajaja!', expression: 'happy', intervene: false }
    },
  },
  // --- NUEVO: Probabilidades para Piedra, Papel o Tijera (ejemplo futuro) ---
  PiedraPapelTijera: {
    facil: {
      // No hay modificadores en fácil, o quizás uno para IA sea menos agresiva
    },
    normal: {
      // Ejemplo: biasedChoice: { chance: 0.2, value: 'paper', message: 'Mmm... siento predilección por el papel hoy.', expression: 'thinking', intervene: false }
    },
    dificil: {
      // Ejemplo: anticipatePlayer: { chance: 0.1, message: 'Puedo ver tus pensamientos... ¡No te servirá de nada!', expression: 'angry', intervene: true }
    },
  },
  // --- NUEVO: Probabilidades para Simon Dice (ejemplo futuro) ---
  SimonDice: {
    facil: {},
    normal: {
      // Example: fasterSequence: { chance: 0.2, value: 0.8, message: '¡Sube la velocidad! ¿Puedes seguirme?', expression: 'happy', intervene: false }
    },
    dificil: {
      // Example: shorterReactionTime: { chance: 0.15, value: 0.5, message: '¡El tiempo se agota! Rápido, rápido...', expression: 'angry', intervene: true },
      // Example: longerSequence: { chance: 0.2, value: 1, message: '¡Mi memoria es infinita! ¿La tuya?', expression: 'thinking', intervene: true }
    },
  },
};

const decideAndApplyAiModifiers = (gameName, playerScore, iaScore) => {
  aiGameModifiers.value = {}; // Reinicia los modificadores

  let messageToDisplay = "";
  let expressionToUse = "normal";
  let shouldIntervene = false;
  let modifierApplied = false; // Flag para saber si se aplicó algún modificador con mensaje

  const currentDifficultyProbabilities =
    modifierProbabilities[gameName]?.[globalDifficulty.value];

  if (currentDifficultyProbabilities) {
    for (const modifierName in currentDifficultyProbabilities) {
      const config = currentDifficultyProbabilities[modifierName];
      const rand = Math.random();

      // Ajuste de probabilidad basado en el rendimiento:
      // Si el jugador va ganando, aumentamos ligeramente la probabilidad de que la IA aplique un modificador.
      // Si la IA va ganando, reducimos ligeramente la probabilidad (para ser menos abrumadora o para jactarse).
      let adjustedChance = config.chance;
      const scoreDifference = playerScore - iaScore;

      if (scoreDifference > 0) {
        // Jugador va ganando
        adjustedChance *= 1.2; // Aumenta la chance en un 20%
      } else if (scoreDifference < 0) {
        // IA va ganando
        adjustedChance *= 0.8; // Reduce la chance en un 20%
      }
      adjustedChance = Math.min(adjustedChance, 1.0); // Asegurar que no exceda 100%

      if (rand < adjustedChance) {
        aiGameModifiers.value[modifierName] = config.value;
        messageToDisplay = config.message;
        expressionToUse = config.expression;
        shouldIntervene = config.intervene;
        modifierApplied = true;
        break; // Aplicar solo un modificador drástico por ronda para evitar sobrecarga
      }
    }
  }

  // Si no se aplicó ningún modificador con mensaje, podemos establecer un mensaje por defecto
  if (!modifierApplied) {
    // Mensajes genéricos de inicio de ronda si no hay un modificador especial
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
    shouldIntervene = false; // Los mensajes genéricos no activan la intervención central
  }

  // Usar interveneAi si shouldIntervene es verdadero, de lo contrario, setAiMessage
  if (messageToDisplay) {
    if (shouldIntervene) {
      interveneAi(messageToDisplay, expressionToUse);
    } else {
      setAiMessage(messageToDisplay, expressionToUse);
    }
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
  };
}
