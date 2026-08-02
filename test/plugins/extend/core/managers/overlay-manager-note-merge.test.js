//region plugins/extend/core/managers/overlay-manager-note-merge.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
} from '../../_component/fixtures/install-extend-host-globals.js';

/**
 * The note merger is the heart of skill extension: it decides, tag by tag, whether an overlay
 * *replaces* what the base skill declared or *adds* to it. CA's database carries 124 `<extend>` tags,
 * so every rule in here is load-bearing for how skills actually behave in play.
 */
describe('OverlayManager note merging (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/extend/core/managers/OverlayManager.js').default} */
  let OverlayManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    // OverlayManager initializes two JCache static fields at class-definition time, so the cache
    // class has to exist as a bare global before the module is evaluated at all.
    ({ default: globalThis.JCache } = await import('../../../../../src/plugins/_base/core/JCache.js'));
    ({ default: globalThis.ArrayHelper } = await import('../../../../../src/plugins/_base/_utilities/ArrayHelper.js'));
    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.TraitResolver } = await import('../../../../../src/plugins/_base/managers/TraitResolver.js'));

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJExtend();
    await import('../../../../../src/plugins/extend/core/_metadata/initialization.js');

    ({ default: OverlayManager } = await import('../../../../../src/plugins/extend/core/managers/OverlayManager.js'));
  });

  describe('_classifyLine', () =>
  {
    it('classifies a colon-bearing tag as a key-value pair', () =>
    {
      // Arrange & Act & Assert
      expect(OverlayManager._classifyLine('<range:5>')).toBe(OverlayManager.LineType.kvp);
    });

    it('classifies a bare bracketed word as a boolean tag', () =>
    {
      // Arrange & Act & Assert- `<direct>` style tags carry meaning by presence alone.
      expect(OverlayManager._classifyLine('<direct>')).toBe(OverlayManager.LineType.boolean);
    });

    it('rejects a line that does not open with an angle bracket', () =>
    {
      // Arrange & Act & Assert
      expect(OverlayManager._classifyLine('range:5>')).toBe(OverlayManager.LineType.unsupported);
    });

    it('rejects a line that does not close with an angle bracket', () =>
    {
      // Arrange & Act & Assert
      expect(OverlayManager._classifyLine('<range:5')).toBe(OverlayManager.LineType.unsupported);
    });

    it('rejects a line carrying more than one opening bracket', () =>
    {
      // Arrange & Act & Assert- nested or run-together tags cannot be keyed reliably, so they are
      // preserved verbatim rather than merged.
      expect(OverlayManager._classifyLine('<a><b>')).toBe(OverlayManager.LineType.unsupported);
    });

    it('rejects a line carrying more than one closing bracket', () =>
    {
      // Arrange & Act & Assert
      expect(OverlayManager._classifyLine('<a>>')).toBe(OverlayManager.LineType.unsupported);
    });
  });

  describe('_parseTag', () =>
  {
    it('extracts a lowercased key from a key-value tag', () =>
    {
      // Arrange & Act
      const parsed = OverlayManager._parseTag('<Range:5>');

      // Assert- keys are case-insensitive so authoring casing never splits a bucket in two.
      expect(parsed).toEqual({ type: OverlayManager.LineType.kvp, key: 'range', line: '<Range:5>' });
    });

    it('splits a key-value tag on the first colon only', () =>
    {
      // Arrange & Act- values legitimately contain colons, such as formula payloads.
      const parsed = OverlayManager._parseTag('<formula:a:b:c>');

      // Assert
      expect(parsed.key).toBe('formula');
    });

    it('trims incidental whitespace out of a key', () =>
    {
      // Arrange & Act
      const parsed = OverlayManager._parseTag('<  range  :5>');

      // Assert
      expect(parsed.key).toBe('range');
    });

    it('uses the whole inner content as the key for a boolean tag', () =>
    {
      // Arrange & Act
      const parsed = OverlayManager._parseTag('<Direct>');

      // Assert
      expect(parsed).toEqual({ type: OverlayManager.LineType.boolean, key: 'direct', line: '<Direct>' });
    });

    it('reports a null key for an unsupported tag', () =>
    {
      // Arrange & Act
      const parsed = OverlayManager._parseTag('<a><b>');

      // Assert- a null key is what keeps it out of the bucketing pass entirely.
      expect(parsed).toEqual({ type: OverlayManager.LineType.unsupported, key: null, line: '<a><b>' });
    });
  });

  describe('_tokenizeNote', () =>
  {
    it('separates bracketed tags from free-form prose', () =>
    {
      // Arrange
      const note = 'some prose\n<range:5>\n<direct>';

      // Act
      const tokens = OverlayManager._tokenizeNote(note);

      // Assert
      expect(tokens.tags).toEqual([ '<range:5>', '<direct>' ]);
      expect(tokens.unsupported).toEqual([ 'some prose' ]);
    });

    it('extracts tags that were written run-together on one line', () =>
    {
      // Arrange- the RMMZ note editor does not enforce one tag per line.
      const note = '<range:5><direct>';

      // Act
      const tokens = OverlayManager._tokenizeNote(note);

      // Assert- both are recovered as tags, and the combined line is not also kept as prose.
      expect(tokens.tags).toEqual([ '<range:5>', '<direct>' ]);
      expect(tokens.unsupported).toEqual([ '<range:5><direct>' ]);
    });

    it('produces empty collections for an empty note', () =>
    {
      // Arrange & Act
      const tokens = OverlayManager._tokenizeNote('');

      // Assert
      expect(tokens.tags).toEqual([]);
      expect(tokens.unsupported).toEqual([]);
    });

    it('discards blank lines rather than treating them as prose', () =>
    {
      // Arrange- notes routinely carry trailing newlines from the editor.
      const note = '<range:5>\n\n\n';

      // Act
      const tokens = OverlayManager._tokenizeNote(note);

      // Assert
      expect(tokens.unsupported).toEqual([]);
    });
  });

  describe('_toKeyBuckets', () =>
  {
    it('groups tags by key while preserving first-seen key order', () =>
    {
      // Arrange- reconstruction replays this order, so it determines the final note layout.
      const tags = [ '<b:1>', '<a:1>', '<b:2>' ];

      // Act
      const buckets = OverlayManager._toKeyBuckets(tags);

      // Assert
      expect(buckets.order).toEqual([ 'b', 'a' ]);
      expect(buckets.map.b).toEqual([ '<b:1>', '<b:2>' ]);
      expect(buckets.map.a).toEqual([ '<a:1>' ]);
    });

    it('drops exact duplicate lines within a key', () =>
    {
      // Arrange
      const tags = [ '<a:1>', '<a:1>' ];

      // Act
      const buckets = OverlayManager._toKeyBuckets(tags);

      // Assert
      expect(buckets.map.a).toEqual([ '<a:1>' ]);
    });

    it('skips unsupported tags entirely', () =>
    {
      // Arrange- those are carried through the unsupported channel instead.
      const tags = [ '<a:1>', '<x><y>' ];

      // Act
      const buckets = OverlayManager._toKeyBuckets(tags);

      // Assert
      expect(buckets.order).toEqual([ 'a' ]);
    });

    it('produces empty buckets for no tags at all', () =>
    {
      // Arrange & Act
      const buckets = OverlayManager._toKeyBuckets([]);

      // Assert
      expect(buckets.order).toEqual([]);
    });
  });

  describe('_mergeBuckets', () =>
  {
    /**
     * Builds a bucket structure from a plain key-to-lines object.
     * @param {Record<string, string[]>} shape The desired buckets.
     * @returns {{order: string[], map: Record<string, string[]>}}
     */
    const buildBuckets = shape => ({ order: Object.keys(shape), map: shape });

    it('replaces base lines with overlay lines for an ordinary key', () =>
    {
      // Arrange- the default rule is "last extension wins" so an upgrade fully supersedes the base.
      const oldBuckets = buildBuckets({ range: [ '<range:1>' ] });
      const newBuckets = buildBuckets({ range: [ '<range:5>' ] });

      // Act
      const merged = OverlayManager._mergeBuckets(oldBuckets, newBuckets, []);

      // Assert
      expect(merged.map.range).toEqual([ '<range:5>' ]);
    });

    it('combines base and overlay lines for a key registered as non-combining', () =>
    {
      // Arrange- some tags are additive by design; those keys opt out of replacement.
      const oldBuckets = buildBuckets({ onhitselfstate: [ '<onHitSelfState:[1,50]>' ] });
      const newBuckets = buildBuckets({ onhitselfstate: [ '<onHitSelfState:[2,50]>' ] });

      // Act
      const merged = OverlayManager._mergeBuckets(oldBuckets, newBuckets, [ 'onhitselfstate' ]);

      // Assert
      expect(merged.map.onhitselfstate).toEqual([ '<onHitSelfState:[1,50]>', '<onHitSelfState:[2,50]>' ]);
    });

    it('does not duplicate an identical line when combining', () =>
    {
      // Arrange
      const oldBuckets = buildBuckets({ k: [ '<k:1>' ] });
      const newBuckets = buildBuckets({ k: [ '<k:1>', '<k:2>' ] });

      // Act
      const merged = OverlayManager._mergeBuckets(oldBuckets, newBuckets, [ 'k' ]);

      // Assert
      expect(merged.map.k).toEqual([ '<k:1>', '<k:2>' ]);
    });

    it('keeps the base lines when the overlay says nothing about that key', () =>
    {
      // Arrange- an overlay only changes what it mentions.
      const oldBuckets = buildBuckets({ range: [ '<range:1>' ] });
      const newBuckets = buildBuckets({});

      // Act
      const merged = OverlayManager._mergeBuckets(oldBuckets, newBuckets, []);

      // Assert
      expect(merged.map.range).toEqual([ '<range:1>' ]);
    });

    it('keeps the base lines for an excluded key the overlay does not mention', () =>
    {
      // Arrange
      const oldBuckets = buildBuckets({ k: [ '<k:1>' ] });
      const newBuckets = buildBuckets({});

      // Act
      const merged = OverlayManager._mergeBuckets(oldBuckets, newBuckets, [ 'k' ]);

      // Assert
      expect(merged.map.k).toEqual([ '<k:1>' ]);
    });

    it('appends overlay-only keys after the base keys', () =>
    {
      // Arrange- new capabilities land at the end so the base note stays recognisable.
      const oldBuckets = buildBuckets({ a: [ '<a:1>' ] });
      const newBuckets = buildBuckets({ b: [ '<b:1>' ] });

      // Act
      const merged = OverlayManager._mergeBuckets(oldBuckets, newBuckets, []);

      // Assert
      expect(merged.order).toEqual([ 'a', 'b' ]);
    });

    it('ignores a key whose line list is empty', () =>
    {
      // Arrange- an empty bucket carries no information and must not occupy a slot in the output.
      const oldBuckets = buildBuckets({ a: [] });
      const newBuckets = buildBuckets({});

      // Act
      const merged = OverlayManager._mergeBuckets(oldBuckets, newBuckets, []);

      // Assert
      expect(merged.order).toEqual([]);
    });

    it('preserves the base key ordering rather than the overlay ordering', () =>
    {
      // Arrange
      const oldBuckets = buildBuckets({ a: [ '<a:1>' ], b: [ '<b:1>' ] });
      const newBuckets = buildBuckets({ b: [ '<b:2>' ], a: [ '<a:2>' ] });

      // Act
      const merged = OverlayManager._mergeBuckets(oldBuckets, newBuckets, []);

      // Assert
      expect(merged.order).toEqual([ 'a', 'b' ]);
    });
  });

  describe('_mergeUnsupported', () =>
  {
    it('keeps base prose ahead of overlay prose', () =>
    {
      // Arrange & Act
      const merged = OverlayManager._mergeUnsupported([ 'base line' ], [ 'overlay line' ]);

      // Assert
      expect(merged).toEqual([ 'base line', 'overlay line' ]);
    });

    it('deduplicates prose repeated across both notes', () =>
    {
      // Arrange- boilerplate comments are frequently copied between related skills.
      // Act
      const merged = OverlayManager._mergeUnsupported([ 'shared' ], [ 'shared' ]);

      // Assert
      expect(merged).toEqual([ 'shared' ]);
    });

    it('deduplicates prose repeated within the base note itself', () =>
    {
      // Arrange & Act
      const merged = OverlayManager._mergeUnsupported([ 'dup', 'dup' ], []);

      // Assert
      expect(merged).toEqual([ 'dup' ]);
    });

    it('deduplicates prose repeated within the overlay note itself', () =>
    {
      // Arrange & Act
      const merged = OverlayManager._mergeUnsupported([], [ 'dup', 'dup' ]);

      // Assert
      expect(merged).toEqual([ 'dup' ]);
    });
  });

  describe('_reconstructNote', () =>
  {
    it('emits prose first, then tags grouped by key order', () =>
    {
      // Arrange
      const buckets = { order: [ 'a', 'b' ], map: { a: [ '<a:1>' ], b: [ '<b:1>', '<b:2>' ] } };

      // Act
      const note = OverlayManager._reconstructNote([ 'prose' ], buckets);

      // Assert
      expect(note).toBe('prose\n<a:1>\n<b:1>\n<b:2>');
    });

    it('produces an empty string when there is nothing to emit', () =>
    {
      // Arrange & Act
      const note = OverlayManager._reconstructNote([], { order: [], map: {} });

      // Assert
      expect(note).toBe('');
    });
  });

  describe('overwriteNote', () =>
  {
    beforeEach(() =>
    {
      // the non-combining registry is process-wide state on the plugin metadata; rebuilding it per
      // test keeps one test's registration from silently changing another's merge rules.
      vi.spyOn(globalThis.J.EXTEND.Metadata, 'getNonCombiningKeys').mockReturnValue([]);
    });

    it('replaces a base tag with the overlay tag of the same key', () =>
    {
      // Arrange & Act
      const merged = OverlayManager.overwriteNote('<range:1>', '<range:5>');

      // Assert
      expect(merged).toBe('<range:5>');
    });

    it('carries forward base tags the overlay never mentions', () =>
    {
      // Arrange & Act
      const merged = OverlayManager.overwriteNote('<range:1>\n<direct>', '<range:5>');

      // Assert
      expect(merged).toBe('<range:5>\n<direct>');
    });

    it('adds overlay-only tags to the result', () =>
    {
      // Arrange & Act
      const merged = OverlayManager.overwriteNote('<range:1>', '<direct>');

      // Assert
      expect(merged).toBe('<range:1>\n<direct>');
    });

    it('combines rather than replaces for a registered non-combining key', () =>
    {
      // Arrange- this is the opt-in that makes additive tags stack across an extension chain.
      globalThis.J.EXTEND.Metadata.getNonCombiningKeys.mockReturnValue([ 'onhitselfstate' ]);

      // Act
      const merged = OverlayManager.overwriteNote('<onHitSelfState:[1,50]>', '<onHitSelfState:[2,50]>');

      // Assert
      expect(merged).toBe('<onHitSelfState:[1,50]>\n<onHitSelfState:[2,50]>');
    });

    it('treats a nullish base note as empty', () =>
    {
      // Arrange- database rows routinely carry null notes.
      // Act
      const merged = OverlayManager.overwriteNote(null, '<range:5>');

      // Assert
      expect(merged).toBe('<range:5>');
    });

    it('treats a nullish overlay note as empty', () =>
    {
      // Arrange & Act
      const merged = OverlayManager.overwriteNote('<range:1>', null);

      // Assert
      expect(merged).toBe('<range:1>');
    });

    it('preserves free-form prose from both notes', () =>
    {
      // Arrange- authors leave real comments in notes and losing them on extension would be hostile.
      // Act
      const merged = OverlayManager.overwriteNote('base prose\n<range:1>', 'overlay prose\n<range:5>');

      // Assert
      expect(merged).toBe('base prose\noverlay prose\n<range:5>');
    });

    it('matches keys case-insensitively when deciding replacement', () =>
    {
      // Arrange- the same tag authored with different casing must not survive twice.
      // Act
      const merged = OverlayManager.overwriteNote('<Range:1>', '<range:5>');

      // Assert
      expect(merged).toBe('<range:5>');
    });
  });
});
//endregion plugins/extend/core/managers/overlay-manager-note-merge.test.js
