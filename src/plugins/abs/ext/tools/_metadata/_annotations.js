//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enable new tool-like tags for use with skills.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables new tags that give tool-like functionality to skills.
 *
 * Enables:
 * - NEW! added "gap close" aka "hookshot" functionality.
 *
 * TODO:
 * - gloves for carrying events.
 *
 * This plugin requires JABS.
 * ============================================================================
 * GAP CLOSING:
 * Have you ever wanted to be able to use a skill and gap close to a target
 * without having to take the painstaking effort of manually moving to the
 * given target? Well now you can! By applying the appropriate tags to various
 * database locations, you can enable/disable gap closing for your battlers!
 *
 * HEADS UP:
 * There are a number of tags required to make this work, so this will deviate
 * from normal tag explanations a bit.
 *
 * TAG USAGE:
 * (primarily)
 * - Events
 * - Skills
 * - Enemies
 *
 * (secondarily)
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <gapClose:key>
 * This tag is required on skills that you want to be "gap closing skills".
 * The key must match the key on the target for gap closing to occur.
 *
 *  <gapCloseTarget:key>
 * This tag is required on the things you want to be "gap closable", such as
 * enemies or on events representing enemies. This tag can also be applied to
 * things that a battler can be affected by, such as equipment or states.
 * The key must match the key on the skill for gap closing to occur.
 *
 * KEYS:
 * Keys are arbitrary strings (word characters only). They act as a namespace
 * so that different gap-close mechanics cannot accidentally cross-trigger.
 * For example, a hookshot skill with <gapClose:hookshot> will never warp the
 * player to an enemy bearing <gapCloseTarget:pierce>, and vice versa.
 *
 * EXAMPLE:
 *  <gapClose:hookshot> on skill ID 25.
 *  <gapCloseTarget:hookshot> on an event representing a grapple anchor.
 * Using skill 25 against that event will pull the player to it.
 *
 *  <gapClose:pierce> on skill ID 34 (spear pin).
 *  <gapCloseTarget:pierce> on state ID 4 (pinned state).
 * An enemy hit by skill 34 receives state 4.
 * Using skill 34 again against that pinned enemy will pull the player to it.
 * Hookshot anchors are unaffected because their key does not match.
 *
 * GAP CLOSE ANY:
 *  <gapCloseAny>
 * Put this on a skill instead of <gapClose:key> to skip key-matching
 * entirely. A skill with this tag gap closes to whatever single target its
 * hitbox connects with, no matter what (or whether) that target carries a
 * <gapCloseTarget:key> of its own. Intended for melee gap-closers that just
 * need to close distance to whatever they hit — no pre-tagging required.
 *
 * BLOCK GAP CLOSE:
 *  <blockGapClose>
 * Put this on an enemy, state, or equipment to make that battler immune to
 * ALL gap closing, including <gapCloseAny> skills. This is the only way to
 * opt a target out of an "any" gapcloser — useful for bosses, flying units,
 * or holding a hookshot-only chasm as a genuine traversal gate instead of
 * letting a combat gapcloser trivialize it.
 *
 * GAP CLOSE MODE:
 *  <gapCloseMode:MODE>
 * Put this on the gap-closing skill to control HOW the caster travels to
 * the resolved destination. MODE is one of: blink (instant teleport), jump
 * (arcing hop- the default when omitted), or travel (steps tile-by-tile,
 * respecting collision along the way). All modes bypass terrain by default
 * unless the skill also carries <respectTerrain>.
 *
 * GAP CLOSE POSITION:
 *  <gapClosePosition:POSITION>
 * Put this on the gap-closing skill to control WHERE relative to the target
 * the caster lands. POSITION is one of: infront (adjacent, facing the
 * target), behind (adjacent, on the target's far side), or same (directly
 * on the target's tile- the default when omitted).
 *
 * RESPECT TERRAIN:
 *  <respectTerrain>
 * Put this on the gap-closing skill to cancel the gap close entirely if the
 * caster cannot legally reach the computed destination tile (blocked by
 * impassible terrain). Without this tag, gap close bypasses terrain checks
 * the way all gap-close modes normally do.
 *
 * ON GAP CLOSE END:
 *  <thisOnGapCloseEnd:[SKILL_IDS...]>
 * Put this on the gap-closing skill itself to fire the listed skill ids
 * immediately once the caster arrives at the destination- useful for a
 * follow-up strike the instant a hookshot connects.
 *
 *  <onGapCloseEnd:[SKILL_IDS...]>
 * Put this on any of the caster's note sources (actor, class, weapon,
 * armor, state) to fire the listed skill ids on every gap close this
 * battler performs, regardless of which skill triggered it. IDs from both
 * this tag and <thisOnGapCloseEnd> are merged and de-duplicated before
 * firing.
 *
 * ============================================================================
 * PULL FORWARD:
 * The inverse of gap close: instead of the caster traveling to the target,
 * the target is pulled toward the caster. Unlike gap close, this is NOT
 * key-gated- it behaves like knockback in reverse, and any target without
 * enough <knockbackResist> to fully negate it gets pulled.
 *
 * If a skill carries both a pull-forward tag and a gap-close tag, the
 * target is pulled first, then the caster gap-closes to wherever the
 * target ends up- the two meet partway instead of gap-close eating the
 * entire distance.
 *
 * TAG USAGE:
 * - Skills
 *
 * TAG FORMAT:
 *  <pullForward:MAGNITUDE>
 * Where MAGNITUDE is the number of tiles to pull the target toward the
 * caster.
 *
 * TAG EXAMPLES:
 *  <pullForward:3>
 * On hit, this skill pulls the target 3 tiles toward the caster (before any
 * knockbackResist reduction).
 * ============================================================================
 * GRAB AND THROW:
 * A separate, plugin-parameter-only feature (no notetags of its own) for
 * globally toggling grab-and-throw behavior and whether throw direction is
 * always fixed. See the plugin parameters below.
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Gap close tags now require a key: <gapClose:key> / <gapCloseTarget:key>.
 *    Keys must match for gap closing to occur — no cross-mechanic bypass.
 *    Removed canGapCloseByDefault plugin parameter.
 *    Added <gapCloseAny> to skip key-matching and close on whatever the
 *    skill's hitbox connects with.
 *    Added <blockGapClose> to make a target immune to all gap closing,
 *    including <gapCloseAny> skills.
 *    Added <gapCloseMode:MODE> (blink/jump/travel) to control how the
 *    caster travels to the destination.
 *    Added <gapClosePosition:POSITION> (infront/behind/same) to control
 *    where relative to the target the caster lands.
 *    Added <respectTerrain> to cancel a gap close blocked by terrain,
 *    instead of the default terrain-bypassing behavior.
 *    Added <onGapCloseEnd>/<thisOnGapCloseEnd> to fire follow-up skills
 *    the instant a gap close arrives at its destination.
 *    Added <pullForward:MAGNITUDE>, a non-key-gated reverse-knockback tag
 *    that pulls the target toward the caster; combines with gap close by
 *    pulling first, then closing whatever distance remains.
 * - 1.0.3
 *    Raised minimum J-ABS version requirement to 4.7.0.
 * - 1.0.2
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.0.1
 *    Consumed `RPGManager` update.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 * @param grabThrowConfigs
 * @text GRAB AND THROW DEFAULTS
 *
 * @param grabThrowEnabled
 * @parent grabThrowConfigs
 * @type boolean
 * @text Grab and Throw Enabled
 * @desc True if grab and throw functionality is enabled globally by default.
 * @default true
 *
 * @param directionFixAlways
 * @parent grabThrowConfigs
 * @type boolean
 * @text Always Fix Throw Direction
 * @desc True if the throw direction is always fixed regardless of input.
 * @default false
 *
 */