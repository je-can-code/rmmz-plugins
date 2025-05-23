//region Game_Event
/**
 * Gets all valid-shaped comment event commands.
 * @returns {rm.types.EventCommand[]}
 */
Game_Event.prototype.getValidCommentCommands = function()
{
  // don't process if we have no event commands.
  if (!this.canGetValidCommentCommands()) return Array.empty;

  // otherwise, return the filtered list.
  return this.list()
    .filter(Game_Event.filterInvalidEventCommand, this);
};

/**
 * Gets all valid-shaped comment event commands from a designated page.
 * @param {rm.types.Page} page The event page to parse comments from.
 */
Game_Event.getValidCommentCommandsFromPage = function(page)
{
  // grab the list of commands from the given page.
  const commands = page.list;

  // don't process if we have no event commands.
  if (commands.length === 0) return Array.empty;

  // otherwise, return the filtered list.
  return commands.filter(Game_Event.filterInvalidEventCommand, this);
};

/**
 * Filters out event commands that are not comments intended for regex parsing.
 * @param {rm.types.EventCommand} command The command to evaluate.
 * @returns {boolean}
 */
Game_Event.filterInvalidEventCommand = function(command)
{
  // if it is not a comment, then don't include it.
  if (!Game_Event.matchesControlCode(command.code)) return false;

  // shorthand the comment into a variable.
  const [ comment, ] = command.parameters;

  // consider this comment valid if it passes, skip it otherwise.
  return J.BASE.RegExp.ParsableComment.test(comment);
};

/**
 * Determines whether or not the parsable comment commands can be retrieved.
 * @returns {boolean} True if they can be parsed, false otherwise.
 */
Game_Event.prototype.canGetValidCommentCommands = function()
{
  // if we are missing anything here, just don't try.
  if (!this) return false;
  if (!this.page()) return false;
  if (!this.page().list) return false;
  if (!this.list()) return false;
  if (this.list().length === 0) return false;

  // get those comment commands!
  return true;
};

/**
 * Detects whether or not the event code is one that matches the "comment" code.
 * @param {number} code The code to match.
 * @returns {boolean}
 */
Game_Event.matchesControlCode = function(code)
{
  // valid comment codes.
  const controlCodes = [
    108,  // 108 maps to the first line of a comment.
    408   // 408 maps to all additional indented comment lines after the 108 line.
  ];

  // return whether or not the code is valid.
  return controlCodes.includes(code);
};

/**
 * Extracts a value out of an event's comments based on the provided structure.
 * If there are multiple matches in the comments, only the last one will be returned.
 * @param {RegExp} structure The regex to find values for.
 * @param {any=} defaultValue The default value to start with; defaults to null.
 * @param {boolean=} andParse Whether or not to parse the results; defaults to true.
 * @returns {any} The last found value, or the default if nothing was found.
 */
Game_Event.prototype.extractValueByRegex = function(structure, defaultValue = null, andParse = true)
{
  // initalize to the provided default.
  let val = defaultValue;

  // iterate over all valid comments.
  this.getValidCommentCommands()
    .forEach(command =>
    {
      // shorthand the comment into a variable.
      const [ comment, ] = command.parameters;

      // check if the comment matches the regex.
      const regexResult = structure.exec(comment);

      // if the comment didn't match, then don't try to parse it.
      if (!regexResult) return;

      // extract the regex capture group.
      [ , val ] = regexResult;
    });

  // if we did not find anything, return the default.
  if (val === defaultValue) return val;

  // if we are not parsing, then return the raw findings.
  if (!andParse) return val;

  // return the parsed result instead.
  return JsonMapper.parseObject(val);
};

/**
 * Extracts a value out of an event's comments based on the provided structure.
 * If there are multiple matches in the comments, only the last one will be returned.
 * @param {RegExp} structure The regex to find values for.
 * @param {any=} defaultValue The default value to start with; defaults to null.
 * @param {boolean=} andParse Whether or not to parse the results; defaults to true.
 * @returns {any} The last found value, or the default if nothing was found.
 */
Game_Event.prototype.getDataForCommandByRegex = function(command, structure, defaultValue = null, andParse = true)
{
  // initalize to the provided default.
  let val = defaultValue;

  // shorthand the comment into a variable.
  const [ comment, ] = command.parameters;

  // check if the comment matches the regex.
  const regexResult = structure.exec(comment);

  // if the comment didn't match, then don't try to parse it.
  if (!regexResult) return;

  // extract the regex capture group.
  [ , val ] = regexResult;

  // if we did not find anything, return the default.
  if (val === defaultValue) return val;

  // if we are not parsing, then return the raw findings.
  if (!andParse) return val;

  // return the parsed result instead.
  return JsonMapper.parseObject(val);
};

/**
 * Determines if this character is actually an event.
 * @returns {boolean}
 */
Game_Event.prototype.isEvent = function()
{
  return true;
};

/**
 * Determines whether or not this character is currently erased.
 * Non-events cannot be erased.
 * @returns {boolean}
 */
Game_Event.prototype.isErased = function()
{
  return this._erased;
};
//endregion Game_Event