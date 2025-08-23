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
/**
 * @name HighScoresView
 * @description
 * Esta vista fue diseñada para mostrar una tabla con las puntuaciones más altas
 * logradas en los desafíos. Actualmente, se encuentra como un marcador de posición
 * (placeholder) y no contiene lógica implementada para guardar o mostrar puntajes.
 * Su funcionalidad podría ser añadida en futuras versiones del juego.
 */
export default {
  name: "HighScoresView",
};
</script>

<style scoped>
/*
  La palabra 'scoped' en la etiqueta <style> significa que las reglas CSS
  definidas aquí solo se aplicarán a este componente (HighScoresView.vue)
  y no afectarán a otros elementos de la aplicación.
*/
.highscores-view {
  padding: 20px;
}
h1 {
  color: #dc3545; /* Un color rojo para las puntuaciones */
}
p {
  margin-bottom: 30px;
}
/*
  Como indica el comentario original, si existe una clase global '.game-button',
  no es necesario redefinir sus estilos aquí, promoviendo la reutilización de código CSS.
*/
</style>
