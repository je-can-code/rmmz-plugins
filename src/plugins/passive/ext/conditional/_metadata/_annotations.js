//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Gates and scales J-Passive grants via source rules (JABS map combat).
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-Passive
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Passive
 * @orderAfter J-Passive-Affix
 * @help
 * ============================================================================
 * OVERVIEW
 * Extends J-Passive so passive grants from a source can be gated and scaled.
 * Unconditional passives are simply grants with no rules.
 *
 * Three tag families live on the same rows as <passive:[...]>:
 *  passiveSourceRule  — gates every passive from this source
 *  passiveStateRule   — gates one state id from this source
 *  passiveStateCount  — stack contribution for one state id from this source
 *
 * Map battlers re-check on a throttled timer; any passive refresh re-evaluates.
 * ============================================================================
 * GATE TAGS
 *  <passiveSourceRule:[KIND, PARAM?]>
 *  <passiveStateRule:[STATE_ID, KIND, PARAM?]>
 *
 * Threshold kinds use *Above (>=) and *Below (<=):
 *  hp/mp/tp — current resource percent; mhp/mmp/mtp — flat max values
 *  {registryKey}Above/Below — flat or hundred-scale per ParameterRegistry
 *  allAllies{Key}Above/Below — every allied JABS battler (incl. self) must pass
 *
 * Discrete kinds include alliesNearby, enemiesNearby, hasState, negativeStateCount,
 * slotOnCooldown, slotOffCooldown, allOnCooldown, allOffCooldown,
 * sinceLastMoved/Hit/Attacked, movedWithin/hitWithin/attackedWithin (frames).
 *
 * EXAMPLES:
 *  <passive:[12]>
 *  <passiveStateRule:[12, hpBelow, 25]>
 *  <passiveSourceRule:[allOffCooldown]>
 * ============================================================================
 * STACK COUNT TAG
 *  <passiveStateCount:[STATE_ID, KIND, PARAM]>
 *
 * Kinds: negativeStateCount, alliesNearby (excludes self), lessIsMoreHp/Mp/Tp,
 * moreIsMoreHp/Mp/Tp, per-{registryKey} (integer points per stack).
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Added three new passive gate kinds: onHealHp, onHealMp, onHealTp.
 *    Each checks whether the battler received healing in that resource within
 *    a given number of frames: <passiveSourceRule:[onHealHp, 60]>.
 *    Wired via a new onHeal alias on Game_Battler that stamps
 *    _lastHpHealFrame / _lastMpHealFrame / _lastTpHealFrame when J-Base fires onHeal.
 * - 1.0.0
 *    Initial release (passive rule framework).
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
 * @desc Frames between passive rule re-checks per map battler.
 * @default 15
 *
 * @param default-proximity-tiles
 * @parent parentConfigPassiveConditional
 * @type number
 * @min 1
 * @max 99
 * @text Default Proximity (tiles)
 * @desc Tile radius for alliesNearby/enemiesNearby rules and stack counts.
 * @default 5
 */
//endregion annotations
