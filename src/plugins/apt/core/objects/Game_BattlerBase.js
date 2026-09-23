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

/**
 * The aptitude multiplier a battler's own tags produce, before SDP panels or natural bonuses.<br/>
 * Only actors earn aptitude, so every other battler answers the neutral factor. Natural growth still
 * asks every battler for it, because buffs are refreshed on enemies too.
 * @returns {number}
 */
Game_BattlerBase.prototype.baseAptFactor = function()
{
  return 1;
};

Object.defineProperty(Game_Actor.prototype, 'apr', {
  get: function()
  {
    // start from the factor this actor's own tags produce.
    const baseFactor = this.baseAptFactor();

    // add SDP panel bonuses, which arrive in percent-points.
    const sdpBonus = this.getSdpBonusForParameterKey
      ? this.getSdpBonusForParameterKey('apr', 1)
      : 0;

    // add whatever natural buffs and growths are bound to aptitude rate.
    const naturalBonus = this.naturalBonus('apr');

    // scale the panel bonus into the same factor units as everything else.
    return baseFactor + (sdpBonus / 100) + naturalBonus;
  },
  configurable: true,
});

/**
 * Overwrites {@link Game_BattlerBase#baseAptFactor}.<br/>
 * The aptitude multiplier this actor's own tags produce, cached until this actor's data changes. This
 * is what aptitude rate's natural tags see as their base.
 * @returns {number}
 */
Game_Actor.prototype.baseAptFactor = function()
{
  // return the cached result if the cache is still warm.
  if (this.getCachedApr() !== null)
  {
    return this.getCachedApr();
  }

  // compute and cache the result.
  const multiplier = 100;
  const bonus = RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.APT.RegExp.AptMultiplier);
  const factor = (multiplier + bonus) / 100;

  this.setCachedApr(factor);

  return this.getCachedApr();
};
//endregion Game_Actor