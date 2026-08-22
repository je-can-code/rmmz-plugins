//region plugins/abs/ext/metrics/objects/game-action.test.js
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import {
  installJabsButtonStub,
  installMetricsExternalConfig,
  setPluginContextToJabsMetrics,
} from '../_component/fixtures/install-abs-metrics-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Metrics Game_Action hooks (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js').default} */
  let JABS_MetricsManager;

  /** @type {{onParry: Function, onGuard: Function, calculateGuardDamageReduction: Function}} */
  let originals;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Metrics', {});
    installMetricsExternalConfig();
    installJabsButtonStub();

    setPluginContextToJabsMetrics();
    await import('../../../../../../src/plugins/abs/ext/metrics/_metadata/initialization.js');

    // J-ABS defines these three on the engine's own Game_Action; only the surface this plugin
    // aliases needs to exist, and what the originals do is J-ABS's business.
    originals = {
      onParry: vi.fn(),
      onGuard: vi.fn(),
      calculateGuardDamageReduction: vi.fn(() => 30),
    };

    function Game_Action() {}

    Object.assign(Game_Action.prototype, originals);
    globalThis.Game_Action = Game_Action;

    const managerModule = await import(
      '../../../../../../src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js');
    JABS_MetricsManager = managerModule.default;

    // the file under test- aliases the three stand-ins above.
    await import('../../../../../../src/plugins/abs/ext/metrics/objects/Game_Action.js');
  });

  afterEach(() =>
  {
    // spies land on a static class shared across this file, so they are restored per test rather
    // than trusted to a blanket restoreAllMocks at the end of the run.
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  /**
   * Builds the battler on the receiving end of the guard or parry.
   * @param {boolean} isActor Which side of the fight the battler is on.
   * @returns {object} The JABS battler stand-in.
   */
  function buildBattler(isActor)
  {
    return { isActor: () => isActor };
  }

  describe('onParry', () =>
  {
    it('records a precise parry for an actor after letting the original run', () =>
    {
      // Arrange- reaching this hook at all is what proves the parry was deliberate, since the
      // passive roll writes its outcome without ever coming through here.
      const action = new globalThis.Game_Action();
      const trackPreciseParry = vi.spyOn(JABS_MetricsManager, 'trackPreciseParry')
        .mockImplementation(() => {});
      const battler = buildBattler(true);

      // Act
      action.onParry(battler);

      // Assert
      expect(originals.onParry).toHaveBeenCalledWith(battler);
      expect(trackPreciseParry).toHaveBeenCalledTimes(1);
    });

    it('records nothing when an enemy is the one parrying', () =>
    {
      // Arrange- enemies parry too, and their defensive record is not the one being kept.
      const action = new globalThis.Game_Action();
      const trackPreciseParry = vi.spyOn(JABS_MetricsManager, 'trackPreciseParry')
        .mockImplementation(() => {});

      // Act
      action.onParry(buildBattler(false));

      // Assert- the original still ran, so the parry genuinely happened and merely went uncounted.
      expect(originals.onParry).toHaveBeenCalledTimes(1);
      expect(trackPreciseParry).not.toHaveBeenCalled();
    });
  });

  describe('onGuard', () =>
  {
    it('records a guarded hit for an actor after letting the original run', () =>
    {
      // Arrange
      const action = new globalThis.Game_Action();
      const trackGuardedHit = vi.spyOn(JABS_MetricsManager, 'trackGuardedHit')
        .mockImplementation(() => {});
      const battler = buildBattler(true);

      // Act
      action.onGuard(battler);

      // Assert
      expect(originals.onGuard).toHaveBeenCalledWith(battler);
      expect(trackGuardedHit).toHaveBeenCalledTimes(1);
    });

    it('records nothing when an enemy is the one guarding', () =>
    {
      // Arrange
      const action = new globalThis.Game_Action();
      const trackGuardedHit = vi.spyOn(JABS_MetricsManager, 'trackGuardedHit')
        .mockImplementation(() => {});

      // Act
      action.onGuard(buildBattler(false));

      // Assert
      expect(originals.onGuard).toHaveBeenCalledTimes(1);
      expect(trackGuardedHit).not.toHaveBeenCalled();
    });
  });

  describe('calculateGuardDamageReduction', () =>
  {
    it('hands back exactly what the original computed', () =>
    {
      // Arrange- this is a damage calculation in a live combat path, so the observation must not
      // alter what the engine receives.
      const action = new globalThis.Game_Action();
      vi.spyOn(JABS_MetricsManager, 'trackDamagePrevented')
        .mockImplementation(() => {});

      // Act
      const reduced = action.calculateGuardDamageReduction(buildBattler(true), 100);

      // Assert
      expect(reduced).toBe(30);
      expect(originals.calculateGuardDamageReduction).toHaveBeenCalledTimes(1);
    });

    it('reports both figures for an actor, since only here do both still exist', () =>
    {
      // Arrange
      const action = new globalThis.Game_Action();
      const trackDamagePrevented = vi.spyOn(JABS_MetricsManager, 'trackDamagePrevented')
        .mockImplementation(() => {});

      // Act
      action.calculateGuardDamageReduction(buildBattler(true), 100);

      // Assert- the original before-figure and the original's return, in that order.
      expect(trackDamagePrevented).toHaveBeenCalledWith(100, 30);
    });

    it('records nothing when an enemy is the one guarding', () =>
    {
      // Arrange
      const action = new globalThis.Game_Action();
      const trackDamagePrevented = vi.spyOn(JABS_MetricsManager, 'trackDamagePrevented')
        .mockImplementation(() => {});

      // Act
      const reduced = action.calculateGuardDamageReduction(buildBattler(false), 100);

      // Assert- the reduction still happened, so the enemy's guard worked and merely went unrecorded.
      expect(reduced).toBe(30);
      expect(trackDamagePrevented).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/metrics/objects/game-action.test.js