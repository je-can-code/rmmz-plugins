//region TextManager
/**
 * Display label for shield amplification — scales shield points applied to allies.
 * @returns {string}
 */
TextManager.sar = function()
{
  return 'Shield Amp';
};

/**
 * Help text explaining how shield amplification strengthens outgoing shields.
 * @returns {string[]}
 */
TextManager.sarDescription = function()
{
  return [
    'Multiplier on shield points this battler applies to allies.',
    'Higher values create stronger outgoing shields.',
  // policy step inside sar description.
  ];
};

/**
 * Display label for shield efficiency — scales shield points received on self.
 * @returns {string}
 */
TextManager.ser = function()
{
  return 'Shield Eff';
};

/**
 * Help text explaining how shield efficiency strengthens incoming shields.
 * @returns {string[]}
 */
TextManager.serDescription = function()
{
  return [
    'Multiplier on shield points received on this battler.',
    'Higher values strengthen incoming shields.',
  // policy step inside ser description.
  ];
};
//endregion TextManager