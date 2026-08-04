//region plugins/regions/ext/states/register-region-states-save-codecs.test.js
import { beforeEach, describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../../setup/install-save-registration-realm.js';

describe('registerRegionStatesSaveCodecs', () =>
{
  /**
   * The player host, named individually because a codec resolves by the exact constructor of the value
   * being encoded.
   */
  class Game_Player
  {
  }

  /**
   * The follower host, declared separately for the same reason.
   */
  class Game_Follower
  {
  }

  /**
   * The vehicle host, declared separately for the same reason.
   */
  class Game_Vehicle
  {
  }

  /**
   * A stand-in for the JABS stopwatch, recording only the delay it was constructed with.
   */
  class JABS_Timer
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
   * Reads the application timer factory off a host's declarations.
   * @param {Function} host The constructor the declaration was filed against.
   * @returns {Function} The factory producing a cold application timer.
   */
  const timerFactory = host => realm.SerializableRegistry.registrations()
    .get(host)
    .transients['_j._regions._states._timer'];

  beforeEach(async () =>
  {
    realm = await installSaveRegistrationRealm({
      hosts: [ Game_Player, Game_Follower, Game_Vehicle ],
      globals: { JABS_Timer },
      namespaces: { REGIONS: { EXT: { STATES: { Metadata: { delayBetweenApplications: 36 } } } } },
    });

    await import('../../../../../src/plugins/regions/ext/states/registerRegionStatesSaveCodecs.js');
  });

  it('declares the application timer transient on all three character-like hosts', () =>
  {
    // Arrange
    const hosts = [ Game_Player, Game_Follower, Game_Vehicle ];

    // Act
    const factories = hosts.map(host => timerFactory(host));

    // Assert
    factories.forEach(factory =>
    {
      expect(factory).toBeInstanceOf(Function);
    });
  });

  it('builds the cold timer from the current plugin parameter, not from a written delay', () =>
  {
    // Arrange
    const factory = timerFactory(Game_Player);

    // Act
    const timer = factory();

    // Assert
    expect(timer.duration).toBe(36);
  });
});
//endregion plugins/regions/ext/states/register-region-states-save-codecs.test.js