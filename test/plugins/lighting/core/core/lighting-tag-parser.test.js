//region plugins/lighting/core/core/lighting-tag-parser.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installLightingHostGlobals,
  installLightingMetadata,
  installRecordingDiagnostics,
} from '../../fixtures/install-lighting-host-globals.js';

describe('LightingTagParser', () =>
{
  let LightingTagParser;
  let diagnostics;

  // a stand-in for whoever is carrying the light; identity is all the parser does with it.
  const torch = { id: 'torch' };

  beforeAll(async () =>
  {
    vi.resetModules();
    installLightingHostGlobals();
    installLightingMetadata();

    // the real note reader goes in rather than a stub: reading a light off a piece of equipment is
    // exactly a question of how it walks a battler's note objects and caches what it finds.
    ({ default: globalThis.RPGManager } =
      await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    ({ default: LightingTagParser } =
      await import('../../../../../src/plugins/lighting/core/core/LightingTagParser.js'));
  });

  beforeEach(() =>
  {
    diagnostics = installRecordingDiagnostics();
  });

  describe('parseLightPayload', () =>
  {
    it('reads a radius on its own and fills the rest from configuration', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5]', torch, 'page:1');

      // Assert
      expect(result.radius()).toBe(5);
      expect(result.color()).toBe('#FFFFFF');
      expect(result.effect()).toBe('steady');
    });

    it('reads a stated colour in place of the configured one', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[4, #ffbb73]', torch, 'page:1');

      // Assert
      expect(result.radius()).toBe(4);
      expect(result.color()).toBe('#ffbb73');
    });

    it('reads the flicker keyword sitting after a colour', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[6, #ffbb73, flicker]', torch, 'page:1');

      // Assert
      expect(result.effect()).toBe('flicker');
      expect(result.color()).toBe('#ffbb73');
    });

    it('reads the flicker keyword sitting where a colour would have been', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[6, flicker]', torch, 'page:1');

      // Assert
      // flicker is not a colour, so it must not be mistaken for one and must still be honoured. the
      // silence matters as much as the values: mistaking it for a colour would reach the same
      // fallback by complaining about a malformed hex the author never wrote.
      expect(result.effect()).toBe('flicker');
      expect(result.color()).toBe('#FFFFFF');
      expect(diagnostics.warn).toHaveLength(0);
    });

    it('reads an intensity and turns the percentage into a fraction', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, #ffbb73, 60]', torch, 'page:1');

      // Assert
      expect(result.intensity()).toBeCloseTo(0.6, 10);
    });

    it('falls back to the configured intensity when none is written', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5]', torch, 'page:1');

      // Assert
      // the shipped default is the soft pool a light has always been, so old tags do not move.
      expect(result.intensity()).toBe(0);
    });

    it('clamps an author overshooting the intensity scale to a flat disc', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, 400]', torch, 'page:1');

      // Assert
      expect(result.intensity()).toBe(1);
    });

    it('reads a pulse', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, pulse]', torch, 'page:1');

      // Assert
      expect(result.effect()).toBe('pulse');
    });

    it('reads a glitch', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, glitch]', torch, 'page:1');

      // Assert
      expect(result.effect()).toBe('glitch');
    });

    it('leaves a light steady when it names no behaviour', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, #ffbb73, 60]', torch, 'page:1');

      // Assert
      expect(result.effect()).toBe('steady');
    });

    it('reads colour, intensity and behaviour in whatever order they were written', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, glitch, 70, #88ffcc]', torch, 'page:1');

      // Assert
      // each is unmistakable from the others, so position carries no meaning past the reach.
      expect(result.color()).toBe('#88ffcc');
      expect(result.intensity()).toBeCloseTo(0.7, 10);
      expect(result.effect()).toBe('glitch');
    });

    it('reports a misspelled behaviour rather than quietly leaving the light steady', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, flickr]', torch, 'page:1');

      // Assert
      // silence here would be the wrong kindness: the author would stare at the event, not the tag.
      expect(result.effect()).toBe('steady');
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('says nothing at all about a tag whose every parameter it understood', () =>
    {
      // Arrange
      // Act
      LightingTagParser.parseLightPayload('[5, #ffbb73, 60, pulse]', torch, 'page:1');

      // Assert
      expect(diagnostics.warn).toHaveLength(0);
    });

    it('attaches the light to the character it was given', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5]', torch, 'page:1');

      // Assert
      expect(result.character()).toBe(torch);
    });

    it('rejects a tag carrying more parameters than a light has', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, #ffbb73, 60, flicker, extra]', torch, 'page:1');

      // Assert
      expect(result).toBeNull();
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('rejects a light with no reach at all', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[0]', torch, 'page:1');

      // Assert
      expect(result).toBeNull();
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('rejects a light whose reach is negative', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[-50]', torch, 'page:1');

      // Assert
      expect(result).toBeNull();
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('rejects a light whose radius was written as a word', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[big]', torch, 'page:1');

      // Assert
      expect(result).toBeNull();
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('reports a misspelled colour and falls back rather than rendering it wrong', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseLightPayload('[5, #fbb7]', torch, 'page:1');

      // Assert
      expect(result.color()).toBe('#FFFFFF');
      expect(diagnostics.warn).toHaveLength(1);
    });
  });

  describe('parseComments', () =>
  {
    it('reads a light tag out of a page comment', () =>
    {
      // Arrange
      const comments = [ '<light:[4, #ffbb73]>' ];

      // Act
      const result = LightingTagParser.parseComments(comments, torch, 'page:1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].radius()).toBe(4);
    });

    it('ignores comments belonging to other plugins', () =>
    {
      // Arrange
      const comments = [ '<motion:[breathe]>', 'just a note to self', '<light:[4]>' ];

      // Act
      const result = LightingTagParser.parseComments(comments, torch, 'page:1');

      // Assert
      // the near-miss matters: a page is full of other plugins' tags, and only one of these is ours.
      expect(result).toHaveLength(1);
      expect(result[0].radius()).toBe(4);
    });

    it('ignores a tag whose name merely starts the same way', () =>
    {
      // Arrange
      const comments = [ '<lightning:[5]>' ];

      // Act
      const result = LightingTagParser.parseComments(comments, torch, 'page:1');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('reads several light tags off one page, in the order written', () =>
    {
      // Arrange
      const comments = [ '<light:[2]>', '<light:[6]>' ];

      // Act
      const result = LightingTagParser.parseComments(comments, torch, 'page:1');

      // Assert
      expect(result.map(declaration => declaration.radius())).toEqual([ 2, 6 ]);
    });

    it('skips a tag that matched but described nothing, keeping the valid ones around it', () =>
    {
      // Arrange
      // a radius of zero matches the tag shape and then fails on meaning, which is the only way a
      // tag reaches the parser and gets rejected - anything that does not match is never ours.
      const comments = [ '<light:[2]>', '<light:[0]>', '<light:[6]>' ];

      // Act
      const result = LightingTagParser.parseComments(comments, torch, 'page:1');

      // Assert
      expect(result.map(declaration => declaration.radius())).toEqual([ 2, 6 ]);
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('finds nothing on a page with no comments at all', () =>
    {
      // Arrange
      const comments = [];

      // Act
      const result = LightingTagParser.parseComments(comments, torch, 'page:1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('parseNoteObjects', () =>
  {
    it('reads a light off a note carried by something the leader has', () =>
    {
      // Arrange
      const noteObjects = [ { note: '<light:[4.5, #ffdca8, flicker]>' } ];

      // Act
      const result = LightingTagParser.parseNoteObjects(noteObjects, torch, 'player');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].radius()).toBe(4.5);
    });

    it('gathers lights from several different things at once', () =>
    {
      // Arrange
      const noteObjects = [ { note: '<light:[4.5]>' }, { note: '<light:[3]>' } ];

      // Act
      const result = LightingTagParser.parseNoteObjects(noteObjects, torch, 'player');

      // Assert
      expect(result.map(declaration => declaration.radius())).toEqual([ 4.5, 3 ]);
    });

    it('skips a tag that matched but described nothing, keeping the valid ones', () =>
    {
      // Arrange
      const noteObjects = [ { note: '<light:[4.5]>' }, { note: '<light:[0]>' } ];

      // Act
      const result = LightingTagParser.parseNoteObjects(noteObjects, torch, 'player');

      // Assert
      expect(result.map(declaration => declaration.radius())).toEqual([ 4.5 ]);
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('finds nothing on things that carry no light tag at all', () =>
    {
      // Arrange
      const noteObjects = [ { note: '<hp:40>' }, { note: '' } ];

      // Act
      const result = LightingTagParser.parseNoteObjects(noteObjects, torch, 'player');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('parseAmbientPayload', () =>
  {
    it('reads a darkness percentage as a fraction of the light removed', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseAmbientPayload('[60]', 'map');

      // Assert
      expect(result.darkness()).toBeCloseTo(0.6, 10);
    });

    it('records that no colour was stated when only a darkness was written', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseAmbientPayload('[60]', 'map');

      // Assert
      expect(result.hasDeclaredColor()).toBe(false);
      expect(result.color()).toEqual([ 0, 0, 0 ]);
    });

    it('reads a stated colour of dark and records that it was stated', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseAmbientPayload('[85, #0a2a2a]', 'map');

      // Assert
      expect(result.darkness()).toBeCloseTo(0.85, 10);
      expect(result.color()).toEqual([ 10, 42, 42 ]);
      expect(result.hasDeclaredColor()).toBe(true);
    });

    it('clamps an author overshooting the top of the scale to total darkness', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseAmbientPayload('[400]', 'map');

      // Assert
      expect(result.darkness()).toBe(1);
    });

    it('clamps an author undershooting the bottom of the scale to no darkness', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseAmbientPayload('[-40]', 'map');

      // Assert
      expect(result.darkness()).toBe(0);
    });

    it('rejects a tag carrying more parameters than an ambient has', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseAmbientPayload('[60, #0a2a2a, extra]', 'map');

      // Assert
      expect(result).toBeNull();
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('rejects a darkness written as a word, rather than guessing at it', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseAmbientPayload('[pitch]', 'map');

      // Assert
      expect(result).toBeNull();
      expect(diagnostics.warn).toHaveLength(1);
    });

    it('still counts a misspelled colour as the author having wanted one', () =>
    {
      // Arrange
      // Act
      const result = LightingTagParser.parseAmbientPayload('[60, #0a2a2]', 'map');

      // Assert
      // intent is what decides who wins the colour later, not whether the hex happened to parse.
      expect(result.hasDeclaredColor()).toBe(true);
      expect(diagnostics.warn).toHaveLength(1);
    });
  });
});
//endregion plugins/lighting/core/core/lighting-tag-parser.test.js