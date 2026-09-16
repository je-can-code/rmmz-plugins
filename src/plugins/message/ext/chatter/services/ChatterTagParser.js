//region ChatterTagParser
import ChatterProfile from '../__models/ChatterProfile.js';

/**
 * Turns an event page's comment tags into a chatter profile.
 *
 * A page is full of other plugins' comments, and most pages carry no chatter tags at all, so a
 * comment this does not recognise is skipped rather than reported. There is no such thing as a
 * malformed chatter tag reaching here: a tag that does not match its pattern was never a chatter
 * tag, and one that does match cannot be out of shape.
 *
 * The three layers of a profile are assembled here because this is the only place that sees all of
 * them at once - the defaults in {@link ChatterProfile}, the project's `chatter` section of
 * `data/config.message.json`, and finally the page.
 */
class ChatterTagParser
{
  /**
   * The section of J-Message's external config that chatter's project defaults live in.
   * @type {string}
   */
  static ConfigSection = 'chatter';

  /**
   * Builds the fully-resolved profile an event page is asking for.
   * @param {string[]} comments The text of every parsable comment on the page.
   * @returns {ChatterProfile}
   */
  static parseComments(comments)
  {
    const configured = ChatterTagParser.configuredProfile();
    const values = ChatterTagParser.readValues(comments);

    return ChatterProfile.overriddenBy(configured, values);
  }

  /**
   * The profile this project considers ordinary, before any page has had its say.
   * @returns {ChatterProfile}
   */
  static configuredProfile()
  {
    const section = MessageConfig.section(ChatterTagParser.ConfigSection);

    return ChatterProfile.fromValues(section);
  }

  /**
   * Reads every chatter tag out of a page's comments.
   *
   * Lines accumulate and everything else is a single answer, so a page repeating `<chatterRadius:>`
   * is settled by whichever one was written last. That is a authoring mistake rather than a feature,
   * and taking the last one is the same thing the editor's own fields do.
   * @param {string[]} comments The text of every parsable comment on the page.
   * @returns {object} Whatever the page authored, with anything it did not mention absent.
   */
  static readValues(comments)
  {
    const values = { lines: [] };

    comments.forEach(comment =>
    {
      ChatterTagParser.readLine(comment, values);
      ChatterTagParser.readNumbers(comment, values);
      ChatterTagParser.readPosition(comment, values);
    }, this);

    return values;
  }

  /**
   * Adds a comment's line to the pool, if it carries one.
   * @param {string} comment The comment text to read.
   * @param {object} values The values being assembled.
   */
  static readLine(comment, values)
  {
    const match = J.MESSAGE.EXT.CHATTER.RegExp.Chatter.exec(comment);

    // by far the common case: this comment belongs to some other plugin, or to nobody.
    if (match === null) return;

    const [ , line ] = match;
    values.lines.push(line);
  }

  /**
   * Reads whichever of the numeric knobs a comment carries.
   * @param {string} comment The comment text to read.
   * @param {object} values The values being assembled.
   */
  static readNumbers(comment, values)
  {
    const patterns = J.MESSAGE.EXT.CHATTER.RegExp;

    const numericTags = [
      [ patterns.ChatterRadius, 'radius' ],
      [ patterns.ChatterCooldown, 'cooldown' ],
      [ patterns.ChatterDelay, 'delay' ],
      [ patterns.ChatterDuration, 'duration' ],
      [ patterns.ChatterSpeed, 'speed' ],
    ];

    numericTags.forEach(([ pattern, field ]) =>
    {
      const match = pattern.exec(comment);

      if (match === null) return;

      const [ , amount ] = match;
      values[field] = Number(amount);
    });
  }

  /**
   * Reads which side of the character their chatter sits on, if a comment says.
   * @param {string} comment The comment text to read.
   * @param {object} values The values being assembled.
   */
  static readPosition(comment, values)
  {
    const match = J.MESSAGE.EXT.CHATTER.RegExp.ChatterPosition.exec(comment);

    if (match === null) return;

    const [ , position ] = match;

    // the pattern is case-insensitive because an author typing `Top` meant `top`, and everything
    // downstream compares against the lowercase word.
    values.position = position.toLowerCase();
  }
}

export default ChatterTagParser;
//endregion ChatterTagParser