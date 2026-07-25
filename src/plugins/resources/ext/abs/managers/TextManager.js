//region TextManager
/**
 * Display label for lifesteal — HP recovered from HP damage dealt.
 * @returns {string}
 */
TextManager.lst = function()
{
  return 'Lifesteal';
};

/**
 * Help text explaining lifesteal recovery on successful ABS hits.
 * @returns {string[]}
 */
TextManager.lstDescription = function()
{
  return [
    'Percent of HP damage dealt recovered as HP on a successful hit.',
    'Stacks with on-attack skill resource tags.',
  ];
};

/**
 * Display label for manasteal — MP recovered from HP damage dealt.
 * @returns {string}
 */
TextManager.mst = function()
{
  return 'Magisteal';
};

/**
 * Help text explaining manasteal recovery on successful ABS hits.
 * @returns {string[]}
 */
TextManager.mstDescription = function()
{
  return [
    'Percent of HP damage dealt recovered as MP on a successful hit.',
    'Stacks with on-attack skill resource tags.',
  ];
};

/**
 * Display label for techsteal — TP recovered from HP damage dealt.
 * @returns {string}
 */
TextManager.tst = function()
{
  return 'Techsteal';
};

/**
 * Help text explaining techsteal recovery on successful ABS hits.
 * @returns {string[]}
 */
TextManager.tstDescription = function()
{
  return [
    'Percent of HP damage dealt recovered as TP on a successful hit.',
    'Stacks with on-attack skill resource tags.',
  ];
};
//endregion TextManager