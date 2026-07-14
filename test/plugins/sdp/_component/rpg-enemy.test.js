//region plugins/sdp/_component/rpg-enemy.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from './fixtures/install-sdp-host-globals.js';

describe('J-SDP RPG_Enemy notes (direct src import)', () =>
{
  let RPG_Enemy;

  beforeAll(async () =>
  {
    vi.resetModules();

    installSdpHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: RPG_Enemy } = await import('../../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    globalThis.RPG_Enemy = RPG_Enemy;

    setPluginContextToJSdp();
    await import('../../../../src/plugins/sdp/core/_metadata/initialization.js');

    // patches globalThis.RPG_Enemy.prototype directly, no vm involved.
    await import('../../../../src/plugins/sdp/core/database/RPG_Enemy.js');
  });

  describe('sdpPoints', () =>
  {
    it('parses the sdpPoints tag off the note', () =>
    {
      // Arrange
      const enemy = Object.assign(Object.create(RPG_Enemy.prototype), { id: 1, note: '<sdpPoints: 12>' });

      // Act & Assert
      expect(enemy.sdpPoints).toBe(12);
    });
  });

  describe('sdpDropData', () =>
  {
    it('parses the sdp drop key from the sdpDropData tag', () =>
    {
      // Arrange
      const enemy = Object.assign(
        Object.create(RPG_Enemy.prototype),
        { id: 2, note: '<sdpDropData:[vitest_panel, 50]>' },
      );

      // Act & Assert
      expect(enemy.sdpDropKey).toBe('vitest_panel');
    });

    it('parses the sdp drop chance from the sdpDropData tag', () =>
    {
      // Arrange
      const enemy = Object.assign(
        Object.create(RPG_Enemy.prototype),
        { id: 3, note: '<sdpDropData:[vitest_panel, 50]>' },
      );

      // Act & Assert
      expect(enemy.sdpDropChance).toBe(50);
    });
  });
});
//endregion plugins/sdp/_component/rpg-enemy.test.js
