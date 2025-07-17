import { ref, readonly } from 'vue';

// Estado global de la IA y el juego
const aiMessage = ref('');
const aiExpression = ref('normal'); // 'normal', 'happy', 'sad', 'angry', 'thinking'
const currentMinigame = ref('PiedraPapelTijera'); // O el nombre de tu componente de minijuego inicial
const globalDifficulty = ref('normal'); // Dificultad general del juego

// Estado de los modificadores de la IA para el juego actual
const aiGameModifiers = ref({});

// --- NUEVO: Estado para la intervención central de la IA ---
const isAiIntervening = ref(false);
let interventionTimeout = null;

const setAiMessage = (message, expression = 'normal', duration = 3000) => {
  // Clear any existing intervention timeout if a normal message overrides it
  clearTimeout(interventionTimeout);
  isAiIntervening.value = false; // Ensure not in intervention mode for normal messages

  aiMessage.value = message;
  aiExpression.value = expression;

  if (message) {
    setTimeout(() => {
      aiMessage.value = '';
      aiExpression.value = 'normal'; // Volver a la expresión normal
    }, duration);
  }
};

// --- NUEVO: Función para la intervención central de la IA ---
const interveneAi = (message, expression = 'normal', duration = 4000) => {
    clearTimeout(interventionTimeout); // Limpiar cualquier timeout anterior

    isAiIntervening.value = true;
    aiMessage.value = message;
    aiExpression.value = expression;

    interventionTimeout = setTimeout(() => {
        isAiIntervening.value = false;
        aiMessage.value = '';
        aiExpression.value = 'normal';
    }, duration);
};


const setMinigame = (gameName) => {
  currentMinigame.value = gameName;
  setAiMessage(`¡Genial! Juguemos a ${gameName}.`, 'happy');
};

const setGlobalDifficulty = (difficulty) => {
  globalDifficulty.value = difficulty;
  setAiMessage(`¡Prepara tu mente! La dificultad es ${difficulty}.`, 'thinking');
};

const decideAndApplyAiModifiers = (gameName, playerScore, iaScore) => {
  aiGameModifiers.value = {}; // Reinicia los modificadores

  let messageToDisplay = '';
  let expressionToUse = 'normal';
  let shouldIntervene = false; // Flag para decidir si usamos interveneAi

  // Lógica de decisión de la IA basada en el juego, dificultad y puntuación
  if (gameName === 'AdivinaNumero') {
    if (globalDifficulty.value === 'dificil') {
      const rand = Math.random();
      if (playerScore > iaScore + 1 && rand < 0.7) {
        aiGameModifiers.value.maxAttempts = -1;
        aiGameModifiers.value.narrowRange = true;
        messageToDisplay = '¡Me estás desafiando, humano! ¡Esta vez te quitaré un intento y el número estará más oculto!';
        expressionToUse = 'angry';
        shouldIntervene = true; // Queremos que intervenga aquí
      } else if (iaScore > playerScore + 1 && rand < 0.3) {
        aiGameModifiers.value.minRange = 1;
        aiGameModifiers.value.maxRange = 15;
        messageToDisplay = '¡Qué fácil me lo pones! Te daré un rango más pequeño para que no te pierdas tanto... ¡Jajaja!';
        expressionToUse = 'happy';
        shouldIntervene = true; // Queremos que intervenga aquí
      } else if (playerScore === iaScore && rand < 0.5) {
        aiGameModifiers.value.maxAttempts = -1;
        messageToDisplay = 'Esto está muy reñido... ¡Veremos si puedes con un desafío extra!';
        expressionToUse = 'thinking';
        shouldIntervene = true; // Queremos que intervenga aquí
      }
    } else if (globalDifficulty.value === 'normal') {
      const rand = Math.random();
      if (playerScore > iaScore && rand < 0.5) {
        aiGameModifiers.value.maxAttempts = -1;
        messageToDisplay = '¡No te voy a dejar ganar tan fácil! Un pequeño ajuste...';
        expressionToUse = 'angry';
        shouldIntervene = true; // Queremos que intervenga aquí
      } else if (iaScore > playerScore && rand < 0.2) {
         messageToDisplay = '¡Soy imparable! ¡Ni mis propias reglas me detendrán!';
         expressionToUse = 'happy';
      }
    }
    else if (globalDifficulty.value === 'facil') {
        const rand = Math.random();
        if (playerScore < iaScore && rand < 0.4) {
            aiGameModifiers.value.maxAttempts = 1;
            messageToDisplay = 'Veo que te cuesta un poco... ¡Te daré una ayudita esta vez!';
            expressionToUse = 'happy';
        }
    }
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
    // Estado de la IA (solo lectura desde otros componentes)
    aiMessage: readonly(aiMessage),
    aiExpression: readonly(aiExpression),
    aiGameModifiers: readonly(aiGameModifiers),
    isAiIntervening: readonly(isAiIntervening), // <-- NUEVO: Exponer el estado de intervención

    // Estado del juego
    currentMinigame: readonly(currentMinigame),
    globalDifficulty: readonly(globalDifficulty),

    // Funciones para modificar el estado
    setAiMessage,
    setMinigame,
    setGlobalDifficulty,
    decideAndApplyAiModifiers,
    interveneAi, // <-- NUEVO: Exponer la función de intervención
  };
}