//region TextManager
/**
 * Gets the proper name for the points used by the SDP system.
 * @returns {string}
 */
TextManager.sdpPoints = function()
{
  return J.SDP.Metadata.sdpPointsDisplayName;
};

/**
 * Gets the proper name of "SDP Multiplier".
 * @returns {string}
 */
TextManager.sdpMultiplier = function()
{
  return 'SDP Rate';
};

/**
 * Gets the description text for the SDP multiplier.
 * @returns {string[]}
 */
TextManager.sdpMultiplierDescription = function()
{
  return [
    'The percentage bonuses being applied against SDP point gain.',
    'Higher amounts of this yields greater SDP point generation.'
  ];
};
//endregion TextManager
