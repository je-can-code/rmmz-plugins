//region plugins/abs/ext/tools/database/rpg-skill.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsTools } from '../_component/fixtures/install-abs-tools-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Tools RPG_Skill augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Tools', {});

    setPluginContextToJabsTools();
    await import('../../../../../../src/plugins/abs/ext/tools/_metadata/initialization.js');

    await import('../../../../../../src/plugins/abs/ext/tools/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  /**
   * Builds a real RPG_Skill-backed row carrying the given note.
   * @param {string} note
   * @returns {object}
   */
  function buildSkillRow(note = '')
  {
    const row = Object.create(globalThis.RPG_Skill.prototype);
    row.id = 1;
    row.note = note;
    row.meta = {};
    row._original = function() { return this; };
    return row;
  }

  describe('jabsGapClose', () =>
  {
    it('reads the tagged gap close key', () =>
    {
      expect(buildSkillRow('<gapClose:hook>').jabsGapClose).toBe('hook');
    });

    it('is null when untagged', () =>
    {
      expect(buildSkillRow('').jabsGapClose).toBeNull();
    });
  });

  describe('jabsGapCloseAny', () =>
  {
    it('is true when tagged', () =>
    {
      expect(buildSkillRow('<gapCloseAny>').jabsGapCloseAny).toBe(true);
    });

    it('is false when untagged', () =>
    {
      expect(buildSkillRow('').jabsGapCloseAny).toBe(false);
    });
  });

  describe('jabsThisOnGapCloseEnd', () =>
  {
    it('parses the tagged array of skill ids', () =>
    {
      expect(buildSkillRow('<thisOnGapCloseEnd:[1, 2, 3]>').jabsThisOnGapCloseEnd).toEqual([ 1, 2, 3 ]);
    });

    it('is an empty array when untagged', () =>
    {
      expect(buildSkillRow('').jabsThisOnGapCloseEnd).toEqual([]);
    });
  });
});
//endregion plugins/abs/ext/tools/database/rpg-skill.test.js
