/**
 * Player trainer battle-intro sprite, from the account's registered gender.
 * Only two assets exist (Phase 3 crop) -- "Other"/missing defaults to the
 * male sprite, there is no canonical third FRLG player sprite. See plan
 * Ruling 1.
 */
export function playerTrainerSprite(gender) {
  return gender === "Female"
    ? "/sprites/trainers/player/leaf.png"
    : "/sprites/trainers/player/red.png";
}
