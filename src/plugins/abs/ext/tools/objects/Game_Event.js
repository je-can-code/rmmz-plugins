//region Game_Event
/**
 * Gets the gap close target key from this event's comment commands, or null if not a gap close target.
 * @returns {string|null} The gap close target key, or null if not present.
 */
Game_Event.prototype.gapCloseKey = function()
{
  // initialize the found key.
  let foundKey = null;

  // TODO: route through RPGManager once it supports event comment caching.
  // check all valid comment commands for the gap close target tag.
  this.getValidCommentCommands()
    .forEach(command =>
    {
      // shorthand the comment into a variable.
      const [ comment, ] = command.parameters;

      // execute the regexp against this comment to capture the key.
      const result = J.ABS.EXT.TOOLS.RegExp.GapCloseTarget.exec(comment);

      // skip comments that don't match.
      if (!result) return;

      // extract and store the captured key.
      [ , foundKey ] = result;
    });

  // return the key found, or null if none matched.
  return foundKey;
};
//endregion Game_Event