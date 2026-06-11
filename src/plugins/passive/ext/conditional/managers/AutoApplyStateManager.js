//region AutoApplyStateManager
/**
 * Schedules real JABS state applications from {@link RPG_BaseItem#autoApplyStateRules} /
 * {@link RPG_BaseBattler#autoApplyStateRules} tuples.<br/>
 * Separate from the passive grant pipeline — uses {@link Game_Battler#addState} on the map.
 */
class AutoApplyStateManager
{
  /**
   * Evaluates every {@code time} rule on this battler while they are active on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler The battler receiving scheduled states.
   */
  static processTimeRules(battler)
  {
    // no ABS context — nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    this.tryApply(battler, 'time');
  }

  /**
   * Evaluates {@code stand} rules while this battler is idle on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler The battler receiving scheduled states.
   */
  static processStandRules(battler)
  {
    // no ABS context — nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    const lastMovedFrame = battler.getPassiveRuleLastMovedFrame();
    const framesSinceMoved = Graphics.frameCount - lastMovedFrame;

    // moved this frame — standing rules do not fire.
    if (framesSinceMoved === 0) return;

    this.tryApply(battler, 'stand');
  }

  /**
   * Credits one whole tile of travel toward {@code move} auto-apply rules.<br/>
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
      const stateId = Number(tuple[0]);
      const kind = String(tuple[1]);
      const tilesPerApply = Number(tuple[2]);

      if (Number.isNaN(stateId) || stateId <= 0) continue;

      if (kind !== 'move') continue;

      if (Number.isNaN(tilesPerApply) || tilesPerApply <= 0) continue;

      const ruleKey = this.buildRuleKey(source, tupleIndex, stateId, kind);
      const priorCredit = battler.getAutoApplyTileCredit(ruleKey);
      const nextCredit = priorCredit + 1;

      // not enough whole tiles yet — keep accumulating.
      if (nextCredit < tilesPerApply)
      {
        battler.setAutoApplyTileCredit(ruleKey, nextCredit);
        continue;
      }

      this.#applyState(battler, stateId);

      // reset the tile counter whether or not apply succeeded (avoid stuck credit).
      battler.setAutoApplyTileCredit(ruleKey, 0);
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
   * Fires resource-specific and {@code anyDmg} auto-apply rules after damage to one pool.
   * @param {Game_Actor|Game_Enemy} battler The battler that took damage.
   * @param {'hpDmg'|'mpDmg'|'tpDmg'} resourceKind Which resource decreased.
   */
  static scheduleDamageTriggers(battler, resourceKind)
  {
    battler.tryAutoApplyStates(resourceKind);
    battler.tryAutoApplyStates('anyDmg');
  }

  /**
   * Fires state-polarity and {@code anyStateAdded} auto-apply after a combat state lands.
   * @param {Game_Actor|Game_Enemy} battler The battler that received the state.
   * @param {number} stateId The database state id that was added.
   */
  static scheduleStateAddedTriggers(battler, stateId)
  {
    battler.tryAutoApplyStates('anyStateAdded');

    const state = $dataStates[stateId];

    if (!state) return;

    // negative classification comes from the JABS <negative> notetag.
    if (state.jabsNegative === true)
    {
      battler.tryAutoApplyStates('negaStateAdded');
    }
    else
    {
      battler.tryAutoApplyStates('posiStateAdded');
    }
  }

  /**
   * Tries to apply states for every rule on this battler that matches the given condition kind.
   * @param {Game_Actor|Game_Enemy} battler The battler receiving scheduled states.
   * @param {string} conditionKind The condition kind to match (time, hpDmg, whenCrit, etc.).
   */
  static tryApply(battler, conditionKind)
  {
    // no ABS context — nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    const rules = this.collectRules(battler);

    // walk every authored tuple and attempt an apply when the kind matches.
    for (const entry of rules)
    {
      const { source, tuple, tupleIndex } = entry;
      const stateId = Number(tuple[0]);
      const kind = String(tuple[1]);
      const param = Number(tuple[2]);

      // skip malformed tuples or rules targeting a different trigger.
      if (Number.isNaN(stateId) || stateId <= 0) continue;

      if (kind !== conditionKind) continue;

      if (Number.isNaN(param) || param < 0) continue;

      // move applies only through tile credit — not through the frame-cooldown path.
      if (kind === 'move') continue;

      this.#tryApplyRule(battler, source, tupleIndex, stateId, kind, param);
    }
  }

  /**
   * Gathers auto-apply tuples from every passive-capable source on this battler.
   * @param {Game_Actor|Game_Enemy} battler The battler whose sources should be scanned.
   * @returns {{ source: RPG_BaseItem, tuple: any[], tupleIndex: number }[]} Rules with their originating database row.
   */
  static collectRules(battler)
  {
    const collected = [];
    const sources = battler.getPassiveStateSources();

    // each source row may declare zero or more auto-apply tuples.
    for (const source of sources)
    {
      const tuples = source.autoApplyStateRules || [];

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
   * {@link tupleIndex} is the tag's position in {@link RPG_BaseItem#autoApplyStateRules} so duplicate
   * state/condition pairs on the same row stay independent.
   * @param {RPG_BaseItem} source The database row carrying the tag.
   * @param {number} tupleIndex Zero-based index of this tuple on {@code source}.
   * @param {number} stateId The state id to apply.
   * @param {string} condition The condition kind string.
   * @returns {string} Unique key for last-apply frame tracking.
   */
  static buildRuleKey(source, tupleIndex, stateId, condition)
  {
    const sourceLabel = source.constructor.name || 'Unknown';
    const sourceId = source.id;

    return `${sourceLabel}:${sourceId}:${tupleIndex}:${stateId}:${condition}`;
  }

  /**
   * Applies one rule when its per-key frame cooldown has elapsed.
   * @param {Game_Actor|Game_Enemy} battler The battler receiving the state.
   * @param {RPG_BaseItem} source The database row that declared the rule.
   * @param {number} tupleIndex Zero-based index of this tuple on {@code source}.
   * @param {number} stateId The state id to apply.
   * @param {string} condition The condition kind string.
   * @param {number} cooldownFrames Minimum frames between applications for this key.
   */
  static #tryApplyRule(battler, source, tupleIndex, stateId, condition, cooldownFrames)
  {
    const ruleKey = this.buildRuleKey(source, tupleIndex, stateId, condition);
    const now = Graphics.frameCount;
    const lastFrame = battler.getAutoApplyLastFrame(ruleKey);
    const elapsed = now - lastFrame;

    // respect the cooldown window before firing again.
    if (lastFrame > 0 && elapsed < cooldownFrames) return;

    const applied = this.#applyState(battler, stateId);

    // only stamp cooldown when the state actually applied (or refreshed).
    if (applied === true)
    {
      battler.setAutoApplyLastFrame(ruleKey, now);
    }
  }

  /**
   * Pushes a real combat state onto the battler through the JABS addState path.
   * @param {Game_Actor|Game_Enemy} battler The battler receiving the state.
   * @param {number} stateId The database state id to apply.
   * @returns {boolean} True when addState was attempted and the state is addable.
   */
  static #applyState(battler, stateId)
  {
    // passive-tracked states cannot be added as combat states.
    if (battler.isStateAddable(stateId) === false) return false;

    // self is the attacker so JABS state tracking has a valid source battler.
    battler.addState(stateId, battler);

    return true;
  }
}

export default AutoApplyStateManager;
//endregion AutoApplyStateManager
