<template>
  <div class="home-view">
    <h1>Bienvenido al Desafío de la IA!</h1>
    <p>
      ¡Prepárate para poner a prueba tu ingenio contra el maestro de los
      mini-juegos!
    </p>

    <div class="buttons-container">
      <router-link to="/game">
        <button class="game-button primary">Iniciar Juego</button>
      </router-link>

      <router-link to="/highscores">
        <button class="game-button secondary">Puntuaciones Altas</button>
      </router-link>
    </div>
  </div>
</template>

<script>
// No necesitamos mucha lógica aquí por ahora, ya que solo es la pantalla de bienvenida.
export default {
  name: "HomeView",
};
</script>

<style scoped>
/* Los estilos con 'scoped' solo afectarán a este componente HomeView.vue */
.home-view {
  padding: 20px;
}

h1 {
  color: #42b983; /* Un color de Vue verde */
  margin-bottom: 20px;
}

p {
  font-size: 1.1em;
  margin-bottom: 30px;
}

.buttons-container {
  display: flex;
  flex-direction: column; /* Apila los botones verticalmente */
  gap: 15px; /* Espacio entre los botones */
  max-width: 300px; /* Limita el ancho del contenedor de botones */
  margin: 0 auto; /* Centra el contenedor de botones */
}

.game-button {
  padding: 12px 25px;
  font-size: 1.2em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%; /* Ocupa todo el ancho disponible en el contenedor */
}

.game-button.primary {
  background-color: #42b983;
  color: white;
}

.game-button.primary:hover {
  background-color: #368a68;
}

.game-button.secondary {
  background-color: #e0e0e0;
  color: #333;
  border: 1px solid #ccc;
}

.game-button.secondary:hover {
  background-color: #d0d0d0;
}
</style>
