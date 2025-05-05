/**
 * Gets the numeric representation of this battler's strength.
 * @returns {number}
 */
Game_Battler.prototype.getPowerLevel = function()
{
  let powerLevel = 0;

  const bparams = [ 2, 3, 4, 5, 6, 7 ];
  bparams.forEach(paramId =>
  {
    // add most of the base parameters 1:1 power level- skipping max HP/MP/TP.
    powerLevel += this.param(paramId);
  });

  const xparams = [ 0, 1, 2, 3, 4, 5, 6 ];
  xparams.forEach(paramId =>
  {
    //  add some of the ex-parameters 5:1 power level- skipping HRG/MRG/TRG.
    powerLevel += (this.xparam(paramId) * 100) * 5;
  });

  // add GRD 5:1.
  powerLevel += (this.sparam(1) * 100) * 5;

  // add PDR/MDR 10:1
  const sparams = [ 6, 7 ];
  sparams.forEach(paramId =>
  {
    const invertedDamageReductionMultiplier = (this.sparam(paramId) * 100 - 100) * -1;
    powerLevel += invertedDamageReductionMultiplier * 10;
  });

  if (Number.isNaN(powerLevel))
  {
    console.warn('what happened to the power level?');
  }

  powerLevel += (this.level ** 2);
  return Math.round(powerLevel);
};

/**
 * Determines the iconIndex that indicates the danger level relative to the player and enemy.
 * @returns {number} The icon index of the danger indicator icon.
 */
Game_Battler.prototype.getDangerIndicatorIcon = function()
{
  // if the sprite belongs to the player, then don't do it.
  const player = $jabsEngine.getPlayer1()
    .getBattler();
  if (player === this) return -1;

  // get the corresponding power levels.
  const bpl = this.getPowerLevel();
  const ppl = player.getPowerLevel();

  switch (true)
  {
    case (bpl < ppl * 0.5):
      return J.ABS.EXT.DANGER.DangerIndicatorIcons.Worthless;
    case (bpl >= ppl * 0.5 && bpl < ppl * 0.7):
      return J.ABS.EXT.DANGER.DangerIndicatorIcons.Simple;
    case (bpl >= ppl * 0.7 && bpl < ppl * 0.9):
      return J.ABS.EXT.DANGER.DangerIndicatorIcons.Easy;
    case (bpl >= ppl * 0.9 && bpl < ppl * 1.1):
      return J.ABS.EXT.DANGER.DangerIndicatorIcons.Average;
    case (bpl >= ppl * 1.1 && bpl < ppl * 1.3):
      return J.ABS.EXT.DANGER.DangerIndicatorIcons.Hard;
    case (bpl >= ppl * 1.3 && bpl <= ppl * 1.5):
      return J.ABS.EXT.DANGER.DangerIndicatorIcons.Grueling;
    case (bpl > ppl * 1.5):
      return J.ABS.EXT.DANGER.DangerIndicatorIcons.Deadly;
    default:
      return -1;
  }
};