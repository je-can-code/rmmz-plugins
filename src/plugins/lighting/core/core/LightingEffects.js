//region LightingEffects
/**
 * The names a light's animation can go by, and what each one is for.
 *
 * These are three different *kinds* of behaviour rather than three tunings of one. A flame is never
 * still; a crystal is perfectly regular; a failing tube is mostly fine and then is not. Trying to
 * express any of them with the others' curve produces something that reads as neither.
 *
 * They are mutually exclusive on purpose. A light animates one way, and a tag asking for two would
 * be asking for a shape that does not exist.
 */
class LightingEffects
{
  /**
   * A light that does not animate at all, which is what a light is unless it says otherwise.
   * @type {string}
   */
  static STEADY = 'steady';

  /**
   * The restless, never-repeating dance of a flame.
   * @type {string}
   */
  static FLICKER = 'flicker';

  /**
   * A clean, perfectly regular swell and fade. Something charged rather than burning.
   * @type {string}
   */
  static PULSE = 'pulse';

  /**
   * Long stretches of nothing happening, broken by a stutter. Something failing.
   * @type {string}
   */
  static GLITCH = 'glitch';

  /**
   * Every effect an author can actually write in a tag.
   *
   * `steady` is deliberately absent: it is what a light does when it says nothing, and offering it
   * as a keyword would invite the question of what `<light:[4, steady, flicker]>` means.
   * @returns {string[]}
   */
  static authorable()
  {
    return [
      LightingEffects.FLICKER,
      LightingEffects.PULSE,
      LightingEffects.GLITCH, ];
  }

  /**
   * Determines whether a word from a tag names an effect.
   * @param {string} word The word to judge.
   * @returns {boolean}
   */
  static isEffect(word)
  {
    return LightingEffects.authorable()
      .includes(word);
  }
}

export default LightingEffects;
//endregion LightingEffects