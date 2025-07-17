import { ref, readonly } from "vue";

// Estado global de la IA y el juego
const aiMessage = ref("");
const aiExpression = ref("normal"); // 'normal', 'happy', 'sad', 'angry', 'thinking'
const currentMinigame = ref("PiedraPapelTijera"); // O el nombre de tu componente de minijuego inicial
const globalDifficulty = ref("normal"); // Dificultad general del juego

// Aquí podríamos añadir más refs para modificadores de minijuegos
// const pptModifiers = ref({});
// const guessNumberModifiers = ref({});

const setAiMessage = (message, expression = "normal", duration = 3000) => {
  aiMessage.value = message;
  aiExpression.value = expression;

  if (message) {
    // Limpiar el mensaje después de una duración para que no esté siempre visible
    setTimeout(() => {
      aiMessage.value = "";
      aiExpression.value = "normal"; // Volver a la expresión normal
    }, duration);
  }
};

const setMinigame = (gameName) => {
  currentMinigame.value = gameName;
  // Podrías poner un mensaje de la IA al cambiar de minijuego aquí
  setAiMessage(`¡Genial! Juguemos a ${gameName}.`, "happy");
};

const setGlobalDifficulty = (difficulty) => {
  globalDifficulty.value = difficulty;
  setAiMessage(
    `¡Prepara tu mente! La dificultad es ${difficulty}.`,
    "thinking"
  );
};

// Este composable contendrá la lógica de la IA, pero por ahora solo es una base
// Más adelante, aquí irán funciones para:
// - manejar la reacción de la IA a los resultados de las rondas
// - aplicar modificadores a los minijuegos
// - decidir cuándo hablar y qué decir

export default function useGameOrchestrator() {
  return {
    // Estado de la IA (solo lectura desde otros componentes)
    aiMessage: readonly(aiMessage),
    aiExpression: readonly(aiExpression),

    // Estado del juego
    currentMinigame: readonly(currentMinigame),
    globalDifficulty: readonly(globalDifficulty),

    // Funciones para modificar el estado
    setAiMessage,
    setMinigame,
    setGlobalDifficulty,
  };
}
