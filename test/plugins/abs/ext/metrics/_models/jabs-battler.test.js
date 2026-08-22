//region plugins/abs/ext/metrics/_models/jabs-battler.test.js
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

describe('J-ABS-Metrics JABS_Battler hooks (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js').default} */
  let JABS_MetricsManager;

  /** @type {{executeGuard: Function, applyToolItemEffects: Function}} */
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

    // J-ABS's own JABS_Battler ships in a different bundle and is a bare global by the time this
    // extension's script runs. Only the two methods this plugin aliases need to exist.
    originals = {
      executeGuard: vi.fn(),
      applyToolItemEffects: vi.fn(),
    };

    function JABS_Battler() {}

    Object.assign(JABS_Battler.prototype, originals);
    globalThis.JABS_Battler = JABS_Battler;

    const managerModule = await import(
      '../../../../../../src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js');
    JABS_MetricsManager = managerModule.default;

    // the file under test- aliases the two stand-ins above.
    await import('../../../../../../src/plugins/abs/ext/metrics/_models/JABS_Battler.js');
  });

  afterEach(() =>
  {
    // spies land on a static class shared across this file, so they are restored per test rather
    // than trusted to a blanket restoreAllMocks at the end of the run.
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  /**
   * Builds a battler whose guard state follows a scripted before-and-after.
   *
   * The alias measures activation by comparing `guarding()` either side of the original call rather
   * than re-deriving the conditions, so the stand-in has to be able to change its answer the way a
   * real one would.
   * @param {boolean} isPlayer Whether this battler is the one being controlled.
   * @param {boolean} guardingBefore What `guarding()` reports going in.
   * @param {boolean} guardingAfter What `guarding()` reports once the original has run.
   * @returns {object} The battler stand-in.
   */
  function buildGuardingBattler(isPlayer, guardingBefore, guardingAfter)
  {
    const battler = Object.create(globalThis.JABS_Battler.prototype);
    let guarding = guardingBefore;

    battler.isPlayer = () => isPlayer;
    battler.guarding = () => guarding;

    // the original is what flips the state in the real implementation, so the stand-in flips it from
    // the same place.
    originals.executeGuard.mockImplementation(() =>
    {
      guarding = guardingAfter;
    });

    return battler;
  }

  describe('executeGuard', () =>
  {
    it('counts the activation when a guard goes up that was not up before', () =>
    {
      // Arrange
      const battler = buildGuardingBattler(true, false, true);
      const trackGuardActivation = vi.spyOn(JABS_MetricsManager, 'trackGuardActivation')
        .mockImplementation(() => {});

      // Act
      battler.executeGuard(true);

      // Assert
      expect(originals.executeGuard).toHaveBeenCalledWith(true);
      expect(trackGuardActivation).toHaveBeenCalledTimes(1);
    });

    it('counts nothing when the guard was already up', () =>
    {
      // Arrange- holding the button does not repeatedly raise the guard, and counting per frame
      // would answer "how long did they lean on it" instead of "how often did they reach for it".
      const battler = buildGuardingBattler(true, true, true);
      const trackGuardActivation = vi.spyOn(JABS_MetricsManager, 'trackGuardActivation')
        .mockImplementation(() => {});

      // Act
      battler.executeGuard(true);

      // Assert
      expect(originals.executeGuard).toHaveBeenCalledTimes(1);
      expect(trackGuardActivation).not.toHaveBeenCalled();
    });

    it('counts nothing when the original declined to raise the guard', () =>
    {
      // Arrange- the original refuses for reasons of its own, such as having no equipped guard
      // skill, and a request that was turned down is not an activation.
      const battler = buildGuardingBattler(true, false, false);
      const trackGuardActivation = vi.spyOn(JABS_MetricsManager, 'trackGuardActivation')
        .mockImplementation(() => {});

      // Act
      battler.executeGuard(true);

      // Assert
      expect(originals.executeGuard).toHaveBeenCalledTimes(1);
      expect(trackGuardActivation).not.toHaveBeenCalled();
    });

    it('counts nothing when an ally raises their own guard', () =>
    {
      // Arrange- this is an input metric, and ally ai guards on its own schedule; the state change
      // here is a genuine activation, so the player check is the only thing suppressing it.
      const battler = buildGuardingBattler(false, false, true);
      const trackGuardActivation = vi.spyOn(JABS_MetricsManager, 'trackGuardActivation')
        .mockImplementation(() => {});

      // Act
      battler.executeGuard(true);

      // Assert
      expect(originals.executeGuard).toHaveBeenCalledTimes(1);
      expect(trackGuardActivation).not.toHaveBeenCalled();
    });
  });

  describe('applyToolItemEffects', () =>
  {
    /**
     * Builds a battler that will or will not be the controlled one.
     * @param {boolean} isPlayer Whether this battler is the one being controlled.
     * @returns {object} The battler stand-in.
     */
    function buildItemUser(isPlayer)
    {
      const battler = Object.create(globalThis.JABS_Battler.prototype);
      battler.isPlayer = () => isPlayer;

      return battler;
    }

    it('counts the item against the slot it came out of', () =>
    {
      // Arrange
      const battler = buildItemUser(true);
      const trackItemUsage = vi.spyOn(JABS_MetricsManager, 'trackItemUsage')
        .mockImplementation(() => {});

      // Act
      battler.applyToolItemEffects(7, globalThis.JABS_Button.Tool);

      // Assert
      expect(originals.applyToolItemEffects).toHaveBeenCalledWith(7, globalThis.JABS_Button.Tool, false);
      expect(trackItemUsage).toHaveBeenCalledWith(globalThis.JABS_Button.Tool);
    });

    it('counts nothing when the same path is walked to pick loot up', () =>
    {
      // Arrange- walking over a dropped potion applies its effects through this very method, and
      // picking one up is not using one.
      const battler = buildItemUser(true);
      const trackItemUsage = vi.spyOn(JABS_MetricsManager, 'trackItemUsage')
        .mockImplementation(() => {});

      // Act
      battler.applyToolItemEffects(7, globalThis.JABS_Button.Tool, true);

      // Assert- the effects still applied, so the pickup worked and merely went uncounted.
      expect(originals.applyToolItemEffects).toHaveBeenCalledTimes(1);
      expect(trackItemUsage).not.toHaveBeenCalled();
    });

    it('counts nothing when an ally uses an item of their own', () =>
    {
      // Arrange- deliberately not loot, so the player check is the only thing suppressing this.
      const battler = buildItemUser(false);
      const trackItemUsage = vi.spyOn(JABS_MetricsManager, 'trackItemUsage')
        .mockImplementation(() => {});

      // Act
      battler.applyToolItemEffects(7, globalThis.JABS_Button.UsableItem, false);

      // Assert
      expect(originals.applyToolItemEffects).toHaveBeenCalledTimes(1);
      expect(trackItemUsage).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/metrics/_models/jabs-battler.test.js