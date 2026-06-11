//region plugins/abs/core/skill-history-bonus-display.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Minimal {@link Window_Base} text helpers for formatter tests.
 *
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

describe('SkillHistoryBonusDisplay (J-ABS)', () =>
{
  let sandbox;
  let textHelper;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
    sandbox.$dataSystem = { skillTypes: [ null, 'Magic', 'Special' ] };
    textHelper = createTextHelperStub();
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('formats Ghosty tier-1 skillHistoryBonus prose with bold color highlights', () =>
  {
    const parsed = sandbox.SkillHistoryBonusDisplay.parseGeneralBracket('[0, 6, 4, unique]');

    expect(parsed).toEqual({ typeId: 0, window: 6, pct: 4, countMode: 'unique' });
    expect(sandbox.SkillHistoryBonusDisplay.formatGeneralProse(parsed, textHelper))
      .toBe(
        'For each \\C[1]\\*\\_unique skill\\_\\*\\C[0] \\C[2]\\*\\_of any type\\_\\*\\C[0] executed in the last \\C[6]\\*\\_6 seconds\\_\\*\\C[0], gain \\C[3]\\*\\_+4%\\_\\*\\C[0] damage.',
      );
  });

  it('resolves non-zero skill type names from System.json', () =>
  {
    const parsed = sandbox.SkillHistoryBonusDisplay.parseGeneralBracket('[1, 12, 10, streak]');
    const prose = sandbox.SkillHistoryBonusDisplay.formatGeneralProse(parsed, textHelper);

    expect(prose).toContain('\\C[2]\\*\\_of Magic type\\_\\*\\C[0]');
    expect(prose).toContain('\\C[1]\\*\\_repeated skill\\_\\*\\C[0]');
    expect(prose).toContain('\\C[6]\\*\\_12 seconds\\_\\*\\C[0]');
  });

  it('collectGeneralProseLines reads every tag on a state row', () =>
  {
    const state = Object.create(sandbox.RPG_State.prototype);
    state.note = '<skillHistoryBonus:[0, 6, 4, unique]>\n<skillHistoryBonus:[2, 9, 10, all]>';

    const lines = sandbox.SkillHistoryBonusDisplay.collectGeneralProseLines(state, textHelper);

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('\\*\\_unique skill\\_\\*');
    expect(lines[1]).toContain('\\*\\_any skill\\_\\*');
    expect(lines[1]).toContain('\\*\\_of Special type\\_\\*');
  });
});
//endregion plugins/abs/core/skill-history-bonus-display.test.js