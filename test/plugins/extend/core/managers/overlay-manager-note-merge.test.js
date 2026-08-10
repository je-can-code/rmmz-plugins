//region plugins/extend/core/managers/overlay-manager-note-merge.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
} from '../../_component/fixtures/install-extend-host-globals.js';

/**
 * What this plugin owns about note merging is the *policy*, not the merging.
 *
 * The rules themselves live in J-Base's `NoteResolver` and are covered there. What has to hold here is
 * the wiring: that `overwriteNote` hands the resolver this plugin's registry of accumulating keys, so a
 * tag registered via `registerNonCombiningKey` actually stacks across an extension chain instead of
 * being replaced. Get that wrong and every additive `<extend>` tag in CA silently starts overwriting.
 */
describe('OverlayManager note merging (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/extend/core/managers/OverlayManager.js').default} */
  let OverlayManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    // OverlayManager initializes two JCache static fields at class-definition time, so the cache
    // class has to exist as a bare global before the module is evaluated at all.
    ({ default: globalThis.JCache } = await import('../../../../../src/plugins/_base/core/core/JCache.js'));
    ({ default: globalThis.ArrayHelper } = await import('../../../../../src/plugins/_base/core/_utilities/ArrayHelper.js'));
    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.TraitResolver } = await import('../../../../../src/plugins/_base/core/managers/TraitResolver.js'));

    // note merging is J-Base's, reached the way any cross-ship global is: by name, once J-Base has loaded.
    ({ default: globalThis.NoteResolver } = await import('../../../../../src/plugins/_base/core/managers/NoteResolver.js'));

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJExtend();
    await import('../../../../../src/plugins/extend/core/_metadata/initialization.js');

    ({ default: OverlayManager } = await import('../../../../../src/plugins/extend/core/managers/OverlayManager.js'));
  });

  describe('overwriteNote', () =>
  {
    beforeEach(() =>
    {
      // the non-combining registry is process-wide state on the plugin metadata; rebuilding it per
      // test keeps one test's registration from silently changing another's merge rules.
      vi.spyOn(globalThis.J.EXTEND.Metadata, 'getNonCombiningKeys').mockReturnValue([]);
    });

    it('replaces a base tag with the overlay tag of the same key', () =>
    {
      // Arrange & Act
      const merged = OverlayManager.overwriteNote('<range:1>', '<range:5>');

      // Assert
      expect(merged).toBe('<range:5>');
    });

    it('combines rather than replaces for a registered non-combining key', () =>
    {
      // Arrange- this is the opt-in that makes additive tags stack across an extension chain, and the
      // only thing proving the registry reaches the resolver at all.
      globalThis.J.EXTEND.Metadata.getNonCombiningKeys.mockReturnValue([ 'onhitselfstate' ]);

      // Act
      const merged = OverlayManager.overwriteNote('<onHitSelfState:[1,50]>', '<onHitSelfState:[2,50]>');

      // Assert
      expect(merged).toBe('<onHitSelfState:[1,50]>\n<onHitSelfState:[2,50]>');
    });

    it('consults the registry on every call rather than caching it', () =>
    {
      // Arrange- keys are registered during boot by whichever plugins are present, so a merge must read
      // the current set rather than one captured earlier.
      OverlayManager.overwriteNote('<k:1>', '<k:2>');

      // Act
      globalThis.J.EXTEND.Metadata.getNonCombiningKeys.mockReturnValue([ 'k' ]);
      const merged = OverlayManager.overwriteNote('<k:1>', '<k:2>');

      // Assert
      expect(merged).toBe('<k:1>\n<k:2>');
    });
  });
});
//endregion plugins/extend/core/managers/overlay-manager-note-merge.test.js