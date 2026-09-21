//region WeatherMapper
import WeatherConditional from './../_models/WeatherConditional.js';

/**
 * Turns a page comment into the weather requirement it declares.
 *
 * **Tags name what is on screen, not what the sky is doing.** A creature that comes out on clear
 * summer nights is tagged `fireflies`, because fireflies are what a clear summer night looks like
 * where the player is standing - and because that is the vocabulary `presetIds` already
 * enumerates and the weather variable already reports. An author should never meet two dialects
 * for one thing.
 *
 * Names and numbers are both accepted, matching how `<timeOfDayPage:>` reads. Numbers are resolved
 * against the same `presetIds` and `intensityIds` blocks the variable mirror uses, so a tag and a
 * conditional branch written against the variable can never disagree.
 */
class WeatherMapper
{
  /**
   * The kinds of weather requirement a comment can declare, in the order they are tested.
   *
   * Order is not load-bearing here - unlike J-TIME's table, no tag name is a prefix of another
   * once the captures are stripped - but the list is kept in one place for the same reason: a new
   * requirement is a row rather than another branch in the parser.
   * @type {{key: string, map: function(string, RegExp): WeatherConditional}[]}
   */
  static ConditionalKinds = [
    {
      key: 'WeatherTypePage',
      map: (comment, regex) => WeatherMapper.typeToConditional(comment, regex),
    },
    {
      key: 'WeatherIntensityRangePage',
      map: (comment, regex) => WeatherMapper.intensityRangeToConditional(comment, regex),
    },
    {
      key: 'WeatherIntensityPage',
      map: (comment, regex) => WeatherMapper.intensityToConditional(comment, regex),
    },
  ];

  /**
   * Whether a comment declares a weather requirement at all.
   * @param {string} comment The comment being examined.
   * @returns {boolean}
   */
  static isWeatherComment(comment)
  {
    return WeatherMapper.ConditionalKinds.some(kind => J.WEATHER.EXT.TIME.RegExp[kind.key].test(comment));
  }

  /**
   * Parses a comment into the requirement it declares.
   *
   * The regex table is read per call rather than captured when this class is defined, because the
   * table is populated during plugin bootstrap.
   * @param {string} comment The comment to parse.
   * @returns {?WeatherConditional} The requirement, or null when the comment declares none. Null is
   * meaningful: the caller distinguishes an unparsed tag from a parsed one and reports it.
   */
  static toConditional(comment)
  {
    const kind = WeatherMapper.ConditionalKinds.find(
      candidate => J.WEATHER.EXT.TIME.RegExp[candidate.key].test(comment));

    if (kind === undefined) return null;

    return kind.map(comment, J.WEATHER.EXT.TIME.RegExp[kind.key]);
  }

  /**
   * Builds a requirement on the look being drawn.
   * @param {string} comment The comment being parsed.
   * @param {RegExp} regex The pattern that matched it.
   * @returns {WeatherConditional}
   */
  static typeToConditional(comment, regex)
  {
    const [ , token ] = regex.exec(comment);

    return WeatherConditional.forType(WeatherMapper.typeIdOf(token));
  }

  /**
   * Builds a requirement on the strength being drawn.
   * @param {string} comment The comment being parsed.
   * @param {RegExp} regex The pattern that matched it.
   * @returns {WeatherConditional}
   */
  static intensityToConditional(comment, regex)
  {
    const [ , token ] = regex.exec(comment);

    return WeatherConditional.forIntensity(WeatherMapper.intensityIdOf(token));
  }

  /**
   * Builds a requirement that the strength fall within a span.
   * @param {string} comment The comment being parsed.
   * @param {RegExp} regex The pattern that matched it.
   * @returns {WeatherConditional}
   */
  static intensityRangeToConditional(comment, regex)
  {
    const [ , from, to ] = regex.exec(comment);

    return WeatherConditional.forIntensityRange(
      WeatherMapper.intensityIdOf(from),
      WeatherMapper.intensityIdOf(to));
  }

  /**
   * The declared id of a look, written as either its name or its number.
   * @param {string} token What the author typed.
   * @returns {number}
   */
  static typeIdOf(token)
  {
    const asNumber = parseInt(token);

    if (Number.isNaN(asNumber) === false) return asNumber;

    return WeatherVariables.typeIdFor(J.WEATHER.Metadata.weatherConfig, token);
  }

  /**
   * The declared id of a strength, written as either its name or its number.
   * @param {string} token What the author typed.
   * @returns {number}
   */
  static intensityIdOf(token)
  {
    const asNumber = parseInt(token);

    if (Number.isNaN(asNumber) === false) return asNumber;

    return WeatherVariables.intensityIdFor(J.WEATHER.Metadata.weatherConfig, token);
  }
}

export default WeatherMapper;
//endregion WeatherMapper