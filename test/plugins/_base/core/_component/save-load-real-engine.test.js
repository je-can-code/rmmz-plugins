//region plugins/_base/_component/save-load-real-engine.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installFakeSaveFilesystem } from '../core/save/fixtures/install-fake-save-filesystem.js';
import { installRealRmmzEngine } from '../../../../setup/rmmz-engine-loader.js';

/**
 * The whole pipeline, end to end, against the real engine classes: build a world, save it, throw it
 * away, load it back, and check that what comes out is what went in.
 *
 * **This is the closest an automated test gets to a boot, and it exists because nothing else in the
 * suite covers the seam.** The codec suite proves a type round-trips. The storage suite proves a
 * generation survives a crash. Neither of them puts a real `Game_Party` through
 * `StorageManager.saveObject` and back out of `StorageManager.loadObject`, which is the path the game
 * actually takes and the one where the router, the sections, the manifest, the seed merge, and the
 * transient re-seeding all have to agree at once.
 *
 * Two things are reproduced here rather than imported, and both for the same reason the existing
 * `jsonex-map-set-save-load-integration` suite gives: `project/js/rmmz_managers.js` cannot be loaded
 * in this environment, because `ImageManager` builds a `Bitmap` at module scope and that needs a real
 * `document`. So `makeSaveContents` and `extractSaveContents` are copied verbatim from it - they are
 * pure key assignment - while everything under them is the real, imported implementation.
 *
 * What is *not* covered, and cannot be: `Scene_Boot`, `Scene_Load`, `Scene_Map.create`, and the map
 * setup that follows a load. Those need a rendering context. A human at the keyboard is still the
 * only thing that proves the cutover boots.
 */
describe('save and load through the real engine objects', () =>
{
  let StorageManager;
  let SaveFileSystem;
  let fake;

  /**
   * Verbatim from `DataManager.makeSaveContents()` in `project/js/rmmz_managers.js`.
   * @returns {object} The ten top-level keys a slot is written from.
   */
  const makeSaveContents = () => ({
    system: globalThis.$gameSystem,
    screen: globalThis.$gameScreen,
    timer: globalThis.$gameTimer,
    switches: globalThis.$gameSwitches,
    variables: globalThis.$gameVariables,
    selfSwitches: globalThis.$gameSelfSwitches,
    actors: globalThis.$gameActors,
    party: globalThis.$gameParty,
    map: globalThis.$gameMap,
    player: globalThis.$gamePlayer,
  });

  /**
   * Verbatim from `DataManager.extractSaveContents()` in `project/js/rmmz_managers.js`.
   * @param {object} contents The decoded save contents.
   */
  const extractSaveContents = contents =>
  {
    globalThis.$gameSystem = contents.system;
    globalThis.$gameScreen = contents.screen;
    globalThis.$gameTimer = contents.timer;
    globalThis.$gameSwitches = contents.switches;
    globalThis.$gameVariables = contents.variables;
    globalThis.$gameSelfSwitches = contents.selfSwitches;
    globalThis.$gameActors = contents.actors;
    globalThis.$gameParty = contents.party;
    globalThis.$gameMap = contents.map;
    globalThis.$gamePlayer = contents.player;
  };

  /**
   * Verbatim from `DataManager.createGameObjects()`, minus the singletons this pipeline never
   * persists (`$gameTemp`, `$gameMessage`, `$gameTroop`), which the save contents above do not name.
   */
  const createGameObjects = () =>
  {
    // `$gameTemp` is not persisted, but `Game_Player.refresh` and friends reach for it during the
    // arrangement half of these tests, so it is created alongside the rest.
    globalThis.$gameTemp = new globalThis.Game_Temp();
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameScreen = new globalThis.Game_Screen();
    globalThis.$gameTimer = new globalThis.Game_Timer();
    globalThis.$gameSwitches = new globalThis.Game_Switches();
    globalThis.$gameVariables = new globalThis.Game_Variables();
    globalThis.$gameSelfSwitches = new globalThis.Game_SelfSwitches();
    globalThis.$gameActors = new globalThis.Game_Actors();
    globalThis.$gameParty = new globalThis.Game_Party();
    globalThis.$gameMap = new globalThis.Game_Map();
    globalThis.$gamePlayer = new globalThis.Game_Player();
  };

  /**
   * The save half of `DataManager.saveGame`, without the rescue wrapper.
   * @param {number} savefileId The slot to write.
   * @returns {Promise<void>}
   */
  const saveGame = savefileId => StorageManager.saveObject(`file${savefileId}`, makeSaveContents());

  /**
   * The load half of `DataManager.loadGame`: a fresh set of objects, then the decoded ones over them.
   * @param {number} savefileId The slot to read.
   * @returns {Promise<void>}
   */
  const loadGame = savefileId =>
  {
    createGameObjects();

    return StorageManager.loadObject(`file${savefileId}`)
      .then(contents => extractSaveContents(contents));
  };

  /**
   * Reads one section file out of the live generation, as plain data.
   * @param {string} sectionName The section's file name.
   * @returns {object} The parsed section.
   */
  const readSection = sectionName =>
  {
    const generation = fake.files.get('save/file1/current');

    return JSON.parse(fake.files.get(`save/file1/${generation}/${sectionName}`));
  };

  beforeAll(async () =>
  {
    installRealRmmzEngine();

    // JsonEx's decode fallback resolves classes through `window[name]`, and the engine files reach
    // for `window` in a few places besides. This is how the rest of this repo's fixtures do it.
    globalThis.window = globalThis;

    // `Game_Temp` asks `Utils.isOptionValid('test')` whether this is a playtest, and that reads the
    // query string off `location`. Nothing here is a playtest.
    globalThis.location = { search: '' };

    // J-Base's sentinel, normally established by its own initialization module. The save files read
    // it at module scope, so it has to exist before any of them are imported.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    // the minimum database a Game_Actor, a Game_Map and a Game_Followers need to come into being.
    globalThis.$dataSystem = {
      // `Game_Actor.equipSlots` sizes an actor's equipment from this, during `setup`.
      equipTypes: [ '', 'Weapon', 'Shield', 'Head', 'Body', 'Accessory' ],

      // `Game_Switches.setValue` and `Game_Variables.setValue` bounds-check against these name
      // tables, so an id outside them is silently discarded rather than stored.
      switches: Array.from({ length: 20 }, () => ''),
      variables: Array.from({ length: 20 }, () => ''),
      optFollowers: true,
      optSlipDeath: false,
      optDisplayTp: true,
      boat: { characterName: '', characterIndex: 0, startMapId: 0, startX: 0, startY: 0, bgm: {} },
      ship: { characterName: '', characterIndex: 0, startMapId: 0, startX: 0, startY: 0, bgm: {} },
      airship: { characterName: '', characterIndex: 0, startMapId: 0, startX: 0, startY: 0, bgm: {} },
    };
    globalThis.$dataActors = [
      null,
      {
        id: 1,
        name: 'Jerald',
        nickname: '',
        classId: 1,
        initialLevel: 5,
        maxLevel: 99,
        characterName: 'Actor1',
        characterIndex: 0,
        faceName: 'Actor1',
        faceIndex: 0,
        battlerName: '',
        equips: [ 0, 0, 0, 0, 0 ],
        profile: '',
        note: '',
        traits: [],
        meta: {},
      },
    ];
    globalThis.$dataClasses = [
      null,
      {
        id: 1,
        name: 'Chef',
        expParams: [ 30, 20, 30, 30 ],
        params: Array.from({ length: 8 }, () => Array.from({ length: 100 }, () => 100)),
        learnings: [],
        traits: [],
        note: '',
        meta: {},
      },
    ];
    globalThis.$dataSkills = [ null ];
    globalThis.$dataItems = [ null ];
    globalThis.$dataWeapons = [ null ];
    globalThis.$dataArmors = [ null ];
    globalThis.$dataStates = [ null ];
    globalThis.$dataCommonEvents = [ null ];
    globalThis.$dataMap = null;

    globalThis.Graphics = { frameCount: 91240 };
    globalThis.AudioManager = { saveBgm: () => ({}), saveBgs: () => ({}) };
    globalThis.SceneManager = {};

    // `Game_Vehicle.loadSystemSettings` reaches this through `setImage` during construction. Nothing
    // here renders, so a no-op reserve is the whole of what it needs.
    globalThis.ImageManager = {
      reserveCharacter: () => ({}),
      loadCharacter: () => ({}),
      isObjectCharacter: () => false,
      isBigCharacter: () => false,
    };

    // J-Base's namespace, reduced to what the save pipeline actually reads off it.
    globalThis.J = { BASE: { Metadata: { retainedSaveGenerations: 3 } } };

    // the fake filesystem has to be in place before J-Base's StorageManager augments it, because
    // that file defines the real `fs*` helpers and would otherwise win.
    fake = installFakeSaveFilesystem();
    const fakeFilesystem = { ...fake.storageManager };

    await import('../../../../../src/plugins/_base/core/core/save/SaveDocument.js');
    await import('../../../../../src/plugins/_base/core/core/save/registerEngineSaveCodecs.js');
    ({ default: SaveFileSystem } = await import('../../../../../src/plugins/_base/core/managers/SaveFileSystem.js'));
    await import('../../../../../src/plugins/_base/core/managers/StorageManager.js');

    // put the in-memory helpers back over the real ones the import just installed.
    Object.assign(globalThis.StorageManager, fakeFilesystem);
    ({ StorageManager } = globalThis);

    // the manifest's display block is vanilla's, and vanilla's `DataManager` cannot be loaded here.
    // The four `is*` predicates come along because `Game_Item` asks them what it is holding.
    globalThis.DataManager = {
      isSkill: item => item !== null && globalThis.$dataSkills.includes(item),
      isItem: item => item !== null && globalThis.$dataItems.includes(item),
      isWeapon: item => item !== null && globalThis.$dataWeapons.includes(item),
      isArmor: item => item !== null && globalThis.$dataArmors.includes(item),
      makeSavefileInfo: () => ({
        title: 'Chef Adventure',
        characters: [ [ 'Actor1', 0 ] ],
        faces: [ [ 'Actor1', 0 ] ],
        playtime: '00:25:20',
        timestamp: 1754107869512,
      }),
    };
  });

  /**
   * Engine prototypes a single test patched to stand in for a plugin, and what they were before.
   *
   * Restoring these inline after the load they are needed for is not enough: a load that rejects
   * would skip the restore and leave the prototype patched for every test after it, which turns one
   * failure into a cascade of confusing ones. They are undone here instead, unconditionally.
   * @type {Array<[object, string, Function]>}
   */
  let patchedPrototypes = [];

  /**
   * Replaces a prototype method for the duration of one test.
   * @param {object} prototype The prototype to patch.
   * @param {string} methodName The method to replace.
   * @param {Function} build Receives the original, returns the replacement.
   */
  const patchPrototype = (prototype, methodName, build) =>
  {
    const original = prototype[methodName];

    patchedPrototypes.push([ prototype, methodName, original ]);

    prototype[methodName] = build(original);
  };

  beforeEach(() =>
  {
    fake.files.clear();
    fake.directories.clear();
    fake.directories.add('save/');
    fake.reads.length = 0;
    fake.writeCount = 0;

    createGameObjects();
  });

  afterEach(() =>
  {
    patchedPrototypes.forEach(([ prototype, methodName, original ]) =>
    {
      prototype[methodName] = original;
    });

    patchedPrototypes = [];
  });

  //region the round trip
  describe('a full save and load cycle', () =>
  {
    it('writes a generation and points the slot at it', async () =>
    {
      // Arrange
      // Act
      await saveGame(1);

      // Assert
      expect(fake.files.get('save/file1/current')).toBe('gen-0001');
      expect(fake.files.has('save/file1/gen-0001/manifest.json')).toBe(true);
    });

    it('splits the slot into the sections the document map declares', async () =>
    {
      // Arrange
      // Act
      await saveGame(1);

      // Assert
      expect(fake.files.has('save/file1/gen-0001/world.json')).toBe(true);
      expect(fake.files.has('save/file1/gen-0001/party.json')).toBe(true);
      expect(fake.files.has('save/file1/gen-0001/actors.json')).toBe(true);
    });

    it('brings the party back with its own prototype rather than a plain object', async () =>
    {
      // Arrange
      globalThis.$gameParty.gainGold(8140);

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(Object.getPrototypeOf(globalThis.$gameParty)).toBe(globalThis.Game_Party.prototype);
      expect(globalThis.$gameParty.gold()).toBe(8140);
    });

    it('restores the actor roster, including a level the party earned', async () =>
    {
      // Arrange
      globalThis.$gameParty.addActor(1);
      globalThis.$gameActors.actor(1)
        .changeLevel(12, false);

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(globalThis.$gameActors.actor(1).level).toBe(12);
      expect(Object.getPrototypeOf(globalThis.$gameActors.actor(1))).toBe(globalThis.Game_Actor.prototype);
    });

    it('restores switches and variables by their sparse indices', async () =>
    {
      // Arrange
      globalThis.$gameSwitches.setValue(7, true);
      globalThis.$gameVariables.setValue(3, 4180);

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(globalThis.$gameSwitches.value(7)).toBe(true);
      expect(globalThis.$gameVariables.value(3)).toBe(4180);
    });

    it('restores self-switches, which are keyed by a rendered tuple rather than an index', async () =>
    {
      // Arrange
      globalThis.$gameSelfSwitches.setValue([ 4, 12, 'A' ], true);

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(globalThis.$gameSelfSwitches.value([ 4, 12, 'A' ])).toBe(true);
    });

    it('restores the map and the player position on it', async () =>
    {
      // Arrange
      globalThis.$gameMap._mapId = 4;

      // `locate` would refresh the bush depth, which reads tileset flags off a `$dataMap` this
      // environment has no reason to build. `setPosition` is the part being persisted.
      globalThis.$gamePlayer.setPosition(11, 6);

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(globalThis.$gameMap.mapId()).toBe(4);
      expect(globalThis.$gamePlayer.x).toBe(11);
      expect(globalThis.$gamePlayer.y).toBe(6);
    });

    it('restores the vehicles nested inside the map', async () =>
    {
      // Arrange
      globalThis.$gameMap.boat()
        .setLocation(4, 9, 9);

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(Object.getPrototypeOf(globalThis.$gameMap.boat())).toBe(globalThis.Game_Vehicle.prototype);
      expect(globalThis.$gameMap.boat()._mapId).toBe(4);
    });

    it('restores the followers nested inside the player', async () =>
    {
      // Arrange
      globalThis.$gameParty.addActor(1);

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(Object.getPrototypeOf(globalThis.$gamePlayer.followers())).toBe(globalThis.Game_Followers.prototype);
    });

    it('restores a Game_Item reference by its id rather than by embedding the row', async () =>
    {
      // Arrange
      globalThis.$dataItems[1] = { id: 1, name: 'Herb', itypeId: 1, note: '', meta: {} };
      globalThis.$gameParty.setLastItem(globalThis.$dataItems[1]);

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(globalThis.$gameParty.lastItem()).toBe(globalThis.$dataItems[1]);
      expect(readSection('party.json').party._lastItem._itemId).toBe(1);
    });
  });
  //endregion the round trip

  //region what the file does and does not hold
  describe('what reaches the file', () =>
  {
    it('pretty-prints the sections, so a developer can open one', async () =>
    {
      // Arrange
      // Act
      await saveGame(1);

      // Assert
      expect(fake.files.get('save/file1/gen-0001/party.json')).toContain('\n  ');
    });

    it('tags every instance with its stable save id rather than its class name', async () =>
    {
      // Arrange
      // Act
      await saveGame(1);

      // Assert
      expect(readSection('party.json').party['@']).toBe('game-party');
    });

    it('drops the plugin state hanging off a map event, timers and all', async () =>
    {
      // Arrange
      const event = Object.create(globalThis.Game_Event.prototype);
      event._j = { _regions: { _skills: { _timer: { frames: 12 } } } };
      globalThis.$gameMap._events = [ null, event ];

      // Act
      await saveGame(1);

      // Assert
      expect(readSection('world.json').map._events[1]._j).toBeUndefined();
    });

    it('re-seeds an event with whatever its own seed established rather than leaving it absent', async () =>
    {
      // Arrange
      // the cold value for an event's `_j` is "whatever the initMembers chain built", and it is
      // plugins that build it. This stands in for one, so the seed has something to establish.
      patchPrototype(globalThis.Game_Event.prototype, 'initMembers', original => function()
      {
        original.call(this);
        this._j = { _regions: { _skills: { _timer: 'fresh' } } };
      });

      const event = Object.create(globalThis.Game_Event.prototype);
      event.initMembers();
      event._j._regions._skills._timer = 'stale';
      globalThis.$gameMap._events = [ null, event ];

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(globalThis.$gameMap._events[1]._j._regions._skills._timer).toBe('fresh');
    });

    it('writes a Map in a shape that survives the round trip', async () =>
    {
      // Arrange
      globalThis.$gameParty._j = { _sks: { _slotMap: new Map([ [ 'mainhand', 41 ] ]) } };

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect(globalThis.$gameParty._j._sks._slotMap.get('mainhand')).toBe(41);
    });

    it('writes a Set in a shape that survives the round trip', async () =>
    {
      // Arrange
      globalThis.$gameParty._j = { _omni: { _seen: new Set([ 3, 9 ]) } };

      // Act
      await saveGame(1);
      await loadGame(1);

      // Assert
      expect([ ...globalThis.$gameParty._j._omni._seen ]).toEqual([ 3, 9 ]);
    });

    it('leaves a declared transient out of the file entirely', async () =>
    {
      // Arrange
      globalThis.$gameParty.addActor(1);
      globalThis.$gameActors.actor(1)._j = { _base: { _cachedAllNotes: 'stale' } };

      // Act
      await saveGame(1);

      // Assert
      expect(readSection('actors.json').actors._data[1]._j._base._cachedAllNotes).toBeUndefined();
    });

    it('brings a declared transient back cold rather than undefined, which its guard reads strictly',
      async () =>
      {
        // Arrange
        globalThis.$gameParty.addActor(1);
        globalThis.$gameActors.actor(1)._j = { _base: { _cachedAllNotes: 'stale' } };

        // Act
        await saveGame(1);
        await loadGame(1);

        // Assert
        expect(globalThis.$gameActors.actor(1)._j._base._cachedAllNotes).toBe(null);
      });

    it('does not grow across repeated save/load cycles', async () =>
    {
      // Arrange
      globalThis.$gameParty.gainGold(500);
      await saveGame(1);
      const first = fake.files.get('save/file1/gen-0001/party.json').length;

      // Act
      await loadGame(1);
      await saveGame(1);
      const second = fake.files.get('save/file1/gen-0002/party.json').length;

      // Assert
      expect(second).toBe(first);
    });
  });
  //endregion what the file does and does not hold

  //region the properties the seed exists for
  describe('a save written before a field existed', () =>
  {
    it('brings a field the file never held back at its seeded default', async () =>
    {
      // Arrange
      await saveGame(1);
      const generation = fake.files.get('save/file1/current');
      const section = JSON.parse(fake.files.get(`save/file1/${generation}/party.json`));
      delete section.party._steps;
      fake.files.set(`save/file1/${generation}/party.json`, JSON.stringify(section));

      // Act
      await loadGame(1);

      // Assert
      expect(globalThis.$gameParty._steps).toBe(0);
    });

    it('keeps a plugin namespace the seed built when the file carries an older one', async () =>
    {
      // Arrange
      // a save written before `_added` existed: the file has `_original` and nothing else, and the
      // seed rebuilds both. a plain assignment would replace the namespace and lose `_added`.
      patchPrototype(globalThis.Game_Party.prototype, 'initAllItems', original => function()
      {
        original.call(this);
        this._j = { _demo: { _original: 'seeded', _added: 'seeded' } };
      });

      globalThis.$gameParty._j = { _demo: { _original: 'saved', _added: 'saved' } };
      await saveGame(1);

      const generation = fake.files.get('save/file1/current');
      const section = JSON.parse(fake.files.get(`save/file1/${generation}/party.json`));
      delete section.party._j._demo._added;
      fake.files.set(`save/file1/${generation}/party.json`, JSON.stringify(section));

      // Act
      await loadGame(1);

      // Assert
      expect(globalThis.$gameParty._j._demo._original).toBe('saved');
      expect(globalThis.$gameParty._j._demo._added).toBe('seeded');
    });
  });
  //endregion the properties the seed exists for

  //region recovery
  describe('recovery', () =>
  {
    it('falls back to the previous generation when the newest one is torn', async () =>
    {
      // Arrange
      globalThis.$gameParty.gainGold(100);
      await saveGame(1);
      globalThis.$gameParty.gainGold(400);
      await saveGame(1);
      fake.files.delete('save/file1/gen-0002/party.json');

      // Act
      await loadGame(1);

      // Assert
      expect(globalThis.$gameParty.gold()).toBe(100);
    });

    it('draws the load menu from the manifest without opening a section', async () =>
    {
      // Arrange
      await saveGame(1);
      fake.reads.length = 0;

      // Act
      const manifest = SaveFileSystem.readManifest('file1');

      // Assert
      expect(manifest.display.title).toBe('Chef Adventure');
      expect(fake.reads.some(path => path.endsWith('party.json'))).toBe(false);
    });

    it('records the playtime the manifest was written at', async () =>
    {
      // Arrange
      // Act
      await saveGame(1);

      // Assert
      expect(JSON.parse(fake.files.get('save/file1/gen-0001/manifest.json')).playtimeFrames).toBe(91240);
    });
  });
  //endregion recovery
});
//endregion plugins/_base/_component/save-load-real-engine.test.js