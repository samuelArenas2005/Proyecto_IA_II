"""
Heuristicas alternativas para modos IA vs IA y torneos.

Todas devuelven una evaluacion desde la perspectiva de white:
valores positivos favorecen a la IA/caballo white y valores negativos a black.
"""

HEURISTIC_WEIGHTS = {
    "balanced": {
        "label": "Balanceada",
        "description": "Equilibra puntos, energia, movilidad y opciones inmediatas.",
        "weights": (100, 10, 5, 20, 8, 50, 2),
    },
    "collector": {
        "label": "Recolectora",
        "description": "Prioriza capturar estrellas y ventaja de puntos.",
        "weights": (140, 6, 3, 34, 4, 35, 1),
    },
    "energizer": {
        "label": "Energizante",
        "description": "Valora conservar y recuperar energia.",
        "weights": (80, 28, 4, 12, 24, 45, 1),
    },
    "mobile": {
        "label": "Movil",
        "description": "Busca mantener muchas opciones de movimiento.",
        "weights": (85, 8, 18, 12, 6, 75, 3),
    },
    "aggressive": {
        "label": "Agresiva",
        "description": "Persigue ventaja rapida de puntos aunque arriesgue energia.",
        "weights": (170, 2, 2, 28, 2, 20, 0),
    },
    "defensive": {
        "label": "Defensiva",
        "description": "Evita bloqueos y protege recursos antes de atacar.",
        "weights": (75, 18, 14, 8, 14, 120, 2),
    },
    "opportunist": {
        "label": "Oportunista",
        "description": "Se enfoca en recompensas alcanzables en el siguiente turno.",
        "weights": (95, 8, 6, 42, 18, 45, 1),
    },
    "star_hunter": {
        "label": "Cazadora de estrellas",
        "description": "Maximiza el valor de las estrellas disponibles.",
        "weights": (110, 5, 4, 55, 3, 35, 1),
    },
    "battery_saver": {
        "label": "Ahorradora",
        "description": "Evita gastar energia sin una recompensa clara.",
        "weights": (90, 35, 5, 8, 20, 70, 2),
    },
    "center_control": {
        "label": "Control central",
        "description": "Premia posiciones cercanas al centro del tablero.",
        "weights": (95, 10, 8, 16, 8, 50, 18),
    },
    "blocker": {
        "label": "Bloqueadora",
        "description": "Castiga con fuerza quedar sin movimientos.",
        "weights": (90, 12, 10, 14, 10, 170, 2),
    },
    "sprinter": {
        "label": "Velocista",
        "description": "Prefiere puntos inmediatos y mucha movilidad.",
        "weights": (125, 4, 22, 24, 3, 35, 4),
    },
    "patient": {
        "label": "Paciente",
        "description": "Construye ventaja por energia y posicion antes de puntuar.",
        "weights": (70, 24, 12, 10, 18, 90, 6),
    },
    "greedy_energy": {
        "label": "Codiciosa de energia",
        "description": "Busca pociones cercanas para prolongar la partida.",
        "weights": (75, 30, 6, 8, 42, 55, 1),
    },
    "endgame": {
        "label": "Finalizadora",
        "description": "Da mucho peso a puntos y bloqueos cuando quedan pocos items.",
        "weights": (155, 12, 7, 18, 8, 135, 2),
    },
    "chaos": {
        "label": "Caotica",
        "description": "Mezcla prioridades de forma irregular para partidas variadas.",
        "weights": (105, 17, 3, 31, 27, 65, 11),
    },
}


WEIGHT_FIELDS = (
    ("points", "Diferencia de puntos", "Pdiff"),
    ("energy", "Diferencia de energia", "Ediff"),
    ("mobility", "Diferencia de movilidad", "Mdiff"),
    ("stars", "Estrellas alcanzables", "Sdiff"),
    ("energy_tiles", "Pociones alcanzables", "Tdiff"),
    ("blocked", "Bloqueo", "Bscore"),
    ("center", "Control central", "Cdiff"),
)


def build_formula(weights):
    parts = [
        f"{weight}*{symbol}"
        for weight, (_, _, symbol) in zip(weights, WEIGHT_FIELDS)
        if weight != 0
    ]
    return "H(s) = " + " + ".join(parts)


def build_weight_detail(weights):
    return [
        {"key": key, "label": label, "symbol": symbol, "value": weight}
        for weight, (key, label, symbol) in zip(weights, WEIGHT_FIELDS)
    ]


def list_heuristics():
    heuristics = []
    for key, data in HEURISTIC_WEIGHTS.items():
        weights = data["weights"]
        heuristics.append({
            "id": key,
            "label": data["label"],
            "description": data["description"],
            "weights": build_weight_detail(weights),
            "formula": build_formula(weights),
            "variables": [
                {"symbol": symbol, "label": label}
                for _, label, symbol in WEIGHT_FIELDS
            ],
        })
    return heuristics



def normalize_heuristic_name(name):
    return name if name in HEURISTIC_WEIGHTS else "balanced"


def evaluate_state(game_state, heuristic_name="balanced"):
    if game_state.is_end_game():
        return game_state.utility_function()

    weights = HEURISTIC_WEIGHTS[normalize_heuristic_name(heuristic_name)]["weights"]
    (
        points_weight,
        energy_weight,
        mobility_weight,
        star_weight,
        energy_tile_weight,
        blocked_weight,
        center_weight,
    ) = weights

    white_moves = game_state.get_valid_moves("white") if game_state.can_player_move("white") else []
    black_moves = game_state.get_valid_moves("black") if game_state.can_player_move("black") else []

    def sum_reachable_values(moves, tiles):
        return sum(tiles.get(f"{row},{col}", 0) for row, col in moves)

    def center_score(pos):
        row, col = pos
        return 6 - (abs(row - 3.5) + abs(col - 3.5))

    points_diff = game_state.white_points - game_state.black_points
    energy_diff = game_state.white_energy - game_state.black_energy
    mobility_diff = len(white_moves) - len(black_moves)
    star_options_diff = sum_reachable_values(white_moves, game_state.stars) - sum_reachable_values(black_moves, game_state.stars)
    energy_options_diff = sum_reachable_values(white_moves, game_state.energy_tiles) - sum_reachable_values(black_moves, game_state.energy_tiles)
    center_diff = center_score(game_state.white_pos) - center_score(game_state.black_pos)

    blocked_score = 0
    if not game_state.can_player_move("white"):
        blocked_score -= blocked_weight
    if not game_state.can_player_move("black"):
        blocked_score += blocked_weight

    return (
        points_weight * points_diff
        + energy_weight * energy_diff
        + mobility_weight * mobility_diff
        + star_weight * star_options_diff
        + energy_tile_weight * energy_options_diff
        + blocked_score
        + center_weight * center_diff
    )
