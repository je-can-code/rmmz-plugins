import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installMotionPassiveGlobals } from '../fixtures/install-motion-passive-globals.js';

installMotionPassiveGlobals();

/**
 * The original `refreshPassiveStates`, standing in for J-Passive's. It records what it was handed so
 * a test can prove the alias forwarded rather than swallowed.
 * @type {Array<boolean>}
 */
const refreshCalls = [];

globalThis.Game_Battler = function Game_Battler() {};
globalThis.Game_Battler.prototype.refreshPassiveStates = function(deferRefresh = false)
{
  refreshCalls.push(deferRefresh);
};

/**
 * The battlers the stubbed AI manager was handed, in order.
 * @type {Array<Object>}
 */
const trackedBattlers = [];

/**
 * Whatever arrived after the battler on each call, so a test can prove nothing extra was forwarded.
 * @type {Array<number|undefined>}
 */
const trackedExtras = [];

globalThis.JABS_AiManager.addOrUpdateBattler = function(battler, index)
{
  trackedBattlers.push(battler);
  trackedExtras.push(index);
};

const PassiveMotionCoordinator = (
  await import('../../../../../../src/plugins/motion/ext/passive/managers/PassiveMotionCoordinator.js')
).default;

await import('../../../../../../src/plugins/motion/ext/passive/objects/Game_Battler.js');
await import('../../../../../../src/plugins/motion/ext/passive/managers/JABS_AiManager.js');

describe('J-Motion-Passive hooks', () =>
{
  beforeEach(() =>
  {
    refreshCalls.length = 0;
    trackedBattlers.length = 0;
    trackedExtras.length = 0;
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  describe('Game_Battler#refreshPassiveStates', () =>
  {
    it('performs the original passive refresh', () =>
    {
      // Arrange
      const battler = new Game_Battler();
      vi.spyOn(PassiveMotionCoordinator, 'reconcile')
        .mockImplementation(() => {});

      // Act
      battler.refreshPassiveStates();

      // Assert
      expect(refreshCalls).toHaveLength(1);
    });

    it('forwards the deferral flag to the original', () =>
    {
      // Arrange
      const battler = new Game_Battler();
      vi.spyOn(PassiveMotionCoordinator, 'reconcile')
        .mockImplementation(() => {});

      // Act
      battler.refreshPassiveStates(true);

      // Assert
      expect(refreshCalls.at(0)).toBe(true);
    });

    it('reconciles the battler whose passives were rebuilt', () =>
    {
      // Arrange
      const battler = new Game_Battler();
      const reconcile = vi.spyOn(PassiveMotionCoordinator, 'reconcile')
        .mockImplementation(() => {});

      // Act
      battler.refreshPassiveStates();

      // Assert
      expect(reconcile).toHaveBeenCalledTimes(1);
      expect(reconcile.mock.calls.at(0)
        .at(0)).toBe(battler);
    });
  });

  describe('JABS_AiManager.addOrUpdateBattler', () =>
  {
    it('performs the original tracking', () =>
    {
      // Arrange
      const jabsBattler = { getBattler: () => ({ name: 'enemy' }) };
      vi.spyOn(PassiveMotionCoordinator, 'reconcile')
        .mockImplementation(() => {});

      // Act
      JABS_AiManager.addOrUpdateBattler(jabsBattler);

      // Assert
      expect(trackedBattlers.at(0)).toBe(jabsBattler);
    });

    it('reconciles the battler behind the newly-tracked jabs battler', () =>
    {
      // Arrange
      const battler = { name: 'enemy' };
      const jabsBattler = { getBattler: () => battler };
      const reconcile = vi.spyOn(PassiveMotionCoordinator, 'reconcile')
        .mockImplementation(() => {});

      // Act
      JABS_AiManager.addOrUpdateBattler(jabsBattler);

      // Assert
      expect(reconcile.mock.calls.at(0)
        .at(0)).toBe(battler);
    });

    it('forwards only the battler when reached through a forEach', () =>
    {
      // Arrange — `addOrUpdateBattlers` iterates with `forEach`, which hands every listener an index
      // and the source array behind the battler. Forwarding those on would hand an index to a method
      // that takes one argument, so the original has to see the battler and nothing else.
      const jabsBattler = { getBattler: () => ({ name: 'enemy' }) };
      vi.spyOn(PassiveMotionCoordinator, 'reconcile')
        .mockImplementation(() => {});

      // Act
      [ jabsBattler ].forEach(JABS_AiManager.addOrUpdateBattler, JABS_AiManager);

      // Assert
      expect(trackedBattlers.at(0)).toBe(jabsBattler);
      expect(trackedExtras.at(0)).toBeUndefined();
    });
  });
});
