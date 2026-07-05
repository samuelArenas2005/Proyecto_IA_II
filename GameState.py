from GameKnightEnergy import verify_state_values
from GameKnightEnergy import is_end_game as _is_end_game

def _get_state_field(state, name):
    """ Función auxiliar para obtener un campo del estado del juego, 
    ya sea desde un diccionario o desde un objeto. """
    
    if isinstance(state, dict):
        return state.get(name)
    return getattr(state, name, None)

class GameState():
    def __init__(self, state):
        if not verify_state_values(state):
            raise ValueError("Invalid game state values")

        self.white_pos = _get_state_field(state, "white_pos") # IA (maquina)
        self.black_pos = _get_state_field(state, "black_pos") # Jugador 
        self.stars = _get_state_field(state, "stars")
        self.energy_tiles = _get_state_field(state, "energy_tiles")
        self.white_energy = _get_state_field(state, "white_energy")   # IA (maquina)
        self.black_energy = _get_state_field(state, "black_energy")   # Jugador 
        self.white_points = _get_state_field(state, "white_points")   # IA (maquina)
        self.black_points = _get_state_field(state, "black_points")   # Jugador
        self.current_turn = _get_state_field(state, "current_turn")   # La IA es el turno white y la del jugador es black (opcional)
        
    def show_state(self):
        print("White Position:", self.white_pos)
        print("Black Position:", self.black_pos)
        print("Stars:", self.stars)
        print("Energy Tiles:", self.energy_tiles)
        print("White Energy:", self.white_energy)
        print("Black Energy:", self.black_energy)
        print("White Points:", self.white_points)
        print("Black Points:", self.black_points)
        print("Current Turn:", self.current_turn)
    
    def get_valid_moves(self):
        """
        Función que retorna un arreglo de movimientos válidos para un caballo en una posición dada.
        """
        row, col = self.white_pos if self.current_turn == "white" else self.black_pos
        knight_moves = [
            (row + 2, col + 1), (row + 2, col - 1),
            (row - 2, col + 1), (row - 2, col - 1),
            (row + 1, col + 2), (row + 1, col - 2),
            (row - 1, col + 2), (row - 1, col - 2)
        ]
        
        # Filtrar movimientos válidos dentro del tablero y que no ocupen la posición del otro jugador
        valid_moves = [
            (r, c) for r, c in knight_moves
            if 0 <= r < 8 and 0 <= c < 8 and (r, c) != tuple(self.white_pos) and (r, c) != tuple(self.black_pos)
        ]
        
        return valid_moves
    

    def utility_function(self):
        """
        Función de utilidad para determinar el valor del ultimo nodo de profundidad
        """
        pass

    def heuristica_utility_function(self):
        """
        Heurística para evaluar el estado del juego.
        """
        pass

    def is_end_game(self):
        """
        Returns True if the game is over:
        - No star tiles remain, OR
        - Neither player can make a move (no energy or no legal squares)
        """
        
        return _is_end_game(self)
    
    def get_gamestate_possible(self):
        """
        Función que genera un arreglo de instancia de GameState para los nodos expandidos posibles de un estado de juego
        """
        pass

        
    