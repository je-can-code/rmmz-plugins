//region IconManager
//region jabs icon registry
/**
 * A key-value mapping of physical input symbols to icon indices.
 * @type {Record<string, number>}
 */
IconManager._jabsActionIconRegistry = {};

/**
 * Gets the icon registry for JABS input symbols.
 * @returns {Record<string, number>}
 */
IconManager.getJabsIconRegistry = function()
{
  return IconManager._jabsActionIconRegistry;
};

/**
 * Registers a custom icon for a given symbol.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @param {number} iconIndex The icon index to use for the given symbol.
 */
IconManager.registerJabsIcon = function(symbol, iconIndex)
{
  // validate symbol to ensure its a string.
  const validatedSymbol = String(symbol);

  // normalize the symbol to lowercase.
  const normalizedSymbol = validatedSymbol.trim()
    .toLowerCase();
  if (!normalizedSymbol)
  {
    throw new Error(`Attempting to register an empty symbol for icon index: ${iconIndex}`);
  }

  // validate iconIndex to ensure its a number.
  const validatedIconIndex = Number(iconIndex);
  if (isNaN(validatedIconIndex))
  {
    throw new Error(`Invalid icon index for symbol '${normalizedSymbol}': ${iconIndex}`);
  }

  // grab the registry for updating.
  const registry = this.getJabsIconRegistry();

  // register the icon index for the symbol.
  registry[normalizedSymbol] = validatedIconIndex;
};

/**
 * Gets the icon index for a given physical input symbol.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @returns {number} The icon index to use for the given symbol, or 0 if not mapped.
 */
IconManager.jabsIconIndexForSymbol = function(symbol)
{
  // validate symbol to ensure its a string.
  const validatedSymbol = String(symbol);

  // normalize the symbol to lowercase.
  const normalizedSymbol = validatedSymbol.trim()
    .toLowerCase();

  // bail early if the symbol is empty.
  if (!normalizedSymbol) return 0;

  // grab the registry for querying.
  const registry = this.getJabsIconRegistry();

  // return the icon index for the symbol, or 0 if not mapped.
  return registry[normalizedSymbol] || 0;
};

/**
 * Registers all JABS input symbols with their respective icon indices.
 */
IconManager.registerJabsIcons = function()
{
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.Mainhand, 76);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.Offhand, 77);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.Tool, 176);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.Dash, 140);

  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.SkillTrigger, 86);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.StrafeTrigger, 82);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.GuardTrigger, 83);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.MobilitySkill, 13);

  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.Quickmenu, 2563);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.PartyCycle, 75);

  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.CombatSkill1, 79);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.CombatSkill2, 79);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.CombatSkill3, 79);
  this.registerJabsIcon(J.ABS.EXT.INPUT.Symbols.CombatSkill4, 79);
};

//endregion jabs icon registry

//region jabs text registry
/**
 * A key-value mapping of physical input symbols to ex-text.
 * @type {Record<string, string>}
 */
IconManager._jabsInputTextRegistry = {};

/**
 * Gets the ex-text registry for JABS input symbols.
 * @returns {Record<string, string>}
 */
IconManager.getJabsInputTextRegistry = function()
{
  return IconManager._jabsInputTextRegistry;
};

/**
 * Registers custom ex-text for a given symbol.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @param {string} text The ex-text to use for the given symbol.
 */
IconManager.registerJabsInputText = function(symbol, text)
{
  // validate symbol to ensure its a string.
  const validatedSymbol = String(symbol);

  // normalize the symbol to lowercase.
  const normalizedSymbol = validatedSymbol.trim()
    .toLowerCase();
  if (!normalizedSymbol)
  {
    throw new Error(`Attempting to register an empty symbol for ex-text: ${text}`);
  }

  // validate text to ensure its a string.
  const validatedText = String(text).trim();
  if (!validatedText)
  {
    throw new Error(`Attempting to register an empty ex-text for symbol: ${normalizedSymbol}`);
  }

  // grab the registry for updating.
  const registry = this.getJabsInputTextRegistry();

  // register the ex-text for the symbol.
  registry[normalizedSymbol] = validatedText;
};

/**
 * Get the ex-text for a given physical input symbol.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @returns {string} The ex-text for the given symbol, or the symbol itself if not mapped.
 */
IconManager.jabsInputTextForSymbol = function(symbol)
{
  // grab the registry for querying.
  const registry = this.getJabsInputTextRegistry();

  // validate symbol to ensure its a string.
  const validatedSymbol = String(symbol);

  // normalize the symbol to lowercase.
  const normalizedSymbol = validatedSymbol.toLowerCase();

  // return the ex-text for the symbol, or the symbol itself if not mapped.
  return registry[normalizedSymbol] || Input.labelForSymbol(normalizedSymbol) || symbol;
};

/**
 * Gets the ex-text for a given physical input symbol.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @returns {string} The ex-text for the given symbol, or the symbol itself if not mapped.
 */
IconManager.jabsIconTextForSymbol = function(symbol)
{
  // handle empty/unbound case.
  if (!symbol) return "(unbound)";

  // return the ex-text for the symbol, or the symbol itself if not mapped.
  return this.jabsInputTextForSymbol(symbol) || String(symbol);
};

/**
 * Registers all JABS input symbols with their respective ex-text.
 */
IconManager.registerJabsInputTexts = function()
{
  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.Mainhand, "\\I[2448] / \\I[2432]");
  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.Offhand, "\\I[2449] / \\I[2433]");
  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.Tool, "\\I[2450] / \\I[2434]");
  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.Dash, "\\I[2451] / \\I[2435]");

  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.SkillTrigger, "\\I[2452] / \\I[2436]");
  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.StrafeTrigger, "\\I[2454] / \\I[2438]");
  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.GuardTrigger, "\\I[2453] / \\I[2437]");
  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.MobilitySkill, "\\I[2455] / \\I[2439]");

  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.Quickmenu, "\\I[2456] / \\I[2440]");
  this.registerJabsInputText(J.ABS.EXT.INPUT.Symbols.PartyCycle, "\\I[2457] / \\I[2441]");
};
//endregion jabs text registry
//endregion IconManager