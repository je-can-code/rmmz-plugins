//region AutoInflictStateDisplay
import AutoApplyStateDisplay from './AutoApplyStateDisplay.js';

/**
 * Player-facing prose for {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoInflictState} tuples.<br/>
 * Reuses {@link AutoApplyStateDisplay}'s generic interval/highlight formatting helpers- those are
 * plain text utilities, not specific to the self-apply tag they were originally written for.
 */
class AutoInflictStateDisplay
{
  /**
   * Formats one parsed negaStateInflicted autoInflictState tuple as drawTextEx prose.
   * @param {number} stateId Database state id from the parsed tuple (the payload to apply).
   * @param {number} cooldownFrames Minimum frames between dispatches from the parsed tuple.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string}
   */
  static formatNegativeInflictProse(stateId, cooldownFrames, window)
  {
    const payload = AutoInflictStateDisplay.#highlightState(window, stateId);

    return `Whenever this battler inflicts a negative state on a foe, also inflict ${payload}`
      + AutoInflictStateDisplay.#cooldownClause(cooldownFrames, window);
  }

  /**
   * Formats one parsed posiStateInflicted autoInflictState tuple as drawTextEx prose.
   * @param {number} stateId Database state id from the parsed tuple (the payload to apply).
   * @param {number} cooldownFrames Minimum frames between dispatches from the parsed tuple.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string}
   */
  static formatPositiveInflictProse(stateId, cooldownFrames, window)
  {
    const payload = AutoInflictStateDisplay.#highlightState(window, stateId);

    return `Whenever this battler inflicts a positive state on someone, also inflict ${payload}`
      + AutoInflictStateDisplay.#cooldownClause(cooldownFrames, window);
  }

  /**
   * Formats one parsed anyStateInflicted autoInflictState tuple as drawTextEx prose.
   * @param {number} stateId Database state id from the parsed tuple (the payload to apply).
   * @param {number} cooldownFrames Minimum frames between dispatches from the parsed tuple.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string}
   */
  static formatAnyInflictProse(stateId, cooldownFrames, window)
  {
    const payload = AutoInflictStateDisplay.#highlightState(window, stateId);

    return `Whenever this battler inflicts any state on someone, also inflict ${payload}`
      + AutoInflictStateDisplay.#cooldownClause(cooldownFrames, window);
  }

  /**
   * Wraps the payload state's inline \\state[ID] fragment in the same highlight styling used
   * elsewhere, so inflict-state prose visually matches auto-apply-state prose.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @param {number} stateId Database state id to render inline.
   * @returns {string}
   */
  static #highlightState(window, stateId)
  {
    return AutoApplyStateDisplay.highlightPhrase(window, 6, `\\state[${stateId}]`);
  }

  /**
   * Builds the trailing cooldown clause for prose, or an empty string when the rule has no
   * throttle (cooldownFrames of 0 means "every time").
   * @param {number} cooldownFrames Minimum frames between dispatches.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string}
   */
  static #cooldownClause(cooldownFrames, window)
  {
    if (cooldownFrames <= 0) return '.';

    const interval = AutoApplyStateDisplay.highlightPhrase(
      window,
      6,
      AutoApplyStateDisplay.intervalPhrase(cooldownFrames));

    return ` (at most once every ${interval}).`;
  }

  /**
   * Builds drawTextEx prose lines for every autoInflictState tag on a database row, regardless
   * of which inflict condition each tuple uses.
   * @param {RPG_BaseItem} dataRow State, skill, or equip row bearing notes.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string[]}
   */
  static collectProseLines(dataRow, window)
  {
    const tuples = RPGManager.getArraysFromNotesByRegex(
      dataRow,
      J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoInflictState,
      true
    );

    const lines = [];

    for (const tuple of tuples)
    {
      const stateId = Number(tuple[0]);
      const condition = String(tuple[1]).toLowerCase();
      const cooldownFrames = Number(tuple[2]);

      if (Number.isNaN(stateId) || stateId < 1) continue;
      if (Number.isNaN(cooldownFrames) || cooldownFrames < 0) continue;

      if (condition === 'negastateinflicted')
      {
        lines.push(AutoInflictStateDisplay.formatNegativeInflictProse(stateId, cooldownFrames, window));
      }
      else if (condition === 'posistateinflicted')
      {
        lines.push(AutoInflictStateDisplay.formatPositiveInflictProse(stateId, cooldownFrames, window));
      }
      else if (condition === 'anystateinflicted')
      {
        lines.push(AutoInflictStateDisplay.formatAnyInflictProse(stateId, cooldownFrames, window));
      }
    }

    return lines;
  }
}

export default AutoInflictStateDisplay;
//endregion AutoInflictStateDisplay
