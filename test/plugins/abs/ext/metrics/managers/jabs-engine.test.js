//region plugins/abs/ext/metrics/managers/jabs-engine.test.js
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

describe('J-ABS-Metrics JABS_Engine hooks (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js').default} */
  let JABS_MetricsManager;

  /** @type {{handleDefeatedEnemy: Function, handleDefeatedPlayer: Function,
   *  postExecuteSkillEffects: Function, executeMapAction: Function}} */
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

    // J-ABS's own JABS_Engine ships in a different bundle and is a bare global by the time this
    // extension's script runs. Only the four methods this plugin aliases need to exist- what those
    // methods do is J-ABS's business and is deliberately not modelled here.
    originals = {
      handleDefeatedEnemy: vi.fn(),
      handleDefeatedAlly: vi.fn(),
      handleDefeatedPlayer: vi.fn(),
      postExecuteSkillEffects: vi.fn(),
      executeMapAction: vi.fn(),
    };

    function JABS_Engine() {}

    Object.assign(JABS_Engine.prototype, originals);
    globalThis.JABS_Engine = JABS_Engine;

    const managerModule = await import(
      '../../../../../../src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js');
    JABS_MetricsManager = managerModule.default;

    // the file under test- aliases the four stand-ins above.
    await import('../../../../../../src/plugins/abs/ext/metrics/managers/JABS_Engine.js');
  });

  afterEach(() =>
  {
    // spies land on a bare-global-ish static class shared across this file, so they are restored
    // per test rather than trusted to a blanket restoreAllMocks.
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  /**
   * Builds the target a skill effect lands on.
   * @param {boolean} isEnemy Whether the target counts as an enemy.
   * @param {boolean} isActor Whether the target counts as an actor.
   * @returns {object} The JABS battler stand-in.
   */
  function buildTarget(isEnemy, isActor)
  {
    return {
      isEnemy: () => isEnemy,
      isActor: () => isActor,
    };
  }

  describe('handleDefeatedEnemy', () =>
  {
    it('records the defeat after letting the original run', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackDefeatedEnemy = vi.spyOn(JABS_MetricsManager, 'trackDefeatedEnemy')
        .mockImplementation(() => {});
      const defeatedTarget = { isInanimate: () => false };
      const caster = {};

      // Act
      engine.handleDefeatedEnemy(defeatedTarget, caster);

      // Assert
      expect(originals.handleDefeatedEnemy).toHaveBeenCalledWith(defeatedTarget, caster);
      expect(trackDefeatedEnemy).toHaveBeenCalledWith(defeatedTarget);
    });
  });

  describe('handleDefeatedAlly', () =>
  {
    it('records the downing after letting the original run', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackDefeatedAlly = vi.spyOn(JABS_MetricsManager, 'trackDefeatedAlly')
        .mockImplementation(() => {});
      const defeatedAlly = {};

      // Act
      engine.handleDefeatedAlly(defeatedAlly);

      // Assert
      expect(originals.handleDefeatedAlly).toHaveBeenCalledWith(defeatedAlly);
      expect(trackDefeatedAlly).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDefeatedPlayer', () =>
  {
    it('records the death before letting the original run', () =>
    {
      // Arrange- handling a defeated player is what triggers the game over, so the tally has to be
      // taken first; the invocation order is the whole point of this test.
      const engine = new globalThis.JABS_Engine();
      const order = [];
      const trackDefeatedPlayer = vi.spyOn(JABS_MetricsManager, 'trackDefeatedPlayer')
        .mockImplementation(() => order.push('tracked'));
      originals.handleDefeatedPlayer.mockImplementation(() => order.push('original'));

      // Act
      engine.handleDefeatedPlayer();

      // Assert
      expect(trackDefeatedPlayer).toHaveBeenCalledTimes(1);
      expect(order).toEqual([ 'tracked', 'original' ]);
    });
  });

  describe('postExecuteSkillEffects', () =>
  {
    it('records a hit on an enemy as attack data', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackAttackData = vi.spyOn(JABS_MetricsManager, 'trackAttackData')
        .mockImplementation(() => {});
      const target = buildTarget(true, false);
      const action = { getCooldownType: () => globalThis.JABS_Button.Mainhand };

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(originals.postExecuteSkillEffects).toHaveBeenCalledWith(action, target);
      expect(trackAttackData).toHaveBeenCalledWith(target);
    });

    it('records a hit on an actor as defensive data', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackDefensiveData = vi.spyOn(JABS_MetricsManager, 'trackDefensiveData')
        .mockImplementation(() => {});
      const target = buildTarget(false, true);

      // Act
      engine.postExecuteSkillEffects({ getCooldownType: () => globalThis.JABS_Button.Mainhand }, target);

      // Assert
      expect(trackDefensiveData).toHaveBeenCalledWith(target);
    });

    it('records nothing against a target that is neither an enemy nor an actor', () =>
    {
      // Arrange- the records board only knows those two sides, so anything else on the map falls
      // through both arms rather than being counted as one of them by default.
      const engine = new globalThis.JABS_Engine();
      const trackAttackData = vi.spyOn(JABS_MetricsManager, 'trackAttackData')
        .mockImplementation(() => {});
      const trackDefensiveData = vi.spyOn(JABS_MetricsManager, 'trackDefensiveData')
        .mockImplementation(() => {});

      // Act
      engine.postExecuteSkillEffects(
        { getCooldownType: () => globalThis.JABS_Button.Mainhand },
        buildTarget(false, false));

      // Assert- the original still ran, which proves the tool guard is not what produced this.
      expect(originals.postExecuteSkillEffects).toHaveBeenCalledTimes(1);
      expect(trackAttackData).not.toHaveBeenCalled();
      expect(trackDefensiveData).not.toHaveBeenCalled();
    });

    it('records nothing for a tool, which is neither an attack nor a defense', () =>
    {
      // Arrange- the target is an enemy, so the only thing that can suppress the attack tally here
      // is the tool guard itself.
      const engine = new globalThis.JABS_Engine();
      const trackAttackData = vi.spyOn(JABS_MetricsManager, 'trackAttackData')
        .mockImplementation(() => {});

      // Act
      engine.postExecuteSkillEffects(
        { getCooldownType: () => globalThis.JABS_Button.Tool },
        buildTarget(true, false));

      // Assert
      expect(originals.postExecuteSkillEffects).toHaveBeenCalledTimes(1);
      expect(trackAttackData).not.toHaveBeenCalled();
    });
  });

  describe('executeMapAction', () =>
  {
    it('records the action when the player is the one casting', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackActionData = vi.spyOn(JABS_MetricsManager, 'trackActionData')
        .mockImplementation(() => {});
      const caster = { isPlayer: () => true };
      const action = { getCooldownType: () => globalThis.JABS_Button.Mainhand };

      // Act
      engine.executeMapAction(caster, action, 1, 2);

      // Assert
      expect(originals.executeMapAction).toHaveBeenCalledWith(caster, action, 1, 2);
      expect(trackActionData).toHaveBeenCalledWith(action);
    });

    it('records nothing when an ally or an enemy is the one casting', () =>
    {
      // Arrange- these are metrics about how the player plays; an ally swinging a mainhand must not
      // land on the player's own tally.
      const engine = new globalThis.JABS_Engine();
      const trackActionData = vi.spyOn(JABS_MetricsManager, 'trackActionData')
        .mockImplementation(() => {});

      // Act
      engine.executeMapAction(
        { isPlayer: () => false },
        { getCooldownType: () => globalThis.JABS_Button.Mainhand },
        1,
        2);

      // Assert- the original still ran, so the action genuinely executed and merely went uncounted.
      expect(originals.executeMapAction).toHaveBeenCalledTimes(1);
      expect(trackActionData).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/metrics/managers/jabs-engine.test.js