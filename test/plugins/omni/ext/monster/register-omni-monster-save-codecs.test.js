//region plugins/omni/ext/monster/register-omni-monster-save-codecs.test.js
import { describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../../setup/install-save-registration-realm.js';

describe('registerOmniMonsterSaveCodecs', () =>
{
  /**
   * The party host, carrying the monsterpedia's saved observations and the cache derived from them.
   *
   * The observations arrive as a sparse array indexed by enemy id, which is the detail the factory
   * under test has to cope with - so the stub reproduces that shape rather than a dense one.
   */
  class Game_Party
  {
    /**
     * The observations a decode would have restored, sparse exactly as the real ones are.
     * @type {Array<{enemyId: number}>}
     */
    observations = [];

    /**
     * The saved observations, indexed by enemy id.
     * @returns {Array<{enemyId: number}>} The observations.
     */
    getSavedMonsterpediaObservations()
    {
      return this.observations;
    }
  }

  /**
   * Imports the registration module and hands back the cache factory it filed.
   * @returns {Promise<Function>} The factory producing a rebuilt monsterpedia cache.
   */
  const cacheFactory = async () =>
  {
    const { SerializableRegistry } = await installSaveRegistrationRealm({ hosts: [ Game_Party ] });

    await import('../../../../../src/plugins/omni/ext/monster/registerOmniMonsterSaveCodecs.js');

    return SerializableRegistry.registrations()
      .get(Game_Party)
      .transients['_j._omni._monsterpediaObservationsCache'];
  };

  it('rebuilds the observation cache keyed by enemy id', async () =>
  {
    // Arrange
    const factory = await cacheFactory();
    const party = new Game_Party();
    party.observations[3] = { enemyId: 3 };
    party.observations[7] = { enemyId: 7 };

    // Act
    const cache = factory(party);

    // Assert
    expect(cache).toBeInstanceOf(Map);
    expect(cache.get(3)).toEqual({ enemyId: 3 });
    expect(cache.get(7)).toEqual({ enemyId: 7 });
  });

  it('skips the empty slots of the sparse array rather than keying them to nothing', async () =>
  {
    // Arrange
    const factory = await cacheFactory();
    const party = new Game_Party();
    party.observations[2] = undefined;
    party.observations[5] = { enemyId: 5 };

    // Act
    const cache = factory(party);

    // Assert
    expect(cache.size).toBe(1);
    expect(cache.has(2)).toBe(false);
  });
});
//endregion plugins/omni/ext/monster/register-omni-monster-save-codecs.test.js