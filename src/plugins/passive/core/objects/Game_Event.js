//region Game_Event
/**
 * Gets all passive state ids in the comments of an event.
 * @returns {number[]}
 */
Game_Event.prototype.getPassiveStateIds = function()
{
  // default team id for an event is an enemy.
  const passiveStateIds = [];

  // check all the valid event commands to see if we have an override for team.
  this.getValidCommentCommands()
    .forEach(command =>
    {
      // reset the regex's lastIndex to 0.
      J.PASSIVE.RegExp.PassiveStateIds.lastIndex = 0;

      // shorthand the comment into a variable.
      const [ comment, ] = command.parameters;

      // check if the comment matches the regex.
      const regexResult = J.PASSIVE.RegExp.PassiveStateIds.exec(comment);

      // if the comment didn't match, then don't try to parse it.
      if (!regexResult) return;

      // map the capture group to numbers.
      const ids = JSON.parse(regexResult[1]);

      // parse the value out of the regex capture group.
      passiveStateIds.push(...ids);
    });

  // return what we found.
  return passiveStateIds;
};
//endregion Game_Event