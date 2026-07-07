//region plugins/_base/rpg-manager.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJabsOnChanceEffectGlobalStub } from './fixtures/install-jabs-onchance-stub.js';
import { clearRpgManagerCacheInVm, evaluateJBaseOnlyForTests } from '../../setup/shipped-plugin-vm.js';

describe('J-Base RPGManager (out/J-Base.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    evaluateJBaseOnlyForTests({
      sandbox,
      afterHostGlobalsInstall: installJabsOnChanceEffectGlobalStub,
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
    sandbox.$gameVariables._data = [];
  });

  describe('caching', () =>
  {
    it('returns stale getNumberFromNoteByRegex after note changes until invalidate', () =>
    {
      const data = { note: '<k:1>' };
      const re = /<k:(\d+)>/;

      expect(sandbox.RPGManager.getNumberFromNoteByRegex(data, re)).toBe(1);

      data.note = '<k:99>';

      expect(sandbox.RPGManager.getNumberFromNoteByRegex(data, re)).toBe(1);

      sandbox.RPGManager.invalidate(data);

      expect(sandbox.RPGManager.getNumberFromNoteByRegex(data, re)).toBe(99);
    });

    it('clearCache drops entries so the next read recomputes', () =>
    {
      const a = { note: '<k:2>' };
      const b = { note: '<k:3>' };
      const re = /<k:(\d+)>/;

      expect(sandbox.RPGManager.getNumberFromNoteByRegex(a, re)).toBe(2);
      expect(sandbox.RPGManager.getNumberFromNoteByRegex(b, re)).toBe(3);

      clearRpgManagerCacheInVm(sandbox);

      a.note = '<k:20>';
      b.note = '<k:30>';

      expect(sandbox.RPGManager.getNumberFromNoteByRegex(a, re)).toBe(20);
      expect(sandbox.RPGManager.getNumberFromNoteByRegex(b, re)).toBe(30);
    });
  });

  describe('getStringFromNoteByRegex / getStringsFromNoteByRegex', () =>
  {
    it('getString keeps last match across lines; getStrings collects all', () =>
    {
      const data = { note: '<id:a>\n<id:b>' };
      const re = /<id:(\w+)>/;

      expect(sandbox.RPGManager.getStringFromNoteByRegex(data, re)).toBe('b');
      expect(sandbox.RPGManager.getStringsFromNoteByRegex(data, re)).toEqual([ 'a', 'b' ]);
    });

    it('returns String.empty or null when missing (nullIfEmpty)', () =>
    {
      const empty = { note: '' };
      const re = /<id:(\w+)>/;

      expect(sandbox.RPGManager.getStringFromNoteByRegex(empty, re, false)).toBe('');
      expect(sandbox.RPGManager.getStringFromNoteByRegex(empty, re, true)).toBe(null);
      expect(sandbox.RPGManager.getStringsFromNoteByRegex(empty, re, false)).toEqual([]);
      expect(sandbox.RPGManager.getStringsFromNoteByRegex(empty, re, true)).toBe(null);
    });

    it('rejects non-parseable databaseData', () =>
    {
      const re = /<id:(\w+)>/;

      expect(sandbox.RPGManager.getStringFromNoteByRegex(null, re, true)).toBe(null);
      expect(sandbox.RPGManager.getStringFromNoteByRegex({ }, re, true)).toBe(null);
    });
  });

  describe('getNumberFromNoteByRegex / getSumFromAllNotesByRegex', () =>
  {
    it('uses last match and parses decimals', () =>
    {
      const data = { note: '<n:1>\n<n:2.5>' };
      const re = /<n:([\d.]+)>/;

      expect(sandbox.RPGManager.getNumberFromNoteByRegex(data, re)).toBe(2.5);
    });

    it('getSumFromAllNotesByRegex sums per-object last values', () =>
    {
      const re = /<n:(\d+)>/;
      const rows = [
        { note: '<n:4>' },
        { note: '<n:5>' },
      ];

      expect(sandbox.RPGManager.getSumFromAllNotesByRegex(rows, re)).toBe(9);
    });

    it('empty collection returns 0 or null with nullIfEmpty', () =>
    {
      const re = /<n:(\d+)>/;

      expect(sandbox.RPGManager.getSumFromAllNotesByRegex([], re, false)).toBe(0);
      expect(sandbox.RPGManager.getSumFromAllNotesByRegex([], re, true)).toBe(null);
    });

    it('all zeros with nullIfEmpty returns null', () =>
    {
      const re = /<n:(\d+)>/;
      const rows = [ { note: '' }, { note: '' } ];

      expect(sandbox.RPGManager.getSumFromAllNotesByRegex(rows, re, true)).toBe(null);
    });
  });

  describe('getNumbersFromNoteByRegex', () =>
  {
    it('parses bracket list from capture group', () =>
    {
      const data = { note: '<nums:[1,2,3]>' };
      const re = /<nums:(\[[^\]]+\])>/;

      expect(sandbox.RPGManager.getNumbersFromNoteByRegex(data, re)).toEqual([ 1, 2, 3 ]);
    });
  });

  describe('getResultFromNoteByRegex / getResultsFromAllNotesByRegex', () =>
  {
    it('evaluates b and sums multiple lines', () =>
    {
      const data = { note: '<f:b+1>\n<f:b*2>' };
      const re = /<f:([^>]+)>/;

      expect(sandbox.RPGManager.getResultFromNoteByRegex(data, re, 10, null, false)).toBe(31);
    });

    it('exposes a from context and v from $gameVariables._data', () =>
    {
      sandbox.$gameVariables._data[5] = 7;
      const data = { note: '<f:a.level + v[5]>' };
      const re = /<f:([^>]+)>/;
      const ctx = { level: 3, getLevel() { return this.level; } };

      expect(sandbox.RPGManager.getResultFromNoteByRegex(data, re, 0, ctx, false)).toBe(10);
    });

    it('re-evaluates formulas when battler context level changes', () =>
    {
      const data = { note: '<f:15 + (a.level * 4)>' };
      const re = /<f:([^>]+)>/;
      const ctx = { level: 1, getLevel() { return this.level; } };

      expect(sandbox.RPGManager.getResultFromNoteByRegex(data, re, 0, ctx, false)).toBe(19);

      ctx.level = 2;

      expect(sandbox.RPGManager.getResultFromNoteByRegex(data, re, 0, ctx, false)).toBe(23);
    });

    it('swallows bad formulas and still returns finite sum', () =>
    {
      const err = vi.spyOn(sandbox.console, 'error').mockImplementation(() => {});
      const data = { note: '<f:not_a_js_expr_@@@>' };
      const re = /<f:([^>]+)>/;

      expect(sandbox.RPGManager.getResultFromNoteByRegex(data, re, 0, null, false)).toBe(0);

      err.mockRestore();
    });

    it('getResultsFromAllNotesByRegex aggregates objects', () =>
    {
      const re = /<f:([^>]+)>/;
      const rows = [
        { note: '<f:b>' },
        { note: '<f:b+2>' },
      ];

      expect(sandbox.RPGManager.getResultsFromAllNotesByRegex(rows, re, 5, null, false)).toBe(12);
    });
  });

  describe('checkForBooleanFromNoteByRegex / checkForBooleanFromAllNotesByRegex', () =>
  {
    it('detects tag presence on a single object', () =>
    {
      const yes = { note: '<hidden>' };
      const no = { note: '' };
      const re = /<hidden>/;

      expect(sandbox.RPGManager.checkForBooleanFromNoteByRegex(yes, re, false)).toBe(true);
      expect(sandbox.RPGManager.checkForBooleanFromNoteByRegex(no, re, false)).toBe(false);
      expect(sandbox.RPGManager.checkForBooleanFromNoteByRegex(no, re, true)).toBe(null);
    });

    it('OR semantics across objects for all-notes helper', () =>
    {
      const re = /<tag>/;
      const a = { note: '' };
      const b = { note: '<tag>' };

      expect(sandbox.RPGManager.checkForBooleanFromAllNotesByRegex([ a, a ], re, false)).toBe(false);
      expect(sandbox.RPGManager.checkForBooleanFromAllNotesByRegex([ a, b ], re, false)).toBe(true);
    });

    it('all-notes with nullIfEmpty returns null when no truthy match', () =>
    {
      const re = /<tag>/;

      expect(sandbox.RPGManager.checkForBooleanFromAllNotesByRegex([ { note: '' } ], re, true)).toBe(null);
    });
  });

  describe('getArrayFromNotesByRegex / getArraysFromNotesByRegex', () =>
  {
    it('getArray parses one bracket capture with tryParse', () =>
    {
      const data = { note: '<arr:[10,20]>' };
      const re = /<arr:(\[[^\]]+\])>/;

      expect(sandbox.RPGManager.getArrayFromNotesByRegex(data, re, true, false)).toEqual([ 10, 20 ]);
    });

    it('getArrays collects multiple lines', () =>
    {
      const data = { note: '<a:[1]>\n<a:[2,3]>' };
      const re = /<a:(\[[^\]]+\])>/;
      const out = sandbox.RPGManager.getArraysFromNotesByRegex(data, re, true, false);

      expect(out).toEqual([
        [ 1 ],
        [ 2, 3 ],
      ]);
    });
  });

  describe('getAllCapturesFromNoteByRegex / getAllCapturesFromAllNotesByRegex', () =>
  {
    it('returns capture groups per matching line', () =>
    {
      const data = { note: '<x:hit:self:[a]>' };
      const re = /<x:(\w+):(\w+):\[([^\]]+)\]>/;

      expect(sandbox.RPGManager.getAllCapturesFromNoteByRegex(data, re, false)).toEqual([
        [ 'hit', 'self', 'a' ],
      ]);
    });

    it('concatenates captures from multiple database rows', () =>
    {
      const re = /<c:(\d)>/;
      const rows = [
        { note: '<c:1>' },
        { note: '<c:2>' },
      ];

      expect(sandbox.RPGManager.getAllCapturesFromAllNotesByRegex(rows, re, false)).toEqual([
        [ '1' ],
        [ '2' ],
      ]);
    });

    it('nullIfEmpty when nothing matches', () =>
    {
      const re = /<none:(\d)>/;

      expect(sandbox.RPGManager.getAllCapturesFromNoteByRegex({ note: '' }, re, true)).toBe(null);
    });
  });

  describe('getOnChanceEffectsFromDatabaseObject(s)', () =>
  {
    it('maps parsed bracket pairs to stub JABS_OnChanceEffect instances', () =>
    {
      const data = { note: '<jeOC:[7, 55]>' };
      const re = /<jeOC:(\[[0-9]+,\s*[0-9]+\])>/;
      const list = sandbox.RPGManager.getOnChanceEffectsFromDatabaseObject(data, re);

      expect(list.length).toBe(1);
      expect(list[0].skillId).toBe(7);
      expect(list[0].chance).toBe(55);
      expect(typeof list[0].key).toBe('string');
    });

    it('flattens multiple objects via getOnChanceEffectsFromDatabaseObjects', () =>
    {
      const re = /<jeOC:(\[[0-9]+,\s*[0-9]+\])>/;
      const rows = [
        { note: '<jeOC:[1, 10]>' },
        { note: '<jeOC:[2, 20]>' },
      ];
      const list = sandbox.RPGManager.getOnChanceEffectsFromDatabaseObjects(rows, re);

      expect(list.map(e => e.skillId)).toEqual([ 1, 2 ]);
    });

    it('returns empty array when note has no matches', () =>
    {
      const re = /<jeOC:(\[[0-9]+,\s*[0-9]+\])>/;

      expect(sandbox.RPGManager.getOnChanceEffectsFromDatabaseObject({ note: '' }, re)).toEqual([]);
    });
  });

  describe('chanceIn100', () =>
  {
    it('returns false when percentOfSuccess is 0 or negative', () =>
    {
      expect(sandbox.RPGManager.chanceIn100(0)).toBe(false);
      expect(sandbox.RPGManager.chanceIn100(-5)).toBe(false);
    });

    it('respects deterministic Math.randomInt', () =>
    {
      const prev = sandbox.Math.randomInt;

      sandbox.Math.randomInt = function()
      {
        return 40;
      };

      expect(sandbox.RPGManager.chanceIn100(50, 1, 0)).toBe(true);

      sandbox.Math.randomInt = function()
      {
        return 60;
      };

      expect(sandbox.RPGManager.chanceIn100(50, 1, 0)).toBe(false);

      sandbox.Math.randomInt = prev;
    });

    it('negative rerolls can undo success', () =>
    {
      const prev = sandbox.Math.randomInt;
      let n = 0;

      sandbox.Math.randomInt = function()
      {
        n++;
        if (n === 1)
        {
          return 10;
        }

        return 80;
      };

      expect(sandbox.RPGManager.chanceIn100(50, 1, 1)).toBe(false);

      sandbox.Math.randomInt = prev;
    });
  });

  describe('global RegExp flag regression', () =>
  {
    it('does not leak lastIndex across note lines when input uses /g', () =>
    {
      const data = { note: '<g:1>\n<g:2>\n<g:3>' };
      const re = /<g:(\d+)>/g;

      expect(sandbox.RPGManager.getStringsFromNoteByRegex(data, re)).toEqual([ '1', '2', '3' ]);
    });
  });

  describe('weightedMapChoice', () =>
  {
    it('returns null when totalWeight is zero or negative', () =>
    {
      const map = new Map([ [ 'a', 1 ] ]);

      expect(sandbox.RPGManager.weightedMapChoice(map, 0)).toBeNull();
      expect(sandbox.RPGManager.weightedMapChoice(map, -5)).toBeNull();
    });

    it('picks the key whose weight bucket contains the rolled value', () =>
    {
      // buckets: 'a' covers [0, 10), 'b' covers [10, 30), 'c' covers [30, 60).
      const map = new Map([ [ 'a', 10 ], [ 'b', 20 ], [ 'c', 30 ] ]);
      const prevRandom = sandbox.Math.random;

      // Math.random() * 60 === 5 -> falls in 'a' bucket.
      sandbox.Math.random = () => 5 / 60;
      expect(sandbox.RPGManager.weightedMapChoice(map, 60)).toBe('a');

      // Math.random() * 60 === 15 -> falls in 'b' bucket.
      sandbox.Math.random = () => 15 / 60;
      expect(sandbox.RPGManager.weightedMapChoice(map, 60)).toBe('b');

      // Math.random() * 60 === 45 -> falls in 'c' bucket.
      sandbox.Math.random = () => 45 / 60;
      expect(sandbox.RPGManager.weightedMapChoice(map, 60)).toBe('c');

      sandbox.Math.random = prevRandom;
    });

    it('skips entries with zero or negative weight', () =>
    {
      const map = new Map([ [ 'a', 0 ], [ 'b', -5 ], [ 'c', 10 ] ]);
      const prevRandom = sandbox.Math.random;

      // regardless of roll, only 'c' has any positive weight to land in.
      sandbox.Math.random = () => 0.5;
      expect(sandbox.RPGManager.weightedMapChoice(map, 10)).toBe('c');

      sandbox.Math.random = prevRandom;
    });

    it('returns null if the roll overshoots every bucket', () =>
    {
      // totalWeight overstates the map's actual weight sum, leaving a gap the roll can land in.
      const map = new Map([ [ 'a', 10 ] ]);
      const prevRandom = sandbox.Math.random;

      sandbox.Math.random = () => 0.99;
      expect(sandbox.RPGManager.weightedMapChoice(map, 100)).toBeNull();

      sandbox.Math.random = prevRandom;
    });
  });

  describe('resolveHitTypeString', () =>
  {
    it('returns null for falsy input', () =>
    {
      expect(sandbox.RPGManager.resolveHitTypeString(undefined)).toBeNull();
      expect(sandbox.RPGManager.resolveHitTypeString('')).toBeNull();
    });

    it('returns null for an unrecognized string', () =>
    {
      expect(sandbox.RPGManager.resolveHitTypeString('nonsense')).toBeNull();
    });

    it('maps known hit type strings case-insensitively to their Game_Action constants', () =>
    {
      expect(sandbox.RPGManager.resolveHitTypeString('physical')).toBe(sandbox.Game_Action.HITTYPE_PHYSICAL);
      expect(sandbox.RPGManager.resolveHitTypeString('PHYSICAL')).toBe(sandbox.Game_Action.HITTYPE_PHYSICAL);
      expect(sandbox.RPGManager.resolveHitTypeString('Magical')).toBe(sandbox.Game_Action.HITTYPE_MAGICAL);
      expect(sandbox.RPGManager.resolveHitTypeString('certain')).toBe(sandbox.Game_Action.HITTYPE_CERTAIN);
    });
  });
});
//endregion plugins/_base/rpg-manager.test.js
