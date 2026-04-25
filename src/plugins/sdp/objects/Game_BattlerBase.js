//region Game_BattlerBase
/**
 * Gets all SDP bonuses for the given crit parameter id.
 * @param {number} critParamId The id of the crit parameter.
 * @param {number} baseParam The base value of the crit parameter in question.
 * @returns {number}
 */
// eslint-disable-next-line no-unused-vars
Game_BattlerBase.prototype.critSdpBonuses = function(critParamId, baseParam)
{
  // by default, there are no crit bonuses at the root level.
  return 0;
};
//endregion Game_BattlerBase