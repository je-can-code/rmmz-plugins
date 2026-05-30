//region Game_Battler
Object.defineProperties(Game_BattlerBase.prototype, {
  /**
   * Outgoing shield amplification (1.0 = baseline).
   */
  sar: {
    get: function()
    {
      return 1.0;
    },
    configurable: true,
  },

  /**
   * Incoming shield effectiveness (1.0 = baseline).
   */
  ser: {
    get: function()
    {
      return 1.0;
    },
    configurable: true,
  },
});

Object.defineProperty(Game_Battler.prototype, 'sar', {
  get: function()
  {
    let factor = this.baseSarFactor();

    if (this.getSdpBonusForParameterKey)
    {
      factor += this.getSdpBonusForParameterKey('sar', 1);
    }

    return factor;
  },
  configurable: true,
});

Object.defineProperty(Game_Battler.prototype, 'ser', {
  get: function()
  {
    let factor = this.baseSerFactor();

    if (this.getSdpBonusForParameterKey)
    {
      factor += this.getSdpBonusForParameterKey('ser', 1);
    }

    return factor;
  },
  configurable: true,
});

/**
 * Sums `<sar:X>` notetags into a multiplier factor.
 * @returns {number}
 */
Game_Battler.prototype.baseSarFactor = function()
{
  const bonus = RPGManager.getSumFromAllNotesByRegex(
    this.getAllNotes(),
    J.ABS.EXT.SHIELD.RegExp.ShieldAmplification
  );

  return (100 + bonus) / 100;
};

/**
 * Sums `<ser:X>` notetags into a multiplier factor.
 * @returns {number}
 */
Game_Battler.prototype.baseSerFactor = function()
{
  const bonus = RPGManager.getSumFromAllNotesByRegex(
    this.getAllNotes(),
    J.ABS.EXT.SHIELD.RegExp.ShieldEffectiveness
  );

  return (100 + bonus) / 100;
};
//endregion Game_Battler
