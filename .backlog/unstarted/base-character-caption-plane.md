# Character caption plane

## Source

- `src/plugins/_base/core/sprites/Sprite_CharacterOverlay.js`
- `src/plugins/popups/core/sprites/Sprite_Character.js` (`this.parent.addChild(sprite)`, lines 151, 172)
- `src/plugins/abs/core/sprites/Sprite_Character.js`, `abs/ext/shield/`, `abs/ext/charge/`,
  `escribe/core/sprites/Sprite_Character.js` — every consumer of `characterOverlay()`
- `project/js/rmmz_sprites.js` (`Spriteset_Base.createBaseSprite`, `createBaseFilters`)

## Context

A character's captions — nameplate, HP gauge, shield and charge bars, escriptions — hang off
`Sprite_CharacterOverlay`, which is a child of `Sprite_Character`. Damage popups are added directly
to `Sprite_Character.parent`, which is `_tilemap`. Both therefore live inside `_baseSprite`.

`_baseSprite` is where `_baseColorFilter` is attached, and a PIXI filter affects only its own
subtree. So **every caption in the game is tinted by the day/night screen tone**: an enemy's
nameplate goes blue at midnight, and its HP gauge desaturates along with the rock behind it. A
caption is information *about* the world rather than part of it, and nothing about the hour should
change how legible it is.

This is a pre-existing defect and reproduces today with no lighting plugin installed. It was found
while designing J-Lighting, which makes it far more visible — under an ambient mask a caption in a
dark cave does not merely tint, it disappears — but the mask is not the cause and J-Lighting
deliberately does not fix it. J-Lighting inserts its mask with `addChildAt` indexed off `_weather`,
so anything parented at spriteset level is already exempt; JABS cast previews and debug hitboxes sit
there and stay lit. Captions and popups do not.

## Recommendation

`Sprite_CharacterOverlay` is **already the plane**. Five plugins funnel through `characterOverlay()`,
and it already overrides `updateTransform` to cancel the parent's scale and rotation exactly and snap
to the device pixel grid. It is simply parented one level too low.

Lift it to a spriteset-level container that sits above both the tone filter and J-Lighting's mask,
and teach it to position itself from its character rather than inherit that position. Move damage
popups into the same container.

## Work

- Add a caption container to `Spriteset_Map`, parented at spriteset level, created after `_weather`.
- Reparent `Sprite_CharacterOverlay` instances into it; give the overlay a reference to the character
  sprite it captions and have `updateTransform` derive position from `screenX()` / `screenY()`
  instead of inheriting it.
- Preserve the existing rule the class documents at length: nothing about caption *space* stretches.
  Cancelling scale must keep behaving exactly as it does now — a nameplate at y 0 and its tier stripe
  at y 16 are one object drawn in two pieces.
- Move J-Popups' two `this.parent.addChild(sprite)` sites onto the same container.
- Decide depth ordering among captions. Today each one inherits its character's place in `_tilemap`,
  which sorts by y, so a nearer character's nameplate naturally draws over a farther one's. A flat
  container loses that and needs explicit sorting or an accepted overlap.
- Confirm the overlay still extends `Sprite` rather than a bare container — `Sprite.update` walking
  its children is what keeps gauges telling the truth, and the class says so.

## Definition of done

- [ ] `bun run hotfix` green
- [ ] coverage still 100% on every touched file under `src/plugins/**`
- [ ] in-game at midnight with J-TIME running: an enemy nameplate and HP gauge render at full
      brightness while the terrain around them is tinted
- [ ] in-game on a map with a dark `<ambient:>`: the same captions and a damage popup stay readable
      while the world is dark
- [ ] two enemies standing one tile apart on the y axis — the nearer one's nameplate draws over the
      farther one's, as it does today
- [ ] a character mid-`<motion:[breathe]>` and mid-`<motion:[spin]>`: its nameplate neither squashes
      nor rotates, which is the property `Sprite_CharacterOverlay` exists to guarantee

## Notes

- Not urgent, and not a blocker for J-Lighting — that ship is complete and shippable with captions
  darkening along with the world.
- Touches J-Base, J-Popups, J-ABS, J-Escriptions, J-ABS-Shield and J-ABS-Charge, which is why it is
  its own item rather than part of the lighting work.
- Anything that wants to glow in the dark *within* the world's rules does not need this at all: a
  skill, state or equip carrying `<light:[...]>` is read through `getAllNotes()` by J-Lighting and
  lights the scene diegetically.
