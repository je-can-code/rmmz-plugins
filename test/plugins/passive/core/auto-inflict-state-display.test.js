//region plugins/passive/core/auto-inflict-state-display.test.js
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

describe('AutoInflictStateDisplay (direct src import)', () =>
{
  let textHelper;
  let AutoInflictStateDisplay;

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

    ({ default: AutoInflictStateDisplay } = await import('../../../../src/plugins/passive/ext/conditional/models/AutoInflictStateDisplay.js'));

    textHelper = createTextHelperStub();
  });

  describe('formatNegativeInflictProse', () =>
  {
    it('omits the cooldown clause when cooldown is 0', () =>
    {
      // Arrange
      const stateId = 70;
      const frames = 0;

      // Act
      const prose = AutoInflictStateDisplay.formatNegativeInflictProse(stateId, frames, textHelper);

      // Assert
      expect(prose).toBe(
        'Whenever this battler inflicts a negative state on a foe, also inflict \\C[6]\\*\\_\\state[70]\\_\\*\\C[0].',
      );
    });
  });

  describe('formatPositiveInflictProse', () =>
  {
    it('includes a cooldown clause when cooldown is positive', () =>
    {
      // Arrange
      const stateId = 71;
      const frames = 3600;

      // Act
      const prose = AutoInflictStateDisplay.formatPositiveInflictProse(stateId, frames, textHelper);

      // Assert
      expect(prose).toContain('Whenever this battler inflicts a positive state on someone, also inflict');
      expect(prose).toContain('\\state[71]');
      expect(prose).toContain('(at most once every');
      expect(prose).toContain('60 seconds');
    });
  });

  describe('formatAnyInflictProse', () =>
  {
    it('formats prose regardless of polarity', () =>
    {
      // Arrange
      const stateId = 72;
      const frames = 0;

      // Act
      const prose = AutoInflictStateDisplay.formatAnyInflictProse(stateId, frames, textHelper);

      // Assert
      expect(prose).toBe(
        'Whenever this battler inflicts any state on someone, also inflict \\C[6]\\*\\_\\state[72]\\_\\*\\C[0].',
      );
    });
  });

  describe('collectProseLines', () =>
  {
    it('reads a negaStateInflicted tag and describes it as negative', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoInflictState:[70, negaStateInflicted, 0]>';

      // Act
      const lines = AutoInflictStateDisplay.collectProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('negative state');
      expect(lines[0]).toContain('\\state[70]');
    });

    it('reads a posiStateInflicted tag and describes it as positive', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoInflictState:[71, posiStateInflicted, 60]>';

      // Act
      const lines = AutoInflictStateDisplay.collectProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('positive state');
      expect(lines[0]).toContain('\\state[71]');
    });

    it('reads an anyStateInflicted tag and describes it as any', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoInflictState:[72, anyStateInflicted, 0]>';

      // Act
      const lines = AutoInflictStateDisplay.collectProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('any state');
      expect(lines[0]).toContain('\\state[72]');
    });

    it('reads all three tags on the same row independently, in order', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoInflictState:[70, negaStateInflicted, 0]>\n'
        + '<autoInflictState:[71, posiStateInflicted, 60]>\n'
        + '<autoInflictState:[72, anyStateInflicted, 0]>';

      // Act
      const lines = AutoInflictStateDisplay.collectProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(3);
    });

    it('ignores tags with an unrecognized condition', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<autoInflictState:[70, someOtherCondition, 0]>';

      // Act
      const lines = AutoInflictStateDisplay.collectProseLines(state, textHelper);

      // Assert
      expect(lines.length).toBe(0);
    });
  });
});
//endregion plugins/passive/core/auto-inflict-state-display.test.js
