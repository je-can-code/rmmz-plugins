//region Game_Interpreter
/**
 * Gets the conditional branch results by indent depth.
 * @returns {Object<number, number|boolean>} The branch.
 */
Game_Interpreter.prototype.branch = function()
{
  // hand back the conditional branch results by indent depth.
  return this._branch;
};

/**
 * Gets the indent depth of the command being executed.
 * @returns {number} The indent.
 */
Game_Interpreter.prototype.indent = function()
{
  // hand back the indent depth of the command being executed.
  return this._indent;
};

/**
 * Gets the list of event commands this interpreter is currently executing.<br/>
 * This is the only trustworthy source for the surrounding commands of whatever is being executed right now. An
 * interpreter's list can originate from a map event page, a common event, or a troop page, and a child interpreter
 * inherits the event id of whoever spawned it- so re-deriving the list from {@link eventId} lands on the parent's
 * commands rather than the ones actually running.
 * @returns {RPG_EventListCommand[]} The list.
 */
Game_Interpreter.prototype.list = function()
{
  // hand back the list of event commands this interpreter is currently executing.
  return this._list;
};

/**
 * Gets the index of the command being executed.
 * @returns {number} The index.
 */
Game_Interpreter.prototype.index = function()
{
  // hand back the index of the command being executed.
  return this._index;
};

/**
 * Sets the index of the command being executed.
 * @param {number} newIndex The new index.
 */
Game_Interpreter.prototype.setIndex = function(newIndex)
{
  // assign the index of the command being executed.
  this._index = newIndex;
};
//endregion Game_Interpreter
