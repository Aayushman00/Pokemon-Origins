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

/**
 * 5-frame back-view Poké Ball throw strip for the encounter beat (cropped by
 * scripts/crop_trainer_sprites.py). Same Female/other rule as above.
 */
export function playerTrainerThrowSprite(gender) {
  return gender === "Female"
    ? "/sprites/trainers/player/leaf-throw.png"
    : "/sprites/trainers/player/red-throw.png";
}
