//region plugins/abs/ext/shield/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsShield } from '../_component/fixtures/install-abs-shield-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const INIT_PATH = '../../../../../../src/plugins/abs/ext/shield/_metadata/initialization.js';

describe('J-ABS-Shield metadata (direct src import)', () =>
{
  /** @type {Map<string, Function>} formula-context variables this plugin registers at import time. */
  let registeredFormulaContexts;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // this extension registers an 's' formula-context variable at import time so shield-break
    // damage formulas can reference the broken shield's cap; capture what it registers.
    registeredFormulaContexts = new Map();
    globalThis.Game_Action.registerFormulaContext = (symbol, resolver) =>
    {
      registeredFormulaContexts.set(symbol, resolver);
    };

    installPluginManagerWithParams(globalThis, 'J-ABS-Shield', {});

    setPluginContextToJabsShield();
    await import(INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.SHIELD;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Scene_Boot).toBeInstanceOf(Map);
    expect(Aliased.Game_Action).toBeInstanceOf(Map);
    expect(Aliased.Game_Actor).toBeInstanceOf(Map);
    expect(Aliased.Game_Battler).toBeInstanceOf(Map);
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
    expect(Aliased.JABS_State).toBeInstanceOf(Map);
    expect(Aliased.JABS_StateBuilder).toBeInstanceOf(Map);
    expect(Aliased.Sprite_ActorValue).toBeInstanceOf(Map);
    expect(Aliased.Sprite_Character).toBeInstanceOf(Map);
    expect(Aliased.Window_PartyFrame).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.SHIELD;

    // Assert
    expect(Aliased.Scene_Boot.size).toBe(0);
    expect(Aliased.Game_Action.size).toBe(0);
    expect(Aliased.Game_Actor.size).toBe(0);
    expect(Aliased.Game_Battler.size).toBe(0);
    expect(Aliased.JABS_Engine.size).toBe(0);
    expect(Aliased.JABS_State.size).toBe(0);
    expect(Aliased.JABS_StateBuilder.size).toBe(0);
    expect(Aliased.Sprite_ActorValue.size).toBe(0);
    expect(Aliased.Sprite_Character.size).toBe(0);
    expect(Aliased.Window_PartyFrame.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.SHIELD.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('shield-break formula context', () =>
  {
    it('registers an s variable for damage formulas to read', () =>
    {
      // Arrange & Act & Assert- without this, a shield-break skill's formula referencing `s` would
      // throw at damage time rather than at load time.
      expect(registeredFormulaContexts.has('s')).toBe(true);
    });

    it('resolves s to the attacker last shield break value', () =>
    {
      // Arrange
      const resolver = registeredFormulaContexts.get('s');
      const attacker = { lastShieldBreakValue: 240 };

      // Act & Assert
      expect(resolver(null, attacker)).toBe(240);
    });

    it('resolves s to zero for an attacker that has broken no shield', () =>
    {
      // Arrange- the value is reset after a break skill fires, so every non-break action reads 0.
      const resolver = registeredFormulaContexts.get('s');
      const attacker = { lastShieldBreakValue: 0 };

      // Act & Assert
      expect(resolver(null, attacker)).toBe(0);
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsShield();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsShield();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/shield/_metadata/metadata.test.js
