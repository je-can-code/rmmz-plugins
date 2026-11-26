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
 *
 * A rule fired by a hit knows the battler that was struck, and a direct payload lands on that battler's tile:
 * an enchant's follow-up hits the foe the swing hit. Every other payload fires from its bearer, as one always has.
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
   * decided, so landing one can tell its own cast from anything the bearer decided for itself since, along with
   * the tile it aims at, so it lands where it was aimed when it was wound up. Held weakly: a bearer taken off the
   * map takes its windup with it, and only a bearer still being updated lands one.
   * @type {WeakMap<JABS_Battler, { actions: JABS_Action[], aimTile: Array<number|null> }>}
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
   * @param {JABS_Battler|null} [hitTarget=null] - The battler a hit-driven rule's hit landed on, which a direct
   * payload aims at; null when no hit fired this rule.
   * @returns {boolean} - True when the skill fired at once or began its windup.
   */
  static dispatch(battler, skillId, _tuple, hitTarget = null)
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

      // resolve where the payload aims: the battler that was struck, if it is direct and a hit fired it.
      const [ primaryAction ] = preview;
      const aimTile = AutoExecuteSkillManager.resolveAimTile(primaryAction, hitTarget);

      // a payload with a cast time winds up before it fires, the way any cast does, so it can be seen coming.
      if (primaryAction.getCastTime() > 0) return AutoExecuteSkillManager.#beginWindup(jabsBattler, preview, aimTile);

      // force the skill onto the map, at its aim if it has one, without the battler's own cooldown or resources.
      const [ aimX, aimY ] = aimTile;
      $jabsEngine.forceMapAction(jabsBattler, skillId, false, aimX, aimY);

      return true;
    }
    finally
    {
      // always decrement the depth counter when leaving the forced action scope.
      AutoExecuteSkillManager.#executionDepth -= 1;
    }
  }

  /**
   * Resolves the tile a payload aims at, as the coordinate pair {@link JABS_Engine#forceMapAction} takes.<br/>
   * A direct payload fired by a hit aims at the battler that was struck, so it lands on them: an enchant's
   * follow-up lands on the foe the swing hit, not around the one swinging. Everything else aims nowhere, and both
   * coordinates are null. A rule with no hit behind it has nobody to aim at, and a non-direct payload's origin is
   * its bearer, whatever it was fired by: a projectile still leaves from whoever fired it.
   * @param {JABS_Action} primaryAction The payload's primary action.
   * @param {JABS_Battler|null} hitTarget The battler a hit-driven rule's hit landed on, or null.
   * @returns {Array<number|null>} The `[x, y]` to aim at, or `[null, null]` when the payload aims nowhere.
   */
  static resolveAimTile(primaryAction, hitTarget)
  {
    // a rule that no hit fired has nobody to aim at.
    if (hitTarget === null) return [ null, null ];

    // only a direct payload aims; anything else fires from its bearer.
    if (primaryAction.isDirectAction() === false) return [ null, null ];

    // land on the battler that was struck.
    return [ hitTarget.getX(), hitTarget.getY() ];
  }

  /**
   * Starts a payload's windup in its bearer's own cast slot: decided, with its countdown running. That is all
   * the map reads to paint a cast's telegraph, and all the bearer needs to count the windup down.<br/>
   * A bearer already deciding or casting something keeps it, and the windup is refused. A refused dispatch
   * stamps no cooldown, so a timed or proximity rule tries again on the next frame.
   * @param {JABS_Battler} jabsBattler The bearer to wind the payload up.
   * @param {JABS_Action[]} actions The payload's actions, built the way the instant path builds them.
   * @param {Array<number|null>} aimTile The `[x, y]` the payload aims at, kept until it lands; see
   * {@link resolveAimTile}.
   * @returns {boolean}
   */
  static #beginWindup(jabsBattler, actions, aimTile)
  {
    // a bearer about to act on a decision of its own is never made to drop it.
    if (jabsBattler.isActionDecided()) return false;

    // nor is one already winding something up, or channeling.
    if (jabsBattler.isCastingOrChanneling()) return false;

    // decided and counting down: the map paints the telegraph from exactly this.
    jabsBattler.setDecidedAction(actions);
    const [ primaryAction ] = actions;
    jabsBattler.setCastCountdown(primaryAction.getCastTime());

    // remembered, so landing it can tell this cast from one the bearer decided for itself, and aim it.
    AutoExecuteSkillManager.#windups.set(jabsBattler, { actions, aimTile });
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
   * bearer never does, and a player's movement interrupts the cast. It lands on the tile it was aimed at when it
   * was wound up, if it was aimed at all. The cast slot is cleared after.
   * @param {JABS_Battler} jabsBattler The bearer whose windup may have ended.
   */
  static landWindup(jabsBattler)
  {
    const windup = AutoExecuteSkillManager.#windups.get(jabsBattler);

    // this manager never wound anything up for this bearer, so there is nothing of its own to land.
    if (windup === undefined) return;

    // the slot no longer holds what this manager wound up: it was interrupted, or the bearer has decided anew.
    if (jabsBattler.getDecidedAction() !== windup.actions)
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
    const [ primaryAction ] = windup.actions;
    if (!primaryAction.isCastComplete()) return;

    // it lands once, whatever the firing sets in motion.
    AutoExecuteSkillManager.#windups.delete(jabsBattler);

    // fire under the same depth guard as the instant path, so the firing cannot set off another auto-execute.
    AutoExecuteSkillManager.#executionDepth += 1;

    try
    {
      // the payload fires through the instant path, now that its windup has been seen, at the tile it was aimed at.
      const skillId = primaryAction.getBaseSkill().id;
      const [ aimX, aimY ] = windup.aimTile;
      $jabsEngine.forceMapAction(jabsBattler, skillId, false, aimX, aimY);
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
