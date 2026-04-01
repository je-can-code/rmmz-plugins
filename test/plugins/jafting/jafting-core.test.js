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
    expect(md.version.major).toBe(2);
    expect(md.version.minor).toBe(0);
    expect(md.version.patch).toBe(0);
  });

  it('reserves J.JAFTING.EXT for extensions', () =>
  {
    expect(sandbox.J.JAFTING.EXT).toBeDefined();
    expect(typeof sandbox.J.JAFTING.EXT).toBe('object');
  });

  it('defines the hub Window_JaftingList with an extensible command list', () =>
  {
    const { Window_JaftingList } = sandbox.__JAFT_VM;

    expect(typeof Window_JaftingList).toBe('function');

    const rect = new sandbox.Rectangle(0, 0, 200, 200);
    const hub = new Window_JaftingList(rect);
    const commands = hub.buildCommands();

    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBe(0);
  });

  it('defines Scene_Jafting as a menu scene subclass', () =>
  {
    const { Scene_Jafting } = sandbox.__JAFT_VM;

    expect(typeof Scene_Jafting).toBe('function');
    expect(Scene_Jafting.prototype.constructor).toBe(Scene_Jafting);
  });
});
//endregion plugins/jafting/jafting-core.test.js
