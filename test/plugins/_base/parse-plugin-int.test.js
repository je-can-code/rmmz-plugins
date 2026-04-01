//region plugins/_base/parse-plugin-int.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { evaluateJBaseOnlyForTests } from '../../setup/shipped-plugin-vm.js';

describe('J.BASE.Helpers.parsePluginInt (out/J-Base.js)', () =>
{
  let sandbox;
  let parsePluginInt;

  beforeAll(() =>
  {
    sandbox = { console };
    evaluateJBaseOnlyForTests({ sandbox });
    parsePluginInt = sandbox.J.BASE.Helpers.parsePluginInt;
  });

  afterAll(() =>
  {
    sandbox = null;
    parsePluginInt = null;
  });

  it('returns fallback for undefined, null, and empty string', () =>
  {
    expect(parsePluginInt(undefined, 0)).toBe(0);
    expect(parsePluginInt(undefined, 42)).toBe(42);
    expect(parsePluginInt(null, -1)).toBe(-1);
    expect(parsePluginInt('', 99)).toBe(99);
  });

  it('parses base-10 integers from strings and preserves sign', () =>
  {
    expect(parsePluginInt('0', 7)).toBe(0);
    expect(parsePluginInt('42', 0)).toBe(42);
    expect(parsePluginInt('-3', 0)).toBe(-3);
    expect(parsePluginInt('  12  ', 0)).toBe(12);
  });

  it('coerces finite numbers via stringification', () =>
  {
    expect(parsePluginInt(8, 0)).toBe(8);
    expect(parsePluginInt(3.9, 0)).toBe(3);
  });

  it('returns fallback when parse result is not finite', () =>
  {
    expect(parsePluginInt('not-a-number', 0)).toBe(0);
    expect(parsePluginInt('not-a-number', -5)).toBe(-5);
    expect(Number.isNaN(parsePluginInt('x', NaN))).toBe(true);
    expect(Number.isNaN(parsePluginInt('', NaN))).toBe(true);
    expect(Number.isNaN(parsePluginInt(null, NaN))).toBe(true);
  });

  it('uses radix 10 so hex-looking strings do not read as hex', () =>
  {
    expect(parsePluginInt('0x10', 0)).toBe(0);
  });

  it('matches parseInt partial suffix behavior for trailing junk', () =>
  {
    expect(parsePluginInt('99abc', 0)).toBe(99);
  });
});
//endregion plugins/_base/parse-plugin-int.test.js
