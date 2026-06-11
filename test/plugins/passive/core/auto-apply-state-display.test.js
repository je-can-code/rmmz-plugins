//region plugins/passive/core/auto-apply-state-display.test.js
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

describe('AutoApplyStateDisplay (J-Passive-Conditional)', () =>
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

  it('formats Wraith tier-1 time autoApplyState prose with state text code', () =>
  {
    expect(sandbox.AutoApplyStateDisplay.formatTimeProse(1001, 3600, textHelper))
      .toBe('Every \\C[6]\\*\\_60 seconds\\_\\*\\C[0], gain \\state[1001].');
  });

  it('collectTimeProseLines ignores non-time conditions', () =>
  {
    const state = Object.create(sandbox.RPG_State.prototype);
    state.note = '<autoApplyState:[1001, time, 3600]>\n<autoApplyState:[1002, hpDmg, 60]>';

    const lines = sandbox.AutoApplyStateDisplay.collectTimeProseLines(state, textHelper);

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('\\state[1001]');
    expect(lines[0]).not.toContain('\\state[1002]');
  });

  it('collectTimeProseLines reads every time tag on a state row', () =>
  {
    const state = Object.create(sandbox.RPG_State.prototype);
    state.note = '<autoApplyState:[1001, time, 3600]>\n<autoApplyState:[1010, time, 900]>';

    const lines = sandbox.AutoApplyStateDisplay.collectTimeProseLines(state, textHelper);

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('\\state[1001]');
    expect(lines[1]).toContain('\\state[1010]');
    expect(lines[1]).toContain('\\*\\_15 seconds\\_\\*');
  });
});
//endregion plugins/passive/core/auto-apply-state-display.test.js