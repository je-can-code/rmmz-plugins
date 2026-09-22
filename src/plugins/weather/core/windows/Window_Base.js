//region Window_Base
import WeatherLabel from './../core/WeatherLabel.js';
import WeatherDirector from './../managers/WeatherDirector.js';

/**
 * Extends {@link #convertEscapeCharacters}.<br/>
 * Adds handling for the weather text code.
 *
 * Aliasing the base window rather than the message window is what makes this work everywhere at
 * once - a message box, a speech bubble, a help line, a forecast row. The code expands into the
 * engine's own `\I[]`, so nothing downstream has to learn that weather exists, and no other plugin
 * needs a change to display it.
 */
J.WEATHER.Aliased.Window_Base.set('convertEscapeCharacters', Window_Base.prototype.convertEscapeCharacters);
Window_Base.prototype.convertEscapeCharacters = function(text)
{
  // handle weather replacements before the engine's own conversion sees the text.
  const converted = this.translateWeatherTextCode(text);

  // perform original logic.
  return J.WEATHER.Aliased.Window_Base.get('convertEscapeCharacters')
    .call(this, converted);
};

/**
 * Translates the weather text code into the icon and words for that weather.
 *
 * <pre>
 * Structure:
 *  \weather[TYPE, INTENSITY]
 *
 * Examples:
 *  \weather[rain, heavy]
 *  \weather[1, 3]
 *  \weather[snow]
 *  \weather[]
 *
 * Translation:
 *  the icon, name and strength of that weather - and for the empty form, of whatever is
 *  currently falling on the player.
 * </pre>
 * @param {string} text The text that may have a text code in it.
 * @returns {string} The text with any weather codes spelled out.
 */
Window_Base.prototype.translateWeatherTextCode = function(text)
{
  const config = J.WEATHER.Metadata.weatherConfig;

  return text.replace(/\\weather\[([^\]]*)]/gi, (_, rawArguments) =>
  {
    const here = WeatherDirector.current();

    return WeatherLabel.fromArguments(config, rawArguments, here);
  });
};
//endregion Window_Base