//region plugins/abs/ext/tools/register-jabs-tools-save-codecs.test.js
import { beforeEach, describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../../setup/install-save-registration-realm.js';

describe('registerJabsToolsSaveCodecs', () =>
{
  /**
   * The three character-like hosts this module names individually, because a codec resolves by the
   * exact constructor of the value in front of the encoder.
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
   * Imports the registration module into a realm shaped by the caller.
   * @param {boolean} saveExtensionInstalled Whether J-Base-Save is present in this realm.
   * @returns {Promise<void>}
   */
  const importWithSaveExtension = async saveExtensionInstalled =>
  {
    realm = await installSaveRegistrationRealm({
      saveExtensionInstalled,
      hosts: [ Game_Player, Game_Follower, Game_Vehicle ],
      globals: { JABS_Timer },
    });

    await import('../../../../../src/plugins/abs/ext/tools/registerJabsToolsSaveCodecs.js');
  };

  /**
   * Reads one of the two grab-and-throw wait timers off a host's declarations.
   * @param {Function} host The constructor the declaration was filed against.
   * @param {string} path The dotted field path the timer lives at.
   * @returns {Function} The factory producing a cold timer.
   */
  const timerFactory = (host, path) => realm.SerializableRegistry.registrations()
    .get(host)
    .transients[path];

  beforeEach(async () =>
  {
    await importWithSaveExtension(true);
  });

  it('declares the grab wait timer transient on all three character-like hosts', () =>
  {
    // Arrange
    const path = '_j._tools._grabThrow._grab._wait';

    // Act
    const hosts = [ Game_Player, Game_Follower, Game_Vehicle ];

    // Assert
    hosts.forEach(host =>
    {
      expect(timerFactory(host, path)).toBeInstanceOf(Function);
    });
  });

  it('declares the throw wait timer transient on all three character-like hosts', () =>
  {
    // Arrange
    const path = '_j._tools._grabThrow._throw._wait';

    // Act
    const hosts = [ Game_Player, Game_Follower, Game_Vehicle ];

    // Assert
    hosts.forEach(host =>
    {
      expect(timerFactory(host, path)).toBeInstanceOf(Function);
    });
  });

  it('builds the cold grab timer at the same zero delay the construction site uses', () =>
  {
    // Arrange
    const factory = timerFactory(Game_Player, '_j._tools._grabThrow._grab._wait');

    // Act
    const timer = factory();

    // Assert
    expect(timer.duration).toBe(0);
  });

  it('builds the cold throw timer at the same zero delay the construction site uses', () =>
  {
    // Arrange
    const factory = timerFactory(Game_Player, '_j._tools._grabThrow._throw._wait');

    // Act
    const timer = factory();

    // Assert
    expect(timer.duration).toBe(0);
  });

  it('routes the tools namespace into its own section file when J-Base-Save is installed', () =>
  {
    // Arrange
    // Act
    const routed = realm.SaveSectionRouter.routedNamespaces();

    // Assert
    expect(routed.get('_tools')).toBe('systems/abs-tools.json');
  });

  it('routes nothing when J-Base-Save is absent, leaving the slice inline on its host', async () =>
  {
    // Arrange
    // Act
    await importWithSaveExtension(false);

    // Assert
    expect(realm.SaveSectionRouter.routedNamespaces()
      .has('_tools')).toBe(false);
  });
});
//endregion plugins/abs/ext/tools/register-jabs-tools-save-codecs.test.js