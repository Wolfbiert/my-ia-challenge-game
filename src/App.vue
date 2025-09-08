<template>
  <div id="app">
    <video autoplay muted loop id="background-video">
      <source :src="`${baseUrl}videos/background.mp4`" type="video/mp4" />
      Tu navegador no soporta el video de fondo.
    </video>

    <router-view />
  </div>
</template>

<script>
import { onMounted } from "vue";
import useAudio from "./composables/useAudio.js";

// Función segura para obtener BASE_URL
function getBaseUrl() {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.BASE_URL
  ) {
    return import.meta.env.BASE_URL;
  }
  return "/";
}

export default {
  name: "App",
  setup() {
    const { initBackgroundMusic } = useAudio();
    const baseUrl = getBaseUrl();

    onMounted(() => {
      initBackgroundMusic();
    });

    return {
      baseUrl,
    };
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f0f0f0;
}

#background-video {
  position: fixed;
  right: 0;
  bottom: 0;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  z-index: -100;
  background-size: cover;
}
</style>
