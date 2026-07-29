//region Scene_MenuBase
/**
 * Gets the sprite rendering this scene's blurred background.
 * @returns {Sprite} The backgroundSprite.
 */
Scene_MenuBase.prototype.backgroundSprite = function()
{
  // hand back the sprite rendering this scene's blurred background.
  return this._backgroundSprite;
};

/**
 * Sets the sprite rendering this scene's blurred background.
 * @param {Sprite} newBackgroundSprite The new backgroundSprite.
 */
Scene_MenuBase.prototype.setBackgroundSprite = function(newBackgroundSprite)
{
  // assign the sprite rendering this scene's blurred background.
  this._backgroundSprite = newBackgroundSprite;
};

/**
 * Gets the blur filter applied to this scene's background.
 * @returns {PIXI.filters.BlurFilter} The backgroundFilter.
 */
Scene_MenuBase.prototype.backgroundFilter = function()
{
  // hand back the blur filter applied to this scene's background.
  return this._backgroundFilter;
};

/**
 * Sets the blur filter applied to this scene's background.
 * @param {PIXI.filters.BlurFilter} newBackgroundFilter The new backgroundFilter.
 */
Scene_MenuBase.prototype.setBackgroundFilter = function(newBackgroundFilter)
{
  // assign the blur filter applied to this scene's background.
  this._backgroundFilter = newBackgroundFilter;
};

/**
 * Gets the help window describing the current selection.
 * @returns {Window_Help} The helpWindow.
 */
Scene_MenuBase.prototype.helpWindow = function()
{
  // hand back the help window describing the current selection.
  return this._helpWindow;
};
//endregion Scene_MenuBase
