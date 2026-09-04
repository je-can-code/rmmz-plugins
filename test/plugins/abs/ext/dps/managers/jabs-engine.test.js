//region plugins/abs/ext/dps/managers/jabs-engine.test.js
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import {
  buildAction,
  buildResult,
  buildTarget,
  installCombatFlag,
  installJabsButtonStub,
  setPluginContextToJabsDps,
} from '../_component/fixtures/install-abs-dps-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Dps JABS_Engine hooks (direct src import)', () =>
{
  /** @type {{initialize: Function, update: Function, postExecuteSkillEffects: Function}} */
  let originals;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Dps', { rollingWindowSeconds: '5' });
    installJabsButtonStub();
    installCombatFlag(false);

    setPluginContextToJabsDps();
    await import('../../../../../../src/plugins/abs/ext/dps/_metadata/initialization.js');

    // J-ABS's own JABS_Engine ships in a different bundle and is a bare global by the time this
    // extension's script runs. Only the three methods this plugin aliases need to exist.
    originals = {
      initialize: vi.fn(),
      update: vi.fn(),
      postExecuteSkillEffects: vi.fn(),
    };

    function JABS_Engine() {}

    Object.assign(JABS_Engine.prototype, originals);
    globalThis.JABS_Engine = JABS_Engine;

    // the file under test- aliases the three stand-ins above.
    await import('../../../../../../src/plugins/abs/ext/dps/managers/JABS_Engine.js');
  });

  afterEach(() =>
  {
    vi.clearAllMocks();
  });

  /**
   * Builds an engine that has been through the aliased initialize.
   * @param {boolean} [isMapTransfer] Whether the initialization is from a map transfer.
   * @returns {object} The initialized engine.
   */
  function buildEngine(isMapTransfer = false)
  {
    const engine = new globalThis.JABS_Engine();
    engine.initialize(isMapTransfer);

    return engine;
  }

  describe('initialize', () =>
  {
    it('lets the original initialization run', () =>
    {
      // Arrange & Act
      buildEngine();

      // Assert
      expect(originals.initialize).toHaveBeenCalledTimes(1);
    });

    it('seeds a tracker built with the configured rolling window', () =>
    {
      // Arrange & Act
      const engine = buildEngine();

      // Assert- five seconds, expressed in the frames the tracker measures in.
      expect(engine.dpsTracker()
        .rollingWindowFrames()).toBe(300);
    });

    it('carries the existing tracker across a map transfer', () =>
    {
      // Arrange- a tracker with a fight already recorded on it.
      const engine = buildEngine();
      const tracker = engine.dpsTracker();
      tracker.recordHit('jerald', 12, 500, false);

      // Act
      engine.initialize(true);

      // Assert- chasing something across a map edge must not erase the fight in progress.
      expect(engine.dpsTracker()).toBe(tracker);
    });

    it('builds a tracker on a map transfer that has none to carry', () =>
    {
      // Arrange- initialize defaults to being a map transfer, so the very first one takes this
      // path with nothing yet on the engine to carry forward.
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.initialize(true);

      // Assert
      expect(engine.dpsTracker()
        .rollingWindowFrames()).toBe(300);
    });

    it('builds a fresh tracker when the game is not transferring maps', () =>
    {
      // Arrange
      const engine = buildEngine();
      const tracker = engine.dpsTracker();

      // Act
      engine.initialize(false);

      // Assert
      expect(engine.dpsTracker()).not.toBe(tracker);
    });
  });

  describe('update', () =>
  {
    it('lets the original update run', () =>
    {
      // Arrange
      const engine = buildEngine();

      // Act
      engine.update();

      // Assert
      expect(originals.update).toHaveBeenCalledTimes(1);
    });

    it('advances the tracker', () =>
    {
      // Arrange
      const engine = buildEngine();
      const spy = vi.spyOn(engine.dpsTracker(), 'update');

      // Act
      engine.update();

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);

      // the spy sits on an instance shared with nothing, but restore it explicitly regardless.
      spy.mockRestore();
    });
  });

  describe('postExecuteSkillEffects', () =>
  {
    it('lets the original effect application run', () =>
    {
      // Arrange
      const engine = buildEngine();
      const action = buildAction('Mainhand', 'jerald', true, 12);
      const target = buildTarget(true, false, buildResult(200));

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(originals.postExecuteSkillEffects).toHaveBeenCalledTimes(1);
    });

    it('offers the landed hit to the tracker', () =>
    {
      // Arrange
      const engine = buildEngine();
      const action = buildAction('Mainhand', 'jerald', true, 12);
      const target = buildTarget(true, false, buildResult(200));

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert- the tracker made the judgement and recorded it.
      expect(engine.dpsTracker()
        .currentDamageBy('jerald')).toBe(200);
    });
  });
});
//endregion plugins/abs/ext/dps/managers/jabs-engine.test.js