//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Applies passive states while runtime conditions hold (JABS map combat).
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-Passive
 * @base J-Passive-Affix
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Passive
 * @orderAfter J-Passive-Affix
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is a J-Passive extension for JABS map combat.
 *
 * It evaluates tag-driven rules on battler passive sources and temporarily
 * treats additional states as passives while conditions are true.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Rules live on the same database objects that already feed J-Passive
 * (skills, states, actors, enemies, etc.). When a rule's condition passes,
 * the listed state id is merged into the battler's passive state tracker.
 *
 * Map battlers re-check on a throttled timer; any refresh of passive states
 * (equip change, skill learn, etc.) also re-evaluates conditions immediately.
 *
 * ============================================================================
 * CONDITIONAL PASSIVE TAGS:
 * Have you ever wanted "apply state 12 while HP is below 25%" without hand-
 * rolling common events? Well now you can! By applying the tag below to any
 * passive source note, you too can gate passive states on runtime context.
 *
 * TAG USAGE:
 * - Skills (mastery wrapper skills are the primary authoring surface)
 * - States, actors, enemies, classes, equipment — any J-Passive source
 *
 * TAG FORMAT:
 *  <conditionalPassive:[STATE_ID, CONDITION, PARAM?]>
 * Where STATE_ID is the passive state to apply while the condition holds.
 * Where CONDITION is the evaluator key (see supported list below).
 * Where PARAM is required for threshold-style conditions (percent 1–100, etc.).
 *
 * TAG EXAMPLES:
 *  <conditionalPassive:[42, hpBelow, 25]>
 * While HP is strictly below 25%, state 42 is treated as a passive state.
 *
 *  <conditionalPassive:[43, hpAbove, 50]>
 * While HP is strictly above 50%, state 43 is treated as a passive state.
 *
 * SUPPORTED CONDITIONS (v1 scaffold):
 *  hpBelow — PARAM = HP percent threshold (exclusive)
 *  hpAbove — PARAM = HP percent threshold (exclusive)
 *
 * Multiple tags may point at the same state id; each tag is evaluated on its own.
 * ============================================================================
 * PLUGIN PARAMETERS:
 *  - Reconcile Delay (frames):
 *      How often map battlers re-check conditional passives while ABS is active.
 *      Defaults to 15 (~4 times per second at 60 fps).
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release (scaffold + HP threshold conditions).
 * ============================================================================
 *
 * @param parentConfigPassiveConditional
 * @text PASSIVE CONDITIONAL
 *
 * @param reconcile-delay-frames
 * @parent parentConfigPassiveConditional
 * @type number
 * @min 1
 * @max 600
 * @text Reconcile Delay (frames)
 * @desc Frames between conditional passive re-checks per map battler.
 * @default 15
 */
//endregion annotations