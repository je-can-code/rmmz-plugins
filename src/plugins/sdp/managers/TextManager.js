//region TextManager
/**
 * Gets the proper name for the points used by the SDP system.
 * @returns {string}
 */
TextManager.sdpPoints = function()
{
  return "SDPs";
};

/**
 * Extends {@link #longParam}.<br>
 * First checks if it is the SDP multiplier paramId before searching for others.
 * @returns {string}
 */
J.SDP.Aliased.TextManager.set('longParam', TextManager.longParam);
TextManager.longParam = function(paramId)
{
  switch (paramId)
  {
    case 33:
      return this.sdpMultiplier(); // sdp multiplier
    default:
      // perform original logic.
      return J.SDP.Aliased.TextManager.get('longParam')
        .call(this, paramId);
  }
};

/**
 * Gets the proper name of "SDP Multiplier".
 * @returns {string}
 */
TextManager.sdpMultiplier = function()
{
  return "SDP Multiplier";
};

/**
 * Extends {@link #longParamDescription}.<br>
 * First checks if it is the SDP multiplier paramId before searching for others.
 * @returns {string[]}
 */
J.SDP.Aliased.TextManager.set('longParamDescription', TextManager.longParamDescription);
TextManager.longParamDescription = function(paramId)
{
  switch (paramId)
  {
    case 33:
      return this.sdpMultiplierDescription(); // sdp multiplier
    default:
      // perform original logic.
      return J.SDP.Aliased.TextManager.get('longParamDescription')
        .call(this, paramId);
  }
};

/**
 * Gets the description text for the SDP multiplier.
 * @returns {string[]}
 */
TextManager.sdpMultiplierDescription = function()
{
  return [
    "The percentage bonuses being applied against SDP point gain.",
    "Higher amounts of this yields greater SDP point generation." ];
};
//endregion TextManager