//region RemoveStateOnMoveDisplay
/**
 * Player-facing prose for {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveStateOnMove} tuples.
 */
class RemoveStateOnMoveDisplay
{
  /**
   * Formats one parsed removeStateOnMove tuple as drawTextEx prose.
   * @param {number} stateId Database state id to be stripped on movement.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string}
   */
  static formatProse(stateId, window)
  {
    const stateName = window.colorizeText(14, window.boldenText(`\\state[${stateId}]`));

    return `Moving removes all ${stateName} stacks.`;
  }

  /**
   * Builds drawTextEx prose lines for every removeStateOnMove tag on a database row.
   * @param {RPG_BaseItem} dataRow State, skill, or equip row bearing notes.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string[]}
   */
  static collectProseLines(dataRow, window)
  {
    if (!J.PASSIVE || !J.PASSIVE.EXT || !J.PASSIVE.EXT.CONDITIONAL) return [];

    const tuples = RPGManager.getArraysFromNotesByRegex(
      dataRow,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveStateOnMove
    );

    const lines = [];

    for (const tuple of tuples)
    {
      const stateId = Number(tuple[0]);

      if (Number.isNaN(stateId) || stateId < 1) continue;

      lines.push(RemoveStateOnMoveDisplay.formatProse(stateId, window));
    }

    return lines;
  }
}

export default RemoveStateOnMoveDisplay;
//endregion RemoveStateOnMoveDisplay
