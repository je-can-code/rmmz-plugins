//region plugins/passive/core/objects/game-party.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../_component/fixtures/install-passive-host-globals.js';

describe('J-Passive Game_Party (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../../src/plugins/passive/core/_metadata/initialization.js');

    globalThis.Game_Party.prototype.initMembers = function() {};
    globalThis.Game_Party.prototype.gainItem = function() {};
    globalThis.Game_Party.prototype.allItemsQuantified = function() { return this.__items ?? []; };

    // patches globalThis.Game_Party.prototype directly, no vm involved.
    await import('../../../../../src/plugins/passive/core/objects/Game_Party.js');
  });

  /** Builds a fresh Game_Party-shaped instance with initPassiveItemStates already run. */
  function buildParty()
  {
    const party = Object.create(globalThis.Game_Party.prototype);
    party.initPassiveItemStates();
    return party;
  }

  /** Builds a minimal item-quantity-shaped stub row. */
  function buildItem(overrides = {})
  {
    return {
      uniquePassiveStateIds: [],
      passiveStateIds: [],
      ...overrides,
    };
  }

  describe('initMembers (extended)', () =>
  {
    it('initializes empty passive state tracking structures', () =>
    {
      // Act
      const party = buildParty();

      // Assert
      expect(party.passiveStateIds()).toEqual([]);
      expect(party.passiveStates()).toEqual([]);
    });

    it('routes through Game_Party.prototype.initMembers, which delegates to the base', () =>
    {
      // Arrange
      const party = Object.create(globalThis.Game_Party.prototype);

      // Act
      party.initMembers();

      // Assert
      expect(party.passiveStateIds()).toEqual([]);
    });
  });

  describe('state', () =>
  {
    it('resolves a state id against $dataStates', () =>
    {
      // Arrange
      const party = buildParty();
      globalThis.$dataStates = [ null, { id: 1, name: 'Regen' } ];

      // Act & Assert
      expect(party.state(1)).toEqual({ id: 1, name: 'Regen' });
    });
  });

  describe('clearPassiveStates / addPassiveStateId', () =>
  {
    it('adds a state id and its converted form when duplicates are allowed', () =>
    {
      // Arrange
      const party = buildParty();
      globalThis.$dataStates = [ null, { id: 1, name: 'Regen' } ];

      // Act
      party.addPassiveStateId(1);
      party.addPassiveStateId(1);

      // Assert
      expect(party.passiveStateIds()).toEqual([ 1, 1 ]);
      expect(party.passiveStates()).toEqual([ { id: 1, name: 'Regen' }, { id: 1, name: 'Regen' } ]);
    });

    it('skips adding a duplicate id when allowDuplicates is false', () =>
    {
      // Arrange
      const party = buildParty();
      globalThis.$dataStates = [ null, { id: 1, name: 'Regen' } ];
      party.addPassiveStateId(1);

      // Act
      party.addPassiveStateId(1, false);

      // Assert
      expect(party.passiveStateIds()).toEqual([ 1 ]);
    });

    it('empties both trackers', () =>
    {
      // Arrange
      const party = buildParty();
      globalThis.$dataStates = [ null, { id: 1, name: 'Regen' } ];
      party.addPassiveStateId(1);

      // Act
      party.clearPassiveStates();

      // Assert
      expect(party.passiveStateIds()).toEqual([]);
      expect(party.passiveStates()).toEqual([]);
    });
  });

  describe('getAllUniquePassiveStateIds', () =>
  {
    it('collects unique ids across every owned item', () =>
    {
      // Arrange
      const party = buildParty();
      party.__items = [ buildItem({ uniquePassiveStateIds: [ 1, 2 ] }), buildItem({ uniquePassiveStateIds: [ 2, 3 ] }) ];

      // Act
      const result = party.getAllUniquePassiveStateIds();

      // Assert
      expect(result).toEqual(new Set([ 1, 2, 3 ]));
    });
  });

  describe('getAllStackablePassiveStateIds', () =>
  {
    it('sums stackable contributions across every owned item', () =>
    {
      // Arrange
      const party = buildParty();
      party.__items = [ buildItem({ passiveStateIds: [ 1 ] }), buildItem({ passiveStateIds: [ 1, 2 ] }) ];

      // Act
      const result = party.getAllStackablePassiveStateIds();

      // Assert
      expect(result).toEqual(new Map([ [ 1, 2 ], [ 2, 1 ] ]));
    });
  });

  describe('refreshPassiveStates', () =>
  {
    it('commits unique ids first, then stackable ids that are not already unique', () =>
    {
      // Arrange- state 1 is both unique and stackable (unique wins); state 2 is stackable, contributed twice.
      const party = buildParty();
      globalThis.$dataStates = [ null, { id: 1 }, { id: 2 } ];
      party.__items = [
        buildItem({ uniquePassiveStateIds: [ 1 ] }),
        buildItem({ passiveStateIds: [ 1, 2, 2 ] }),
      ];

      // Act
      party.refreshPassiveStates();

      // Assert
      expect(party.passiveStateIds()).toEqual([ 1, 2, 2 ]);
    });
  });

  describe('gainItem (extended)', () =>
  {
    it('refreshes passive states after the base gainItem logic', () =>
    {
      // Arrange
      const party = buildParty();
      const baseGainItem = vi.fn();
      globalThis.J.PASSIVE.Aliased.Game_Party.set('gainItem', baseGainItem);
      const refreshSpy = vi.spyOn(party, 'refreshPassiveStates').mockImplementation(() => {});
      const item = { id: 1 };

      // Act
      party.gainItem(item, 1, true);

      // Assert
      expect(baseGainItem).toHaveBeenCalledWith(item, 1, true);
      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});
//endregion plugins/passive/core/objects/game-party.test.js
