//region plugins/_base/_component/game-actor-methods.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('J-Base Game_Actor methods (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();

    // vanilla RMMZ core prototype extensions (rmmz_core.js), not part of this plugin- real
    // Array#equals does deep recursive equality (JsonEx.makeDeepCopy snapshots produce new
    // object instances, so reference equality would always report "changed").
    Array.prototype.equals = function(array)
    {
      if (!array || this.length !== array.length) return false;

      const deepEqual = (a, b) =>
      {
        if (a === b) return true;
        if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;
        return aKeys.every(key => deepEqual(a[key], b[key]));
      };

      return this.every((value, index) => deepEqual(value, array[index]));
    };

    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // vanilla RMMZ Game_Actor/Game_Battler methods this file aliases- stubbed bare so
    // J.BASE.Aliased captures real functions rather than undefined.
    globalThis.Game_Battler.prototype.getNotesSources = function()
    {
      return [ this.databaseData(), ...this.skills(), ...this.allStates() ];
    };
    globalThis.Game_Battler.prototype.skills = function()
    {
      return [];
    };
    globalThis.Game_Battler.prototype.allStates = function()
    {
      return [ ...this.states() ];
    };
    globalThis.Game_Battler.prototype.states = function()
    {
      return (this._states ?? []).map(id => globalThis.$dataStates[id]);
    };
    globalThis.Game_Actor.prototype.setup = function(actorId)
    {
      this._actorId = actorId;
    };
    globalThis.Game_Actor.prototype.learnSkill = function(skillId)
    {
      if (!this._skills.includes(skillId)) this._skills.push(skillId);
    };
    globalThis.Game_Actor.prototype.forgetSkill = function(skillId)
    {
      const index = this._skills.indexOf(skillId);
      if (index >= 0) this._skills.splice(index, 1);
    };
    globalThis.Game_Actor.prototype.die = function()
    {
      this.hp = 0;
    };
    globalThis.Game_Actor.prototype.revive = function()
    {
      this.hp = 1;
    };
    globalThis.Game_Actor.prototype.changeClass = function(classId, _keepExp)
    {
      this._classId = classId;
    };
    globalThis.Game_Actor.prototype.changeEquip = function(slotId, item)
    {
      this._equips[slotId] = item;
    };
    globalThis.Game_Actor.prototype.discardEquip = function(item)
    {
      const index = this._equips.indexOf(item);
      if (index >= 0) this._equips.splice(index, 1);
    };
    globalThis.Game_Actor.prototype.forceChangeEquip = function(slotId, item)
    {
      this._equips[slotId] = item;
    };
    globalThis.Game_Actor.prototype.releaseUnequippableItems = function(_forcing)
    {
      // no-op by default; individual tests override _equips directly to simulate a release.
    };
    globalThis.Game_Actor.prototype.levelUp = function()
    {
      this._level += 1;
    };
    globalThis.Game_Actor.prototype.levelDown = function()
    {
      this._level -= 1;
    };

    // Game_BattlerBase/Game_Battler must patch first- Game_Actor calls into both via .call(this).
    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.$dataActors = [];
    globalThis.$dataClasses = [];
    globalThis.$dataStates = [];
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  /**
   * itemId() lives on the prototype (not as an own property) so JsonEx.makeDeepCopy's
   * JSON round-trip- which drops function-valued own properties- still leaves enough own
   * data (id/_dataClass/_item) for Array#equals to compare old vs. new snapshots meaningfully.
   */
  class FakeEquipItem
  {
    constructor(id, dataClass = 'weapon', innerItem = null)
    {
      this.id = id;
      this._dataClass = dataClass;
      this._item = innerItem;
    }

    itemId()
    {
      return this.id;
    }

    dataClass()
    {
      return this._dataClass;
    }

    underlyingObject()
    {
      return this._item;
    }
  }

  function buildActor()
  {
    const actor = Object.create(globalThis.Game_Actor.prototype);
    actor._actorId = 1;
    actor._classId = 1;
    actor._skills = [];
    actor._equips = [];
    actor._states = [];
    actor._level = 1;
    actor.initMembers();
    return actor;
  }

  describe('battlerId', () =>
  {
    it('delegates to actorId()', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.actorId = () => 7;

      // Act & Assert
      expect(actor.battlerId()).toBe(7);
    });
  });

  describe('databaseData', () =>
  {
    it('delegates to actor()', () =>
    {
      // Arrange
      const actor = buildActor();
      const data = { id: 1 };
      actor.actor = () => data;

      // Act & Assert
      expect(actor.databaseData()).toBe(data);
    });
  });

  describe('skillIds', () =>
  {
    it('merges learned skills and trait-granted skill ids, deduplicated', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._skills = [ 1, 2 ];
      actor.addedSkills = () => [ 2, 3 ];

      // Act
      const result = actor.skillIds();

      // Assert
      expect(result.sort()).toEqual([ 1, 2, 3 ]);
    });
  });

  describe('isLeader', () =>
  {
    it('returns true when $gameParty.leader() is this actor', () =>
    {
      // Arrange
      const actor = buildActor();
      globalThis.$gameParty = { leader: () => actor };

      // Act & Assert
      expect(actor.isLeader()).toBe(true);
    });

    it('returns false when $gameParty.leader() is a different actor', () =>
    {
      // Arrange
      const actor = buildActor();
      globalThis.$gameParty = { leader: () => ({}) };

      // Act & Assert
      expect(actor.isLeader()).toBe(false);
    });
  });

  describe('getActorNotes', () =>
  {
    it('returns the actor and its class', () =>
    {
      // Arrange
      const actor = buildActor();
      const rawActor = { classId: 5 };
      const rawClass = { id: 5 };
      actor.actor = () => rawActor;
      actor.class = (classId) => (classId === 5 ? rawClass : null);

      // Act
      const result = actor.getActorNotes();

      // Assert
      expect(result).toEqual([ rawActor, rawClass ]);
    });
  });

  describe('getNotesSources', () =>
  {
    it('combines the Game_Battler base sources with the actor\'s class and equipped items', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.databaseData = () => ({ note: 'db' });
      actor.currentClass = () => ({ note: 'class' });
      actor.equippedEquips = () => [ { note: 'equip' } ];

      // Act
      const result = actor.getNotesSources();

      // Assert
      expect(result.map(s => s.note)).toEqual([ 'db', 'class', 'equip' ]);
    });
  });

  describe('setup', () =>
  {
    it('fires onSetup with the given actorId', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onSetup = vi.fn();

      // Act
      actor.setup(3);

      // Assert
      expect(actor.onSetup).toHaveBeenCalledWith(3);
    });
  });

  describe('onSetup', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onSetup(1);

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('learnSkill', () =>
  {
    it('fires onLearnNewSkill when the skill was not already known', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._skills = [];
      actor.isLearnedSkill = (id) => actor._skills.includes(id);
      actor.onLearnNewSkill = vi.fn();

      // Act
      actor.learnSkill(5);

      // Assert
      expect(actor.onLearnNewSkill).toHaveBeenCalledWith(5);
    });

    it('does not fire onLearnNewSkill when the skill is already known', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._skills = [ 5 ];
      actor.isLearnedSkill = (id) => actor._skills.includes(id);
      actor.onLearnNewSkill = vi.fn();

      // Act
      actor.learnSkill(5);

      // Assert
      expect(actor.onLearnNewSkill).not.toHaveBeenCalled();
    });
  });

  describe('onLearnNewSkill', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onLearnNewSkill(5);

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('forgetSkill', () =>
  {
    it('fires onForgetSkill when the skill was known', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._skills = [ 5 ];
      actor.isLearnedSkill = (id) => actor._skills.includes(id);
      actor.onForgetSkill = vi.fn();

      // Act
      actor.forgetSkill(5);

      // Assert
      expect(actor.onForgetSkill).toHaveBeenCalledWith(5);
    });

    it('does not fire onForgetSkill when the skill was never known', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._skills = [];
      actor.isLearnedSkill = (id) => actor._skills.includes(id);
      actor.onForgetSkill = vi.fn();

      // Act
      actor.forgetSkill(5);

      // Assert
      expect(actor.onForgetSkill).not.toHaveBeenCalled();
    });
  });

  describe('onForgetSkill', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onForgetSkill(5);

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('die', () =>
  {
    it('fires onDeath', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onDeath = vi.fn();

      // Act
      actor.die();

      // Assert
      expect(actor.onDeath).toHaveBeenCalled();
    });
  });

  describe('onDeath', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onDeath();

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('revive', () =>
  {
    it('fires onRevive', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onRevive = vi.fn();

      // Act
      actor.revive();

      // Assert
      expect(actor.onRevive).toHaveBeenCalled();
    });
  });

  describe('onRevive', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onRevive();

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('onEquipChange', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onEquipChange();

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('changeClass', () =>
  {
    it('fires onClassChange with the classId and keepExp', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onClassChange = vi.fn();

      // Act
      actor.changeClass(9, true);

      // Assert
      expect(actor.onClassChange).toHaveBeenCalledWith(9, true);
    });
  });

  describe('onClassChange', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onClassChange(9, false);

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('changeEquip', () =>
  {
    it('fires onEquipChange when the equips actually change', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._equips = [ new FakeEquipItem(1) ];
      actor.onEquipChange = vi.fn();

      // Act
      actor.changeEquip(0, new FakeEquipItem(2));

      // Assert
      expect(actor.onEquipChange).toHaveBeenCalled();
    });

    it('does not fire onEquipChange when the equips are unchanged', () =>
    {
      // Arrange
      const actor = buildActor();
      const item = new FakeEquipItem(1);
      actor._equips = [ item ];
      actor.onEquipChange = vi.fn();

      // Act- re-equipping the exact same item reference leaves _equips unchanged.
      actor.changeEquip(0, item);

      // Assert
      expect(actor.onEquipChange).not.toHaveBeenCalled();
    });
  });

  describe('discardEquip', () =>
  {
    it('fires onEquipChange when the equips actually change', () =>
    {
      // Arrange
      const actor = buildActor();
      const item = new FakeEquipItem(1);
      actor._equips = [ item ];
      actor.onEquipChange = vi.fn();

      // Act
      actor.discardEquip(item);

      // Assert
      expect(actor.onEquipChange).toHaveBeenCalled();
    });

    it('does not fire onEquipChange when the discarded item was never equipped', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._equips = [];
      actor.onEquipChange = vi.fn();

      // Act
      actor.discardEquip(new FakeEquipItem(1));

      // Assert
      expect(actor.onEquipChange).not.toHaveBeenCalled();
    });
  });

  describe('forceChangeEquip', () =>
  {
    it('fires onEquipChange when the equips actually change', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._equips = [ new FakeEquipItem(1) ];
      actor.onEquipChange = vi.fn();

      // Act
      actor.forceChangeEquip(0, new FakeEquipItem(2));

      // Assert
      expect(actor.onEquipChange).toHaveBeenCalled();
    });

    it('does not fire onEquipChange when the equips are unchanged', () =>
    {
      // Arrange
      const actor = buildActor();
      const item = new FakeEquipItem(1);
      actor._equips = [ item ];
      actor.onEquipChange = vi.fn();

      // Act
      actor.forceChangeEquip(0, item);

      // Assert
      expect(actor.onEquipChange).not.toHaveBeenCalled();
    });
  });

  describe('releaseUnequippableItems', () =>
  {
    it('fires onEquipChange when haveEquipsChanged reports a change', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._equips = [ Object.assign(buildEquip('weapon', {}), { itemId: () => 1 }) ];
      actor.onEquipChange = vi.fn();
      actor.haveEquipsChanged = () => true;

      // Act
      actor.releaseUnequippableItems(true);

      // Assert
      expect(actor.onEquipChange).toHaveBeenCalled();
    });

    it('does not fire onEquipChange when haveEquipsChanged reports no change', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._equips = [ Object.assign(buildEquip('weapon', {}), { itemId: () => 1 }) ];
      actor.onEquipChange = vi.fn();
      actor.haveEquipsChanged = () => false;

      // Act
      actor.releaseUnequippableItems(true);

      // Assert
      expect(actor.onEquipChange).not.toHaveBeenCalled();
    });
  });

  /**
   * Builds a stand-in for a Game_Item exposing the accessors production code reads through.
   * @param {string} dataClass The database this equip is drawn from.
   * @param {object} underlying The underlying object this equip points at.
   */
  function buildEquip(dataClass, underlying)
  {
    return {
      dataClass: () => dataClass,
      underlyingObject: () => underlying,
    };
  }

  describe('haveEquipsChanged', () =>
  {
    it('returns true when the equip counts differ', () =>
    {
      // Arrange
      const actor = buildActor();
      actor._equips = [ Object.assign(buildEquip('weapon', {}), { itemId: () => 1 }) ];
      const oldEquips = [];

      // Act & Assert
      expect(actor.haveEquipsChanged(oldEquips)).toBe(true);
    });

    it('returns true when an equip\'s item id differs at the same slot', () =>
    {
      // Arrange
      const actor = buildActor();
      const newItem = buildEquip('weapon', {});
      newItem.itemId = () => 2;
      actor._equips = [ newItem ];
      const oldItem = buildEquip('weapon', newItem.underlyingObject());
      oldItem.itemId = () => 1;

      // Act & Assert
      expect(actor.haveEquipsChanged([ oldItem ])).toBe(true);
    });

    it('returns true when an equip\'s data class differs at the same slot', () =>
    {
      // Arrange
      const actor = buildActor();
      const sharedItem = {};
      const newItem = buildEquip('armor', sharedItem);
      newItem.itemId = () => 1;
      actor._equips = [ newItem ];
      const oldItem = buildEquip('weapon', sharedItem);
      oldItem.itemId = () => 1;

      // Act & Assert
      expect(actor.haveEquipsChanged([ oldItem ])).toBe(true);
    });

    it('returns true when an equip\'s inner item reference differs at the same slot', () =>
    {
      // Arrange
      const actor = buildActor();
      const newItem = buildEquip('weapon', {});
      newItem.itemId = () => 1;
      actor._equips = [ newItem ];
      const oldItem = buildEquip('weapon', {});
      oldItem.itemId = () => 1;

      // Act & Assert
      expect(actor.haveEquipsChanged([ oldItem ])).toBe(true);
    });

    it('returns false when every slot is identical', () =>
    {
      // Arrange
      const actor = buildActor();
      const sharedItem = {};
      const equip = buildEquip('weapon', sharedItem);
      equip.itemId = () => 1;
      actor._equips = [ equip ];

      // Act & Assert
      expect(actor.haveEquipsChanged([ equip ])).toBe(false);
    });
  });

  describe('traitObjects', () =>
  {
    it('routes through the Game_BattlerBase cache wrapper', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.buildTraitObjects = () => [ { id: 'built' } ];

      // Act
      const result = actor.traitObjects();

      // Assert
      expect(result).toEqual([ { id: 'built' } ]);
    });
  });

  describe('buildTraitObjects', () =>
  {
    it('combines states, the actor entry, current class, and equipped items', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.states = () => [ { tag: 'state' } ];
      actor.actor = () => ({ tag: 'actor' });
      actor.currentClass = () => ({ tag: 'class' });
      actor.equippedEquips = () => [ { tag: 'equip' } ];

      // Act
      const result = actor.buildTraitObjects();

      // Assert
      expect(result.map(r => r.tag)).toEqual([ 'state', 'actor', 'class', 'equip' ]);
    });
  });

  describe('equippedEquips', () =>
  {
    it('filters out empty equip slots', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.equips = () => [ { id: 1 }, null, { id: 2 } ];

      // Act
      const result = actor.equippedEquips();

      // Assert
      expect(result).toEqual([ { id: 1 }, { id: 2 } ]);
    });
  });

  describe('setLevel', () =>
  {
    it('changes exp to the threshold for the target level', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.expForLevel = (level) => (level === 10 ? 5000 : -1);
      actor.changeExp = vi.fn();

      // Act
      actor.setLevel(10);

      // Assert
      expect(actor.changeExp).toHaveBeenCalledWith(5000, false);
    });
  });

  describe('onLevelUp', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onLevelUp();

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('levelUp', () =>
  {
    it('fires onLevelUp', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onLevelUp = vi.fn();

      // Act
      actor.levelUp();

      // Assert
      expect(actor.onLevelUp).toHaveBeenCalled();
    });
  });

  describe('onLevelDown', () =>
  {
    it('flags the battler for a data-change refresh', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onBattlerDataChange = vi.fn();

      // Act
      actor.onLevelDown();

      // Assert
      expect(actor.onBattlerDataChange).toHaveBeenCalled();
    });
  });

  describe('levelDown', () =>
  {
    it('fires onLevelDown', () =>
    {
      // Arrange
      const actor = buildActor();
      actor.onLevelDown = vi.fn();

      // Act
      actor.levelDown();

      // Assert
      expect(actor.onLevelDown).toHaveBeenCalled();
    });
  });

  describe('getBaseMaxTp', () =>
  {
    it('returns J.BASE.Metadata.BaseTpMaxActors', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act
      const result = actor.getBaseMaxTp();

      // Assert
      expect(result).toBe(globalThis.J.BASE.Metadata.BaseTpMaxActors);
    });
  });
});
//endregion plugins/_base/_component/game-actor-methods.test.js
