<template>
  <!-- Contenedor principal del sprite de la IA; se posiciona de forma fija -->
  <div
    class="ia-sprite-container"
    :class="{ 'is-intervening': isIntervening }"
    :style="{ top: topPosition + 'px', right: rightPosition + 'px' }"
  >
    <div class="ia-sprite-wrapper">
      <!-- Imagen del sprite; cambia según la expresión -->
      <img :src="aiSpriteSrc" :alt="altText" class="ia-sprite" />

      <!-- Burbuja de diálogo; aparece solo si hay message -->
      <div
        v-if="message"
        class="ia-dialog-bubble"
        :class="{ 'intervening-bubble': isIntervening }"
      >
        <p>{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onUnmounted, watch } from "vue";

export default {
  name: "IASprite",

  /**
   * Props del componente
   * - message: texto a mostrar en la burbuja
   * - expression: cambia el sprite según estado
   * - isIntervening: si true, centra y detiene movimiento
   */
  props: {
    message: {
      type: String,
      default: "",
    },
    expression: {
      type: String,
      default: "normal",
      validator: (value) =>
        ["normal", "happy", "sad", "angry", "thinking"].includes(value),
    },
    isIntervening: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    /** Ruta de imagen según la expresión actual */
    const aiSpriteSrc = computed(() => {
      switch (props.expression) {
        case "happy":
          return "/images/ia/coca-happy.svg";
        case "sad":
          return "/images/ia/coca-sad.svg";
        case "angry":
          return "/images/ia/coca-angry.svg";
        case "thinking":
          return "/images/ia/coca-thinking.svg";
        default:
          return "/images/ia/coca.svg";
      }
    });

    /** Texto alternativo para accesibilidad */
    const altText = computed(
      () => `Sprite de la IA en estado ${props.expression}`
    );

    /** Posición dinámica del sprite en pantalla */
    const topPosition = ref(20);
    const rightPosition = ref(20);

    /** Id del intervalo de movimiento; null cuando está parado */
    let movementInterval = null;

    /**
     * Genera una nueva posición aleatoria dentro del viewport.
     * Limita usando un ancho/alto estimado del sprite.
     */
    const generateRandomPosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const spriteWidth = 300;
      const spriteHeight = 300;

      const newTop = Math.floor(
        Math.random() * (viewportHeight - spriteHeight)
      );
      const newRight = Math.floor(
        Math.random() * (viewportWidth - spriteWidth)
      );

      topPosition.value = newTop;
      rightPosition.value = newRight;
    };

    /** Inicia el movimiento aleatorio (cada 4s) si no estaba iniciado */
    const startMovement = () => {
      if (movementInterval) return; // evita duplicar intervalos
      generateRandomPosition();
      movementInterval = setInterval(generateRandomPosition, 4000);
    };

    /** Detiene y limpia el intervalo de movimiento */
    const stopMovement = () => {
      if (!movementInterval) return;
      clearInterval(movementInterval);
      movementInterval = null;
    };

    /**
     * Observa el flag isIntervening:
     * - true: detiene el movimiento
     * - false: lo inicia
     */
    watch(
      () => props.isIntervening,
      (isIntervening) => {
        if (isIntervening) {
          stopMovement();
        } else {
          startMovement();
        }
      },
      { immediate: true }
    );

    /** Limpieza al desmontar el componente */
    onUnmounted(() => {
      stopMovement();
    });

    return {
      aiSpriteSrc,
      altText,
      topPosition,
      rightPosition,
    };
  },
};
</script>

<style scoped>
/* Contenedor fijo y transiciones suaves entre posiciones */
.ia-sprite-container {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  transition: all 1.5s ease-in-out;
}

/* Wrapper relativo para posicionar la burbuja respecto al sprite */
.ia-sprite-wrapper {
  position: relative;
  align-items: center;
  pointer-events: none;
}

/* Sprite con animación "flotar" y tamaño base */
.ia-sprite {
  width: 500px;
  height: auto;
  transition: transform 0.3s ease-out, width 0.5s ease-in-out;
  pointer-events: none;
  animation: float 3s ease-in-out infinite;
  object-fit: contain;
  align-self: flex-start;
}

/* Estados (placeholder por si necesitás ajustar escalas/animaciones) */
.ia-sprite.happy {
  scale: 1;
}
.ia-sprite.sad {
  scale: 1;
}
.ia-sprite.angry {
  scale: 1;
}
.ia-sprite.thinking {
  scale: 1;
  animation: pulse 1s infinite alternate;
}

/* Burbuja de diálogo posicionada relativa al wrapper */
.ia-dialog-bubble {
  background-color: rgba(255, 255, 255, 0.8);
  color: #333;
  padding: 10px 15px;
  border-radius: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  text-align: center;
  position: absolute;
  top: 100px;
  right: 200px;
  opacity: 0;
  animation: fadeInBubble 0.3s forwards;
  pointer-events: auto;
}

.ia-dialog-bubble p {
  margin: 0;
  font-size: 0.95em;
  line-height: 1.4;
}

/* Piquito de la burbuja */
.ia-dialog-bubble::after {
  content: "";
  position: absolute;
  right: 15px;
  bottom: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(255, 255, 255, 0.8);
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
}

/* Modo intervención: centrado, mayor z-index y sin animaciones de flote */
.ia-sprite-container.is-intervening {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  right: unset;
  bottom: unset;
  z-index: 1000;
  pointer-events: auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: auto;
  max-width: 80%;
  animation: none;
}

.ia-sprite-container.is-intervening .ia-sprite {
  width: 500px;
  animation: none;
}

.ia-sprite-container.is-intervening .ia-dialog-bubble {
  margin-top: -20px;
  margin-bottom: 0;
  max-width: 450px;
  text-align: center;
}

/* Piquito centrado para el modo intervención */
.ia-dialog-bubble.intervening-bubble::after {
  top: 100%;
  bottom: unset;
  left: 50%;
  transform: translateX(-50%);
  border-top: 10px solid rgba(224, 255, 224, 0.9);
  border-bottom: none;
}

/* Animaciones */
@keyframes float {
  0% {
    transform: translateY(0px) rotateZ(0deg);
  }
  50% {
    transform: translateY(-8px) rotateZ(5deg);
  }
  100% {
    transform: translateY(0px) rotateZ(0deg);
  }
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
