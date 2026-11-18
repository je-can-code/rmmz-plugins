//region AutoExecuteSkillManager
import AutoRuleManager from './AutoRuleManager.js';
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';

/**
 * Schedules map skill executions from {@link RPG_BaseItem#autoExecuteSkillRules} tuples.
 *
 * A payload with no cast time fires at once through {@link JABS_Engine#forceMapAction}. A payload with a
 * `<castTime>` winds up first, in its bearer's own cast slot, so the map paints its telegraph and counts its
 * windup down exactly as it would for any other cast, and it fires the moment that windup ends. Either way the
 * skills fired here are real map actions with hitboxes, elements, and effects, subject to JABS parry and
 * retaliation, and either way they cost nothing and start no cooldown.
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
   * The windups this manager started, each keyed by the bearer winding it up and holding the very actions it
   * decided, so landing one can tell its own cast from anything the bearer decided for itself since. Held
   * weakly: a bearer taken off the map takes its windup with it, and only a bearer still being updated lands one.
   * @type {WeakMap<JABS_Battler, JABS_Action[]>}
   */
  static #windups = new WeakMap();

  /**
   * Forces one map skill through JABS without applying cost or cooldown to the payload skill row, or starts
   * its windup when the payload has a cast time.
   *
   * Depth-guarded to prevent infinite re-entry — if a forced skill triggers another auto-execute
   * rule during its own execution, the nested dispatch is silently skipped.
   * @param {Game_Actor|Game_Enemy} battler - The battler firing the skill.
   * @param {number} skillId - The database id of the skill to execute.
   * @param {any[]} _tuple - The full authored tuple; unused here, this rule's whole payload is the id.
   * @returns {boolean} - True when the skill fired at once or began its windup.
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

      // a payload with a cast time winds up before it fires, the way any cast does, so it can be seen coming.
      const [ primaryAction ] = preview;
      if (primaryAction.getCastTime() > 0) return AutoExecuteSkillManager.#beginWindup(jabsBattler, preview);

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

  /**
   * Starts a payload's windup in its bearer's own cast slot: decided, with its countdown running. That is all
   * the map reads to paint a cast's telegraph, and all the bearer needs to count the windup down.<br/>
   * A bearer already deciding or casting something keeps it, and the windup is refused. A refused dispatch
   * stamps no cooldown, so a timed or proximity rule tries again on the next frame.
   * @param {JABS_Battler} jabsBattler The bearer to wind the payload up.
   * @param {JABS_Action[]} actions The payload's actions, built the way the instant path builds them.
   * @returns {boolean}
   */
  static #beginWindup(jabsBattler, actions)
  {
    // a bearer about to act on a decision of its own is never made to drop it.
    if (jabsBattler.isActionDecided()) return false;

    // nor is one already winding something up, or channeling.
    if (jabsBattler.isCastingOrChanneling()) return false;

    // decided and counting down: the map paints the telegraph from exactly this.
    jabsBattler.setDecidedAction(actions);
    const [ primaryAction ] = actions;
    jabsBattler.setCastCountdown(primaryAction.getCastTime());

    // remembered, so landing it can tell this cast from one the bearer decided for itself.
    AutoExecuteSkillManager.#windups.set(jabsBattler, actions);
    return true;
  }

  /**
   * Fires a windup this manager started, the moment it ends.<br/>
   * Called from the bearer's own update, right after the update that counts its cast down, so a windup lands in
   * the very frame it completes and never waits for an AI to fire it. The AI's road pays costs, starts cooldowns
   * and stamps the skill as last used, none of which an auto-executed skill ever does, and an inanimate bearer
   * has no AI at all. So it fires through the very instant path a payload without a cast time takes, under the
   * same depth guard, and anything extending that path sees a wound-up payload exactly as it sees an instant
   * one. The volley that path rebuilds matches the telegraph: a casting AI neither walks nor turns, an inanimate
   * bearer never does, and a player's movement interrupts the cast. The cast slot is cleared after.
   * @param {JABS_Battler} jabsBattler The bearer whose windup may have ended.
   */
  static landWindup(jabsBattler)
  {
    const actions = AutoExecuteSkillManager.#windups.get(jabsBattler);

    // the slot holds nothing this manager wound up: there never was a windup here, it was interrupted, or the
    // bearer has decided anew. A slot is never undefined, so an unknown bearer fails this test too.
    if (jabsBattler.getDecidedAction() !== actions)
    {
      AutoExecuteSkillManager.#windups.delete(jabsBattler);
      return;
    }

    // a fallen bearer lands nothing.
    if (jabsBattler.getBattler()
      .isDead())
    {
      AutoExecuteSkillManager.#windups.delete(jabsBattler);
      return;
    }

    // the windup is still counting down.
    const [ primaryAction ] = actions;
    if (!primaryAction.isCastComplete()) return;

    // it lands once, whatever the firing sets in motion.
    AutoExecuteSkillManager.#windups.delete(jabsBattler);

    // fire under the same depth guard as the instant path, so the firing cannot set off another auto-execute.
    AutoExecuteSkillManager.#executionDepth += 1;

    try
    {
      // the payload fires through the instant path, now that its windup has been seen.
      const skillId = primaryAction.getBaseSkill().id;
      $jabsEngine.forceMapAction(jabsBattler, skillId, false);
    }
    finally
    {
      // always lower the guard again once the payload has fired.
      AutoExecuteSkillManager.#executionDepth -= 1;
    }

    // the cast slot is the bearer's own again.
    jabsBattler.clearDecidedAction();
  }
}

export default AutoExecuteSkillManager;
//endregion AutoExecuteSkillManager
