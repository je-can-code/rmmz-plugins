//region BubbleShape
/**
 * The outline of a bubble, as a path something else can draw.
 *
 * A bubble is not a rectangle with decorations bolted on, and the reason is the legend. The speaker's
 * name is meant to sit *in* the border the way a `legend` sits in a `fieldset` - the border stopping
 * short on one side of the name and resuming on the other - and a border that stops has to be a path
 * rather than a shape. The same is true of the tail: it leaves the body through a mouth, and the
 * border has to walk out along one side of it and back along the other instead of drawing straight
 * across.
 *
 * Painting over an unwanted stretch of border in the fill colour would be far less code and is what
 * this deliberately does not do. It only looks right while the fill is opaque, and a bubble that can
 * never be translucent is a decision being made here on behalf of whoever picks the colours later.
 *
 * Everything is returned as plain descriptors - lines and arcs in window coordinates - because the
 * thing that draws them is a sprite, and sprites are where logic goes to become untestable.
 */
class BubbleShape
{
  /**
   * How far the corners of a bubble are rounded, in logical pixels.
   * @type {number}
   */
  static CornerRadius = 12;

  /**
   * How wide the mouth of the tail is where it leaves the body, in logical pixels.
   * @type {number}
   */
  static TailWidth = 18;

  /**
   * How far the tail reaches from the body toward whoever is speaking, in logical pixels.
   *
   * Fixed rather than stretching all the way to the speaker: a tail that spanned the real distance
   * would become a long thin wedge the moment the bubble was pushed away from its owner by the edge
   * of the screen, which reads as a leak rather than as pointing.
   * @type {number}
   */
  static TailLength = 14;

  /**
   * How far sideways the tail may lean, as a ratio of how far out it reaches.
   *
   * One is forty-five degrees. The lean exists so a tail aims at a speaker standing off to one side
   * rather than merely hanging over the nearest corner, and the cap exists because the aim stops
   * being the point past that: a speaker level with the bubble would otherwise drag the tail flat
   * along the edge, or - since the edge it leaves from is chosen from whether they are above or
   * below - fold it back up through the body it came out of.
   * @type {number}
   */
  static MaximumTailLean = 1;

  /**
   * How much clear border to leave either side of the legend, in logical pixels.
   * @type {number}
   */
  static LegendPadding = 6;

  /**
   * How far from the left corner the legend begins, in logical pixels.
   *
   * Comfortably past the corner radius plus the padding, so a short stub of border survives to the
   * left of the name. A legend flush against the corner reads as a label that has slipped off the
   * edge rather than as one set into the border.
   * @type {number}
   */
  static LegendInset = 24;

  /**
   * Where the tail leaves the body and where it points.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {number} targetX The horizontal position of whoever is speaking, in the same coordinates.
   * @param {number} targetY The vertical position of whoever is speaking, in the same coordinates.
   * @returns {{onTop: boolean, mouthStart: number, mouthEnd: number, tipX: number, tipY: number}}
   */
  static tailFor(bounds, targetX, targetY)
  {
    // a bubble normally floats above its speaker, so the tail normally leaves the underside. It
    // flips rather than bending when the bubble has been pushed below them - by the top of the
    // screen, usually - because a tail that curved back on itself would cross the body.
    const onTop = targetY < bounds.top;
    const edgeY = onTop === true
      ? bounds.top
      : bounds.bottom;

    const half = BubbleShape.TailWidth / 2;

    // the mouth sits as close to the speaker as the flat part of the edge allows, and no closer -
    // half a mouth opening into the corner arc would tear a hole in the border.
    const mouthCenter = BubbleShape.clampToStraightRun(bounds, targetX, half);

    const lean = BubbleShape.leanToward(mouthCenter, edgeY, targetX, targetY);
    const spread = Math.sqrt(1 + (lean * lean));
    const outward = onTop === true
      ? -1
      : 1;

    return {
      onTop,
      mouthStart: mouthCenter - half,
      mouthEnd: mouthCenter + half,
      tipX: mouthCenter + ((lean / spread) * BubbleShape.TailLength),
      tipY: edgeY + (outward * (BubbleShape.TailLength / spread)),
    };
  }

  /**
   * How far sideways the tail leans, per unit it reaches outward.
   *
   * Zero when the speaker is directly beyond the mouth, which is most of the time - a bubble is
   * placed over its owner, so the tail usually points straight at them without leaning at all. It
   * only tilts once the bubble has been pushed sideways off them, which is exactly when a tail that
   * did not tilt would stop looking like it was pointing at anybody.
   * @param {number} mouthCenter Where the tail leaves the body, horizontally.
   * @param {number} edgeY The border line the tail leaves from.
   * @param {number} targetX The horizontal position of whoever is speaking.
   * @param {number} targetY The vertical position of whoever is speaking.
   * @returns {number}
   */
  static leanToward(mouthCenter, edgeY, targetX, targetY)
  {
    const sideways = targetX - mouthCenter;

    // a speaker level with the edge divides by nothing, and one just past it divides by almost
    // nothing; both saturate the cap below, which is the answer either way.
    const outwardDistance = Math.max(Math.abs(targetY - edgeY), 1);
    const requested = sideways / outwardDistance;

    const notTooFarLeft = Math.max(requested, -BubbleShape.MaximumTailLean);

    return Math.min(notTooFarLeft, BubbleShape.MaximumTailLean);
  }

  /**
   * Holds a horizontal position inside the flat part of an edge, away from the rounded corners.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {number} x The position to hold.
   * @param {number} margin How much further in from the corner to stay.
   * @returns {number}
   */
  static clampToStraightRun(bounds, x, margin = 0)
  {
    const inset = BubbleShape.CornerRadius + margin;
    const leftLimit = bounds.left + inset;
    const rightLimit = bounds.right - inset;

    // a bubble narrower than its own corners has no straight run to speak of, so the two limits
    // cross and the honest answer is the middle of it.
    if (leftLimit > rightLimit) return (bounds.left + bounds.right) / 2;

    const notTooFarLeft = Math.max(x, leftLimit);

    return Math.min(notTooFarLeft, rightLimit);
  }

  /**
   * The stretch of the top border to leave undrawn so the legend can sit in it.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {number} legendWidth How wide the drawn name is, in logical pixels.
   * @returns {?{start: number, end: number}} The gap, or null when there is no name to make room
   * for - narration and signposts have no speaker, and their bubbles want an unbroken border.
   */
  static legendGapFor(bounds, legendWidth)
  {
    // nothing to carve around.
    if (legendWidth <= 0) return null;

    // the gap belongs to the flat part of the top edge. A gap that began inside the corner would
    // send the border backwards into the arc it had just come out of.
    const requested = bounds.left + BubbleShape.LegendInset - BubbleShape.LegendPadding;
    const start = Math.max(requested, bounds.left + BubbleShape.CornerRadius);
    const end = start + legendWidth + (BubbleShape.LegendPadding * 2);

    // a name wider than the bubble it belongs to would consume the whole top edge and both corners,
    // leaving a border that reads as broken rather than as carved. Better an overlapping name than
    // a missing border, and the name is the thing the reader can still parse.
    const straightRunEnd = bounds.right - BubbleShape.CornerRadius;
    if (end > straightRunEnd) return null;

    return { start, end };
  }

  /**
   * The whole outline, as the sequence of lines and arcs that walks it once, clockwise.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {?object} tail The tail as {@link tailFor} describes it, or null for no tail.
   * @param {?object} legendGap The gap as {@link legendGapFor} describes it, or null for no legend.
   * @returns {object[]} Line and arc descriptors, in drawing order.
   */
  static outlinePath(bounds, tail, legendGap)
  {
    const { CornerRadius } = BubbleShape;
    const segments = [];

    BubbleShape.appendTopEdge(segments, bounds, tail, legendGap);

    segments.push(BubbleShape.arc(bounds.right - CornerRadius, bounds.top + CornerRadius, -Math.PI / 2, 0));
    segments.push(BubbleShape.line(bounds.right, bounds.top + CornerRadius, bounds.right, bounds.bottom - CornerRadius));
    segments.push(BubbleShape.arc(bounds.right - CornerRadius, bounds.bottom - CornerRadius, 0, Math.PI / 2));

    BubbleShape.appendBottomEdge(segments, bounds, tail);

    segments.push(BubbleShape.arc(bounds.left + CornerRadius, bounds.bottom - CornerRadius, Math.PI / 2, Math.PI));
    segments.push(BubbleShape.line(bounds.left, bounds.bottom - CornerRadius, bounds.left, bounds.top + CornerRadius));
    segments.push(BubbleShape.arc(bounds.left + CornerRadius, bounds.top + CornerRadius, Math.PI, Math.PI * 1.5));

    return segments;
  }

  /**
   * Walks the top edge left to right, stepping around whatever interrupts it.
   * @param {object[]} segments The path being built.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {?object} tail The tail, which interrupts this edge only when it points upward.
   * @param {?object} legendGap The legend gap, which always interrupts this edge when present.
   */
  static appendTopEdge(segments, bounds, tail, legendGap)
  {
    const interruptions = [];

    if (legendGap !== null)
    {
      interruptions.push({
        start: legendGap.start,
        end: legendGap.end,
        apex: null,
      });
    }

    const tailIsHere = tail !== null && tail.onTop === true;
    if (tailIsHere === true)
    {
      interruptions.push(BubbleShape.tailInterruption(tail));
    }

    BubbleShape.appendHorizontalRun(
      segments,
      bounds.top,
      bounds.left + BubbleShape.CornerRadius,
      bounds.right - BubbleShape.CornerRadius,
      interruptions);
  }

  /**
   * Walks the bottom edge right to left, stepping around the tail if it leaves from here.
   * @param {object[]} segments The path being built.
   * @param {BubbleBounds} bounds The box the border encloses.
   * @param {?object} tail The tail, which interrupts this edge only when it points downward.
   */
  static appendBottomEdge(segments, bounds, tail)
  {
    const interruptions = [];

    const tailIsHere = tail !== null && tail.onTop === false;
    if (tailIsHere === true)
    {
      interruptions.push(BubbleShape.tailInterruption(tail));
    }

    BubbleShape.appendHorizontalRun(
      segments,
      bounds.bottom,
      bounds.right - BubbleShape.CornerRadius,
      bounds.left + BubbleShape.CornerRadius,
      interruptions);
  }

  /**
   * The mouth of the tail, and the point the border detours out to instead of crossing it.
   *
   * The two sides are not built here on purpose. Which one the pen walks first depends on which
   * direction it is travelling along the edge, and that is known one level up - describing the
   * detour by its far point instead lets the same interruption be walked correctly from either end.
   * @param {object} tail The tail as {@link tailFor} describes it.
   * @returns {{start: number, end: number, apex: {x: number, y: number}}}
   */
  static tailInterruption(tail)
  {
    return {
      start: tail.mouthStart,
      end: tail.mouthEnd,
      apex: {
        x: tail.tipX,
        y: tail.tipY,
      },
    };
  }

  /**
   * Emits one horizontal edge, in travel order, with its interruptions spliced in.
   *
   * The edge is walked in whichever direction the outline is going, so the interruptions are sorted
   * into that same order before anything is emitted - a tail on the bottom edge is met from the
   * right, and a detour emitted in left-to-right order there would double back through the body.
   * @param {object[]} segments The path being built.
   * @param {number} y The line this edge sits on.
   * @param {number} fromX Where the edge starts, in travel order.
   * @param {number} toX Where the edge ends, in travel order.
   * @param {object[]} interruptions The stretches to step around, in any order.
   */
  static appendHorizontalRun(segments, y, fromX, toX, interruptions)
  {
    const travellingRight = toX > fromX;
    const ordered = BubbleShape.inTravelOrder(interruptions, travellingRight);

    let penX = fromX;

    ordered.forEach(interruption =>
    {
      const nearEdge = travellingRight === true
        ? interruption.start
        : interruption.end;
      const farEdge = travellingRight === true
        ? interruption.end
        : interruption.start;

      segments.push(BubbleShape.line(penX, y, nearEdge, y));

      // no apex is the legend: the border simply is not there, and the pen lifts across the gap.
      if (interruption.apex !== null)
      {
        const { apex } = interruption;
        segments.push(BubbleShape.line(nearEdge, y, apex.x, apex.y));
        segments.push(BubbleShape.line(apex.x, apex.y, farEdge, y));
      }

      penX = farEdge;
    });

    segments.push(BubbleShape.line(penX, y, toX, y));
  }

  /**
   * Sorts interruptions into the order the pen will meet them.
   * @param {object[]} interruptions The stretches to step around.
   * @param {boolean} travellingRight Whether the pen is moving left to right.
   * @returns {object[]}
   */
  static inTravelOrder(interruptions, travellingRight)
  {
    const sorted = interruptions.slice()
      .sort((left, right) => left.start - right.start);

    if (travellingRight === true) return sorted;

    return sorted.reverse();
  }

  /**
   * One straight run of border.
   * @param {number} fromX Where it starts horizontally.
   * @param {number} fromY Where it starts vertically.
   * @param {number} toX Where it ends horizontally.
   * @param {number} toY Where it ends vertically.
   * @returns {{kind: string, fromX: number, fromY: number, toX: number, toY: number}}
   */
  static line(fromX, fromY, toX, toY)
  {
    return {
      kind: 'line',
      fromX,
      fromY,
      toX,
      toY,
    };
  }

  /**
   * One rounded corner.
   *
   * The two endpoints are carried alongside the angles that produced them, so that whoever draws
   * this never has to work out where an arc begins. That matters more than it looks: a canvas arc
   * draws a straight line from wherever the pen already is to its own start point, so a renderer
   * that guessed wrong would not fail visibly - it would quietly add a chord across the corner.
   * @param {number} centerX The centre of the circle the corner is cut from.
   * @param {number} centerY The centre of the circle the corner is cut from.
   * @param {number} startAngle Where on that circle the corner begins, in radians.
   * @param {number} endAngle Where on that circle the corner ends, in radians.
   * @returns {object}
   */
  static arc(centerX, centerY, startAngle, endAngle)
  {
    const radius = BubbleShape.CornerRadius;

    return {
      kind: 'arc',
      centerX,
      centerY,
      radius,
      startAngle,
      endAngle,
      startX: centerX + (radius * Math.cos(startAngle)),
      startY: centerY + (radius * Math.sin(startAngle)),
      endX: centerX + (radius * Math.cos(endAngle)),
      endY: centerY + (radius * Math.sin(endAngle)),
    };
  }

  /**
   * How far apart two points may be and still count as the same one, in logical pixels.
   *
   * Corner endpoints are derived through a sine and a cosine, so the point an arc ends on and the
   * point the next edge starts from agree to about fifteen decimal places rather than exactly.
   * @type {number}
   */
  static JoinTolerance = 0.001;

  /**
   * Whether one segment carries straight on from where the last one finished.
   *
   * What tells a renderer where to lift the pen. Everywhere this is true the border is one
   * continuous stroke and its corners join properly; the one place it is false is the legend, and
   * there the pen is meant to lift.
   * @param {object} previous The segment drawn before this one.
   * @param {object} segment The segment about to be drawn.
   * @returns {boolean}
   */
  static continuesFrom(previous, segment)
  {
    const previousEnd = BubbleShape.endOf(previous);
    const thisStart = BubbleShape.startOf(segment);

    const alignedHorizontally = Math.abs(previousEnd.x - thisStart.x) <= BubbleShape.JoinTolerance;
    const alignedVertically = Math.abs(previousEnd.y - thisStart.y) <= BubbleShape.JoinTolerance;

    return alignedHorizontally === true && alignedVertically === true;
  }

  /**
   * Where a segment of either kind begins.
   * @param {object} segment A line or an arc.
   * @returns {{x: number, y: number}}
   */
  static startOf(segment)
  {
    if (segment.kind === 'arc')
    {
      return {
        x: segment.startX,
        y: segment.startY,
      };
    }

    return {
      x: segment.fromX,
      y: segment.fromY,
    };
  }

  /**
   * Where a segment of either kind ends.
   * @param {object} segment A line or an arc.
   * @returns {{x: number, y: number}}
   */
  static endOf(segment)
  {
    if (segment.kind === 'arc')
    {
      return {
        x: segment.endX,
        y: segment.endY,
      };
    }

    return {
      x: segment.toX,
      y: segment.toY,
    };
  }
}

export default BubbleShape;
//endregion BubbleShape