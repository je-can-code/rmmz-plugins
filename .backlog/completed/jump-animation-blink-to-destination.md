# Jump animation plays vertical arc then blinks to destination

## Symptom

Any jump (knockback, event-triggered, etc.) plays the vertical hop animation in place, then the character **teleports** to the destination instantly — no horizontal arc. Observed during knockback from enemy hits and event-driven jumps. Visually: hop up → blink → you're over there.

## Likely cause

RMMZ's native `Game_CharacterBase.prototype.jump(xPlus, yPlus)` and its `updateJump()` were designed for **tile-based** movement. The jump arc interpolation uses `_realX` / `_realY` and tile-grid math to smoothly move the character from origin to destination over the jump duration.

J-Pixelistics overrides character positioning to use **pixel/fractional coordinates**. The jump system's horizontal interpolation likely doesn't account for the pixel movement coordinate space — so `updateJump` plays the vertical arc (jump height works because it's purely visual / sprite offset via `jumpHeight()`) but the X/Y movement either:
1. Snaps to tile boundaries mid-jump (pixel coords get floored/rounded)
2. Completes the entire horizontal distance in a single frame at the end
3. The pixel movement update loop fights with the jump interpolation

## Where to look

- **Engine core:** `Game_CharacterBase.prototype.updateJump` — the vanilla jump interpolation
- **J-Pixelistics overrides:** check if `src/plugins/pixel/core/` overrides `updateJump`, `jump`, `jumpHeight`, `_realX`/`_realY` setters, or `updateMove` in a way that conflicts
- **Knockback entry point:** `src/plugins/abs/core/managers/JABS_Engine.js` ~line 2982 — `targetSprite.jump(realX - targetSprite.x, realY - targetSprite.y)` — the delta might be pixel-scale values fed into a tile-scale function
- **Pixel-ABS bridge:** `src/plugins/pixel/ext/abs/` may need a jump override

## Specific suspicion

The knockback code at line 2982 computes the jump delta as `realX - targetSprite.x` where both are pixel-scale values from J-Pixelistics. But vanilla `jump(xPlus, yPlus)` expects **tile-count** deltas (e.g., jump 3 tiles right = `jump(3, 0)`). If pixel coords are being passed as tile deltas, the jump thinks it needs to travel hundreds of tiles and the interpolation breaks.

## Validation

- Knockback from any enemy attack should show a smooth arc to the landing point
- Event-commanded jumps (e.g., cliff jump in Ch1 Stone's Throw map) should arc smoothly
- In-place hop (`jump(0, 0)`) should still work (vertical only, no horizontal — this probably still looks fine)