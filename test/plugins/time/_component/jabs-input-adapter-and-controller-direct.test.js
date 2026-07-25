//region plugins/time/_component/jabs-input-adapter-and-controller-direct.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from './fixtures/install-time-host-globals.js';

/**
 * Direct-import counterpart to jabs-input-adapter.test.js and jabs-input-controller.test.js. See
 * event-page-and-choice-conditionals-direct.test.js for the full explanation of why direct import is used
 * here instead of vm.Script bundle evaluation.
 */
describe('J-TIME JABS_InputAdapter + JABS_StandardController time window action (direct src import)', () =>
{
  let Game_Time;

  beforeAll(async () =>
  {
    vi.resetModules();

    installTimeHostGlobals();

    await import('../../../../src/plugins/time/core/_metadata/initialization.js');

    ({ default: Game_Time } = await import('../../../../src/plugins/time/core/_models/Game_Time.js'));

    // patches globalThis.JABS_InputAdapter directly, no vm involved.
    await import('../../../../src/plugins/time/core/managers/JABS_InputAdapter.js');

    // patches globalThis.JABS_StandardController.prototype directly, no vm involved.
    await import('../../../../src/plugins/time/core/objects/JABS_InputController.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    globalThis.$gameTime = new Game_Time();
  });

  describe('JABS_InputAdapter.performTimeWindowAction', () =>
  {
    it('toggles the time window visibility when allowed', () =>
    {
      // Arrange
      const startingVisibility = globalThis.$gameTime.isMapWindowVisible();

      // Act
      globalThis.JABS_InputAdapter.performTimeWindowAction();

      // Assert
      expect(globalThis.$gameTime.isMapWindowVisible()).toBe(!startingVisibility);
    });
  });

  describe('JABS_InputAdapter._canPerformTimeWindowAction', () =>
  {
    it('currently always allows the toggle', () =>
    {
      // Arrange & Act
      const result = globalThis.JABS_InputAdapter._canPerformTimeWindowAction();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('JABS_StandardController.isTimeWindowActionTriggered', () =>
  {
    it('returns false when the L3 input is not triggered', () =>
    {
      // Arrange
      const controller = new globalThis.JABS_StandardController();
      globalThis.Input.isTriggered = () => false;

      // Act
      const result = controller.isTimeWindowActionTriggered();

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when the L3 input is triggered', () =>
    {
      // Arrange
      const controller = new globalThis.JABS_StandardController();
      globalThis.Input.isTriggered = symbol => symbol === globalThis.J.ABS.EXT.INPUT.Symbols.L3;

      // Act
      const result = controller.isTimeWindowActionTriggered();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('JABS_StandardController.performTimeWindowAction', () =>
  {
    it('delegates to JABS_InputAdapter and toggles the time window visibility', () =>
    {
      // Arrange
      const controller = new globalThis.JABS_StandardController();
      const startingVisibility = globalThis.$gameTime.isMapWindowVisible();

      // Act
      controller.performTimeWindowAction();

      // Assert
      expect(globalThis.$gameTime.isMapWindowVisible()).toBe(!startingVisibility);
    });
  });

  describe('JABS_StandardController.updateTimeWindowAction', () =>
  {
    it('does not perform the action when the input is not triggered', () =>
    {
      // Arrange
      const controller = new globalThis.JABS_StandardController();
      const startingVisibility = globalThis.$gameTime.isMapWindowVisible();
      globalThis.Input.isTriggered = () => false;

      // Act
      controller.updateTimeWindowAction();

      // Assert
      expect(globalThis.$gameTime.isMapWindowVisible()).toBe(startingVisibility);
    });

    it('performs the action when the input is triggered', () =>
    {
      // Arrange
      const controller = new globalThis.JABS_StandardController();
      const startingVisibility = globalThis.$gameTime.isMapWindowVisible();
      globalThis.Input.isTriggered = symbol => symbol === globalThis.J.ABS.EXT.INPUT.Symbols.L3;

      // Act
      controller.updateTimeWindowAction();

      // Assert
      expect(globalThis.$gameTime.isMapWindowVisible()).toBe(!startingVisibility);
    });
  });

  describe('JABS_StandardController.update', () =>
  {
    it('calls through to the aliased original and then updateTimeWindowAction', () =>
    {
      // Arrange
      const controller = new globalThis.JABS_StandardController();
      const startingVisibility = globalThis.$gameTime.isMapWindowVisible();
      globalThis.Input.isTriggered = symbol => symbol === globalThis.J.ABS.EXT.INPUT.Symbols.L3;

      // Act
      controller.update();

      // Assert
      expect(globalThis.$gameTime.isMapWindowVisible()).toBe(!startingVisibility);
    });
  });
});
//endregion plugins/time/_component/jabs-input-adapter-and-controller-direct.test.js
