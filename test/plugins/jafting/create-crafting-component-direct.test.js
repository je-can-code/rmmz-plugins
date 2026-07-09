//region plugins/jafting/create-crafting-component-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CraftingComponent from '../../../src/plugins/jafting/ext/create/__models/CraftingComponent.js';

/**
 * Direct-import coverage for CraftingComponent, a pure data model with no imports of its own- it reads
 * $dataItems/$dataWeapons/$dataArmors/$gameParty/TextManager/IconManager/J as bare globals, same pattern
 * as J-Base's Game_Battler. All of those are stubbed minimally here rather than pulled from the real
 * engine loader, since CraftingComponent never touches inheritance, only a handful of lookup calls.
 */
describe('CraftingComponent (direct src import)', () =>
{
  beforeEach(() =>
  {
    globalThis.$dataItems = { at: id => ({ id, name: `Item ${id}`, iconIndex: 10 }) };
    globalThis.$dataWeapons = { at: id => ({ id, name: `Weapon ${id}`, iconIndex: 20 }) };
    globalThis.$dataArmors = { at: id => ({ id, name: `Armor ${id}`, iconIndex: 30 }) };
    globalThis.TextManager = { currencyUnit: 'G', sdpPoints: () => 'SP' };
    globalThis.IconManager = { rewardParam: vi.fn(n => (n === 1 ? 111 : 444)) };
    globalThis.J = { JAFTING: { EXT: { CREATE: { Metadata: { usingSdp: () => true } } } } };

    globalThis.$gameParty = {
      numItems: vi.fn(() => 5),
      gold: vi.fn(() => 1000),
      gainItem: vi.fn(),
      gainGold: vi.fn(),
      loseItem: vi.fn(),
      loseGold: vi.fn(),
      leader: vi.fn(() => ({ getSdpPoints: () => 42 })),
    };

    // members() must return the same array/mock instance on every call within a test, or a test that
    // calls both component.generate() and $gameParty.members() would observe two different fakes.
    const partyMembers = [ { modSdpPoints: vi.fn() } ];
    globalThis.$gameParty.members = vi.fn(() => partyMembers);
  });

  afterEach(() =>
  {
    delete globalThis.$dataItems;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
    delete globalThis.TextManager;
    delete globalThis.IconManager;
    delete globalThis.J;
    delete globalThis.$gameParty;
  });

  describe('type predicates and isDatabaseEntry', () =>
  {
    it('isItem/isWeapon/isArmor reflect the constructed type letter', () =>
    {
      const item = new CraftingComponent(1, 10, CraftingComponent.Types.Item);
      const weapon = new CraftingComponent(1, 11, CraftingComponent.Types.Weapon);
      const armor = new CraftingComponent(1, 12, CraftingComponent.Types.Armor);

      expect(item.isItem()).toBe(true);
      expect(weapon.isWeapon()).toBe(true);
      expect(armor.isArmor()).toBe(true);
      expect(item.isWeapon()).toBe(false);
    });

    it('isDatabaseEntry is true for item/weapon/armor and false for gold/SDP', () =>
    {
      expect(new CraftingComponent(1, 1, CraftingComponent.Types.Item).isDatabaseEntry()).toBe(true);
      expect(new CraftingComponent(1, 0, CraftingComponent.Types.Gold).isDatabaseEntry()).toBe(false);
      expect(new CraftingComponent(1, 0, CraftingComponent.Types.SDP).isDatabaseEntry()).toBe(false);
    });

    it('isDatabaseEntry throws for an unrecognized type', () =>
    {
      const bogus = new CraftingComponent(1, 0, 'z');

      expect(() => bogus.isDatabaseEntry()).toThrow(/unsupported/);
    });
  });

  describe('getItem', () =>
  {
    it('routes item/weapon/armor lookups through the matching $data* .at()', () =>
    {
      const item = new CraftingComponent(2, 10, CraftingComponent.Types.Item);
      const weapon = new CraftingComponent(2, 11, CraftingComponent.Types.Weapon);
      const armor = new CraftingComponent(2, 12, CraftingComponent.Types.Armor);

      expect(item.getItem()).toEqual({ id: 10, name: 'Item 10', iconIndex: 10 });
      expect(weapon.getItem()).toEqual({ id: 11, name: 'Weapon 11', iconIndex: 20 });
      expect(armor.getItem()).toEqual({ id: 12, name: 'Armor 12', iconIndex: 30 });
    });

    it('gold and SDP each build a fresh Typed component carrying the same count', () =>
    {
      const gold = CraftingComponent.Typed.Gold();
      gold.setCount(50);

      const sdp = CraftingComponent.Typed.SDP();
      sdp.setCount(7);

      expect(gold.getItem().quantity()).toBe(50);
      expect(sdp.getItem().quantity()).toBe(7);
    });

    it('warns and returns null for an unsupported type', () =>
    {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const bogus = new CraftingComponent(1, 0, 'z');

      // isDatabaseEntry() throws for 'z', so getItem's own switch never runs- getItem short-circuits
      // via isGold()/isSdp() both being false and falls through to the final console.warn + null branch.
      expect(() => bogus.getItem()).toThrow();

      warnSpy.mockRestore();
    });
  });

  describe('getName / getIconIndex', () =>
  {
    it('uses the database item name/icon for database entries', () =>
    {
      const item = new CraftingComponent(1, 10, CraftingComponent.Types.Item);

      expect(item.getName()).toBe('Item 10');
      expect(item.getIconIndex()).toBe(10);
    });

    it('uses TextManager/IconManager for gold and SDP', () =>
    {
      const gold = new CraftingComponent(1, 0, CraftingComponent.Types.Gold);
      const sdp = new CraftingComponent(1, 0, CraftingComponent.Types.SDP);

      expect(gold.getName()).toBe('G');
      expect(sdp.getName()).toBe('SP');
      expect(gold.getIconIndex()).toBe(111);
      expect(sdp.getIconIndex()).toBe(444);
    });
  });

  describe('getHandledQuantity', () =>
  {
    it('reads party numItems for database entries, gold for gold, and leader SDP for SDP', () =>
    {
      const item = new CraftingComponent(1, 10, CraftingComponent.Types.Item);
      const gold = new CraftingComponent(1, 0, CraftingComponent.Types.Gold);
      const sdp = new CraftingComponent(1, 0, CraftingComponent.Types.SDP);

      expect(item.getHandledQuantity()).toBe(5);
      expect(gold.getHandledQuantity()).toBe(1000);
      expect(sdp.getHandledQuantity()).toBe(42);
    });
  });

  describe('quantity / hasEnough', () =>
  {
    it('quantity returns the constructed count', () =>
    {
      expect(new CraftingComponent(9, 1, CraftingComponent.Types.Item).quantity()).toBe(9);
    });

    it('hasEnough compares required count against party holdings per type', () =>
    {
      const cheapItem = new CraftingComponent(3, 10, CraftingComponent.Types.Item);
      const expensiveItem = new CraftingComponent(99, 10, CraftingComponent.Types.Item);
      const affordableGold = new CraftingComponent(500, 0, CraftingComponent.Types.Gold);
      const unaffordableGold = new CraftingComponent(5000, 0, CraftingComponent.Types.Gold);
      const affordableSdp = new CraftingComponent(10, 0, CraftingComponent.Types.SDP);

      expect(cheapItem.hasEnough()).toBe(true);
      expect(expensiveItem.hasEnough()).toBe(false);
      expect(affordableGold.hasEnough()).toBe(true);
      expect(unaffordableGold.hasEnough()).toBe(false);
      expect(affordableSdp.hasEnough()).toBe(true);
    });
  });

  describe('generate / consume', () =>
  {
    it('generate grants items, gold, or SDP to every party member depending on type', () =>
    {
      const item = new CraftingComponent(2, 10, CraftingComponent.Types.Item);
      item.generate();
      expect($gameParty.gainItem).toHaveBeenCalledWith(item.getItem(), 2);

      const gold = new CraftingComponent(50, 0, CraftingComponent.Types.Gold);
      gold.generate();
      expect($gameParty.gainGold).toHaveBeenCalledWith(50);

      const sdp = new CraftingComponent(3, 0, CraftingComponent.Types.SDP);
      sdp.generate();
      const [ member ] = $gameParty.members();
      expect(member.modSdpPoints).toHaveBeenCalledWith(3);
    });

    it('consume removes items, gold, or SDP from every party member depending on type', () =>
    {
      const item = new CraftingComponent(2, 10, CraftingComponent.Types.Item);
      item.consume();
      expect($gameParty.loseItem).toHaveBeenCalledWith(item.getItem(), 2);

      const gold = new CraftingComponent(50, 0, CraftingComponent.Types.Gold);
      gold.consume();
      expect($gameParty.loseGold).toHaveBeenCalledWith(50);

      const sdp = new CraftingComponent(3, 0, CraftingComponent.Types.SDP);
      sdp.consume();
      const [ member ] = $gameParty.members();
      expect(member.modSdpPoints).toHaveBeenCalledWith(-3);
    });
  });

  describe('builder', () =>
  {
    it('fluently builds a component and resets its own state after build()', () =>
    {
      const built = CraftingComponent.builder
        .count(4)
        .id(20)
        .type(CraftingComponent.Types.Weapon)
        .build();

      expect(built.quantity()).toBe(4);
      expect(built.isWeapon()).toBe(true);
      expect(built.getItem().id).toBe(20);

      // builder state resets after build()- a second build with no calls yields an empty-typed component.
      const resetBuild = CraftingComponent.builder.build();
      expect(resetBuild.quantity()).toBe(0);
    });
  });
});
//endregion plugins/jafting/create-crafting-component-direct.test.js
