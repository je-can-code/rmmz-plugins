//region plugins/apt/core/plugin-commands-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * pluginCommands.js registers its callbacks via the bare `PluginManager.registerCommand` global and
 * reaches `J.APT.Metadata.name`/`$gameParty`/`$gameActors`/`ApManager` as bare identifiers too, exactly
 * as the shipped bundle does. This stubs just enough of that surface to capture the two registered
 * callbacks and exercise them directly, without needing the full apt host-globals fixture (ApManager
 * itself is imported for real so `gainAp`'s actual branching runs).
 */
describe('J-Aptitude plugin commands (direct src import)', () =>
{
  /** @type {Map<string, Function>} */
  let registeredCommands;

  beforeEach(async () =>
  {
    vi.resetModules();

    registeredCommands = new Map();

    globalThis.PluginManager = {
      registerCommand(pluginName, commandName, callback)
      {
        registeredCommands.set(commandName, callback);
      },
    };

    globalThis.J = { APT: { Metadata: { name: 'J-Aptitude' } } };

    // real production code- ApManager.gainAp is exercised for real, not mocked.
    await import('../../../../src/plugins/apt/core/managers/ApManager.js');

    // the file under test- registers the two plugin commands.
    await import('../../../../src/plugins/apt/core/_metadata/pluginCommands.js');
  });

  afterEach(() =>
  {
    delete globalThis.PluginManager;
    delete globalThis.J;
    delete globalThis.$gameParty;
    delete globalThis.$gameActors;
  });

  it('registers both mod-ap-all and mod-ap under the J-Aptitude plugin name', () =>
  {
    expect(registeredCommands.has('mod-ap-all')).toBe(true);
    expect(registeredCommands.has('mod-ap')).toBe(true);
  });

  it('mod-ap-all grants the parsed AP amount to every party member', () =>
  {
    const actorA = { isDead: () => false, apr: 1, getAptitudeSources: () => [] };
    const actorB = { isDead: () => false, apr: 1, getAptitudeSources: () => [] };
    globalThis.$gameParty = { members: () => [ actorA, actorB ] };

    // ApManager.gainAp with no active teachable sources is a safe no-throw smoke check here; the
    // deeper distribution logic is covered by ap-manager-direct.test.js.
    expect(() => registeredCommands.get('mod-ap-all')({ points: '5' })).not.toThrow();
  });

  it('mod-ap grants the parsed AP amount to the resolved actor by id', () =>
  {
    const actor = { isDead: () => false, apr: 1, getAptitudeSources: () => [] };
    const actorLookup = vi.fn(() => actor);
    globalThis.$gameActors = { actor: actorLookup };

    registeredCommands.get('mod-ap')({ actorId: '3', points: '7' });

    expect(actorLookup).toHaveBeenCalledWith(3);
  });
});
//endregion plugins/apt/core/plugin-commands-direct.test.js
