//region plugins/jafting/_component/refine-jafting-trait-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import JAFTING_Trait from '../../../../src/plugins/jafting/ext/refine/__models/JAFTING_Trait.js';

/**
 * Direct-import coverage for JAFTING_Trait, a thin wrapper delegating name/value/divider logic to
 * J-Base's RPG_Trait (a bare global here, never imported- the real class lives in _base and JAFTING
 * references it only by convention that both plugins load together in the same bundle).
 */
describe('JAFTING_Trait (direct src import)', () =>
{
  let fakeRpgTrait;

  beforeEach(() =>
  {
    // convertToRmTrait()/divider() both route through RPG_Trait.fromValues(); track calls and return a
    // fake with just the surface JAFTING_Trait actually reads (textName/textValue/textNameAndValue).
    fakeRpgTrait = {
      textName: vi.fn(() => 'Attack Speed'),
      textValue: vi.fn(() => '+10%'),
      textNameAndValue: vi.fn(() => 'Attack Speed +10%'),
    };

    globalThis.RPG_Trait = { fromValues: vi.fn(() => fakeRpgTrait) };
    globalThis.J = { BASE: { Traits: { NO_DISAPPEAR: 63 } } };
  });

  afterEach(() =>
  {
    delete globalThis.RPG_Trait;
    delete globalThis.J;
  });

  it('constructor stores code/dataId/value', () =>
  {
    const trait = new JAFTING_Trait(11, 2, 20);

    expect(trait._code).toBe(11);
    expect(trait._dataId).toBe(2);
    expect(trait._value).toBe(20);
  });

  it('convertToRmTrait rebuilds an RPG_Trait from the stored code/dataId/value', () =>
  {
    const trait = new JAFTING_Trait(11, 2, 20);

    const rmTrait = trait.convertToRmTrait();

    expect(RPG_Trait.fromValues).toHaveBeenCalledWith(11, 2, 20);
    expect(rmTrait).toBe(fakeRpgTrait);
  });

  it('name/value/nameAndValue getters delegate to the converted RPG_Trait', () =>
  {
    const trait = new JAFTING_Trait(11, 2, 20);

    expect(trait.name).toBe('Attack Speed');
    expect(trait.value).toBe('+10%');
    expect(trait.nameAndValue).toBe('Attack Speed +10%');
  });

  it('divider() builds the NO_DISAPPEAR trait at dataId 3, value 1', () =>
  {
    JAFTING_Trait.divider();

    expect(RPG_Trait.fromValues).toHaveBeenCalledWith(63, 3, 1);
  });
});
//endregion plugins/jafting/_component/refine-jafting-trait-direct.test.js
