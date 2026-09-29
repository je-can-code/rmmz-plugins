//region NotetagLine
/**
 * One line telling a player what one notetag does.
 *
 * A line is shaped like every effect row this ecosystem already draws: an optional icon, the words, an optional
 * short value, and which way the effect cuts for whoever carries it. The words are drawn with
 * {@link Window_Base#drawTextEx}, so they may carry text codes such as `\C[n]` or `\I[n]`.
 *
 * Most lines read as a sentence, the way a game like Hades writes its descriptions: wordy, with the parts that
 * matter standing out. The words arrive finished from {@link NotetagDescriber.line}, except for the value, whose
 * place they mark with {@link NotetagLine.ValueToken}. The value is left for the screen showing the line to color,
 * because only that screen knows whose side the line is on: the same boost that helps whoever carries it reads as
 * good on an actor's passive, and as harder on an enemy's difficulty state. A line whose words carry no token keeps
 * its value apart from them instead, the way a stat row keeps its number on the right.
 */
class NotetagLine
{
  /**
   * The ways an effect can cut for whoever carries it.
   * @type {{HELPS: number, HURTS: number, NEITHER: number}}
   */
  static Impacts = {
    HELPS: 1,
    HURTS: -1,
    NEITHER: 0,
  };

  /**
   * Where a line's value sits inside its words, for a line that reads as a sentence.
   * @type {string}
   */
  static ValueToken = '{value}';

  /**
   * The icon drawn beside the words, or 0 for none.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * The words, text codes and all, with {@link NotetagLine.ValueToken} where the value sits in a sentence.
   * @type {string}
   */
  text = String.empty;

  /**
   * The value the words describe, or empty when the words say it all.
   * @type {string}
   */
  value = String.empty;

  /**
   * Which way the effect cuts for whoever carries it: one of {@link NotetagLine.Impacts}.
   * @type {number}
   */
  holderImpact = NotetagLine.Impacts.NEITHER;

  /**
   * Builds a line from its parts.
   * @param {object} parts The line's parts; any left out keeps its default.
   * @param {number} [parts.iconIndex] The icon drawn beside the words.
   * @param {string} parts.text The words, text codes and all.
   * @param {string} [parts.value] The value the words describe.
   * @param {number} [parts.holderImpact] Which way the effect cuts for whoever carries it.
   */
  constructor({ iconIndex = 0, text, value = String.empty, holderImpact = NotetagLine.Impacts.NEITHER })
  {
    this.iconIndex = iconIndex;
    this.text = text;
    this.value = value;
    this.holderImpact = holderImpact;
  }

  /**
   * The words of a sentence with its value in place: bold, and in the color the screen showing it chose.
   * @param {string} text The words, carrying {@link NotetagLine.ValueToken}.
   * @param {string} value The value to put in its place.
   * @param {number} colorIndex The color the screen draws the value in.
   * @returns {string}
   */
  static withValueInPlace(text, value, colorIndex)
  {
    // the value stands out from the words around it: colored, and bold.
    const standout = `\\C[${colorIndex}]\\*${value}\\*\\C[0]`;

    // a function rather than a string, so a value holding a `$` is never read as a replacement pattern.
    return text.replace(NotetagLine.ValueToken, () => standout);
  }

  /**
   * Whether this line reads as a sentence with its value inside it, rather than keeping its value apart.
   * @returns {boolean}
   */
  hasValueInPlace()
  {
    return this.text.includes(NotetagLine.ValueToken);
  }
}

export default NotetagLine;
//endregion NotetagLine