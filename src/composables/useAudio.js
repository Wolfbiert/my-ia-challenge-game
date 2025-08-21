// src/composables/useAudio.js
import { ref, watch } from "vue";
import { Howl } from "howler";

// Elimina 'backgroundMusic', ya que no se usa.
const isMusicPlaying = ref(false);
const isMusicEnabled = ref(true);

let bgmInstance = null;

const initBackgroundMusic = () => {
  if (!bgmInstance) {
    bgmInstance = new Howl({
      src: ["/sounds/Mechanical.mp3"],
      html5: true,
      loop: true,
      volume: 0.3,
    });
  }
};

const toggleMusic = () => {
  if (isMusicPlaying.value) {
    stopMusic();
  } else {
    playMusic();
  }
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
