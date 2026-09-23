# Battle Damage Feedback

Sub-project 1 of 2 from the FireRed-inspired redesign (sub-project 2, the
Pokédex redesign, gets its own spec → plan cycle after this ships).

## Context

A damaging move in `frontend/src/pages/Game/BattleSim.jsx` (`playEvent`,
~lines 660–755) currently plays:

`"X used Move!"` → attack animation → identical flash + shake for every hit
→ HP bar moves → 600ms → `"X dealt N damage!"` → crit / effectiveness lines.

Reference order (pokefirered decomp, `BattleScript_HitFromAtkAnimation`):

```
attackanimation → effectivenesssound → hitanimation (target blinks)
→ healthbarupdate (drain) → critmessage → resultmessage
```

FireRed drains first and names the effectiveness *after*; the at-impact
effectiveness signal is the sound. This spec keeps that order and fixes four
concrete problems:

1. **Log lines are not locked to beats.** `addLog` (line 297) enqueues and
   returns immediately; `flushNextMessage` paints one line per 600ms on its
   own timer. Every `await wait(...)` after an `addLog` starts counting at
   *enqueue*, not at *paint*, so with any backlog the visuals run ahead of
   their text. This is the root cause and affects every beat, not just hits.
2. **No effectiveness signal at impact.** ×0.25 and ×4 hits get the same
   flash, blink and shake.
3. **HP drain is driven by two systems at once.** `HpBox.jsx`'s
   `motion.div` animates `width` with a spring (`stiffness 120, damping 20`)
   while `BattleGround.css:330` also declares
   `transition: width 1s steps(10, end)` on the same element. Result is
   neither a clean spring nor a clean stepped drain.
4. **`"X dealt N damage!"`** is not a FireRed line and delays the
   effectiveness line by one queue slot (600ms).

## Decisions (resolved with the user before drafting)

- Order stays FireRed's: impact (tiered) → drain → text. No text-before-hit.
- Only numeric addition: a `-N` tick on the defender's HP box.
- `"X dealt N damage!"` is deleted.
- **Audio: out of scope.** No audio files exist in the frontend today —
  `frontend/public/` has no `sounds/` directory and no `.wav/.mp3/.ogg`
  anywhere outside `node_modules`. Every `playSound(...)` call currently
  fails into its `console.warn` catch. Adding assets is a new asset
  pipeline, which is excluded. Visual impact tiers are the intended
  substitute. Follow-up (not this spec): if sound assets are added later,
  tiered hits would need `hit-super.wav` / `hit-weak.wav` alongside the
  already-referenced-but-missing `attack.wav` / `damage.wav`.

## Scope

### In scope

1. **Awaitable `addLog` — file-wide root-cause fix.** Changes the contract
   of `addLog` for the whole of `BattleSim.jsx`. Every beat inside
   `playEvent` (switch, send-out, items, XP, level-up, status, stat change,
   recoil, drain, heal, cant-move, move hits, faints) awaits its line before
   running its visual/wait. See §1 for the enumerated call sites.
2. Impact tiers by type effectiveness (visual only). §2.
3. New damaging-move beat order, including deleting the "dealt N" line and
   fixing post-drain line order. §3.
4. Stepped HP drain replacing the spring, HP bar only. §4.
5. `-N` damage tick on the defender HP box. §5.

### Non-goals

- Sound assets or any audio change.
- EXP bar (`.gba-exp-fill`) has the same spring-vs-CSS double driver as the
  HP bar; not touched here (HP only). Noted for the Pokédex/HUD follow-up.
- Skipping the attacker's animation on ×0 moves (FireRed skips it; we keep
  the current behavior — see §3 ×0).
- `-N` ticks for recoil, burn/poison chip, drain or heal. Move hits only.
- Server/event contract changes. All needed fields already exist on the
  `move` event: `damage`, `type_multiplier`, `critical_hit`, `hits`, `ohko`,
  `targetHpAfter`, `targetFainted`.

## 1. Awaitable `addLog`

### Contract

`addLog(message)` returns a `Promise<void>` that resolves when
`flushNextMessage` moves **that specific line** into `activeBeatLines`
(React commits it in the same frame). Lines stay paced by the existing
queue: after one line paints, the next paints no sooner than
`motionMs(600)` later. So:

```js
await addLog('a');   // resolves when 'a' is on screen
await addLog('b');   // resolves ≥600ms later, when 'b' is on screen
```

Implementation shape:

```js
const addLog = (message) =>
  new Promise((resolve) => {
    messageQueueRef.current.push({ message, resolve });
    if (!messageTimerRef.current) flushNextMessage();
  });

// flushNextMessage: shift {message, resolve}, append message to
// activeBeatLines, call resolve(), schedule the next flush as today.
```

**Queue clears must resolve, not drop.** The two places that reset the
queue — `resolveServerAction` (line ~781) and `restartBattle` (line ~919) —
call each pending entry's `resolve()` before emptying the array. Otherwise
an in-flight `await addLog(...)` hangs forever and the round never hands
the menu back.

**Reduced motion:** `motionMs(600)` is 0, so lines still paint in order via
`setTimeout(…, 0)` and every await resolves promptly. No special case.

The existing drain loop in `resolveServerAction` (line ~834, waits until
queue and timer are empty) stays as a safety net.

### Call sites that change (add `await`)

All inside `playEvent` or `logEffectiveness` — the beat path. Line numbers
are current `BattleSim.jsx`.

| Line | Beat | Line text |
|------|------|-----------|
| 451 | switch | `Go! X!` |
| 482 | enemy send-out | `Trainer sent out X!` |
| 493 | item | `Used Item! X recovered N HP.` |
| 505 | XP | `X gained N XP!` |
| 511 | coins | `Got N coins!` |
| 516 | level-up | `X grew to Lv N!` |
| 525 | evolve available | `X can now evolve!` |
| 531 | move learned | `X learned Move!` |
| 539 | move learn available | `X wants to learn Move!` |
| 575 | cant_move | status text |
| 583 | status_applied | status text |
| 592 | status_end | status text |
| 602 | status_damage | status hurt text |
| 612 | status_damage faint | `X fainted!` |
| 621 | stat_change | stat text |
| 629 | recoil | `X is damaged by recoil!` |
| 639 | recoil faint | `X fainted!` |
| 648 | drain | `X drained energy!` |
| 656 | heal_move | `X regained health!` |
| 667 | move | `X used Move!` |
| 697 | miss | `X's attack missed!` |
| 704 | failed | `doesn't affect` / `But it failed!` |
| 742 | multi-hit | `Hit N time(s)!` |
| 743 | OHKO | `It's a one-hit KO!` |
| 750 | move faint | `X fainted!` |
| 334–339 | `logEffectiveness` | crit / effectiveness lines — function becomes `async`, its own `addLog`s are awaited, and its caller awaits it |

Deleted: line 741 (`dealt N damage!`).

### Call sites that do NOT change (stay fire-and-forget)

Not part of a sequenced beat; nothing visual waits on them. Their returned
promise is ignored.

| Line | Context |
|------|---------|
| 165, 168 | `startEncounter` timer callback (`Choose your next Pokémon!` / `Battle started!`) |
| 195 | `startBattle` opening line |
| 353, 360 | bag open empty / error |
| 375 | switch menu "no other Pokémon" |
| 858 | recoverable 400 error after a failed action |
| 944 | `Battle restarted!` timeout |

### Timing consequence

Beats that did `addLog(x); await wait(N)` now wait N **from paint**. When
the queue had a backlog, rounds get slightly longer; that extra time is the
drift being removed, not a regression.

## 2. Impact tiers

New pure helper in `frontend/src/pages/Game/battleAnimation.js`:

```js
// 'none' | 'weak' | 'normal' | 'super'
export function getImpactTier(typeMultiplier) { ... }
```

- `0` → `'none'`; `< 1` → `'weak'`; `> 1` → `'super'`; anything else
  (`1`, missing, non-number) → `'normal'`.

| Tier | Stage flash (`triggerHitFlash`) | Sprite blink class | Sprite shake (`ANIMATION_VARIANTS`) | `-N` tick |
|------|------|------|------|------|
| none (×0) | no | none | none | no |
| weak (<1) | no | `.damage-effect--weak`: one soft blink, `damageFlash-weak 0.25s steps(2,end) 1` (opacity 0.6, brightness 3) | new `WEAK_HIT`: `{ opacity: [1, 0.8, 1] }` (no x movement) | yes |
| normal (×1) | yes (unchanged) | `.damage-effect` (unchanged) | `DAMAGE` (unchanged) | yes |
| super (>1) | yes | `.damage-effect--super`: double blink, `damageFlash 0.3s steps(2,end) 2` | new `SUPER_HIT`: `x: [-13, 13, -13, 13, 0]` (between `DAMAGE` ±10 and `CRITICAL_HIT` ±16) | yes |

**Crit** is independent of the tier: `triggerCriticalFlash` still fires on
any non-`none` crit, and the sprite shake uses `CRITICAL_HIT` (crit beats
tier for shake; tier still picks the blink class and the stage flash).

`getAnimState` priority becomes: `FAINT` > `CRITICAL_HIT` > `SUPER_HIT` >
`DAMAGE` > `WEAK_HIT` > `IDLE`. Its `damageEffect` argument widens from
boolean to `false | true | 'weak' | 'normal' | 'super'`; `true` still means
`'normal'`, so the existing `status_damage` / `recoil` callers
(`setDamageFx(true)`) are unchanged.

## 3. Damaging-move beat order

Beat-by-beat for `event.type === 'move'` (player or enemy attacker):

| # | Beat | Timing | Change vs today |
|---|------|--------|-----------------|
| 1 | `await addLog("X used Move!")` | until painted | awaited |
| 2 | Enemy only: show opponent move, `wait(700)` telegraph | 700ms | unchanged |
| 3 | Attack animation: status sparkle 400ms / physical lunge 500ms / ranged 200+300ms | per category | unchanged |
| 4 | Branches that end here: miss, failed (incl. ×0), status, heal | — | their lines awaited; otherwise unchanged |
| 5 | **Impact**: `tier = getImpactTier(event.type_multiplier)`. Stage flash + crit flash + sprite blink/shake per §2. In the same tick: `setDefender(current_hp = targetHpAfter)` (starts the stepped drain, §4) and show the `-N` tick (§5) | starts together | tiered; tick new |
| 6 | `wait(motionMs(600))` — the drain duration | 600ms | same length, now equals drain |
| 7 | Clear damage effect / crit state | — | unchanged |
| 8 | `await addLog("A critical hit!")` if crit | until painted | moved before effectiveness |
| 9 | `await addLog("It's super effective!" / "It's not very effective...")` per tier | until painted | awaited |
| 10 | `await addLog("Hit N time(s)!")` if `hits > 1` | until painted | moved after effectiveness |
| 11 | `await addLog("It's a one-hit KO!")` if `ohko` | until painted | moved after effectiveness |
| 12 | Faint beat if `targetFainted`: `wait(300)` → faint anim → `await addLog("X fainted!")` → `wait(700)` | unchanged durations | awaited |

`"X dealt N damage!"` — deleted.

Post-drain line order (8→11) is fixed by a pure helper in
`battleAnimation.js`:

```js
// Ordered lines shown after the drain for a landed hit.
export function hitResultLines({ critical_hit, type_multiplier, hits, ohko }) { ... }
```

`logEffectiveness` is replaced by awaiting each line of `hitResultLines`.
The ×0 text (`"It doesn't affect X..."`) stays on the `failed` branch where
it is today.

### ×0 (immune / no effect)

Confirmed: no stage flash, no blink, no shake, no `-N` tick, no crit flash
and no crit line — only the existing `"It doesn't affect X..."` message,
text unchanged. The server delivers these as `result: 'failed'` with
`type_multiplier === 0`, which already returns before the impact beat. As a
guard, if a `move` event ever reaches beat 5 with tier `'none'`, it awaits
the "doesn't affect" line and returns without beats 5–11.

Kept as-is (deliberate deviation from FireRed): beats 1–3 still play for a
×0 move, i.e. the attacker still lunges / flashes. FireRed skips the attack
animation for immunity. Changing that is a separate call.

### Status moves

`"X used Move!"` is awaited (beat 1) before the sparkle (beat 3). Outcome
lines arrive as separate `status_applied` / `stat_change` events, which now
also await their text. So yes, the sparkle waits for its message the same
way physical and ranged do. The rule is uniform across all three
categories: **a visual beat never starts before the line that introduces
it has painted.**

## 4. Stepped HP drain

`ANIMATION_GUIDE.md` gives no frame count. What it does say: `--dur-slow`
(300ms) is listed for "HP drain steps", and "Retro effects may use
`steps(n, end)` (HP drain, damage flash) — steps read more 'GBA' than
smooth curves." The CSS already reaches for `1s steps(10, end)` but is
overridden by the spring.

Pinned values:

- **Duration 600ms, `steps(12, end)`** → 50ms per step ≈ 3 GBA frames at
  59.7fps. 600ms matches the existing post-impact wait (beat 6), so the
  drain finishes exactly when the next line may paint. (300ms from the
  token table is too fast to read a 12-step drain; the guide lists it as a
  step-related token, not a total.)
- New token in `frontend/src/styles/tokens.css`: `--dur-drain: 600ms`. JS
  uses a `DRAIN_MS = 600` constant in `BattleSim.jsx` with a comment tying
  it to the token.
- `ANIMATION_GUIDE.md` timing table gains a `--dur-drain` row
  ("HP bar drain, `steps(12, end)`"), and its Battle beat order section is
  updated to the §3 order.

Implementation: in `HpBox.jsx` the HP fill becomes a plain `<div>` (no
`motion.div`, no spring, no `initial`). `BattleGround.css` `.gba-health-fill`
becomes `transition: width var(--dur-drain) steps(12, end)`. One system
drives the width.

**Applies to the HP bar only.** The `-N` tick has its own motion (§5) and
does not use the drain timing. The EXP bar is out of scope.

It applies to every HP change, since the CSS is on the element: move hits,
recoil, burn/poison chip, drain, heal, items. Rises step up the same way.

**Reduced motion:** the global rule in `tokens.css` collapses the
transition, so the bar jumps. The HP number text still updates.

## 5. `-N` damage tick

- **Where:** `HpBox` gets a new prop `damageTick: { id, amount } | null`.
  Renders `<span className="gba-damage-tick" key={id}>-{amount}</span>`,
  right-aligned on the HP bar row. Enemy box: next to the bar, since it has
  no HP number. Player box: before the `HP: a/b` text.
- **Who:** only the defender of a landed move hit (tier ≠ `'none'`), using
  `event.damage`. For multi-hit moves, one tick with the total.
- **When:** set at beat 5, cleared after a fixed 700ms via a timer in
  `timersRef` (so restart/unmount cleanup still clears it). The 700ms is
  **not** wrapped in `motionMs`, so it still shows under reduced motion.
- **Motion:** appear only — opacity 0→1 over `--dur-fast` (100ms) with
  `steps(2, end)`; removed instantly at 700ms. No translate, no float, no
  scale.
- **Style:** `--font-pixel`, same size as the HP text, colour = the HP box
  text colour. No colour-coding by effectiveness (the tier covers that).
- **Reduced motion:** the global rule collapses the 100ms fade, so it is
  static text for 700ms.
- **Accessibility:** `aria-hidden="true"`. The log line is the accessible
  record, and the HP number (player) is already present.

## Files touched

| File | Change |
|------|--------|
| `frontend/src/pages/Game/BattleSim.jsx` | awaitable `addLog` + resolver-safe queue clears; `await` at the enumerated call sites; §3 beat order; tier wiring; `damageTick` state; delete "dealt N" line |
| `frontend/src/pages/Game/battleAnimation.js` | `getImpactTier`, `hitResultLines`, `WEAK_HIT` / `SUPER_HIT` variants, widened `getAnimState` |
| `frontend/src/pages/Game/battleAnimation.test.js` | tests for the above |
| `frontend/src/pages/Game/battle/HpBox.jsx` | plain-div HP fill; `damageTick` prop |
| `frontend/src/pages/Game/BattleGround.css` | stepped `.gba-health-fill`; `.damage-effect--weak/--super`; `damageFlash-weak`; `.gba-damage-tick` |
| `frontend/src/styles/tokens.css` | `--dur-drain` |
| `docs/design/ANIMATION_GUIDE.md` | `--dur-drain` row; updated battle beat order |

## Testing

- **Unit** (`node --test`, existing pattern in `battleAnimation.test.js`):
  - `getImpactTier`: 0, 0.25, 0.5, 1, 2, 4, `undefined`, `NaN`.
  - `hitResultLines`: order crit → effectiveness → multi-hit → OHKO; ×1
    yields no effectiveness line; ×0 yields none of the hit lines.
  - `getAnimState`: priority with the new states; `true` still maps to
    `DAMAGE`.
- **Manual, in the running app** (normal and reduced motion):
  - Neutral, super, resisted, crit and multi-hit hits: text appears only
    after the drain, and no line ever lags a visual it describes.
  - Resisted: no stage flash, soft single blink, no shake.
  - Super: double blink, stronger shake.
  - Immune: only "doesn't affect", no tick or blink.
  - Status move: "used" line visible before the sparkle.
  - Restart mid-round and fast consecutive rounds: menu always comes back
    (no hung awaits).
  - HP bar visibly steps and never springs or overshoots.
