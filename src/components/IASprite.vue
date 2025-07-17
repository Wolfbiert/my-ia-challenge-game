<template>
  <div class="ia-sprite-container">
    <img
      :src="aiSpriteSrc"
      :alt="altText"
      class="ia-sprite"
      :class="aiExpression"
    />
    <div v-if="message" class="ia-dialog-bubble">
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
    // Podemos añadir más props para controlar la posición dinámica si es necesario en el futuro
  },
  setup(props) {
    // Aquí puedes definir cómo cambia la imagen del sprite según la expresión
    const aiSpriteSrc = computed(() => {
      // Por ahora, un solo sprite. Más adelante, puedes mapear expresiones a diferentes imágenes.
      // Asegúrate de que esta ruta sea correcta para tu sprite SVG o PNG
      return `/images/ia/coca.svg`;
      // Ejemplo: return `/images/ia/gaseosa.svg`;
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
}

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
