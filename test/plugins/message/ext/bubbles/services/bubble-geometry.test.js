//region plugins/message/ext/bubbles/services/bubble-geometry.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import BubbleBounds from '../../../../../../src/plugins/message/ext/bubbles/__models/BubbleBounds.js';
import BubbleGeometry from '../../../../../../src/plugins/message/ext/bubbles/services/BubbleGeometry.js';

/**
 * Two collaborators are faked here and the reasons differ. `TextRasterMetrics` is J-Base's, and a
 * plugin outside `_base` reaches it as a hoisted global rather than by import, so there is nothing
 * to import even in a test. `MessageEffectRegistry` is J-Message's and is faked deliberately: what
 * this service is responsible for is turning a reach into a rectangle, and the reach of an actual
 * wave is J-Message's business and is tested there. Faking it is also what proves the point of the
 * design - these fixtures register effect names this ship has never heard of, and the geometry comes
 * out right anyway.
 */
describe('J-Message-Bubbles BubbleGeometry (direct src import)', () =>
{
  /**
   * How far each fake effect throws or swells a glyph.
   * @type {object}
   */
  const reachByEffect = {
    testWave: { offsetX: 0, offsetY: 4, scale: 1 },
    testJitter: { offsetX: 2, offsetY: 2, scale: 1 },
    testSwell: { offsetX: 0, offsetY: 0, scale: 1.5 },
  };

  /**
   * A glyph carrying everything the geometry reads off one, with sane defaults.
   * @param {object} overrides Whatever this particular glyph does differently.
   * @returns {object}
   */
  function fakeGlyph(overrides)
  {
    const base = {
      x: 100,
      y: 50,
      width: 20,
      lineHeight: 36,
      fontSize: 28,
      outlineWidth: 3,
      effects: [],
    };

    return Object.assign(base, overrides);
  }

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
    globalThis.TextRasterMetrics = {
      padding: outlineWidth => Math.ceil(outlineWidth),
      canvasHeight: fontSize => fontSize * 3,
    };

    globalThis.MessageEffectRegistry = {
      excursionOf: names =>
      {
        const composed = { offsetX: 0, offsetY: 0, scale: 1 };

        names.forEach(name =>
        {
          const reach = reachByEffect[name];
          if (reach === undefined) return;

          composed.offsetX += reach.offsetX;
          composed.offsetY += reach.offsetY;
          composed.scale *= reach.scale;
        });

        return composed;
      },
    };
  });

  afterEach(() =>
  {
    delete globalThis.TextRasterMetrics;
    delete globalThis.MessageEffectRegistry;
  });

  it('measures nothing for a message that has not begun revealing', () =>
  {
    // Arrange & Act
    const bounds = BubbleGeometry.contentBounds([]);

    // Assert
    expect(bounds.left).toBe(0);
    expect(bounds.top).toBe(0);
    expect(bounds.right).toBe(0);
    expect(bounds.bottom).toBe(0);
  });

  it('widens a resting glyph by the margin its outline is stroked into', () =>
  {
    // Arrange & Act
    // the advance the splitter measured is 20 wide; the raster reserves three either side, and the
    // sprite subtracts that same three when it places itself, so the ink really does start there.
    const bounds = BubbleGeometry.contentBounds([ fakeGlyph({}) ]);

    // Assert
    expect(bounds.left).toBe(97);
    expect(bounds.right).toBe(123);
  });

  it('gives a resting glyph the full height of the line it sits on', () =>
  {
    // Arrange & Act
    const bounds = BubbleGeometry.contentBounds([ fakeGlyph({}) ]);

    // Assert
    expect(bounds.top).toBe(50);
    expect(bounds.bottom).toBe(86);
  });

  it('stretches to the far edge of the last glyph on a line', () =>
  {
    // Arrange
    const first = fakeGlyph({ x: 100 });
    const last = fakeGlyph({ x: 140 });

    // Act
    const bounds = BubbleGeometry.contentBounds([ first, last ]);

    // Assert- the left edge has to stay with the first glyph while the right edge follows the last,
    // which a rectangle built from only one of them could not do.
    expect(bounds.left).toBe(97);
    expect(bounds.right).toBe(163);
  });

  it('stretches down to the last line rather than the first', () =>
  {
    // Arrange
    const upper = fakeGlyph({ y: 50 });
    const lower = fakeGlyph({ y: 86 });

    // Act
    const bounds = BubbleGeometry.contentBounds([ upper, lower ]);

    // Assert
    expect(bounds.top).toBe(50);
    expect(bounds.bottom).toBe(122);
  });

  it('reserves room above and below for a glyph that travels vertically', () =>
  {
    // Arrange & Act
    // a glyph sampled at rest reports needing nothing; it is four pixels higher twenty frames later.
    const bounds = BubbleGeometry.contentBounds([ fakeGlyph({ effects: [ 'testWave' ] }) ]);

    // Assert
    expect(bounds.top).toBe(46);
    expect(bounds.bottom).toBe(90);
  });

  it('reserves room on both sides for a glyph that travels horizontally', () =>
  {
    // Arrange & Act
    const bounds = BubbleGeometry.contentBounds([ fakeGlyph({ effects: [ 'testJitter' ] }) ]);

    // Assert
    expect(bounds.left).toBe(95);
    expect(bounds.right).toBe(125);
  });

  it('reserves room in both directions at once for a glyph carrying two effects', () =>
  {
    // Arrange & Act
    const bounds = BubbleGeometry.contentBounds([ fakeGlyph({ effects: [ 'testWave', 'testJitter' ] }) ]);

    // Assert- six vertically because the two reaches add, not because either one wins.
    expect(bounds.top).toBe(44);
    expect(bounds.bottom).toBe(92);
    expect(bounds.left).toBe(95);
  });

  it('reserves room for a swelling glyph against the raster it actually scales', () =>
  {
    // Arrange & Act
    // the sprite grows its whole bitmap and pulls back by half the growth, so the travel is set by
    // the bitmap: 26 wide including the outline margins, and three font sizes tall.
    const bounds = BubbleGeometry.contentBounds([ fakeGlyph({ effects: [ 'testSwell' ] }) ]);

    // Assert
    expect(bounds.left).toBe(90.5);
    expect(bounds.right).toBe(129.5);
    expect(bounds.top).toBe(29);
    expect(bounds.bottom).toBe(107);
  });

  it('asks after each glyph separately rather than applying one reach to all of them', () =>
  {
    // Arrange
    const waving = fakeGlyph({ x: 100, effects: [ 'testWave' ] });
    const still = fakeGlyph({ x: 140, effects: [] });

    // Act
    const bounds = BubbleGeometry.contentBounds([ waving, still ]);

    // Assert- the top rises for the waving glyph, but the right edge stays exactly where the still
    // one ends: a shared reach would have widened it by the wave's zero and told us nothing, and a
    // reach taken from whichever glyph came last would have lost the height entirely.
    expect(bounds.top).toBe(46);
    expect(bounds.right).toBe(163);
  });

  it('ignores an effect nothing is installed to answer for', () =>
  {
    // Arrange & Act
    const bounds = BubbleGeometry.contentBounds([ fakeGlyph({ effects: [ 'notInstalledAnywhere' ] }) ]);

    // Assert
    expect(bounds.top).toBe(50);
    expect(bounds.left).toBe(97);
  });

  it('leaves clear space between the text and the border it draws around it', () =>
  {
    // Arrange & Act
    const bounds = BubbleGeometry.bubbleBounds([ fakeGlyph({}) ]);

    // Assert- ten on every side of the 97..123 by 50..86 the text itself needed.
    expect(bounds.left).toBe(87);
    expect(bounds.top).toBe(40);
    expect(bounds.right).toBe(133);
    expect(bounds.bottom).toBe(96);
  });

  it('carries a glyph effect reach through into the bubble it draws', () =>
  {
    // Arrange & Act
    // the whole point of the exercise: the margin is added to the reach, never instead of it.
    const bounds = BubbleGeometry.bubbleBounds([ fakeGlyph({ effects: [ 'testWave' ] }) ]);

    // Assert
    expect(bounds.top).toBe(36);
    expect(bounds.bottom).toBe(100);
  });

  describe('applyFaceFloor', () =>
  {
    it('grows a message too short to hold the portrait beside it', () =>
    {
      // Arrange- one line of text, against the seventy-two a bubble draws portraits at.
      const bounds = new BubbleBounds(0, 0, 200, 36);

      // Act
      BubbleGeometry.applyFaceFloor(bounds, 'face_je');

      // Assert
      expect(bounds.bottom).toBe(72);
    });

    it('leaves a message already taller than its portrait alone', () =>
    {
      // Arrange- four lines of text, comfortably past the portrait.
      const bounds = new BubbleBounds(0, 0, 200, 144);

      // Act
      BubbleGeometry.applyFaceFloor(bounds, 'face_je');

      // Assert
      expect(bounds.bottom).toBe(144);
    });

    it('leaves a message with no portrait alone', () =>
    {
      // Arrange
      const bounds = new BubbleBounds(0, 0, 200, 36);

      // Act
      BubbleGeometry.applyFaceFloor(bounds, String.empty);

      // Assert
      expect(bounds.bottom).toBe(36);
    });

    it('never moves the edges a bubble is not sized from', () =>
    {
      // Arrange
      const bounds = new BubbleBounds(7, 3, 200, 36);

      // Act
      BubbleGeometry.applyFaceFloor(bounds, 'face_je');

      // Assert- the floor is a floor, not a resize.
      expect(bounds.left).toBe(7);
      expect(bounds.top).toBe(3);
      expect(bounds.right).toBe(200);
    });
  });
});
//endregion plugins/message/ext/bubbles/services/bubble-geometry.test.js