// src/composables/useAudio.js
import { ref, watch } from "vue";
import { Howl } from "howler";

const isMusicPlaying = ref(false);
const isMusicEnabled = ref(false);

let bgmInstance = null;

const initBackgroundMusic = () => {
  if (!bgmInstance) {
    const soundPath =
      process.env.NODE_ENV === "production"
        ? `${__static}/sounds/Mechanical.mp3`
        : "/sounds/Mechanical.mp3";

    bgmInstance = new Howl({
      src: [soundPath],
      html5: true,
      loop: true,
      volume: 0.3,
    });
  }
};

const toggleMusic = () => {
  isMusicEnabled.value = !isMusicEnabled.value;
};

const playMusic = () => {
  if (isMusicEnabled.value && bgmInstance && !bgmInstance.playing()) {
    bgmInstance.play();
    isMusicPlaying.value = true;
  }
};

const stopMusic = () => {
  if (bgmInstance && bgmInstance.playing()) {
    bgmInstance.pause();
    isMusicPlaying.value = false;
  }
};

watch(isMusicEnabled, (isEnabled) => {
  if (isEnabled) {
    playMusic();
  } else {
    stopMusic();
  }
});

export default function useAudio() {
  return {
    isMusicEnabled,
    isMusicPlaying,
    initBackgroundMusic,
    toggleMusic,
    playMusic,
    stopMusic,
  };
}
