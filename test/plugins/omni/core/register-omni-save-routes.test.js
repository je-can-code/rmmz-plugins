//region plugins/omni/core/register-omni-save-routes.test.js
import { describe, expect, it } from 'vitest';

import { installSaveRegistrationRealm } from '../../../setup/install-save-registration-realm.js';

describe('registerOmniSaveRoutes', () =>
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

    await import('../../../../src/plugins/omni/core/registerOmniSaveRoutes.js');

    return SaveSectionRouter;
  };

  it('routes the omni namespace into its own section file when J-Base-Save is installed', async () =>
  {
    // Arrange
    // Act
    const SaveSectionRouter = await importWithSaveExtension(true);

    // Assert
    expect(SaveSectionRouter.routedNamespaces()
      .get('_omni')).toBe('systems/omni.json');
  });

  it('routes nothing when J-Base-Save is absent, leaving the slice inline on its host', async () =>
  {
    // Arrange
    // Act
    const SaveSectionRouter = await importWithSaveExtension(false);

    // Assert
    expect(SaveSectionRouter.routedNamespaces()
      .has('_omni')).toBe(false);
  });
});
//endregion plugins/omni/core/register-omni-save-routes.test.js