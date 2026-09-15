//region plugins/lighting/_component/lighting-hooks.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultLightingConfig,
  installLightingComponentGlobals,
  setLightingConfig,
  setPluginContextToJBase,
  setPluginContextToJLighting,
} from './fixtures/install-lighting-component-globals.js';

describe('J-Lighting engine hooks (direct src import)', () =>
{
  let ScreenLightingComposer;
  let PlayerLightCoordinator;
  let MapAmbientCoordinator;

  // the registered plugin command handlers, captured as they register - which is the only way a
  // command is reachable at all.
  const handlers = {};

  beforeAll(async () =>
  {
    vi.resetModules();

    installLightingComponentGlobals();
    setLightingConfig(defaultLightingConfig());

    globalThis.PluginManager.registerCommand = (pluginName, commandName, handler) =>
    {
      handlers[commandName] = handler;
    };

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Event.js');
    ({ default: globalThis.RPGManager } =
      await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJLighting();
    await import('../../../../src/plugins/lighting/core/_metadata/initialization.js');

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: ScreenLightingComposer } =
      await import('../../../../src/plugins/lighting/core/managers/ScreenLightingComposer.js'));
    ({ default: PlayerLightCoordinator } =
      await import('../../../../src/plugins/lighting/core/managers/PlayerLightCoordinator.js'));
    await import('../../../../src/plugins/lighting/core/objects/Game_Screen.js');
    await import('../../../../src/plugins/lighting/core/objects/Game_Event.js');
    await import('../../../../src/plugins/lighting/core/objects/Game_Actor.js');
    await import('../../../../src/plugins/lighting/core/database/DataManager.js');
    ({ default: MapAmbientCoordinator } =
      await import('../../../../src/plugins/lighting/core/managers/MapAmbientCoordinator.js'));
    ({ default: globalThis.RPGManager } =
      await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    await import('../../../../src/plugins/lighting/core/scenes/Scene_Map.js');
    await import('../../../../src/plugins/lighting/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    ScreenLightingComposer.reset();
    PlayerLightCoordinator.reset();
    Graphics.frameCount = 100;
    globalThis.$gameParty = { leader: () => undefined };
    globalThis.$gamePlayer = { id: 'player' };
  });

  /**
   * Turns comment text into the command shape an event page actually holds.
   * @param {string[]} comments The comment lines.
   * @returns {Object[]}
   */
  const asCommentCommands = comments => comments.map(comment => ({ code: 108, parameters: [ comment ] }));

  describe('Game_Screen#startTint', () =>
  {
    it('still performs the engine tint the original was doing', () =>
    {
      // Arrange
      const screen = new globalThis.Game_Screen();

      // Act
      screen.startTint([ 68, -34, -34, 0 ], 60);

      // Assert
      expect(screen.engineTintRan).toBe(true);
    });

    it('declares the requested colour to the composer', () =>
    {
      // Arrange
      const screen = new globalThis.Game_Screen();

      // Act
      screen.startTint([ 100, 0, 0, 0 ], 4);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 25, 0, 0, 0 ]);
    });

    it('treats a tint back to neutral as handing the screen back', () =>
    {
      // Arrange
      const screen = new globalThis.Game_Screen();
      screen.startTint([ 100, 0, 0, 0 ], 1);
      Graphics.frameCount += 1;
      ScreenLightingComposer.compose();

      // Act
      screen.startTint([ 0, 0, 0, 0 ], 1);
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('Game_Screen#tone', () =>
  {
    it('reports the composed colour rather than what the engine last wrote', () =>
    {
      // Arrange
      const screen = new globalThis.Game_Screen();
      screen.startTint([ 100, 0, 0, 0 ], 1);

      // Act
      Graphics.frameCount += 1;
      const result = screen.tone();

      // Assert
      // this is where the composed colour reaches the screen: the spriteset reads it every frame
      // and hands the answer to the colour filter on its base sprite.
      expect(result).toEqual([ 100, 0, 0, 0 ]);
    });
  });

  describe('Game_Event#setupPage', () =>
  {
    it('still performs the page setup the engine was doing', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.commentCommands = [];

      // Act
      event.setupPage();

      // Assert
      expect(event.pageSetupRan).toBe(true);
    });

    it('declares the light its active page asks for', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.commentCommands = asCommentCommands([ '<light:[6, #ffbb73, flicker]>' ]);

      // Act
      event.setupPage();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toHaveLength(1);
      expect(result.lights()[0].radius()).toBe(6);
    });

    it('declares nothing for a page carrying no light tag', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.commentCommands = asCommentCommands([ '<motion:[breathe]>' ]);

      // Act
      event.setupPage();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // an unlit torch is a page with no tag; this is what makes lighting one a page change.
      expect(result.lights()).toEqual([]);
    });

    it('puts a light out when its event is erased', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.commentCommands = asCommentCommands([ '<light:[6]>' ]);
      event.setupPage();

      // Act
      // this is what the engine leaves behind on `erase()`: the page index goes to -1, so `page()`
      // resolves to nothing and the event has no active page to read comments from. `erase` then
      // calls `refresh`, which calls `setupPage` - so the light gets a chance to withdraw.
      event.page = () => undefined;
      event.setupPage();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // a JABS fireball is an event that is spawned, flies, and is erased. without this, every
      // projectile would leave its light burning at the point of impact.
      expect(result.lights()).toEqual([]);
    });

    it('puts a light out when the page that declared it changes to one without', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.commentCommands = asCommentCommands([ '<light:[6]>' ]);
      event.setupPage();

      // Act
      event.commentCommands = asCommentCommands([]);
      event.setupPage();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toEqual([]);
    });

    it('keys each event separately, so one torch cannot wipe out another', () =>
    {
      // Arrange
      const first = new globalThis.Game_Event();
      first._eventId = 1;
      first.commentCommands = asCommentCommands([ '<light:[4]>' ]);
      const second = new globalThis.Game_Event();
      second._eventId = 2;
      second.commentCommands = asCommentCommands([ '<light:[8]>' ]);

      // Act
      first.setupPage();
      second.setupPage();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // the near-miss is the point: a shared source key would leave only the last one burning.
      expect(result.lights()).toHaveLength(2);
    });

    it('attaches the light to the event that declared it', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      event.commentCommands = asCommentCommands([ '<light:[4]>' ]);

      // Act
      event.setupPage();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()[0].character()).toBe(event);
    });
  });

  describe('Game_Actor#onBattlerDataChange', () =>
  {
    it('still performs the data change the original was doing', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();

      // Act
      actor.onBattlerDataChange();

      // Assert
      expect(actor.dataChangeRan).toBe(true);
    });

    it('re-reads the light the party leader is carrying', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();
      globalThis.$gameParty = {
        leader: () => ({ actorId: () => 1, getAllNotes: () => [ { note: '<light:[4.5]>' } ] }),
      };

      // Act
      actor.onBattlerDataChange();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // equipping a lantern is a data change, and this is what makes the screen notice.
      expect(result.lights()[0].radius()).toBe(4.5);
    });
  });

  describe('DataManager.createGameObjects', () =>
  {
    it('still performs the object creation the engine was doing', () =>
    {
      // Arrange
      // Act
      DataManager.createGameObjects();

      // Assert
      expect(DataManager.gameObjectsCreated).toBe(true);
    });

    it('forgets the lighting of whatever game was being played before', () =>
    {
      // Arrange
      const screen = new globalThis.Game_Screen();
      screen.startTint([ 100, 0, 0, 0 ], 1);

      // Act
      DataManager.createGameObjects();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // loading a save partway through a tinted cutscene must not carry that tint into the new game.
      expect(result.tone()).toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('plugin commands', () =>
  {
    it('registers both of its commands under the J-Lighting plugin name', () =>
    {
      // Arrange
      // Act
      const registered = Object.keys(handlers);

      // Assert
      expect(registered).toEqual([ 'applyAmbient', 'removeAmbient', 'lightsOn', 'lightsOff' ]);
    });

    it('darkens the scene when told to', () =>
    {
      // Arrange
      const apply = handlers.applyAmbient;

      // Act
      apply({ darkness: '60', color: '' });
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBeCloseTo(0.6, 10);
    });

    it('takes a stated colour for the dark when given one', () =>
    {
      // Arrange
      const apply = handlers.applyAmbient;

      // Act
      apply({ darkness: '60', color: '#0a2a2a' });
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.ambientColor()).toEqual([ 10, 42, 42 ]);
    });

    it('declares nothing when the arguments describe no ambient at all', () =>
    {
      // Arrange
      const apply = handlers.applyAmbient;

      // Act
      apply({ darkness: 'pitch', color: '' });
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBe(0);
    });

    it('drops the commanded darkness when it is withdrawn', () =>
    {
      // Arrange
      const apply = handlers.applyAmbient;
      const remove = handlers.removeAmbient;
      apply({ darkness: '60', color: '' });

      // Act
      remove({});
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBe(0);
    });
  });

  describe('map ambient', () =>
  {
    beforeEach(() =>
    {
      globalThis.$dataMap = { note: '<ambient:[93]>', meta: {} };
      RPGManager.clearCache();
    });

    it('declares the darkness the arriving map states in its note', () =>
    {
      // Arrange
      // Act
      MapAmbientCoordinator.refresh();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBeCloseTo(0.93, 10);
    });

    it('declares nothing at all for a map that never said it was dark', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '', meta: {} };

      // Act
      MapAmbientCoordinator.refresh();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBe(0);
    });

    it('declares nothing for a map whose tag matched but described no ambient', () =>
    {
      // Arrange
      // too many parameters matches the tag shape and then fails on meaning, which is the only way
      // a tag reaches the parser and gets rejected - anything that does not match is never ours.
      globalThis.$dataMap = { note: '<ambient:[60, #0a2a2a, extra]>', meta: {} };
      const warned = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      MapAmbientCoordinator.refresh();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();
      warned.mockRestore();

      // Assert
      expect(result.darkness()).toBe(0);
    });

    it('turns the lights on by withdrawing what the map said, not by arguing with it', () =>
    {
      // Arrange
      MapAmbientCoordinator.refresh();

      // Act
      handlers.lightsOn();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // declaring no darkness would compound to exactly the darkness already there.
      expect(result.darkness()).toBe(0);
    });

    it('gives a place its own darkness back when the lights go off again', () =>
    {
      // Arrange
      MapAmbientCoordinator.refresh();
      handlers.lightsOn();

      // Act
      handlers.lightsOff();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBeCloseTo(0.93, 10);
    });

    it('leaves a commanded darkness in place when the map darkness is withdrawn', () =>
    {
      // Arrange
      MapAmbientCoordinator.refresh();
      handlers.applyAmbient({ darkness: '50', color: '' });

      // Act
      handlers.lightsOn();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // removal is by source; turning the room lights on is not the same as clearing every source.
      expect(result.darkness()).toBeCloseTo(0.5, 10);
    });
  });

  describe('arriving on a map', () =>
  {
    /**
     * An event whose active page declares one light.
     * @param {number} eventId Which event it is.
     * @param {number} radius How far its light reaches.
     * @returns {Object}
     */
    const aTorch = (eventId, radius) =>
    {
      const event = new globalThis.Game_Event();
      event._eventId = eventId;
      event.commentCommands = asCommentCommands([ `<light:[${radius}]>` ]);

      return event;
    };

    beforeEach(() =>
    {
      globalThis.$dataMap = { note: '<ambient:[60]>', meta: {} };
      RPGManager.clearCache();
    });

    it('still performs the arrival the engine was doing', () =>
    {
      // Arrange
      globalThis.$gameMap = { events: () => [] };
      const scene = new globalThis.Scene_Map();

      // Act
      scene.onMapLoaded();

      // Assert
      expect(scene.mapLoadRan).toBe(true);
    });

    it('lights every torch on the map it arrives at', () =>
    {
      // Arrange
      globalThis.$gameMap = { events: () => [ aTorch(1, 200), aTorch(2, 300) ] };
      const scene = new globalThis.Scene_Map();

      // Act
      scene.onMapLoaded();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.lights()).toHaveLength(2);
    });

    it('keeps the torches burning when the scene is re-entered without a transfer', () =>
    {
      // Arrange
      // closing the menu builds a fresh Scene_Map and arrives again - but the engine only runs
      // `Game_Map#setup` on a real transfer, so no event ever calls `setupPage` a second time.
      globalThis.$gameMap = { events: () => [ aTorch(1, 200), aTorch(2, 300) ] };
      new globalThis.Scene_Map().onMapLoaded();

      // Act
      new globalThis.Scene_Map().onMapLoaded();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // anything that clears the page lights on arrival and waits for the events to announce
      // themselves again is waiting for something that will never happen.
      expect(result.lights()).toHaveLength(2);
    });

    it('leaves the departed map torches behind when arriving somewhere with fewer events', () =>
    {
      // Arrange
      globalThis.$gameMap = { events: () => [ aTorch(1, 200), aTorch(2, 300), aTorch(3, 400) ] };
      new globalThis.Scene_Map().onMapLoaded();

      // Act
      globalThis.$gameMap = { events: () => [ aTorch(1, 3) ] };
      new globalThis.Scene_Map().onMapLoaded();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      // lights are keyed by event id, so the surplus would otherwise strand - event three's torch
      // still burning on a map whose third event is a barrel.
      expect(result.lights()).toHaveLength(1);
      expect(result.lights()[0].radius()).toBe(3);
    });

    it('declares the arriving map darkness as well as its lights', () =>
    {
      // Arrange
      globalThis.$gameMap = { events: () => [ aTorch(1, 200) ] };

      // Act
      new globalThis.Scene_Map().onMapLoaded();
      Graphics.frameCount += 1;
      const result = ScreenLightingComposer.compose();

      // Assert
      expect(result.darkness()).toBeCloseTo(0.6, 10);
    });
  });
});
//endregion plugins/lighting/_component/lighting-hooks.test.js