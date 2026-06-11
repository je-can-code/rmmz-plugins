//region plugins/elem/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadElemPluginVm } from './elem-vm.js';

describe('J-Elementalistics metadata and regex (out/elem/J-Elementalistics.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadElemPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes J.ELEM.Metadata', () =>
  {
    expect(sandbox.J.ELEM.Metadata.name).toBe('J-Elementalistics');
  });

  it('attack and absorb tag regexes capture bracketed id lists', () =>
  {
    const a = sandbox.J.ELEM.RegExp.AttackElementIds.exec('<attackElements:[3, 4]>');
    expect(a[1]).toBe('[3, 4]');
    const b = sandbox.J.ELEM.RegExp.AbsorbElementIds.exec('<absorbElements:[1]>');
    expect(b[1]).toBe('[1]');
  });

  it('boost tag regex captures element id and signed value', () =>
  {
    const m = sandbox.J.ELEM.RegExp.BoostElement.exec('<boostElement:2:+50>');
    expect(m[1]).toBe('2');
    expect(m[2]).toBe('+50');
  });
});
//endregion plugins/elem/metadata.test.js
