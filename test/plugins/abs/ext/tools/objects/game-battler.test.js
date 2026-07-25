//region plugins/abs/ext/tools/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsTools } from '../_component/fixtures/install-abs-tools-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Tools Game_Battler augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Tools', {});

    setPluginContextToJabsTools();
    await import('../../../../../../src/plugins/abs/ext/tools/_metadata/initialization.js');

    globalThis.Game_Battler = class
    {
      constructor(notes = [])
      {
        this.notes = notes;
      }

      getAllNotes()
      {
        return this.notes;
      }
    };

    await import('../../../../../../src/plugins/abs/ext/tools/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('gapCloseKey', () =>
  {
    it('is null when no note source carries the tag', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler([ { note: '' } ]);

      // Act & Assert
      expect(battler.gapCloseKey()).toBeNull();
    });

    it('returns the key from the first note source that carries the tag', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler([
        { note: '' },
        { note: '<gapCloseTarget:hook>' },
        { note: '<gapCloseTarget:other>' },
      ]);

      // Act & Assert
      expect(battler.gapCloseKey()).toBe('hook');
    });
  });

  describe('isGapCloseBlocked', () =>
  {
    it('is false when no note source carries the block tag', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler([ { note: '' } ]);

      // Act & Assert
      expect(battler.isGapCloseBlocked()).toBe(false);
    });

    it('is true when any note source carries the block tag', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler([
        { note: '' },
        { note: '<blockGapClose>' },
      ]);

      // Act & Assert
      expect(battler.isGapCloseBlocked()).toBe(true);
    });
  });

  describe('gapCloseEndSkillIds', () =>
  {
    it('is empty when no note source carries the tag', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler([ { note: '' } ]);

      // Act & Assert
      expect(battler.gapCloseEndSkillIds()).toEqual([]);
    });

    it('merges skill ids across every note source carrying the tag', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler([
        { note: '<onGapCloseEnd:[1, 2]>' },
        { note: '' },
        { note: '<onGapCloseEnd:[3]>' },
      ]);

      // Act & Assert
      expect(battler.gapCloseEndSkillIds()).toEqual([ 1, 2, 3 ]);
    });
  });
});
//endregion plugins/abs/ext/tools/objects/game-battler.test.js
