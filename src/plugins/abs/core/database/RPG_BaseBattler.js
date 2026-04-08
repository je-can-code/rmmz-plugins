//region RPG_BaseBattler
//region bonusHitsScopes
/**
 * Bonus hits per connection from this battler database note, applied to all JABS actions.
 * @type {number}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBonusHitsScopeGlobal', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeGlobal);
  },
});

/**
 * Bonus hits per connection from this battler database note, applied to basic attacks only.
 * @type {number}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBonusHitsScopeBasic', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeBasic);
  },
});

/**
 * Bonus hits per connection from this battler database note, applied to non-basic skills only.
 * @type {number}
 */
Object.defineProperty(RPG_BaseBattler.prototype, 'jabsBonusHitsScopeSkill', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeSkill);
  },
});
//endregion bonusHitsScopes
//endregion RPG_BaseBattler