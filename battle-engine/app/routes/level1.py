import json
import random
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..combat import calculate_damage_result, determine_turn_order
from ..models import BattleRequest, Pokemon

router = APIRouter()

LEVEL1_DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "level1.json"


class BattleSimRequest(BaseModel):
    user_pokemon: Pokemon
    trainer_pokemon: Pokemon


class LevelBattleStartRequest(BaseModel):
    trainer_id: int


def load_level1_data():
    try:
        with open(LEVEL1_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Error reading level 1 data: " + str(e)
        ) from e


@router.get("/level/1")
def get_level1():
    return load_level1_data()


@router.post("/simulate_battle/")
def simulate_battle(battle: BattleSimRequest):
    """In-process simulation (no self-HTTP). Used for server-side battle runs."""
    battle_log = []

    turn_order_data = determine_turn_order(
        battle.user_pokemon.model_dump(),
        battle.trainer_pokemon.model_dump(),
    )

    first_pokemon = (
        battle.user_pokemon
        if turn_order_data["first"] == "pokemon1"
        else battle.trainer_pokemon
    )
    second_pokemon = (
        battle.trainer_pokemon
        if first_pokemon == battle.user_pokemon
        else battle.user_pokemon
    )

    turn_counter = 0
    while battle.user_pokemon.current_hp > 0 and battle.trainer_pokemon.current_hp > 0:
        turn_counter += 1
        if turn_counter > 100:
            return {
                "battle_log": battle_log,
                "winner": "tie",
                "reason": "Turn limit reached",
            }

        for attacker, defender in [
            (first_pokemon, second_pokemon),
            (second_pokemon, first_pokemon),
        ]:
            if attacker.current_hp <= 0:
                continue

            move = (
                attacker.moves[0]
                if attacker == battle.user_pokemon
                else random.choice(attacker.moves)
            )

            damage_data = calculate_damage_result(
                BattleRequest(attacker=attacker, defender=defender, move=move)
            )

            damage = damage_data.get("damage", 0)
            defender.current_hp -= damage
            battle_log.append(
                f"{attacker.nickname} used {move.name}, dealing {damage} damage!"
            )
            if defender.current_hp <= 0:
                battle_log.append(f"{defender.nickname} fainted!")
                return {"battle_log": battle_log, "winner": attacker.nickname}

    return {"battle_log": battle_log, "winner": "tie"}


@router.post("/level/1/battle")
def start_battle(battle: LevelBattleStartRequest):
    """Stub encounter lookup for level 1 (not a full battle simulator)."""
    data = load_level1_data()
    trainer_id = battle.trainer_id

    trainer = next(
        (t for t in data.get("trainers", []) if t["trainer_id"] == trainer_id), None
    )
    if not trainer and trainer_id == data.get("boss", {}).get("trainer_id"):
        trainer = data["boss"]

    if not trainer:
        raise HTTPException(
            status_code=404, detail="Trainer battle not found for level 1."
        )

    outcome = random.choice(["win", "lose"])
    return {
        "trainer_id": trainer_id,
        "opponent": trainer["name"],
        "outcome": outcome,
        "details": "This is a simulated battle outcome.",
    }
