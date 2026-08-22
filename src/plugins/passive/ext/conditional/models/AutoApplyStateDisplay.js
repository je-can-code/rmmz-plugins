//region AutoApplyStateDisplay
/**
 * Player-facing prose for {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyState} tuples.<br/>
 * Handles {@code time} and {@code stand} conditions; other kinds are skipped until a passive needs them.
 */
class AutoApplyStateDisplay
{
  /**
   * Formats map-timer param as a player-facing seconds phrase.
   * @param {number} frames Interval in frames (60 frames ≈ 1 second).
   * @returns {string}
   */
  static intervalPhrase(frames)
  {
    const sec = frames / 60;

    if (Number.isInteger(sec))
    {
      return `${sec} seconds`;
    }

    const rounded = Math.round(sec * 100) / 100;
    const display = parseFloat(rounded.toFixed(2));

    return `~${display} seconds`;
  }

  /**
   * Wraps one highlight fragment with italic, bold, and color for drawTextEx.
   * @param {Window_Base} window Host window supplying text style helpers.
   * @param {number} colorIndex Palette index for {@link Window_Base#colorizeText}.
   * @param {string} text Inner phrase to emphasize.
   * @returns {string}
   */
  static highlightPhrase(window, colorIndex, text)
  {
    return window.colorizeText(colorIndex, window.boldenText(window.italicizeText(text)));
  }

  /**
   * Formats one parsed time autoApplyState tuple as drawTextEx prose.
   * Applied state renders via {@code \\state[STATE_ID]} (J-Message icon + name).
   * @param {number} stateId Database state id from the parsed tuple.
   * @param {number} param Frame interval from the parsed tuple.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string}
   */
  static formatTimeProse(stateId, param, window)
  {
    const interval = AutoApplyStateDisplay.highlightPhrase(
      window,
      6,
      AutoApplyStateDisplay.intervalPhrase(param));

    return `Every ${interval}, gain \\state[${stateId}].`;
  }

  /**
   * Formats one parsed stand autoApplyState tuple as drawTextEx prose.
   * @param {number} stateId Database state id from the parsed tuple.
   * @param {number} param Frame interval from the parsed tuple.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string}
   */
  static formatStandProse(stateId, param, window)
  {
    const interval = AutoApplyStateDisplay.highlightPhrase(
      window,
      6,
      AutoApplyStateDisplay.intervalPhrase(param));

    return `While standing still, gain \\state[${stateId}] every ${interval}.`;
  }

  /**
   * Builds drawTextEx prose lines for every time autoApplyState tag on a database row.
   * @param {RPG_BaseItem} dataRow State, skill, or equip row bearing notes.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string[]}
   */
  static collectTimeProseLines(dataRow, window)
  {
    return AutoApplyStateDisplay.#collectProseLinesByCondition(
      dataRow, window, 'time', AutoApplyStateDisplay.formatTimeProse);
  }

  /**
   * Builds drawTextEx prose lines for every stand autoApplyState tag on a database row.
   * @param {RPG_BaseItem} dataRow State, skill, or equip row bearing notes.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string[]}
   */
  static collectStandProseLines(dataRow, window)
  {
    return AutoApplyStateDisplay.#collectProseLinesByCondition(
      dataRow, window, 'stand', AutoApplyStateDisplay.formatStandProse);
  }

  /**
   * Shared collector — filters autoApplyState tuples by condition kind and formats prose.
   * @param {RPG_BaseItem} dataRow State, skill, or equip row bearing notes.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @param {string} conditionKind The condition kind to match ('time' or 'stand').
   * @param {(stateId: number, param: number, window: Window_Base) => string} formatter Formats one
   * matching tuple into a prose line; the caller supplies the kind-specific formatter to use.
   * @returns {string[]}
   */
  static #collectProseLinesByCondition(dataRow, window, conditionKind, formatter)
  {
    const tuples = RPGManager.getArraysFromNotesByRegex(
      dataRow,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyState
    );

    const lines = [];

    for (const tuple of tuples)
    {
      const stateId = Number(tuple[0]);
      const condition = String(tuple[1]).toLowerCase();
      const param = Number(tuple[2]);

      if (Number.isNaN(stateId) || stateId < 1) continue;
      if (condition !== conditionKind) continue;
      if (Number.isNaN(param) || param < 1) continue;

      lines.push(formatter(stateId, param, window));
    }

    return lines;
  }
}

export default AutoApplyStateDisplay;
//endregion AutoApplyStateDisplay