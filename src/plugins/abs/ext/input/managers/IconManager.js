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
 * A key-value mapping of physical input symbols to per-device ex-text.
 *
 * Every symbol carries a glyph for each device rather than one combined string, because the player is
 * only ever holding one of them. Showing both bindings permanently tells a controller player about a
 * keyboard they are not touching, and doubles the length of every legend to do it.
 * @type {Record<string, {gamepad: string, keyboard: string}>}
 */
IconManager._jabsInputTextRegistry = {};

/**
 * Gets the ex-text registry for JABS input symbols.
 * @returns {Record<string, {gamepad: string, keyboard: string}>}
 */
IconManager.getJabsInputTextRegistry = function()
{
  return IconManager._jabsInputTextRegistry;
};

/**
 * Registers custom per-device ex-text for a given symbol.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @param {string} gamepadText The ex-text to use while the player is on a gamepad.
 * @param {string} keyboardText The ex-text to use while the player is on a keyboard.
 */
IconManager.registerJabsInputText = function(symbol, gamepadText, keyboardText)
{
  // validate symbol to ensure its a string.
  const validatedSymbol = String(symbol);

  // normalize the symbol to lowercase.
  const normalizedSymbol = validatedSymbol.trim()
    .toLowerCase();
  if (!normalizedSymbol)
  {
    throw new Error(`Attempting to register an empty symbol for ex-text: ${gamepadText}`);
  }

  // validate the gamepad text to ensure its a string.
  const validatedGamepadText = String(gamepadText).trim();
  if (!validatedGamepadText)
  {
    throw new Error(`Attempting to register empty gamepad ex-text for symbol: ${normalizedSymbol}`);
  }

  // validate the keyboard text to ensure its a string.
  const validatedKeyboardText = String(keyboardText).trim();
  if (!validatedKeyboardText)
  {
    throw new Error(`Attempting to register empty keyboard ex-text for symbol: ${normalizedSymbol}`);
  }

  // grab the registry for updating.
  const registry = this.getJabsInputTextRegistry();

  // register both glyphs for the symbol.
  registry[normalizedSymbol] = {
    gamepad: validatedGamepadText,
    keyboard: validatedKeyboardText,
  };
};

/**
 * How far a keyboard glyph sits from its gamepad counterpart in the icon sheet.
 *
 * The sheet is laid out so that the keyboard row sits exactly one row above the gamepad row, with the
 * two in identical order- cross above Z, circle above X, and so on all the way along. That regularity
 * is deliberate on the sheet's part, so it is expressed here once as a rule rather than restated as a
 * second magic number beside every registration.
 * @returns {number}
 */
IconManager.keyboardIconIndexOffset = function()
{
  return 16;
};

/**
 * Registers the paired glyphs for a symbol from its gamepad icon index alone.
 *
 * The keyboard index is derived via {@link IconManager.keyboardIconIndexOffset}. Anything whose two
 * glyphs do not follow that layout should call {@link IconManager.registerJabsInputText} directly and
 * state both.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @param {number} gamepadIconIndex The icon index of the gamepad glyph for this symbol.
 */
IconManager.registerJabsInputIcon = function(symbol, gamepadIconIndex)
{
  // walk back up the sheet to the matching keyboard glyph.
  const keyboardIconIndex = gamepadIconIndex - this.keyboardIconIndexOffset();

  // register the pair as ex-text so consumers can draw it anywhere text is drawn.
  this.registerJabsInputText(symbol, `\\I[${gamepadIconIndex}]`, `\\I[${keyboardIconIndex}]`);
};

/**
 * Get the ex-text for a given physical input symbol, for whichever device the player is using.
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

  // look up the pair registered for this symbol.
  const registered = registry[normalizedSymbol];

  // a symbol nobody has described falls back to the engine's own label, then to the symbol itself.
  if (registered === undefined) return Input.labelForSymbol(normalizedSymbol) || symbol;

  // hand back only the glyph matching what the player is actually holding.
  return InputDeviceTracker.isGamepad()
    ? registered.gamepad
    : registered.keyboard;
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

  // return the ex-text for the symbol, or the symbol itself if not mapped (jabsInputTextForSymbol
  // already guarantees a truthy result for any truthy symbol via its own fallback chain).
  return this.jabsInputTextForSymbol(symbol);
};

/**
 * Registers all JABS input symbols with their respective ex-text.
 *
 * Only the gamepad index is stated for each symbol; the keyboard glyph follows from the sheet's layout.
 * Note that a symbol's name and its keyboard glyph are not expected to agree- the names are borrowed
 * from the engine's own mapping vocabulary and serve as identifiers, while the glyph shows the key
 * actually bound to that action.
 */
IconManager.registerJabsInputTexts = function()
{
  // the four face buttons, in the order the sheet lays them out: cross, circle, square, triangle.
  // that order is the gamepad's own button indices, so the pairing here must follow
  // {@link Input.gamepadMapper} rather than the order the symbols happen to be declared in.
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.Mainhand, 2448);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.Offhand, 2449);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.Dash, 2450);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.Tool, 2451);

  // the four shoulders and triggers.
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.SkillTrigger, 2452);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.GuardTrigger, 2453);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.StrafeTrigger, 2454);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.MobilitySkill, 2455);

  // the two center buttons, select before start, matching their button indices the same way the
  // face buttons and shoulders above do.
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.PartyCycle, 2456);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.Quickmenu, 2457);

  // the four directions, which menus lean on far more heavily than the map does.
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.DirLeft, 2458);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.DirRight, 2459);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.DirUp, 2460);
  this.registerJabsInputIcon(J.ABS.EXT.INPUT.Symbols.DirDown, 2461);
};
//endregion jabs text registry
//endregion IconManager