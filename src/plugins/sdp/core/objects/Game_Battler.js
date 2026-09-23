//region Game_Battler
/**
 * SDP points multiplier for this battler.
 */
Object.defineProperty(Game_BattlerBase.prototype, 'sdpMultiplier', {
  get: function()
  {
    return 1.0;
  },
  configurable: true,
});

/**
 * The SDP points multiplier a battler's own tags produce, before SDP panels or natural bonuses.<br/>
 * Only actors earn SDP points, so every other battler answers the neutral factor. Natural growth still
 * asks every battler for it, because buffs are refreshed on enemies too.
 * @returns {number}
 */
Game_BattlerBase.prototype.baseSdpMultiplier = function()
{
  return 1.0;
};
//endregion Game_Battler