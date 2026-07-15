//region plugins/map/core/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine ext/map augments (direct src import)', () =>
{
  let JABS_Engine;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { MAP: { Aliased: { JABS_Engine: new Map() } } };

    function StubJABS_Engine()
    {
    }

    StubJABS_Engine.prototype.addLootDropToMap = vi.fn();
    globalThis.JABS_Engine = StubJABS_Engine;

    await import('../../../../../src/plugins/map/core/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$dataMap = { events: {} };
  });

  function makeLootEvent(eventId)
  {
    return {
      eventId: () => eventId,
      refresh: vi.fn(),
    };
  }

  describe('addLootDropToMap', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.MAP.Aliased.JABS_Engine.get('addLootDropToMap')
        .mockReturnValue(null);
      const item = {};

      // Act
      engine.addLootDropToMap(1, 2, item);

      // Assert
      expect(globalThis.J.MAP.Aliased.JABS_Engine.get('addLootDropToMap')).toHaveBeenCalledWith(1, 2, item);
    });

    it('returns the original result untouched when no loot event was created', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.MAP.Aliased.JABS_Engine.get('addLootDropToMap')
        .mockReturnValue(null);

      // Act
      const result = engine.addLootDropToMap(1, 2, {});

      // Assert
      expect(result).toEqual(null);
    });

    it('returns the loot event untouched when its data event is missing from $dataMap', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const lootEvent = makeLootEvent(7);
      globalThis.J.MAP.Aliased.JABS_Engine.get('addLootDropToMap')
        .mockReturnValue(lootEvent);
      globalThis.$dataMap.events = {};

      // Act
      const result = engine.addLootDropToMap(1, 2, {});

      // Assert
      expect(result).toBe(lootEvent);
      expect(lootEvent.refresh).not.toHaveBeenCalled();
    });

    it('injects the minimap loot comment into the first page and refreshes the event', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const lootEvent = makeLootEvent(7);
      globalThis.J.MAP.Aliased.JABS_Engine.get('addLootDropToMap')
        .mockReturnValue(lootEvent);
      const firstPage = { list: [ { code: 111, indent: 0, parameters: [] } ] };
      globalThis.$dataMap.events = { 7: { pages: [ firstPage ] } };

      // Act
      const result = engine.addLootDropToMap(1, 2, {});

      // Assert
      expect(firstPage.list[0]).toEqual({ code: 108, indent: 0, parameters: [ '<mm:loot>' ] });
      expect(lootEvent.refresh).toHaveBeenCalled();
      expect(result).toBe(lootEvent);
    });
  });
});
//endregion plugins/map/core/managers/jabs-engine.test.js
