import { ref, readonly } from "vue";

// Estado global de la IA y el juego
const aiMessage = ref("");
const aiExpression = ref("normal"); // 'normal', 'happy', 'sad', 'angry', 'thinking'
const currentMinigame = ref("PiedraPapelTijera"); // O el nombre de tu componente de minijuego inicial
const globalDifficulty = ref("normal"); // Dificultad general del juego

// Estado de los modificadores de la IA para el juego actual
const aiGameModifiers = ref({});

// Estado para la intervención central de la IA
const isAiIntervening = ref(false);
let interventionTimeout = null;

const setAiMessage = (message, expression = "normal", duration = 3000) => {
  // Clear any existing intervention timeout if a normal message overrides it
  clearTimeout(interventionTimeout);
  isAiIntervening.value = false; // Ensure not in intervention mode for normal messages

  aiMessage.value = message;
  aiExpression.value = expression;

  if (message) {
    setTimeout(() => {
      aiMessage.value = "";
      aiExpression.value = "normal"; // Volver a la expresión normal
    }, duration);
  }
};

const interveneAi = (message, expression = "normal", duration = 4000) => {
  clearTimeout(interventionTimeout); // Limpiar cualquier timeout anterior

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

const decideAndApplyAiModifiers = (gameName, playerScore, iaScore) => {
  aiGameModifiers.value = {}; // Reinicia los modificadores

  let messageToDisplay = "";
  let expressionToUse = "normal";
  let shouldIntervene = false; // Flag para decidir si usamos interveneAi

  // Lógica de decisión de la IA basada en el juego, dificultad y puntuación
  if (gameName === "AdivinaNumero") {
    // Calcular la diferencia de puntuación
    const scoreDifference = playerScore - iaScore; // Positivo si jugador gana, negativo si IA gana

    // Modificadores base por dificultad
    if (globalDifficulty.value === "facil") {
      const rand = Math.random();
      if (scoreDifference < -1 && rand < 0.4) {
        // Si la IA gana por mucho
        aiGameModifiers.value.maxAttempts = 1; // Dar un intento extra al jugador
        messageToDisplay =
          "Veo que te cuesta un poco... ¡Te daré una ayudita esta vez!";
        expressionToUse = "happy";
      }
    } else if (globalDifficulty.value === "normal") {
      const rand = Math.random();
      if (scoreDifference > 0 && rand < 0.5) {
        // Si el jugador va ganando
        aiGameModifiers.value.maxAttempts = -1; // Quitar un intento
        messageToDisplay =
          "¡No te voy a dejar ganar tan fácil! Un pequeño ajuste...";
        expressionToUse = "angry";
        shouldIntervene = true;
      } else if (scoreDifference < 0 && rand < 0.2) {
        // Si la IA va ganando
        messageToDisplay =
          "¡Soy imparable! ¡Ni mis propias reglas me detendrán!";
        expressionToUse = "happy";
      }
    } else if (globalDifficulty.value === "dificil") {
      const rand = Math.random();

      if (scoreDifference > 1 && rand < 0.7) {
        // Jugador gana por mucho, IA se vuelve drástica
        // 70% de probabilidad de aplicar un modificador drástico
        const drasticRand = Math.random();
        if (drasticRand < 0.5) {
          // 50% de probabilidad de invertir pistas
          aiGameModifiers.value.invertHints = true;
          messageToDisplay =
            '¡Cuidado! Mi análisis de datos indica que mis "sugerencias" pueden ser... engañosas. ¡Jajaja!';
          expressionToUse = "thinking";
          shouldIntervene = true;
        } else {
          // 50% de probabilidad de rango dinámico
          aiGameModifiers.value.dynamicRangeShift = true;
          messageToDisplay =
            "¡El universo de números es... inestable! ¡Prepárate para la incertidumbre!";
          expressionToUse = "angry";
          shouldIntervene = true;
        }
      } else if (scoreDifference > 0 && rand < 0.4) {
        // Jugador gana por poco, IA con modificador menos drástico
        aiGameModifiers.value.maxAttempts = -1; // Quitar un intento
        aiGameModifiers.value.narrowRange = true; // Rango más estrecho
        messageToDisplay =
          "¡Me estás desafiando, humano! ¡Esta vez el desafío es mayor!";
        expressionToUse = "angry";
        shouldIntervene = true;
      } else if (scoreDifference < -1 && rand < 0.3) {
        // IA gana por mucho, se jacta o "da una pequeña ventaja"
        // La IA podría incluso reducir ligeramente el maxRange para el jugador, o no hacer nada
        aiGameModifiers.value.maxRange = 15; // Un rango más pequeño, aparentemente "fácil" pero en dificultad alta sigue siendo un reto.
        messageToDisplay =
          "¡Qué fácil me lo pones! Te daré un rango más pequeño para que no te pierdas tanto... ¡Jajaja!";
        expressionToUse = "happy";
      } else if (scoreDifference === 0 && rand < 0.6) {
        // Empate o juego reñido
        aiGameModifiers.value.maxAttempts = -1; // Quitar un intento
        messageToDisplay =
          "Esto está muy reñido... ¡Veremos si puedes con un desafío extra!";
        expressionToUse = "thinking";
        shouldIntervene = true;
      }
    }
  }
  // Puedes añadir lógica para otros minijuegos aquí
  // else if (gameName === 'PiedraPapelTijera') { ... }

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
    isAiIntervening: readonly(isAiIntervening),

    // Estado del juego
    currentMinigame: readonly(currentMinigame),
    globalDifficulty: readonly(globalDifficulty),

    // Funciones para modificar el estado
    setAiMessage,
    setMinigame,
    setGlobalDifficulty,
    decideAndApplyAiModifiers,
    interveneAi,
  };
}
