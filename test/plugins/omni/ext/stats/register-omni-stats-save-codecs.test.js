//region plugins/omni/ext/stats/register-omni-stats-save-codecs.test.js
import { describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../../setup/install-save-registration-realm.js';

describe('registerOmniStatsSaveCodecs', () =>
{
  /**
   * The party host the statistopedia hangs its records on.
   */
  class Game_Party
  {
  }

  /**
   * Imports the registration module and hands back what it declared against the party.
   * @returns {Promise<object>} The typed declarations filed for `Game_Party`.
   */
  const typedDeclarations = async () =>
  {
    const { SerializableRegistry } = await installSaveRegistrationRealm({ hosts: [ Game_Party ] });

    await import('../../../../../src/plugins/omni/ext/stats/registerOmniStatsSaveCodecs.js');

    return SerializableRegistry.registrations()
      .get(Game_Party).typed;
  };

  it('declares the records field as holding a class instance', async () =>
  {
    // Act.
    const typed = await typedDeclarations();

    // Assert: an undeclared instance field throws by name at save time, which is the whole point.
    expect(Object.keys(typed)).toContain('_j._omni._statistopediaRecords');
  });

  it('points the declaration at the records constructor itself', async () =>
  {
    // Arrange.
    const { default: StatistopediaRecords } = await import(
      '../../../../../src/plugins/omni/ext/stats/__models/StatistopediaRecords.js');

    // Act.
    const typed = await typedDeclarations();

    // Assert.
    expect(typed['_j._omni._statistopediaRecords'].name).toBe(StatistopediaRecords.name);
  });
});
//endregion plugins/omni/ext/stats/register-omni-stats-save-codecs.test.js
