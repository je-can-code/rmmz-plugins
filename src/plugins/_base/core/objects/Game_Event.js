//region Game_Event
import JsonMapper from './../_utilities/JsonMapper.js';

/**
 * Gets all valid-shaped comment event commands.
 * @returns {RPG_EventListCommand[]}
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
 * Builds a note-shaped view of this event's comment commands.
 *
 * {@link RPGManager} parses a `note` string and nothing else- every getter it offers bottoms out on
 * splitting that string into lines- so an event able to present its comments as one inherits the
 * whole family at once: plural captures, numbers, sums, the `nullIfEmpty` opt-in. That is a great
 * deal more than {@link Game_Event.extractValueByRegex} beside it can offer, which reads a single
 * value and silently keeps the last one when a tag appears twice.
 *
 * **The event's own note box is deliberately not folded in.** That box is event-global rather than
 * per-page, so a tag written there would leak into every page of the event- and it is a single
 * cramped line in the editor besides, which is why comments carry this plugin's tags to begin with.
 *
 * A fresh object comes back on every call rather than a remembered one. RPGManager keys its note
 * cache weakly on whatever object it is handed and assumes that object's note never changes, which
 * is true of a database row and emphatically untrue of an event that can turn its page. Handing it
 * a throwaway keeps that assumption honest. A caller reading several tags at once should hold this
 * result across the whole parse rather than calling once per tag, which is what lets the cache
 * answer the second and later reads.
 * @returns {{note: string}} The comment lines, shaped the way RPGManager's getters expect.
 */
Game_Event.prototype.commentNote = function()
{
  // every comment line on the active page, in the order the author wrote them.
  const lines = this.getValidCommentCommands()
    .map(command => command.parameters.at(0));

  // RPGManager splits a note on its newlines, so joining on them is the whole of the translation.
  const note = lines.join('\n');

  return { note };
};

/**
 * Gets all valid-shaped comment event commands from a designated page.
 * @param {RPG_MapEventPage} page The event page to parse comments from.
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
 * @param {RPG_EventListCommand} command The command to evaluate.
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
 * @param {RPG_EventListCommand} command The command in question.
 * @param {RegExp} structure The regex to find values for.
 * @param {any=} defaultValue The default value to start with; defaults to null.
 * @param {boolean=} andParse Whether or not to parse the results; defaults to true.
 * @returns {any} The last found value, or the default if nothing was found.
 */
Game_Event.prototype.getDataForCommandByRegex = function(command, structure, defaultValue = null, andParse = true)
{
  // shorthand the comment into a variable.
  const [ comment, ] = command.parameters;

  // reset just in case the regex is global.
  structure.lastIndex = 0;

  // check if the comment matches the regex.
  const regexResult = structure.exec(comment);

  // if the comment didn't match, then don't try to parse it.
  if (!regexResult) return;

  // extract the regex capture group.
  const [ , val ] = regexResult;

  // if we did not find anything, return the default.
  if (val === defaultValue) return val;

  // if we are not parsing, then return the raw findings.
  if (!andParse) return val;

  // return the parsed result instead.
  return JsonMapper.parseObject(val);
};

/**
 * Gets the current page's event command list if it is present, or an empty array if it isn't.
 * @returns {RPG_EventListCommand[]}
 */
Game_Event.prototype.getEventCommandList = function()
{
  // initialize to an empty array.
  let list = [];

  // in certain situations, one or both of these may be unavailable.
  if (this.page() && this.list())
  {
    // the list was available.
    list = this.list() ?? [];
  }

  // return what we found.
  return list;
};

/**
 * Determines whether or not the given plugin commands are present in the list of event commands for a given plugin.
 * @param {string} targetPluginName The name of the plugin to look for commands for.
 * @param {string[]} commandNames The collection of plugin command names to validate existence of.
 */
Game_Event.prototype.hasPluginCommand = function(targetPluginName, commandNames)
{
  // pull the current page’s command list.
  const list = this.getEventCommandList();

  // find any matching plugin command.
  const found = !!list.find(cmd =>
  {
    // ensure this is a plugin command.
    if (!cmd || cmd.code !== 357) return false;

    // deconstruct the typical MZ plugin command payload.
    const [ pluginName, commandName ] = cmd.parameters;
    if (!commandName) return false;

    // if we know the quest plugin name, require it to match.
    if (pluginName !== targetPluginName) return false;

    // return true if the command is one of the desired names.
    return commandNames.includes(commandName);
  });

  // return whether we found a matching command.
  return found;
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

/**
 * Gets the index of the currently active event page.
 * @returns {number} The pageIndex.
 */
Game_Event.prototype.pageIndex = function()
{
  // hand back the index of the currently active event page.
  return this._pageIndex;
};

/**
 * Sets the index of the currently active event page.
 * @param {number} newPageIndex The new pageIndex.
 */
Game_Event.prototype.setPageIndex = function(newPageIndex)
{
  // assign the index of the currently active event page.
  this._pageIndex = newPageIndex;
};
//endregion Game_Event