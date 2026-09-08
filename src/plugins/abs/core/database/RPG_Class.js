//region RPG_Class
//region bonusHitsScopes
/**
 * Bonus hits per connection from this class note, applied to all JABS actions.
 * @type {number}
 */
Object.defineProperty(RPG_Class.prototype, 'jabsBonusHitsScopeGlobal', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeGlobal);
  },
});

/**
 * Bonus hits per connection from this class note, applied to basic attacks only.
 * @type {number}
 */
Object.defineProperty(RPG_Class.prototype, 'jabsBonusHitsScopeBasic', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeBasic);
  },
});

/**
 * Bonus hits per connection from this class note, applied to non-basic skills only.
 * @type {number}
 */
Object.defineProperty(RPG_Class.prototype, 'jabsBonusHitsScopeSkill', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeSkill);
  },
});
//endregion bonusHitsScopes

//region skillTransforms
/**
 * The collection of skill transforms defined on this class.
 *
 * Each entry is a two-number array in the form:
 * [ baseSkillId, transformedSkillId ]
 *
 * While a battler uses this class, any equipped skill whose id matches
 * {@code baseSkillId} will execute as {@code transformedSkillId} instead,
 * without mutating the slot's stored id.
 * @type {number[][]}
 */
Object.defineProperty(RPG_Class.prototype, 'jabsSkillTransforms', {
  get: function()
  {
    return RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.SkillTransform);
  },
});
//endregion skillTransforms

//region slotTransforms
/**
 * The collection of slot transforms defined on this class.
 *
 * Each entry is a two-element array in the form:
 * [ slotKey, skillId ]
 *
 * While a battler uses this class, the named slot executes {@code skillId} regardless of what is
 * equipped there, including an item id or nothing at all. Neither of those is reachable by a skill
 * transform, which has no base id to match in either case. The slot's stored contents are never
 * mutated.
 * @type {[ string, number ][]}
 */
Object.defineProperty(RPG_Class.prototype, 'jabsSlotTransforms', {
  get: function()
  {
    return RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.SlotTransform);
  },
});
//endregion slotTransforms
//endregion RPG_Class