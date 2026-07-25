//region plugins/abs/ext/tools/objects/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Tools Game_System augments (direct src import)', () =>
{
  let Game_System;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { TOOLS: { Aliased: { Game_System: new Map() }, Metadata: { GrabThrowEnabled: true } } } } };

    function StubGameSystem()
    {
    }

    StubGameSystem.prototype.initMembers = vi.fn();
    globalThis.Game_System = StubGameSystem;

    await import('../../../../../../src/plugins/abs/ext/tools/objects/Game_System.js');
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
      expect(globalThis.J.ABS.EXT.TOOLS.Aliased.Game_System.get('initMembers')).toHaveBeenCalledTimes(1);
    });

    it('initializes the tools grab-throw-enabled flag from plugin metadata', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.initMembers();

      // Assert
      expect(system._j._tools._grabThrowEnabled).toBe(true);
    });
  });

  describe('isGrabThrowEnabled / setGrabThrowEnabled / toggleGrabThrowEnabled', () =>
  {
    it('isGrabThrowEnabled reflects the current flag', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act & Assert
      expect(system.isGrabThrowEnabled()).toBe(true);
    });

    it('setGrabThrowEnabled overwrites the flag', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      system.setGrabThrowEnabled(false);

      // Assert
      expect(system.isGrabThrowEnabled()).toBe(false);
    });

    it('toggleGrabThrowEnabled flips the current flag', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      system.toggleGrabThrowEnabled();

      // Assert
      expect(system.isGrabThrowEnabled()).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/tools/objects/game-system.test.js
