//region RPG_BaseBattler
//region bonusHitsScopes
/**
 * Bonus hits per connection from this battler database note, applied to all JABS actions.
 * @type {number}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBonusHitsScopeGlobal', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeGlobal);
  },
});

/**
 * Bonus hits per connection from this battler database note, applied to basic attacks only.
 * @type {number}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBonusHitsScopeBasic', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeBasic);
  },
});

/**
 * Bonus hits per connection from this battler database note, applied to non-basic skills only.
 * @type {number}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBonusHitsScopeSkill', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeSkill);
  },
});
//endregion bonusHitsScopes

//region skillTransforms
/**
 * The collection of skill transforms defined on this battler's database entry.
 *
 * Each entry is a two-number array in the form:
 * [ baseSkillId, transformedSkillId ]
 *
 * When active, any equipped skill whose id matches {@code baseSkillId} will execute
 * as {@code transformedSkillId} instead, without mutating the slot's stored id.
 * @type {number[][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsSkillTransforms', {
  get: function()
  {
    return RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.SkillTransform);
  },
});
//endregion skillTransforms

//region slotTransforms
/**
 * The collection of slot transforms defined on this battler's database entry.
 *
 * Each entry is a two-element array in the form:
 * [ slotKey, skillId ]
 *
 * Where a skill transform keys on what currently occupies a slot, this keys on the slot itself,
 * which is the only way to redirect a slot holding an item id or holding nothing at all. The
 * slot's stored contents are never mutated; the redirect lives exactly as long as this note does.
 * @type {[ string, number ][]}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsSlotTransforms', {
  get: function()
  {
    return RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.SlotTransform);
  },
});
//endregion slotTransforms
//endregion RPG_BaseBattler