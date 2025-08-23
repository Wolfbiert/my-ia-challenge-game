<template>
  <div id="app">
    <video autoplay muted loop id="background-video">
      <source src="/videos/background.mp4" type="video/mp4" />
      Tu navegador no soporta el video de fondo.
    </video>

    <router-view />
  </div>
</template>

<script>
import { onMounted } from "vue";
import useAudio from "./composables/useAudio.js";

/**
 * @name App
 * @description
 * Este es el componente raíz de la aplicación Vue. Actúa como el punto de entrada
 * principal. Su responsabilidad es establecer el layout global (como el video de fondo),
 * renderizar las vistas a través de <router-view>, y realizar inicializaciones
 * que deben ocurrir una sola vez al cargar la aplicación, como el sistema de audio.
 */
export default {
  name: "App",
  setup() {
    // Se obtiene la función para inicializar la música desde el composable de audio.
    const { initBackgroundMusic } = useAudio();

    /**
     * Hook del ciclo de vida que se ejecuta una vez que el componente raíz se ha montado en el DOM.
     * Es el lugar ideal para inicializar servicios globales que deben estar disponibles
     * desde el inicio de la aplicación.
     */
    onMounted(() => {
      // Llama a la función del composable de audio para cargar la música de fondo en memoria.
      // Esto no la reproduce, solo la prepara para que esté lista cuando el usuario la active.
      initBackgroundMusic();
    });

    // No se retorna nada porque este componente no necesita exponer variables a su propio <template>.
    return {};
  },
};
</script>

<style>
/*
  ESTILOS GLOBALES:
  La ausencia del atributo 'scoped' en la etiqueta <style> significa que estas
  reglas CSS se aplicarán a TODA la aplicación, no solo a este componente.
  Es el lugar correcto para estilos base y reseteos.
*/

/* Estilos base para el contenedor principal de la aplicación. */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

/* Reseteo básico para el body para eliminar márgenes por defecto del navegador. */
body {
  margin: 0;
  padding: 0;
  background-color: #f0f0f0;
}

/* Estilos para posicionar el video como un fondo de pantalla completo y fijo. */
#background-video {
  position: fixed;
  right: 0;
  bottom: 0;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  z-index: -100; /* Se asegura de que el video siempre esté detrás de todo el contenido. */
  background-size: cover;
}
</style>
