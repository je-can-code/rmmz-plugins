//region plugins/elem/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installElemHostGlobals, setPluginContextToJBase, setPluginContextToJElem } from './fixtures/install-elem-host-globals.js';

describe('J-Elementalistics metadata and regex (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installElemHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJElem();
    await import('../../../../src/plugins/elem/core/_metadata/initialization.js');
  });

  it('attack tag regex captures a bracketed id list', () =>
  {
    // Arrange & Act
    const attack = globalThis.J.ELEM.RegExp.AttackElementIds.exec('<attackElements:[3, 4]>');

    // Assert
    expect(attack[1]).toBe('[3, 4]');
  });

  it('absorb tag regex captures a bracketed id list', () =>
  {
    // Arrange & Act
    const absorb = globalThis.J.ELEM.RegExp.AbsorbElementIds.exec('<absorbElements:[1]>');

    // Assert
    expect(absorb[1]).toBe('[1]');
  });

  it('boost tag regex captures the bracketed [id, signed value] tuple', () =>
  {
    // Arrange & Act
    const m = globalThis.J.ELEM.RegExp.BoostElement.exec('<boostElement:[2, +50]>');

    // Assert
    expect(m[1]).toBe('[2, +50]');
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: drop the already-installed J-Base metadata below this plugin's floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJElem();

    // Act & Assert
    await expect(import('../../../../src/plugins/elem/core/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-Base/);

    // restore the satisfying version so later tests in this file are unaffected.
    globalThis.J.BASE.Metadata.Version = originalVersion;
  });
});
//endregion plugins/elem/_component/metadata.test.js
