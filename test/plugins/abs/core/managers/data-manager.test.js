//region plugins/abs/core/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS DataManager (unit, all downstream dependencies mocked)', () =>
{
  let originalCreateGameObjects;
  let originalMakeSaveContents;
  let FakeJABS_Engine;
  let xhrInstances;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Aliased: { DataManager: new Map() },
        DefaultValues: { ActionMap: 5 },
      },
    };

    // bare-global engine extensions normally provided by J-Base; stubbed directly since this
    // fixture doesn't load that plugin.
    String.prototype.format = function(...args) { return this.replace(/%(\d+)/g, (_, i) => args[i - 1]); };
    Number.prototype.padZero = function(length) { return String(this).padStart(length, '0'); };

    FakeJABS_Engine = vi.fn();
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_Engine.js', () => ({ default: FakeJABS_Engine }));

    globalThis.Game_Enemies = vi.fn();

    originalCreateGameObjects = vi.fn();
    originalMakeSaveContents = vi.fn(() => ({ map: { _events: [] } }));
    globalThis.DataManager = {
      createGameObjects: originalCreateGameObjects,
      makeSaveContents: originalMakeSaveContents,
    };

    xhrInstances = [];
    globalThis.XMLHttpRequest = vi.fn(function()
    {
      this.open = vi.fn();
      this.overrideMimeType = vi.fn();
      this.send = vi.fn();
      xhrInstances.push(this);
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../../../../src/plugins/abs/core/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    originalCreateGameObjects.mockClear();
    originalMakeSaveContents.mockClear();
    FakeJABS_Engine.mockClear();
    globalThis.Game_Enemies.mockClear();
    xhrInstances = [];
    globalThis.$actionMap = null;
  });

  //region createGameObjects
  describe('createGameObjects', () =>
  {
    it('performs the original logic, refreshes the skill master map, and instantiates the engine and enemies registry', () =>
    {
      // Arrange (getSkillMasterMap fires synchronously during createGameObjects; stub it here so
      // this test doesn't also assert on the xhr side-effects covered by the dedicated block below-
      // restored via plain reassignment so the getSkillMasterMap describe block below still sees
      // the real method rather than a leftover mock).
      const realGetSkillMasterMap = globalThis.DataManager.getSkillMasterMap;
      const stubbedGetSkillMasterMap = vi.fn();
      globalThis.DataManager.getSkillMasterMap = stubbedGetSkillMasterMap;

      // Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(originalCreateGameObjects).toHaveBeenCalledTimes(1);
      expect(stubbedGetSkillMasterMap).toHaveBeenCalledTimes(1);
      expect(FakeJABS_Engine).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsEngine).toBeInstanceOf(FakeJABS_Engine);
      expect(globalThis.Game_Enemies).toHaveBeenCalledTimes(1);
      expect(globalThis.$gameEnemies).toBeInstanceOf(globalThis.Game_Enemies);

      // Cleanup
      globalThis.DataManager.getSkillMasterMap = realGetSkillMasterMap;
    });
  });
  //endregion createGameObjects

  //region getSkillMasterMap
  describe('getSkillMasterMap', () =>
  {
    it('loads the skill master map using the configured action map id, zero-padded to 3 digits', () =>
    {
      // Arrange
      const realLoadSkillMasterMap = globalThis.DataManager.loadSkillMasterMap;
      const stubbedLoadSkillMasterMap = vi.fn();
      globalThis.DataManager.loadSkillMasterMap = stubbedLoadSkillMasterMap;

      // Act
      globalThis.DataManager.getSkillMasterMap();

      // Assert
      expect(stubbedLoadSkillMasterMap).toHaveBeenCalledWith('$dataMap', 'Map005.json');

      // Cleanup
      globalThis.DataManager.loadSkillMasterMap = realLoadSkillMasterMap;
    });

    it('throws when no action map id is configured', () =>
    {
      // Arrange
      globalThis.J.ABS.DefaultValues.ActionMap = 0;

      // Act/Assert
      expect(() => globalThis.DataManager.getSkillMasterMap()).toThrow('Missing skill master map.');

      // Cleanup
      globalThis.J.ABS.DefaultValues.ActionMap = 5;
    });
  });
  //endregion getSkillMasterMap

  //region loadSkillMasterMap
  describe('loadSkillMasterMap', () =>
  {
    it('opens, configures, and sends an XHR request for the given source', () =>
    {
      // Act
      globalThis.DataManager.loadSkillMasterMap('$dataMap', 'Map005.json');

      // Assert
      expect(xhrInstances).toHaveLength(1);
      const [ xhr ] = xhrInstances;
      expect(xhr.open).toHaveBeenCalledWith('GET', 'data/Map005.json');
      expect(xhr.overrideMimeType).toHaveBeenCalledWith('application/json');
      expect(xhr.send).toHaveBeenCalled();
    });

    it('wires onload to onMapGet and onerror to gracefulFail', () =>
    {
      // Arrange
      const realOnMapGet = globalThis.DataManager.onMapGet;
      const realGracefulFail = globalThis.DataManager.gracefulFail;
      const stubbedOnMapGet = vi.fn();
      const stubbedGracefulFail = vi.fn();
      globalThis.DataManager.onMapGet = stubbedOnMapGet;
      globalThis.DataManager.gracefulFail = stubbedGracefulFail;

      // Act
      globalThis.DataManager.loadSkillMasterMap('$dataMap', 'Map005.json');
      const [ xhr ] = xhrInstances;
      xhr.onload();
      xhr.onerror();

      // Assert
      expect(stubbedOnMapGet).toHaveBeenCalledWith(xhr, '$dataMap', 'Map005.json', 'data/Map005.json');
      expect(stubbedGracefulFail).toHaveBeenCalledWith('$dataMap', 'Map005.json', 'data/Map005.json');

      // Cleanup
      globalThis.DataManager.onMapGet = realOnMapGet;
      globalThis.DataManager.gracefulFail = realGracefulFail;
    });
  });
  //endregion loadSkillMasterMap

  //region onMapGet
  describe('onMapGet', () =>
  {
    it('parses and stores the response as the action map on a successful status', () =>
    {
      // Arrange
      const xhr = { status: 200, responseText: '{"foo":"bar"}' };

      // Act
      globalThis.DataManager.onMapGet(xhr, '$dataMap', 'Map005.json', 'data/Map005.json');

      // Assert
      expect(globalThis.$actionMap).toEqual({ foo: 'bar' });
    });

    it('gracefully fails on a failing status without touching the action map', () =>
    {
      // Arrange
      const xhr = { status: 404, responseText: '' };
      const realGracefulFail = globalThis.DataManager.gracefulFail;
      const stubbedGracefulFail = vi.fn();
      globalThis.DataManager.gracefulFail = stubbedGracefulFail;

      // Act
      globalThis.DataManager.onMapGet(xhr, '$dataMap', 'Map005.json', 'data/Map005.json');

      // Assert
      expect(stubbedGracefulFail).toHaveBeenCalledWith('$dataMap', 'Map005.json', 'data/Map005.json');
      expect(globalThis.$actionMap).toBeNull();

      // Cleanup
      globalThis.DataManager.gracefulFail = realGracefulFail;
    });
  });
  //endregion onMapGet

  describe('gracefulFail', () =>
  {
    it('logs the failed file details', () =>
    {
      // Act
      globalThis.DataManager.gracefulFail('$dataMap', 'Map005.json', 'data/Map005.json');

      // Assert
      expect(console.error).toHaveBeenCalledWith('$dataMap', 'Map005.json', 'data/Map005.json');
    });
  });

  //region makeSaveContents
  describe('makeSaveContents', () =>
  {
    it('nulls out events that are JABS actions while preserving the rest', () =>
    {
      // Arrange
      const nonAction = { isJabsAction: vi.fn(() => false) };
      const jabsAction = { isJabsAction: vi.fn(() => true) };
      originalMakeSaveContents.mockReturnValue({ map: { _events: [ nonAction, jabsAction ] } });

      // Act
      const result = globalThis.DataManager.makeSaveContents();

      // Assert
      expect(result.map._events).toEqual([ nonAction, null ]);
    });

    it('preserves falsy (empty index) events as-is without calling isJabsAction', () =>
    {
      // Arrange
      originalMakeSaveContents.mockReturnValue({ map: { _events: [ undefined ] } });

      // Act
      const result = globalThis.DataManager.makeSaveContents();

      // Assert
      expect(result.map._events).toEqual([ undefined ]);
    });
  });
  //endregion makeSaveContents
});
//endregion plugins/abs/core/managers/data-manager.test.js
