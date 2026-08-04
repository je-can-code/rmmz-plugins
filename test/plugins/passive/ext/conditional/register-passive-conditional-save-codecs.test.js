//region plugins/passive/ext/conditional/register-passive-conditional-save-codecs.test.js
import { describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../../setup/install-save-registration-realm.js';

describe('registerPassiveConditionalSaveCodecs', () =>
{
  /**
   * A stand-in for the host this module declares against, since the declaration is filed against the
   * constructor and nothing here ever touches an actor's real behavior.
   */
  class Game_Actor
  {
  }

  /**
   * A stand-in for the timer the transient factory builds, recording only the delay it was handed -
   * which is the whole thing worth asserting about a cold stopwatch.
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
   * Imports the registration module into a realm carrying a particular configured delay.
   * @param {number} reconcileDelayFrames The plugin parameter the factory reads.
   * @returns {Promise<Function>} The factory producing a cold reconcile timer.
   */
  const factoryWithConfiguredDelay = async reconcileDelayFrames =>
  {
    const { SerializableRegistry } = await installSaveRegistrationRealm({
      hosts: [ Game_Actor ],
      globals: { JABS_Timer },
      namespaces: { PASSIVE: { EXT: { CONDITIONAL: { Metadata: { reconcileDelayFrames } } } } },
    });

    await import(
      '../../../../../src/plugins/passive/ext/conditional/registerPassiveConditionalSaveCodecs.js');

    return SerializableRegistry.registrations()
      .get(Game_Actor)
      .transients['_j._passive._conditional._timer'];
  };

  it('builds the cold timer from the configured reconcile delay', async () =>
  {
    // Arrange
    const factory = await factoryWithConfiguredDelay(40);

    // Act
    const timer = factory();

    // Assert
    expect(timer.duration).toBe(40);
  });

  it('falls back to fifteen frames when the parameter is absent', async () =>
  {
    // Arrange
    const factory = await factoryWithConfiguredDelay(0);

    // Act
    const timer = factory();

    // Assert
    expect(timer.duration).toBe(15);
  });
});
//endregion plugins/passive/ext/conditional/register-passive-conditional-save-codecs.test.js