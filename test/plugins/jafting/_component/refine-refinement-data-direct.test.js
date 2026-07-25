//region plugins/jafting/_component/refine-refinement-data-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import JAFTING_RefinementData from '../../../../src/plugins/jafting/ext/refine/__models/JAFT_RefinementData.js';

/**
 * Direct-import coverage for JAFTING_RefinementData, a thin note-parsing wrapper delegating every field
 * to RPGManager.getNumberFromNoteByRegex / checkForBooleanFromNoteByRegex (bare globals, from J-Base's
 * RPGManager) against J.JAFTING.EXT.REFINE's regex metadata (also bare globals here). Both are stubbed
 * minimally so this test can assert the *wiring*- which regex/hand-crafted note object each field reads-
 * without re-implementing RPGManager's own regex parsing.
 */
describe('JAFTING_RefinementData (direct src import)', () =>
{
  const REGEX = {
    MaxRefineCount: /maxRefine/,
    MaxRefinedTraits: /maxTraits/,
    NotRefinementMaterial: /notMaterial/,
    NotRefinementBase: /notBase/,
    Unrefinable: /unrefinable/,
  };

  let getNumberMock;
  let checkBooleanMock;

  beforeEach(() =>
  {
    getNumberMock = vi.fn(() => 0);
    checkBooleanMock = vi.fn(() => false);

    globalThis.RPGManager = {
      getNumberFromNoteByRegex: getNumberMock,
      checkForBooleanFromNoteByRegex: checkBooleanMock,
    };

    globalThis.J = {
      JAFTING: {
        EXT: {
          REFINE: {
            MaxRefineCount: REGEX.MaxRefineCount,
            MaxRefinedTraits: REGEX.MaxRefinedTraits,
            NotRefinementMaterial: REGEX.NotRefinementMaterial,
            NotRefinementBase: REGEX.NotRefinementBase,
            Unrefinable: REGEX.Unrefinable,
          },
        },
      },
    };
  });

  afterEach(() =>
  {
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  it('splits raw notes on line breaks before wrapping them for RPGManager', () =>
  {
    const data = new JAFTING_RefinementData('line one\r\nline two\nline three', {});

    expect(data._notes).toEqual([ 'line one', 'line two', 'line three' ]);
  });

  it('getMaxRefineCount/getMaxTraitCount each read their own regex via getNumberFromNoteByRegex', () =>
  {
    getNumberMock.mockImplementation((_datum, regex) =>
    {
      if (regex === REGEX.MaxRefineCount) return 3;
      if (regex === REGEX.MaxRefinedTraits) return 5;
      return 0;
    });

    const data = new JAFTING_RefinementData('note text', {});

    expect(data.maxRefineCount).toBe(3);
    expect(data.maxTraitCount).toBe(5);
    expect(getNumberMock).toHaveBeenCalledWith({ note: data._notes }, REGEX.MaxRefineCount);
    expect(getNumberMock).toHaveBeenCalledWith({ note: data._notes }, REGEX.MaxRefinedTraits);
  });

  it('the three boolean flags each read their own regex via checkForBooleanFromNoteByRegex', () =>
  {
    checkBooleanMock.mockImplementation((_datum, regex) =>
    {
      if (regex === REGEX.NotRefinementMaterial) return true;
      if (regex === REGEX.NotRefinementBase) return true;
      if (regex === REGEX.Unrefinable) return true;
      return false;
    });

    const data = new JAFTING_RefinementData('note text', {});

    expect(data.notRefinementMaterial).toBe(true);
    expect(data.notRefinementBase).toBe(true);
    expect(data.unrefinable).toBe(true);
    expect(checkBooleanMock).toHaveBeenCalledWith({ note: data._notes }, REGEX.NotRefinementMaterial);
    expect(checkBooleanMock).toHaveBeenCalledWith({ note: data._notes }, REGEX.NotRefinementBase);
    expect(checkBooleanMock).toHaveBeenCalledWith({ note: data._notes }, REGEX.Unrefinable);
  });

  it('starts refinedCount at zero regardless of note contents', () =>
  {
    const data = new JAFTING_RefinementData('', {});

    expect(data.refinedCount).toBe(0);
  });
});
//endregion plugins/jafting/_component/refine-refinement-data-direct.test.js
