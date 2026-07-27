//region plugins/prof/core/objects/_component/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_System prof augments (direct src import)', () =>
{
  let Game_System;
  let originalOnAfterLoad;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalOnAfterLoad = vi.fn();

    globalThis.J = {
      PROF: {
        Aliased: { Game_System: new Map() },
        Metadata: {
          conditionals: [],
          actorConditionalsMap: new Map(),
        },
      },
    };

    function StubGameSystem()
    {
    }

    StubGameSystem.prototype.onAfterLoad = originalOnAfterLoad;
    globalThis.Game_System = StubGameSystem;

    await import('../../../../../../src/plugins/prof/core/objects/Game_System.js');
    ({ Game_System } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.J.PROF.Metadata.actorConditionalsMap = new Map();
  });

  describe('onAfterLoad', () =>
  {
    it('calls through to original logic and refreshes proficiency conditionals', () =>
    {
      // Arrange
      globalThis.$gameActors = { actorIds: vi.fn().mockReturnValue([]) };
      const system = new Game_System();

      // Act
      system.onAfterLoad();

      // Assert
      expect(originalOnAfterLoad).toHaveBeenCalled();
      expect(globalThis.$gameActors.actorIds).toHaveBeenCalled();
    });
  });

  describe('updateProficienciesFromPluginMetadata', () =>
  {
    it('maps each actor to only the conditionals that include their actor id', () =>
    {
      // Arrange
      globalThis.$gameActors = { actorIds: vi.fn().mockReturnValue([ 1, 2 ]) };
      const forActor1 = { actorIds: [ 1 ] };
      const forActor2 = { actorIds: [ 2 ] };
      const forNeither = { actorIds: [ 3 ] };
      globalThis.J.PROF.Metadata.conditionals = [ forActor1, forActor2, forNeither ];
      const system = new Game_System();

      // Act
      system.updateProficienciesFromPluginMetadata();

      // Assert
      expect(globalThis.J.PROF.Metadata.actorConditionalsMap.get(1)).toEqual([ forActor1 ]);
      expect(globalThis.J.PROF.Metadata.actorConditionalsMap.get(2)).toEqual([ forActor2 ]);
    });

    it('maps an actor to an empty array when no conditionals include them', () =>
    {
      // Arrange
      globalThis.$gameActors = { actorIds: vi.fn().mockReturnValue([ 9 ]) };
      globalThis.J.PROF.Metadata.conditionals = [];
      const system = new Game_System();

      // Act
      system.updateProficienciesFromPluginMetadata();

      // Assert
      expect(globalThis.J.PROF.Metadata.actorConditionalsMap.get(9)).toEqual([]);
    });
  });
});
//endregion plugins/prof/core/objects/_component/game-system.test.js
