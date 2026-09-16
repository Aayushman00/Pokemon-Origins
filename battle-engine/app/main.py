from fastapi import FastAPI, HTTPException
from .models import BattleRequest, XPUpdateRequest
import os
import uvicorn
from pathlib import Path
from dotenv import load_dotenv
from .routes.level1 import router as level1_router
from .utils import add_experience
from .combat import calculate_damage_result, determine_turn_order
from fastapi.middleware.cors import CORSMiddleware

# Load battle-engine/.env then optional root .env
_ENGINE_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = _ENGINE_ROOT.parent
load_dotenv(_REPO_ROOT / ".env")
load_dotenv(_ENGINE_ROOT / ".env", override=True)

app = FastAPI()

_cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(level1_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Battle Logic Service with detailed breakdown!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/calculate_damage/")
def calculate_damage(battle: BattleRequest):
    return calculate_damage_result(battle)


@app.post("/add_experience/")
def add_experience_endpoint(xp_update: XPUpdateRequest):
    stats_dict = (
        xp_update.attacker.model_dump()
        if hasattr(xp_update.attacker, "model_dump")
        else xp_update.attacker.dict()
    )
    increments = {
        "attack": 2,
        "defense": 2,
        "hp": 5,
        "speed": 1,
        "special_atk": 2,
        "special_def": 2,
    }
    updated_stats = add_experience(stats_dict, xp_update.xp_gained, increments)
    return {"updated_stats": updated_stats}


@app.post("/turn_order/")
def turn_order(data: dict):
    try:
        return determine_turn_order(
            data["pokemon1"],
            data["pokemon2"],
            priority1=int(data.get("priority1", 0) or 0),
            priority2=int(data.get("priority2", 0) or 0),
        )
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=f"Missing field: {exc}") from exc


if __name__ == "__main__":
    host = os.getenv("BATTLE_HOST", "0.0.0.0")
    port = int(os.getenv("BATTLE_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
