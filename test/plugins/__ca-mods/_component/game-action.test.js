//region plugins/__ca-mods/_component/game-action.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('CAMods Game_Action.getAntiNullElementIds (direct src import)', () =>
{
  beforeAll(async () =>
  {
    // this file only ever reaches for the bare Game_Action global to hang a single method off
    // its prototype- a plain constructor stub is all that's needed to receive the patch.
    globalThis.Game_Action = function() {};

    await import('../../../../src/plugins/__ca-mods/core/objects/Game_Action.js');
  });

  afterAll(() =>
  {
    delete globalThis.Game_Action;
  });

  it('returns the CA-specific tool element ids', () =>
  {
    const action = new globalThis.Game_Action();

    // ids 25-28 are the CA project's tool elements, which must never be nulled out by the
    // normal "no elements selected" element-rate short-circuit.
    expect(action.getAntiNullElementIds()).toEqual([ 25, 26, 27, 28 ]);
  });
});
//endregion plugins/__ca-mods/_component/game-action.test.js
