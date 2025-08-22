import { ref, readonly } from "vue";

// Sección 1: Definición del Estado Reactivo
// Estas variables almacenan el estado del juego que otros componentes pueden leer.
// `ref` las hace reactivas, lo que significa que cualquier cambio activará actualizaciones en la interfaz.
// `readonly` se usa en la exportación para evitar que otros componentes modifiquen el estado directamente.
const aiMessage = ref(""); // Mensaje actual de la IA que se muestra en pantalla.
const aiExpression = ref("normal"); // Expresión actual de la IA ('happy', 'angry', etc.).
const currentMinigame = ref("PiedraPapelTijera"); // El minijuego que se está jugando actualmente.
const globalDifficulty = ref("normal"); // La dificultad global del juego.

// Estado de los modificadores de la IA para el juego actual
const aiGameModifiers = ref({}); // Objeto que guarda los modificadores activos para el minijuego.

// Estado para la intervención central de la IA
const isAiIntervening = ref(false); // Bandera booleana para indicar si la IA está interviniendo (modo central).
let interventionTimeout = null; // Variable para guardar el temporizador que oculta el mensaje de intervención.

// Sección 2: Funciones de Control de Mensajes
// Estas funciones son responsables de mostrar y ocultar los mensajes de la IA con un temporizador.
// Son el corazón del sistema de diálogo.

const setAiMessage = (message, expression = "normal", duration = 3000) => {
  // Limpia cualquier temporizador de intervención que pueda estar activo.
  clearTimeout(interventionTimeout);
  // Asegura que el modo de intervención esté desactivado para mensajes normales.
  isAiIntervening.value = false;

  // Asigna el nuevo mensaje y expresión a las variables de estado.
  aiMessage.value = message;
  aiExpression.value = expression;

  // Si hay un mensaje, configura un temporizador para ocultarlo después de 'duration' milisegundos.
  if (message) {
    setTimeout(() => {
      aiMessage.value = ""; // Borra el mensaje
      aiExpression.value = "normal"; // Restablece la expresión a "normal"
    }, duration);
  }
};

const interveneAi = (message, expression = "normal", duration = 4000) => {
  // Limpia cualquier temporizador anterior para evitar conflictos.
  clearTimeout(interventionTimeout);

  // Activa el modo de intervención para que el sprite de la IA se mueva al centro.
  isAiIntervening.value = true;
  // Asigna el mensaje y la expresión.
  aiMessage.value = message;
  aiExpression.value = expression;

  // Configura un temporizador para desactivar la intervención y borrar el mensaje.
  interventionTimeout = setTimeout(() => {
    isAiIntervening.value = false;
    aiMessage.value = "";
    aiExpression.value = "normal";
  }, duration);
};

// Sección 3: Funciones de Control de Estado del Juego
// Estas funciones manejan cambios en el estado del juego y envían un mensaje inicial a la IA.

const setMinigame = (gameName) => {
  // Cambia el minijuego actual.
  currentMinigame.value = gameName;
  // Muestra un mensaje de bienvenida de la IA.
  setAiMessage(`¡Genial! Juguemos a ${gameName}.`, "happy");
};

const setGlobalDifficulty = (difficulty) => {
  // Cambia la dificultad global.
  globalDifficulty.value = difficulty;
  // Muestra un mensaje de la IA relacionado con la dificultad.
  setAiMessage(
    `¡Prepara tu mente! La dificultad es ${difficulty}.`,
    "thinking"
  );
};

// Sección 4: Definición de Modificadores de la IA
// Este objeto es el corazón de la inteligencia de la IA. Define las reglas para cada minijuego.
// Cada propiedad (e.g., `maxAttempts`, `narrowRange`) es un posible modificador.
// Dentro de cada modificador se define:
// - `chance`: la probabilidad de que se active.
// - `value`: el valor que el modificador pasará al minijuego.
// - `message`: el mensaje de la IA cuando se activa.
// - `expression`: la expresión de la IA.
// - `intervene`: si la IA debe moverse al centro para decir el mensaje.
// - `duration`: la duración específica del mensaje (nuevo campo que agregaste).
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
        duration: 10000,
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
        duration: 10000,
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

// Sección 5: Lógica Principal para Aplicar Modificadores
// Esta es la función central que decide si aplicar un modificador al inicio de una ronda.

const decideAndApplyAiModifiers = (gameName, playerScore, iaScore) => {
  aiGameModifiers.value = {}; // Reinicia los modificadores.
  let messageToDisplay = ""; // Variable temporal para el mensaje.
  let expressionToUse = "normal"; // Variable temporal para la expresión.
  let shouldIntervene = false; // Bandera para la intervención.
  let modifierApplied = false; // Bandera para saber si se aplicó un modificador.
  let messageDuration = 0; // NUEVO: Variable para almacenar la duración del mensaje.

  const currentDifficultyProbabilities =
    modifierProbabilities[gameName]?.[globalDifficulty.value];

  // Comprueba si existen modificadores para el juego y la dificultad actuales.
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

    // Itera sobre los modificadores para ver si alguno se activa.
    for (const { name: modifierName, config } of orderedModifiers) {
      const rand = Math.random();
      let adjustedChance = config.chance;
      const scoreDifference = playerScore - iaScore;
      // Ajusta la probabilidad en función de la diferencia de puntuación.
      if (scoreDifference > 0) {
        adjustedChance *= 1.2;
      } else if (scoreDifference < 0) {
        adjustedChance *= 0.8;
      }
      adjustedChance = Math.min(adjustedChance, 1.0);

      if (rand < adjustedChance) {
        // Si el modificador se activa, guarda su configuración.
        aiGameModifiers.value[modifierName] = config.value;
        // Almacena el mensaje, expresión, estado de intervención y duración para su uso posterior.
        messageToDisplay = config.message;
        expressionToUse = config.expression;
        shouldIntervene = config.intervene;
        messageDuration = config.duration; // NUEVO: Almacena la duración.
        modifierApplied = true;
        break; // Detiene el bucle si se aplica un modificador.
      }
    }
  }

  // Si no se aplicó ningún modificador, muestra un mensaje por defecto.
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
    // Si no hay un modificador, asigna una duración por defecto
    messageDuration = 3000;
  }

  // Finalmente, muestra el mensaje, usando `interveneAi` o `setAiMessage` según corresponda.
  if (messageToDisplay) {
    if (shouldIntervene) {
      interveneAi(messageToDisplay, expressionToUse, messageDuration);
    } else {
      setAiMessage(messageToDisplay, expressionToUse, messageDuration);
    }
  }
};

// Sección 6: Función Unificada para Mensajes (Nueva)
// Esta es la función que queremos que los minijuegos usen.
const handleGameMessage = (message, expression, intervene = false) => {
  if (intervene) {
    interveneAi(message, expression);
  } else {
    setAiMessage(message, expression);
  }
};

// Sección 7: Exportación del Composable
// Aquí se exponen las variables de estado y las funciones para que otros componentes las usen.
// Se usan `readonly` en las variables de estado para evitar cambios no deseados desde fuera.
export default function useGameOrchestrator() {
  return {
    // Estado de la IA y el juego (solo lectura)
    aiMessage: readonly(aiMessage),
    aiExpression: readonly(aiExpression),
    aiGameModifiers: readonly(aiGameModifiers),
    isAiIntervening: readonly(isAiIntervening),
    currentMinigame: readonly(currentMinigame),
    globalDifficulty: readonly(globalDifficulty),

    // Funciones que pueden ser llamadas desde otros componentes.
    setAiMessage,
    setMinigame,
    setGlobalDifficulty,
    decideAndApplyAiModifiers,
    interveneAi,
    handleGameMessage,
  };
}
