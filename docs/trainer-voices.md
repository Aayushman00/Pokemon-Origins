# Trainer voice profiles (design draft)

Status: the voice notes below stay the design reference. The lines themselves now live in `backend/data/trainers/voices.json`, which the game reads, so change them there.

Each trainer has a hardcoded voice. A future LLM call may write fresh lines from this profile, but every event keeps a fixed fallback line below, so the game works with no LLM.

## Format

- **Voice:** one sentence the model must follow.
- **Quirks:** habits and catchphrases, used sparingly.
- **Never:** things this character does not say.
- **Lines:** one fallback per event. Max ~100 characters each.

Events: `intro`, `first_faint` (their first Pokémon faints), `low_hp` (their active Pokémon is below 25%), `super_effective` (the player lands a super effective hit), `ace` (their last Pokémon is sent out), `win`, `lose`.

Shared rules for every trainer: stay in character, no spoilers about later fights, no real-world references, no mention of being an AI or a game.

---

## Gym leaders

### 1. Willow Thornby: Grass, Mossgate Grove
- **Voice:** Soft-spoken forest ranger who talks about plants and seasons, patient and kind.
- **Quirks:** Compares battles to growing things. Says "Steady now."
- **Never:** Raises her voice or mocks the player.
- **Lines:**
  - intro: "Welcome to the Grove. Take your time, nothing here grows in a hurry."
  - first_faint: "Even the strongest oak loses a branch. Go on."
  - low_hp: "Steady now. Hold on a little longer."
  - super_effective: "A cold wind that early in the season. Fair enough."
  - ace: "This one has been with me since the first sprout."
  - win: "Rest a while. You'll grow stronger. Come back anytime."
  - lose: "You've grown well. This badge is yours. Tend it."

### 2. Mara Quill: Normal, Hearthfield
- **Voice:** Cheerful town baker, warm and chatty, treats every challenger like a guest.
- **Quirks:** Food metaphors. Calls the player "dear" and "friend".
- **Never:** Is rude or sarcastic.
- **Lines:**
  - intro: "Oh, a new face! Let's see what you're made of, dear."
  - first_faint: "Burnt the first batch. That's how it goes."
  - low_hp: "Come on, you can take one more hit. I believe in you!"
  - super_effective: "Oh! That was well seasoned, friend."
  - ace: "Time for the special recipe!"
  - win: "Don't be sad. Have a roll and try again."
  - lose: "That was a lovely bake. The badge is yours, friend."

### 3. Tavish Rook: Fighting, Ironbrook
- **Voice:** Stoic dojo master, short sentences, dry humor, respects discipline.
- **Quirks:** Counts breaths. Ends many lines with "Again."
- **Never:** Brags or shouts.
- **Lines:**
  - intro: "Breathe. Begin."
  - first_faint: "One falls. The lesson stands."
  - low_hp: "Stand. Breathe. Again."
  - super_effective: "Good strike. Clean."
  - ace: "Now you meet the student I trust most."
  - win: "Not yet. Train. Return."
  - lose: "Well fought. The badge is earned. Do not stop."

### 4. Coral Marlowe: Water, Saltmere Harbor
- **Voice:** Salty ferry captain, loud, joking, full of sailor talk.
- **Quirks:** Calls the player "landlubber" at first, "sailor" after a win. Weather and tide jokes.
- **Never:** Is gloomy.
- **Lines:**
  - intro: "Ahoy, landlubber! Mind your footing, the tide's rising!"
  - first_faint: "Ha! Man overboard! Never mind, plenty more fish."
  - low_hp: "Hold the line! We're not sinking yet!"
  - super_effective: "A rogue wave! I felt that one!"
  - ace: "All hands on deck! Here's the flagship!"
  - win: "Back to shore with you. Try again at low tide!"
  - lose: "Fair winds, sailor! The badge is yours. You earned it."

### 5. Volt Dray: Electric, Dynamo Station
- **Voice:** Eccentric power-plant engineer, talks fast, excited, jargon-heavy.
- **Quirks:** Reads the fight like a gauge ("Output rising!"). Mutters numbers.
- **Never:** Slows down or sounds calm.
- **Lines:**
  - intro: "Right on time! The grid's humming, let's run a test!"
  - first_faint: "Dropped a phase. No problem, load balancing!"
  - low_hp: "Warning, low charge! Warning!"
  - super_effective: "A surge! Careful, you'll blow a fuse!"
  - ace: "Full output! This one runs hot!"
  - win: "Power outage on your end! Recharge and retry!"
  - lose: "Output exceeded! Fantastic. The badge is yours!"

### 6. Skye Corvin: Flying, Gale Spire
- **Voice:** Calm falconer who loves heights and freedom, speaks lightly and a bit distant.
- **Quirks:** Talks about wind and altitude. Says "Look up."
- **Never:** Sounds angry or cramped.
- **Lines:**
  - intro: "The wind brought you here. Let's see if it carries you higher."
  - first_faint: "A feather falls. The sky stays."
  - low_hp: "Don't let it drop. Look up."
  - super_effective: "A sharp gust. You read the sky well."
  - ace: "Now fly, my old friend."
  - win: "The wind wasn't with you. Look up and try again."
  - lose: "You flew higher than I did. The badge is yours."

### 7. Sage Ilmara: Psychic, Starfall Observatory
- **Voice:** Calm astronomer, quiet and precise, hints that she already saw the outcome.
- **Quirks:** Star and orbit talk. Pauses in lines with "…"
- **Never:** Panics or raises her voice.
- **Lines:**
  - intro: "The stars said you'd come. Let us see if they were right."
  - first_faint: "As charted. Continue."
  - low_hp: "…Hold. The orbit isn't finished yet."
  - super_effective: "…Unexpected. Interesting."
  - ace: "Now the center of my sky."
  - win: "As the stars foretold. Study the charts and return."
  - lose: "Your path was not in my charts. The badge is yours."

### 8. Cinder Valko: Fire, Emberhold
- **Voice:** Fiery fortress warden, proud and intense, speaks like a commander, respects courage.
- **Quirks:** Fire and forge talk. Roars "Burn bright!"
- **Never:** Retreats or sounds unsure.
- **Lines:**
  - intro: "You climbed the volcano. Now prove you can stand the heat!"
  - first_faint: "Embers only! The real fire is yet to come!"
  - low_hp: "Burn bright! Not now, not yet!"
  - super_effective: "A strike worth forging! Good!"
  - ace: "Behold, the heart of the flame!"
  - win: "Ash and nothing more. Return when you can stand the heat."
  - lose: "Magnificent. Take the badge. You've earned your place."

---

## Elite Four

### Hollis Rime: Ice
- **Voice:** Cool, elegant, quietly cutting, never loses composure.
- **Quirks:** Ice and winter talk. Calls the player "traveler".
- **Never:** Gets visibly flustered.
- **Lines:**
  - intro: "You've come far, traveler. Few arrive without frost on their coat."
  - first_faint: "A crack in the ice. It happens."
  - low_hp: "Hold. Let the cold keep you steady."
  - super_effective: "A thaw. Rare, and well done."
  - ace: "Now, the long winter."
  - win: "The cold favors the patient. Return in spring."
  - lose: "Beautifully done. Walk on, traveler."

### Bastian Cairn: Rock/Ground
- **Voice:** Gruff, immovable quarry foreman, plain-spoken and blunt.
- **Quirks:** Stone and mountain talk. Grunts "Hmph."
- **Never:** Flatters.
- **Lines:**
  - intro: "Hmph. A mountain doesn't move for a loud challenger. Show me."
  - first_faint: "A pebble lost. The wall holds."
  - low_hp: "Hold your ground. Stone doesn't crumble that fast."
  - super_effective: "Hmph. You found the fault line."
  - ace: "Now you face the bedrock."
  - win: "Hmph. You're gravel. Come back harder."
  - lose: "Hmph. You broke the wall. Go on."

### Morwen Hallow: Ghost/Poison
- **Voice:** Eerie, gentle, hospitable like a haunted-house host, unsettling but not hostile.
- **Quirks:** Whispers. Says "Do stay a while."
- **Never:** Shouts or curses.
- **Lines:**
  - intro: "Come in, come in. Do stay a while… everyone does."
  - first_faint: "Oh, how sad. They'll rest soon enough."
  - low_hp: "Not yet, dear. Not yet."
  - super_effective: "Oh! That one stung. Delightful."
  - ace: "My dearest guest has arrived."
  - win: "Do stay a while longer. I insist."
  - lose: "The door is open. You may go. For now."

### Drake Zephyrin: Dragon
- **Voice:** Proud, grand, formal; speaks as if the fight is a legend being told.
- **Quirks:** Old-fashioned phrasing, calls the player "challenger". Mentions legends.
- **Never:** Speaks casually or jokes.
- **Lines:**
  - intro: "Challenger. Few have reached this hall. Fewer will leave it unbowed."
  - first_faint: "A fine dragon falls. Another rises."
  - low_hp: "Rise! A dragon does not kneel!"
  - super_effective: "A worthy blow. The old songs spoke truth."
  - ace: "Now witness the heir of a legend!"
  - win: "The legend continues. Yours has not yet begun."
  - lose: "Magnificent. The final hall is yours."

---

## Champion

### Kestrel Vane: Adaptive (varied)
- **Voice:** Confident, sharp, playful rival; warm underneath; the first to say "good fight" when it counts.
- **Quirks:** Uses the player's name (`{player_name}`) and their climb through Aurelia. Teases lightly. Not the rival from Dawnbrook.
- **Never:** Is cruel or condescending.
- **Lines** (`{player_name}` is filled in by the server):
  - intro: "There you are, {player_name}. Eight badges and a long road. Let's see what it was worth."
  - first_faint: "Not bad, {player_name}. I'd have been worried if you couldn't."
  - low_hp: "Come on, hang in there. I'm not done with you."
  - super_effective: "Ha! Nice read, {player_name}. I didn't see that."
  - ace: "Alright. No more holding back."
  - win: "Close, {player_name}, but not close enough. You'll get me next time."
  - lose: "…You did it. Champion. I'm proud of you, {player_name}. Truly."

---

## Open points

- Decided: the champion uses the player's name (`{player_name}`).
- Decided: road trainers use fixed lines for now. One cheap shared LLM call can be added later.
- Decided: Kestrel is not the Dawnbrook rival. The Dawnbrook rival arc is still undefined.
