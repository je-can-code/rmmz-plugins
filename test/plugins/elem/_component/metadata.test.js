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

  it('exposes J.ELEM.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ELEM.Metadata.name).toBe('J-Elementalistics');
  });

  it('attack and absorb tag regexes capture bracketed id lists', () =>
  {
    // Arrange & Act
    const a = globalThis.J.ELEM.RegExp.AttackElementIds.exec('<attackElements:[3, 4]>');
    const b = globalThis.J.ELEM.RegExp.AbsorbElementIds.exec('<absorbElements:[1]>');

    // Assert
    expect(a[1]).toBe('[3, 4]');
    expect(b[1]).toBe('[1]');
  });

  it('boost tag regex captures element id and signed value', () =>
  {
    // Arrange & Act
    const m = globalThis.J.ELEM.RegExp.BoostElement.exec('<boostElement:2:+50>');

    // Assert
    expect(m[1]).toBe('2');
    expect(m[2]).toBe('+50');
  });
});
//endregion plugins/elem/_component/metadata.test.js
