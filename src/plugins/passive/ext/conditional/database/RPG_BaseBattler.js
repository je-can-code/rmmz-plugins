//region RPG_BaseBattler
/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveSourceRule} tuples from this row.<br/>
 * Actor and enemy database rows extend {@link RPG_BaseBattler} — same getters as {@link RPG_BaseItem}.
 * @type {any[][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'passiveSourceRules', {
  get()
  {
    // pull every source-wide gate tuple from notes on this battler row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveSourceRule,
      true
    );
  },
});

/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateRule} tuples from this row.<br/>
 * Each tuple targets one passive state id; collection hooks filter by state when evaluating inclusion.
 * @type {any[][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'passiveStateRules', {
  get()
  {
    // pull every per-state gate tuple from notes on this battler row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateRule,
      true
    );
  },
});

/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateCount} tuples from this row.<br/>
 * Used by {@link Game_Battler#getPassiveStackContributionFromSource} instead of the default +1 stack.
 * @type {any[][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'passiveStateCounts', {
  get()
  {
    // pull every per-state stack scaler tuple from notes on this battler row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateCount,
      true
    );
  },
});

/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyState} tuples from this row.<br/>
 * Each tuple schedules a real state via {@link AutoApplyStateManager} (not the passive pipeline).
 * @type {any[][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'autoApplyStateRules', {
  get()
  {
    // pull every auto-apply scheduler tuple from notes on this battler row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyState,
      true
    );
  },
});

/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyStateOnNearby} tuples from this row.<br/>
 * Each tuple schedules a real state application onto nearby battlers via
 * {@link AutoApplyStateOnNearbyManager} — aura-style, targeting enemies or allies in proximity
 * rather than the rule bearer itself.
 * @type {any[][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'autoApplyStateOnNearbyRules', {
  get()
  {
    // pull every auto-apply-on-nearby scheduler tuple from notes on this battler row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyStateOnNearby,
      true
    );
  },
});

/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoExecuteSkill} tuples from this row.<br/>
 * Each tuple schedules a map skill via {@link AutoExecuteSkillManager}.
 * @type {any[][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'autoExecuteSkillRules', {
  get()
  {
    // pull every auto-execute scheduler tuple from notes on this battler row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoExecuteSkill,
      true
    );
  },
});

/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoInflictState} tuples from this row.<br/>
 * Each tuple schedules a real state application via {@link AutoInflictStateManager} onto whichever
 * external battler this row's bearer just inflicted a state upon- not the bearer, and not nearby.
 * @type {any[][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'autoInflictStateRules', {
  get()
  {
    // pull every auto-inflict scheduler tuple from notes on this battler row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoInflictState,
      true
    );
  },
});
//endregion RPG_BaseBattler