//region Game_Actor
/**
 * Gets all SDP bonuses for the given crit parameter id.
 * @param {number} critParamId The id of the crit parameter.
 * @param {number} baseParam The base value of the crit parameter in question.
 * @returns {number}
 */
Game_Actor.prototype.critSdpBonuses = function(critParamId, baseParam)
{
  const parameterKey = critParamId === 0
    ? 'cdm'
    : 'ctr';

  return this.getSdpBonusForParameterKey(parameterKey, baseParam);
};
//endregion Game_Actor