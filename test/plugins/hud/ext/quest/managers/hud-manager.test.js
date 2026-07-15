//region plugins/hud/ext/quest/managers/hud-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('HudManager ext/quest augments (direct src import)', () =>
{
  let HudManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { HUD: { EXT: { QUEST: { Aliased: { HudManager: new Map() } } } } };

    function StubHudManager()
    {
    }

    StubHudManager.prototype.initMembers = vi.fn();
    globalThis.HudManager = StubHudManager;

    await import('../../../../../../src/plugins/hud/ext/quest/managers/HudManager.js');
    ({ HudManager } = globalThis);
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
      const manager = new HudManager();

      // Act
      manager.initMembers();

      // Assert
      expect(globalThis.J.HUD.EXT.QUEST.Aliased.HudManager.get('initMembers')).toHaveBeenCalled();
    });

    it('flags a quest refresh as needed', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      manager.initMembers();

      // Assert
      expect(manager.needsQuestRefresh()).toEqual(true);
    });
  });

  describe('requestQuestRefresh', () =>
  {
    it('flags a quest refresh as needed', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager._needsQuestRefresh = false;

      // Act
      manager.requestQuestRefresh();

      // Assert
      expect(manager.needsQuestRefresh()).toEqual(true);
    });
  });

  describe('acknowledgeQuestRefresh', () =>
  {
    it('clears the quest refresh flag', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager._needsQuestRefresh = true;

      // Act
      manager.acknowledgeQuestRefresh();

      // Assert
      expect(manager.needsQuestRefresh()).toEqual(false);
    });
  });

  describe('needsQuestRefresh', () =>
  {
    it('returns the current refresh flag value', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager._needsQuestRefresh = true;

      // Act
      const result = manager.needsQuestRefresh();

      // Assert
      expect(result).toEqual(true);
    });
  });
});
//endregion plugins/hud/ext/quest/managers/hud-manager.test.js
