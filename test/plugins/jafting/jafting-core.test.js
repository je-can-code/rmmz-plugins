//region plugins/jafting/jafting-core.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadJaftingCorePluginVm } from './jafting-core-vm.js';

describe('J-JAFTING core (built plugin)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadJaftingCorePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes umbrella metadata on J.JAFTING.Metadata', () =>
  {
    const md = sandbox.J.JAFTING.Metadata;

    expect(md.name).toBe('J-JAFTING');
    expect(md.materialArmorTypeId).toBe(5);
    expect(md.materialWeaponTypeId).toBe(-1);
    expect(md.version.major).toBe(2);
    expect(md.version.minor).toBe(1);
    expect(md.version.patch).toBe(2);
  });

  it('reserves J.JAFTING.EXT for extensions', () =>
  {
    expect(sandbox.J.JAFTING.EXT).toBeDefined();
    expect(typeof sandbox.J.JAFTING.EXT).toBe('object');
  });

  it('defines the hub Window_JaftingList with Salvage plus extension hooks', () =>
  {
    const { Window_JaftingList, Scene_JaftingSalvage } = sandbox.__JAFT_VM;

    expect(typeof Window_JaftingList).toBe('function');

    const rect = new sandbox.Rectangle(0, 0, 200, 200);
    const hub = new Window_JaftingList(rect);
    const commands = hub.buildCommands();

    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBe(1);
    expect(commands[0].symbol).toBe(Scene_JaftingSalvage.KEY);
  });

  it('defines Scene_Jafting as a menu scene subclass', () =>
  {
    const { Scene_Jafting } = sandbox.__JAFT_VM;

    expect(typeof Scene_Jafting).toBe('function');
    expect(Scene_Jafting.prototype.constructor).toBe(Scene_Jafting);
  });

  it('defines Scene_JaftingSalvage and JaftingSalvageManager', () =>
  {
    const { Scene_JaftingSalvage, JaftingSalvageManager } = sandbox.__JAFT_VM;

    expect(typeof Scene_JaftingSalvage).toBe('function');
    expect(typeof JaftingSalvageManager).toBe('function');
  });

  it('defines concrete salvage ledger model classes', () =>
  {
    const {
      JaftingSalvageLedgerRow,
      JaftingSalvageLedgerSnapshot,
      JaftingSalvagePartyLedgerBag,
    } = sandbox.__JAFT_VM;

    expect(typeof JaftingSalvageLedgerRow).toBe('function');
    expect(typeof JaftingSalvageLedgerSnapshot).toBe('function');
    expect(typeof JaftingSalvagePartyLedgerBag).toBe('function');
  });
});
//endregion plugins/jafting/jafting-core.test.js
