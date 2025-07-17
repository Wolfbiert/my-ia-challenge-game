<template>
  <div class="ia-sprite-container" :class="{ 'is-intervening': isIntervening }">
    <img
      :src="aiSpriteSrc"
      :alt="altText"
      class="ia-sprite"
      :class="aiExpression"
    />
    <div
      v-if="message"
      class="ia-dialog-bubble"
      :class="{ 'intervening-bubble': isIntervening }"
    >
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";

export default {
  name: "IASprite",
  props: {
    message: {
      type: String,
      default: "",
    },
    expression: {
      type: String,
      default: "normal", // 'normal', 'happy', 'sad', 'angry', etc.
      validator: (value) =>
        ["normal", "happy", "sad", "angry", "thinking"].includes(value),
    },
    // --- NUEVO: Prop para indicar el modo de intervención ---
    isIntervening: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const aiSpriteSrc = computed(() => {
      // Puedes mapear expresiones a diferentes imágenes aquí
      switch (props.expression) {
        case "happy":
          return "/images/ia/coca_happy.svg"; // Asume que tienes un sprite para feliz
        case "sad":
          return "/images/ia/coca_sad.svg"; // Asume que tienes un sprite para triste
        case "angry":
          return "/images/ia/coca_angry.svg"; // Asume que tienes un sprite para enojado
        case "thinking":
          return "/images/ia/coca_thinking.svg"; // Asume que tienes un sprite para pensando
        default:
          return `/images/ia/coca.svg`; // Sprite normal por defecto
      }
    });

    const altText = computed(
      () => `Sprite de la IA en estado ${props.expression}`
    );

    return {
      aiSpriteSrc,
      altText,
    };
  },
};
</script>

<style scoped>
.ia-sprite-container {
  position: absolute; /* Permitirá posicionarlo fácilmente en GameView */
  right: 20px; /* Posiciona 20px desde la derecha del contenedor padre */
  bottom: 20px; /* Posiciona 20px desde la parte inferior del contenedor padre */
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* Alinea los elementos (sprite y burbuja) a la derecha */
  z-index: 100; /* Asegura que esté por encima de otros elementos */
  pointer-events: none; /* Asegura que no bloquee clics en elementos debajo */
  transition: all 0.5s ease-in-out, transform 0.3s ease-out; /* Transición para movimiento y animaciones */
  min-width: 150px; /* Asegura que el contenedor tenga un tamaño base */
}

/* --- NUEVOS ESTILOS PARA MODO INTERVENCIÓN --- */
.ia-sprite-container.is-intervening {
  left: 50%; /* Centra horizontalmente */
  top: 50%; /* Centra verticalmente */
  transform: translate(-50%, -50%); /* Ajusta para el centro exacto */
  background-color: rgba(0, 0, 0, 0.7); /* Fondo oscuro semitransparente */
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); /* Resplandor verde */
  z-index: 1000; /* Muy alto para que esté por encima de todo */
  pointer-events: auto; /* Permite interacciones si el modo central es interactivo */
  flex-direction: column; /* Asegura que los elementos sigan siendo columna */
  align-items: center; /* Centra los elementos dentro del contenedor */
  justify-content: center; /* Centra verticalmente los elementos */
  width: auto; /* Ajusta el ancho automáticamente */
  max-width: 80%; /* No se extienda demasiado */
}

.ia-sprite-container.is-intervening .ia-sprite {
  width: 200px; /* Un poco más grande en el centro */
  height: auto;
  animation: none; /* Desactiva la animación de flotar cuando interviene */
  transform: none; /* Resetea cualquier transformación de expresión */
}

.ia-sprite-container.is-intervening .ia-dialog-bubble {
  margin: 20px 0 0 0; /* Ajusta márgenes para centrar la burbuja */
  max-width: 350px; /* Más ancho para el mensaje central */
  text-align: center;
  background-color: #e0ffe0; /* Un color de burbuja que destaque más en el modo intervención */
  color: #105010;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
  border: 2px solid #00aa00;
}

/* Ajuste de la cola de la burbuja para el modo intervención (apunta hacia arriba) */
.ia-dialog-bubble.intervening-bubble::after {
  left: 50%; /* Centra la cola */
  bottom: unset; /* Desactiva el bottom original */
  top: -10px; /* Posiciona la cola en la parte superior de la burbuja */
  border-top: none;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid #e0ffe0; /* Color de la cola igual al nuevo fondo de la burbuja */
  transform: translateX(-50%); /* Ajusta la posición de la cola */
}
/* Fin de estilos de intervención */

.ia-sprite {
  width: 150px; /* Ajusta el tamaño de tu sprite */
  height: auto;
  transition: transform 0.3s ease-out; /* Transición para animaciones sutiles */
  pointer-events: auto; /* Permite interacciones si la burbuja está sobre él */
  /* Animación de flotación sutil */
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* Clases para expresiones (ejemplo) */
.ia-sprite.happy {
  /* Puedes añadir transformaciones o filtros para expresiones */
}
.ia-sprite.thinking {
  animation: pulse 1s infinite alternate; /* Ejemplo de animación para "pensando" */
}
@keyframes pulse {
  from {
    opacity: 0.8;
    transform: scale(0.95) translateY(0px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(-8px);
  }
}

.ia-dialog-bubble {
  background-color: #fff; /* Fondo de la burbuja */
  color: #333; /* Color del texto */
  padding: 10px 15px;
  border-radius: 20px; /* Forma de burbuja */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-right: 20px; /* Espacio para que no choque con el sprite */
  margin-bottom: 10px; /* Posición encima del sprite */
  max-width: 200px; /* Ancho máximo para el texto */
  text-align: center;
  position: relative; /* Para la cola de la burbuja */
  opacity: 0; /* Por defecto oculta */
  animation: fadeInBubble 0.3s forwards; /* Animación de aparición */
  pointer-events: auto; /* Permite clic en la burbuja si es interactiva */
}

.ia-dialog-bubble p {
  margin: 0;
  font-size: 0.95em;
  line-height: 1.4;
}

/* Cola de la burbuja de diálogo */
.ia-dialog-bubble::after {
  content: "";
  position: absolute;
  right: 15px; /* Posiciona la cola en el lado derecho de la burbuja */
  bottom: -10px; /* Ajusta para que la cola apunte hacia abajo */
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #fff; /* Color de la cola igual al fondo de la burbuja */
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1)); /* Sombra para la cola */
}

@keyframes fadeInBubble {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
