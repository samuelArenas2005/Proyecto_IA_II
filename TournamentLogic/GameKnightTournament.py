"""
Torneo de heuristicas para enfrentar estrategias externas sin tocar el modo base.
"""

import random
from types import SimpleNamespace

from GameState import GameState
from .GameKnightHeuristicAI import get_best_movement_with_heuristic
from .HeuristicStrategies import list_heuristics, normalize_heuristic_name


def build_seeded_map_state(seed):
    rng = random.Random(seed)
    all_cells = [(r, c) for r in range(8) for c in range(8)]

    star_values = [2, 3, 4, 5, 6, 8, 9]
    energy_values = [2, 3, 4, 5]
    total_needed = 2 + len(star_values) + len(energy_values)
    chosen_positions = rng.sample(all_cells, total_needed)

    white_pos = list(chosen_positions[0])
    black_pos = list(chosen_positions[1])
    index = 2

    stars = {}
    for value in star_values:
        row, col = chosen_positions[index]
        stars[f"{row},{col}"] = value
        index += 1

    energy_tiles = {}
    for value in energy_values:
        row, col = chosen_positions[index]
        energy_tiles[f"{row},{col}"] = value
        index += 1

    return {
        "white_pos": white_pos,
        "black_pos": black_pos,
        "stars": stars,
        "energy_tiles": energy_tiles,
        "white_energy": 7,
        "black_energy": 7,
        "white_points": 0,
        "black_points": 0,
        "current_turn": "white",
        "nivel": "torneo",
        "game_over": False,
        "winner": None,
    }


def _state_from_dict(state):
    return GameState(SimpleNamespace(**state))


def _simulate_game(white_heuristic, black_heuristic, depth, seed):
    state = _state_from_dict(build_seeded_map_state(seed))
    moves = 0

    while not state.is_end_game() and moves < 160:
        heuristic = white_heuristic if state.current_turn == "white" else black_heuristic
        move = get_best_movement_with_heuristic(state, depth, heuristic)
        state = state.apply_move(move)
        moves += 1

    winner = state._determine_winner()
    return {
        "white_heuristic": white_heuristic,
        "black_heuristic": black_heuristic,
        "winner": winner,
        "white_points": state.white_points,
        "black_points": state.black_points,
        "moves": moves,
    }


def play_match(heuristic_a, heuristic_b, depth=2, seed=2026):
    heuristic_a = normalize_heuristic_name(heuristic_a)
    heuristic_b = normalize_heuristic_name(heuristic_b)

    first_game = _simulate_game(heuristic_a, heuristic_b, depth, seed)
    second_game = _simulate_game(heuristic_b, heuristic_a, depth, seed)

    score_a = 0
    score_b = 0
    points_a = first_game["white_points"] + second_game["black_points"]
    points_b = first_game["black_points"] + second_game["white_points"]

    if first_game["winner"] == "white":
        score_a += 1
    elif first_game["winner"] == "black":
        score_b += 1

    if second_game["winner"] == "black":
        score_a += 1
    elif second_game["winner"] == "white":
        score_b += 1

    tiebreaker_game = None

    if score_a > score_b:
        winner = heuristic_a
    elif score_b > score_a:
        winner = heuristic_b
    elif points_a > points_b:
        winner = heuristic_a
    elif points_b > points_a:
        winner = heuristic_b
    else:
        rng = random.Random(seed + 9999)
        a_plays_white = rng.choice([True, False])
        if a_plays_white:
            tiebreaker_game = _simulate_game(heuristic_a, heuristic_b, depth, seed + 10000)
            if tiebreaker_game["winner"] == "white":
                winner = heuristic_a
            elif tiebreaker_game["winner"] == "black":
                winner = heuristic_b
            else:
                winner = heuristic_a if tiebreaker_game["white_points"] >= tiebreaker_game["black_points"] else heuristic_b
        else:
            tiebreaker_game = _simulate_game(heuristic_b, heuristic_a, depth, seed + 10000)
            if tiebreaker_game["winner"] == "black":
                winner = heuristic_a
            elif tiebreaker_game["winner"] == "white":
                winner = heuristic_b
            else:
                winner = heuristic_a if tiebreaker_game["black_points"] >= tiebreaker_game["white_points"] else heuristic_b

    return {
        "a": heuristic_a,
        "b": heuristic_b,
        "winner": winner,
        "score_a": score_a,
        "score_b": score_b,
        "points_a": points_a,
        "points_b": points_b,
        "games": [first_game, second_game],
        "tiebreaker_game": tiebreaker_game,
    }


def get_round_label(players_remaining):
    labels = {
        16: "Octavos de final (Ronda de 16)",
        8: "Cuartos de final",
        4: "Semifinales",
        2: "Final",
    }
    return labels.get(players_remaining, f"Ronda de {players_remaining}")


def play_tournament_round(heuristic_names, depth=2, total_participants=None, round_index=1):
    available_ids = [item["id"] for item in list_heuristics()]
    selected = [normalize_heuristic_name(name) for name in heuristic_names]
    selected = [name for index, name in enumerate(selected) if name in available_ids and name not in selected[:index]]

    if len(selected) < 2 or len(selected) % 2 != 0:
        raise ValueError("La ronda debe tener un numero par de heuristicas.")

    try:
        depth = int(depth)
    except (TypeError, ValueError):
        depth = 2

    try:
        total_participants = int(total_participants or len(selected))
        round_index = int(round_index)
    except (TypeError, ValueError):
        total_participants = len(selected)
        round_index = 1

    matches = []
    winners = []
    for index in range(0, len(selected), 2):
        match = play_match(
            selected[index],
            selected[index + 1],
            depth=depth,
            seed=random.randint(1, 2_000_000_000),
        )
        matches.append(match)
        winners.append(match["winner"])

    return {
        "round": round_index,
        "label": get_round_label(len(selected)),
        "matches": matches,
        "winners": winners,
        "remaining": len(winners),
        "is_final": len(winners) == 1,
    }


def run_tournament(heuristic_names, depth=2):
    available_ids = [item["id"] for item in list_heuristics()]
    selected = [normalize_heuristic_name(name) for name in heuristic_names]
    selected = [name for index, name in enumerate(selected) if name in available_ids and name not in selected[:index]]

    if len(selected) not in (2, 4, 8, 16):
        raise ValueError("El torneo debe tener 2, 4, 8 o 16 heuristicas.")

    try:
        depth = int(depth)
    except (TypeError, ValueError):
        depth = 2

    current_round = selected
    rounds = []
    round_index = 1

    while len(current_round) > 1:
        round_result = play_tournament_round(
            current_round,
            depth=depth,
            total_participants=len(selected),
            round_index=round_index,
        )
        rounds.append({
            "round": round_result["round"],
            "label": round_result["label"],
            "matches": round_result["matches"],
        })
        current_round = round_result["winners"]
        round_index += 1

    return {
        "participants": selected,
        "depth": depth,
        "rounds": rounds,
        "champion": current_round[0],
    }
