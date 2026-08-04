//region plugins/sdp/core/register-sdp-save-routes.test.js
import { describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../setup/install-save-registration-realm.js';

describe('registerSdpSaveRoutes', () =>
{
  /**
   * Imports the registration module into a realm shaped by the caller.
   *
   * The import is inside the helper rather than at the top of the file because these modules do their
   * work at module scope: hoisting the import would run the registration once, against whichever realm
   * happened to exist first, and both tests below would then be reading the same stale result.
   * @param {boolean} saveExtensionInstalled Whether J-Base-Save is present in this realm.
   * @returns {Promise<Function>} The router the module wrote to.
   */
  const importWithSaveExtension = async saveExtensionInstalled =>
  {
    const { SaveSectionRouter } = await installSaveRegistrationRealm({ saveExtensionInstalled });

    await import('../../../../src/plugins/sdp/core/registerSdpSaveRoutes.js');

    return SaveSectionRouter;
  };

  it('routes the sdp namespace into its own section file when J-Base-Save is installed', async () =>
  {
    // Arrange
    // Act
    const SaveSectionRouter = await importWithSaveExtension(true);

    // Assert
    expect(SaveSectionRouter.routedNamespaces()
      .get('_sdp')).toBe('systems/sdp.json');
  });

  it('routes nothing when J-Base-Save is absent, leaving the slice inline on its host', async () =>
  {
    // Arrange
    // Act
    const SaveSectionRouter = await importWithSaveExtension(false);

    // Assert
    expect(SaveSectionRouter.routedNamespaces()
      .has('_sdp')).toBe(false);
  });
});
//endregion plugins/sdp/core/register-sdp-save-routes.test.js