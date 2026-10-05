//region plugins/abs/core/register-jabs-save-codecs.test.js
import { describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../setup/install-save-registration-realm.js';

describe('registerJabsSaveCodecs', () =>
{
  /**
   * A stand-in for the one host this module declares against. The declaration is filed against the
   * constructor itself and its factory reads nothing off the instance, so nothing of the real actor
   * participates here.
   */
  class Game_Actor
  {
  }

  /**
   * Imports the registration module into a realm with or without the save extension present.
   * @param {boolean} saveExtensionInstalled Whether J-Base-Save is loaded in the realm.
   * @returns {Promise<Object<string, Function>>} The transients declared against the actor afterward.
   */
  const actorTransientsAfterImport = async saveExtensionInstalled =>
  {
    // the actor is registered either way, so the absent arm proves the module chose not to extend it
    // rather than merely surviving a host nobody registered.
    const { SerializableRegistry } = await installSaveRegistrationRealm({
      saveExtensionInstalled,
      hosts: [ Game_Actor ],
    });

    await import('../../../../src/plugins/abs/core/registerJabsSaveCodecs.js');

    return SerializableRegistry.registrations()
      .get(Game_Actor)
      .transients;
  };

  it('keeps the clearing flag out of the savefile, coming back lowered', async () =>
  {
    // Arrange
    const transients = await actorTransientsAfterImport(true);

    // Act
    const factory = transients['_j._abs._clearingStates'];

    // Assert- declared, and its cold value is the lowered flag a battler at rest reads.
    expect(factory).toEqual(expect.any(Function));
    expect(factory()).toBe(false);
  });

  it('declares nothing when the save extension is absent', async () =>
  {
    // Arrange
    const transients = await actorTransientsAfterImport(false);

    // Act
    const factory = transients['_j._abs._clearingStates'];

    // Assert- without J-Base-Save nothing registers the actor in game, so extending it would throw.
    expect(factory).toBeUndefined();
  });
});
//endregion plugins/abs/core/register-jabs-save-codecs.test.js