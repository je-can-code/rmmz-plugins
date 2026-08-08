//region RPG_TraitItem
//region bonusHitsScopes
/**
 * Bonus hits per connection from this traited object note, applied to all JABS actions.
 * @type {number}
 */
Object.defineProperty(RPG_Traited.prototype, 'jabsBonusHitsScopeGlobal', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeGlobal);
  },
});

/**
 * Bonus hits per connection from this traited object note, applied to basic attacks only.
 * @type {number}
 */
Object.defineProperty(RPG_Traited.prototype, 'jabsBonusHitsScopeBasic', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeBasic);
  },
});

/**
 * Bonus hits per connection from this traited object note, applied to non-basic skills only.
 * @type {number}
 */
Object.defineProperty(RPG_Traited.prototype, 'jabsBonusHitsScopeSkill', {
  get: function()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.ABS.RegExp.BonusHitsScopeSkill);
  },
});
//endregion bonusHitsScopes
//endregion RPG_TraitItem