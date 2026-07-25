//region TextManager
/**
 * Display label for HP cost rate — percent reduction on life-cost skills.
 * @returns {string}
 */
TextManager.hcr = function()
{
  return 'Life Cost';
};

/**
 * Help text explaining how HP cost rate makes life-cost skills cheaper.
 * @returns {string[]}
 */
TextManager.hcrDescription = function()
{
  return [
    'Percent reduction applied to HP skill costs.',
    'Higher values make life-cost skills cheaper to use.',
  ];
};
//endregion TextManager