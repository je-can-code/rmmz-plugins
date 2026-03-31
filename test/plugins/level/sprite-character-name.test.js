//region plugins/level/sprite-character-name.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLevelPluginVm } from './level-vm.js';

describe('J-LevelMaster Sprite_Character.getBattlerName (out/J-LevelMaster.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLevelPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('prefixes padded enemy level to the underlying battler name', () =>
  {
    const sprite = new sandbox.Sprite_Character();

    expect(sprite.getBattlerName()).toBe('007 Slime');
  });
});
//endregion plugins/level/sprite-character-name.test.js
