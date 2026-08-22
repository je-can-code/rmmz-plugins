//region plugins/diff/_component/difficulty-augment-without-siblings.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installDiffHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDiff,
} from './fixtures/install-diff-host-globals.js';

/**
 * J-Difficulty scales drop rates and SDP points, but neither of those things exists in a vanilla
 * project - they are owned by J-DropsControl and J-SDP, which are optional siblings. The augments
 * for them are therefore written behind a namespace check that runs once, at import time.
 *
 * That check is the only thing standing between "this feature is not installed" and an alias chain
 * that captured `undefined` as its original. This file boots the plugin with neither sibling
 * present, which is the arrangement every other test here deliberately avoids.
 */
describe('J-Difficulty augments with no optional siblings installed', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../../src/plugins/diff/core/_metadata/initialization.js');

    // deliberately no J.DROPS and no J.SDP, and correspondingly nothing on the enemy prototype for
    // those augments to have aliased. This is a stock project with only J-Base and J-Difficulty.
    await import('../../../../src/plugins/diff/core/objects/Game_Enemy.js');
  });

  it('still applies the augments that depend on nothing optional', () =>
  {
    // Arrange & Act & Assert: the proof that the file above actually finished importing- without
    // this, every absence asserted below would also be satisfied by the module never loading.
    expect(globalThis.J.DIFFICULTY.Aliased.Game_Enemy.has('exp')).toBe(true);
  });

  it('leaves the enemy base drop rate alone when J-DropsControl is absent', () =>
  {
    // Arrange & Act & Assert: there is no base drop rate to scale in a project without the drops
    // plugin, so defining one here would invent a method the rest of the engine never asked for
    // and hand it an aliased original of undefined to call.
    expect(globalThis.Game_Enemy.prototype.getBaseDropRate).toBeUndefined();
  });

  it('leaves the enemy sdp reward alone when J-SDP is absent', () =>
  {
    // Arrange & Act & Assert: the mirror of the case above, for the other optional sibling.
    expect(globalThis.Game_Enemy.prototype.sdpPoints).toBeUndefined();
  });
});
//endregion plugins/diff/_component/difficulty-augment-without-siblings.test.js