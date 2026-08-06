//region plugins/jafting/ext/create/models/crafting-component-currencies.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CraftingComponent from '../../../../../../src/plugins/jafting/ext/create/__models/CraftingComponent.js';

/**
 * A crafting component is one line of a recipe, and it deliberately unifies three quite different
 * currencies behind a single interface: database rows, gold, and SDP points. Every operation has to
 * branch on which of those it is, and the branches do genuinely different things - gold moves
 * through the party purse, SDP is read off the leader but awarded to everyone, and database rows go
 * through the inventory. A component whose type matches none of them is a config error, and each
 * operation reports it rather than silently succeeding with a wrong currency.
 */
describe('CraftingComponent currencies (direct src import)', () =>
{
  /**
   * Builds a component of a given type and count.
   * @param {string} type The component type letter.
   * @param {number} [count] The quantity.
   * @param {number} [id] The database id, where applicable.
   * @returns {CraftingComponent}
   */
  function makeComponent(type, count = 1, id = 1)
  {
    return CraftingComponent.builder
      .id(id)
      .type(type)
      .count(count)
      .build();
  }

  beforeEach(() =>
  {
    globalThis.J = {
      JAFTING: {
        EXT: {
          CREATE: {
            Metadata: { usingSdp: () => true },
          },
        },
      },
    };

    globalThis.$dataItems = [ null, { id: 1, name: 'Potion' } ];
    globalThis.$dataWeapons = [ null, { id: 1, name: 'Sword' } ];
    globalThis.$dataArmors = [ null, { id: 1, name: 'Shield' } ];

    globalThis.$gameParty = {
      _gold: 500,
      _members: [],
      gold()
      {
        return this._gold;
      },
      gainGold(n)
      {
        this._gold += n;
      },
      loseGold(n)
      {
        this._gold -= n;
      },
      numItems: () => 0,
      gainItem: () => {},
      loseItem: () => {},
      members()
      {
        return this._members;
      },
      leader()
      {
        return this._members[0];
      },
    };
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.$gameParty;
    delete globalThis.$dataItems;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
  });

  //region resolving the underlying thing
  describe('getItem', () =>
  {
    it.each([
      [ 'Item', 'Potion' ],
      [ 'Weapon', 'Sword' ],
      [ 'Armor', 'Shield' ],
    ])('resolves a %s component to its database row', (typeKey, expectedName) =>
    {
      // Arrange & Act
      const item = makeComponent(CraftingComponent.Types[typeKey]).getItem();

      // Assert
      expect(item.name).toBe(expectedName);
    });

    it('refuses outright to classify a type it does not understand', () =>
    {
      // Arrange: an unrecognized type letter means the recipe config and this model disagree,
      // and every later branch would have to guess which currency was meant. Failing at the
      // classifier is louder, and happens before anything is spent.
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      const act = () => makeComponent('?').getItem();

      // Assert
      expect(act).toThrow(/type of this component is unsupported/);

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      error.mockRestore();
    });
  });

  describe('getComponentType', () =>
  {
    it('reports the type it was built with', () =>
    {
      // Arrange & Act
      const type = makeComponent(CraftingComponent.Types.Gold).getComponentType();

      // Assert
      expect(type).toBe(CraftingComponent.Types.Gold);
    });
  });
  //endregion resolving the underlying thing

  //region how much is held
  describe('currency predicates', () =>
  {
    /**
     * These are read from outside the class - {@link JaftingSalvageLedger.rowsFromCraftingComponents}
     * routes ledger rows by asking a component what kind of currency it is - so they are part of the
     * contract regardless of whether anything inside this file happens to branch on them.
     */
    it('isSdp is true for an SDP component', () =>
    {
      // Arrange, Act, Assert
      expect(makeComponent(CraftingComponent.Types.SDP).isSdp()).toBe(true);
    });

    it('isSdp is false for a gold component', () =>
    {
      // Arrange, Act, Assert
      expect(makeComponent(CraftingComponent.Types.Gold).isSdp()).toBe(false);
    });

    it('isGold is true for a gold component', () =>
    {
      // Arrange, Act, Assert
      expect(makeComponent(CraftingComponent.Types.Gold).isGold()).toBe(true);
    });

    it('isGold is false for an SDP component', () =>
    {
      // Arrange, Act, Assert
      expect(makeComponent(CraftingComponent.Types.SDP).isGold()).toBe(false);
    });
  });

  describe('getHandledQuantity', () =>
  {
    it('reads gold from the party purse', () =>
    {
      // Arrange & Act
      const held = makeComponent(CraftingComponent.Types.Gold).getHandledQuantity();

      // Assert
      expect(held).toBe(500);
    });

    it('reads SDP points from the party leader', () =>
    {
      // Arrange: points are read off one member even though spending affects everyone.
      $gameParty._members = [ { getSdpPoints: () => 120 } ];

      // Act
      const held = makeComponent(CraftingComponent.Types.SDP).getHandledQuantity();

      // Assert
      expect(held).toBe(120);
    });

    it('reads nothing for SDP when that system is not in use', () =>
    {
      // Arrange: J-SDP is optional, so a recipe referencing it in a game without it must not
      // claim the player has points to spend.
      globalThis.J.JAFTING.EXT.CREATE.Metadata.usingSdp = () => false;

      // Act
      const held = makeComponent(CraftingComponent.Types.SDP).getHandledQuantity();

      // Assert
      expect(held).toBe(0);
    });
  });
  //endregion how much is held

  //region moving currency
  describe('generate', () =>
  {
    it('adds gold to the party purse', () =>
    {
      // Arrange & Act
      makeComponent(CraftingComponent.Types.Gold, 250).generate();

      // Assert
      expect($gameParty.gold()).toBe(750);
    });

    it('awards SDP points to every party member', () =>
    {
      // Arrange: the award is flat per member rather than divided among them.
      const awarded = [];
      $gameParty._members = [
        { modSdpPoints: n => awarded.push(n) },
        { modSdpPoints: n => awarded.push(n) },
      ];

      // Act
      makeComponent(CraftingComponent.Types.SDP, 15).generate();

      // Assert
      expect(awarded).toEqual([ 15, 15 ]);
    });
  });

  describe('database-entry components', () =>
  {
    it('gains a database row through the inventory rather than a currency', () =>
    {
      // Arrange: the currency branches must not claim a plain item.
      const gained = [];
      $gameParty.gainItem = (item, n) => gained.push([ item.name, n ]);

      // Act
      makeComponent(CraftingComponent.Types.Item, 3).generate();

      // Assert
      expect(gained).toEqual([ [ 'Potion', 3 ] ]);
    });

    it('loses a database row through the inventory rather than a currency', () =>
    {
      // Arrange
      const lost = [];
      $gameParty.loseItem = (item, n) => lost.push([ item.name, n ]);

      // Act
      makeComponent(CraftingComponent.Types.Item, 2).consume();

      // Assert
      expect(lost).toEqual([ [ 'Potion', 2 ] ]);
    });

    it('affords a database row the party already holds enough of', () =>
    {
      // Arrange
      $gameParty.numItems = () => 5;

      // Act & Assert
      expect(makeComponent(CraftingComponent.Types.Item, 3).hasEnough()).toBe(true);
    });

    it('cannot afford a database row the party is short of', () =>
    {
      // Arrange
      $gameParty.numItems = () => 1;

      // Act & Assert
      expect(makeComponent(CraftingComponent.Types.Item, 3).hasEnough()).toBe(false);
    });

    it('reads how many of a database row the party holds', () =>
    {
      // Arrange
      $gameParty.numItems = () => 7;

      // Act
      const held = makeComponent(CraftingComponent.Types.Item).getHandledQuantity();

      // Assert
      expect(held).toBe(7);
    });
  });

  describe('consume', () =>
  {
    it('takes gold from the party purse', () =>
    {
      // Arrange & Act
      makeComponent(CraftingComponent.Types.Gold, 200).consume();

      // Assert
      expect($gameParty.gold()).toBe(300);
    });

    it('takes SDP points from every party member', () =>
    {
      // Arrange
      const taken = [];
      $gameParty._members = [
        { modSdpPoints: n => taken.push(n) },
        { modSdpPoints: n => taken.push(n) },
      ];

      // Act
      makeComponent(CraftingComponent.Types.SDP, 15).consume();

      // Assert
      expect(taken).toEqual([ -15, -15 ]);
    });
  });
  //endregion moving currency

  //region affordability
  describe('hasEnough', () =>
  {
    it('affords a gold cost within the purse', () =>
    {
      // Arrange & Act & Assert
      expect(makeComponent(CraftingComponent.Types.Gold, 200).hasEnough()).toBe(true);
    });

    it('cannot afford a gold cost beyond the purse', () =>
    {
      // Arrange & Act & Assert
      expect(makeComponent(CraftingComponent.Types.Gold, 900).hasEnough()).toBe(false);
    });

    it('affords an SDP cost within the leader\'s points', () =>
    {
      // Arrange
      $gameParty._members = [ { getSdpPoints: () => 120 } ];

      // Act & Assert
      expect(makeComponent(CraftingComponent.Types.SDP, 100).hasEnough()).toBe(true);
    });

    it('cannot afford an SDP cost beyond the leader\'s points', () =>
    {
      // Arrange
      $gameParty._members = [ { getSdpPoints: () => 50 } ];

      // Act & Assert
      expect(makeComponent(CraftingComponent.Types.SDP, 100).hasEnough()).toBe(false);
    });
  });
  //endregion affordability
});
//endregion plugins/jafting/ext/create/models/crafting-component-currencies.test.js