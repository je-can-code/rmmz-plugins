---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.3.0
  - Added the Apply Overlay and Remove Overlay plugin commands, showing any IconSet cell over any character in one of
    nine presets, named by database row or by index.
  - A held overlay survives anything that rebuilds the map's sprites, because what is stored is the request rather than
    the sprite.
### 1.2.1
  - Corrected which hook the juice manager reads when resolving a motion.
### 1.2.0
  - Caster and target body motion is now declared on J-Motion's composer rather than written onto the sprite directly,
    which makes J-Motion a hard dependency.
  - A battler's reaction composes with whatever ambient motion it already carries instead of cancelling it, and the four
    reactions register as ordinary motion types - squish, tilt, flip and charge - so an event page or a state can ask
    for them by name. Every skill notetag is unchanged.
  - The casting pulse is now renewed each frame with a short life rather than started once and cancelled, so a cast that
    ends by any route at all lapses on its own. It also holds its own source, so a battler struck while casting flinches
    in full instead of for a single frame, and it stops on death rather than shimmering through the corpse's collapse.
  - The weapon swing overlay is unchanged and still drives its sprite directly.
### 1.1.1
  - Simplified six guards that tested a value for null and undefined before asking whether it was finite, which
    Number.isFinite already answers for both. No behavioural change; the checks could never have decided anything.
### 1.1.0
  - Added <noJuice> and <juiceMotion:none> to suppress caster motion outright.
  - Added flip/flip-reverse caster-body full-rotation spin motions.
  - Added arc-oscillate weapon motion (alternating-direction arc sweeps).
  - Renamed <juiceSpinCount> to <juiceRepeatCount>, generalized to every motion.
  - Added <juiceDuration:N> to override the per-cycle swing frame count.
  - Support/utility skills (damage type None) no longer trigger a target hit-reaction squish that could cancel their own
    caster-side motion.
  - Removed the juiceConfigValidation module; config shape is now guaranteed by the jmz-data-editor tool instead of
    validated at runtime.
### 1.0.1
  - Fixed crash when the full menu (Scene_Menu) was opened while a juice motion was in flight.
  - JuiceMotionManager.#effects is a static array that outlives any single scene instance; when SceneManager tears down
    Scene_Map, all Sprite_Character objects in the old spriteset have their Pixi transform nulled, and the next
    frameTick call on the still-queued effects would throw "Cannot read properties of null (reading 'scale')".
  - Fix: Scene_Map.terminate() now calls JuiceMotionManager.clearAll() before sprites are destroyed, draining all
    pending effects and sprite locks proactively.
  - Secondary safeguard: all sprite-bound effect subclasses (JuiceSquishMotionEffect, JuiceTiltMotionEffect,
    JuiceCastingPulseMotionEffect, JuiceWeaponSwingMotionEffect) implement isSpriteAlive() checked in frameTick; effects
    targeting a sprite with a null transform are silently discarded rather than allowed to crash.
### 1.0.0
  - Initial release.