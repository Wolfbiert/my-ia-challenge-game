import { ref, readonly } from "vue";

/**
 * @file useGameOrchestrator.js
 * @description
 * Este composable es el cerebro y centro de estado de la IA para todo el desafío.
 * Gestiona los diálogos, la dificultad, los modificadores de juego y el estado
 * general de la IA, proveyendo una API centralizada para que todos los componentes
 * puedan interactuar con ella de forma consistente.
 */

// ====================================================================================
// SECCIÓN 1: ESTADO GLOBAL REACTIVO
// Aquí se define el estado central que será compartido a través de toda la aplicación.
// Este estado es reactivo, lo que significa que cualquier componente que lo use se
// actualizará automáticamente cuando sus valores cambien.
// ====================================================================================

/** @type {import('vue').Ref<string>} Mensaje actual que muestra la IA. */
const aiMessage = ref("");

/** @type {import('vue').Ref<string>} Expresión facial de la IA ('normal', 'happy', 'angry', 'thinking', 'sad'). */
const aiExpression = ref("normal");

/** @type {import('vue').Ref<string>} La dificultad global del desafío ('facil', 'normal', 'dificil'). */
const globalDifficulty = ref("normal");

/** @type {import('vue').Ref<object>} Objeto que contiene los modificadores de juego activos para la ronda actual. */
const aiGameModifiers = ref({});

/** @type {import('vue').Ref<boolean>} Bandera que indica si la IA está en modo 'intervención' (sprite centrado). */
const isAiIntervening = ref(false);

/** @type {number|null} Referencia al temporizador de los mensajes para poder cancelarlo. */
let messageTimeout = null;

// ====================================================================================
// SECCIÓN 2: CONTROL DE MENSAJES DE LA IA
// Funciones para manejar la visualización de diálogos de la IA.
// ====================================================================================

/**
 * Muestra un mensaje estándar de la IA.
 * @param {string} message El texto a mostrar.
 * @param {string} expression La expresión facial de la IA.
 * @param {number} duration La duración del mensaje en milisegundos.
 */
const setAiMessage = (message, expression = "normal", duration = 5000) => {
  clearTimeout(messageTimeout); // Cancela cualquier mensaje anterior para evitar solapamientos
  isAiIntervening.value = false; // Asegura que no esté en modo intervención

  aiMessage.value = message;
  aiExpression.value = expression;

  // Si hay un mensaje y una duración, se programa su borrado
  if (message && duration) {
    messageTimeout = setTimeout(() => {
      aiMessage.value = "";
      aiExpression.value = "normal";
    }, duration);
  }
};

/**
 * Muestra un mensaje de 'intervención' de la IA, donde el sprite se mueve al centro.
 * @param {string} message El texto a mostrar.
 * @param {string} expression La expresión facial de la IA.
 * @param {number} duration La duración del mensaje en milisegundos.
 */
const interveneAi = (message, expression = "normal", duration = 5000) => {
  clearTimeout(messageTimeout); // Cancela cualquier mensaje anterior
  isAiIntervening.value = true; // Activa el modo intervención

  aiMessage.value = message;
  aiExpression.value = expression;

  if (message && duration) {
    messageTimeout = setTimeout(() => {
      isAiIntervening.value = false; // Desactiva la intervención al terminar
      aiMessage.value = "";
      aiExpression.value = "normal";
    }, duration);
  }
};

// ====================================================================================
// SECCIÓN 3: CONTROL DE ESTADO DEL JUEGO
// Funciones para modificar el estado general del desafío.
// ====================================================================================

/**
 * Actualiza la dificultad global del juego y notifica al jugador.
 * @param {string} difficulty La nueva dificultad.
 */
const setGlobalDifficulty = (difficulty) => {
  globalDifficulty.value = difficulty;
  setAiMessage(
    `¡Prepara tu mente! La dificultad es ${difficulty}.`,
    "thinking"
  );
};

// ====================================================================================
// SECCIÓN 4: LÓGICA DE MODIFICADORES DE LA IA
// Este objeto define las posibles trampas o ayudas que la IA puede aplicar
// en cada juego y dificultad, dándole personalidad y variabilidad al gameplay.
// ====================================================================================

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
  // Probabilidades para Piedra, Papel o Tijera
  PiedraPapelTijera: {
    facil: {},
    normal: {
      blockPlayerAbility: {
        chance: 0.25,
        value: "random",
        message:
          "¡Humano! ¡Mi influencia bloquea una de tus habilidades esta ronda!",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
    },
    dificil: {
      blockPlayerAbility: {
        chance: 0.4,
        value: "random",
        message:
          "¡Mis circuitos están activos! ¡Una de tus ventajas ha sido anulada!",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
    },
  },
  // Probabilidades para Simon Dice
  SimonDice: {
    facil: {},
    normal: {
      sequenceDifficulty: {
        chance: 0.3,
        value: { length: 1.2, speed: 0.8 },
        message: "¡Sube la velocidad! ¿Puedes seguirme?",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
    },
    dificil: {
      sequenceDifficulty: {
        chance: 0.4,
        value: { length: 1.5, speed: 0.6 },
        message:
          "¡Mis secuencias son un desafío para los más audaces! ¡Demuéstrame tu memoria!",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
      nonRepeatingSequence: {
        chance: 0.2,
        value: true,
        message:
          "¡El patrón... ha desaparecido! ¡Cada ronda es un nuevo enigma!",
        expression: "thinking",
        intervene: true,
        duration: 6000,
      },
      extremeSequence: {
        chance: 0.05,
        value: { length: 2.5, speed: 0.3 },
        message:
          "¡Estás a punto de experimentar mis límites! ¡Intenta no colapsar!",
        expression: "angry",
        intervene: true,
        duration: 6000,
      },
    },
  },
};

// ====================================================================================
// SECCIÓN 5: LÓGICA CENTRAL DE LA IA
// Funciones que actúan como el "cerebro" de la IA.
// ====================================================================================

/**
 * Decide si la IA debe aplicar un modificador al inicio de una ronda.
 * La probabilidad puede ajustarse dinámicamente según si el jugador va ganando o perdiendo.
 * @param {string} gameName El nombre del minijuego actual.
 * @param {number} playerScore La puntuación global del jugador.
 * @param {number} iaScore La puntuación global de la IA.
 */
const decideAndApplyAiModifiers = (gameName, playerScore, iaScore) => {
  aiGameModifiers.value = {}; // Resetea los modificadores de la ronda anterior

  // Variables temporales para construir la respuesta de la IA
  let messageToDisplay = "";
  let expressionToUse = "normal";
  let shouldIntervene = false;
  let modifierApplied = false;
  let messageDuration = 5000;

  const currentDifficultyProbabilities =
    modifierProbabilities[gameName]?.[globalDifficulty.value];

  // Si existen modificadores para el juego y dificultad actual...
  if (currentDifficultyProbabilities) {
    // Itera sobre los posibles modificadores
    for (const modifierName in currentDifficultyProbabilities) {
      const config = currentDifficultyProbabilities[modifierName];
      let adjustedChance = config.chance; // Probabilidad base del modificador
      const scoreDifference = playerScore - iaScore;

      // La IA "se frustra" o "se relaja" según el marcador, ajustando la probabilidad
      if (scoreDifference > 0) {
        // Si el jugador va ganando...
        adjustedChance *= 1.2; // Aumenta la chance de que la IA aplique un modificador
      } else if (scoreDifference < 0) {
        // Si el jugador va perdiendo...
        adjustedChance *= 0.8; // Disminuye la chance, la IA se confía
      }

      // Se lanza el "dado" virtual
      if (Math.random() < Math.min(adjustedChance, 1.0)) {
        // El modificador se activa
        aiGameModifiers.value[modifierName] = config.value;
        messageToDisplay = config.message;
        expressionToUse = config.expression;
        shouldIntervene = config.intervene;
        messageDuration = config.duration;
        modifierApplied = true;
        break; // Solo se aplica un modificador por ronda
      }
    }
  }

  // Si ningún modificador fue activado, se elige un mensaje genérico de inicio de ronda
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
  }

  // Finalmente, se muestra el mensaje decidido (ya sea de un modificador o el genérico)
  if (messageToDisplay) {
    if (shouldIntervene) {
      interveneAi(messageToDisplay, expressionToUse, messageDuration);
    } else {
      setAiMessage(messageToDisplay, expressionToUse, messageDuration);
    }
  }
};

// ====================================================================================
// SECCIÓN 6: FUNCIÓN UNIFICADA PARA MENSAJES
// ====================================================================================

/**
 * Función centralizada que los componentes de minijuegos deben usar para comunicarse con la IA.
 * Simplifica la lógica al no tener que importar 'setAiMessage' e 'interveneAi' por separado.
 * @param {string} message El texto del mensaje.
 * @param {string} expression La expresión de la IA.
 * @param {boolean} intervene Si la IA debe hacer una intervención.
 * @param {number|null} duration La duración del mensaje.
 */
const handleGameMessage = (
  message,
  expression,
  intervene = false,
  duration = 5000
) => {
  const finalDuration = duration !== null ? duration : 5000;
  if (intervene) {
    interveneAi(message, expression, finalDuration);
  } else {
    setAiMessage(message, expression, finalDuration);
  }
};

// ====================================================================================
// SECCIÓN 7: EXPORTACIÓN DEL COMPOSABLE
// Se empaqueta y exporta toda la funcionalidad para que pueda ser utilizada
// por cualquier componente con un simple 'useGameOrchestrator()'.
// ====================================================================================

export default function useGameOrchestrator() {
  return {
    // --- ESTADO (EXPORTADO COMO 'READONLY') ---
    // Se usa 'readonly' para que los componentes puedan leer el estado pero no
    // modificarlo directamente. Deben usar las funciones exportadas para ello.
    // Esto previene errores y mantiene un flujo de datos predecible.
    aiMessage: readonly(aiMessage),
    aiExpression: readonly(aiExpression),
    aiGameModifiers: readonly(aiGameModifiers),
    isAiIntervening: readonly(isAiIntervening),
    globalDifficulty: readonly(globalDifficulty),

    // --- FUNCIONES (MÉTODOS PÚBLICOS) ---
    // Estas son las funciones que los componentes pueden llamar para interactuar con el orquestador.
    setGlobalDifficulty,
    decideAndApplyAiModifiers,
    handleGameMessage,
  };
}
