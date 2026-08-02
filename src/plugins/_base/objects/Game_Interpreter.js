//region Game_Interpreter
/**
 * Gets the conditional branch results by indent depth.
 * @returns {Object<number, *>} The branch.
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
