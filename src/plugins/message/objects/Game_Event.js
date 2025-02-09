//region Game_Event
/**
 * A filter function for only including comment event commands relevant to choice conditionals.
 * @param {rm.types.EventCommand} command The command being evaluated.
 * @returns {boolean}
 */
Game_Event.filterCommentCommandsForBasicConditionals = function(command)
{
  // identify the actual comment being evaluated.
  const [ comment, ] = command.parameters;

  // in case the command isn't even valid for comment-validation.
  if (!comment) return false;

  // extract the types of regex we will be considering.
  const {
    LeaderChoiceConditional,
    NotLeaderChoiceConditional,
    SwitchOnChoiceConditional,
    SwitchOffChoiceConditional
  } = J.MESSAGE.RegExp;

  return [
    LeaderChoiceConditional, NotLeaderChoiceConditional, SwitchOnChoiceConditional, SwitchOffChoiceConditional ].some(
    regex => regex.test(comment));
};

/**
 * Converts a known comment event command into a conditional for basic control.
 * @param {rm.types.EventCommand} commentCommand The comment command to parse into a conditional.
 * @returns {BasicChoiceConditional}
 */
Game_Event.toBasicConditional = function(commentCommand)
{
  // shorthand the comment into a variable.
  const [ comment, ] = commentCommand.parameters;

  let result = null;

  let type = String.empty;

  switch (true)
  {
    // check if the leader is in fact the desired leader.
    case J.MESSAGE.RegExp.LeaderChoiceConditional.test(comment):
      result = J.MESSAGE.RegExp.LeaderChoiceConditional.exec(comment);
      type = BasicChoiceConditional.Types.Leader;
      break;
    // check if the leader is in fact not the desired leader.
    case J.MESSAGE.RegExp.NotLeaderChoiceConditional.test(comment):
      result = J.MESSAGE.RegExp.NotLeaderChoiceConditional.exec(comment);
      type = BasicChoiceConditional.Types.NotLeader;
      break;

    // check if a particular switch is currently ON.
    case J.MESSAGE.RegExp.SwitchOnChoiceConditional.test(comment):
      result = J.MESSAGE.RegExp.SwitchOnChoiceConditional.exec(comment);
      type = BasicChoiceConditional.Types.SwitchOn;
      break;
    // check if a particular switch is currently ON.
    case J.MESSAGE.RegExp.SwitchOffChoiceConditional.test(comment):
      result = J.MESSAGE.RegExp.SwitchOffChoiceConditional.exec(comment);
      type = BasicChoiceConditional.Types.SwitchOff;
      break;
  }

  // parse the value out of the regex capture group.
  const [ , val ] = result;
  const parsedVal = JsonMapper.parseObject(val);

  // derive the conditional from the designated regex.
  return new BasicChoiceConditional(type, parsedVal);
};
//endregion Game_Event