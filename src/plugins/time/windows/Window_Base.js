//region Window_Base
/**
 * Extends {@link #convertEscapeCharacters}.<br>
 * Adds handling for new text codes for TIME data.
 */
J.TIME.Aliased.Window_Base.set('convertEscapeCharacters', Window_Base.prototype.convertEscapeCharacters);
Window_Base.prototype.convertEscapeCharacters = function(text)
{
  // capture the text in a local variable for good practices!
  let textToModify = text;

  // handle season of year replacements.
  textToModify = this.translateSeasonOfYearTextCode(textToModify);

  // handle time of day replacements.
  textToModify = this.translateTimeOfDayTextCode(textToModify);

  // handle current time replacements.
  textToModify = this.translateCurrentTimeTextCode(textToModify);

  // let the rest of the conversion occur with the newly modified text.
  return J.TIME.Aliased.Window_Base.get('convertEscapeCharacters')
    .call(this, textToModify);
};

/**
 * Translates the text code into the name and icon of the corresponding time of day.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateTimeOfDayTextCode = function(text)
{
  // if not using the TIME system, then don't try to process the text.
  if (!J.TIME) return text;

  return text.replace(/\\timeOfDay\[(\d+)]/gi, (_, p1) =>
  {
    // determine the time of day id.
    const timeOfDayId = parseInt(p1) ?? -1;

    // if no id was provided, then do not parse.
    if (timeOfDayId === -1) return text;

    // determine the name of the time of day.
    const timeOfDayName = Time_Snapshot.TimesOfDayName(timeOfDayId);

    // if we got null back, then it was an invalid id.
    if (timeOfDayName === null) return text;

    // grab the iconIndex for the time of day.
    const timeOfDayIconIndex = Time_Snapshot.TimesOfDayIcon(timeOfDayId);

    // return the constructed replacement string.
    return `\\I[${timeOfDayIconIndex}]\\C[1]${timeOfDayName}\\C[0]`;
  });
};

/**
 * Translates the text code into the name and icon of the corresponding season of year.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateSeasonOfYearTextCode = function(text)
{
  // if not using the TIME system, then don't try to process the text.
  if (!J.TIME) return text;

  return text.replace(/\\seasonOfYear\[(\d+)]/gi, (_, p1) =>
  {
    // determine the season of year id.
    const seasonOfYearId = parseInt(p1) ?? -1;

    // if no id was provided, then do not parse.
    if (seasonOfYearId === -1) return text;

    // determine the name of the season of the year.
    const seasonOfYearName = Time_Snapshot.SeasonsName(seasonOfYearId);

    // if we got null back, then it was an invalid id.
    if (seasonOfYearName === null) return text;

    // grab the iconIndex for the season of the year.
    const seasonOfYearIconIndex = Time_Snapshot.SeasonsIconIndex(seasonOfYearId);

    // return the constructed replacement string.
    return `\\I[${seasonOfYearIconIndex}]\\C[1]${seasonOfYearName}\\C[0]`;
  });
};

/**
 * Translates the text code into the current time.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateCurrentTimeTextCode = function(text)
{
  // if not using the TIME system, then don't try to process the text.
  if (!J.TIME) return text;

  return text.replace(/\\currentTime/gi, (_) =>
  {
    // grab the current time.
    const currentTime = $gameTime.currentTime();

    // extract the display for time.
    const {
      hours,
      minutes,
      seconds
    } = currentTime;

    // return the constructed replacement string.
    return `\\I[${currentTime.timeOfDayIcon}]\\C[1]${hours}:${minutes}:${seconds}\\C[0]`;
  });
};
//endregion Window_Base