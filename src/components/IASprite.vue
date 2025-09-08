<template>
  <div
    class="ia-sprite-container"
    :class="{ 'is-intervening': isIntervening }"
    :style="{ top: topPosition + 'px', right: rightPosition + 'px' }"
  >
    <div class="ia-sprite-wrapper">
      <img :src="aiSpriteSrc" :alt="altText" class="ia-sprite" />

      <div v-if="message" class="ia-dialog-bubble">
        <p>{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onUnmounted, watch } from "vue";

export default {
  name: "IASprite",
  props: {
    message: { type: String, default: "" },
    expression: {
      type: String,
      default: "normal",
      validator: (value) =>
        ["normal", "happy", "sad", "angry", "thinking"].includes(value),
    },
    isIntervening: { type: Boolean, default: false },
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
          return "/images/ia/coca.svg";
      }
    });
    const altText = computed(
      () => `Sprite de la IA en estado ${props.expression}`
    );
    const topPosition = ref(20);
    const rightPosition = ref(20);
    let movementInterval = null;

    const generateRandomPosition = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const spriteW = 300;
      const spriteH = 300;
      topPosition.value = Math.floor(Math.random() * (vh - spriteH));
      rightPosition.value = Math.floor(Math.random() * (vw - spriteW));
    };

    const startMovement = () => {
      if (movementInterval) return;
      generateRandomPosition();
      movementInterval = setInterval(generateRandomPosition, 4000);
    };
    const stopMovement = () => {
      if (!movementInterval) return;
      clearInterval(movementInterval);
      movementInterval = null;
    };

    watch(
      () => props.isIntervening,
      (val) => {
        val ? stopMovement() : startMovement();
      },
      { immediate: true }
    );

    onUnmounted(() => stopMovement());

    return { aiSpriteSrc, altText, topPosition, rightPosition };
  },
};
</script>

<style scoped>
.ia-sprite-container {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  transition: all 1.5s ease-in-out;
}
.ia-sprite-wrapper {
  position: relative;
  align-items: center;
  pointer-events: none;
}
.ia-sprite {
  width: 500px;
  height: auto;
  transition: transform 0.3s ease-out, width 0.5s ease-in-out;
  pointer-events: none;
  animation: float 3s ease-in-out infinite;
  object-fit: contain;
  align-self: flex-start;
}
.ia-sprite.happy,
.ia-sprite.sad,
.ia-sprite.angry,
.ia-sprite.thinking {
  scale: 1;
}
.ia-sprite.thinking {
  animation: pulse 1s infinite alternate;
}

/* Burbuja igual para todos los modos */
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

/* En intervención solo detenemos animaciones y permitimos interacción */
.ia-sprite-container.is-intervening {
  z-index: 1000;
  pointer-events: auto;
  animation: none;
}
.ia-sprite-container.is-intervening .ia-sprite {
  animation: none;
}

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
