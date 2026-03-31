//region plugins/_base/game-battler-notes.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { evaluateJBaseOnlyForTests } from '../../setup/shipped-plugin-vm.js';

describe('J-Base Game_Battler getNotesSources / getAllNotes (out/J-Base.js)', () =>
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

  it('getNotesSources lists databaseData, skills(), and allStates() without __testNoteSources', () =>
  {
    sandbox.$dataStates[9] = { id: 9, note: 'state-note' };

    const battler = new sandbox.Game_Battler();

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
    sandbox.$dataStates[1] = { id: 1, note: 's' };

    const battler = new sandbox.Game_Battler();

    battler.initMembers();
    battler.databaseData = () => ({ note: 'd' });
    battler.skills = () => [];
    battler._states = [ 1 ];

    expect(battler.getAllNotes()).toEqual(battler.getNotesSources());
  });
});
//endregion plugins/_base/game-battler-notes.test.js
