# Map edge slides: Zelda-style scrolling between stitched maps

## Status

Unstarted. Jeremy, 2026-09-29, after asking what it would take to "literally stitch maps together ala
oldschool zelda": **"yes tempted, but not today."**

It depends on the relative transfer from the J-Pixelistics area-event work (a transfer zone that lands the
player as far along the destination edge as they were along the zone). That lands first. This item is the
visual half that could sit on top of it later.

## Context

Crossing a map edge in Chef Adventure today fades to black, loads the next map, and fades back in, and the
player lands on one fixed tile no matter where along the edge they crossed. The ask is the old Zelda feel
instead: the old map slides out, the new one slides in, no black frame, and the player comes out right
where they went in.

Chef Adventure's maps average about 1.8 screens each (the screen is 1920x1080 at 48px tiles, so 40 x 22.5
tiles), so in practice this is the A Link to the Past model: the camera follows the player inside a map, and
the slide happens only at the edges. Roughly 209 maps are joined edge to edge by about 213 links today
(counted from edge-placed transfers, so a few doors that happen to sit on an edge are in that number).
Jeremy plans to re-author wide edges as "one big length" once the relative transfer exists, and every edge
he converts is a candidate for the slide.

### Why this is cheap

**The map still changes the normal way; only the fade is replaced.** A new `Scene_Map` is still built for
the destination, so every plugin's per-map setup runs exactly as it does now, untouched. Verified in source
on 2026-09-29:

- Nothing in the repo overrides `Scene_Map.fadeOutForTransfer`, `Scene_Map.fadeInForTransfer`,
  `Scene_Map.updateTransferPlayer`, `Bitmap.snap` or `SceneManager.snap`. The only transfer-adjacent alias
  is J-Popups-ABS on `Scene_Map.stop`.
- The per-map hooks that must keep working, and will, because the scene still rebuilds: `onMapLoaded`
  (J-TIME, J-ABS, J-Weather, J-Weather-Time, J-Lighting, J-Lighting-Time), `start` (J-Base, J-JAFTING,
  J-JAFTING-Refinement, J-SDP), `createSpriteset` (J-Message-Bubbles, J-Message-Chatter), `needsFadeIn`
  (J-Base-Save) and `terminate` (J-ABS-Juice).
- J-Lighting adds its mask inside `Spriteset_Map`, so lighting is part of the map layer. It slides with the
  map and is captured in a snapshot of it. Vanilla weather lives in the spriteset too.

The truly seamless alternative is expensive for exactly the reason this one is cheap. See "Not this" below.

## Work

1. **Trigger.** Proposal, not yet confirmed with Jeremy: a relative-transfer zone whose Transfer Player
   command uses **Fade: None** slides instead of cutting, so no new tag is needed. Doors, stairs and every
   other transfer keep their fades.
2. **Capture the old map, not the old screen.** At the moment of transfer, render the outgoing
   `Spriteset_Map` into a render texture, so the windows and HUD are not in the picture and stay fixed on
   screen during the slide. Render it at `Graphics.deviceScale`: vanilla `Bitmap.snap` (and so
   `snapForBackground`, which `Scene_Map.terminate` already calls) renders at resolution 1, which reads as
   visibly soft at Jeremy's 1.5x. The old spriteset is destroyed with its scene, so the render has to happen
   before `terminate`, and the texture has to outlive the old scene.
3. **Nothing is drawn while the next map loads, which helps.** `SceneManager.onSceneTerminate` sets the
   stage to null and only `onSceneStart`, after `start()`, sets the new scene, and `Graphics._canRender` is
   `!!stage`. So the canvas keeps showing the old map's last frame for the whole load, which is exactly what
   a Fade: None transfer already looks like. The snapshot only has to be on the new scene by `start()`, with
   the new spriteset built underneath it. **The capture must leave out the player and followers**, or the
   old player slides away in the snapshot a tile from the new one riding in.
4. **Slide.** When the new scene starts, offset the new spriteset one screen toward the side the player came
   from, and move both layers over a tunable number of frames: the snapshot out, the live map in. Freeze
   the world for the duration, the way Zelda does. Vanilla blocks walking during fades through
   `Scene_Map.isPlayerActive` (`isActive() && !isFading()`), and a slide has no fade, so it needs its own
   gate: `isPlayerActive` is the seam for walking, and `$jabsEngine.absPause` (read by `canMove`, AI
   `canUpdate` and `canUpdateInput`, set by nothing today) is a ready one for freezing JABS. Destroy the
   texture when the slide ends.
5. **Polish, each checked in-engine with Jeremy:**
   - followers arrive as a train behind the player rather than stacked on the player's tile, which is what
     `performTransfer`'s `synchronize` does and what a fade normally hides. Still live in CA: `optFollowers`
     is false, but 47 Change Player Followers ON commands turn them on;
   - J-Message-Chatter's and J-Message-Bubbles' planes sit on the scene outside the spriteset, anchored by
     `screenX()`, so they will not slide with the map and need hiding for the duration;
   - whether the map name window should open after a slide (Zelda shows none);
   - ~~the transfer autosave~~: moot in CA, where `optAutosave` is false and nothing overrides it;
   - SmoothCamera (third-party, `others/SmoothCamera.js`) is likely a non-issue: it only overrides
     `updateScroll`, and `locate` -> `center()` snaps the camera, so there is nothing to ease. Check it in
     engine anyway.
6. **Tests.** The slide's geometry (direction, offsets per frame, when it ends) lives in a small service and
   is unit-tested there. The scene wiring (snapshot sprite present from `create()`, gate held for the
   duration, texture released) goes through `test/setup/rmmz-view-harness.js`.

## Risks and unknowns

- **Cross-axis alignment.** Both maps clamp their camera at their edges, so for a vertical slide the player
  should line up naturally at the seam. If the two maps differ in width, their horizontal clamps can
  differ, and the player would jump sideways when the slide begins. It may need a small ease on the cross
  axis during the slide.
- **Music.** With no fade, a BGM change between the two maps cuts over abruptly. Adjacent maps sharing a
  track continue seamlessly, since `AudioManager.playBgm` leaves an identical track playing.
- **Landing walkability.** The relative transfer lands tile-for-tile, so both maps' openings need to line
  up. This is an authoring concern the relative transfer already carries, not something new here.

## Not this: truly seamless connections

Pokémon-style connections, where the neighbouring map is visible across the seam and there is no transition
at all, were sized in the same conversation and are deliberately out. The map would have to change without
a new scene, and everything in the ecosystem assumes a new map means a new `Scene_Map`: every hook listed
above would need an in-place "map swapped" path, JABS battlers, the pixel collision table and the minimap
all cache per map, a second tilemap would have to draw the neighbour (possibly on a different tileset), and
collision would have to work while the player's body straddles two maps. That is weeks of work, and a
permanent tax on every future plugin that hooks the map lifecycle.

## Sizing

Estimated 2026-09-29 at roughly an hour of building at this repo's measured throughput, padded because a
scene transition is a new code shape here. The real time is a few rounds of Jeremy watching it in-engine
and tuning the feel.

## Definition of done

- Crossing a converted edge between two real Chef Adventure overworld maps slides with no black frame, and
  the player lands at the matching offset.
- The HUD, minimap and windows stay still while the maps slide.
- Every per-map system (JABS, lighting, weather, time, minimap, chatter) comes up on the new map exactly as
  it does after a normal transfer.
- Doors and every other non-sliding transfer behave exactly as before.
- Coverage stays at 100%, `bun run hotfix` is green, and Jeremy likes how it feels.

## Notes

- 2026-09-29: item created at Jeremy's request, to "capture your optimism and thoughts/steps".
- 2026-10-03: the relative transfer landed on `feat/area-events` (a7af2283), and it keeps the transfer's fade
  type, so Fade: None can be read at slide time. CA has no `<relativeTransfer>` pages yet, so there is no
  edge to try a slide on until one pair is converted. Re-checked against source the same day, which
  corrected steps 3 and 4 and the polish list above.
- 2026-10-03: Jeremy floated stitching instead: a moving window of the map you stand on plus the maps
  touching it, loaded and joined into one ("Im not proposing we stitch together literally everything
  upfront and maintain it"). The window's size is fine (median 3 maps / 84 events); what stays expensive is
  maps joining and leaving while the world keeps running. Where he left it: an enemy chasing you follows you
  through the transfer, and that "with Zelda-style neighbors I think would be a sensible compromise".
- 2026-10-03: big maps as zones came back up. A 3x3 Tons of Grass in one map cost 18.7 ms/frame of logic
  against 5.0, mostly sprites and name plates updating off-screen; sleeping those fixed it (8.9 vs 3.8).