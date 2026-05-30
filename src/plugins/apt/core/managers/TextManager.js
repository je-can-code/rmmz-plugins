//region TextManager
/**
 * Display label for aptitude rate — bonus multiplier on aptitude point gains.
 * @returns {string}
 */
TextManager.aptRate = function()
{
  return 'APT Rate';
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
  // policy step inside apt rate description.
  ];
};
//endregion TextManager