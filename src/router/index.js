import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import GameView from "../views/GameView.vue"; // Importa tu nueva vista
import HighScoresView from "../views/HighScoresView.vue"; // Importa tu nueva vista

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/game", // Ruta para la pantalla de juego
    name: "game",
    component: GameView,
  },
  {
    path: "/highscores", // Ruta para las puntuaciones altas
    name: "highscores",
    component: HighScoresView,
  },
];

const router = createRouter({
  // createWebHashHistory() es crucial para que funcione correctamente en Electron
  history: createWebHashHistory(),
  routes,
});

export default router;
