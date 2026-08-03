//region plugins/__ca-mods/_component/game-battler-base.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { installCaModsHostGlobals } from './fixtures/install-ca-mods-host-globals.js';

describe('CAMods Game_BattlerBase.recoverAll (real engine direct import)', () =>
{
  beforeAll(async () =>
  {
    installCaModsHostGlobals();

    // J-Base's initialization.js first- __ca-mods's own initialization.js and patch files assume
    // globalThis.J.BASE already exists (it's always loaded before __ca-mods in the real ship build).
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    // __ca-mods's own initialization.js- sets up J.CAMods.Aliased.Game_BattlerBase, the map the
    // patch file under test immediately reads from to stash the original recoverAll.
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // the file under test- patches the real, engine-provided Game_BattlerBase.prototype.
    await import('../../../../src/plugins/__ca-mods/core/objects/Game_BattlerBase.js');
  });

  afterAll(() =>
  {
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  it('sets current TP to max in addition to the original recoverAll effects', () =>
  {
    const battler = new globalThis.Game_BattlerBase();

    // initMembers() seeds _hp/_mp/_tp/param caches the real engine's recoverAll() reads/writes.
    battler.initMembers();

    // artificially reduce hp/mp/tp below their maximums so recoverAll has visible work to do.
    battler._hp = 1;
    battler._mp = 0;
    battler._tp = 0;

    battler.recoverAll();

    // the original engine behavior: hp/mp restored to their maximums.
    expect(battler._hp).toBe(battler.mhp);
    expect(battler._mp).toBe(battler.mmp);

    // the __ca-mods addition: tp is also restored to its maximum, which the base engine's
    // recoverAll() intentionally leaves untouched.
    expect(battler._tp).toBe(battler.maxTp());
  });
});
//endregion plugins/__ca-mods/_component/game-battler-base.test.js
