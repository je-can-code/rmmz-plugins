//region plugins/sdp/core/managers/jabs-engine-without-abs.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * J-SDP works perfectly well without J-ABS - awarding points from turn-based victories rather than
 * from map kills - so its JABS bridge is gated behind a single namespace check at module load. This
 * pins the ungated half of that gate: with J-ABS absent the file must load and patch nothing at
 * all, rather than throwing partway through and taking the rest of the plugin's boot with it.
 *
 * It lives apart from the companion file because the gate is evaluated once, at import time, and
 * a module registry can only hold one answer per realm.
 */
describe('JABS_Engine ext/sdp augments without J-ABS (direct src import)', () =>
{
  let originalGainBasicRewards;

  beforeAll(async () =>
  {
    vi.resetModules();

    // deliberately no `ABS` key: this is a project running J-SDP with no action battle system.
    globalThis.J = {
      LOG: false,
      SDP: { Aliased: { JABS_Engine: new Map() } },
    };

    function StubJABS_Engine()
    {
    }

    originalGainBasicRewards = function()
    {
    };

    StubJABS_Engine.prototype.gainBasicRewards = originalGainBasicRewards;
    globalThis.JABS_Engine = StubJABS_Engine;

    await import('../../../../../src/plugins/sdp/core/managers/JABS_Engine.js');
  });

  it('loads without throwing when J-ABS is absent', () =>
  {
    // Arrange & Act: the import in beforeAll is the act.
    // Assert
    expect(globalThis.JABS_Engine).toBeDefined();
  });

  it('aliases nothing, leaving the reward hook untouched', () =>
  {
    // Arrange & Act
    const current = globalThis.JABS_Engine.prototype.gainBasicRewards;

    // Assert
    expect(current).toBe(originalGainBasicRewards);
  });

  it('records no aliases in the SDP alias map', () =>
  {
    // Arrange & Act
    const aliasCount = globalThis.J.SDP.Aliased.JABS_Engine.size;

    // Assert
    expect(aliasCount).toBe(0);
  });
});
//endregion plugins/sdp/core/managers/jabs-engine-without-abs.test.js