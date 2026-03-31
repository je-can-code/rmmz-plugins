//region plugins/_base/json-mapper.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { evaluateJBaseOnlyForTests } from '../../setup/shipped-plugin-vm.js';

describe('J-Base JsonMapper (out/J-Base.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    evaluateJBaseOnlyForTests({ sandbox });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('parseObject returns null for null or undefined', () =>
  {
    expect(sandbox.JsonMapper.parseObject(null)).toBe(null);
    expect(sandbox.JsonMapper.parseObject(undefined)).toBe(null);
  });

  it('parseString maps boolean literals case-insensitively', () =>
  {
    expect(sandbox.JsonMapper.parseObject('true')).toBe(true);
    expect(sandbox.JsonMapper.parseObject('FALSE')).toBe(false);
  });

  it('parseString maps numeric strings with parseFloat', () =>
  {
    expect(sandbox.JsonMapper.parseObject('3.5')).toBe(3.5);
    expect(sandbox.JsonMapper.parseObject('-2')).toBe(-2);
  });

  it('parseString leaves other tokens as strings', () =>
  {
    expect(sandbox.JsonMapper.parseObject('hello')).toBe('hello');
  });

  it('parseObject maps arrays with recursive parseObject', () =>
  {
    expect(sandbox.JsonMapper.parseObject([ '1', 'true', 'x' ])).toEqual([ 1, true, 'x' ]);
  });

  it('parseArrayFromString splits top-level comma segments', () =>
  {
    const out = sandbox.JsonMapper.parseObject('[1, 2, 3]');

    expect(out).toEqual([ 1, 2, 3 ]);
  });

  it('parseArrayFromString splices one inner bracket segment', () =>
  {
    const out = sandbox.JsonMapper.parseObject('[1, [2, 3], 4]');

    expect(out).toEqual([ 1, [ 2, 3 ], 4 ]);
  });

  it('passes through numbers and booleans unchanged', () =>
  {
    expect(sandbox.JsonMapper.parseObject(42)).toBe(42);
    expect(sandbox.JsonMapper.parseObject(true)).toBe(true);
  });
});
//endregion plugins/_base/json-mapper.test.js
