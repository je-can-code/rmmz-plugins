//region plugins/passive/core/_component/auto-apply-state-display.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../_component/fixtures/install-passive-host-globals.js';
import {
  installPassiveConditionalHostGlobals,
  setPluginContextToJPassiveConditional,
} from '../../_component/fixtures/install-passive-conditional-host-globals.js';

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
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

    setPluginContextToJPassive();
    await import('../../../../../src/plugins/passive/core/_metadata/initialization.js');

    installPassiveConditionalHostGlobals();

    setPluginContextToJPassiveConditional();
    await import('../../../../../src/plugins/passive/ext/conditional/_metadata/initialization.js');

    ({ default: AutoApplyStateDisplay } = await import('../../../../../src/plugins/passive/ext/conditional/models/AutoApplyStateDisplay.js'));

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

    it('skips a tuple with a non-positive/NaN state id', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoApplyState:[0, time, 3600]>\n<autoApplyState:[1001, time, 3600]>';

      // Act
      const lines = AutoApplyStateDisplay.collectTimeProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(1);
    });

    it('skips a tuple with a non-positive/NaN param', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoApplyState:[1001, time, 0]>\n<autoApplyState:[1002, time, 3600]>';

      // Act
      const lines = AutoApplyStateDisplay.collectTimeProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('\\state[1002]');
    });
  });

  describe('collectStandProseLines', () =>
  {
    it('ignores non-stand conditions', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoApplyState:[1001, stand, 3600]>\n<autoApplyState:[1002, time, 60]>';

      // Act
      const lines = AutoApplyStateDisplay.collectStandProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('\\state[1001]');
      expect(lines[0]).toContain('While standing still');
    });

    it('reads every stand tag on a state row', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoApplyState:[1001, stand, 3600]>\n<autoApplyState:[1010, stand, 900]>';

      // Act
      const lines = AutoApplyStateDisplay.collectStandProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(2);
    });
  });

  describe('intervalPhrase', () =>
  {
    it('formats a whole-second interval without a tilde', () =>
    {
      // Act & Assert
      expect(AutoApplyStateDisplay.intervalPhrase(120)).toBe('2 seconds');
    });

    it('formats a fractional-second interval with a rounded, tilde-prefixed value', () =>
    {
      // Act & Assert- 100 frames / 60 = 1.6666...s, rounds to 1.67.
      expect(AutoApplyStateDisplay.intervalPhrase(100)).toBe('~1.67 seconds');
    });
  });

  describe('formatStandProse', () =>
  {
    it('formats stand-condition prose with a state text code', () =>
    {
      // Act
      const prose = AutoApplyStateDisplay.formatStandProse(1001, 3600, textHelper);

      // Assert
      expect(prose).toBe('While standing still, gain \\state[1001] every \\C[6]\\*\\_60 seconds\\_\\*\\C[0].');
    });
  });
});
//endregion plugins/passive/core/_component/auto-apply-state-display.test.js
