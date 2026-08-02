//region plugins/sdp/core/objects/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_System ext/sdp augments (direct src import)', () =>
{
  let Game_System;

  beforeAll(async () =>
  {
    globalThis.J = { SDP: { Aliased: { Game_System: new Map() } } };

    function StubGameSystem()
    {
    }

    StubGameSystem.prototype.initMembers = vi.fn();
    globalThis.Game_System = StubGameSystem;

    await import('../../../../../src/plugins/sdp/core/objects/Game_System.js');
    ({ Game_System } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('initMembers', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.initMembers();

      // Assert
      expect(globalThis.J.SDP.Aliased.Game_System.get('initMembers')).toHaveBeenCalled();
    });

    it('initializes forced-drop debug flag to false', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.initMembers();

      // Assert
      expect(system.shouldForceDropSdp()).toEqual(false);
    });
  });

  describe('enableForcedSdpDrops/disableForcedSdpDrops/shouldForceDropSdp', () =>
  {
    it('enables the forced-drop flag', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      system.enableForcedSdpDrops();

      // Assert
      expect(system.shouldForceDropSdp()).toEqual(true);
    });

    it('disables the forced-drop flag', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();
      system.enableForcedSdpDrops();

      // Act
      system.disableForcedSdpDrops();

      // Assert
      expect(system.shouldForceDropSdp()).toEqual(false);
    });

    it('starts disabled on a freshly initialized system', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      const result = system.shouldForceDropSdp();

      // Assert
      expect(result).toEqual(false);
    });
  });
});
//endregion plugins/sdp/core/objects/game-system.test.js
