//region plugins/regions/ext/skills/managers/_component/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine regions/ext/skills augments (direct src import)', () =>
{
  let JABS_Engine;
  let fakeCoreData;
  let builderStub;

  beforeAll(async () =>
  {
    vi.resetModules();

    function StubJabsEngine()
    {
    }

    globalThis.JABS_Engine = StubJabsEngine;

    fakeCoreData = { battlerId: null, dummy: null };
    builderStub = {
      setBattlerId: vi.fn(function(id)
      {
        fakeCoreData.battlerId = id;
        return this;
      }),
      isDummy: vi.fn(function(isFriendly)
      {
        fakeCoreData.dummy = isFriendly;
        return this;
      }),
      build: vi.fn(() => fakeCoreData),
    };
    globalThis.JABS_BattlerCoreData = { Builder: vi.fn(() => builderStub) };
    globalThis.JABS_Battler = vi.fn(function(character, enemy, coreData)
    {
      this.character = character;
      this.enemy = enemy;
      this.coreData = coreData;
    });

    await import('../../../../../../../src/plugins/regions/ext/skills/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gamePlayer = { name: 'player' };
    globalThis.$gameEnemies = { enemy: vi.fn(id => ({ id })) };
  });

  describe('getMapDamageBattler', () =>
  {
    it('returns the currently stored map damage battler', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const sentinel = {};
      engine.mapDamageBattler = sentinel;

      // Act
      const result = engine.getMapDamageBattler();

      // Assert
      expect(result).toBe(sentinel);
    });

    it('defaults to null before any battler has been set', () =>
    {
      // Arrange
      const engine = new JABS_Engine();

      // Act
      const result = engine.getMapDamageBattler();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('setMapDamageBattler', () =>
  {
    it('builds a dummy JABS_Battler for the given enemy id and stores it', () =>
    {
      // Arrange
      const engine = new JABS_Engine();

      // Act
      engine.setMapDamageBattler(7, true);

      // Assert
      expect(builderStub.setBattlerId).toHaveBeenCalledWith(7);
      expect(builderStub.isDummy).toHaveBeenCalledWith(true);
      expect(globalThis.$gameEnemies.enemy).toHaveBeenCalledWith(7);
      expect(globalThis.JABS_Battler).toHaveBeenCalledWith(
        globalThis.$gamePlayer,
        { id: 7 },
        fakeCoreData);
      expect(engine.mapDamageBattler).toBeInstanceOf(globalThis.JABS_Battler);
    });
  });
});
//endregion plugins/regions/ext/skills/managers/_component/jabs-engine.test.js
