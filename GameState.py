import copy

def _get_state_field(state, name):
    """ Función auxiliar para obtener un campo del estado del juego, 
    ya sea desde un diccionario o desde un objeto. """
    if isinstance(state, dict):
        return state.get(name)
    return getattr(state, name, None)

class GameState():
    def __init__(self, state):
        if not self._verify_state_values(state):
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

    @staticmethod
    def _verify_state_values(state):
        """ Verifica que los valores del estado del juego sean válidos. """
        white_pos = _get_state_field(state, "white_pos")
        black_pos = _get_state_field(state, "black_pos")
        stars = _get_state_field(state, "stars")
        energy_tiles = _get_state_field(state, "energy_tiles")
        white_energy = _get_state_field(state, "white_energy")
        black_energy = _get_state_field(state, "black_energy")
        white_points = _get_state_field(state, "white_points")
        black_points = _get_state_field(state, "black_points")
        current_turn = _get_state_field(state, "current_turn")

        if not isinstance(white_pos, list) or len(white_pos) != 2: return False
        if not isinstance(black_pos, list) or len(black_pos) != 2: return False
        if not isinstance(stars, dict): return False
        if not isinstance(energy_tiles, dict): return False
        if not isinstance(white_energy, int) or white_energy < 0: return False
        if not isinstance(black_energy, int) or black_energy < 0: return False
        if not isinstance(white_points, int) or white_points < 0: return False
        if not isinstance(black_points, int) or black_points < 0: return False
        if current_turn is not None and current_turn not in ["white", "black"]: return False
        return True

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

    def to_dict(self):
        """Devuelve una representación en diccionario del estado actual."""
        return {
            "white_pos": self.white_pos,
            "black_pos": self.black_pos,
            "stars": self.stars,
            "energy_tiles": self.energy_tiles,
            "white_energy": self.white_energy,
            "black_energy": self.black_energy,
            "white_points": self.white_points,
            "black_points": self.black_points,
            "current_turn": self.current_turn,
            "game_over": getattr(self, "game_over", False),
            "winner": getattr(self, "winner", None)
        }
    
    def get_valid_moves(self, turn=None):
        """
        Retorna un arreglo de movimientos válidos para el jugador indicado.
        Si no se pasa, asume el current_turn. (Evalúa las físicas del tablero).
        """
        turn_to_check = turn or self.current_turn
        row, col = self.white_pos if turn_to_check == "white" else self.black_pos
        other_pos = self.black_pos if turn_to_check == "white" else self.white_pos

        knight_moves = [
            (row + 2, col + 1), (row + 2, col - 1),
            (row - 2, col + 1), (row - 2, col - 1),
            (row + 1, col + 2), (row + 1, col - 2),
            (row - 1, col + 2), (row - 1, col - 2)
        ]
        
        valid_moves = [
            [r, c] for r, c in knight_moves
            if 0 <= r < 8 and 0 <= c < 8 and [r, c] != other_pos
        ]
        
        return valid_moves
    
    def can_player_move(self, turn):
        """
        Verifica si un jugador específico tiene energía y movimientos disponibles.
        """
        energy = self.white_energy if turn == "white" else self.black_energy
        if energy < 1:
            return False
        return len(self.get_valid_moves(turn)) > 0

    def get_gamestate_possible(self):
        """
        Genera un arreglo de instancias de GameState para los nodos expandidos posibles
        a partir de este estado de juego.
        """
        possible_states = []
        valid_moves = self.get_valid_moves()
        
        for move in valid_moves:
            new_state = self.apply_move(move)
            possible_states.append(new_state)
            
        return possible_states

    def utility_function(self):
        """
        Función de utilidad para determinar el valor del ultimo nodo de profundidad
        (Nodos terminales).
        """
        winner = self._determine_winner()
        
        if winner == "white":
            return 10000 + (self.white_points - self.black_points)
        elif winner == "black":
            return -10000 + (self.white_points - self.black_points)
        else:
            return 0 # Empate

    def heuristica_utility_function(self):
        """
        Heurística para evaluar el estado del juego.
        """
        pass

    def is_end_game(self):
        """
        Returns True if the game is over:
        - No star tiles remain, OR
        - Neither player can make a move
        """
        no_stars_left = len(self.stars) == 0
        if no_stars_left:
            return True

        white_stuck = not self.can_player_move("white")
        black_stuck = not self.can_player_move("black")
        
        return white_stuck and black_stuck
    
    def _determine_winner(self):
        """Returns 'white', 'black', or 'draw' based on current points."""
        if self.white_points > self.black_points:
            return "white"
        if self.black_points > self.white_points:
            return "black"
        return "draw"

    def apply_move(self, move):
        """
        Aplica un movimiento a este estado y devuelve una NUEVA instancia de GameState.
        """
        
        next_state = copy.deepcopy(self)

        turn = next_state.current_turn
        other_turn = "black" if turn == "white" else "white"

        # Aplicar el movimiento
        if turn == "white":
            next_state.white_pos = list(move)
            next_state.white_energy = max(0, next_state.white_energy - 1)
        else:
            next_state.black_pos = list(move)
            next_state.black_energy = max(0, next_state.black_energy - 1)

        # Recolectar estrellas o energía
        dest_key = f"{move[0]},{move[1]}"
        if dest_key in next_state.stars:
            points = next_state.stars.pop(dest_key)
            if turn == "white": next_state.white_points += points
            else: next_state.black_points += points
        elif dest_key in next_state.energy_tiles:
            energy = next_state.energy_tiles.pop(dest_key)
            if turn == "white": next_state.white_energy += energy
            else: next_state.black_energy += energy

        # Decidir de quién es el siguiente turno
        other_can_move = next_state.can_player_move(other_turn)

        if other_can_move:
            next_state.current_turn = other_turn
        else:
            # Si el otro jugador no puede moverse, pierde turno y 3 puntos
            if other_turn == "white": next_state.white_points -= 3
            else: next_state.black_points -= 3
            next_state.current_turn = turn

        # Evaluar si el juego terminó
        game_is_over = next_state.is_end_game()
        next_state.game_over = game_is_over
        next_state.winner = next_state._determine_winner() if game_is_over else None

        return next_state

    


        
    