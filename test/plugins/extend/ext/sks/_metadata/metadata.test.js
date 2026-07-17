//region plugins/extend/ext/sks/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
  setPluginContextToJExtendSks,
} from '../../../_component/fixtures/install-extend-host-globals.js';

describe('J-Extend-SKS metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJExtend();
    await import('../../../../../../src/plugins/extend/core/_metadata/initialization.js');

    setPluginContextToJExtendSks();
    await import('../../../../../../src/plugins/extend/ext/sks/_metadata/initialization.js');
  });

  it('exposes plugin name on J.EXTEND.EXT.SKS.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.EXTEND.EXT.SKS.Metadata.name).toBe('J-Extend-SKS');
  });

  it('exposes plugin version on J.EXTEND.EXT.SKS.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.EXTEND.EXT.SKS.Metadata.version).toMatchObject({ major: 1, minor: 0, patch: 0 });
  });

  it('initializes an empty aliased map for Window_SkillEquipDetail', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.EXTEND.EXT.SKS.Aliased.Window_SkillEquipDetail).toBeInstanceOf(Map);
    expect(globalThis.J.EXTEND.EXT.SKS.Aliased.Window_SkillEquipDetail.size).toBe(0);
  });
});
//endregion plugins/extend/ext/sks/_metadata/metadata.test.js
