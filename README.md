<h1 align="center">IA Challenge Game 🎮</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vue.js" alt="Vue.js 3">
  <img src="https://img.shields.io/badge/Electron-13-47848F?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript" alt="JavaScript">
</p>

> Aplicación de escritorio donde el jugador se enfrenta a una IA con personalidad en una serie de 3 minijuegos aleatorios. El objetivo es ganar más rondas que la IA para superar el desafío.

---

## 📜 Objetivo del Juego

**IA Challenge Game** es una experiencia de un solo jugador donde el usuario pone a prueba su ingenio, memoria y estrategia contra una astuta Inteligencia Artificial en una serie de 3 minijuegos seleccionados al azar. El objetivo principal es ganar más rondas que la IA para superar el desafío en las distintas dificultades disponibles.

La aplicación busca crear una experiencia rejugable y atractiva a través de una IA que no solo compite, sino que también reacciona al desempeño del jugador, ajustando su comportamiento y aplicando "modificadores" que alteran las reglas del juego en tiempo real.

---

## 🛠️ Tecnologías Utilizadas
* **Framework Principal:** Vue.js 3 (Composition API)
* **Entorno de Escritorio:** Electron.js
* **Lenguaje:** JavaScript (ES6+)
* **Sonido:** Howler.js

---

## 🚀 Instalación y Ejecución

Para ejecutar este proyecto en un entorno de desarrollo local, sigue estos pasos:

**1. Prerrequisitos:**
Asegúrate de tener [Node.js](https://nodejs.org/) (versión 16 o superior) y NPM instalados en tu sistema.

**2. Clonar el Repositorio:**
Abre una terminal y clona el proyecto desde GitHub:
```bash
git clone [https://github.com/Wolfbiert/my-ia-challenge-game.git](https://github.com/Wolfbiert/my-ia-challenge-game.git)
````

**3. Instalar Dependencias:**
Navega a la carpeta raíz del proyecto y ejecuta el siguiente comando para instalar todas las librerías necesarias:

```bash
npm install
```

**4. Ejecutar en Modo Desarrollo:**
Una vez finalizada la instalación, utiliza el siguiente comando para iniciar la aplicación. Esto abrirá una ventana de Electron con el juego y habilitará el "hot-reloading" para reflejar cambios en el código al instante.

```bash
npm run electron:serve
```

-----

## 🤖 Implementación de la Inteligencia Artificial

La IA de este proyecto no utiliza machine learning, sino que se basa en un **sistema de lógica y reglas orquestado de forma centralizada**, lo que le permite tener un comportamiento dinámico y una personalidad consistente.

El cerebro de la IA reside en el composable `src/composables/useGameOrchestrator.js`. Su comportamiento se rige por los siguientes principios:

**1. Sistema de Dificultad:**
La dificultad seleccionada (`Fácil`, `Normal`, `Difícil`) ajusta un conjunto de parámetros base dentro de cada minijuego. Por ejemplo:

  * En **Piedra, Papel o Tijera**, aumenta la probabilidad de que la IA prediga y contrarreste la jugada del usuario.
  * En **Simón Dice**, la secuencia inicial es más larga y la velocidad entre colores es mayor.
  * En **Adivina el Número**, el rango de números es más amplio y el jugador tiene menos intentos.

**2. Modificadores Dinámicos:**
Para evitar que sea predecible, al inicio de cada ronda, el orquestador tiene una probabilidad de activar un "modificador" que altera las reglas del juego. Estos se definen en el objeto `modifierProbabilities` y pueden ser ventajas para la IA o desventajas para el jugador. Ejemplos incluyen:

  * `blockPlayerAbility`: Bloquea una habilidad del jugador en *Piedra, Papel o Tijera*.
  * `invertHints`: Invierte las pistas (cuando dice "mayor", es "menor") en *Adivina el Número*.
  * `extremeSequence`: Aumenta drásticamente la dificultad en *Simón Dice*.

**3. Comportamiento Adaptativo (Simple):**
La probabilidad de que la IA active un modificador no es fija. Se ajusta dinámicamente según el marcador global del desafío:

  * **Si el jugador va ganando**, la IA "se frustra" y la probabilidad de que use un modificador a su favor aumenta.
  * **Si la IA va ganando**, "se confía" y es menos probable que use una ventaja, dándole una oportunidad al jugador.

Este mecanismo, aunque sencillo, crea la ilusión de un oponente que reacciona emocionalmente al estado de la partida.

**4. Personalidad y Diálogo:**
Toda la comunicación de la IA (mensajes, expresiones faciales, intervenciones) es gestionada por el orquestador. Esto asegura que la IA mantenga una personalidad consistente a lo largo de todos los minijuegos.
