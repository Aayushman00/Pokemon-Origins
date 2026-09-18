import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { playerTrainerSprite } from "./trainerSprite.js";

describe("playerTrainerSprite", () => {
  it("returns leaf.png for Female", () => {
    assert.equal(playerTrainerSprite("Female"), "/sprites/trainers/player/leaf.png");
  });

  it("returns red.png for Male", () => {
    assert.equal(playerTrainerSprite("Male"), "/sprites/trainers/player/red.png");
  });

  it("returns red.png for Other (no third asset exists -- see plan Ruling 1)", () => {
    assert.equal(playerTrainerSprite("Other"), "/sprites/trainers/player/red.png");
  });

  it("returns red.png when gender is missing/null/undefined", () => {
    assert.equal(playerTrainerSprite(undefined), "/sprites/trainers/player/red.png");
    assert.equal(playerTrainerSprite(null), "/sprites/trainers/player/red.png");
  });
});
