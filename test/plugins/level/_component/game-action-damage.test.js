//region plugins/level/_component/game-action-damage.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Game_Action.makeDamageValue (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    await import('../../../../src/plugins/level/core/objects/Game_System.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/level/core/objects/Game_Action.js');
  });

  it('multiplies base damage by LevelScaling for subject vs target levels', () =>
  {
    // Arrange
    globalThis.$gameSystem = new globalThis.Game_System();
    globalThis.$gameSystem.initialize();
    const action = new globalThis.Game_Action();
    action.__subject = { level: 20 };
    const target = { level: 10 };

    // Act
    const scaled = action.makeDamageValue(target, false);

    // Assert
    expect(scaled).toBe(190);
  });
});
//endregion plugins/level/_component/game-action-damage.test.js
