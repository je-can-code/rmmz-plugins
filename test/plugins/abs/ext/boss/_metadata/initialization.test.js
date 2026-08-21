//region plugins/abs/ext/boss/_metadata/initialization.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsBoss } from '../_component/fixtures/install-abs-boss-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * The bootstrap this ship establishes before any of its own code can run.
 *
 * Two things live here that nothing else can supply: the alias map every patch in the ship reaches
 * for, and the two host version floors. Both fail late and confusingly when they are wrong - a
 * missing alias map surfaces as "cannot read set of undefined" at patch time rather than here, and a
 * host that is too old surfaces as whatever method happens to be missing.
 */
describe('J-ABS-Boss initialization', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Boss', {});

    // J-ABS owns the parsed config root and guarantees it is present by the time an extension's
    // `postInitialize` runs; extensions only ever read their own block off it.
    globalThis.J.ABS.Metadata.ExternalConfig = {
      bosses: [
        {
          key: 'gluttonwolf',
          map: 75,
          participants: [ {
            key: 'mayor',
            eventId: 4,
            enemyId: 581,
            expect: 'Gluttonwolf Mayor',
          } ],
          aiControl: 'shared',
          routines: [ {
            key: 'devour',
            cadence: 20,
            steps: [ {
              verb: 'forceSkill',
              skill: 2584,
              expect: 'Devour',
              cast: true,
            } ],
          } ],
        },
      ],
    };

    setPluginContextToJabsBoss();
    await import('../../../../../../src/plugins/abs/ext/boss/_metadata/initialization.js');
  });

  //region the namespace the ship hangs from
  describe('the plugin umbrella', () =>
  {
    it('declares an aliased-method map for every class the plugin patches', () =>
    {
      // Arrange
      // Act
      const { Aliased } = globalThis.J.ABS.EXT.BOSS;

      // Assert: a missing map surfaces later as "cannot read set of undefined" at patch time.
      expect(Aliased.Game_Map)
        .toBeInstanceOf(Map);
    });

    it('starts the alias map empty, so the patching code owns each entry', () =>
    {
      // Arrange
      // Act
      const { Aliased } = globalThis.J.ABS.EXT.BOSS;

      // Assert
      expect(Aliased.Game_Map.size)
        .toBe(0);
    });

    it('completes the base plugin metadata initialization it extends', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(globalThis.J.ABS.EXT.BOSS.Metadata.parsedPluginParameters)
        .toBeDefined();
    });
  });
  //endregion the namespace the ship hangs from

  //region who is allowed to drive a boss
  describe('AiControl', () =>
  {
    it('offers a shared mode, which is what most fights actually want', () =>
    {
      // Arrange
      // Act
      const { AiControl } = globalThis.J.ABS.EXT.BOSS;

      // Assert: a boss is never wholly owned by its encounter script unless the author says so; the
      // script layers behavior on top while the normal JABS brain keeps driving.
      expect(AiControl.Shared)
        .toBe('shared');
    });

    it('offers a scripted mode for a routine that drives the boss outright', () =>
    {
      // Arrange
      // Act
      const { AiControl } = globalThis.J.ABS.EXT.BOSS;

      // Assert
      expect(AiControl.Scripted)
        .toBe('scripted');
    });
  });
  //endregion who is allowed to drive a boss

  //region host version requirements
  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsBoss();

      // Act
      // Assert
      await expect(import('../../../../../../src/plugins/abs/ext/boss/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsBoss();

      // Act
      // Assert
      await expect(import('../../../../../../src/plugins/abs/ext/boss/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
  //endregion host version requirements
});
//endregion plugins/abs/ext/boss/_metadata/initialization.test.js