//region plugins/passive/core/auto-inflict-state-display.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPassiveConditionalPluginVm } from '../passive-conditional-vm.js';

/**
 * Minimal {@link Window_Base} text helpers for formatter tests.
 *
 * @returns {{ boldenText: Function, italicizeText: Function, colorizeText: Function }}
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

describe('AutoInflictStateDisplay (J-Passive-Conditional)', () =>
{
  let sandbox;
  let textHelper;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPassiveConditionalPluginVm(sandbox);
    textHelper = createTextHelperStub();
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('formats negaStateInflicted prose without a cooldown clause when cooldown is 0', () =>
  {
    expect(sandbox.AutoInflictStateDisplay.formatNegativeInflictProse(70, 0, textHelper))
      .toBe('Whenever this battler inflicts a negative state on a foe, also inflict \\C[6]\\*\\_\\state[70]\\_\\*\\C[0].');
  });

  it('formats posiStateInflicted prose with a cooldown clause when cooldown is positive', () =>
  {
    const result = sandbox.AutoInflictStateDisplay.formatPositiveInflictProse(71, 3600, textHelper);

    expect(result).toContain('Whenever this battler inflicts a positive state on someone, also inflict');
    expect(result).toContain('\\state[71]');
    expect(result).toContain('(at most once every');
    expect(result).toContain('60 seconds');
  });

  it('formats anyStateInflicted prose regardless of polarity', () =>
  {
    expect(sandbox.AutoInflictStateDisplay.formatAnyInflictProse(72, 0, textHelper))
      .toBe('Whenever this battler inflicts any state on someone, also inflict \\C[6]\\*\\_\\state[72]\\_\\*\\C[0].');
  });

  it('collectProseLines reads every autoInflictState tag on a state row, by condition', () =>
  {
    const state = Object.create(sandbox.RPG_State.prototype);
    state.note = '<autoInflictState:[70, negaStateInflicted, 0]>\n'
      + '<autoInflictState:[71, posiStateInflicted, 60]>\n'
      + '<autoInflictState:[72, anyStateInflicted, 0]>';

    const lines = sandbox.AutoInflictStateDisplay.collectProseLines(state, textHelper);

    expect(lines.length).toBe(3);
    expect(lines[0]).toContain('negative state');
    expect(lines[0]).toContain('\\state[70]');
    expect(lines[1]).toContain('positive state');
    expect(lines[1]).toContain('\\state[71]');
    expect(lines[2]).toContain('any state');
    expect(lines[2]).toContain('\\state[72]');
  });

  it('collectProseLines ignores tags with an unrecognized condition', () =>
  {
    const state = Object.create(sandbox.RPG_State.prototype);
    state.note = '<autoInflictState:[70, someOtherCondition, 0]>';

    const lines = sandbox.AutoInflictStateDisplay.collectProseLines(state, textHelper);

    expect(lines.length).toBe(0);
  });
});
//endregion plugins/passive/core/auto-inflict-state-display.test.js
