//region plugins/abs/ext/allyai/managers/jabs-input-adapter.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI JABS_InputAdapter (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // the core adapter is a static class; a bare object stands in for it, since the ally commands only
    // add methods to it.
    globalThis.JABS_InputAdapter = {};
    globalThis.J = { ABS: {} };

    await import('../../../../../../src/plugins/abs/ext/allyai/managers/JABS_InputAdapter.js');
  });

  /**
   * Builds an ally that records the orders it was given.
   * @returns {object}
   */
  const buildAlly = () => ({ chargeOnCommand: vi.fn(), pullBackOnCommand: vi.fn() });

  let jerald;
  let rupert;

  beforeEach(() =>
  {
    jerald = buildAlly();
    rupert = buildAlly();
    globalThis.$gameMap = { getFollowerBattlers: () => [ jerald, rupert ] };
    globalThis.SoundManager = { playBuzzer: vi.fn(), playCursor: vi.fn() };
  });

  afterEach(() =>
  {
    // J-Log's namespace is shared, so no case leaves it installed for the next.
    delete globalThis.J.LOG;
  });

  describe('performAllyCharge', () =>
  {
    it('orders every ally on the field to charge, and nobody to pull back', () =>
    {
      // Arrange - two allies, so an order reaching only the first would show up.

      // Act
      globalThis.JABS_InputAdapter.performAllyCharge();

      // Assert
      expect(jerald.chargeOnCommand).toHaveBeenCalledTimes(1);
      expect(rupert.chargeOnCommand).toHaveBeenCalledTimes(1);
      expect(jerald.pullBackOnCommand).not.toHaveBeenCalled();
    });
  });

  describe('performAllyPullBack', () =>
  {
    it('orders every ally on the field to pull back, and nobody to charge', () =>
    {
      // Arrange - two allies, so an order reaching only the first would show up.

      // Act
      globalThis.JABS_InputAdapter.performAllyPullBack();

      // Assert
      expect(jerald.pullBackOnCommand).toHaveBeenCalledTimes(1);
      expect(rupert.pullBackOnCommand).toHaveBeenCalledTimes(1);
      expect(jerald.chargeOnCommand).not.toHaveBeenCalled();
    });
  });

  describe('performAllyStanceSafer / performAllyStanceBolder', () =>
  {
    let stepSpy;

    beforeEach(() =>
    {
      stepSpy = vi.spyOn(globalThis.JABS_InputAdapter, 'stepAllyStance').mockImplementation(() => {});
    });

    afterEach(() =>
    {
      // a spy on a bare global leaks into later cases unless it is restored by hand.
      stepSpy.mockRestore();
    });

    it('steps the stance one rung safer', () =>
    {
      // Act
      globalThis.JABS_InputAdapter.performAllyStanceSafer();

      // Assert
      expect(stepSpy).toHaveBeenCalledWith(-1);
    });

    it('steps the stance one rung bolder', () =>
    {
      // Act
      globalThis.JABS_InputAdapter.performAllyStanceBolder();

      // Assert
      expect(stepSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('stepAllyStance', () =>
  {
    let logSpy;

    /**
     * Installs a party standing on the given stance, whose ladder answers the given key.
     * @param {string} current The key of the stance the party stands on.
     * @param {string} along The key the ladder answers for any step.
     */
    const installParty = (current, along) =>
    {
      globalThis.$gameParty = {
        getPartyStance: () => current,
        stanceKeyAlongLadder: vi.fn(() => along),
        setPartyStance: vi.fn(),
      };
    };

    beforeEach(() =>
    {
      logSpy = vi.spyOn(globalThis.JABS_InputAdapter, 'logAllyStance').mockImplementation(() => {});
    });

    afterEach(() =>
    {
      // a spy on a bare global leaks into later cases unless it is restored by hand.
      logSpy.mockRestore();
    });

    it('buzzes and changes nothing at the end of the ladder', () =>
    {
      // Arrange - the ladder answers the stance the party already has.
      installParty('meat-shield', 'meat-shield');

      // Act
      globalThis.JABS_InputAdapter.stepAllyStance(1);

      // Assert
      expect(globalThis.SoundManager.playBuzzer).toHaveBeenCalledTimes(1);
      expect(globalThis.$gameParty.setPartyStance).not.toHaveBeenCalled();
      expect(globalThis.SoundManager.playCursor).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('takes up the next stance, and lets the player hear and read it', () =>
    {
      // Arrange
      installParty('safe-support', 'bloody-wanker');

      // Act
      globalThis.JABS_InputAdapter.stepAllyStance(1);

      // Assert
      expect(globalThis.$gameParty.stanceKeyAlongLadder).toHaveBeenCalledWith(1);
      expect(globalThis.$gameParty.setPartyStance).toHaveBeenCalledWith('bloody-wanker');
      expect(globalThis.SoundManager.playCursor).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(globalThis.SoundManager.playBuzzer).not.toHaveBeenCalled();
    });
  });

  describe('logAllyStance', () =>
  {
    it('writes nothing without J-Log', () =>
    {
      // Arrange
      const addLog = vi.fn();
      globalThis.$mapLogs = { action: { addLog } };

      // Act
      globalThis.JABS_InputAdapter.logAllyStance();

      // Assert
      expect(addLog).not.toHaveBeenCalled();
    });

    it('posts the stance the party took up to the action log', () =>
    {
      // Arrange
      globalThis.J.LOG = {};
      const addLog = vi.fn();
      globalThis.$mapLogs = { action: { addLog } };
      globalThis.$gameParty = { getPartyStanceType: () => ({ name: 'Meat Shield' }) };
      globalThis.ActionLogBuilder = class
      {
        setMessage(message)
        {
          this.message = message;
          return this;
        }

        build()
        {
          return { message: this.message };
        }
      };

      // Act
      globalThis.JABS_InputAdapter.logAllyStance();

      // Assert
      expect(addLog).toHaveBeenCalledWith({ message: 'Stance set to \\C[23]Meat Shield\\C[0].' });
    });
  });
});
//endregion plugins/abs/ext/allyai/managers/jabs-input-adapter.test.js
