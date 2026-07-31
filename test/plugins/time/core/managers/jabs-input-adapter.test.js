//region plugins/time/core/managers/jabs-input-adapter.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The happy path- the adapter actually toggling the window- lives in the component test alongside
 * the controller that drives it. What is exercised here is the other side of the file's one branch:
 * TIME is perfectly usable without JABS installed, and in that configuration this file must decline
 * to attach anything at all rather than blowing up on a missing input adapter.
 */
describe('JABS_InputAdapter ext/time augments (direct src import)', () =>
{
  beforeEach(() =>
  {
    vi.resetModules();
  });

  describe('when JABS is absent', () =>
  {
    it('attaches no time window action to the input adapter', async () =>
    {
      // Arrange
      globalThis.J = {};
      globalThis.JABS_InputAdapter = {};

      // Act
      await import('../../../../../src/plugins/time/core/managers/JABS_InputAdapter.js');

      // Assert
      expect(globalThis.JABS_InputAdapter.performTimeWindowAction).toBeUndefined();
    });

    it('attaches no permission check to the input adapter', async () =>
    {
      // Arrange
      globalThis.J = {};
      globalThis.JABS_InputAdapter = {};

      // Act
      await import('../../../../../src/plugins/time/core/managers/JABS_InputAdapter.js');

      // Assert
      expect(globalThis.JABS_InputAdapter._canPerformTimeWindowAction).toBeUndefined();
    });
  });

  describe('when JABS is present', () =>
  {
    it('attaches the time window action to the input adapter', async () =>
    {
      // Arrange
      globalThis.J = { ABS: {} };
      globalThis.JABS_InputAdapter = {};

      // Act
      await import('../../../../../src/plugins/time/core/managers/JABS_InputAdapter.js');

      // Assert: the adapter starts bare, so the key only exists because the patch attached it.
      expect(Object.keys(globalThis.JABS_InputAdapter)).toContain('performTimeWindowAction');
    });

    it('declines to toggle the window when the action is not permitted', async () =>
    {
      // Arrange
      globalThis.J = { ABS: {} };
      globalThis.JABS_InputAdapter = {};
      await import('../../../../../src/plugins/time/core/managers/JABS_InputAdapter.js');
      globalThis.JABS_InputAdapter._canPerformTimeWindowAction = () => false;
      globalThis.$gameTime = { toggleMapWindow: vi.fn() };

      // Act
      globalThis.JABS_InputAdapter.performTimeWindowAction();

      // Assert
      expect(globalThis.$gameTime.toggleMapWindow).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/time/core/managers/jabs-input-adapter.test.js
