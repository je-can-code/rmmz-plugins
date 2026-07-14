//region plugins/diff/game-actor-param.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installDiffHostGlobals, setPluginContextToJBase, setPluginContextToJDiff } from './fixtures/install-diff-host-globals.js';

describe('J-Difficulty Game_Actor.param (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../src/plugins/diff/core/_metadata/initialization.js');

    // patches globalThis.Game_System/Game_Temp/Game_Actor prototypes directly, no vm involved.
    await import('../../../src/plugins/diff/core/objects/Game_System.js');
    await import('../../../src/plugins/diff/core/objects/Game_Temp.js');
    await import('../../../src/plugins/diff/core/objects/Game_Actor.js');
  });

  it('scales base param by the default difficulty actor bparam rates', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    globalThis.$gameTemp = new globalThis.Game_Temp();
    globalThis.$gameTemp.initMembers();
    const actor = new globalThis.Game_Actor();
    actor.initMembers();

    // Act
    const result = actor.param(0);

    // Assert
    expect(result).toBe(80);
  });
});
//endregion plugins/diff/game-actor-param.test.js
