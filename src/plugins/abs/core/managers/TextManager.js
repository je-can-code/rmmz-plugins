//region TextManager
/**
 * Gets the display name for the cooldown rate reduction parameter.
 * @returns {string}
 */
TextManager.cdr = function()
{
  return 'Cooldown Rate';
};

/**
 * Gets the description text for the cooldown rate reduction parameter.
 * @returns {string[]}
 */
TextManager.cdrDescription = function()
{
  return [
    "Reduces the duration of the global cooldown triggered after skill use.",
    "At 100, the global cooldown is eliminated entirely.",
  ];
};

/**
 * Gets the display name for the parry extension rate parameter.
 * @returns {string}
 */
TextManager.per = function()
{
  return 'Parry Extension';
};

/**
 * Gets the description text for the parry extension rate parameter.
 * @returns {string[]}
 */
TextManager.perDescription = function()
{
  return [
    "Extends the duration of the precise-parry window when raising guard.",
    "At 100, the parry window is doubled; stacks additively.",
  ];
};
//endregion TextManager
