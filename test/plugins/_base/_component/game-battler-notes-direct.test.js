//region plugins/_base/_component/game-battler-notes-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

/**
 * Prototype: the same assertions as game-battler-notes.test.js (which evaluates out/J-Base.js in a
 * nested vm.runInContext sandbox), but exercising src/plugins/_base source directly, imported into the
 * real Vitest-managed realm instead of a second, invisible-to-coverage vm context. If this file's coverage
 * shows up for _base/objects/Game_Battler.js and _base/_metadata/initialization.js, the vm layer was never
 * load-bearing for this kind of test- it was only ever a source of placeholder globals, and globalThis can
 * carry those placeholders just as well while staying inside the boundary vitest's coverage provider
 * actually instruments.
 */
describe('J-Base Game_Battler getNotesSources / getAllNotes (direct src import)', () =>
{
  beforeAll(async () =>
  {
    // fresh module registry per describe block so re-running this file doesn't double-apply
    // prototype patches or re-throw on Object.defineProperty(String, 'empty', ...) re-declaration.
    vi.resetModules();

    installJBaseHostGlobals();

    // real production code, not a fixture guess- sets up globalThis.J, J.BASE.Aliased maps, and the
    // String.empty/Array.empty sentinel augmentations relied on elsewhere in this codebase.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // the file under test- patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  it('getNotesSources lists databaseData, skills(), and allStates() without __testNoteSources', () =>
  {
    globalThis.$dataStates[9] = { id: 9, note: 'state-note' };

    const battler = new globalThis.Game_Battler();

    battler.initMembers();
    battler.databaseData = function()
    {
      return { note: 'db-note' };
    };
    battler.skills = function()
    {
      return [ { note: 'skill-note' } ];
    };
    battler._states = [ 9 ];

    const sources = battler.getNotesSources();

    expect(sources.length).toBe(3);
    expect(sources[0].note).toBe('db-note');
    expect(sources[1].note).toBe('skill-note');
    expect(sources[2].note).toBe('state-note');
  });

  it('getAllNotes matches getNotesSources for battlers', () =>
  {
    globalThis.$dataStates[1] = { id: 1, note: 's' };

    const battler = new globalThis.Game_Battler();

    battler.initMembers();
    battler.databaseData = () => ({ note: 'd' });
    battler.skills = () => [];
    battler._states = [ 1 ];

    expect(battler.getAllNotes()).toEqual(battler.getNotesSources());
  });
});
//endregion plugins/_base/_component/game-battler-notes-direct.test.js
