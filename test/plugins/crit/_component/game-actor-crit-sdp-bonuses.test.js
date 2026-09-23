//region plugins/crit/_component/game-actor-crit-sdp-bonuses.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installCritHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJCrit,
} from './fixtures/install-crit-host-globals.js';

/**
 * An actor's SDP panels contribute to cdm and ctr by registry key, and the crit math asks for them by
 * numeric crit parameter id. The translation between the two is the whole of what crit's Game_Actor
 * does, so a swapped key would silently hand one stat's panel bonuses to the other.
 */
describe('J-CriticalFactors Game_Actor SDP bonuses (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCritHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    setPluginContextToJCrit();
    await import('../../../../src/plugins/crit/core/_metadata/initialization.js');

    await import('../../../../src/plugins/crit/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/crit/core/objects/Game_Actor.js');
  });

  /**
   * @returns {object}
   */
  function buildActor()
  {
    const actor = new globalThis.Game_Actor();
    actor.getSdpBonusForParameterKey = () => 0;
    actor.initMembers();
    return actor;
  }

  describe('critSdpBonuses', () =>
  {
    it('resolves the "cdm" parameter key for critParamId 0', () =>
    {
      // Arrange
      const actor = buildActor();
      const getSdpBonusForParameterKey = vi.fn(() => 42);
      actor.getSdpBonusForParameterKey = getSdpBonusForParameterKey;

      // Act & Assert
      expect(actor.critSdpBonuses(0, 0.5)).toBe(42);
      expect(getSdpBonusForParameterKey).toHaveBeenCalledWith('cdm', 0.5);
    });

    it('resolves the "ctr" parameter key for any non-zero critParamId', () =>
    {
      // Arrange
      const actor = buildActor();
      const getSdpBonusForParameterKey = vi.fn(() => 13);
      actor.getSdpBonusForParameterKey = getSdpBonusForParameterKey;

      // Act & Assert
      expect(actor.critSdpBonuses(1, 0.5)).toBe(13);
      expect(getSdpBonusForParameterKey).toHaveBeenCalledWith('ctr', 0.5);
    });
  });
});
//endregion plugins/crit/_component/game-actor-crit-sdp-bonuses.test.js
