//region plugins/passive/core/auto-apply-state-display.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../fixtures/install-passive-host-globals.js';
import {
  installPassiveConditionalHostGlobals,
  setPluginContextToJPassiveConditional,
} from '../fixtures/install-passive-conditional-host-globals.js';

/**
 * Minimal {@link Window_Base} text helpers for formatter tests.
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

describe('AutoApplyStateDisplay (direct src import)', () =>
{
  let textHelper;
  let AutoApplyStateDisplay;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    setPluginContextToJPassive();
    await import('../../../../src/plugins/passive/core/_metadata/initialization.js');

    installPassiveConditionalHostGlobals();

    setPluginContextToJPassiveConditional();
    await import('../../../../src/plugins/passive/ext/conditional/_metadata/initialization.js');

    ({ default: AutoApplyStateDisplay } = await import('../../../../src/plugins/passive/ext/conditional/models/AutoApplyStateDisplay.js'));

    textHelper = createTextHelperStub();
  });

  describe('formatTimeProse', () =>
  {
    it('formats time-based autoApplyState prose with a state text code', () =>
    {
      // Arrange
      const stateId = 1001;
      const frames = 3600;

      // Act
      const prose = AutoApplyStateDisplay.formatTimeProse(stateId, frames, textHelper);

      // Assert
      expect(prose).toBe('Every \\C[6]\\*\\_60 seconds\\_\\*\\C[0], gain \\state[1001].');
    });
  });

  describe('collectTimeProseLines', () =>
  {
    it('ignores non-time conditions', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoApplyState:[1001, time, 3600]>\n<autoApplyState:[1002, hpDmg, 60]>';

      // Act
      const lines = AutoApplyStateDisplay.collectTimeProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('\\state[1001]');
      expect(lines[0]).not.toContain('\\state[1002]');
    });

    it('reads every time tag on a state row', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoApplyState:[1001, time, 3600]>\n<autoApplyState:[1010, time, 900]>';

      // Act
      const lines = AutoApplyStateDisplay.collectTimeProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(2);
      expect(lines[0]).toContain('\\state[1001]');
      expect(lines[1]).toContain('\\state[1010]');
      expect(lines[1]).toContain('\\*\\_15 seconds\\_\\*');
    });
  });
});
//endregion plugins/passive/core/auto-apply-state-display.test.js
