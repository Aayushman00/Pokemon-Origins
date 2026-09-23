/**
 * Assigns a gender to a newly created trainer_pokemon row.
 *
 * Gameplay creation paths (starter pick, boss/legendary reward) must stay
 * fast and offline-safe, so this never calls the live PokeAPI (unlike
 * pokemonDetailService's Pokédex-only gendersFromRate/getSpecies, which
 * does). Instead it uses a small local override table for Gen 1's
 * genderless and single-gender species, and a 50/50 weighted random roll
 * for everything else.
 *
 * ponytail: a flat 50/50 default doesn't match every species' real
 * PokeAPI gender_rate (e.g. Gyarados is ~87.5% male) -- upgrade to a full
 * local gender_rate-per-species table if per-species accuracy ever matters.
 */

// Gen 1 Pokédex ids with no gender (Magnemite/Magneton, Voltorb/Electrode,
// Staryu/Starmie, Ditto, the three legendary birds, Mewtwo, Mew).
const GENDERLESS_IDS = new Set([81, 82, 100, 101, 120, 121, 132, 144, 145, 146, 150, 151]);
// Gen 1 Pokédex ids that are always male (Hitmonlee, Hitmonchan).
const MALE_ONLY_IDS = new Set([106, 107]);
// Gen 1 Pokédex ids that are always female (Kangaskhan).
const FEMALE_ONLY_IDS = new Set([115]);

function rollGenderForSpecies(pokemonId, random = Math.random) {
  const id = Number(pokemonId);
  if (GENDERLESS_IDS.has(id)) return "genderless";
  if (MALE_ONLY_IDS.has(id)) return "male";
  if (FEMALE_ONLY_IDS.has(id)) return "female";
  return random() < 0.5 ? "male" : "female";
}

module.exports = {
  rollGenderForSpecies,
  GENDERLESS_IDS,
  MALE_ONLY_IDS,
  FEMALE_ONLY_IDS,
};
