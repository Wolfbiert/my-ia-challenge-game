<template>
  <div class="highscores-view">
    <h1>Puntuaciones Altas</h1>
    <p>Aquí se mostrará la lista de los mejores desafíos.</p>
    <router-link to="/">
      <button class="game-button secondary">Volver al Inicio</button>
    </router-link>
  </div>
</template>

<script>
export default {
  name: "HighScoresView",
};
</script>

<style scoped>
.highscores-view {
  padding: 20px;
}
h1 {
  color: #dc3545; /* Un color rojo para las puntuaciones */
}
p {
  margin-bottom: 30px;
}
/* Reutilizamos los estilos de .game-button de HomeView, no necesitamos redefinirlos aquí */
</style>
