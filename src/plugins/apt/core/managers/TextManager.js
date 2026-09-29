//region TextManager
/**
 * Gets the proper name for the points this plugin grants: what the combat log, rewards and every other screen call
 * them.
 * @returns {string}
 */
TextManager.apPoints = function()
{
  return 'AP';
};

/**
 * Display label for aptitude rate — bonus multiplier on aptitude point gains.
 * @returns {string}
 */
TextManager.aptRate = function()
{
  return 'Aptitude UP';
};

/**
 * Help text explaining how aptitude rate accelerates skill mastery tracks.
 * @returns {string[]}
 */
TextManager.aptRateDescription = function()
{
  return [
    'Bonus multiplier applied to aptitude point gains.',
    'Higher values accelerate skill mastery through aptitude tracks.',
  ];
};
//endregion TextManager