<template>
  <div id="app">
    <video autoplay muted loop id="background-video">
      <source :src="videoPath" type="video/mp4" />
      Tu navegador no soporta el video de fondo.
    </video>

    <router-view />
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
import useAudio from "./composables/useAudio.js";

export default {
  name: "App",
  setup() {
    const { initBackgroundMusic } = useAudio();

    const videoPath = ref(
      process.env.NODE_ENV === "production"
        ? `file://${__static}/videos/background.mp4`.replace(/\\/g, "/")
        : "/videos/background.mp4"
    );

    onMounted(() => {
      initBackgroundMusic();
    });

    return {
      videoPath,
    };
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=VT323&display=swap");

:root {
  --font-vt323: "VT323", monospace;
}

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
