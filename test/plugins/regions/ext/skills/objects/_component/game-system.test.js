//region plugins/regions/ext/skills/objects/_component/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_System regions/ext/skills augments (direct src import)', () =>
{
  let Game_System;
  let originalOnAfterLoad;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalOnAfterLoad = vi.fn();

    globalThis.J = { REGIONS: { EXT: { SKILLS: { Aliased: { Game_System: new Map() } } } } };

    function StubGameSystem()
    {
    }

    StubGameSystem.prototype.onAfterLoad = originalOnAfterLoad;
    globalThis.Game_System = StubGameSystem;

    await import('../../../../../../../src/plugins/regions/ext/skills/objects/Game_System.js');
    ({ Game_System } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    const follower = { initRegionSkillsMembers: vi.fn() };
    globalThis.$gameMap = {
      initRegionSkillsMembers: vi.fn(),
      setupRegionSkills: vi.fn(),
    };
    globalThis.$gamePlayer = {
      initRegionSkillsMembers: vi.fn(),
      followers: vi.fn()
        .mockReturnValue({ data: () => [ follower ] }),
    };
    globalThis.__follower = follower;
  });

  describe('onAfterLoad', () =>
  {
    it('calls through to original logic and refreshes region skills', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.onAfterLoad();

      // Assert
      expect(originalOnAfterLoad).toHaveBeenCalled();
      expect(globalThis.$gameMap.initRegionSkillsMembers).toHaveBeenCalled();
      expect(globalThis.$gameMap.setupRegionSkills).toHaveBeenCalled();
      expect(globalThis.$gamePlayer.initRegionSkillsMembers).toHaveBeenCalled();
      expect(globalThis.__follower.initRegionSkillsMembers).toHaveBeenCalled();
    });
  });

  describe('updateRegionSkillsAfterLoad', () =>
  {
    it('re-initializes region skills for the map, player, and every follower', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.updateRegionSkillsAfterLoad();

      // Assert
      expect(globalThis.$gameMap.initRegionSkillsMembers).toHaveBeenCalled();
      expect(globalThis.$gameMap.setupRegionSkills).toHaveBeenCalled();
      expect(globalThis.$gamePlayer.initRegionSkillsMembers).toHaveBeenCalled();
      expect(globalThis.__follower.initRegionSkillsMembers).toHaveBeenCalled();
    });
  });
});
//endregion plugins/regions/ext/skills/objects/_component/game-system.test.js
