//region Game_Actor
Object.defineProperties(Game_BattlerBase.prototype, {
  /**
   * Aptitude point gain multiplier.
   */
  apr: {
    get: function()
    {
      return 1;
    },
    configurable: true,
  },
});

Object.defineProperty(Game_Actor.prototype, 'apr', {
  get: function()
  {
    const multiplier = 100;
    const objectsToCheck = this.getAllNotes();
    const bonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.APT.RegExp.AptMultiplier);

    let factor = (multiplier + bonus) / 100;

    if (this.getSdpBonusForParameterKey)
    {
      factor += this.getSdpBonusForParameterKey('apr', 1);
    }

    return factor;
  },
  configurable: true,
});
//endregion Game_Actor
