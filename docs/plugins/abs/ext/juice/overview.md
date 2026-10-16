---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-juice, overview]
version: "1.3.0"
---

# Overview

`J-ABS-Juice` layers lightweight procedural motion on map battlers: target hit reactions, caster strike/dodge/heal
pulses, casting shimmer, and optional IconSet weapon swing overlays driven by skills or equipped weapons.

## Load order

Place after `J-Motion` (which owns character motion), and after `J-ABS-InputManager` (dodge key binding),
`J-ABS-Poses` (attack poses), and `J-ABS-Hitstop` (impact timing). Juice wraps engine hooks that chain after those
extensions so gameplay semantics stay unchanged.

## Relationship to J-Motion

Juice decides WHEN a battler reacts and HOW HARD; `J-Motion` decides what the sprite looks like. Everything a battler
does with its own body is declared on `J-Motion`'s composer under the `combat:reaction` source, so a reaction composes
with whatever ambient motion that battler already has rather than fighting it. The four reactions register as ordinary
motion types — `squish`, `tilt`, `flip` and `charge` — which means an event page or a state can ask for them by name
too. The weapon swing overlay is the exception: it is a sprite this plugin creates and owns, so it is driven directly
rather than composed.

## Coexistence with J-ABS-Poses

Poses swap character sheets / patterns for readable attacks, which is a different layer entirely from the transform
`J-Motion` composes. Keep juice intensities modest so pose readability stays primary.

## Overlays outside combat

The overlay presets are available to events through the [Apply Overlay](commands/apply-overlay.md) plugin command,
which shows any IconSet cell over any character in any of the nine presets. Naming an item, weapon, armor or skill
reads that row's icon, which keeps a cutscene pointing at the right picture after the database is edited; a raw cell
index is there for icons that belong to no row.

Set Hold to true and the icon reaches its pose and stays there until [Remove Overlay](commands/remove-overlay.md)
withdraws it, which is what "the hero raises the amulet" looks like when the scene is not ready to move on yet. The
`present` preset lifts the icon straight up over the character's head and is facing-agnostic.

A held overlay survives everything that rebuilds the map's sprites — opening and closing the menu, a map transfer, a
scene change — because what is stored is the request rather than the sprite, and sprites collect their overlays as
they are built. It follows the character, so a held icon on the player stays with them across maps.

It does NOT survive loading a save file, which matches how `J-Motion`'s own motions behave; nothing about the
character's decoration is written to the savefile by either plugin. A cutscene that holds something up should take it
down before it ends.

Overlays are keyed by a source, exactly as `J-Motion`'s motions are. Two different sources can hold two icons on one
character, and withdrawing one leaves the other alone. Leave the source alone unless you need that.

For the motions a character makes with its own BODY — squish, tilt, flip and charge — use `J-Motion`'s Apply Motion
command instead. Those are registered motion types and are already addressable by name from any event page.

## Required external configuration

`J-ABS-Juice` has NO plugin parameters. All tuning lives in the
[external JABS configuration file](../../core/notetags/enemy-events/teams.md) at `data/config.jabs.json`, under a
top-level `juice` block. The plugin THROWS at startup when the block (or any required leaf) is missing or malformed —
this is intentional. Disabling juice is "remove the plugin from your manifest", not "leave the config block out".

### Why?

Plugin parameters cannot express structured data without becoming fragile JSON-in-a-string blobs, and "juice off when
a switch is on" was never a real requirement: developers who do not want juice should just not load the plugin.

### Required shape

All leaves required; missing keys are loud errors.

```json
{
  "teams": [ ... ],
  "juice": {
    "target": {
      "physicalSquishIntensity": 0.12,
      "magicalSquishIntensity":  0.08,
      "squishFrames":            10,
      "healingRecipientScale":   0.65,
      "flurryDecayPercent":      72
    },
    "caster": {
      "dodgeSquishIntensity":          0.28,
      "dodgeSquishFrames":             12,
      "supportPulseIntensity":         0.06,
      "supportPulseFrames":            12,
      "strikeTiltRadians":             0.18,
      "strikeTiltFrames":              6,
      "weaponSwingPeakRadians":        0.65,
      "weaponSwingFrames":             10,
      "spriteVerticalOffsetPixels":    10,
      "unarmedStrikeSquishIntensity":  0.14,
      "unarmedStrikeSquishFrames":     9
    },
    "casting": {
      "pulseAmplitude": 0.045
    },
    "profiles": {
      "default": { "tiltMul": 1, "swingMul": 1 }
    }
  }
}
```

### Field reference

All values are dimensionless unless noted.

- `target.physicalSquishIntensity` — scale pulse on physical hits.
- `target.magicalSquishIntensity` — scale pulse on magical hits.
- `target.squishFrames` — frames spent easing the target pulse.
- `target.healingRecipientScale` — multiplier applied when the action heals.
- `target.flurryDecayPercent` — per-repeat damping (1–100) for the same action UUID vs target within a 2-frame
  window.
- `caster.dodgeSquishIntensity` — caster squish on the dodge cooldown.
- `caster.dodgeSquishFrames` — frames easing the dodge squish.
- `caster.supportPulseIntensity` — caster squish on heal / support actions.
- `caster.supportPulseFrames` — frames easing support pulses.
- `caster.strikeTiltRadians` — peak body tilt for offensive actions (radians).
- `caster.strikeTiltFrames` — frames easing tilt recovery.
- `caster.weaponSwingPeakRadians` — peak overlay rotation for IconSet swings (radians).
- `caster.weaponSwingFrames` — frames the IconSet overlay spends swinging.
- `caster.spriteVerticalOffsetPixels` — positive shifts the IconSet overlay down on screen (tall-head chibi sprites
  often need 8–14).
- `caster.unarmedStrikeSquishIntensity` — squish intensity when no IconSet swing plays (icon unresolved).
- `caster.unarmedStrikeSquishFrames` — frames easing unarmed pulses.
- `casting.pulseAmplitude` — continuous shimmer amplitude while `JABS_Battler.isCasting` stays true.
- `profiles` — keyed tilt/swing multiplier rows. Keys match `[A-Za-z0-9_-]+`. Each row needs both `tiltMul` and
  `swingMul`. A `default` row is mandatory (fallback when a skill's resolved style key has no matching row).

### Inferred profile keys

When a skill has no [`<jabsJuiceWeaponStyle:...>`](notetags/juice-weapon-style.md) tag:

- weapons: string weapon type id (example `wtypeId` 1 → `"1"`).
- armor: `"a"` + armor type id (example `atypeId` 4 → `"a4"`).