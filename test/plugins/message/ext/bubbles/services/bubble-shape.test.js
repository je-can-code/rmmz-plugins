//region plugins/message/ext/bubbles/services/bubble-shape.test.js
import { describe, expect, it } from 'vitest';

import BubbleShape from '../../../../../../src/plugins/message/ext/bubbles/services/BubbleShape.js';
import BubbleBounds from '../../../../../../src/plugins/message/ext/bubbles/__models/BubbleBounds.js';

/**
 * The bubble under test is 200 by 100 at an offset origin, never square and never at zero. A shape
 * service is almost entirely arithmetic on four edges, and a square at the origin lets a left/right
 * or a top/bottom mix-up produce the correct answer by coincidence.
 */
describe('J-Message-Bubbles BubbleShape (direct src import)', () =>
{
  /**
   * The bubble every case here is drawn around: 100..300 across, 50..150 down.
   * @returns {BubbleBounds}
   */
  function bubble()
  {
    return new BubbleBounds(100, 50, 300, 150);
  }

  describe('the tail', () =>
  {
    it('leaves the underside for a speaker standing below the bubble', () =>
    {
      // Arrange & Act
      const tail = BubbleShape.tailFor(bubble(), 200, 400);

      // Assert- the ordinary case, since a bubble floats above whoever is talking.
      expect(tail.onTop).toBe(false);
      expect(tail.tipY).toBe(164);
    });

    it('leaves the top for a speaker standing above the bubble', () =>
    {
      // Arrange & Act
      // what happens when the top of the screen has pushed the bubble below its owner.
      const tail = BubbleShape.tailFor(bubble(), 200, 10);

      // Assert
      expect(tail.onTop).toBe(true);
      expect(tail.tipY).toBe(36);
    });

    it('points at the speaker when the speaker is somewhere it can reach', () =>
    {
      // Arrange & Act
      const tail = BubbleShape.tailFor(bubble(), 260, 400);

      // Assert
      expect(tail.tipX).toBe(260);
    });

    it('leans toward a speaker the mouth cannot reach', () =>
    {
      // Arrange & Act
      // the mouth is held at the corner, but the tip tilts that way, so the tail still reads as
      // aiming at somebody rather than as hanging off the nearest edge.
      const tail = BubbleShape.tailFor(bubble(), 20, 400);

      // Assert
      expect(tail.tipX).toBeCloseTo(115.756, 3);
    });

    it('leans the other way for a speaker off the other side', () =>
    {
      // Arrange & Act
      // the near-miss for the lean above: a service that tilted in one direction only would pass
      // that test and tilt this tail the wrong way entirely.
      const tail = BubbleShape.tailFor(bubble(), 900, 400);

      // Assert
      expect(tail.tipX).toBeCloseTo(288.899, 3);
    });

    it('points straight out at a speaker directly beyond the mouth', () =>
    {
      // Arrange & Act
      // the common case by a mile: the bubble is placed over its owner, so there is nothing to
      // lean toward and a tail that tilted anyway would look broken.
      const tail = BubbleShape.tailFor(bubble(), 200, 400);

      // Assert
      expect(tail.tipX).toBe(200);
      expect(tail.tipY).toBe(164);
    });

    it('holds the lean to forty-five degrees for a speaker level with the bubble', () =>
    {
      // Arrange & Act
      // uncapped, a speaker barely below the edge would drag the tail almost flat along it.
      const tail = BubbleShape.tailFor(bubble(), 900, 151);

      // Assert- equal parts sideways and outward, measured from the mouth it leaves.
      expect(tail.tipX - 279).toBeCloseTo(9.899, 3);
      expect(tail.tipY - 150).toBeCloseTo(9.899, 3);
    });

    it('points a leaning tail away from the body rather than back into it', () =>
    {
      // Arrange & Act
      // a speaker standing beside the bubble rather than under it, so their vertical offset from
      // the edge the tail leaves is the wrong way round.
      const tail = BubbleShape.tailFor(bubble(), 900, 100);

      // Assert
      expect(tail.tipY).toBeGreaterThan(150);
    });

    it('opens a mouth centred under the tip', () =>
    {
      // Arrange & Act
      const tail = BubbleShape.tailFor(bubble(), 200, 400);

      // Assert
      expect(tail.mouthStart).toBe(191);
      expect(tail.mouthEnd).toBe(209);
    });

    it('holds the whole mouth clear of the corner however far off the speaker is', () =>
    {
      // Arrange & Act
      // the tip may lean out past the flat run; the mouth is eighteen wide and cannot follow it, or
      // half of it opens into the arc and tears a hole in the border.
      const tail = BubbleShape.tailFor(bubble(), 20, 400);

      // Assert
      expect(tail.mouthStart).toBe(112);
      expect(tail.mouthEnd).toBe(130);
    });

    it('centres the tail on a bubble too narrow to have a flat edge at all', () =>
    {
      // Arrange
      const sliver = new BubbleBounds(100, 50, 118, 150);

      // Act
      const tail = BubbleShape.tailFor(sliver, 200, 400);

      // Assert- the two clamps cross over, so the mouth sits in the middle and the tip leans off it.
      expect(tail.mouthStart).toBe(100);
      expect(tail.tipX).toBeCloseTo(113.789, 3);
    });
  });

  describe('the legend gap', () =>
  {
    it('carves a gap wide enough for the name and its breathing room', () =>
    {
      // Arrange & Act
      const gap = BubbleShape.legendGapFor(bubble(), 60);

      // Assert- inset twenty-four, pulled back six for padding, and six more added at the far end.
      expect(gap.start).toBe(118);
      expect(gap.end).toBe(190);
    });

    it('leaves the border unbroken when nobody is named', () =>
    {
      // Arrange & Act
      // narration and signposts have no speaker at all.
      const gap = BubbleShape.legendGapFor(bubble(), 0);

      // Assert
      expect(gap).toBeNull();
    });

    it('leaves the border unbroken rather than carving away the far corner', () =>
    {
      // Arrange & Act
      // a name longer than its own bubble; an overlapping name beats a border with no right side.
      const gap = BubbleShape.legendGapFor(bubble(), 300);

      // Assert
      expect(gap).toBeNull();
    });

    it('keeps the gap out of the corner when the inset would have reached into it', () =>
    {
      // Arrange
      // a bubble whose left corner sits further right than the configured inset does.
      const shifted = new BubbleBounds(100, 50, 300, 150);
      const originalInset = BubbleShape.LegendInset;
      BubbleShape.LegendInset = 2;

      // Act
      const gap = BubbleShape.legendGapFor(shifted, 60);
      BubbleShape.LegendInset = originalInset;

      // Assert- held at one corner radius in rather than starting inside the arc.
      expect(gap.start).toBe(112);
    });
  });

  describe('the outline', () =>
  {
    it('walks a plain bubble as four edges and four corners', () =>
    {
      // Arrange & Act
      const path = BubbleShape.outlinePath(bubble(), null, null);

      // Assert
      expect(path.length).toBe(8);
      expect(path[ 0 ]).toEqual({
        kind: 'line',
        fromX: 112,
        fromY: 50,
        toX: 288,
        toY: 50,
      });
    });

    it('closes the loop where it started', () =>
    {
      // Arrange & Act
      const path = BubbleShape.outlinePath(bubble(), null, null);

      // Assert- the last corner has to arrive back at the first edge's start, or the border shows a
      // notch at the top left that nothing else in the path would explain.
      const [ , , , , , , , lastArc ] = path;
      expect(lastArc.kind).toBe('arc');
      expect(lastArc.centerX).toBe(112);
      expect(lastArc.centerY).toBe(62);
    });

    it('hands every segment on without a break in it', () =>
    {
      // Arrange
      const path = BubbleShape.outlinePath(bubble(), null, null);

      // Act
      const breaks = path.filter((segment, index) =>
      {
        // the first segment has nothing before it to disagree with.
        if (index === 0) return false;

        const previousEnd = BubbleShape.endOf(path[ index - 1 ]);
        const thisStart = BubbleShape.startOf(segment);

        // phrased as "not close enough" rather than "far apart" on purpose: a coordinate that came
        // back undefined subtracts to NaN, and NaN is not greater than anything - so the cheerful
        // spelling of this comparison would report a path of missing endpoints as flawless.
        const alignedHorizontally = Math.abs(previousEnd.x - thisStart.x) <= 0.001;
        const alignedVertically = Math.abs(previousEnd.y - thisStart.y) <= 0.001;

        return alignedHorizontally === false || alignedVertically === false;
      });

      // Assert- an arc draws a straight chord from wherever the pen already is, so a path with a
      // break in it does not show a gap. It shows a corner cut off, which is far harder to spot.
      expect(breaks).toEqual([]);
    });

    it('reads a corner as beginning at the point on its own circle', () =>
    {
      // Arrange
      const corner = BubbleShape.arc(200, 100, Math.PI, Math.PI * 1.5);

      // Act
      const start = BubbleShape.startOf(corner);

      // Assert- twelve to the left of centre, which is where an arc starting at pi sits.
      expect(start.x).toBeCloseTo(188, 6);
      expect(start.y).toBeCloseTo(100, 6);
    });

    it('reads a corner as ending at the point on its own circle', () =>
    {
      // Arrange
      const corner = BubbleShape.arc(200, 100, Math.PI, Math.PI * 1.5);

      // Act
      const end = BubbleShape.endOf(corner);

      // Assert- twelve above centre, which is where an arc ending at three halves of pi sits.
      expect(end.x).toBeCloseTo(200, 6);
      expect(end.y).toBeCloseTo(88, 6);
    });

    it('reads a straight run as beginning where it was told to', () =>
    {
      // Arrange
      const run = BubbleShape.line(10, 20, 70, 90);

      // Act
      const start = BubbleShape.startOf(run);

      // Assert
      expect(start.x).toBe(10);
      expect(start.y).toBe(20);
    });

    it('reads a straight run as ending where it was told to', () =>
    {
      // Arrange
      const run = BubbleShape.line(10, 20, 70, 90);

      // Act
      const end = BubbleShape.endOf(run);

      // Assert
      expect(end.x).toBe(70);
      expect(end.y).toBe(90);
    });

    it('meets interruptions back to front when walking an edge right to left', () =>
    {
      // Arrange
      const nearer = { start: 200, end: 220, apex: null };
      const further = { start: 120, end: 140, apex: null };

      // Act
      const ordered = BubbleShape.inTravelOrder([ further, nearer ], false);

      // Assert- travelling leftward, the rightmost interruption is the one reached first. Emitting
      // them in ascending order would send the pen backwards through the body between them.
      expect(ordered[ 0 ]).toBe(nearer);
      expect(ordered[ 1 ]).toBe(further);
    });

    it('meets interruptions front to back when walking an edge left to right', () =>
    {
      // Arrange
      const nearer = { start: 120, end: 140, apex: null };
      const further = { start: 200, end: 220, apex: null };

      // Act
      const ordered = BubbleShape.inTravelOrder([ further, nearer ], true);

      // Assert
      expect(ordered[ 0 ]).toBe(nearer);
      expect(ordered[ 1 ]).toBe(further);
    });

    it('reads a segment starting where the last one ended as one unbroken stroke', () =>
    {
      // Arrange
      const first = BubbleShape.line(10, 20, 70, 20);
      const second = BubbleShape.line(70, 20, 70, 90);

      // Act
      const continues = BubbleShape.continuesFrom(first, second);

      // Assert
      expect(continues).toBe(true);
    });

    it('reads a segment starting elsewhere horizontally as a place to lift the pen', () =>
    {
      // Arrange
      // the legend: the border stops on one side of the name and resumes on the other.
      const first = BubbleShape.line(10, 20, 70, 20);
      const second = BubbleShape.line(140, 20, 200, 20);

      // Act
      const continues = BubbleShape.continuesFrom(first, second);

      // Assert
      expect(continues).toBe(false);
    });

    it('reads a segment starting elsewhere vertically as a place to lift the pen', () =>
    {
      // Arrange
      // the near-miss for the check above: same x, different y, which an implementation comparing
      // only one axis would call continuous.
      const first = BubbleShape.line(10, 20, 70, 20);
      const second = BubbleShape.line(70, 95, 70, 140);

      // Act
      const continues = BubbleShape.continuesFrom(first, second);

      // Assert
      expect(continues).toBe(false);
    });

    it('forgives the rounding a corner endpoint arrives with', () =>
    {
      // Arrange
      // an arc endpoint comes out of a cosine, so it agrees with the edge meeting it to about
      // fifteen decimal places rather than exactly.
      const first = BubbleShape.line(10, 20, 70, 20);
      const second = BubbleShape.line(70.0000000001, 20, 70, 90);

      // Act
      const continues = BubbleShape.continuesFrom(first, second);

      // Assert
      expect(continues).toBe(true);
    });

    it('carries the endpoints of a corner alongside the angles that made it', () =>
    {
      // Arrange & Act
      const path = BubbleShape.outlinePath(bubble(), null, null);

      // Assert- the top-right corner starts directly above its own centre and ends level with it.
      const [ , topRight ] = path;
      expect(topRight.startX).toBeCloseTo(288, 6);
      expect(topRight.startY).toBeCloseTo(50, 6);
      expect(topRight.endX).toBeCloseTo(300, 6);
      expect(topRight.endY).toBeCloseTo(62, 6);
    });

    it('interrupts the top edge where the legend sits', () =>
    {
      // Arrange
      const gap = BubbleShape.legendGapFor(bubble(), 60);

      // Act
      const path = BubbleShape.outlinePath(bubble(), null, gap);

      // Assert- one more segment than a plain bubble, because the top edge became two runs.
      expect(path.length).toBe(9);
      expect(path[ 0 ].toX).toBe(118);
      expect(path[ 1 ].fromX).toBe(190);
      expect(path[ 1 ].toX).toBe(288);
    });

    it('detours around the mouth of a tail on the underside', () =>
    {
      // Arrange
      const tail = BubbleShape.tailFor(bubble(), 200, 400);

      // Act
      const path = BubbleShape.outlinePath(bubble(), tail, null);

      // Assert- three extra segments: the edge split in two, plus the tail's two sides.
      expect(path.length).toBe(11);
    });

    it('walks the underside tail in the direction it is travelling', () =>
    {
      // Arrange
      const tail = BubbleShape.tailFor(bubble(), 200, 400);

      // Act
      const path = BubbleShape.outlinePath(bubble(), tail, null);

      // Assert- the bottom edge is met from the right, so the pen reaches the far side of the mouth
      // first and descends from there. Emitting the tail left-to-right here would cut back through
      // the body before drawing it.
      expect(path[ 4 ]).toEqual({
        kind: 'line',
        fromX: 288,
        fromY: 150,
        toX: 209,
        toY: 150,
      });
      expect(path[ 5 ].toX).toBe(200);
      expect(path[ 5 ].toY).toBe(164);
      expect(path[ 6 ].toX).toBe(191);
      expect(path[ 7 ].toX).toBe(112);
    });

    it('walks a tail on the top edge in the other direction', () =>
    {
      // Arrange
      const tail = BubbleShape.tailFor(bubble(), 200, 10);

      // Act
      const path = BubbleShape.outlinePath(bubble(), tail, null);

      // Assert- the top edge is met from the left, so the near side of the mouth is the low one.
      expect(path[ 0 ].toX).toBe(191);
      expect(path[ 1 ].toY).toBe(36);
      expect(path[ 2 ].toX).toBe(209);

      // and the tail belongs to exactly one edge: eleven segments, not the fourteen an underside
      // that drew it as well would produce.
      expect(path.length).toBe(11);
    });

    it('keeps a tail off the edge it did not leave from', () =>
    {
      // Arrange & Act
      // the mirror of the assertion above, for the ordinary case.
      const tail = BubbleShape.tailFor(bubble(), 200, 400);
      const path = BubbleShape.outlinePath(bubble(), tail, null);

      // Assert- the top edge is a single uninterrupted run from corner to corner.
      expect(path[ 0 ]).toEqual({
        kind: 'line',
        fromX: 112,
        fromY: 50,
        toX: 288,
        toY: 50,
      });
    });

    it('steps around the legend and the tail together on one edge', () =>
    {
      // Arrange
      // a bubble pushed below its speaker still has a name on it, so both interruptions land on the
      // top edge and have to be met in the order the pen reaches them.
      const tail = BubbleShape.tailFor(bubble(), 250, 10);
      const gap = BubbleShape.legendGapFor(bubble(), 60);

      // Act
      const path = BubbleShape.outlinePath(bubble(), tail, gap);

      // Assert
      expect(path[ 0 ].toX).toBe(118);
      expect(path[ 1 ].fromX).toBe(190);
      expect(path[ 1 ].toX).toBe(241);
      expect(path[ 2 ].toY).toBe(36);
      expect(path[ 4 ].toX).toBe(288);
    });
  });
});
//endregion plugins/message/ext/bubbles/services/bubble-shape.test.js