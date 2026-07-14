//region plugins/level/_component/sprite-character-name.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster Sprite_Character.getBattlerName (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');

    // patches globalThis.Sprite_Character.prototype directly, no vm involved.
    await import('../../../../src/plugins/level/core/sprites/Sprite_Character.js');
  });

  it('prefixes the padded enemy level to the underlying battler name', () =>
  {
    // Arrange
    const sprite = new globalThis.Sprite_Character();

    // Act
    const battlerName = sprite.getBattlerName();

    // Assert
    expect(battlerName.name).toBe('007 Slime');
  });
});
//endregion plugins/level/_component/sprite-character-name.test.js
