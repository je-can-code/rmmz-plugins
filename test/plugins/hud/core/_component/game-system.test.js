//region plugins/hud/core/_component/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_System hud augments (direct src import)', () =>
{
  let Game_System;
  let originalInitialize;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalInitialize = vi.fn();

    globalThis.J = { HUD: { Aliased: { Game_System: new Map() } } };

    function StubGameSystem()
    {
    }

    StubGameSystem.prototype.initMembers = originalInitialize;
    globalThis.Game_System = StubGameSystem;

    await import('../../../../../src/plugins/hud/core/objects/Game_System.js');
    ({ Game_System } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('initMembers', () =>
  {
    it('calls through to original logic and seeds default hud visibility flags', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.initMembers();

      // Assert
      expect(originalInitialize).toHaveBeenCalled();
      expect(system._j._hud._hudVisible).toBe(true);
      expect(system._j._hud._alliesVisible).toBe(true);
    });

    it('does not clobber an existing _j namespace already initialized by another plugin', () =>
    {
      // Arrange
      const system = new Game_System();
      system._j = { someOtherPlugin: true };

      // Act
      system.initMembers();

      // Assert
      expect(system._j.someOtherPlugin).toBe(true);
      expect(system._j._hud._hudVisible).toBe(true);
    });
  });

  describe('setHudVisible / getHudVisible', () =>
  {
    it('round-trips the hud visibility flag', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      system.setHudVisible(false);

      // Assert
      expect(system.getHudVisible()).toBe(false);
    });
  });

  describe('setHudAlliesVisible / getHudAlliesVisible', () =>
  {
    it('round-trips the hud allies visibility flag', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      system.setHudAlliesVisible(false);

      // Assert
      expect(system.getHudAlliesVisible()).toBe(false);
    });
  });
});
//endregion plugins/hud/core/_component/game-system.test.js
