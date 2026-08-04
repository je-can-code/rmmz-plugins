//region plugins/abs/ext/boss/_metadata/metadata.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * These tests construct the metadata against the **real** {@link PluginMetadata}, not a stand-in.
 *
 * That is the whole point of the file. `PluginMetadata`'s constructor calls `initializePlugin`, which
 * calls `postInitialize`, which is where this plugin parses its encounters - so the entire parse runs
 * before `super()` has returned. A derived class installs its own private members only after that
 * point, which means any `#private` helper reached during the parse throws
 * "Receiver must be an instance of class" and the game never finishes booting. A hand-written double
 * for the base class would have its own constructor ordering and would happily miss that.
 */
describe('J-ABS-Boss metadata (constructed through the real PluginMetadata)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/_metadata/_pluginMetadata.js').default} */
  let J_BossPluginMetadata;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default} */
  let JabsBossManager;

  const PLUGIN_NAME = 'J-ABS-Boss-MetadataTest';

  const rawEncounter = {
    key: 'gluttonwolf',
    map: 75,
    participants: [ { key: 'mayor', eventId: 4, enemyId: 581, expect: 'Gluttonwolf Mayor' } ],
    aiControl: 'shared',
    routines: [ {
      key: 'devour',
      cadence: 20,
      steps: [ { verb: 'forceSkill', skill: 2584, expect: 'Devour', cast: true } ],
    } ],
  };

  const previousGlobals = {};

  beforeAll(async () =>
  {
    vi.resetModules();

    previousGlobals.PluginManager = globalThis.PluginManager;
    previousGlobals.PluginMetadata = globalThis.PluginMetadata;
    previousGlobals.J = globalThis.J;

    globalThis.PluginManager = {
      parameters: () => ({}),
      registerCommand: () => {},
    };

    // the ship reaches PluginMetadata as a hoisted global from the J-Base bundle, so the test has to
    // put the real class there rather than let the module import it.
    const { default: PluginMetadata } =
      await import('../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = PluginMetadata;

    // J-ABS owns the parsed config root; extensions only read their own block off it.
    globalThis.J = {
      ABS: {
        Metadata: { ExternalConfig: { bosses: [ rawEncounter ] } },
        EXT: { BOSS: { AiControl: { Shared: 'shared', Scripted: 'scripted' } } },
      },
    };

    ({ default: JabsBossManager } =
      await import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));
    ({ default: J_BossPluginMetadata } =
      await import('../../../../../../src/plugins/abs/ext/boss/_metadata/_pluginMetadata.js'));
  });

  afterAll(() =>
  {
    // restore by hand rather than trusting restoreAllMocks, since these are bare global assignments.
    globalThis.PluginManager = previousGlobals.PluginManager;
    globalThis.PluginMetadata = previousGlobals.PluginMetadata;
    globalThis.J = previousGlobals.J;
  });

  describe('construction', () =>
  {
    it('parses its encounters without throwing while super() is still on the stack', () =>
    {
      // Arrange & Act
      const construct = () => new J_BossPluginMetadata(PLUGIN_NAME, '1.0.0');

      // Assert: a #private parse helper fails here and nowhere else.
      expect(construct).not.toThrow();
    });

    it('registers the parsed encounters with the manager', () =>
    {
      // Arrange & Act: registration is a side effect of construction, so the instance is unused.
      const metadata = new J_BossPluginMetadata(`${PLUGIN_NAME}-Register`, '1.0.0');

      // Assert
      expect(metadata.name).toBe(`${PLUGIN_NAME}-Register`);
      expect(JabsBossManager.encounters.get('gluttonwolf').mapId()).toBe(75);
    });
  });

  describe('parsing', () =>
  {
    /** @type {J_BossPluginMetadata} */
    let metadata;

    beforeAll(() =>
    {
      metadata = new J_BossPluginMetadata(`${PLUGIN_NAME}-Parsing`, '1.0.0');
    });

    it('translates the author-facing cadence from seconds into frames', () =>
    {
      // Arrange & Act
      const [ routine ] = metadata.parseEncounter(rawEncounter).routines();

      // Assert: twenty seconds at sixty frames per second.
      expect(routine.cadenceFrames()).toBe(1200);
    });

    it('defaults aiControl to shared when the encounter does not name one', () =>
    {
      // Arrange
      const { aiControl, ...withoutAiControl } = rawEncounter;

      // Act
      const encounter = metadata.parseEncounter(withoutAiControl);

      // Assert
      expect(encounter.aiControl()).toBe('shared');
    });

    it('defaults a step to observing its cast time when cast is not stated', () =>
    {
      // Arrange & Act
      const step = metadata.parseStep({ verb: 'forceSkill', skill: 2584, expect: 'Devour' });

      // Assert
      expect(step.isCast()).toBe(true);
    });

    it('honours a step that explicitly opts out of its cast time', () =>
    {
      // Arrange & Act
      const step = metadata.parseStep({ verb: 'forceSkill', skill: 2584, expect: 'Devour', cast: false });

      // Assert
      expect(step.isCast()).toBe(false);
    });

    it('treats a missing routines list as an encounter with no scripted behavior', () =>
    {
      // Arrange
      const { routines, ...withoutRoutines } = rawEncounter;

      // Act
      const encounter = metadata.parseEncounter(withoutRoutines);

      // Assert
      expect(encounter.routines()).toEqual([]);
    });
  });
});
//endregion plugins/abs/ext/boss/_metadata/metadata.test.js
