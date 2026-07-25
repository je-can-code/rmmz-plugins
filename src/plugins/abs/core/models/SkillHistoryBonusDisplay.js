//region SkillHistoryBonusDisplay
/**
 * Player-facing prose for {@link J.ABS.RegExp.SkillHistoryBonus} bracket tuples.<br/>
 * Shared by passive detail, CMS, and any future skill/state inspectors.
 */
class SkillHistoryBonusDisplay
{
  /**
   * Parses the bracket string from a skillHistoryBonus tag.
   * Expected format: [TYPE_ID, WINDOW, PCT, COUNT_MODE]
   * @param {string} bracket The captured bracket string, e.g. "[0, 6, 4, unique]".
   * @returns {{typeId:number, window:number, pct:number, countMode:string}|null}
   */
  static parseGeneralBracket(bracket)
  {
    const parts = bracket.replace(/[[\]]/g, '')
      .split(',')
      .map(part => part.trim());

    if (parts.length !== 4) return null;

    const typeId = Number(parts[0]);
    const window = Number(parts[1]);
    const pct = Number(parts[2]);
    const countMode = parts[3].toLowerCase();

    if (Number.isNaN(typeId) || Number.isNaN(window) || Number.isNaN(pct)) return null;

    return { typeId, window, pct, countMode };
  }

  /**
   * Maps a COUNT_MODE token to the player-facing pattern phrase.
   * @param {string} countMode One of all | unique | streak | distinct_types.
   * @returns {string}
   */
  static countModePhrase(countMode)
  {
    switch (countMode)
    {
      case 'unique':
        return 'unique skill';
      case 'all':
        return 'any skill';
      case 'streak':
        return 'repeated skill';
      case 'distinct_types':
        return 'distinct typed skill';
      default:
        return countMode;
    }
  }

  /**
   * Maps a skill-type filter id to the player-facing type scope phrase.
   * @param {number} typeId Skill type id from the tag; 0 means any type.
   * @returns {string}
   */
  static typeScopePhrase(typeId)
  {
    if (typeId === 0) return 'of any type';

    const typeName = $dataSystem.skillTypes[typeId];

    if (typeName) return `of ${typeName} type`;

    return `of type ${typeId}`;
  }

  /**
   * Formats a signed percent magnitude for drawTextEx highlight slots.
   * @param {number} pct Per-count damage bonus percent from the tag.
   * @returns {string}
   */
  static percentPhrase(pct)
  {
    const sign = pct >= 0 ? '+' : String.empty;

    return `${sign}${pct}%`;
  }

  /**
   * Formats the history window length as a player-facing duration phrase.
   * @param {number} windowSeconds Seconds looked back in the execution log.
   * @returns {string}
   */
  static durationPhrase(windowSeconds)
  {
    return `${windowSeconds} seconds`;
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
   * Formats one parsed general skillHistoryBonus tuple as drawTextEx prose.
   * Highlight colors: pattern \\C[1], type \\C[2], duration \\C[6], percent \\C[3].
   * Each highlight is italicized and bolded via {@link Window_Base} text helpers.
   * @param {{typeId:number, window:number, pct:number, countMode:string}} parsed Parsed bracket tuple.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string}
   */
  static formatGeneralProse(parsed, window)
  {
    const pattern = SkillHistoryBonusDisplay.highlightPhrase(
      window,
      1,
      SkillHistoryBonusDisplay.countModePhrase(parsed.countMode));

    const type = SkillHistoryBonusDisplay.highlightPhrase(
      window,
      2,
      SkillHistoryBonusDisplay.typeScopePhrase(parsed.typeId));

    const duration = SkillHistoryBonusDisplay.highlightPhrase(
      window,
      6,
      SkillHistoryBonusDisplay.durationPhrase(parsed.window));

    const percent = SkillHistoryBonusDisplay.highlightPhrase(
      window,
      3,
      SkillHistoryBonusDisplay.percentPhrase(parsed.pct));

    return `For each ${pattern} ${type} executed in the last ${duration}, gain ${percent} damage.`;
  }

  /**
   * Builds drawTextEx prose lines for every skillHistoryBonus tag on a database row.
   * @param {RPG_BaseItem} dataRow State, skill, or equip row bearing notes.
   * @param {Window_Base} window Host window supplying bold/color text helpers.
   * @returns {string[]}
   */
  static collectGeneralProseLines(dataRow, window)
  {
    if (!J.ABS) return [];

    // each tag's single capture is the raw bracket text, parsed by parseGeneralBracket below-
    // it is deliberately not routed through getArraysFromNotesByRegex's JSON-ish parsing.
    const rawTags = RPGManager.getStringsFromNoteByRegex(dataRow, J.ABS.RegExp.SkillHistoryBonus);

    // the capturing group in J.ABS.RegExp.SkillHistoryBonus only matches brackets already shaped
    // as [\d+, \d+, \d+, [a-z_]+], so parseGeneralBracket can never return null for a rawTag
    // sourced from here-the null-check lives on parseGeneralBracket itself for its other callers.
    return rawTags.map(rawTag => SkillHistoryBonusDisplay.formatGeneralProse(
      SkillHistoryBonusDisplay.parseGeneralBracket(rawTag),
      window));
  }
}

export default SkillHistoryBonusDisplay;
//endregion SkillHistoryBonusDisplay