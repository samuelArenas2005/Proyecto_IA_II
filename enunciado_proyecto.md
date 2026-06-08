# Información del Proyecto

Universidad del Valle
Facultad de Ingeniería
Escuela de Ingeniería de Sistemas y Computación
Inteligencia Artificial

**Proyecto 2**

***

# Knight energy

Knight energy es un juego entre dos adversarios en el que cada uno controla un caballo sobre un tablero de ajedrez.

## Reglas del Juego

1.  En el tablero hay siete casillas con puntos, representadas por el símbolo ⭐ (estrella), y cuatro casillas especiales que permiten recuperar energía, representadas por el símbolo ⚡ (rayo).
2.  Cada jugador inicia con una cantidad limitada de energía que se consume a medida que realiza movimientos.
3.  Las casillas con puntos tienen los siguientes valores: 2, 3, 4, 5, 6, 8, y 9. Cada valor aparece exactamente una vez en el tablero.
4.  Las casillas de energía tienen los siguientes valores: 2, 3, 4, y 5.
5.  Cada jugador inicia el juego con 7 unidades de energía.
6.  En cada turno, un jugador debe mover su caballo a una nueva posición siguiendo las reglas del ajedrez. Cada movimiento tiene un costo de 1 unidad de energía.
7.  Si el caballo llega a una casilla con puntos, el jugador obtiene la cantidad indicada en ella. Si el caballo llega a una casilla de energía, aumenta su energía en esa cantidad.
8.  Las casillas con puntos y las casillas de energía se consumen al ser utilizadas y no pueden volver a ser usadas por ningún jugador.
9.  Si durante su turno un jugador no tiene energía suficiente para realizar un movimiento, pierde el turno y se le descuentan 3 puntos.
10. El juego continúa mientras el otro jugador tenga movimientos disponibles. El juego termina cuando no queden casillas con puntos o cuando ninguno de los jugadores pueda realizar movimientos. Gana el jugador que acumule la mayor cantidad de puntos al finalizar la partida.

A continuación, se muestra un posible estado inicial del juego.

*(Nota: En la imagen original, esta sección es seguida por el gráfico del tablero de ajedrez con la ubicación de las piezas y casillas especiales).*

## Implementación de la Inteligencia Artificial

Knight energy presenta tres niveles de dificultad (principiante, amateur, y experto) que el usuario puede seleccionar al iniciar el juego.

Se debe construir un árbol minimax con decisiones imperfectas. La profundidad límite del árbol depende del nivel seleccionado por el usuario.

Para el nivel principiante se utiliza un árbol de profundidad 2, para amateur de profundidad 4, y para experto de profundidad 6.

## Aclaraciones generales

* El juego siempre lo inicia la máquina quien jugará con el caballo blanco.
* Las posiciones iniciales de los caballos, de las casillas con puntos, y de las casillas de energía, son aleatorias y no pueden coincidir.
* Se debe mostrar en cada momento la cantidad de puntos y la energía disponible de cada jugador.
* Al finalizar el juego se debe indicar quién es el ganador o si hubo empate.
* Los caballos se mueven en L siguiendo las reglas del ajedrez.
* Además de desarrollar el juego, debe presentar un informe donde se defina y explique la función de utilidad heurística que se utiliza en el algoritmo minimax.