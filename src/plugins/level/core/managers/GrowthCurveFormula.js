//region GrowthCurveFormula
/**
 * A helper class for reading and evaluating `<paramGrowthCurve:[formula]>` note tags authored on a
 * class via the jmz-data-editor's Classes board. When present, these formulas are the source of truth
 * for a base parameter's value beyond level 99 (levels 1-99 stay driven by the class's baked
 * `params[paramId]` array) — replacing {@link Game_Temp.buildBeyondMaxDataForClass}'s prior
 * slope-extrapolation guess with the actual authored curve for any class/param that has one tagged.
 */
// eslint-disable-next-line no-unused-vars
class GrowthCurveFormula
{
  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Reads the `<paramGrowthCurve:[formula]>` tag for the given base paramId off a class, if present.
   * @param {RPG_Class} dataClass The class database object to read the tag from.
   * @param {number} paramId The base paramId (0-7) to look up the tag for.
   * @returns {string|null} The raw formula text, or null if the class has no tag for this param.
   */
  static readForClass(dataClass, paramId)
  {
    // grab the regex for this specific base parameter's growth curve tag.
    const structure = J.LEVEL.RegExp.GrowthCurveByParamId.at(paramId);

    // ask RPGManager for the captured formula text, using nullIfEmpty so an untagged class/param
    // falls straight through to the caller's existing slope-extrapolation fallback.
    return RPGManager.getStringFromNoteByRegex(dataClass, structure, true);
  }

  /**
   * Reads the `<mtpGrowthCurve:[formula]>` tag off a class, if present.
   * @param {RPG_Class} dataClass The class database object to read the tag from.
   * @returns {string|null} The raw formula text, or null if the class has no MTP growth curve tag.
   */
  static readMtpForClass(dataClass)
  {
    return RPGManager.getStringFromNoteByRegex(dataClass, J.LEVEL.RegExp.MtpGrowthCurve, true);
  }

  /**
   * Evaluates a growth curve formula at a given level.
   *
   * Mirrors jmz-data-editor's own `GrowthParser.evaluateFormula` so the editor's preview and the
   * runtime's actual result stay identical for the same formula and level.
   * @param {string} formula The formula text captured from a `GrowthCurve` tag.
   * @param {number} level The level to evaluate the formula at.
   * @returns {number} The evaluated result, or 0 if the formula fails to evaluate.
   */
  static evaluate(formula, level)
  {
    // build the minimal context the formula can reference: `a.level`.
    const a = { level };

    try
    {
      // compile and immediately invoke the formula against the level context.
      const evaluator = new Function('a', `return (${formula})`);
      return evaluator(a);
    }
    catch (error)
    {
      // a malformed formula shouldn't crash the game- log it and fall back to zero.
      console.error(`Error evaluating growth curve formula: ${formula}`, error);
      return 0;
    }
  }
}

// publish for prototype aliases and tests that expect a global GrowthCurveFormula symbol after the Vite ship bundles.
export default GrowthCurveFormula;

//endregion GrowthCurveFormula
