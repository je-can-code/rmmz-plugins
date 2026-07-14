//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Procedural map battler motion juice for JABS (squish, tilt, casting pulse, weapon swing).
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-InputManager
 * @orderAfter J-ABS-Poses
 * @orderAfter J-ABS-Hitstop
 * @help
 * ============================================================================
 * OVERVIEW
 * J-ABS-Juice layers lightweight procedural motion on map battlers: target hit
 * reactions, caster strike/dodge/heal pulses, casting shimmer, and optional
 * IconSet weapon swing overlays driven by skills or equipped weapons.
 *
 * Load order:
 * Place after J-ABS-InputManager (dodge key binding), J-ABS-Poses (attack poses),
 * and J-ABS-Hitstop (impact timing). Juice wraps engine hooks that chain after
 * those extensions so gameplay semantics stay unchanged.
 *
 * Coexistence with J-ABS-Poses:
 * Poses swap character sheets / patterns for readable attacks. Juice adjusts
 * Pixi scale and rotation on the live Sprite_Character (plus a short IconSet
 * overlay child for swings). Keep juice intensities modest so pose readability
 * stays primary; if a pose plugin ever writes scale each frame, raise juice
 * timings only after verifying the interaction in-game.
 *
 * ============================================================================
 * REQUIRED EXTERNAL CONFIGURATION
 * J-ABS-Juice has NO plugin parameters. All tuning lives in the external JABS
 * configuration file at `data/config.jabs.json`, under a top-level `juice`
 * block. The plugin THROWS at startup when the block (or any required leaf) is
 * missing or malformed — this is intentional. Disabling juice is "remove the
 * plugin from your manifest", not "leave the config block out".
 *
 * Why? Plugin parameters cannot express structured data without becoming
 * fragile JSON-in-a-string blobs, and "juice off when a switch is on" was
 * never a real requirement: developers who do not want juice should just not
 * load the plugin.
 *
 * Required shape (all leaves required; missing keys are loud errors):
 *
 *   {
 *     "teams": [ ... ],
 *     "juice": {
 *       "target": {
 *         "physicalSquishIntensity": 0.12,
 *         "magicalSquishIntensity":  0.08,
 *         "squishFrames":            10,
 *         "healingRecipientScale":   0.65,
 *         "flurryDecayPercent":      72
 *       },
 *       "caster": {
 *         "dodgeSquishIntensity":          0.28,
 *         "dodgeSquishFrames":             12,
 *         "supportPulseIntensity":         0.06,
 *         "supportPulseFrames":            12,
 *         "strikeTiltRadians":             0.18,
 *         "strikeTiltFrames":              6,
 *         "weaponSwingPeakRadians":        0.65,
 *         "weaponSwingFrames":             10,
 *         "spriteVerticalOffsetPixels":    10,
 *         "unarmedStrikeSquishIntensity":  0.14,
 *         "unarmedStrikeSquishFrames":     9
 *       },
 *       "casting": {
 *         "pulseAmplitude": 0.045
 *       },
 *       "profiles": {
 *         "default": { "tiltMul": 1, "swingMul": 1 }
 *       }
 *     }
 *   }
 *
 * Field reference (all values dimensionless unless noted):
 * target.physicalSquishIntensity — scale pulse on physical hits.
 * target.magicalSquishIntensity  — scale pulse on magical hits.
 * target.squishFrames            — frames spent easing the target pulse.
 * target.healingRecipientScale   — multiplier applied when the action heals.
 * target.flurryDecayPercent      — per-repeat damping (1–100) for the same
 *                                  action UUID vs target within a 2-frame window.
 * caster.dodgeSquishIntensity    — caster squish on the dodge cooldown.
 * caster.dodgeSquishFrames       — frames easing the dodge squish.
 * caster.supportPulseIntensity   — caster squish on heal / support actions.
 * caster.supportPulseFrames      — frames easing support pulses.
 * caster.strikeTiltRadians       — peak body tilt for offensive actions (radians).
 * caster.strikeTiltFrames        — frames easing tilt recovery.
 * caster.weaponSwingPeakRadians  — peak overlay rotation for IconSet swings (radians).
 * caster.weaponSwingFrames       — frames the IconSet overlay spends swinging.
 * caster.spriteVerticalOffsetPixels — positive shifts the IconSet overlay down
 *                                     on screen (tall-head chibi sprites often need 8–14).
 * caster.unarmedStrikeSquishIntensity — squish intensity when no IconSet
 *                                       swing plays (icon unresolved).
 * caster.unarmedStrikeSquishFrames    — frames easing unarmed pulses.
 * casting.pulseAmplitude         — continuous shimmer amplitude while
 *                                  {@link JABS_Battler.isCasting} stays true.
 * profiles                       — keyed tilt/swing multiplier rows. Keys
 *                                  match `[A-Za-z0-9_-]+`. Each row needs both
 *                                  `tiltMul` and `swingMul`. A `default` row
 *                                  is mandatory (fallback when a skill's
 *                                  resolved style key has no matching row).
 *
 * Inferred profile keys (when a skill has no `<jabsJuiceWeaponStyle:...>` tag):
 *   - weapons: string weapon type id (example wtypeId 1 → "1").
 *   - armor:   "a" + armor type id  (example atypeId 4 → "a4").
 *
 * ============================================================================
 * SKILL TAGS (notes):
 * <jabsJuiceIcon:N>
 *   Forces weapon swing overlay icon index N on the IconSet sheet. When absent,
 *   the icon is inferred from the actor's equipped gear: dual-wield offhand uses
 *   weapon slot 2; a single offhand resolves the orb/shield armor icon by matching
 *   skill ids on armor rows or the equip slot when it is armor.
 *
 * <noJuice>
 *   Suppresses all juice motion on the caster when this skill executes.
 *   Equivalent to <juiceMotion:none>.
 *
 * <juiceMotion:NAME>
 *   Selects a preset weapon/caster motion. Valid values:
 *   Weapon overlay:  arc | arc-reverse | arc-oscillate | bash | present | recoil | spin |
 *                    spin-reverse | stab-forward
 *   Caster-body:     squish | pulse | flip | flip-reverse
 *   Suppress:        none  (equivalent to <noJuice>)
 *   Legacy keys: swing-top-down → arc; swing-bottom-up → arc-reverse; spin-360 → spin;
 *   spin-720 → spin; spin-360-reverse → spin-reverse.
 *   present lifts the icon upward on screen (screen-stable "brandish"; uses facing-up card).
 *   arc-oscillate sweeps the arc back and forth, alternating direction on each sweep (see
 *   juiceRepeatCount below for sweep count).
 *   On healing skills, omitting juiceMotion keeps caster-only support squish; any juiceMotion
 *   tag opts into full strike juice.
 *
 * <juiceSpan:N>
 *   Arc span in degrees for arc / arc-reverse / arc-oscillate (default 120; typical range 30–300).
 *
 * <juiceRepeatCount:N>
 *   Number of times to repeat the motion within the juice duration (default 1).
 *   For spin / spin-reverse: full rotations.
 *   For arc-oscillate: number of arc sweeps, alternating direction.
 *   For all other motions: full replays within the duration window.
 *
 * <juiceDuration:N>
 *   Overrides the swing animation duration in frames. When omitted, the global
 *   `weaponSwingFrames * 2` value from config.jabs.json is used.
 *
 * <juiceStabTipDegrees:N>
 *   Degrees from Pixi +x to bore/tip at rotation 0. Stab defaults to sword diagonal;
 *   bash / recoil default to barrel toward −x unless overridden. Accepts negative values.
 *
 * <juiceProfileGun>
 *   Side-profile firearm icon: mirror east/west instead of ~180° rotation (keeps the grip
 *   from reading upside-down when the art points left). Up/down still use ±90° rotation —
 *   pure side-view art cannot read as true top-down aim; use a separate sprite or tune degrees.
 *
 * <jabsJuiceWeaponStyle:key>
 *   Selects a multiplier row from the `profiles` map in `config.jabs.json` → `juice`.
 *   Keys are arbitrary identifiers (letters, digits, underscore, dash) and must already
 *   exist in the `profiles` map.
 *   When omitted, inferred keys match the swing icon row: weapon rows use the string weapon
 *   type id (e.g. wtypeId 1 → "1"); armor rows use "a" + armor type id (e.g. atypeId 4 → "a4")
 *   so armor buckets never collide with weapon type ids.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.1
 *    Fixed crash when the full menu (Scene_Menu) was opened while a juice motion was in flight.
 *    JuiceMotionManager.#effects is a static array that outlives any single scene instance;
 *    when SceneManager tears down Scene_Map, all Sprite_Character objects in the old spriteset
 *    have their Pixi transform nulled, and the next frameTick call on the still-queued effects
 *    would throw "Cannot read properties of null (reading 'scale')".
 *    Fix: Scene_Map.terminate() now calls JuiceMotionManager.clearAll() before sprites are
 *    destroyed, draining all pending effects and sprite locks proactively.
 *    Secondary safeguard: all sprite-bound effect subclasses (JuiceSquishMotionEffect,
 *    JuiceTiltMotionEffect, JuiceCastingPulseMotionEffect, JuiceWeaponSwingMotionEffect)
 *    implement isSpriteAlive() checked in frameTick; effects targeting a sprite with a null
 *    transform are silently discarded rather than allowed to crash.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */
//endregion annotations