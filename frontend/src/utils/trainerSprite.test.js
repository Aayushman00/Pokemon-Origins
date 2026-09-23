import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { playerTrainerSprite, playerTrainerThrowSprite } from "./trainerSprite.js";

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

describe("playerTrainerThrowSprite", () => {
  it("returns the Leaf throw strip for Female", () => {
    assert.equal(playerTrainerThrowSprite("Female"), "/sprites/trainers/player/leaf-throw.png");
  });

  it("returns the Red throw strip for everything else", () => {
    for (const g of ["Male", "Other", undefined, null]) {
      assert.equal(playerTrainerThrowSprite(g), "/sprites/trainers/player/red-throw.png");
    }
  });
});
