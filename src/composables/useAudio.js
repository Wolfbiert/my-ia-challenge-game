// src/composables/useAudio.js
import { ref, watch } from "vue";
import { Howl } from "howler";

/**
 * @file useAudio.js
 * @description
 * Composable de Vue 3 para gestionar el estado y los controles del audio de fondo (BGM)
 * de forma global en toda la aplicación. Utiliza la librería Howler.js para
 * un control de audio robusto.
 */

// --- ESTADO REACTIVO ---

/** @type {import('vue').Ref<boolean>} Indica si la música se está reproduciendo activamente en este momento. */
const isMusicPlaying = ref(false);

/** @type {import('vue').Ref<boolean>} Representa la preferencia del usuario. Si es 'true', la música debería sonar. */
const isMusicEnabled = ref(false);

/** @type {Howl | null} Instancia única del objeto de audio de Howler para evitar crear múltiples reproductores. */
let bgmInstance = null;

/**
 * Inicializa el objeto de audio de la música de fondo si aún no ha sido creado.
 * Esta función se llama una sola vez para cargar el archivo de audio en memoria.
 */
const initBackgroundMusic = () => {
  if (!bgmInstance) {
    bgmInstance = new Howl({
      src: ["/sounds/Mechanical.mp3"],
      html5: true, // Optimiza la carga para navegadores
      loop: true, // La música se repetirá indefinidamente
      volume: 0.3, // Volumen inicial
    });
  }
};

/**
 * Activa o desactiva la preferencia del usuario para escuchar música.
 * La lógica de reproducción/pausa real es manejada por el 'watch' a continuación.
 */
const toggleMusic = () => {
  isMusicEnabled.value = !isMusicEnabled.value;
};

/**
 * Inicia la reproducción de la música si la preferencia del usuario está activada
 * y la instancia de audio existe y no se está reproduciendo ya.
 */
const playMusic = () => {
  if (isMusicEnabled.value && bgmInstance && !bgmInstance.playing()) {
    bgmInstance.play();
    isMusicPlaying.value = true;
  }
};

/**
 * Pausa la reproducción de la música si la instancia de audio existe y está sonando.
 */
const stopMusic = () => {
  if (bgmInstance && bgmInstance.playing()) {
    bgmInstance.pause();
    isMusicPlaying.value = false;
  }
};

/**
 * Observador reactivo que conecta la preferencia del usuario (`isMusicEnabled`)
 * con las acciones de reproducir o detener la música. Este es el núcleo
 * de la automatización del control de audio.
 */
watch(isMusicEnabled, (isEnabled) => {
  if (isEnabled) {
    playMusic();
  } else {
    stopMusic();
  }
});

/**
 * Exporta la funcionalidad del composable para que pueda ser utilizada
 * en cualquier componente de Vue.
 */
export default function useAudio() {
  return {
    isMusicEnabled, // Para saber si el usuario quiere música (true/false)
    isMusicPlaying, // Para saber si la música está sonando ahora (true/false)
    initBackgroundMusic, // Función para inicializar el motor de audio
    toggleMusic, // La función principal para que el usuario controle la música
    playMusic, // Función para forzar la reproducción (si está habilitada)
    stopMusic, // Función para forzar la detención
  };
}
