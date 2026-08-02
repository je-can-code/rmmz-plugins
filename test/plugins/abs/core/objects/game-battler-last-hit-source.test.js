//region plugins/abs/core/objects/game-battler-last-hit-source.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance for last-hit-source tests.
 * @returns {object}
 */
function buildBattler()
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  return battler;
}

describe('J-ABS Game_Battler last-hit-source tracking (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  describe('getLastHitType / getLastHitSource', () =>
  {
    it('returns null for both before anything has ever hit the battler', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.getLastHitType()).toBeNull();
      expect(battler.getLastHitSource()).toBeNull();
    });

    it('reflects a skill hit after setLastHitSource records one', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setLastHitSource('skill', 'caster-uuid', 12);

      // Assert
      expect(battler.getLastHitType()).toBe('skill');
      expect(battler.getLastHitSource()).toEqual({ uuid: 'caster-uuid', id: 12 });
    });

    it('reflects a state tick after setLastHitSource records one', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setLastHitSource('state', 'source-uuid', 9);

      // Assert
      expect(battler.getLastHitType()).toBe('state');
      expect(battler.getLastHitSource()).toEqual({ uuid: 'source-uuid', id: 9 });
    });

    it('overwrites the previous record when hit again', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setLastHitSource('skill', 'first-uuid', 1);

      // Act
      battler.setLastHitSource('state', 'second-uuid', 2);

      // Assert
      expect(battler.getLastHitType()).toBe('state');
      expect(battler.getLastHitSource()).toEqual({ uuid: 'second-uuid', id: 2 });
    });
  });
});
//endregion plugins/abs/core/objects/game-battler-last-hit-source.test.js
