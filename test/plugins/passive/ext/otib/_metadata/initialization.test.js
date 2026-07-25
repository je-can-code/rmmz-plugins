//region plugins/passive/ext/otib/_metadata/initialization.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../../_component/fixtures/install-passive-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-Passive-OTIB initialization.js (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../../../src/plugins/passive/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-Passive-OTIB', { 'menu-switch': '42' });
    globalThis.__PLUGIN_NAME__ = 'J-Passive-OTIB';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';

    await import('../../../../../../src/plugins/passive/ext/otib/_metadata/initialization.js');
  });

  it('exposes the plugin name on J.PASSIVE.EXT.OTIB.Metadata', () =>
  {
    // Act & Assert
    expect(globalThis.J.PASSIVE.EXT.OTIB.Metadata.name).toBe('J-Passive-OTIB');
  });

  it('parses the menu-switch plugin parameter into menuSwitchId', () =>
  {
    // Act & Assert
    expect(globalThis.J.PASSIVE.EXT.OTIB.Metadata.menuSwitchId).toBe(42);
  });

  it('initializes an empty aliased map for Game_Actor', () =>
  {
    // Act & Assert
    expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Actor).toBeInstanceOf(Map);
    expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Actor.size).toBe(0);
  });

  it('initializes an empty aliased map for Game_Battler', () =>
  {
    // Act & Assert
    expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Battler).toBeInstanceOf(Map);
    expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Battler.size).toBe(0);
  });

  it('initializes an empty aliased map for Scene_Boot', () =>
  {
    // Act & Assert
    expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Scene_Boot).toBeInstanceOf(Map);
    expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Scene_Boot.size).toBe(0);
  });

  it('exposes the OtibStateIds regex', () =>
  {
    // Arrange
    const match = '<otib:[1, 2, 3]>'.match(globalThis.J.PASSIVE.EXT.OTIB.RegExp.OtibStateIds);

    // Act & Assert
    expect(match[1]).toBe('[1, 2, 3]');
  });
});
//endregion plugins/passive/ext/otib/_metadata/initialization.test.js
