<template>
  <div class="game-container">
    <div class="minigame-area">
      <h2>Aquí se cargará el Mini-Juego</h2>
      <p>
        Este espacio se actualizará con Piedra, Papel o Tijera, Adivina el
        Número, etc.
      </p>
    </div>

    <div class="ia-sidebar">
      <div class="scoreboard">
        <h3>Marcador</h3>
        <p>Tú: 0 | IA: 0</p>
      </div>

      <div class="ia-display">
        <h3>Área de la IA</h3>
        <p>Mensajes de la IA irán aquí.</p>
        <div class="ia-placeholder">🤖</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GameView", // Nombre del componente
  // Por ahora no necesitamos data ni methods, ya que solo estamos estructurando la UI
};
</script>

<style scoped>
/* Estilos para el contenedor principal de la vista de juego */
.game-container {
  display: flex; /* Usamos Flexbox para organizar las dos columnas principales (minigame y ia-sidebar) */
  justify-content: center; /* Centra el contenido horizontalmente */
  align-items: flex-start; /* Alinea los elementos al inicio (arriba) */
  padding: 20px;
  gap: 20px; /* Espacio entre el área del mini-juego y la barra lateral de la IA */
  height: calc(
    100vh - 40px
  ); /* Ocupa casi toda la altura de la ventana menos el padding */
  box-sizing: border-box; /* Incluye padding en el cálculo del tamaño */
}

/* Estilos para el área donde se mostrarán los mini-juegos */
.minigame-area {
  flex-grow: 2; /* Permite que esta área crezca y ocupe más espacio */
  background-color: #ffffff;
  border: 2px solid #42b983; /* Borde verde vibrante */
  border-radius: 15px; /* Bordes redondeados */
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 400px; /* Altura mínima para que sea visible */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Sombra suave */
}

/* Estilos para la barra lateral de la IA (derecha) */
.ia-sidebar {
  flex-grow: 1; /* Permite que esta área crezca menos que el minigame-area */
  display: flex;
  flex-direction: column; /* Apila el marcador y la IA verticalmente */
  gap: 20px; /* Espacio entre el marcador y la IA */
  max-width: 300px; /* Ancho máximo para la barra lateral */
  min-width: 250px; /* Ancho mínimo para la barra lateral */
}

/* Estilos para el marcador */
.scoreboard {
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Estilos para el área de visualización de la IA */
.ia-display {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-grow: 1; /* Permite que el display de IA ocupe el espacio restante */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ia-placeholder {
  font-size: 80px; /* Tamaño grande para el emoji de robot temporal */
  margin-top: 10px;
}

h2,
h3 {
  color: #333;
  margin-bottom: 10px;
}
p {
  color: #555;
}
</style>
