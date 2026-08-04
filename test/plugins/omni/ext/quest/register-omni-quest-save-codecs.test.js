//region plugins/omni/ext/quest/register-omni-quest-save-codecs.test.js
import { beforeEach, describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../../setup/install-save-registration-realm.js';

describe('registerOmniQuestSaveCodecs', () =>
{
  /**
   * The map host, which is the easy one to miss: this is the one questopedia slice that lives on the
   * map object rather than on the system or the party.
   */
  class Game_Map
  {
  }

  /**
   * The party host, carrying the questopedia's saved entries and the cache derived from them.
   */
  class Game_Party
  {
    /**
     * The entries a decode would have restored before any transient factory runs.
     * @returns {Array<{key: string}>} The saved questopedia entries.
     */
    getSavedQuestopediaEntries()
    {
      return [ { key: 'quest-alpha' }, { key: 'quest-beta' } ];
    }
  }

  /**
   * A stand-in for the J-Base timer, recording only the delay it was constructed with.
   */
  class J_Timer
  {
    /**
     * Constructor.
     * @param {number} duration The frame count the timer was built with.
     */
    constructor(duration)
    {
      this.duration = duration;
    }
  }

  /**
   * The registries the module wrote to in the current test.
   * @type {{ SaveSectionRouter: Function, SerializableRegistry: Function }}
   */
  let realm;

  /**
   * Reads a transient factory off a host's declarations.
   * @param {Function} host The constructor the declaration was filed against.
   * @param {string} path The dotted field path the transient lives at.
   * @returns {Function} The factory producing the cold value.
   */
  const transientFactory = (host, path) => realm.SerializableRegistry.registrations()
    .get(host)
    .transients[path];

  beforeEach(async () =>
  {
    realm = await installSaveRegistrationRealm({
      hosts: [ Game_Map, Game_Party ],
      globals: { J_Timer },
    });

    await import('../../../../../src/plugins/omni/ext/quest/registerOmniQuestSaveCodecs.js');
  });

  it('builds a fresh destination timer on the map rather than restoring a written one', () =>
  {
    // Arrange
    const factory = transientFactory(Game_Map, '_j._omni._quest._destinationTimer');

    // Act
    const timer = factory();

    // Assert
    expect(timer.duration).toBe(15);
  });

  it('rebuilds the questopedia cache from the saveables, keyed for lookup', () =>
  {
    // Arrange
    const factory = transientFactory(Game_Party, '_j._omni._questopediaCache');
    const party = new Game_Party();

    // Act
    const cache = factory(party);

    // Assert
    expect(cache).toBeInstanceOf(Map);
    expect(cache.size).toBe(2);
    expect(cache.get('quest-alpha')).toEqual({ key: 'quest-alpha' });
    expect(cache.get('quest-beta')).toEqual({ key: 'quest-beta' });
  });
});
//endregion plugins/omni/ext/quest/register-omni-quest-save-codecs.test.js