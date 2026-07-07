# Knight Energy - Juego con IA Minimax en tablero 8x8

Knight Energy es un juego de estrategia entre dos adversarios sobre un tablero de ajedrez 8x8. Cada jugador controla un caballo, acumula puntos, consume energía al moverse y compite contra una inteligencia artificial basada en Minimax con poda alfa-beta.

El proyecto usa Python como backend, Eel para conectar Python con la interfaz web, y HTML/CSS/JavaScript para renderizar el menú, el editor de partida y el tablero.

## Requisitos previos

- Python 3.8+ instalado.
- Paquete `eel` instalado en el entorno de Python.
- Google Chrome o Chromium instalado, porque Eel lo usa para renderizar la interfaz.
  > Nota para Linux: si no tienes Chrome/Chromium, puedes instalar Chromium con:
  > `sudo apt install chromium-browser`
- Entorno virtual recomendado para aislar dependencias.

### Instalar dependencias

1. Crear y activar un entorno virtual:

```bash
python -m venv venv
```

En Windows:

```bash
venv\Scripts\activate
```

En macOS / Linux:

```bash
source venv/bin/activate
```

2. Instalar dependencias:

```bash
pip install -r requirements.txt
```

Si prefieres instalar Eel manualmente:

```bash
pip install eel
```

## Cómo ejecutar el proyecto desde `main.py`

Desde la carpeta raíz del proyecto ejecuta:

```bash
python main.py
```

o si tu sistema usa `py`:

```bash
py main.py
```

Esto iniciará la aplicación con Eel y cargará el menú principal en una ventana de navegador.

## Reglas principales del juego

- El tablero es de `8x8`.
- Cada jugador controla un caballo que se mueve en forma de `L`, como en ajedrez.
- La IA juega con el caballo gris (`white`).
- El jugador humano juega con el caballo dorado (`black`).
- La máquina inicia siempre la partida.
- Cada jugador inicia con `7` unidades de energía.
- Cada movimiento consume `1` unidad de energía.
- Las casillas con puntos aumentan el puntaje del jugador que las recoge.
- Las casillas de energía aumentan la energía del jugador que las recoge.
- Las casillas especiales se consumen después de ser usadas.
- Si un jugador no puede moverse por falta de energía, pierde el turno y se le descuentan `3` puntos.
- El juego termina cuando no quedan casillas con puntos o cuando ningún jugador puede realizar movimientos.
- Gana quien tenga mayor cantidad de puntos al finalizar la partida.

## Dificultades de la IA

La IA usa Minimax con poda alfa-beta. La profundidad del árbol depende de la dificultad seleccionada:

| Dificultad | Profundidad |
| ---------- | ----------- |
| Principiante | 2 |
| Amateur | 4 |
| Experto | 6 |

La dificultad se selecciona desde el menú o desde el Game Editor.

## Game Editor: cómo personalizar una partida

El proyecto incluye un editor visual de partidas desde el botón **GAME EDITOR** del menú principal.

Desde el editor puedes configurar:

- dificultad de la partida;
- posición inicial del jugador;
- posición inicial del oponente / IA;
- casillas de puntos;
- valor personalizado de cada casilla de puntos;
- casillas de energía;
- valor personalizado de cada casilla de energía.

### Reglas para iniciar desde el editor

Antes de iniciar una partida personalizada debes colocar:

- exactamente un jugador;
- exactamente un oponente;
- al menos una casilla de puntos.

El editor guarda la configuración en `localStorage` usando la clave `knight_editor_config`. Al iniciar la partida desde el editor, el tablero usa esa configuración como estado inicial.

### Relación entre editor y modelo interno

En la interfaz del editor se habla de:

- `player`: jugador humano;
- `opponent`: oponente controlado por IA.

Internamente, el modelo Python usa:

- `black`: jugador humano;
- `white`: IA.

Por eso, al cargar una partida personalizada:

- `player` se convierte en `black_pos`;
- `opponent` se convierte en `white_pos`.

## Qué contiene cada archivo Python

### `main.py`

- Es el backend principal de la aplicación.
- Inicializa Eel con la carpeta `web`.
- Expone funciones para el frontend:
  - `solicitar_mapa_aleatorio()`: genera un estado inicial aleatorio.
  - `obtener_movimiento_ia(estado, profundidad)`: calcula el movimiento de la IA.
  - `aplicar_movimiento(estado, movimiento)`: aplica un movimiento y devuelve el nuevo estado.
  - `set_debug_mode(enabled)`: activa o desactiva salida de depuración.
  - `dev_show_state(estado)`: imprime el estado actual para depuración.
  - `close_window()`: cierra la aplicación desde el botón de salida.
- Configura `machine_move_mode = "minmax"` para usar Minimax.
- Inicia la interfaz en `menu.html`.

### `GameState.py`

- Define la clase `GameState`, que representa el estado completo de la partida.
- Valida que el estado tenga posiciones, energía, puntos, turno y casillas especiales correctas.
- Calcula movimientos válidos de caballo.
- Determina si un jugador puede moverse.
- Aplica movimientos y actualiza:
  - posición del caballo;
  - energía;
  - puntos;
  - consumo de casillas especiales;
  - cambio de turno;
  - finalización de la partida;
  - ganador.
- Implementa la función de utilidad terminal.
- Implementa la función heurística usada por Minimax.

### `GameKnightEnergy.py`

- Contiene la lógica de inteligencia artificial.
- Implementa `minimax_alpha_beta()` con poda alfa-beta.
- Implementa `get_best_movement()` para seleccionar el mejor movimiento disponible.
- Genera mapas iniciales aleatorios con:
  - posiciones de jugadores;
  - casillas de puntos;
  - casillas de energía.
- Asigna valores de puntos y energía a coordenadas del tablero.

### `TournamentLogic/` (Directorio)

- Contiene la lógica, heurísticas y algoritmos específicos para ejecutar torneos automáticos entre múltiples configuraciones de la inteligencia artificial.
  - `GameKnightTournament.py`: Orquesta rondas y torneos completos entre IAs, gestiona posiciones iniciales (seeds) para competencia justa, simula partidas y extrae ganadores por puntos y victorias.
  - `GameKnightHeuristicAI.py`: Versión de la IA (Minimax alfa-beta) parametrizada para utilizar diferentes esquemas de evaluación en lugar de uno fijo.
  - `HeuristicStrategies.py`: Define un diccionario con distintas "personalidades" heurísticas (ej. *Cazadora de estrellas*, *Defensiva*, *Agresiva*), asignando pesos matemáticos específicos a diferentes factores del estado del juego (energía, control central, opciones futuras).

### `requirements.txt`

- Lista las dependencias Python del proyecto.
- Actualmente incluye `eel>=0.16.0`.

## Qué contiene la carpeta `web`

La carpeta `web` contiene toda la interfaz gráfica del juego.

### `web/api.js`

- Archivo auxiliar para comunicación entre JavaScript y Python mediante Eel.
- Expone funciones frontend para solicitar movimientos de IA al backend.

### `web/menu.html`

- Página principal del juego.
- Contiene:
  - menú principal con acceso directo a Jugar, Torneo y Game Editor;
  - panel o submenú de "Jugar" (Humano vs IA, IA vs IA, Jugador vs Jugador);
  - panel de selección de dificultad;
  - botón de salida;
  - estructura visual del editor.

### `web/menu.js`

- Controla la lógica del menú principal.
- Maneja animaciones y transiciones fluidas entre los distintos paneles (Main Menu, Play Panel, Dificultad, Editor).
- Guarda dificultad seleccionada.
- Controla el Game Editor:
  - selección de elementos;
  - colocación de jugador, oponente, puntos y energía;
  - valores personalizados;
  - borrado de casillas;
  - generación aleatoria desde el editor;
  - validaciones antes de iniciar una partida personalizada.
- Guarda la configuración personalizada en `localStorage`.

### `web/Tournament/`, `web/HumanVsHuman/`, `web/AIVsAI/`

- Almacenan las configuraciones de la interfaz y la lógica específica de cada modalidad:
  - **Tournament**: Menú interactivo para iniciar un torneo de heurísticas eligiendo número de participantes y evaluando automáticamente cada enfrentamiento en el backend, mostrando el progreso de las rondas en pantalla. Sus estilos (`tournament.css`) están ajustados para evitar desbordes visuales del título de la interfaz.
  - **HumanVsHuman**: Vista de tablero adaptada para una pugna en dispositivo local de dos jugadores interactuando en turnos.
  - **AIVsAI**: Espectador de una partida generada enteramente por simulaciones heurísticas enviadas desde el backend.

### `web/RenderMap/index.html`

- Página del tablero principal de juego.
- Contiene:
  - marcadores de jugador e IA;
  - tablero central;
  - barra inferior de turno;
  - botones de menú y reinicio;
  - modal de fin de juego.

### `web/RenderMap/app.js`

- Controla la lógica del tablero en el frontend.
- Renderiza el tablero y las piezas.
- Carga partidas aleatorias o personalizadas desde el editor.
- Calcula movimientos legales visuales para el jugador.
- Envía estados al backend para que la IA calcule con Minimax.
- Aplica movimientos mediante el backend Python.
- Actualiza HUD, puntos, energía, turnos y final de partida.
- Controla reinicio y navegación al menú.

### `web/assets/NewSprints/`

- Contiene imágenes usadas por la interfaz:
  - fondo;
  - tablero;
  - botones;
  - jugador;
  - enemigo / IA;
  - iconos de energía;
  - pociones;
  - snitch / puntos;
  - marcadores.

### `web/assets/Sounds/`

- Contiene efectos de sonido y música:
  - música de fondo;
  - sonidos de selección;
  - sonidos de entrada;
  - sonidos de puntos y energía.

## Nota importante

- La IA solo usa Minimax cuando la aplicación se ejecuta mediante `main.py` con Eel.
- Si se abre el HTML directamente desde el navegador sin backend Python, las funciones de IA no estarán disponibles.
- `white` representa la IA y `black` representa al jugador humano.
- El Game Editor personaliza el estado inicial; la lógica de turnos, movimientos y Minimax sigue siendo gestionada por el backend.

## Recomendaciones

- Ejecuta siempre el proyecto desde la raíz con `python main.py`.
- No abras `menu.html` o `RenderMap/index.html` directamente si necesitas IA funcional.
- Mantén activado el entorno virtual antes de instalar dependencias o ejecutar el proyecto.
- Si modificas la lógica del editor, verifica que `knight_editor_config` siga generando un estado compatible con `GameState`.
- Si cambias las reglas del juego, actualiza también `GameState.py`, `GameKnightEnergy.py` y este README.

---
