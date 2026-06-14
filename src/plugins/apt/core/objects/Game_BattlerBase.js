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
    // return the cached result if the cache is still warm.
    if (this.getCachedApr() !== null)
    {
      return this.getCachedApr();
    }

    // compute and cache the result.
    const multiplier = 100;
    const bonus = RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.APT.RegExp.AptMultiplier);
    let factor = (multiplier + bonus) / 100;

    if (this.getSdpBonusForParameterKey)
    {
      factor += this.getSdpBonusForParameterKey('apr', 1);
    }

    this.setCachedApr(factor);

    return this.getCachedApr();
  },
  configurable: true,
});
//endregion Game_Actor
