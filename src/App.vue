<template>
  <div id="app"><router-view /></div>
</template>

<script>
import { onMounted } from "vue";
import useAudio from "./composables/useAudio.js"; // Asegúrate de que la ruta sea correcta

export default {
  name: "App",
  setup() {
    const { initBackgroundMusic } = useAudio();

    onMounted(() => {
      initBackgroundMusic();
    });

    return {}; // No es necesario devolver nada ya que no hay elementos reactivos en la plantilla
  },
};
</script>

<style>
/* Estos son estilos globales que afectarán a toda tu aplicación.
Puedes ajustarlos o añadir más aquí más adelante. */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center; /* Centra el texto de forma global */
  color: #2c3e50; /* Color de texto por defecto */
  margin-top: 60px; /* Esto puede mover tu contenido hacia abajo, puedes quitarlo si quieres */
}

/* Puedes añadir más estilos globales aquí */
body {
  margin: 0;
  padding: 0;
  background-color: #f0f0f0; /* Un color de fondo suave para empezar */
}
</style>
