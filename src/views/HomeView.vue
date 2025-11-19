<template>
  <div class="home-container">
    <div class="main-menu-card" ref="menuCard">
      <div class="header-section">
        <h1 class="glitch-title">DESAFÍO DE LA IA</h1>
        <p class="subtitle">SELECCIONA TU NIVEL DE ACCESO</p>
      </div>

      <div class="difficulty-grid" ref="cardsContainer">
        <button
          class="diff-card easy"
          :class="{ active: selectedDifficulty === 'facil' }"
          @click="selectDifficulty('facil')"
        >
          <div class="card-content">
            <span class="icon">🟢</span>
            <h3>FÁCIL</h3>
            <p>Iniciación</p>
          </div>
          <div class="selection-indicator"></div>
        </button>

        <button
          class="diff-card normal"
          :class="{
            active: selectedDifficulty === 'normal',
            locked: !unlockedDifficulties.includes('normal'),
          }"
          @click="selectDifficulty('normal')"
          :disabled="!unlockedDifficulties.includes('normal')"
        >
          <div class="card-content">
            <span class="icon" v-if="!unlockedDifficulties.includes('normal')"
              >🔒</span
            >
            <span class="icon" v-else>🔵</span>
            <h3>NORMAL</h3>
            <p>Estándar</p>
          </div>
          <div class="selection-indicator"></div>
        </button>

        <button
          class="diff-card hard"
          :class="{
            active: selectedDifficulty === 'dificil',
            locked: !unlockedDifficulties.includes('dificil'),
          }"
          @click="selectDifficulty('dificil')"
          :disabled="!unlockedDifficulties.includes('dificil')"
        >
          <div class="card-content">
            <span class="icon" v-if="!unlockedDifficulties.includes('dificil')"
              >🔒</span
            >
            <span class="icon" v-else>🔴</span>
            <h3>DIFÍCIL</h3>
            <p>Extremo</p>
          </div>
          <div class="selection-indicator"></div>
        </button>
      </div>

      <div class="action-area" ref="actionArea">
        <button @click="startGame" class="cyber-button start">
          <span class="btn-text">INICIAR SISTEMA</span>
        </button>
      </div>
    </div>

    <div class="audio-control" ref="audioControl">
      <button
        @click="toggleMusic"
        class="music-btn"
        :class="{ active: isMusicEnabled }"
      >
        <span class="music-icon">{{ isMusicEnabled ? "🔊" : "🔇" }}</span>
        <span class="music-label">{{
          isMusicEnabled ? "SONIDO ON" : "SONIDO OFF"
        }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import useAudio from "@/composables/useAudio.js";
import gsap from "gsap";

export default {
  name: "HomeView",
  setup() {
    const router = useRouter();
    const selectedDifficulty = ref("facil");
    const unlockedDifficulties = ref(["facil"]);
    const { isMusicEnabled, toggleMusic } = useAudio();

    // Refs para GSAP
    const menuCard = ref(null);
    const cardsContainer = ref(null);
    const actionArea = ref(null);
    const audioControl = ref(null);

    const STORAGE_KEY = "iaChallengeGameProgress";

    const loadProgress = () => {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        try {
          const parsedProgress = JSON.parse(savedProgress);
          if (parsedProgress.unlockedDifficulties) {
            unlockedDifficulties.value = parsedProgress.unlockedDifficulties;
            if (
              !unlockedDifficulties.value.includes(selectedDifficulty.value)
            ) {
              selectedDifficulty.value = "facil";
            }
          }
        } catch (e) {
          console.error("Error al parsear el progreso:", e);
        }
      }
    };

    const saveProgress = () => {
      const progress = { unlockedDifficulties: unlockedDifficulties.value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    };

    const unlockDifficulty = (level) => {
      if (!unlockedDifficulties.value.includes(level)) {
        unlockedDifficulties.value.push(level);
        saveProgress();
      }
    };

    const selectDifficulty = (difficulty) => {
      // Mapear dificultad a clase CSS
      const classMap = {
        facil: "easy",
        normal: "normal",
        dificil: "hard",
      };
      const cssClass = classMap[difficulty];

      if (unlockedDifficulties.value.includes(difficulty)) {
        selectedDifficulty.value = difficulty;
        // Pequeña animación al seleccionar
        gsap.fromTo(
          `.diff-card.${cssClass}`,
          { scale: 0.95 },
          { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 }
        );
      } else {
        // Animación de "Negado" (shake) si está bloqueado
        const btn = document.querySelector(`.diff-card.${cssClass}`);
        if (btn) {
          gsap.to(btn, {
            x: 5,
            duration: 0.05,
            repeat: 5,
            yoyo: true,
            onComplete: () => gsap.to(btn, { x: 0 }),
          });
        }
      }
    };

    const startGame = () => {
      // Animación de salida antes de cambiar de ruta
      const tl = gsap.timeline({
        onComplete: () => {
          router.push({
            name: "game",
            query: { difficulty: selectedDifficulty.value },
          });
        },
      });

      tl.to(menuCard.value, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
      });
    };

    const handleUnlockEvent = (event) => {
      const levelToUnlock = event.detail.level;
      unlockDifficulty(levelToUnlock);
    };

    onMounted(() => {
      loadProgress();
      window.addEventListener("unlockDifficulty", handleUnlockEvent);

      // --- ANIMACIÓN DE ENTRADA (INTRO) ---
      // Usar nextTick para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        try {
          const tl = gsap.timeline();

          // 1. Aparece el contenedor principal
          tl.fromTo(
            menuCard.value,
            { opacity: 0, y: -30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" }
          )
            // 2. Aparecen las tarjetas de dificultad en secuencia (stagger)
            .fromTo(
              ".diff-card",
              {
                opacity: 0,
                y: 20,
              },
              {
                opacity: 1,
                y: 0,
                stagger: 0.15,
                duration: 0.5,
                ease: "back.out(1.7)",
              },
              "-=0.3"
            )
            // 3. Aparece el botón de inicio y control de audio
            .fromTo(
              [actionArea.value, audioControl.value],
              {
                opacity: 0,
                y: 10,
              },
              {
                opacity: 1,
                y: 0,
                duration: 0.4,
              }
            );
        } catch (error) {
          console.error("Error en animación GSAP:", error);
          // Fallback: hacer visibles todos los elementos si GSAP falla
          if (menuCard.value) menuCard.value.style.opacity = "1";
          document.querySelectorAll(".diff-card").forEach((card) => {
            card.style.opacity = "1";
          });
          if (actionArea.value) actionArea.value.style.opacity = "1";
          if (audioControl.value) audioControl.value.style.opacity = "1";
        }
      }, 100);
    });

    onUnmounted(() => {
      window.removeEventListener("unlockDifficulty", handleUnlockEvent);
    });

    return {
      selectedDifficulty,
      unlockedDifficulties,
      selectDifficulty,
      startGame,
      isMusicEnabled,
      toggleMusic,
      menuCard,
      cardsContainer,
      actionArea,
      audioControl,
    };
  },
};
</script>

<style scoped>
/* Importar fuentes Cyberpunk */
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=VT323&display=swap");

.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  /* Fondo transparente para ver el video de App.vue */
  background: transparent;
  font-family: "Orbitron", sans-serif;
  padding: 20px;
  perspective: 1000px;
}

/* --- TARJETA PRINCIPAL (Glassmorphism) --- */
.main-menu-card {
  background: rgba(15, 23, 42, 0.7); /* Azul oscuro semi-transparente */
  backdrop-filter: blur(12px); /* Efecto vidrio */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 50px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  text-align: center;
  max-width: 900px;
  width: 100%;
}

/* --- HEADER --- */
.header-section {
  margin-bottom: 40px;
}

.glitch-title {
  font-size: 4rem;
  font-weight: 900;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin: 0;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
}

.subtitle {
  font-family: "VT323", monospace;
  font-size: 1.8rem;
  color: #00f3ff;
  letter-spacing: 2px;
  margin-top: 5px;
  text-shadow: 0 0 5px rgba(0, 243, 255, 0.5);
}

/* --- GRID DE DIFICULTAD --- */
.difficulty-grid {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-bottom: 50px;
  flex-wrap: wrap;
}

.diff-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  width: 160px;
  height: 220px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #ccc;
}

.diff-card:hover:not(:disabled) {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.1);
}

.card-content h3 {
  font-size: 1.4rem;
  margin: 15px 0 5px;
}
.card-content p {
  font-family: "VT323", monospace;
  font-size: 1.2rem;
  margin: 0;
  color: #888;
}
.icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}

/* Estados de las tarjetas por Dificultad */
/* FÁCIL - VERDE */
.diff-card.easy.active,
.diff-card.easy:hover:not(:disabled) {
  border-color: #4caf50;
  box-shadow: 0 0 30px rgba(76, 175, 80, 0.4);
  color: #fff;
}
.diff-card.easy.active .icon,
.diff-card.easy:hover .icon {
  text-shadow: 0 0 15px #4caf50;
}

/* NORMAL - CIAN */
.diff-card.normal.active,
.diff-card.normal:hover:not(:disabled) {
  border-color: #00f3ff;
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.4);
  color: #fff;
}
.diff-card.normal.active .icon,
.diff-card.normal:hover .icon {
  text-shadow: 0 0 15px #00f3ff;
}

/* DIFÍCIL - ROJO */
.diff-card.hard.active,
.diff-card.hard:hover:not(:disabled) {
  border-color: #f44336;
  box-shadow: 0 0 30px rgba(244, 67, 54, 0.4);
  color: #fff;
}
.diff-card.hard.active .icon,
.diff-card.hard:hover .icon {
  text-shadow: 0 0 15px #f44336;
}

/* BLOQUEADO */
.diff-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: #444;
  background: rgba(0, 0, 0, 0.4);
}
.diff-card.locked .icon {
  filter: grayscale(100%);
}

/* Indicador de selección (barra inferior) */
.selection-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: transparent;
  transition: background 0.3s;
}
.diff-card.easy.active .selection-indicator {
  background: #4caf50;
}
.diff-card.normal.active .selection-indicator {
  background: #00f3ff;
}
.diff-card.hard.active .selection-indicator {
  background: #f44336;
}

/* --- BOTÓN START --- */
.cyber-button {
  background: linear-gradient(45deg, #007bff, #00f3ff);
  border: none;
  border-radius: 50px;
  padding: 18px 60px;
  font-family: "Orbitron", sans-serif;
  font-size: 1.8rem;
  font-weight: 900;
  color: #000;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}

.cyber-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 50px rgba(0, 243, 255, 0.8);
}

.cyber-button:active {
  transform: scale(0.98);
}

/* --- CONTROL DE AUDIO (Esquina inferior izquierda) --- */
.audio-control {
  position: absolute;
  bottom: 40px;
  left: 40px;
}

.music-btn {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #444;
  color: #888;
  padding: 12px 20px;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: "VT323", monospace;
  font-size: 1.3rem;
  transition: all 0.3s;
}

.music-btn.active {
  border-color: #00f3ff;
  color: #00f3ff;
  box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
}

.music-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
