<template>
  <div ref="containerRef" class="ia-sprite-container">
    <div class="ia-sprite-wrapper">
      <img
        ref="spriteRef"
        :src="aiSpriteSrc"
        :alt="altText"
        class="ia-sprite"
      />

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
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import gsap from "gsap";

export default {
  name: "IASprite",
  props: {
    message: { type: String, default: "" },
    expression: { type: String, default: "normal" },
    isIntervening: { type: Boolean, default: false },
  },
  setup(props) {
    const containerRef = ref(null);
    const spriteRef = ref(null);

    let roamTween = null;
    let floatTween = null;

    // CONSTANTE DE TAMAÑO: Ahora la IA mide 400px
    const SPRITE_SIZE = 400;

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

    const altText = computed(() => `Sprite de la IA: ${props.expression}`);

    const startFloating = () => {
      floatTween = gsap.to(spriteRef.value, {
        y: -20, // Aumentado un poco el rango de flotación por el tamaño
        duration: 1.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    };

    const startRoaming = () => {
      if (props.isIntervening) return;

      // Ajustamos los límites con el nuevo tamaño de 400px
      const maxX = window.innerWidth - SPRITE_SIZE;
      const maxY = window.innerHeight - SPRITE_SIZE;

      // Aseguramos que no sea negativo si la pantalla es pequeña
      const safeMaxX = Math.max(0, maxX);
      const safeMaxY = Math.max(0, maxY);

      const randomX = Math.random() * safeMaxX;
      const randomY = Math.random() * safeMaxY;

      roamTween = gsap.to(containerRef.value, {
        x: randomX,
        y: randomY,
        duration: "random(3, 5)",
        ease: "power1.inOut",
        onComplete: startRoaming,
      });
    };

    const moveToCenter = () => {
      if (roamTween) roamTween.kill();

      // Recalculamos el centro con el nuevo tamaño
      const centerX = window.innerWidth / 2 - SPRITE_SIZE / 2;
      const centerY = window.innerHeight / 2 - SPRITE_SIZE / 2;

      gsap.to(containerRef.value, {
        x: centerX,
        y: centerY,
        duration: 1.2,
        ease: "back.out(1.7)",
        overwrite: true,
      });
    };

    watch(
      () => props.isIntervening,
      (isIntervening) => {
        if (isIntervening) {
          moveToCenter();
        } else {
          startRoaming();
        }
      }
    );

    onMounted(() => {
      const maxX = window.innerWidth - SPRITE_SIZE;
      const maxY = window.innerHeight - SPRITE_SIZE;

      gsap.set(containerRef.value, {
        x: Math.random() * Math.max(0, maxX),
        y: Math.random() * Math.max(0, maxY),
      });

      startFloating();

      if (props.isIntervening) {
        moveToCenter();
      } else {
        startRoaming();
      }
    });

    onUnmounted(() => {
      if (roamTween) roamTween.kill();
      if (floatTween) floatTween.kill();
      gsap.killTweensOf(containerRef.value);
      gsap.killTweensOf(spriteRef.value);
    });

    return {
      aiSpriteSrc,
      altText,
      containerRef,
      spriteRef,
    };
  },
};
</script>

<style scoped>
.ia-sprite-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  pointer-events: none;
}

.ia-sprite-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ia-sprite {
  width: 500px; /* TAMAÑO AUMENTADO A 400PX */
  height: auto;
  object-fit: contain;
  /* Filtro sutil para darle profundidad */
  filter: drop-shadow(0 10px 10px rgba(0, 0, 0, 0.3));
}

/* --- BURBUJA DE DIÁLOGO --- */
.ia-dialog-bubble {
  background-color: #ffffff;
  color: #333;
  padding: 15px 25px;
  border-radius: 25px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  max-width: 280px;
  text-align: center;
  font-weight: bold;
  font-size: 1.1em;

  /* BORDE RESALTADO */
  border: 4px solid #2c3e50; /* Borde oscuro y grueso */

  /* Posicionamiento relativo al sprite */
  position: absolute;
  bottom: 65%;
  left: 50%;
  transform: translateX(-50%);

  /* ACERCADO AL SPRITE (antes 10px, ahora 5px) */
  margin-bottom: 5px;

  opacity: 0;
  animation: popIn 0.3s forwards;
  pointer-events: auto;
}

/* Estilo especial para la burbuja cuando interviene */
.ia-dialog-bubble.intervening-bubble {
  max-width: 450px;
  font-size: 1.3em;
  background-color: #e0ffe0;
  border: 4px solid #28a745; /* Borde verde para intervenciones */
  color: #155724;
  z-index: 101;
}

/* Cola de la burbuja */
.ia-dialog-bubble::after {
  content: "";
  position: absolute;
  top: 100%; /* Justo debajo del borde */
  left: 50%;
  transform: translateX(-50%);

  /* Construcción del triángulo */
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 12px solid #ffffff; /* Coincide con el fondo */

  /* TRUCO PARA EL BORDE DE LA COLA:
     Usamos drop-shadow para simular el borde de 4px en el triángulo */
  filter: drop-shadow(0 4px 0 #2c3e50);

  /* Ajuste fino para que el borde del triángulo toque el borde de la burbuja */
  margin-top: -4px;
}

/* Cola especial para intervención */
.ia-dialog-bubble.intervening-bubble::after {
  border-top-color: #e0ffe0;
  filter: drop-shadow(0 4px 0 #28a745); /* Sombra verde */
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}
</style>
