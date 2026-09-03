//region plugins/_base/_component/data-manager.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJabsOnChanceEffectGlobalStub } from './fixtures/install-jabs-onchance-stub.js';
import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('DataManager (direct src import)', () =>
{
  let RPGManager;
  let RPG_Actor;
  let RPG_Armor;
  let RPG_Class;
  let RPG_Enemy;
  let RPG_Item;
  let RPG_Skill;
  let RPG_State;
  let RPG_Weapon;

  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();
    installJabsOnChanceEffectGlobalStub(globalThis);

    // real production code- sets up J.BASE.Aliased.DataManager among other maps.
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    globalThis.RPGManager = RPGManager;

    ({ default: RPG_Actor } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Actor.js'));
    ({ default: RPG_Armor } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Armor.js'));
    ({ default: RPG_Class } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Class.js'));
    ({ default: RPG_Enemy } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Enemy.js'));
    ({ default: RPG_Item } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Item.js'));
    ({ default: RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));
    ({ default: RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));
    ({ default: RPG_Weapon } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Weapon.js'));

    // patches globalThis.DataManager directly, no vm involved.
    await import('../../../../../src/plugins/_base/core/managers/DataManager.js');

    // the real accessor, so the load walk can be exercised against a genuine actor store.
    await import('../../../../../src/plugins/_base/core/objects/Game_Actors.js');
  });

  afterAll(() =>
  {
    RPGManager.clearCache();
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    RPGManager.clearCache();
    globalThis.DataManager._j._databaseRewriteProcessed = false;
  });

  const rawActor = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0, traits: [], battlerName: '', characterIndex: 0, characterName: '', classId: 0, equips: [ 0, 0, 0, 0, 0 ], faceIndex: 0, faceName: '', initialLevel: 1, maxLevel: 99, nickname: '', profile: '' };
  const rawArmor = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0, traits: [], etypeId: 1, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ], price: 0, atypeId: 1 };
  const rawClass = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0, traits: [], expParams: [ 0, 0, 0, 0 ], learnings: [], params: [ [ 1 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ], [ 0 ] ] };
  const rawEnemy = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0, traits: [], battlerName: '', actions: [], battlerHue: 0, dropItems: [], exp: 0, gold: 0, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ] };
  const rawItem = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0, animationId: -1, damage: { critical: false, elementId: -1, formula: '0', type: 0, variance: 0 }, effects: [], hitType: 0, occasion: 0, repeats: 1, scope: 0, speed: 0, successRate: 100, tpGain: 0, consumable: true, itypeId: 1, price: 0 };
  const rawSkill = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0, animationId: -1, damage: { critical: false, elementId: -1, formula: '0', type: 0, variance: 0 }, effects: [], hitType: 0, occasion: 0, repeats: 1, scope: 0, speed: 0, successRate: 100, tpGain: 0, message1: '', message2: '', mpCost: 0, requiredWtypeId1: 0, requiredWtypeId2: 0, stypeId: 0, tpCost: 0 };
  const rawState = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0, traits: [], autoRemovalTiming: 0, chanceByDamage: 100, maxTurns: 1, message1: '', message2: '', message3: '', message4: '', minTurns: 1, motion: 0, overlay: 0, priority: 50, removeAtBattleEnd: false, removeByDamage: false, removeByRestriction: false, removeByWalking: false, restriction: 0, stepsToRemove: 100 };
  const rawWeapon = { id: 1, name: '', note: '', meta: {}, description: '', iconIndex: 0, traits: [], etypeId: 1, params: [ 1, 0, 0, 0, 0, 0, 0, 0 ], price: 0, animationId: -1, wtypeId: 1 };

  describe('isRewriteProcessed / rewriteProcessed', () =>
  {
    it('starts false and flips to true once rewriteProcessed() is called', () =>
    {
      // Arrange
      expect(globalThis.DataManager.isRewriteProcessed()).toBe(false);

      // Act
      globalThis.DataManager.rewriteProcessed();

      // Assert
      expect(globalThis.DataManager.isRewriteProcessed()).toBe(true);
    });
  });

  describe('isDatabaseLoaded', () =>
  {
    it('invokes onDatabaseLoad when the database finishes loading', () =>
    {
      // Arrange
      const onLoadSpy = vi.spyOn(globalThis.DataManager, 'onDatabaseLoad').mockImplementation(() => {});

      // Act
      const result = globalThis.DataManager.isDatabaseLoaded();

      // Assert- the fixture's aliased original always returns true.
      expect(result).toBe(true);
      expect(onLoadSpy).toHaveBeenCalled();
      onLoadSpy.mockRestore();
    });

    it('does not invoke onDatabaseLoad when the database has not finished loading', () =>
    {
      // Arrange
      const original = globalThis.J.BASE.Aliased.DataManager.get('isDatabaseLoaded');
      globalThis.J.BASE.Aliased.DataManager.set('isDatabaseLoaded', () => false);
      const onLoadSpy = vi.spyOn(globalThis.DataManager, 'onDatabaseLoad').mockImplementation(() => {});

      // Act
      const result = globalThis.DataManager.isDatabaseLoaded();

      // Assert
      expect(result).toBe(false);
      expect(onLoadSpy).not.toHaveBeenCalled();
      onLoadSpy.mockRestore();
      globalThis.J.BASE.Aliased.DataManager.set('isDatabaseLoaded', original);
    });
  });

  describe('onDatabaseLoad', () =>
  {
    it('rewrites the database when the rewrite has not yet been processed', () =>
    {
      // Arrange
      const rewriteSpy = vi.spyOn(globalThis.DataManager, 'rewriteDatabaseData').mockImplementation(() => {});

      // Act
      globalThis.DataManager.onDatabaseLoad();

      // Assert
      expect(rewriteSpy).toHaveBeenCalled();
      rewriteSpy.mockRestore();
    });

    it('skips rewriting when the rewrite was already processed', () =>
    {
      // Arrange
      globalThis.DataManager.rewriteProcessed();
      const rewriteSpy = vi.spyOn(globalThis.DataManager, 'rewriteDatabaseData').mockImplementation(() => {});

      // Act
      globalThis.DataManager.onDatabaseLoad();

      // Assert
      expect(rewriteSpy).not.toHaveBeenCalled();
      rewriteSpy.mockRestore();
    });
  });

  describe('rewriteDatabaseData', () =>
  {
    it('rewrites every database category and flips the processed flag', () =>
    {
      // Arrange
      globalThis.$dataActors = [ null, rawActor ];
      globalThis.$dataArmors = [ null, rawArmor ];
      globalThis.$dataClasses = [ null, rawClass ];
      globalThis.$dataEnemies = [ null, rawEnemy ];
      globalThis.$dataItems = [ null, rawItem ];
      globalThis.$dataSkills = [ null, rawSkill ];
      globalThis.$dataStates = [ null, rawState ];
      globalThis.$dataWeapons = [ null, rawWeapon ];

      // Act
      globalThis.DataManager.rewriteDatabaseData();

      // Assert
      expect(globalThis.$dataActors[1]).toBeInstanceOf(RPG_Actor);
      expect(globalThis.$dataArmors[1]).toBeInstanceOf(RPG_Armor);
      expect(globalThis.$dataClasses[1]).toBeInstanceOf(RPG_Class);
      expect(globalThis.$dataEnemies[1]).toBeInstanceOf(RPG_Enemy);
      expect(globalThis.$dataItems[1]).toBeInstanceOf(RPG_Item);
      expect(globalThis.$dataSkills[1]).toBeInstanceOf(RPG_Skill);
      expect(globalThis.$dataStates[1]).toBeInstanceOf(RPG_State);
      expect(globalThis.$dataWeapons[1]).toBeInstanceOf(RPG_Weapon);
      expect(globalThis.DataManager.isRewriteProcessed()).toBe(true);
    });
  });

  describe.each([
    [ 'Actor', 'rewriteActorData', '$dataActors', rawActor, () => RPG_Actor, 'actorRewriteClass' ],
    [ 'Armor', 'rewriteArmorData', '$dataArmors', rawArmor, () => RPG_Armor, 'armorRewriteClass' ],
    [ 'Class', 'rewriteClassData', '$dataClasses', rawClass, () => RPG_Class, 'classRewriteClass' ],
    [ 'Enemy', 'rewriteEnemyData', '$dataEnemies', rawEnemy, () => RPG_Enemy, 'enemyRewriteClass' ],
    [ 'Item', 'rewriteItemData', '$dataItems', rawItem, () => RPG_Item, 'itemRewriteClass' ],
    [ 'Skill', 'rewriteSkillData', '$dataSkills', rawSkill, () => RPG_Skill, 'skillRewriteClass' ],
    [ 'State', 'rewriteStateData', '$dataStates', rawState, () => RPG_State, 'stateRewriteClass' ],
    [ 'Weapon', 'rewriteWeaponData', '$dataWeapons', rawWeapon, () => RPG_Weapon, 'weaponRewriteClass' ],
  ])('rewrite%sData', (label, method, globalKey, raw, getExpectedClass, rewriteClassGetter) =>
  {
    it(`preserves a null entry at its original index for ${label}`, () =>
    {
      // Arrange
      globalThis[globalKey] = [ null ];

      // Act
      globalThis.DataManager[method]();

      // Assert
      expect(globalThis[globalKey][0]).toBeNull();
    });

    it(`wraps a non-null entry in the ${label} rewrite class`, () =>
    {
      // Arrange
      globalThis[globalKey] = [ null, raw ];

      // Act
      globalThis.DataManager[method]();

      // Assert
      expect(globalThis[globalKey][1]).toBeInstanceOf(getExpectedClass());
    });

    it(`${rewriteClassGetter} returns the ${label} implementation class`, () =>
    {
      // Arrange & Act
      const result = globalThis.DataManager[rewriteClassGetter]();

      // Assert
      expect(result).toBe(getExpectedClass());
    });
  });

  describe('isSkill / isItem / isWeapon / isArmor', () =>
  {
    it('isSkill returns true for an object with stypeId', () =>
    {
      expect(globalThis.DataManager.isSkill({ stypeId: 1 })).toBeTruthy();
    });

    it('isSkill returns false for an object without stypeId', () =>
    {
      expect(globalThis.DataManager.isSkill({})).toBe(false);
    });

    it('isSkill returns falsy for a falsy input without throwing', () =>
    {
      expect(globalThis.DataManager.isSkill(null)).toBeFalsy();
    });

    it('isItem returns true for an object with itypeId', () =>
    {
      expect(globalThis.DataManager.isItem({ itypeId: 1 })).toBeTruthy();
    });

    it('isItem returns false for an object without itypeId', () =>
    {
      expect(globalThis.DataManager.isItem({})).toBe(false);
    });

    it('isWeapon returns true for an object with wtypeId', () =>
    {
      expect(globalThis.DataManager.isWeapon({ wtypeId: 1 })).toBeTruthy();
    });

    it('isWeapon returns false for an object without wtypeId', () =>
    {
      expect(globalThis.DataManager.isWeapon({})).toBe(false);
    });

    it('isArmor returns true for an object with atypeId', () =>
    {
      expect(globalThis.DataManager.isArmor({ atypeId: 1 })).toBeTruthy();
    });

    it('isArmor returns false for an object without atypeId', () =>
    {
      expect(globalThis.DataManager.isArmor({})).toBe(false);
    });
  });

  describe('setupNewGame', () =>
  {
    it('clears the RPGManager cache before performing original logic', () =>
    {
      // Arrange
      const clearSpy = vi.spyOn(RPGManager, 'clearCache');

      // Act
      globalThis.DataManager.setupNewGame();

      // Assert
      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it('reserves the configured startup event for the first map to execute', () =>
    {
      // Arrange- a configured id, and a $gameTemp to catch what gets handed to the engine.
      const originalId = globalThis.J.BASE.Metadata.newGameCommonEventId;
      globalThis.J.BASE.Metadata.newGameCommonEventId = 60;
      globalThis.$gameTemp = { reserveCommonEvent: vi.fn() };

      // Act
      globalThis.DataManager.setupNewGame();

      // Assert- the configured id itself must arrive, not merely "a reservation happened".
      expect(globalThis.$gameTemp.reserveCommonEvent).toHaveBeenCalledWith(60);

      globalThis.J.BASE.Metadata.newGameCommonEventId = originalId;
      globalThis.$gameTemp = undefined;
    });

    it('reserves nothing when the startup event sits at the disabled sentinel', () =>
    {
      // Arrange- 0 means this game bootstraps from its maps instead.
      const originalId = globalThis.J.BASE.Metadata.newGameCommonEventId;
      globalThis.J.BASE.Metadata.newGameCommonEventId = 0;
      globalThis.$gameTemp = { reserveCommonEvent: vi.fn() };
      const clearSpy = vi.spyOn(RPGManager, 'clearCache');

      // Act
      globalThis.DataManager.setupNewGame();

      // Assert- the cache clear anchors that setup actually ran, so the absent reservation is the
      // guard's doing rather than a method that never reached it.
      expect(clearSpy).toHaveBeenCalled();
      expect(globalThis.$gameTemp.reserveCommonEvent).not.toHaveBeenCalled();

      clearSpy.mockRestore();
      globalThis.J.BASE.Metadata.newGameCommonEventId = originalId;
      globalThis.$gameTemp = undefined;
    });
  });

  describe('extractSaveContents', () =>
  {
    /**
     * Stands up a minimal `$gameActors` whose store holds the given actors, mirroring the sparse,
     * id-indexed array the engine keeps.
     * @param {object[]} actors The actors to seed the store with, in id order from index 1.
     * @returns {object} The stubbed actor store.
     */
    const installGameActors = actors =>
    {
      const store = [];
      actors.forEach((actor, index) => store[ index + 1 ] = actor);
      globalThis.$gameActors = { existingActors: () => store };

      return globalThis.$gameActors;
    };

    it('clears the RPGManager cache before applying save contents', () =>
    {
      // Arrange
      const clearSpy = vi.spyOn(RPGManager, 'clearCache');
      const contents = { some: 'data' };
      installGameActors([]);

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert
      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it('invalidates the battler caches of every restored actor', () =>
    {
      // Arrange
      const first = { onBattlerDataChange: vi.fn() };
      const second = { onBattlerDataChange: vi.fn() };
      installGameActors([ first, second ]);

      // Act
      globalThis.DataManager.extractSaveContents({ some: 'data' });

      // Assert
      expect(first.onBattlerDataChange).toHaveBeenCalledTimes(1);
      expect(second.onBattlerDataChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateLoadedBattlerCaches', () =>
  {
    it('touches every actor the store hands back', () =>
    {
      // Arrange- ids 1 and 3 exist, id 2 was never materialized, and the accessor has compacted.
      const first = { onBattlerDataChange: vi.fn() };
      const third = { onBattlerDataChange: vi.fn() };
      globalThis.$gameActors = { existingActors: () => [ first, third ] };

      // Act
      globalThis.DataManager.invalidateLoadedBattlerCaches();

      // Assert
      expect(first.onBattlerDataChange).toHaveBeenCalledTimes(1);
      expect(third.onBattlerDataChange).toHaveBeenCalledTimes(1);
    });

    it('survives the explicit nulls a restored actor store carries', () =>
    {
      // Arrange- exercise the real accessor against a round-tripped store rather than a stub, since
      // this walk only ever runs on a store that has just come back out of a savefile.
      const first = { onBattlerDataChange: vi.fn() };
      const live = [];
      live[ 1 ] = { marker: 'first' };
      const restored = JSON.parse(JSON.stringify(live));
      restored[ 1 ] = first;
      const actors = new globalThis.Game_Actors();
      actors._data = restored;
      globalThis.$gameActors = actors;

      // Act
      globalThis.DataManager.invalidateLoadedBattlerCaches();

      // Assert
      expect(first.onBattlerDataChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('setupBattleTest', () =>
  {
    it('clears the RPGManager cache before entering battle test', () =>
    {
      // Arrange
      const clearSpy = vi.spyOn(RPGManager, 'clearCache');

      // Act
      globalThis.DataManager.setupBattleTest();

      // Assert
      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });
  });
});
//endregion plugins/_base/_component/data-manager.test.js
