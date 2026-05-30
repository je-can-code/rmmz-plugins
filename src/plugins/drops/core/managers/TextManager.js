//region TextManager
/**
 * Display label for gold rate — bonus multiplier on gold rewards.
 * @returns {string}
 */
TextManager.goldRate = function()
{
  return 'Gold Rate';
};

/**
 * Help text explaining how gold rate improves battle and chest payouts.
 * @returns {string[]}
 */
TextManager.goldRateDescription = function()
{
  return [
    'Bonus multiplier applied to gold rewards.',
    'Higher values yield more gold from battles and chests.',
  ];
};

/**
 * Display label for drop rate — bonus multiplier on item drop chances.
 * @returns {string}
 */
TextManager.dropRate = function()
{
  return 'Drop Rate';
};

/**
 * Help text explaining how drop rate improves extra loot odds.
 * @returns {string[]}
 */
TextManager.dropRateDescription = function()
{
  return [
    'Bonus multiplier applied to item drop chances.',
    'Higher values improve the odds of extra loot.',
  ];
};
//endregion TextManager