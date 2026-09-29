//region ClassGrowthManager
/**
 * Reads what a class contributes through J-NaturalGrowth's tags: what it grants for every level gained while
 * it is worn, and what it grants simply for being worn, which J-Classes' multipliers are measured by.
 *
 * Only the class's own note is read. Everything else the actor carries has growth tags too, but the growth
 * section answers "what does this class do", and folding in gear and states would answer a different question.
 * The formulas are evaluated for a copy of the actor standing in the class, so a formula reading the actor's
 * level or a parameter's base sees what it would see after changing.
 */
class ClassGrowthManager
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
   * Reads what a class grants for every level gained while it is worn, as the growth section the class scene
   * lists: one row per flat or percent growth, in the order the scene lists its parameters.
   *
   * A growth is earned once per level gained while the class is worn, and kept for good, so the class an actor
   * levels in shapes them in every class afterwards.
   * @param {Game_Actor} actor The actor the class is read for.
   * @param {number} classId The id of the class being read.
   * @returns {Array<{parameterKey: string, isRate: boolean, amount: number}>}
   */
  static readGrowths(actor, classId)
  {
    // every formula is read against the actor as they would be in this class.
    const preview = ClassManager.previewActor(actor, classId);

    return this.growthRows(preview, classId);
  }

  /**
   * What a class buffs a parameter by while worn, at the level multipliers are measured at: the measure a
   * parameter with no curve is given its multiplier by.
   *
   * The formula is worked out for the actor as they are, but at that level, so a buff written as a base
   * times a multiplier- `2 * a.level` against a starting class's `1 * a.level`- reads back as exactly that
   * multiplier. Anything else a formula leans on, such as the parameter's own base, reads as it is now.
   * @param {Game_Actor} actor The actor being measured.
   * @param {number} classId The id of the class being read.
   * @param {string} parameterKey The registry key of the parameter.
   * @returns {number}
   */
  static buffAtReferenceLevel(actor, classId, parameterKey)
  {
    // a parameter natural growth is not bound to has no buff to measure.
    const naturalKeys = ParameterRegistry.naturallyBoundKeys();
    if (naturalKeys.includes(parameterKey) === false) return 0;

    // the actor as they are, only at the level every multiplier is measured at.
    const atReferenceLevel = Object.create(actor, {
      level: {
        value: ClassManager.MULTIPLIER_REFERENCE_LEVEL,
      },
    });

    // the class's own flat buff, against the parameter's base as it stands.
    const { buffPlus } = ParameterRegistry.naturalBinding(parameterKey);
    const base = actor.naturalDisplayBase(parameterKey);

    return RPGManager.getResultFromNoteByRegex($dataClasses[classId], buffPlus, base, atReferenceLevel);
  }

  /**
   * Reads a class's growths for every parameter bound to natural growth.
   *
   * Only a parameter the class actually grows gets a row, so a class growing three parameters lists three
   * rather than every parameter in the game at zero.
   * @param {Game_Actor} preview The actor standing in the class.
   * @param {number} classId The id of the class being read.
   * @returns {Array<{parameterKey: string, isRate: boolean, amount: number}>}
   */
  static growthRows(preview, classId)
  {
    const dataClass = $dataClasses[classId];
    const rows = [];

    // in the order the class scene lists every parameter, so the section reads the way the parameters do.
    const parameterKeys = ClassManager.inListingOrder(ParameterRegistry.naturallyBoundKeys());
    parameterKeys
      .forEach(parameterKey =>
      {
        // the growth tags this parameter answers to, and what its formulas see as `b`.
        const { growthPlus: plusTag, growthRate: rateTag } = ParameterRegistry.naturalBinding(parameterKey);
        const base = preview.naturalDisplayBase(parameterKey);

        // a flat amount, in the numbers the status screen shows.
        const plus = RPGManager.getResultFromNoteByRegex(dataClass, plusTag, base, preview);
        if (plus !== 0)
        {
          rows.push({
            parameterKey,
            isRate: false,
            amount: plus,
          });
        }

        // a percent of the parameter's own base.
        const rate = RPGManager.getResultFromNoteByRegex(dataClass, rateTag, base, preview);
        if (rate !== 0)
        {
          rows.push({
            parameterKey,
            isRate: true,
            amount: rate,
          });
        }
      });

    return rows;
  }

  /**
   * Describes a row the way the class scene draws it: the parameter's icon and name, and the amount signed.
   *
   * A flat amount is formatted by the parameter's own definition, so a percent parameter reads as a percent
   * and a regen reads per second, exactly as it does on the status screen. A rate is always a percent of the
   * parameter's base, whatever the parameter is.
   * @param {{parameterKey: string, isRate: boolean, amount: number}} row The row to describe.
   * @returns {{iconIndex: number, label: string, value: string}}
   */
  static describe(row)
  {
    const definition = ParameterRegistry.get(row.parameterKey);

    return {
      iconIndex: definition.iconIndex(),
      label: definition.label(),
      value: this.formatAmount(definition, row),
    };
  }

  /**
   * Formats a row's amount as signed text.
   * @param {ParameterDefinition} definition The definition of the row's parameter.
   * @param {{parameterKey: string, isRate: boolean, amount: number}} row The row whose amount is formatted.
   * @returns {string}
   */
  static formatAmount(definition, row)
  {
    // a rate is a percent of the parameter's base, whatever units the parameter itself is shown in.
    if (row.isRate)
    {
      // a formula can land on floating point noise, and two decimals is the most any rate is authored in.
      const amount = Number(row.amount.toFixed(2));
      const sign = amount >= 0
        ? '+'
        : String.empty;

      return `${sign}${amount}%`;
    }

    // a flat amount arrives in display units, and the definition formats a raw difference.
    const rawAmount = row.amount / definition.displayScale();

    return definition.prettyDelta(rawAmount);
  }
}

export default ClassGrowthManager;
//endregion ClassGrowthManager