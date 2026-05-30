//region RPG_BaseItem
/**
 * Parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveSourceRule} tuples from this row.<br/>
 * These live on the same database object as {@code <passive:[…]>} — not a parallel append pipeline.
 * @type {any[][]}
 */
Object.defineProperty(RPG_BaseItem.prototype, 'passiveSourceRules', {
  get()
  {
    // pull every source-wide gate tuple from notes on this row.
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
Object.defineProperty(RPG_BaseItem.prototype, 'passiveStateRules', {
  get()
  {
    // pull every per-state gate tuple from notes on this row.
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
Object.defineProperty(RPG_BaseItem.prototype, 'passiveStateCounts', {
  get()
  {
    // pull every per-state stack scaler tuple from notes on this row.
    return RPGManager.getArraysFromNotesByRegex(
      this,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateCount,
      true
    );
  },
});
//endregion RPG_BaseItem