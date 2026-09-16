// starterStats.js
module.exports = {
  bulbasaur: {
    pokemon_id: 1,    // Official Pokémon ID for Bulbasaur
    nickname: 'Bulbasaur',
    level: 5,
    max_hp: 45,
    current_hp: 45,
    attack: 49,
    defense: 49,
    speed: 45,
    special_atk: 65,
    special_def: 65,
    experience: 0,
    status: 'Healthy',
    moves: [
      {
        move_id: 33,
        name: "Tackle",
        power: 40,
        accuracy: 1,
        move_type: "Normal",
        pp: 35,
        // Optional: add status_effect and effect_chance if needed
        status_effect: null,
        effect_chance: null
      },
      {
        move_id: 45,
        name: "Growl",
        power: null,    // Status move, no power
        accuracy: 1,
        move_type: "Normal",
        pp: 40,
        status_effect: null,
        effect_chance: null
      },
      {
        move_id: 22,
        name: "Vine-whip",
        power: 45,    
        accuracy: 1,
        move_type: "Grass",
        pp: 25,
        status_effect: null,
        effect_chance: null
      }
    ]
  },
  charmander: {
    pokemon_id: 4,    // Official Pokémon ID for Charmander
    nickname: 'Charmander',
    level: 5,
    max_hp: 39,
    current_hp: 39,
    attack: 52,
    defense: 43,
    speed: 65,
    special_atk: 60,
    special_def: 50,
    experience: 0,
    status: 'Healthy',
    moves: [
      {
        move_id: 10,
        name: "Scratch",
        power: 40,
        accuracy: 1,
        move_type: 'Normal',
        pp: 35,
        status_effect: null,
        effect_chance: null
      },
      {
        move_id: 45,   // Using Growl (or you can assign a different move_id if desired)
        name: "Growl",
        power: null,
        accuracy: 1,
        move_type: 'Normal',
        pp: 40,
        status_effect: null,
        effect_chance: null
      },
      {
        move_id: 52,
        name: "Ember",
        power: 40,  
        accuracy: 1,
        move_type: "Fire",
        pp: 25,
        status_effect: null,
        effect_chance: null
      }
    ]
  },
  squirtle: {
    pokemon_id: 7,    // Official Pokémon ID for Squirtle
    nickname: 'Squirtle',
    level: 5,
    max_hp: 44,
    current_hp: 44,
    attack: 48,
    defense: 65,
    speed: 43,
    special_atk: 50,
    special_def: 64,
    experience: 0,
    status: 'Healthy',
    moves: [
      {
        move_id: 33,   // Using Tackle for consistency
        name: "Tackle",
        power: 40,
        accuracy: 1,
        move_type: 'Normal',
        pp: 35,
        status_effect: null,
        effect_chance: null
      },
      {
        move_id: 39,
        name: "Tail Whip",
        power: null,   // Typically a status move
        accuracy: 1,
        move_type:"Normal",
        pp: 30,
        status_effect: null,
        effect_chance: null
      },
      {
        move_id: 55,
        name: "Water-gun",
        power: 40,
        accuracy: 100,
        // Phase 11 data fix: was mistyped as "Normal", which broke type
        // effectiveness for Squirtle's only non-Normal starter move.
        move_type: "Water",
        pp: 25,
        status_effect: null,
        effect_chance: null
      }
    ]
  }
};
