//region Game_Actor
/**
 * Extends {@link #param}.<br/>
 * Also modifies the value based on the applied difficulty.
 * @returns {number}
 */
J.DIFFICULTY.Aliased.Game_Actor.set("param", Game_Actor.prototype.param);
Game_Actor.prototype.param = function(paramId)
{
  // grab the original value.
  // perform original logic.
  const originalValue = J.DIFFICULTY.Aliased.Game_Actor.get("param")
    .call(this, paramId);

  // grab the currently applied difficulty.
  const appliedDifficulty = $gameTemp.getAppliedDifficulty();

  // determine the multiplier for the parameter according to the difficulty.
  const multiplier = appliedDifficulty.actorEffects.bparams[paramId] / 100;

  // the rounded product of the multiplier and the original value.
  const scaledValue = Math.round(originalValue * multiplier);

  // the engine floors max hp at one, but it does so inside the original call - so scaling the
  // result afterward steps straight back over that clamp. A difficulty authored with a zero max hp
  // multiplier would otherwise produce a battler with no maximum hp at all, and every hp-over-mhp
  // ratio in the game divides by it: gauges, ai health gates, anything reading a health fraction.
  return (paramId === 0)
    ? Math.max(1, scaledValue)
    : scaledValue;
};

/**
 * Extends {@link #sparam}.<br/>
 * Also modifies the value based on the applied difficulty.
 * @returns {number}
 */
J.DIFFICULTY.Aliased.Game_Actor.set("sparam", Game_Actor.prototype.sparam);
Game_Actor.prototype.sparam = function(sparamId)
{
  // grab the original value.
  // perform original logic.
  const originalValue = J.DIFFICULTY.Aliased.Game_Actor.get("sparam")
    .call(this, sparamId);

  // grab the currently applied difficulty.
  const appliedDifficulty = $gameTemp.getAppliedDifficulty();

  // determine the multiplier for the parameter according to the difficulty.
  const multiplier = appliedDifficulty.actorEffects.sparams[sparamId] / 100;

  // return the rounded product of the multiplier and the original value.
  return (originalValue * multiplier);
};

/**
 * Extends {@link #xparam}.<br/>
 * Also modifies the value based on the applied difficulty.
 * @returns {number}
 */
J.DIFFICULTY.Aliased.Game_Actor.set("xparam", Game_Actor.prototype.xparam);
Game_Actor.prototype.xparam = function(xparamId)
{
  // grab the original value.
  // perform original logic.
  const originalValue = J.DIFFICULTY.Aliased.Game_Actor.get("xparam")
    .call(this, xparamId);

  // grab the currently applied difficulty.
  const appliedDifficulty = $gameTemp.getAppliedDifficulty();

  // determine the multiplier for the parameter according to the difficulty.
  const multiplier = appliedDifficulty.actorEffects.xparams[xparamId] / 100;

  // return the rounded product of the multiplier and the original value.
  return (originalValue * multiplier);
};
//endregion Game_Actor