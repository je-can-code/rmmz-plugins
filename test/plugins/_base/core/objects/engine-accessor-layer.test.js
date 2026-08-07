//region plugins/_base/core/objects/engine-accessor-layer.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The accessor layer J-Base lays over the engine's own `_underscore` fields.
 *
 * None of these compute anything - that is the point. The repo's standing rule is that nothing may
 * touch `this._foo` outside the constructor and the owning mutator, and these are the mutators that
 * make that rule keepable for classes J-Base does not own. Every plugin in the monorepo reads the
 * engine through this layer, so a getter pointed at the wrong field would surface as a bug in some
 * unrelated ship entirely.
 *
 * They are gathered into one file because they share a single boot: the engine prototypes have to
 * exist as bare globals before the patch files are imported, and each patch file adds a slice of the
 * same layer.
 */
describe('J-Base engine accessor layer', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    globalThis.J = {
      BASE: {
        Aliased: {
          Game_Action: new Map(),
          Game_ActionResult: new Map(),
          Game_Actor: new Map(),
          Game_Battler: new Map(),
          Game_BattlerBase: new Map(),
          Game_Character: new Map(),
          Game_CharacterBase: new Map(),
          Game_Event: new Map(),
          Game_Item: new Map(),
          Game_Map: new Map(),
          Game_Party: new Map(),
          Game_Screen: new Map(),
        },
      },
    };

    // the engine classes the layer is laid over. Each carries only what the patch files reach for
    // while being applied - the accessors themselves are added by the imports below.
    [
      'Game_Action', 'Game_ActionResult', 'Game_Actor', 'Game_Battler', 'Game_BattlerBase',
      'Game_Character', 'Game_CharacterBase', 'Game_Enemy', 'Game_Event', 'Game_Item', 'Game_Map',
      'Game_Party', 'Game_Screen',
    ].forEach(name =>
    {
      globalThis[name] = function() {};
    });

    // the aliased originals every `initialize`/`initMembers` chain calls through to.
    globalThis.Game_Map.prototype.initialize = vi.fn();
    globalThis.Game_Party.prototype.initialize = vi.fn();
    globalThis.Game_Screen.prototype.clear = vi.fn();
    globalThis.Game_ActionResult.prototype.initialize = vi.fn();
    globalThis.Game_Item.prototype.initialize = vi.fn();
    globalThis.Game_Item.prototype.setObject = vi.fn();

    await import('../../../../../src/plugins/_base/core/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Character.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Map.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Party.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Screen.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_ActionResult.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Item.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Action.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Actor.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Event.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
  });

  //region where a character is, and how long it has been there
  describe('Game_CharacterBase', () =>
  {
    /**
     * Builds a bare character carrying the engine's own underscore fields.
     * @returns {Game_CharacterBase} The character under test.
     */
    const buildCharacter = () => new globalThis.Game_CharacterBase();

    it('reads how many frames the character has been standing still', () =>
    {
      // Arrange
      const character = buildCharacter();
      character._stopCount = 42;

      // Act
      // Assert
      expect(character.stopCount())
        .toBe(42);
    });

    it('writes how many frames the character has been standing still', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      character.setStopCount(7);

      // Assert
      expect(character.stopCount())
        .toBe(7);
    });

    it('writes the x coordinate, which the engine exposes only as a bare property', () =>
    {
      // Arrange: reads go through the native `x`, so only the setter needs a home here.
      const character = buildCharacter();

      // Act
      character.setX(11);

      // Assert
      expect(character._x)
        .toBe(11);
    });

    it('writes the y coordinate', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      character.setY(13);

      // Assert
      expect(character._y)
        .toBe(13);
    });

    it('reads the smoothed real x, which lags the tile x while moving', () =>
    {
      // Arrange
      const character = buildCharacter();
      character._realX = 4.5;

      // Act
      // Assert
      expect(character.realX())
        .toBe(4.5);
    });

    it('writes the smoothed real x', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      character.setRealX(4.5);

      // Assert
      expect(character.realX())
        .toBe(4.5);
    });

    it('reads the smoothed real y', () =>
    {
      // Arrange
      const character = buildCharacter();
      character._realY = 6.25;

      // Act
      // Assert
      expect(character.realY())
        .toBe(6.25);
    });

    it('writes the smoothed real y', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      character.setRealY(6.25);

      // Assert
      expect(character.realY())
        .toBe(6.25);
    });
  });
  //endregion where a character is, and how long it has been there

  //region what a character is currently doing
  describe('Game_Character', () =>
  {
    /**
     * Builds a bare character carrying the engine's own underscore fields.
     * @returns {Game_Character} The character under test.
     */
    const buildCharacter = () => new globalThis.Game_Character();

    it('reads the remaining wait frames of a move route', () =>
    {
      // Arrange
      const character = buildCharacter();
      character._waitCount = 20;

      // Act
      // Assert
      expect(character.waitCount())
        .toBe(20);
    });

    it('writes the remaining wait frames, which is how a plugin interrupts a route', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      character.setWaitCount(5);

      // Assert
      expect(character.waitCount())
        .toBe(5);
    });

    it('reads the move route currently being walked', () =>
    {
      // Arrange
      const character = buildCharacter();
      const route = { list: [] };
      character._moveRoute = route;

      // Act
      // Assert
      expect(character.moveRoute())
        .toBe(route);
    });

    it('reads how far into that route the character has walked', () =>
    {
      // Arrange
      const character = buildCharacter();
      character._moveRouteIndex = 3;

      // Act
      // Assert
      expect(character.moveRouteIndex())
        .toBe(3);
    });
  });
  //endregion what a character is currently doing

  //region the map's event table
  describe('Game_Map', () =>
  {
    it('runs the member-initialization hook every plugin hangs its own state off', () =>
    {
      // Arrange: vanilla sets the map up inside `initialize`, which a decode can never re-run, so
      // plugin state needs a hook of its own that can.
      const map = new globalThis.Game_Map();
      const initMembers = vi.spyOn(map, 'initMembers');

      // Act
      map.initialize();

      // Assert
      expect(globalThis.J.BASE.Aliased.Game_Map.get('initialize'))
        .toHaveBeenCalled();
      expect(initMembers)
        .toHaveBeenCalled();

      initMembers.mockRestore();
    });

    it('hands back the event collection with its empty slots intact', () =>
    {
      // Arrange: the engine's own `events()` filters the holes out, but a hole is a slot awaiting
      // reuse - anything adding or removing events by index has to see them.
      const map = new globalThis.Game_Map();
      map._events = [ null, { id: 1 }, null ];

      // Act
      const events = map.rawEvents();

      // Assert
      expect(events.length)
        .toBe(3);
      expect(events[0])
        .toBeNull();
    });

    it('places an event into a specific slot', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map._events = [ null, null ];
      const event = { id: 5 };

      // Act
      map.setEventByIndex(1, event);

      // Assert
      expect(map.rawEvents()[1])
        .toBe(event);
    });

    it('empties a slot without shortening the collection, leaving the index reusable', () =>
    {
      // Arrange: splicing instead would renumber every event after it.
      const map = new globalThis.Game_Map();
      map._events = [ null, { id: 5 }, { id: 6 } ];

      // Act
      map.clearEventByIndex(1);

      // Assert
      expect(map.rawEvents()[1])
        .toBeNull();
      expect(map.rawEvents().length)
        .toBe(3);
    });
  });
  //endregion the map's event table

  //region the party's raw containers
  describe('Game_Party', () =>
  {
    it('runs the member-initialization hook every plugin hangs its own state off', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      const initMembers = vi.spyOn(party, 'initMembers');

      // Act
      party.initialize();

      // Assert
      expect(globalThis.J.BASE.Aliased.Game_Party.get('initialize'))
        .toHaveBeenCalled();
      expect(initMembers)
        .toHaveBeenCalled();

      initMembers.mockRestore();
    });

    it('hands back the raw item container rather than a rebuilt list', () =>
    {
      // Arrange: the container is keyed by id and holds counts, which is what anything writing to
      // inventory needs - the engine's `items()` hands back rebuilt database rows instead.
      const party = new globalThis.Game_Party();
      party._items = { 1: 3 };

      // Act
      // Assert
      expect(party.rawItems())
        .toEqual({ 1: 3 });
    });

    it('hands back the raw weapon container', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party._weapons = { 2: 1 };

      // Act
      // Assert
      expect(party.rawWeapons())
        .toEqual({ 2: 1 });
    });

    it('hands back the raw armor container', () =>
    {
      // Arrange
      const party = new globalThis.Game_Party();
      party._armors = { 3: 2 };

      // Act
      // Assert
      expect(party.rawArmors())
        .toEqual({ 3: 2 });
    });
  });
  //endregion the party's raw containers

  //region the screen tint
  describe('Game_Screen', () =>
  {
    it('reads the tone the screen is currently fading toward', () =>
    {
      // Arrange: the target rather than the current value, because a plugin restoring a tint after
      // an interruption needs to know where the fade was headed rather than where it stopped.
      const screen = new globalThis.Game_Screen();
      screen._toneTarget = [ 0, 0, 0, 0 ];

      // Act
      // Assert
      expect(screen.toneTarget())
        .toEqual([ 0, 0, 0, 0 ]);
    });
  });
  //endregion the screen tint

  //region the result nested on every battler in a savefile
  describe('Game_ActionResult', () =>
  {
    it('runs the member-initialization hook every plugin hangs its own state off', () =>
    {
      // Arrange: a result reaches a savefile nested on every battler, and its codec seeds the
      // engine's own fields and then calls this - so plugin state added through `initialize` alone
      // would come back missing on every load.
      const result = new globalThis.Game_ActionResult();
      const initMembers = vi.spyOn(result, 'initMembers');

      // Act
      result.initialize();

      // Assert
      expect(globalThis.J.BASE.Aliased.Game_ActionResult.get('initialize'))
        .toHaveBeenCalled();
      expect(initMembers)
        .toHaveBeenCalled();

      initMembers.mockRestore();
    });

    it('leaves the hook empty in core, so every extension starts from the same place', () =>
    {
      // Arrange
      const result = new globalThis.Game_ActionResult();

      // Act
      const initMembers = () => result.initMembers();

      // Assert
      expect(initMembers)
        .not.toThrow();
    });
  });
  //endregion the result nested on every battler in a savefile

  //region the rest of the layer
  describe('Game_Action', () =>
  {
    it('hands back the item wrapper rather than the database row it points at', () =>
    {
      // Arrange: deliberately not `item()`, which unwraps into the row. Anything rebinding what an
      // action points at needs the wrapper, because `setObject` lives on the wrapper.
      const action = new globalThis.Game_Action();
      const wrapper = { object: () => ({ id: 1 }) };
      action._item = wrapper;

      // Act
      // Assert
      expect(action.rawItem())
        .toBe(wrapper);
    });

    it('reads and writes the acting actor id', () =>
    {
      // Arrange: an action outlives the battler that made it - it is resolved back through these
      // ids at execution time rather than by holding the object.
      const action = new globalThis.Game_Action();

      // Act
      action.setSubjectActorId(4);

      // Assert
      expect(action.subjectActorId())
        .toBe(4);
    });

    it('reads and writes the acting enemy index', () =>
    {
      // Arrange
      const action = new globalThis.Game_Action();

      // Act
      action.setSubjectEnemyIndex(2);

      // Assert
      expect(action.subjectEnemyIndex())
        .toBe(2);
    });
  });

  describe('Game_Actor', () =>
  {
    it('reads and writes the current class id', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();

      // Act
      actor.setClassId(3);

      // Assert
      expect(actor.classId())
        .toBe(3);
    });

    it('hands back the accumulated experience keyed per class', () =>
    {
      // Arrange: per class rather than a single number, because vanilla banks exp separately for
      // every class an actor has ever held.
      const actor = new globalThis.Game_Actor();
      actor._exp = { 1: 400 };

      // Act
      // Assert
      expect(actor.exp())
        .toEqual({ 1: 400 });
    });
  });

  describe('Game_Event', () =>
  {
    it('reads and writes which page is currently active', () =>
    {
      // Arrange: -1 and -2 are real values here - "no active page" and "conditions unmet" - which is
      // why this is read through an accessor rather than compared against a bare field everywhere.
      const event = new globalThis.Game_Event();

      // Act
      event.setPageIndex(-1);

      // Assert
      expect(event.pageIndex())
        .toBe(-1);
    });
  });

  describe('Game_BattlerBase rate floors', () =>
  {
    /**
     * Builds a battler answering a fixed rate for every special parameter.
     * @param {number} rate The rate every sparam reports.
     * @returns {Game_BattlerBase} The battler under test.
     */
    const buildBattler = rate =>
    {
      const battler = new globalThis.Game_BattlerBase();
      battler.sparam = () => rate;

      return battler;
    };

    it('passes an ordinary mp cost rate through untouched', () =>
    {
      // Arrange
      const battler = buildBattler(0.5);

      // Act
      // Assert
      expect(battler.mcr)
        .toBe(0.5);
    });

    it('floors a negative mp cost rate at zero', () =>
    {
      // Arrange: a negative rate would let `skillMpCost` go negative, and `paySkillCost` would then
      // hand the caster free MP for casting.
      const battler = buildBattler(-1);

      // Act
      // Assert
      expect(battler.mcr)
        .toBe(0);
    });

    it('passes an ordinary tp charge rate through untouched', () =>
    {
      // Arrange
      const battler = buildBattler(2);

      // Act
      // Assert
      expect(battler.tcr)
        .toBe(2);
    });

    it('floors a negative tp charge rate at zero', () =>
    {
      // Arrange: a negative rate would silently drain TP on every hit taken rather than charge it.
      const battler = buildBattler(-1);

      // Act
      // Assert
      expect(battler.tcr)
        .toBe(0);
    });
  });

  describe('Game_Item', () =>
  {
    it('runs the member-initialization hook every plugin hangs its own state off', () =>
    {
      // Arrange
      const item = new globalThis.Game_Item();
      const initMembers = vi.spyOn(item, 'initMembers');

      // Act
      item.initialize();

      // Assert
      expect(globalThis.J.BASE.Aliased.Game_Item.get('initialize'))
        .toHaveBeenCalled();
      expect(initMembers)
        .toHaveBeenCalled();

      initMembers.mockRestore();
    });
  });
  //endregion the rest of the layer
});
//endregion plugins/_base/core/objects/engine-accessor-layer.test.js