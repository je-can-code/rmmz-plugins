//region Game_Event
/**
 * Extends {@link Game_Event.initMembers}.<br>
 * Initializes level-related properties.
 */
J.LEVEL.Aliased.Game_Event.set('initMembers', Game_Event.prototype.initMembers);
Game_Event.prototype.initMembers = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Event.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with levels.
   */
  this._j._level ||= {};

  /**
   * The cached level override value.
   * @type {number|null}
   */
  this._j._level._cachedLevelOverride = null;

  /**
   * The cached check of whether or not to hide the level in the battler's name.
   * @type {boolean|null}
   */
  this._j._level._cachedHideLevel = null;
};

/**
 * Gets the cached level override.<br>
 * If there is no override, this returns null instead.
 * @returns {number|null}
 */
Game_Event.prototype.getCachedLevelOverride = function()
{
  return this._j._level._cachedLevelOverride;
};

/**
 * Gets the cached flag for whether or not the level should be hidden.<br>
 * If there is this hasn't been parsed, this returns null instead.
 * @returns {boolean|null}
 */
Game_Event.prototype.getCachedHideLevel = function()
{
  return this._j._level._cachedHideLevel;
};

/**
 * Sets the level override as a cached value.
 * @param {number|null} level The new cached value.
 */
Game_Event.prototype.setCachedLevelOverride = function(level)
{
  this._j._level._cachedLevelOverride = level;
};

/**
 * Sets the flag for hiding the level as a cached value.
 * @param {boolean|null} hideLevel The new cached value.
 */
Game_Event.prototype.setCachedHideLevel = function(hideLevel)
{
  this._j._level._cachedHideLevel = hideLevel;
};

/**
 * Extends {@link Game_Event.refresh}.<br>
 * Clears the level override cache when the event page changes.
 */
J.LEVEL.Aliased.Game_Event.set('refresh', Game_Event.prototype.refresh);
Game_Event.prototype.refresh = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Event.get('refresh')
    .call(this);

  // clear the level override cache when the event page changes
  this.clearLevelCache();
};

/**
 * Clears the cached values related to levels.
 */
Game_Event.prototype.clearLevelCache = function()
{
  // reset back to default.
  this.setCachedLevelOverride(null);
  this.setCachedHideLevel(null);
};

/**
 * Parses out the level from a list of event commands.
 * @returns {number|null} The found level, or null if not found.
 */
Game_Event.prototype.getLevelOverrides = function()
{
  // check if we have a cached value
  if (this._j._level._cachedLevelOverride !== null)
  {
    // return the cached value
    return this._j._level._cachedLevelOverride;
  }

  // default to no level override
  let level = null;

  // check all the valid event commands to see if we have a level override
  this.getValidCommentCommands()
    .forEach(command =>
    {
      // shorthand the comment into a variable
      const [ comment, ] = command.parameters;

      // check if the comment matches the regex
      const regexResult = J.LEVEL.RegExp.Level.exec(comment);

      // if the comment didn't match, then don't try to parse it
      if (!regexResult) return;

      // parse the value out of the regex capture group
      level = parseInt(regexResult[1]);
    });

  // cache the result for future use
  this._j._level._cachedLevelOverride = level;

  // return what we found
  return level;
};

/**
 * Determines if the level should be hidden for this event.
 * @returns {boolean} True if the level should be hidden, false otherwise.
 */
Game_Event.prototype.shouldHideLevel = function()
{
  // check if we have a cached value.
  if (this.getCachedHideLevel() !== null)
  {
    // return the cached value.
    return this.getCachedHideLevel();
  }

  // default to not hiding the level.
  let hideLevel = false;

  // check all the valid event commands to see if we have a hide level tag.
  this.getValidCommentCommands()
    .forEach(command =>
    {
      // shorthand the comment into a variable.
      const [ comment, ] = command.parameters;

      // check if the comment contains the hideLevel tag.
      if (J.LEVEL.RegExp.HideLevel.test(comment))
      {
        hideLevel = true;
      }
    });

  // cache the result for future use
  this.setCachedHideLevel(hideLevel);

  // return what we found
  return hideLevel;
};
//endregion Game_Event