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
//endregion RPG_Class