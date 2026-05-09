//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 ABS-JUICE] Procedural map battler motion juice for JABS (squish, tilt, casting pulse, weapon swing).
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
 * SKILL TAGS (notes):
 * <jabsJuiceIcon:N>
 *   Forces weapon swing overlay icon index N on the IconSet sheet (-1 behavior
 *   falls back to inferred equip icon for actors: dual-wield offhand uses weapon slot 2; offhand + one weapon
 *   resolves orb/shield armor by matching skill ids on armor rows or equip slot 1 when it is armor (body armor is
 *   not blindly armors()[0]), unless the lone weapon or a state claims the strike via offhandSkillId tags).
 *
 * <juiceMotion:arc> | arc-reverse | bash | present | recoil | spin | spin-reverse | stab-forward
 *   Weapon overlay preset. Legacy swing-top-down / swing-bottom-up map to arc / arc-reverse.
 *   Legacy spin keys: spin-360 → spin; spin-720 → spin (see juiceSpinCount); spin-360-reverse → spin-reverse.
 *   present lifts the icon upward on screen (screen-stable “brandish” read; placement uses facing-up card).
 *   On healing skills, omitting juiceMotion keeps caster-only support squish; any juiceMotion tag opts into full strike juice.
 *
 * <juiceSpan:N>
 *   Arc span in degrees for arc / arc-reverse (default 120; typical range 30–300).
 *
 * <juiceSpinCount:N>
 *   Full rotations for spin / spin-reverse (default 1; clamped 1–8). Legacy juiceMotion:spin-720 implies 2 when omitted.
 *
 * <juiceStabTipDegrees:N>
 *   Degrees from Pixi +x to bore/tip at rotation 0. Stab defaults to sword diagonal;
 *   bash / recoil default to barrel toward −x unless you override.
 *
 * <juiceProfileGun>
 *   Side-profile firearm icon: mirror east/west instead of ~180° rotation (keeps the grip
 *   from reading upside-down when the art points left). Up/down still use ±90° rotation —
 *   pure side-view art cannot read as true top-down aim; use a separate sprite or tune degrees.
 *
 * <jabsJuiceWeaponStyle:key>
 *   Selects a multiplier row from the Weapon style multipliers JSON parameter.
 *   Keys are arbitrary identifiers (letters, numbers, underscore).
 *   When omitted, inferred keys match the swing icon row: weapon rows use string weapon type ids; armor rows use
 *   a + armor type id (example type 4 → "a4") so armor buckets never collide with weapon type ids.
 *
 * ----------------------------------------------------------------------------
 * PARAMETERS
 * Master switch id 0 keeps juice always enabled. Tune intensities down first
 * when testing with heavy screen FX plugins.
 *
 * Weapon style multipliers expects JSON shaped like:
 * {"default":{"tiltMul":1,"swingMul":1},"1":{"tiltMul":1.1,"swingMul":0.9},"a2":{"tiltMul":1,"swingMul":1.05}}
 * Inferred weapon rows use string weapon type ids; inferred armor rows use a + atypeId (see jabsJuiceWeaponStyle).
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Master Switch ID
 * @desc When non-zero, juice runs only while this switch is ON. Use 0 to ignore switches.
 * @default 0
 *
 *
 * @param parentTarget
 * @text TARGET REACTIONS
 *
 * @param target-physical-squish-intensity
 * @parent parentTarget
 * @type number
 * @decimals 3
 * @min 0
 * @max 1
 * @text Physical Hit Squish
 * @desc Scale pulse intensity when physical actions connect (dimensionless).
 * @default 0.120
 *
 * @param target-magical-squish-intensity
 * @parent parentTarget
 * @type number
 * @decimals 3
 * @min 0
 * @max 1
 * @text Magical Hit Squish
 * @desc Scale pulse intensity when magical actions connect (dimensionless).
 * @default 0.080
 *
 * @param target-squish-frames
 * @parent parentTarget
 * @type number
 * @min 1
 * @max 120
 * @text Target Squish Frames
 * @desc Duration of the target squish easing window.
 * @default 10
 *
 * @param healing-recipient-squish-scale
 * @parent parentTarget
 * @type number
 * @decimals 3
 * @min 0
 * @max 2
 * @text Healing Recipient Scale
 * @desc Multiplier applied to squish intensity when the action heals the target.
 * @default 0.650
 *
 * @param flurry-decay-percent
 * @parent parentTarget
 * @type number
 * @min 1
 * @max 100
 * @text Flurry Decay Percent
 * @desc Per-repeat damping percent for the same action UUID vs target within a 2-frame window.
 * @default 72
 *
 *
 * @param parentCaster
 * @text CASTER MOTION
 *
 * @param dodge-squish-intensity
 * @parent parentCaster
 * @type number
 * @decimals 3
 * @min 0
 * @max 1
 * @text Dodge Squish Intensity
 * @desc Body squash intensity when the dodge cooldown executes.
 * @default 0.280
 *
 * @param dodge-squish-frames
 * @parent parentCaster
 * @type number
 * @min 1
 * @max 120
 * @text Dodge Squish Frames
 * @desc Frames spent easing dodge squash. Dodge movement is very short; a few extra frames keep the read without changing i-frames.
 * @default 12
 *
 * @param support-caster-pulse-intensity
 * @parent parentCaster
 * @type number
 * @decimals 3
 * @min 0
 * @max 1
 * @text Support Pulse Intensity
 * @desc Gentle squish on heal/support actions before projectiles spawn.
 * @default 0.060
 *
 * @param support-caster-pulse-frames
 * @parent parentCaster
 * @type number
 * @min 1
 * @max 120
 * @text Support Pulse Frames
 * @desc Frames spent easing support pulses.
 * @default 12
 *
 * @param caster-strike-tilt-radians
 * @parent parentCaster
 * @type number
 * @decimals 3
 * @min 0
 * @max 1.5707963267948966
 * @text Strike Tilt (rad)
 * @desc Peak body tilt for offensive actions before style multipliers apply.
 * @default 0.180
 *
 * @param caster-strike-tilt-frames
 * @parent parentCaster
 * @type number
 * @min 1
 * @max 120
 * @text Strike Tilt Frames
 * @desc Frames spent easing tilt recovery.
 * @default 6
 *
 * @param weapon-swing-peak-radians
 * @parent parentCaster
 * @type number
 * @decimals 3
 * @min 0
 * @max 3.141592653589793
 * @text Weapon Swing Peak (rad)
 * @desc Peak overlay rotation for IconSet swing arcs before style multipliers apply.
 * @default 0.650
 *
 * @param weapon-swing-frames
 * @parent parentCaster
 * @type number
 * @min 1
 * @max 120
 * @text Weapon Swing Frames
 * @desc Frames the IconSet overlay spends swinging.
 * @default 10
 *
 * @param sprite-juice-vertical-offset-pixels
 * @parent parentCaster
 * @type number
 * @min -96
 * @max 96
 * @text Sprite juice vertical offset (px)
 * @desc Positive shifts IconSet swing overlays down (screen Y). Tall-head chibi sprites often need ~8–14.
 * @default 10
 *
 * @param unarmed-strike-squish-intensity
 * @parent parentCaster
 * @type number
 * @decimals 3
 * @min 0
 * @max 1
 * @text Unarmed Strike Squish
 * @desc Squish intensity when no IconSet swing plays (icon unresolved).
 * @default 0.140
 *
 * @param unarmed-strike-squish-frames
 * @parent parentCaster
 * @type number
 * @min 1
 * @max 120
 * @text Unarmed Squish Frames
 * @desc Frames spent easing unarmed strike pulses.
 * @default 9
 *
 *
 * @param parentCasting
 * @text CASTING LAYER
 *
 * @param casting-pulse-amplitude
 * @parent parentCasting
 * @type number
 * @decimals 3
 * @min 0
 * @max 0.25
 * @text Casting Pulse Amplitude
 * @desc Continuous shimmer amplitude while {@link JABS_Battler.isCasting} stays true.
 * @default 0.045
 *
 *
 * @param parentStyles
 * @text WEAPON STYLE MULTIPLIERS
 *
 * @param weapon-style-multipliers
 * @parent parentStyles
 * @type string
 * @text Style Table (JSON)
 * @desc Keyed tilt/swing multipliers. Must include a default row; weapon types map by numeric string id.
 * @default {"default":{"tiltMul":1,"swingMul":1}}
 */
//endregion annotations