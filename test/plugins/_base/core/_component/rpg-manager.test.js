//region plugins/_base/_component/rpg-manager.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJabsOnChanceEffectGlobalStub } from './fixtures/install-jabs-onchance-stub.js';
import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('RPGManager', () =>
{
  let RPGManager;

  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't double-apply J.BASE setup.
    vi.resetModules();

    installJBaseHostGlobals();

    // resolveHitTypeString() reads these off the bare Game_Action global- the shared placeholder has
    // no statics of its own, so give it the real values from project/js/rmmz_objects.js directly.
    globalThis.Game_Action.HITTYPE_CERTAIN = 0;
    globalThis.Game_Action.HITTYPE_PHYSICAL = 1;
    globalThis.Game_Action.HITTYPE_MAGICAL = 2;

    // getOnChanceEffectsFromDatabaseObject() instantiates JABS_OnChanceEffect, which lives in JABS, not J-Base.
    installJabsOnChanceEffectGlobalStub(globalThis);

    // real production code- sets up globalThis.J, J.BASE.Aliased maps, and the String.empty/Array.empty
    // sentinel augmentations relied on elsewhere in this codebase.
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // the file under test- a pure class with real imports, no prototype patching involved.
    ({ default: RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    RPGManager.clearCache();
    globalThis.$gameVariables._data = [];
  });

  describe('caching', () =>
  {
    it('returns the freshly parsed value on the first read (cache miss)', () =>
    {
      // Arrange
      const data = { note: '<k:1>' };
      const re = /<k:(\d+)>/;

      // Act
      const result = RPGManager.getNumberFromNoteByRegex(data, re);

      // Assert
      expect(result).toBe(1);
    });

    it('returns the stale cached value after the note changes, before invalidate is called (cache hit)', () =>
    {
      // Arrange
      const data = { note: '<k:1>' };
      const re = /<k:(\d+)>/;
      RPGManager.getNumberFromNoteByRegex(data, re);
      data.note = '<k:99>';

      // Act
      const result = RPGManager.getNumberFromNoteByRegex(data, re);

      // Assert
      expect(result).toBe(1);
    });

    it('returns the freshly parsed value once invalidate() clears this object\'s cache entry', () =>
    {
      // Arrange
      const data = { note: '<k:1>' };
      const re = /<k:(\d+)>/;
      RPGManager.getNumberFromNoteByRegex(data, re);
      data.note = '<k:99>';
      RPGManager.invalidate(data);

      // Act
      const result = RPGManager.getNumberFromNoteByRegex(data, re);

      // Assert
      expect(result).toBe(99);
    });

    it('clearCache() drops every entry so the next read recomputes for every object', () =>
    {
      // Arrange
      const a = { note: '<k:2>' };
      const b = { note: '<k:3>' };
      const re = /<k:(\d+)>/;
      RPGManager.getNumberFromNoteByRegex(a, re);
      RPGManager.getNumberFromNoteByRegex(b, re);
      a.note = '<k:20>';
      b.note = '<k:30>';

      // Act
      RPGManager.clearCache();

      // Assert
      expect(RPGManager.getNumberFromNoteByRegex(a, re)).toBe(20);
      expect(RPGManager.getNumberFromNoteByRegex(b, re)).toBe(30);
    });
  });

  describe('getStringFromNoteByRegex', () =>
  {
    it('keeps the last match when multiple lines match', () =>
    {
      // Arrange
      const data = { note: '<id:a>\n<id:b>' };
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringFromNoteByRegex(data, re);

      // Assert
      expect(result).toBe('b');
    });

    it('returns String.empty when missing and nullIfEmpty is false', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringFromNoteByRegex(data, re, false);

      // Assert
      expect(result).toBe('');
    });

    it('returns null when missing and nullIfEmpty is true', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringFromNoteByRegex(data, re, true);

      // Assert
      expect(result).toBe(null);
    });

    it('returns null when the note is parsable but nothing matches and nullIfEmpty is true', () =>
    {
      // Arrange- a non-empty note that has no matching tag reaches the post-scan null check
      // rather than short-circuiting on the earlier #canParsedatabaseData guard.
      const data = { note: 'no matching tags here' };
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringFromNoteByRegex(data, re, true);

      // Assert
      expect(result).toBe(null);
    });

    it('returns String.empty when the note is parsable but nothing matches and nullIfEmpty is false', () =>
    {
      // Arrange- reaches the post-scan check (distinct from the earlier guard-level check).
      const data = { note: 'no matching tags here' };
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringFromNoteByRegex(data, re, false);

      // Assert
      expect(result).toBe('');
    });

    it('returns null for a null databaseData when nullIfEmpty is true', () =>
    {
      // Arrange
      const data = null;
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringFromNoteByRegex(data, re, true);

      // Assert
      expect(result).toBe(null);
    });

    it('returns null for a databaseData with no note property when nullIfEmpty is true', () =>
    {
      // Arrange
      const data = {};
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringFromNoteByRegex(data, re, true);

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('getStringsFromNoteByRegex', () =>
  {
    it('collects every matching line', () =>
    {
      // Arrange
      const data = { note: '<id:a>\n<id:b>' };
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringsFromNoteByRegex(data, re);

      // Assert
      expect(result).toEqual([ 'a', 'b' ]);
    });

    it('returns an empty array when missing and nullIfEmpty is false', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringsFromNoteByRegex(data, re, false);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns null when missing and nullIfEmpty is true', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<id:(\w+)>/;

      // Act
      const result = RPGManager.getStringsFromNoteByRegex(data, re, true);

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('getStringsFromAllNotesByRegex', () =>
  {
    it('concatenates matching strings across multiple database rows', () =>
    {
      // Arrange
      const re = /<id:(\w+)>/;
      const rows = [
        { note: '<id:a>' },
        { note: '<id:b>\n<id:c>' },
      ];

      // Act
      const result = RPGManager.getStringsFromAllNotesByRegex(rows, re, false);

      // Assert
      expect(result).toEqual([ 'a', 'b', 'c' ]);
    });

    it('returns an empty array when nothing matches and nullIfEmpty is false', () =>
    {
      // Arrange
      const re = /<id:(\w+)>/;
      const rows = [ { note: 'no tags here' } ];

      // Act
      const result = RPGManager.getStringsFromAllNotesByRegex(rows, re, false);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns null instead of an empty array when nothing matches and nullIfEmpty is true', () =>
    {
      // Arrange
      const re = /<id:(\w+)>/;
      const rows = [ { note: 'no tags here' } ];

      // Act
      const result = RPGManager.getStringsFromAllNotesByRegex(rows, re, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getNumberFromNoteByRegex', () =>
  {
    it('uses the last match and parses decimals', () =>
    {
      // Arrange
      const data = { note: '<n:1>\n<n:2.5>' };
      const re = /<n:([\d.]+)>/;

      // Act
      const result = RPGManager.getNumberFromNoteByRegex(data, re);

      // Assert
      expect(result).toBe(2.5);
    });
  });

  describe('getSumFromAllNotesByRegex', () =>
  {
    it('sums the last value from each database object', () =>
    {
      // Arrange
      const re = /<n:(\d+)>/;
      const rows = [
        { note: '<n:4>' },
        { note: '<n:5>' },
      ];

      // Act
      const result = RPGManager.getSumFromAllNotesByRegex(rows, re);

      // Assert
      expect(result).toBe(9);
    });

    it('returns 0 for an empty collection when nullIfEmpty is false', () =>
    {
      // Arrange
      const re = /<n:(\d+)>/;

      // Act
      const result = RPGManager.getSumFromAllNotesByRegex([], re, false);

      // Assert
      expect(result).toBe(0);
    });

    it('returns null for an empty collection when nullIfEmpty is true', () =>
    {
      // Arrange
      const re = /<n:(\d+)>/;

      // Act
      const result = RPGManager.getSumFromAllNotesByRegex([], re, true);

      // Assert
      expect(result).toBe(null);
    });

    it('returns null when every row sums to zero and nullIfEmpty is true', () =>
    {
      // Arrange
      const re = /<n:(\d+)>/;
      const rows = [ { note: '' }, { note: '' } ];

      // Act
      const result = RPGManager.getSumFromAllNotesByRegex(rows, re, true);

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('getNumbersFromNoteByRegex', () =>
  {
    it('parses a bracketed list from the capture group', () =>
    {
      // Arrange
      const data = { note: '<nums:[1,2,3]>' };
      const re = /<nums:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getNumbersFromNoteByRegex(data, re);

      // Assert
      expect(result).toEqual([ 1, 2, 3 ]);
    });

    it('returns Array.empty when the note fails the parsability guard and nullIfEmpty is false', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<nums:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getNumbersFromNoteByRegex(data, re, false);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns null when the note fails the parsability guard and nullIfEmpty is true', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<nums:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getNumbersFromNoteByRegex(data, re, true);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when the note is parsable but nothing matches and nullIfEmpty is true', () =>
    {
      // Arrange- a non-empty note that has no matching tag reaches the post-scan empty check.
      const data = { note: 'no matching tags here' };
      const re = /<nums:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getNumbersFromNoteByRegex(data, re, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getResultFromNoteByRegex', () =>
  {
    it('evaluates the formula against the base param and sums multiple lines', () =>
    {
      // Arrange
      const data = { note: '<f:b+1>\n<f:b*2>' };
      const re = /<f:([^>]+)>/;

      // Act
      const result = RPGManager.getResultFromNoteByRegex(data, re, 10, null, false);

      // Assert
      expect(result).toBe(31);
    });

    it('exposes "a" from the context and "v" from $gameVariables._data', () =>
    {
      // Arrange
      globalThis.$gameVariables._data[5] = 7;
      const data = { note: '<f:a.level + v[5]>' };
      const re = /<f:([^>]+)>/;
      const ctx = { level: 3, getLevel() { return this.level; } };

      // Act
      const result = RPGManager.getResultFromNoteByRegex(data, re, 0, ctx, false);

      // Assert
      expect(result).toBe(10);
    });

    it('keeps the cached result after the context\'s level changes without invalidation (caching-is-correct)', () =>
    {
      // Arrange
      const data = { note: '<f:15 + (a.level * 4)>' };
      const re = /<f:([^>]+)>/;
      const ctx = { level: 1, getLevel() { return this.level; } };
      RPGManager.getResultFromNoteByRegex(data, re, 0, ctx, false);
      ctx.level = 2;

      // Act
      const result = RPGManager.getResultFromNoteByRegex(data, re, 0, ctx, false);

      // Assert
      expect(result).toBe(19);
    });

    it('re-evaluates the formula once invalidateBattlerEval() drops the context\'s cache entry', () =>
    {
      // Arrange
      const data = { note: '<f:15 + (a.level * 4)>' };
      const re = /<f:([^>]+)>/;
      const ctx = { level: 1, getLevel() { return this.level; } };
      RPGManager.getResultFromNoteByRegex(data, re, 0, ctx, false);
      ctx.level = 2;
      RPGManager.invalidateBattlerEval(ctx);

      // Act
      const result = RPGManager.getResultFromNoteByRegex(data, re, 0, ctx, false);

      // Assert
      expect(result).toBe(23);
    });

    it('keeps two different battler contexts on the same object independent of each other', () =>
    {
      // Arrange
      const data = { note: '<f:a.atk * 0.5>' };
      const re = /<f:([^>]+)>/;
      const battlerA = { atk: 200, getLevel: () => 10 };
      const battlerB = { atk: 40, getLevel: () => 10 };

      // Act
      const resultA = RPGManager.getResultFromNoteByRegex(data, re, 0, battlerA, false);
      const resultB = RPGManager.getResultFromNoteByRegex(data, re, 0, battlerB, false);

      // Assert
      expect(resultA).toBe(100);
      expect(resultB).toBe(20);
    });

    it('swallows a bad formula, logs it, and still returns a finite sum', () =>
    {
      // Arrange
      const err = vi.spyOn(globalThis.console, 'error').mockImplementation(() => {});
      const data = { note: '<f:not_a_js_expr_@@@>' };
      const re = /<f:([^>]+)>/;

      // Act
      const result = RPGManager.getResultFromNoteByRegex(data, re, 0, null, false);

      // Assert
      expect(result).toBe(0);
      err.mockRestore();
    });

    it('returns null when the note fails the parsability guard and nullIfEmpty is true', () =>
    {
      // Arrange- an empty note fails #canParsedatabaseData, short-circuiting before any scan.
      const data = { note: '' };
      const re = /<f:([^>]+)>/;

      // Act
      const result = RPGManager.getResultFromNoteByRegex(data, re, 0, null, true);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null instead of 0 when nothing was found and nullIfEmpty is true', () =>
    {
      // Arrange
      const data = { note: 'no matching tags here' };
      const re = /<f:([^>]+)>/;

      // Act
      const result = RPGManager.getResultFromNoteByRegex(data, re, 0, null, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getResultsFromAllNotesByRegex', () =>
  {
    it('aggregates the evaluated result across multiple database objects', () =>
    {
      // Arrange
      const re = /<f:([^>]+)>/;
      const rows = [
        { note: '<f:b>' },
        { note: '<f:b+2>' },
      ];

      // Act
      const result = RPGManager.getResultsFromAllNotesByRegex(rows, re, 5, null, false);

      // Assert
      expect(result).toBe(12);
    });

    it('returns null instead of 0 when nothing was found across any object and nullIfEmpty is true', () =>
    {
      // Arrange
      const re = /<f:([^>]+)>/;
      const rows = [ { note: 'no tags' }, { note: 'still no tags' } ];

      // Act
      const result = RPGManager.getResultsFromAllNotesByRegex(rows, re, 0, null, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('checkForBooleanFromNoteByRegex', () =>
  {
    it('returns true when the tag is present', () =>
    {
      // Arrange
      const data = { note: '<hidden>' };
      const re = /<hidden>/;

      // Act
      const result = RPGManager.checkForBooleanFromNoteByRegex(data, re, false);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the tag is absent and nullIfEmpty is false', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<hidden>/;

      // Act
      const result = RPGManager.checkForBooleanFromNoteByRegex(data, re, false);

      // Assert
      expect(result).toBe(false);
    });

    it('returns null when the tag is absent and nullIfEmpty is true', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<hidden>/;

      // Act
      const result = RPGManager.checkForBooleanFromNoteByRegex(data, re, true);

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('checkForBooleanFromAllNotesByRegex', () =>
  {
    it('returns false when the tag is absent from every object', () =>
    {
      // Arrange
      const re = /<tag>/;
      const a = { note: '' };

      // Act
      const result = RPGManager.checkForBooleanFromAllNotesByRegex([ a, a ], re, false);

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when at least one object has the tag (OR semantics)', () =>
    {
      // Arrange
      const re = /<tag>/;
      const a = { note: '' };
      const b = { note: '<tag>' };

      // Act
      const result = RPGManager.checkForBooleanFromAllNotesByRegex([ a, b ], re, false);

      // Assert
      expect(result).toBe(true);
    });

    it('returns null when no object has the tag and nullIfEmpty is true', () =>
    {
      // Arrange
      const re = /<tag>/;

      // Act
      const result = RPGManager.checkForBooleanFromAllNotesByRegex([ { note: '' } ], re, true);

      // Assert
      expect(result).toBe(null);
    });
  });

  describe('getArrayFromNotesByRegex', () =>
  {
    it('parses one bracketed capture with tryParse enabled', () =>
    {
      // Arrange
      const data = { note: '<arr:[10,20]>' };
      const re = /<arr:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArrayFromNotesByRegex(data, re, true, false);

      // Assert
      expect(result).toEqual([ 10, 20 ]);
    });

    it('skips the second per-element parse pass when tryParse is false', () =>
    {
      // Arrange- the capture is already parsed once unconditionally during the scan; tryParse
      // only controls whether each element then gets re-parsed via a .map() pass.
      const data = { note: '<arr:[10,20]>' };
      const re = /<arr:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArrayFromNotesByRegex(data, re, false, false);

      // Assert
      expect(result).toEqual([ 10, 20 ]);
    });

    it('returns an empty array when nothing matches and nullIfEmpty is false', () =>
    {
      // Arrange
      const data = { note: 'no matching tags here' };
      const re = /<arr:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArrayFromNotesByRegex(data, re, true, false);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns null when nothing matches and nullIfEmpty is true', () =>
    {
      // Arrange
      const data = { note: 'no matching tags here' };
      const re = /<arr:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArrayFromNotesByRegex(data, re, true, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getArraysFromNotesByRegex', () =>
  {
    it('collects one array per matching line', () =>
    {
      // Arrange
      const data = { note: '<a:[1]>\n<a:[2,3]>' };
      const re = /<a:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArraysFromNotesByRegex(data, re, true, false);

      // Assert
      expect(result).toEqual([ [ 1 ], [ 2, 3 ] ]);
    });

    it('skips the per-element parse pass when tryParse is false', () =>
    {
      // Arrange
      const data = { note: '<a:[1]>' };
      const re = /<a:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArraysFromNotesByRegex(data, re, false, false);

      // Assert- the capture group is still returned, just as a raw string rather than a parsed array.
      expect(result).toEqual([ '[1]' ]);
    });

    it('returns an empty array when nothing matches and nullIfEmpty is false', () =>
    {
      // Arrange
      const data = { note: 'no matching tags here' };
      const re = /<a:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArraysFromNotesByRegex(data, re, true, false);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns null when nothing matches and nullIfEmpty is true', () =>
    {
      // Arrange
      const data = { note: 'no matching tags here' };
      const re = /<a:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArraysFromNotesByRegex(data, re, true, true);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when the note fails the parsability guard and nullIfEmpty is true', () =>
    {
      // Arrange- an empty note fails #canParsedatabaseData, short-circuiting before any scan.
      const data = { note: '' };
      const re = /<a:(\[[^\]]+\])>/;

      // Act
      const result = RPGManager.getArraysFromNotesByRegex(data, re, true, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getArraysFromAllNotesByRegex', () =>
  {
    it('concatenates parsed arrays across multiple database rows', () =>
    {
      // Arrange
      const re = /<c:[ ]?(\[[^\]]+])>/;
      const rows = [
        { note: '<c:[1, 2]>' },
        { note: '<c:[3, 4]>' },
      ];

      // Act
      const result = RPGManager.getArraysFromAllNotesByRegex(rows, re, true, false);

      // Assert
      expect(result).toEqual([ [ 1, 2 ], [ 3, 4 ] ]);
    });

    it('returns an empty array when nothing matches and nullIfEmpty is false', () =>
    {
      // Arrange
      const re = /<c:[ ]?(\[[^\]]+])>/;
      const rows = [ { note: 'no tags here' } ];

      // Act
      const result = RPGManager.getArraysFromAllNotesByRegex(rows, re, true, false);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns null instead of an empty array when nothing matches and nullIfEmpty is true', () =>
    {
      // Arrange
      const re = /<c:[ ]?(\[[^\]]+])>/;
      const rows = [ { note: 'no tags here' } ];

      // Act
      const result = RPGManager.getArraysFromAllNotesByRegex(rows, re, true, true);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getOnChanceEffectsFromDatabaseObject', () =>
  {
    it('maps a parsed bracket pair to a stub JABS_OnChanceEffect instance', () =>
    {
      // Arrange
      const data = { note: '<jeOC:[7, 55]>' };
      const re = /<jeOC:(\[[0-9]+,\s*[0-9]+\])>/;

      // Act
      const list = RPGManager.getOnChanceEffectsFromDatabaseObject(data, re);

      // Assert
      expect(list.length).toBe(1);
      expect(list[0].skillId).toBe(7);
      expect(list[0].chance).toBe(55);

      // the key is derived from the tag name inside the regex itself, so that every effect built
      // from one structure shares an identity the cooldown bookkeeping can group by.
      expect(list[0].key).toBe('jeOC');
    });

    it('returns an empty array when the note has no matches', () =>
    {
      // Arrange
      const data = { note: '' };
      const re = /<jeOC:(\[[0-9]+,\s*[0-9]+\])>/;

      // Act
      const list = RPGManager.getOnChanceEffectsFromDatabaseObject(data, re);

      // Assert
      expect(list).toEqual([]);
    });

    it('defaults chance to 100 when the capture array omits it', () =>
    {
      // Arrange
      const data = { note: '<jeOC:[7]>' };
      const re = /<jeOC:(\[[0-9]+\])>/;

      // Act
      const list = RPGManager.getOnChanceEffectsFromDatabaseObject(data, re);

      // Assert
      expect(list[0].chance).toBe(100);
    });
  });

  describe('getOnChanceEffectsFromDatabaseObjects', () =>
  {
    it('flattens the on-chance effects found across multiple objects', () =>
    {
      // Arrange
      const re = /<jeOC:(\[[0-9]+,\s*[0-9]+\])>/;
      const rows = [
        { note: '<jeOC:[1, 10]>' },
        { note: '<jeOC:[2, 20]>' },
      ];

      // Act
      const list = RPGManager.getOnChanceEffectsFromDatabaseObjects(rows, re);

      // Assert
      expect(list.map(e => e.skillId)).toEqual([ 1, 2 ]);
    });
  });

  describe('fateOf100', () =>
  {
    it('always succeeds when the positive roller is very lucky, bypassing the roll', () =>
    {
      // Arrange
      const roller = { isVeryLucky: () => true, isVeryCursed: () => false };

      // Act
      const result = RPGManager.fateOf100(roller, 1);

      // Assert
      expect(result).toBe(true);
    });

    it('always fails when the positive roller is very cursed, bypassing the roll', () =>
    {
      // Arrange
      const roller = { isVeryLucky: () => false, isVeryCursed: () => true };

      // Act
      const result = RPGManager.fateOf100(roller, 100);

      // Assert
      expect(result).toBe(false);
    });

    it('rolls normally via chanceIn100 when neither fate-override flag is set', () =>
    {
      // Arrange
      const roller = { isVeryLucky: () => false, isVeryCursed: () => false };

      // Act
      const result = RPGManager.fateOf100(roller, 100);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('countSuccessesIn100', () =>
  {
    it('returns 0 without rolling when percentOfSuccess is 0', () =>
    {
      // Arrange & Act
      const result = RPGManager.countSuccessesIn100(0, 5);

      // Assert
      expect(result).toBe(0);
    });

    it('counts every attempted roll unconditionally, not stopping at the first success', () =>
    {
      // Arrange- 100% success means every one of the 3 attempts lands.
      // Act
      const result = RPGManager.countSuccessesIn100(100, 3);

      // Assert
      expect(result).toBe(3);
    });

    it('counts 0 successes when every roll misses the threshold', () =>
    {
      // Arrange
      const prev = globalThis.Math.randomInt;
      globalThis.Math.randomInt = () => 99;

      // Act
      const result = RPGManager.countSuccessesIn100(1, 3);

      // Assert
      expect(result).toBe(0);
      globalThis.Math.randomInt = prev;
    });
  });

  describe('chanceIn100', () =>
  {
    it('returns false when percentOfSuccess is 0', () =>
    {
      // Arrange
      const percentOfSuccess = 0;

      // Act
      const result = RPGManager.chanceIn100(percentOfSuccess);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when percentOfSuccess is negative', () =>
    {
      // Arrange
      const percentOfSuccess = -5;

      // Act
      const result = RPGManager.chanceIn100(percentOfSuccess);

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when the positive roll lands within the success threshold', () =>
    {
      // Arrange
      const prev = globalThis.Math.randomInt;
      globalThis.Math.randomInt = () => 40;

      // Act
      const result = RPGManager.chanceIn100(50, 1, 0);

      // Assert
      expect(result).toBe(true);
      globalThis.Math.randomInt = prev;
    });

    it('returns false when the positive roll lands outside the success threshold', () =>
    {
      // Arrange
      const prev = globalThis.Math.randomInt;
      globalThis.Math.randomInt = () => 60;

      // Act
      const result = RPGManager.chanceIn100(50, 1, 0);

      // Assert
      expect(result).toBe(false);
      globalThis.Math.randomInt = prev;
    });

    it('a failing negative reroll undoes an earlier positive success', () =>
    {
      // Arrange
      const prev = globalThis.Math.randomInt;
      let n = 0;
      globalThis.Math.randomInt = () =>
      {
        n++;
        return n === 1 ? 10 : 80;
      };

      // Act
      const result = RPGManager.chanceIn100(50, 1, 1);

      // Assert
      expect(result).toBe(false);
      globalThis.Math.randomInt = prev;
    });

    it('keeps success when every negative reroll also lands within the threshold', () =>
    {
      // Arrange- 100% success means both the positive roll and every negative reroll succeed.
      const prev = globalThis.Math.randomInt;
      globalThis.Math.randomInt = () => 0;

      // Act
      const result = RPGManager.chanceIn100(100, 1, 1);

      // Assert
      expect(result).toBe(true);
      globalThis.Math.randomInt = prev;
    });
  });

  describe('global RegExp flag regression', () =>
  {
    it('does not leak lastIndex across note lines when the input regex uses the /g flag', () =>
    {
      // Arrange
      const data = { note: '<g:1>\n<g:2>\n<g:3>' };
      const re = /<g:(\d+)>/g;

      // Act
      const result = RPGManager.getStringsFromNoteByRegex(data, re);

      // Assert
      expect(result).toEqual([ '1', '2', '3' ]);
    });
  });

  describe('weightedMapChoice', () =>
  {
    it('returns null when totalWeight is zero', () =>
    {
      // Arrange
      const map = new Map([ [ 'a', 1 ] ]);

      // Act
      const result = RPGManager.weightedMapChoice(map, 0);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when totalWeight is negative', () =>
    {
      // Arrange
      const map = new Map([ [ 'a', 1 ] ]);

      // Act
      const result = RPGManager.weightedMapChoice(map, -5);

      // Assert
      expect(result).toBeNull();
    });

    it('picks the first bucket when the roll lands in its range', () =>
    {
      // Arrange- buckets: 'a' covers [0, 10), 'b' covers [10, 30), 'c' covers [30, 60).
      const map = new Map([ [ 'a', 10 ], [ 'b', 20 ], [ 'c', 30 ] ]);
      const prevRandom = globalThis.Math.random;
      globalThis.Math.random = () => 5 / 60;

      // Act
      const result = RPGManager.weightedMapChoice(map, 60);

      // Assert
      expect(result).toBe('a');
      globalThis.Math.random = prevRandom;
    });

    it('picks a middle bucket when the roll lands in its range', () =>
    {
      // Arrange
      const map = new Map([ [ 'a', 10 ], [ 'b', 20 ], [ 'c', 30 ] ]);
      const prevRandom = globalThis.Math.random;
      globalThis.Math.random = () => 15 / 60;

      // Act
      const result = RPGManager.weightedMapChoice(map, 60);

      // Assert
      expect(result).toBe('b');
      globalThis.Math.random = prevRandom;
    });

    it('picks the last bucket when the roll lands in its range', () =>
    {
      // Arrange
      const map = new Map([ [ 'a', 10 ], [ 'b', 20 ], [ 'c', 30 ] ]);
      const prevRandom = globalThis.Math.random;
      globalThis.Math.random = () => 45 / 60;

      // Act
      const result = RPGManager.weightedMapChoice(map, 60);

      // Assert
      expect(result).toBe('c');
      globalThis.Math.random = prevRandom;
    });

    it('skips entries with zero or negative weight', () =>
    {
      // Arrange
      const map = new Map([ [ 'a', 0 ], [ 'b', -5 ], [ 'c', 10 ] ]);
      const prevRandom = globalThis.Math.random;
      globalThis.Math.random = () => 0.5;

      // Act
      const result = RPGManager.weightedMapChoice(map, 10);

      // Assert- regardless of the roll, only 'c' has any positive weight to land in.
      expect(result).toBe('c');
      globalThis.Math.random = prevRandom;
    });

    it('returns null when the roll overshoots every bucket', () =>
    {
      // Arrange- totalWeight overstates the map's actual weight sum, leaving a gap the roll can land in.
      const map = new Map([ [ 'a', 10 ] ]);
      const prevRandom = globalThis.Math.random;
      globalThis.Math.random = () => 0.99;

      // Act
      const result = RPGManager.weightedMapChoice(map, 100);

      // Assert
      expect(result).toBeNull();
      globalThis.Math.random = prevRandom;
    });
  });

  describe('resolveHitTypeString', () =>
  {
    it('returns null for undefined input', () =>
    {
      // Arrange
      const input = undefined;

      // Act
      const result = RPGManager.resolveHitTypeString(input);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null for an empty string', () =>
    {
      // Arrange
      const input = '';

      // Act
      const result = RPGManager.resolveHitTypeString(input);

      // Assert
      expect(result).toBeNull();
    });

    it('returns null for an unrecognized string', () =>
    {
      // Arrange
      const input = 'nonsense';

      // Act
      const result = RPGManager.resolveHitTypeString(input);

      // Assert
      expect(result).toBeNull();
    });

    it('maps "physical" to Game_Action.HITTYPE_PHYSICAL', () =>
    {
      // Arrange
      const input = 'physical';

      // Act
      const result = RPGManager.resolveHitTypeString(input);

      // Assert
      expect(result).toBe(1);
    });

    it('maps "PHYSICAL" to Game_Action.HITTYPE_PHYSICAL, case-insensitively', () =>
    {
      // Arrange
      const input = 'PHYSICAL';

      // Act
      const result = RPGManager.resolveHitTypeString(input);

      // Assert
      expect(result).toBe(1);
    });

    it('maps "Magical" to Game_Action.HITTYPE_MAGICAL, case-insensitively', () =>
    {
      // Arrange
      const input = 'Magical';

      // Act
      const result = RPGManager.resolveHitTypeString(input);

      // Assert
      expect(result).toBe(2);
    });

    it('maps "certain" to Game_Action.HITTYPE_CERTAIN', () =>
    {
      // Arrange
      const input = 'certain';

      // Act
      const result = RPGManager.resolveHitTypeString(input);

      // Assert
      expect(result).toBe(0);
    });
  });

  //region rolling with fate on the scale
  describe('countSuccessesFateOf100', () =>
  {
    /**
     * Builds a battler with the two fate-override flags set explicitly.
     * @param {boolean} lucky Whether every attempt counts as a success.
     * @param {boolean} cursed Whether no attempt can ever succeed.
     * @returns {object} The roller.
     */
    const buildRoller = (lucky, cursed) => ({
      isVeryLucky: () => lucky,
      isVeryCursed: () => cursed,
    });

    it('counts every attempt as a success under an absolute blessing', () =>
    {
      // Arrange
      const roller = buildRoller(true, false);

      // Act
      const successes = RPGManager.countSuccessesFateOf100(roller, 1, 5);

      // Assert- a 1% chance still lands all five, which is what "absolute" means here.
      expect(successes).toBe(5);
    });

    it('counts nothing as a success under an absolute curse', () =>
    {
      // Arrange
      const roller = buildRoller(false, true);

      // Act
      const successes = RPGManager.countSuccessesFateOf100(roller, 100, 5);

      // Assert- and a guaranteed chance still lands none.
      expect(successes).toBe(0);
    });

    it('rolls normally when neither fate flag is set', () =>
    {
      // Arrange
      const roller = buildRoller(false, false);

      // Act
      const successes = RPGManager.countSuccessesFateOf100(roller, 100, 3);

      // Assert
      expect(successes).toBe(3);
    });
  });

  describe('resolveProcCount', () =>
  {
    /**
     * Builds a battler with every knob this resolution reads.
     * @param {object} overrides Which knobs to change.
     * @returns {object} The roller.
     */
    const buildRoller = (overrides = {}) => ({
      isVeryLucky: () => false,
      isVeryCursed: () => false,
      isAccumulating: () => false,
      getEncoreRepeats: () => 0,
      ...overrides,
    });

    it('resolves an ordinary success to exactly one execution', () =>
    {
      // Arrange
      const roller = buildRoller();

      // Act
      const count = RPGManager.resolveProcCount(roller, 100, 1, 0);

      // Assert
      expect(count).toBe(1);
    });

    it('resolves an ordinary failure to none', () =>
    {
      // Arrange
      const roller = buildRoller();

      // Act
      const count = RPGManager.resolveProcCount(roller, 0, 1, 0);

      // Assert
      expect(count).toBe(0);
    });

    it('counts every roll under Accumulate Mode instead of stopping at the first success', () =>
    {
      // Arrange- accumulating turns a proc from "did it happen" into "how many times", which is the
      // whole reason this entry point exists separately from `fateOf100`.
      const roller = buildRoller({ isAccumulating: () => true });

      // Act
      const count = RPGManager.resolveProcCount(roller, 100, 4, 0);

      // Assert
      expect(count).toBe(4);
    });

    it('echoes each success by the roller\'s encore repeats', () =>
    {
      // Arrange- one success, echoing twice more, is three executions.
      const roller = buildRoller({ getEncoreRepeats: () => 2 });

      // Act
      const count = RPGManager.resolveProcCount(roller, 100, 1, 0);

      // Assert
      expect(count).toBe(3);
    });

    it('multiplies accumulated successes by the encore repeats rather than adding to them', () =>
    {
      // Arrange- two accumulated successes each echoing once more is four, not three.
      const roller = buildRoller({
        isAccumulating: () => true,
        getEncoreRepeats: () => 1,
      });

      // Act
      const count = RPGManager.resolveProcCount(roller, 100, 2, 0);

      // Assert
      expect(count).toBe(4);
    });

    it('echoes nothing when nothing succeeded in the first place', () =>
    {
      // Arrange
      const roller = buildRoller({ getEncoreRepeats: () => 5 });

      // Act
      const count = RPGManager.resolveProcCount(roller, 0, 1, 0);

      // Assert
      expect(count).toBe(0);
    });
  });
  //endregion rolling with fate on the scale

  //region opting into null instead of a sentinel
  //
  // Every note reader defaults to a typed sentinel and lets a caller opt into null, because null
  // carries "the tag is absent" while 0 and [] cannot be told apart from a tag that says zero or
  // nothing. Callers that opt in immediately coalesce into a plugin-parameter default; the ones that
  // do not want the sentinel. Both halves of each pair therefore matter.
  describe('nullIfEmpty across the note readers', () =>
  {
    /**
     * Builds a database row carrying a note that matches nothing this suite looks for.
     * @returns {object} The row.
     */
    const emptyRow = () => ({ note: '<someUnrelatedTag>' });

    it('answers null rather than zero for an absent numeric tag', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getNumberFromNoteByRegex(emptyRow(), /<missingTag:[ ]?(\d+)>/i, true)).toBeNull();
    });

    it('answers zero for an absent numeric tag by default', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getNumberFromNoteByRegex(emptyRow(), /<missingTag:[ ]?(\d+)>/i)).toBe(0);
    });

    it('answers null rather than an empty array for an absent array tag', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getArrayFromNotesByRegex(emptyRow(), /<missingTag:[ ]?(\[.*])>/i, true, true)).toBeNull();
    });

    it('answers null for an array tag read off something that cannot be parsed at all', () =>
    {
      // Arrange- a row with no note reaches these readers during boot, before the database is
      // hydrated.
      // Act & Assert
      expect(RPGManager.getArrayFromNotesByRegex(null, /<missingTag:[ ]?(\[.*])>/i, true, true)).toBeNull();
    });

    it('answers an empty array for an unparseable row by default', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getArrayFromNotesByRegex(null, /<missingTag:[ ]?(\[.*])>/i)).toEqual([]);
    });

    it('answers null rather than zero for a formula tag on an unparseable row', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getResultFromNoteByRegex(null, /<missingTag:\[(.*)]>/i, 0, null, true)).toBeNull();
    });

    it('answers zero for a formula tag on an unparseable row by default', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getResultFromNoteByRegex(null, /<missingTag:\[(.*)]>/i, 0)).toBe(0);
    });

    it('answers null rather than zero when handed no rows to sum formulas across', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getResultsFromAllNotesByRegex([], /<missingTag:\[(.*)]>/i, 0, null, true)).toBeNull();
    });

    it('answers zero when handed no rows to sum formulas across by default', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getResultsFromAllNotesByRegex([], /<missingTag:\[(.*)]>/i)).toBe(0);
    });

    it('answers null rather than false for an absent boolean marker', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.checkForBooleanFromNoteByRegex(emptyRow(), /<missingMarker>/i, true)).toBeNull();
    });

    it('answers false for an absent boolean marker by default', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.checkForBooleanFromNoteByRegex(emptyRow(), /<missingMarker>/i)).toBe(false);
    });

    it('answers null rather than an empty list for absent strings across every row', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getStringsFromAllNotesByRegex([ emptyRow() ], /<missingTag:[ ]?(.*)>/i, true)).toBeNull();
    });

    it('answers null rather than an empty list for an absent multi-string tag on one row', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getStringsFromNoteByRegex(emptyRow(), /<missingTag:[ ]?(.*)>/i, true)).toBeNull();
    });

    it('answers null rather than an empty list for an absent numeric array tag', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getNumbersFromNoteByRegex(emptyRow(), /<missingTag:[ ]?(\[.*])>/i, true)).toBeNull();
    });

    it('answers an empty list for an absent numeric array tag by default', () =>
    {
      // Arrange & Act & Assert
      expect(RPGManager.getNumbersFromNoteByRegex(emptyRow(), /<missingTag:[ ]?(\[.*])>/i)).toEqual([]);
    });
  });
  //endregion opting into null instead of a sentinel
});
//endregion plugins/_base/_component/rpg-manager.test.js
