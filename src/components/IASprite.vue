<template>
  <div
    class="ia-sprite-container"
    :class="{ 'is-intervening': isIntervening }"
    :style="{ top: topPosition + 'px', right: rightPosition + 'px' }"
  >
    <div class="ia-sprite-wrapper">
      <img :src="aiSpriteSrc" :alt="altText" class="ia-sprite" />
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

/**
 * @name IASprite
 * @description
 * Componente de presentación encargado de renderizar el sprite visual de la IA.
 * Gestiona dinámicamente la imagen del sprite según la expresión facial,
 * y controla su posición y movimiento "flotante" en la pantalla, deteniéndolo
 * durante las intervenciones especiales de la IA.
 */
export default {
  name: "IASprite",
  props: {
    // El mensaje de texto actual que la IA está diciendo.
    message: {
      type: String,
      default: "",
    },
    // La expresión facial que debe mostrar el sprite.
    expression: {
      type: String,
      default: "normal",
      validator: (value) =>
        ["normal", "happy", "sad", "angry", "thinking"].includes(value),
    },
    // Bandera que indica si la IA está en modo 'intervención' (centrada y sin movimiento).
    isIntervening: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    /**
     * Propiedad computada que determina dinámicamente la ruta del archivo de imagen a mostrar
     * basándose en la 'expression' recibida como prop.
     * @returns {string} La ruta completa a la imagen del sprite.
     */
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
          return `/images/ia/coca.svg`;
      }
    });

    /**
     * Propiedad computada que genera un texto alternativo descriptivo para la imagen,
     * mejorando la accesibilidad.
     * @returns {string} El texto 'alt' para la etiqueta <img>.
     */
    const altText = computed(
      () => `Sprite de la IA en estado ${props.expression}`
    );

    // --- Lógica de Movimiento Flotante ---

    /** @type {import('vue').Ref<number>} La posición CSS 'top' del sprite. */
    const topPosition = ref(20);
    /** @type {import('vue').Ref<number>} La posición CSS 'right' del sprite. */
    const rightPosition = ref(20);
    /** @type {number|null} Referencia al intervalo de movimiento para poder limpiarlo. */
    let movementInterval;

    /**
     * Calcula una nueva posición aleatoria para el sprite dentro de los límites de la ventana.
     */
    const generateRandomPosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Dimensiones aproximadas del sprite para evitar que se salga de la pantalla
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

    /**
     * Inicia el movimiento flotante del sprite, cambiando su posición cada 4 segundos.
     */
    const startMovement = () => {
      if (!movementInterval) {
        generateRandomPosition(); // Se posiciona una vez al inicio
        movementInterval = setInterval(generateRandomPosition, 4000);
      }
    };

    /**
     * Detiene el movimiento flotante del sprite limpiando el intervalo.
     */
    const stopMovement = () => {
      clearInterval(movementInterval);
      movementInterval = null;
    };

    /**
     * Observador (watcher) que reacciona a los cambios en la prop 'isIntervening'.
     * Es el mecanismo que controla cuándo el sprite debe flotar o quedarse quieto.
     */
    watch(
      () => props.isIntervening,
      (isIntervening) => {
        if (isIntervening) {
          // Si la IA está interviniendo, se detiene el movimiento.
          stopMovement();
        } else {
          // Si la IA no está interviniendo, comienza a moverse.
          startMovement();
        }
      },
      { immediate: true } // 'immediate: true' hace que se ejecute una vez al crear el componente.
    );

    /**
     * Hook de ciclo de vida que se ejecuta antes de que el componente sea destruido.
     * Es crucial para limpiar el intervalo y evitar fugas de memoria (memory leaks).
     */
    onUnmounted(() => {
      stopMovement();
    });

    // Se exponen las propiedades computadas y el estado de la posición para que el <template> pueda usarlos.
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
/* --- ESTILOS DEL CONTENEDOR DE LA IA --- */
.ia-sprite-container {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  transition: all 1.5s ease-in-out;
}
/* --- NUEVO: Contenedor para el sprite y la burbuja --- */
.ia-sprite-wrapper {
  position: relative;
  align-items: center; /* Alinea la burbuja con la parte inferior del sprite */
  pointer-events: none; /* Permite clics dentro de este contenedor */
}

/* --- ESTILOS DEL SPRITE Y LA BURBUJA --- */
.ia-sprite {
  width: 500px; /* Tamaño de la IA a 500px */
  height: auto;
  transition: transform 0.3s ease-out, width 0.5s ease-in-out;
  pointer-events: none;
  animation: float 3s ease-in-out infinite;
  object-fit: contain; /* Mantiene la proporción de la imagen dentro del contenedor */
  align-self: flex-start; /* Para que la imagen no se estire */
}

/* --- ESCALA PARA LAS DISTINTAS EXPRESIONES (AJUSTAR VALORES) --- */
.ia-sprite.happy {
  scale: 1; /* Ajusta este valor para que se vea del mismo tamaño */
}

.ia-sprite.sad {
  scale: 1; /* Ajusta este valor para que se vea del mismo tamaño */
}

.ia-sprite.angry {
  scale: 1; /* Ajusta este valor para que se vea del mismo tamaño */
}

.ia-sprite.thinking {
  scale: 1; /* Ajusta este valor si es necesario */
  animation: pulse 1s infinite alternate;
}

.ia-dialog-bubble {
  background-color: rgba(255, 255, 255, 0.8);
  color: #333;
  padding: 10px 15px;
  border-radius: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  text-align: center;
  position: relative;
  opacity: 0;
  animation: fadeInBubble 0.3s forwards;
  pointer-events: auto;
  position: absolute; /* ¡Ahora posicionamiento absoluto! */
  top: 100px; /* Ajusta la distancia desde la parte superior del wrapper */
  right: 200px; /* Ajusta la distancia desde la derecha del wrapper */
}

.ia-dialog-bubble p {
  margin: 0;
  font-size: 0.95em;
  line-height: 1.4;
}

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

/* --- ESTILOS DEL MODO DE INTERVENCIÓN (CENTRADO) --- */
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

.ia-dialog-bubble.intervening-bubble::after {
  top: 100%;
  bottom: unset;
  left: 50%;
  transform: translateX(-50%);
  border-top: 10px solid rgba(224, 255, 224, 0.9);
  border-bottom: none;
}

/* --- KEYFRAMES DE ANIMACIÓN --- */
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
