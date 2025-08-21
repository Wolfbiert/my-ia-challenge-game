<template>
  <div
    class="ia-sprite-container"
    :class="{ 'is-intervening': isIntervening }"
    :style="{ top: topPosition + 'px', right: rightPosition + 'px' }"
  >
    <img :src="aiSpriteSrc" :alt="altText" class="ia-sprite" />
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
import { computed, ref, onUnmounted, watch } from "vue";

export default {
  name: "IASprite",
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

    const altText = computed(
      () => `Sprite de la IA en estado ${props.expression}`
    );

    const topPosition = ref(20);
    const rightPosition = ref(20);
    let movementInterval;

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

    const startMovement = () => {
      if (!movementInterval) {
        generateRandomPosition();
        movementInterval = setInterval(generateRandomPosition, 4000);
      }
    };

    const stopMovement = () => {
      clearInterval(movementInterval);
      movementInterval = null;
    };

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
/* --- ESTILOS DEL CONTENEDOR DE LA IA --- */
.ia-sprite-container {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  transition: all 1.5s ease-in-out;
}

/* --- ESTILOS DEL SPRITE Y LA BURBUJA --- */
.ia-sprite {
  width: 600px;
  height: auto;
  /* Se agrega una transición para el tamaño del sprite */
  transition: transform 0.3s ease-out, width 0.5s ease-in-out,
    scale 0.5s ease-in-out;
  pointer-events: none;
  animation: float 3s ease-in-out infinite;
  transform-origin: center center;
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
  margin-right: 20px;
  margin-bottom: 10px;
  max-width: 200px;
  text-align: center;
  position: relative;
  opacity: 0;
  animation: fadeInBubble 0.3s forwards;
  pointer-events: auto;
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

  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
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
  width: 200px;
  animation: none;
  margin-bottom: 20px;
  /* Se reinicia la escala al intervenir para que el width sea el que mande */
  scale: 1;
  /* El sprite permite clics en modo de intervención */
  pointer-events: auto;
}

.ia-sprite-container.is-intervening .ia-dialog-bubble {
  margin-top: -20px;
  margin-bottom: 0;
  background-color: rgba(224, 255, 224, 0.9);
  color: #105010;
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
  border: 2px solid #00aa00;
  max-width: 350px;
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
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0px);
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
