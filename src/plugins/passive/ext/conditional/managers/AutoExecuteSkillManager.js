//region AutoExecuteSkillManager
import AutoRuleManager from './AutoRuleManager.js';
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';

/**
 * Schedules map skill executions from {@link RPG_BaseItem#autoExecuteSkillRules} tuples.
 *
 * Uses {@link JABS_Engine#forceMapAction} as the terminal dispatch — skills fired here are real
 * map actions with hitboxes, elements, and effects, and are subject to JABS parry and retaliation.
 */
class AutoExecuteSkillManager extends AutoRuleManager
{
  /**
   * The name of the source property that holds auto-execute-skill rule tuples.
   * @returns {string} - The property name holding rule tuples on source objects.
   */
  static get rulesProperty() { return 'autoExecuteSkillRules'; }

  /**
   * Tracks the current nesting depth of in-flight forced skill executions.
   *
   * Used to prevent synchronous re-entry when a forced skill triggers another auto-execute rule.
   * @type {number}
   */
  static #executionDepth = 0;

  /**
   * Forces one map skill through JABS without applying cost or cooldown to the payload skill row.
   *
   * Depth-guarded to prevent infinite re-entry — if a forced skill triggers another auto-execute
   * rule during its own execution, the nested dispatch is silently skipped.
   * @param {Game_Actor|Game_Enemy} battler - The battler firing the skill.
   * @param {number} skillId - The database id of the skill to execute.
   * @param {any[]} _tuple - The full authored tuple; unused here, this rule's whole payload is the id.
   * @returns {boolean} - True when forceMapAction was successfully invoked.
   */
  static dispatch(battler, skillId, _tuple)
  {
    // read the configured maximum nesting depth from plugin metadata.
    const maxDepth = J.PASSIVE.EXT.CONDITIONAL.Metadata.autoExecuteSkillMaxDepth || 1;

    // the execution stack is already at maximum depth — skip to avoid infinite re-entry.
    if (AutoExecuteSkillManager.#executionDepth >= maxDepth) return false;

    // resolve the JABS battler wrapper — skills cannot be forced without a map presence.
    const jabsBattler = PassiveRuleJabsAccess.getJabsBattler(battler);

    // no JABS battler means the battler is off-map and cannot fire skills.
    if (!jabsBattler) return false;

    // skip invalid or out-of-range skill ids.
    if (Number.isNaN(skillId) || skillId <= 0) return false;

    // verify the skill exists in the database before attempting to execute it.
    if (!battler.skill(skillId)) return false;

    // increment the depth counter before entering the forced action dispatch.
    AutoExecuteSkillManager.#executionDepth += 1;

    try
    {
      // preview the action to check whether JABS will permit the execution.
      const preview = jabsBattler.createJabsActionFromSkill(skillId);

      // if JABS refuses the action, abort without dispatching.
      if (!$jabsEngine.canExecuteMapActions(jabsBattler, preview)) return false;

      // force the skill onto the map without consuming the battler's own cooldown or resources.
      $jabsEngine.forceMapAction(jabsBattler, skillId, false);

      return true;
    }
    finally
    {
      // always decrement the depth counter when leaving the forced action scope.
      AutoExecuteSkillManager.#executionDepth -= 1;
    }
  }
}

export default AutoExecuteSkillManager;
//endregion AutoExecuteSkillManager
