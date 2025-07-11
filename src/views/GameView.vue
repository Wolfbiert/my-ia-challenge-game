<template>
  <div class="game-view">
    <h1>¡Es Hora del Desafío!</h1>
    <p>Aquí se mostrará el mini-juego actual y los diálogos de la IA.</p>
  </div>
</template>

<script>
export default {
  name: "GameView",
};
</script>

<style scoped>
.game-view {
  padding: 20px;
}
h1 {
  color: #007bff; /* Un color azul para la vista de juego */
}
p {
  margin-top: 20px;
}
</style>
