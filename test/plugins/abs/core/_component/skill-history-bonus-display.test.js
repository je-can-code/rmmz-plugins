//region plugins/abs/core/_component/skill-history-bonus-display.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Minimal {@link Window_Base} text helpers for formatter tests.
 * @returns {{ boldenText: Function, colorizeText: Function }}
 */
function createTextHelperStub()
{
  return {
    boldenText(text)
    {
      return `\\*${text}\\*`;
    },
    italicizeText(text)
    {
      return `\\_${text}\\_`;
    },
    colorizeText(colorIndex, text)
    {
      return `\\C[${colorIndex}]${text}\\C[0]`;
    },
  };
}

describe('SkillHistoryBonusDisplay (direct src import)', () =>
{
  let textHelper;
  let SkillHistoryBonusDisplay;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    ({ default: SkillHistoryBonusDisplay } = await import('../../../../../src/plugins/abs/core/models/SkillHistoryBonusDisplay.js'));

    globalThis.$dataSystem = { skillTypes: [ null, 'Magic', 'Special' ] };
    textHelper = createTextHelperStub();
  });

  describe('parseGeneralBracket', () =>
  {
    it('parses a [typeId, window, pct, countMode] bracket', () =>
    {
      // Arrange
      const bracket = '[0, 6, 4, unique]';

      // Act
      const result = SkillHistoryBonusDisplay.parseGeneralBracket(bracket);

      // Assert
      expect(result).toEqual({ typeId: 0, window: 6, pct: 4, countMode: 'unique' });
    });
  });

  describe('formatGeneralProse', () =>
  {
    it('formats tier-1 skillHistoryBonus prose with bold color highlights', () =>
    {
      // Arrange
      const parsed = SkillHistoryBonusDisplay.parseGeneralBracket('[0, 6, 4, unique]');

      // Act
      const prose = SkillHistoryBonusDisplay.formatGeneralProse(parsed, textHelper);

      // Assert
      expect(prose).toBe(
        'For each \\C[1]\\*\\_unique skill\\_\\*\\C[0] \\C[2]\\*\\_of any type\\_\\*\\C[0] executed in the last \\C[6]\\*\\_6 seconds\\_\\*\\C[0], gain \\C[3]\\*\\_+4%\\_\\*\\C[0] damage.',
      );
    });

    it('resolves a non-zero skill type name from System.json', () =>
    {
      // Arrange
      const parsed = SkillHistoryBonusDisplay.parseGeneralBracket('[1, 12, 10, streak]');

      // Act
      const prose = SkillHistoryBonusDisplay.formatGeneralProse(parsed, textHelper);

      // Assert
      expect(prose).toContain('\\C[2]\\*\\_of Magic type\\_\\*\\C[0]');
    });

    it('formats the "streak" count mode as "repeated skill"', () =>
    {
      // Arrange
      const parsed = SkillHistoryBonusDisplay.parseGeneralBracket('[1, 12, 10, streak]');

      // Act
      const prose = SkillHistoryBonusDisplay.formatGeneralProse(parsed, textHelper);

      // Assert
      expect(prose).toContain('\\C[1]\\*\\_repeated skill\\_\\*\\C[0]');
    });

    it('formats the window in seconds', () =>
    {
      // Arrange
      const parsed = SkillHistoryBonusDisplay.parseGeneralBracket('[1, 12, 10, streak]');

      // Act
      const prose = SkillHistoryBonusDisplay.formatGeneralProse(parsed, textHelper);

      // Assert
      expect(prose).toContain('\\C[6]\\*\\_12 seconds\\_\\*\\C[0]');
    });
  });

  describe('collectGeneralProseLines', () =>
  {
    it('reads every skillHistoryBonus tag on a state row', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<skillHistoryBonus:[0, 6, 4, unique]>\n<skillHistoryBonus:[2, 9, 10, all]>';

      // Act
      const lines = SkillHistoryBonusDisplay.collectGeneralProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(2);
    });

    it('formats the first tag\'s "unique" count mode', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<skillHistoryBonus:[0, 6, 4, unique]>\n<skillHistoryBonus:[2, 9, 10, all]>';

      // Act
      const lines = SkillHistoryBonusDisplay.collectGeneralProseLines(state, textHelper);

      // Assert
      expect(lines[0]).toContain('\\*\\_unique skill\\_\\*');
    });

    it('formats the second tag\'s "all" count mode and its skill type name', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<skillHistoryBonus:[0, 6, 4, unique]>\n<skillHistoryBonus:[2, 9, 10, all]>';

      // Act
      const lines = SkillHistoryBonusDisplay.collectGeneralProseLines(state, textHelper);

      // Assert
      expect(lines[1]).toContain('\\*\\_any skill\\_\\*');
      expect(lines[1]).toContain('\\*\\_of Special type\\_\\*');
    });
  });
});
//endregion plugins/abs/core/_component/skill-history-bonus-display.test.js
