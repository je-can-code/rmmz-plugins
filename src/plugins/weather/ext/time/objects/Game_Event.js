//region Game_Event
import WeatherMapper from './WeatherMapper.js';

/**
 * Extends {@link meetsConditions}.<br/>
 * Also includes the custom conditions that relate to the weather.
 *
 * J-TIME and J-Omni-Quest both alias this same method, and the chain holds because each calls the
 * one before it. Weather is a separate domain from either: J-TIME's conditional kinds all return a
 * `TimeConditional` whose fields are clock fields, so registering into its table was never an
 * option. J-Omni-Quest is the precedent followed here instead.
 * @param {any} page The page driving this step.
 * @returns {boolean}
 */
J.WEATHER.EXT.TIME.Aliased.Game_Event.set('meetsConditions', Game_Event.prototype.meetsConditions);
Game_Event.prototype.meetsConditions = function(page)
{
  // perform original logic.
  const metOtherPageConditions = J.WEATHER.EXT.TIME.Aliased.Game_Event.get('meetsConditions')
    .call(this, page);

  // if other conditions aren't met, then weather conditions don't override that.
  if (!metOtherPageConditions) return false;

  // grab the list of valid comments.
  const commentCommandList = Game_Event.getValidCommentCommandsFromPage(page);

  // there aren't any comments on this event at all.
  if (commentCommandList.length === 0) return true;

  // gather all weather conditionals from the comment commands of this event.
  const weatherConditionals = Game_Event.toWeatherConditionals(commentCommandList);

  // if there are none, then this event is fine to proceed!
  if (weatherConditionals.length === 0) return true;

  // determine if all the weather conditionals are satisfied.
  return weatherConditionals.every(Game_Event.weatherConditionalMet, this);
};

/**
 * Filters the comment commands to only weather conditionals- should any exist in the collection.
 * @param {RPG_EventListCommand[]} commentCommandList The comment commands to potentially convert.
 * @returns {WeatherConditional[]}
 */
Game_Event.toWeatherConditionals = function(commentCommandList)
{
  // gather all weather comments from the comment commands of this event.
  const weatherCommentCommands = commentCommandList
    .filter(Game_Event.filterCommentCommandsByWeatherConditional, this);

  // if there are no weather conditionals available for parsing, don't bother.
  if (weatherCommentCommands.length === 0) return [];

  // map all the weather conditionals from the parsed regex.
  return weatherCommentCommands.map(Game_Event.toWeatherConditional, this);
};

/**
 * A filter function for only including comment event commands relevant to the weather.
 * @param {RPG_EventListCommand} command The command being evaluated.
 * @returns {boolean}
 */
Game_Event.filterCommentCommandsByWeatherConditional = function(command)
{
  // identify the actual comment being evaluated.
  const [ comment, ] = command.parameters;

  // in case the command isn't even valid for comment-validation.
  if (!comment) return false;

  // which shapes of tag exist belongs to the mapper, which is also where a new one is added.
  return WeatherMapper.isWeatherComment(comment);
};

/**
 * Converts a known comment event command into a conditional for weather control.
 *
 * **This cannot fail.** Recognising a weather comment and parsing one are the same table read
 * twice - see {@link WeatherMapper.ConditionalKinds} - so anything that reached here has a kind
 * waiting for it. J-TIME guards the equivalent step because its filter and its parser genuinely
 * are two lists that can drift apart; one list cannot drift from itself.
 * @param {RPG_EventListCommand} commentCommand The comment command to parse into a conditional.
 * @returns {WeatherConditional}
 */
Game_Event.toWeatherConditional = function(commentCommand)
{
  // shorthand the comment into a variable.
  const [ comment, ] = commentCommand.parameters;

  return WeatherMapper.toConditional(comment);
};

/**
 * Evaluates a {@link WeatherConditional} to see if its requirements are currently met.
 *
 * The weather is read from the director rather than from the game variables it mirrors. The
 * variables are a one-way mirror for event authors to branch on, and an author who edits one by
 * hand should change what their own events see rather than what this plugin believes.
 * @param {WeatherConditional} weatherConditional The conditional to evaluate satisfaction of.
 * @returns {boolean}
 */
Game_Event.weatherConditionalMet = function(weatherConditional)
{
  const { weatherConfig } = J.WEATHER.Metadata;

  // numbered by the same table the variable mirror uses, so a tag and a conditional branch written
  // against the variable can never mean different things.
  const ids = WeatherVariables.idsFor(weatherConfig, WeatherDirector.current());

  return weatherConditional.isMet(ids.weatherType, ids.weatherIntensity);
};
//endregion Game_Event