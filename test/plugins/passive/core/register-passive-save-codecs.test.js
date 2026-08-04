//region plugins/passive/core/register-passive-save-codecs.test.js
import { describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../setup/install-save-registration-realm.js';

describe('registerPassiveSaveCodecs', () =>
{
  /**
   * A stand-in for the one host this module declares against.
   *
   * The real `Game_Actor` drags J-Base's whole object graph in, and none of it participates here: the
   * declaration is filed against the constructor itself, and the transient factory only ever calls two
   * methods on the instance handed to it. A local class is the honest boundary.
   */
  class Game_Actor
  {
    /**
     * Whether the cache rebuild was asked for before the sources were read.
     * @type {boolean}
     */
    cacheRebuilt = false;

    /**
     * Stands in for the real rebuild, which walks this battler's equipment and states.
     */
    cachePassiveCapableSources()
    {
      this.cacheRebuilt = true;
    }

    /**
     * The sources the rebuild is expected to have produced.
     * @returns {string[]} The passive-capable sources.
     */
    passiveSources()
    {
      return [ 'rebuilt-source' ];
    }
  }

  /**
   * Imports the registration module into a realm shaped by the caller.
   *
   * The import is inside the helper rather than at the top of the file because this module does its
   * work at module scope: hoisting it would run the registration once, against whichever realm existed
   * first, and every test below would read the same stale result.
   * @param {boolean} saveExtensionInstalled Whether J-Base-Save is present in this realm.
   * @returns {Promise<{ SaveSectionRouter: Function, SerializableRegistry: Function }>} The registries
   * the module wrote to.
   */
  const importWithSaveExtension = async saveExtensionInstalled =>
  {
    const realm = await installSaveRegistrationRealm({
      saveExtensionInstalled,
      hosts: [ Game_Actor ],
    });

    await import('../../../../src/plugins/passive/core/registerPassiveSaveCodecs.js');

    return realm;
  };

  /**
   * Digs out the transient factory this module filed against the actor.
   * @param {Function} SerializableRegistry The registry the module wrote to.
   * @returns {Function} The factory producing a cold passive-sources value.
   */
  const passiveSourcesFactory = SerializableRegistry => SerializableRegistry.registrations()
    .get(Game_Actor)
    .transients['_j._passive._passiveSources'];

  it('declares the passive source list transient on the actor, so it is never written', async () =>
  {
    // Arrange
    // Act
    const { SerializableRegistry } = await importWithSaveExtension(true);

    // Assert
    expect(passiveSourcesFactory(SerializableRegistry)).toBeInstanceOf(Function);
  });

  it('rebuilds the source list on decode rather than handing back an empty one', async () =>
  {
    // Arrange
    const { SerializableRegistry } = await importWithSaveExtension(true);
    const actor = new Game_Actor();

    // Act
    const cold = passiveSourcesFactory(SerializableRegistry)(actor);

    // Assert
    expect(actor.cacheRebuilt).toBe(true);
    expect(cold).toEqual([ 'rebuilt-source' ]);
  });

  it('routes the passive namespace into its own section file when J-Base-Save is installed', async () =>
  {
    // Arrange
    // Act
    const { SaveSectionRouter } = await importWithSaveExtension(true);

    // Assert
    expect(SaveSectionRouter.routedNamespaces()
      .get('_passive')).toBe('systems/passive.json');
  });

  it('routes nothing when J-Base-Save is absent, leaving the slice inline on its host', async () =>
  {
    // Arrange
    // Act
    const { SaveSectionRouter } = await importWithSaveExtension(false);

    // Assert
    expect(SaveSectionRouter.routedNamespaces()
      .has('_passive')).toBe(false);
  });
});
//endregion plugins/passive/core/register-passive-save-codecs.test.js