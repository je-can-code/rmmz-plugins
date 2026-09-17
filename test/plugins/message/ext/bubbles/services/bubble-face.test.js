//region plugins/message/ext/bubbles/services/bubble-face.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import BubbleFace from '../../../../../../src/plugins/message/ext/bubbles/services/BubbleFace.js';

/**
 * `ImageManager` is an engine global rather than anything this repo owns, so it is stubbed here the
 * way the runtime supplies it. The source tile is faked at 144 because that is what an unmodified
 * project reports and what every expectation below is written against - a project that changed its
 * face size would get proportionally different answers from `sourceOrigin` and identical ones from
 * everything else, which is the split this service intends.
 */
describe('J-Message-Bubbles BubbleFace (direct src import)', () =>
{
  beforeAll(() =>
  {
    // the repo's own empty-string sentinel, which a bare direct import does not get for free.
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        writable: false,
        configurable: true,
      });
    }
  });

  beforeEach(() =>
  {
    globalThis.ImageManager = {
      faceWidth: 144,
      faceHeight: 144,
    };
  });

  afterEach(() =>
  {
    delete globalThis.ImageManager;
  });

  describe('isPresent', () =>
  {
    it('recognizes a message that named a face', () =>
    {
      // Arrange.
      const faceName = 'face_je';

      // Act.
      const result = BubbleFace.isPresent(faceName);

      // Assert.
      expect(result).toBe(true);
    });

    it('recognizes a message that named no face', () =>
    {
      // Arrange.
      const faceName = String.empty;

      // Act.
      const result = BubbleFace.isPresent(faceName);

      // Assert.
      expect(result).toBe(false);
    });
  });

  describe('indent', () =>
  {
    it('clears the portrait when there is one', () =>
    {
      // Arrange.
      const faceName = 'face_je';

      // Act.
      const result = BubbleFace.indent(faceName);

      // Assert.
      expect(result).toBe(92);
    });

    it('sits against the edge when there is no portrait', () =>
    {
      // Arrange.
      const faceName = String.empty;

      // Act.
      const result = BubbleFace.indent(faceName);

      // Assert.
      expect(result).toBe(4);
    });
  });

  describe('floor', () =>
  {
    it('reserves the portrait height when there is one', () =>
    {
      // Arrange.
      const faceName = 'face_rp';

      // Act.
      const result = BubbleFace.floor(faceName);

      // Assert.
      expect(result).toBe(72);
    });

    it('reserves nothing when there is no portrait', () =>
    {
      // Arrange.
      const faceName = String.empty;

      // Act.
      const result = BubbleFace.floor(faceName);

      // Assert.
      expect(result).toBe(0);
    });
  });

  describe('slack', () =>
  {
    it('centers text shorter than the portrait beside it', () =>
    {
      // Arrange.
      const faceName = 'face_je';
      const oneLine = 36;

      // Act.
      const result = BubbleFace.slack(faceName, oneLine);

      // Assert.
      expect(result).toBe(18);
    });

    it('leaves text exactly as tall as the portrait alone', () =>
    {
      // Arrange.
      const faceName = 'face_je';
      const twoLines = 72;

      // Act.
      const result = BubbleFace.slack(faceName, twoLines);

      // Assert.
      expect(result).toBe(0);
    });

    it('leaves text taller than the portrait alone', () =>
    {
      // Arrange.
      const faceName = 'face_je';
      const fourLines = 144;

      // Act.
      const result = BubbleFace.slack(faceName, fourLines);

      // Assert.
      expect(result).toBe(0);
    });

    it('never moves text that has no portrait to sit level with', () =>
    {
      // Arrange.
      const faceName = String.empty;
      const oneLine = 36;

      // Act.
      const result = BubbleFace.slack(faceName, oneLine);

      // Assert.
      expect(result).toBe(0);
    });
  });

  describe('faceOffset', () =>
  {
    it('centers a portrait shorter than the message beside it', () =>
    {
      // Arrange- three lines of text against the seventy-two the portrait occupies.
      const faceName = 'face_rp';
      const threeLines = 108;

      // Act
      const result = BubbleFace.faceOffset(faceName, threeLines);

      // Assert
      expect(result).toBe(18);
    });

    it('leaves a portrait that exactly fills the message alone', () =>
    {
      // Arrange
      const faceName = 'face_rp';
      const twoLines = 72;

      // Act
      const result = BubbleFace.faceOffset(faceName, twoLines);

      // Assert
      expect(result).toBe(0);
    });

    it('leaves a portrait taller than the message alone, the text having moved instead', () =>
    {
      // Arrange
      const faceName = 'face_rp';
      const oneLine = 36;

      // Act
      const result = BubbleFace.faceOffset(faceName, oneLine);

      // Assert
      expect(result).toBe(0);
    });

    it('places nothing for a message with no portrait', () =>
    {
      // Arrange- a tall message, so a missing guard would answer with a large offset rather than zero.
      const faceName = String.empty;
      const fourLines = 144;

      // Act
      const result = BubbleFace.faceOffset(faceName, fourLines);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('sourceOrigin', () =>
  {
    it('finds the first portrait on the sheet', () =>
    {
      // Arrange.
      const faceIndex = 0;

      // Act.
      const result = BubbleFace.sourceOrigin(faceIndex);

      // Assert.
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('walks across the top row of the sheet', () =>
    {
      // Arrange.
      const faceIndex = 1;

      // Act.
      const result = BubbleFace.sourceOrigin(faceIndex);

      // Assert.
      expect(result.x).toBe(144);
      expect(result.y).toBe(0);
    });

    it('drops to the next row once the columns run out', () =>
    {
      // Arrange.
      const faceIndex = 4;

      // Act.
      const result = BubbleFace.sourceOrigin(faceIndex);

      // Assert.
      expect(result.x).toBe(0);
      expect(result.y).toBe(144);
    });

    it('finds a portrait that is along and down at once', () =>
    {
      // Arrange.
      const faceIndex = 5;

      // Act.
      const result = BubbleFace.sourceOrigin(faceIndex);

      // Assert.
      expect(result.x).toBe(144);
      expect(result.y).toBe(144);
    });
  });
});
//endregion plugins/message/ext/bubbles/services/bubble-face.test.js