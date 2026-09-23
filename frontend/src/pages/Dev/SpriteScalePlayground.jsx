import React, { useState } from "react";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
import { spriteSizeForHeight, MIN_SPRITE_PX, MAX_SPRITE_PX } from "../../utils/spriteScale";

// Dev-only scratch page for the height -> sprite-px formula.
// Heights (meters) here are hardcoded Pokédex reference values, standing in
// for the DB `height` column until it's threaded through the battle payload
// (see /agent-skills:plan for that follow-up).
const SAMPLE_POKEMON = [
  { pokemonId: 16, name: "Pidgey", heightM: 0.3 },
  { pokemonId: 25, name: "Pikachu", heightM: 0.4 },
  { pokemonId: 1, name: "Bulbasaur", heightM: 0.7 },
  { pokemonId: 130, name: "Gyarados", heightM: 6.5 },
  { pokemonId: 143, name: "Snorlax", heightM: 2.1 },
  { pokemonId: 95, name: "Onix", heightM: 8.8 },
];

export default function SpriteScalePlayground() {
  const [customHeight, setCustomHeight] = useState(1.0);

  return (
    <div style={{ padding: 24, color: "#eee", background: "#222", minHeight: "100vh" }}>
      <h1>Sprite scale playground</h1>
      <p>height (m) → px, base 0.5m = 180px, clamped [{MIN_SPRITE_PX}, {MAX_SPRITE_PX}]</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 24 }}>
        {SAMPLE_POKEMON.map((mon) => {
          const px = spriteSizeForHeight(mon.heightM);
          return (
            <div key={mon.pokemonId} style={{ textAlign: "center" }}>
              <PokemonSprite pokemonId={mon.pokemonId} variant="front" alt={mon.name} style={{ width: px }} />
              <div>{mon.name} — {mon.heightM}m → {px}px</div>
            </div>
          );
        })}
      </div>

      <hr style={{ margin: "32px 0" }} />

      <div>
        <label>
          Custom height (m): {customHeight.toFixed(1)}
          <input
            type="range"
            min="0.1"
            max="15"
            step="0.1"
            value={customHeight}
            onChange={(e) => setCustomHeight(Number(e.target.value))}
            style={{ display: "block", width: 300 }}
          />
        </label>
        <div style={{ marginTop: 16 }}>
          <PokemonSprite pokemonId={143} variant="front" alt="custom" style={{ width: spriteSizeForHeight(customHeight) }} />
          <div>{customHeight.toFixed(1)}m → {spriteSizeForHeight(customHeight)}px</div>
        </div>
      </div>
    </div>
  );
}
