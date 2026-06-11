//region AutoExecuteSkillManager
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';

/**
 * Schedules map skill executions from {@link RPG_BaseItem#autoExecuteSkillRules} /
 * {@link RPG_BaseBattler#autoExecuteSkillRules} tuples.<br/>
 * Separate from the passive grant pipeline — uses {@link JABS_Engine#forceMapAction}.
 */
class AutoExecuteSkillManager
{
  /**
   * Nested auto-execute depth for the synchronous call stack guard.
   * @type {number}
   */
  static #executionDepth = 0;

  /**
   * Evaluates every {@code time} rule on this battler while they are active on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler The battler whose skills may fire.
   */
  static processTimeRules(battler)
  {
    // no ABS context — nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    this.tryExecute(battler, 'time');
  }

  /**
   * Evaluates every {@code enemiesNearby} rule on this battler while on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler The battler whose skills may fire.
   */
  static processEnemiesNearbyRules(battler)
  {
    // no ABS context — nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    this.tryExecute(battler, 'enemiesNearby');
  }

  /**
   * Evaluates {@code stand} rules while this battler is idle on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler The battler whose skills may fire.
   */
  static processStandRules(battler)
  {
    // no ABS context — nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    const lastMovedFrame = battler.getPassiveRuleLastMovedFrame();
    const framesSinceMoved = Graphics.frameCount - lastMovedFrame;

    // moved this frame — standing rules do not fire.
    if (framesSinceMoved === 0) return;

    this.tryExecute(battler, 'stand');
  }

  /**
   * Credits one whole tile of travel toward {@code move} auto-execute rules.<br/>
   * Called from {@link Game_CharacterBase#updatePixelStepping} after Pixelistics tile stepping.
   * @param {Game_Actor|Game_Enemy} battler The battler that took a map tile step.
   */
  static creditTileStep(battler)
  {
    // no ABS context — nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    const rules = this.collectRules(battler);

    // walk every authored move tuple and accumulate tile credit per rule key.
    for (const entry of rules)
    {
      const { source, tuple, tupleIndex } = entry;
      const skillId = Number(tuple[0]);
      const kind = String(tuple[1]);
      const tilesPerExecute = Number(tuple[2]);

      if (Number.isNaN(skillId) || skillId <= 0) continue;

      if (kind !== 'move') continue;

      if (Number.isNaN(tilesPerExecute) || tilesPerExecute <= 0) continue;

      const ruleKey = this.buildRuleKey(source, tupleIndex, skillId, kind);
      const priorCredit = battler.getAutoExecuteSkillTileCredit(ruleKey);
      const nextCredit = priorCredit + 1;

      // not enough whole tiles yet — keep accumulating.
      if (nextCredit < tilesPerExecute)
      {
        battler.setAutoExecuteSkillTileCredit(ruleKey, nextCredit);
        continue;
      }

      this.#executeSkill(battler, skillId);

      // reset the tile counter whether or not execution succeeded (avoid stuck credit).
      battler.setAutoExecuteSkillTileCredit(ruleKey, 0);
    }
  }

  /**
   * Forwards one Pixelistics tile step from a map character to its underlying battler.
   * @param {Game_Character} character The character that just completed a whole-tile step.
   */
  static processTileStepFromCharacter(character)
  {
    const jabsBattler = character.getJabsBattler();

    if (!jabsBattler) return;

    const battler = jabsBattler.getBattler();

    if (!battler) return;

    this.creditTileStep(battler);
  }

  /**
   * Fires resource-specific and {@code anyDmg} auto-execute rules after damage to one pool.
   * @param {Game_Actor|Game_Enemy} battler The battler that took damage.
   * @param {'hpDmg'|'mpDmg'|'tpDmg'} resourceKind Which resource decreased.
   */
  static scheduleDamageTriggers(battler, resourceKind)
  {
    battler.tryAutoExecuteSkills(resourceKind);
    battler.tryAutoExecuteSkills('anyDmg');
  }

  /**
   * Fires state-polarity and {@code anyStateAdded} auto-execute after a combat state lands.
   * @param {Game_Actor|Game_Enemy} battler The battler that received the state.
   * @param {number} stateId The database state id that was added.
   */
  static scheduleStateAddedTriggers(battler, stateId)
  {
    battler.tryAutoExecuteSkills('anyStateAdded');

    const state = $dataStates[stateId];

    if (!state) return;

    // negative classification comes from the JABS <negative> notetag.
    if (state.jabsNegative === true)
    {
      battler.tryAutoExecuteSkills('negaStateAdded');
    }
    else
    {
      battler.tryAutoExecuteSkills('posiStateAdded');
    }
  }

  /**
   * Tries to execute skills for every rule on this battler that matches the given condition kind.
   * @param {Game_Actor|Game_Enemy} battler The battler whose skills may fire.
   * @param {string} conditionKind The condition kind to match (time, hpDmg, whenCrit, etc.).
   */
  static tryExecute(battler, conditionKind)
  {
    // no ABS context — nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    const rules = this.collectRules(battler);

    // walk every authored tuple and attempt execution when the kind matches.
    for (const entry of rules)
    {
      const { source, tuple, tupleIndex } = entry;
      const skillId = Number(tuple[0]);
      const kind = String(tuple[1]);

      // skip malformed tuples or rules targeting a different trigger.
      if (Number.isNaN(skillId) || skillId <= 0) continue;

      if (kind !== conditionKind) continue;

      // move applies only through tile credit — not through the frame-cooldown path.
      if (kind === 'move') continue;

      if (kind === 'enemiesNearby')
      {
        const minCount = Number(tuple[2]);
        const cooldownFrames = Number(tuple[3]);
        const triggerTilesRaw = tuple.length >= 5 ? Number(tuple[4]) : null;
        const triggerTiles = triggerTilesRaw !== null && Number.isNaN(triggerTilesRaw) === false
          ? triggerTilesRaw
          : null;

        if (Number.isNaN(minCount) || minCount < 1) continue;

        if (Number.isNaN(cooldownFrames) || cooldownFrames < 0) continue;

        const nearbyCount = PassiveRuleJabsAccess.nearbyEnemies(battler, triggerTiles).length;

        // gate fails — wait until enough opposing battlers enter trigger range.
        if (nearbyCount < minCount) continue;

        this.#tryExecuteRule(battler, source, tupleIndex, skillId, kind, cooldownFrames);
        continue;
      }

      const param = Number(tuple[2]);

      if (Number.isNaN(param) || param < 0) continue;

      this.#tryExecuteRule(battler, source, tupleIndex, skillId, kind, param);
    }
  }

  /**
   * Gathers auto-execute tuples from every passive-capable source on this battler.
   * @param {Game_Actor|Game_Enemy} battler The battler whose sources should be scanned.
   * @returns {{ source: RPG_BaseItem, tuple: any[], tupleIndex: number }[]} Rules with their originating database row.
   */
  static collectRules(battler)
  {
    const collected = [];
    const sources = battler.getPassiveStateSources();

    // each source row may declare zero or more auto-execute tuples.
    for (const source of sources)
    {
      const tuples = source.autoExecuteSkillRules || [];

      for (let tupleIndex = 0; tupleIndex < tuples.length; tupleIndex++)
      {
        collected.push({
          source,
          tuple: tuples[tupleIndex],
          tupleIndex,
        });
      }
    }

    return collected;
  }

  /**
   * Builds a stable cooldown key for one authored rule on one source row.<br/>
   * {@link tupleIndex} is the tag's position in {@link RPG_BaseItem#autoExecuteSkillRules} so duplicate
   * skill/condition pairs on the same row stay independent.
   * @param {RPG_BaseItem} source The database row carrying the tag.
   * @param {number} tupleIndex Zero-based index of this tuple on {@code source}.
   * @param {number} skillId The skill id to execute.
   * @param {string} condition The condition kind string.
   * @returns {string} Unique key for last-execute frame tracking.
   */
  static buildRuleKey(source, tupleIndex, skillId, condition)
  {
    const sourceLabel = source.constructor.name || 'Unknown';
    const sourceId = source.id;

    return `${sourceLabel}:${sourceId}:${tupleIndex}:${skillId}:${condition}`;
  }

  /**
   * Whether nested auto-execute is blocked by the configured max depth.
   * @returns {boolean}
   */
  static #isDepthBlocked()
  {
    const maxDepth = J.PASSIVE.EXT.CONDITIONAL.Metadata.autoExecuteSkillMaxDepth || 1;

    return AutoExecuteSkillManager.#executionDepth >= maxDepth;
  }

  /**
   * Executes one rule when its per-key frame cooldown has elapsed.
   * @param {Game_Actor|Game_Enemy} battler The battler firing the skill.
   * @param {RPG_BaseItem} source The database row that declared the rule.
   * @param {number} tupleIndex Zero-based index of this tuple on {@code source}.
   * @param {number} skillId The skill id to execute.
   * @param {string} condition The condition kind string.
   * @param {number} cooldownFrames Minimum frames between executions for this key.
   */
  static #tryExecuteRule(battler, source, tupleIndex, skillId, condition, cooldownFrames)
  {
    // depth guard — skip nested scheduler re-entry during an in-flight forced action.
    if (this.#isDepthBlocked()) return;

    const ruleKey = this.buildRuleKey(source, tupleIndex, skillId, condition);
    const now = Graphics.frameCount;
    const lastFrame = battler.getAutoExecuteSkillLastFrame(ruleKey);
    const elapsed = now - lastFrame;

    // respect the cooldown window before firing again.
    if (lastFrame > 0 && elapsed < cooldownFrames) return;

    const executed = this.#executeSkill(battler, skillId);

    // stamp cooldown when the skill dispatch succeeded.
    if (executed === true)
    {
      battler.setAutoExecuteSkillLastFrame(ruleKey, now);
    }
  }

  /**
   * Forces one map skill through JABS without cost or cooldown on the payload row.
   * @param {Game_Actor|Game_Enemy} battler The battler firing the skill.
   * @param {number} skillId The database skill id to execute.
   * @returns {boolean} True when forceMapAction was invoked.
   */
  static #executeSkill(battler, skillId)
  {
    const jabsBattler = PassiveRuleJabsAccess.getJabsBattler(battler);

    if (!jabsBattler) return false;

    if (Number.isNaN(skillId) || skillId <= 0) return false;

    if (!$dataSkills[skillId]) return false;

    AutoExecuteSkillManager.#executionDepth += 1;

    try
    {
      const preview = jabsBattler.createJabsActionFromSkill(skillId);

      if (!$jabsEngine.canExecuteMapActions(jabsBattler, preview)) return false;

      $jabsEngine.forceMapAction(jabsBattler, skillId, false);

      return true;
    }
    finally
    {
      AutoExecuteSkillManager.#executionDepth -= 1;
    }
  }
}

export default AutoExecuteSkillManager;
//endregion AutoExecuteSkillManager