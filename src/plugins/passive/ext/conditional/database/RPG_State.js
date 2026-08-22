//region RPG_State
/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveOnSkillExecution} tuples from this state row.<br/>
 * Each tuple is {@code [stypeId, chance]}; {@code stypeId} 0 matches any skill type.
 * @type {any[][]}
 */
Object.defineProperty(RPG_State.prototype, 'removeOnSkillExecutionRules', {
  get()
  {
    // pull every skill-execution removal tuple from notes on this state row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveOnSkillExecution
    );
  },
});

/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveOnSkillResolution} tuples from this state row.<br/>
 * Each tuple is {@code [stypeId, chance]}; {@code stypeId} 0 matches any skill type.
 * Fires after {@link Game_Action#apply} so state traits are active during damage calculation.
 * @type {any[][]}
 */
Object.defineProperty(RPG_State.prototype, 'removeOnSkillResolutionRules', {
  get()
  {
    // pull every skill-resolution removal tuple from notes on this state row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveOnSkillResolution
    );
  },
});

/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveStateOnMove} tuples from this state row.<br/>
 * Each tuple is {@code [stateId]}; when the owning battler moves, that state is stripped.
 * @type {any[][]}
 */
Object.defineProperty(RPG_State.prototype, 'removeStateOnMoveRules', {
  get()
  {
    // pull every move-removal tuple from notes on this state row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveStateOnMove
    );
  },
});
//endregion RPG_State