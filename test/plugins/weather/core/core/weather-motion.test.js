//region plugins/weather/core/core/weather-motion.test.js
import { describe, expect, it } from 'vitest';
import WeatherMotion from '../../../../../src/plugins/weather/core/core/WeatherMotion.js';

/**
 * The arithmetic that moves one particle of ambience across the screen.
 *
 * Every method here is pure by construction - randomness is handed in as four rolls - so every case
 * below pins an exact number rather than a range. Where the code selects by identity, as the edge
 * resolvers do, each case is written beside a sibling that has to come out differently; a resolver
 * that returned one edge for everything would otherwise sail through a suite that only ever asked
 * it about one direction.
 */
describe('WeatherMotion', () =>
{
  // the engine's own screen, so the numbers below are the numbers a running game produces.
  const bounds = {
    width: 816,
    height: 624,
  };

  /**
   * Builds motion parameters for a gentle downward drift, overridable per case.
   * @param {object} overrides Whatever this case needs to differ on.
   * @returns {object}
   */
  const buildParams = (overrides = {}) => ({
    edge: WeatherMotion.Edges.Top,
    speedX: 0,
    speedY: 3,
    jitterX: 0,
    jitterY: 2,
    roll: 0,
    scale: 1,
    scaleJitter: 0.5,
    growth: 0,
    fadeIn: 25,
    staggerFrames: 120,
    ...overrides,
  });

  /**
   * Four rolls, all at the midpoint, overridable per case.
   * @param {object} overrides Whatever this case needs to differ on.
   * @returns {{along: number, speed: number, scale: number, stagger: number}}
   */
  const buildRolls = (overrides = {}) => ({
    along: 0.5,
    across: 0.5,
    speedX: 0.5,
    speedY: 0.5,
    scale: 0.5,
    stagger: 0.5,
    life: 0.5,
    edge: 0.5,
    phase: 0.5,
    flip: 0.5,
    pulse: 0.5,
    tilt: 0.5,
    stretchX: 0.5,
    stretchY: 0.5,
    ...overrides,
  });

  describe('originOn', () =>
  {
    it('places a particle entering from the top above the screen', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.originOn(WeatherMotion.Edges.Top, bounds, buildRolls(), WeatherMotion.DefaultMargin, buildParams());

      // Assert - spread across the width plus a margin each side, a full margin above.
      expect(result)
        .toEqual({
          x: 408,
          y: -256,
        });
    });

    it('places a particle entering from the bottom below the screen', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.originOn(WeatherMotion.Edges.Bottom, bounds, buildRolls(), WeatherMotion.DefaultMargin, buildParams());

      // Assert.
      expect(result)
        .toEqual({
          x: 408,
          y: 880,
        });
    });

    it('places a particle entering from the left beyond the left edge', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.originOn(WeatherMotion.Edges.Left, bounds, buildRolls(), WeatherMotion.DefaultMargin, buildParams());

      // Assert - the spread axis is now vertical, so the same roll gives a different number.
      expect(result)
        .toEqual({
          x: -256,
          y: 312,
        });
    });

    it('places a particle entering from the right beyond the right edge', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.originOn(WeatherMotion.Edges.Right, bounds, buildRolls(), WeatherMotion.DefaultMargin, buildParams());

      // Assert.
      expect(result)
        .toEqual({
          x: 1072,
          y: 312,
        });
    });

    it('queues an entering particle back along its own direction of travel', () =>
    {
      // Arrange - without this every respawn lands on one coordinate, and a population that left at
      // different times re-enters at different times and then travels as one band. That reads as
      // waves of cloud rather than a field, and density cannot fix it because the density is all in
      // the wave.
      const result = WeatherMotion.originOn(
        WeatherMotion.Edges.Left,
        bounds,
        buildRolls({ across: 0.5 }),
        WeatherMotion.DefaultMargin,
        { entryDepth: 1600 });

      // Assert - a full margin out, and half the queue further back again.
      expect(result.x)
        .toBe(-1056);
    });

    it('enters at the margin exactly when the motion asks for no queue', () =>
    {
      // Arrange - a thousand raindrops re-entering at one coordinate still look like rain.
      const result = WeatherMotion.originOn(
        WeatherMotion.Edges.Left,
        bounds,
        buildRolls({ across: 0.5 }),
        WeatherMotion.DefaultMargin,
        {});

      // Assert.
      expect(result.x)
        .toBe(-256);
    });

    it('scatters an opening particle across the screen rather than at an edge', () =>
    {
      // Arrange - the population that exists the instant weather starts. queued at an edge, a drift
      // of a tenth of a pixel a frame leaves the screen empty for a minute and a half.
      const result = WeatherMotion.originOn(
        WeatherMotion.Edges.Anywhere,
        bounds,
        buildRolls({
          along: 0.25,
          across: 0.75,
        }),
        WeatherMotion.DefaultMargin,
        buildParams());

      // Assert - inside the screen on both axes, and the margin plays no part.
      expect(result)
        .toEqual({
          x: 204,
          y: 468,
        });
    });

    it('spreads along the edge with the roll rather than ignoring it', () =>
    {
      // Arrange - a quarter of the way along, which must not land where the midpoint did.
      const result = WeatherMotion.originOn(WeatherMotion.Edges.Top, bounds, buildRolls({ along: 0.25 }), WeatherMotion.DefaultMargin, buildParams());

      // Assert.
      expect(result)
        .toEqual({
          x: 76,
          y: -256,
        });
    });
  });

  describe('spawn', () =>
  {
    it('builds a particle from its parameters and its rolls', () =>
    {
      // Arrange.
      const params = buildParams();

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls());

      // Assert - velocity takes half its jitter, scale takes half of its own, the stagger is
      // floored into whole frames, and the wander begins half a turn in.
      expect(result)
        .toEqual({
          x: 408,
          y: -256,
          velocityX: 0,
          velocityY: 4,
          rotation: 0,
          scaleX: 1.25,
          scaleY: 1.25,
          opacity: 0,
          stagger: 60,
          phase: Math.PI,
          age: 0,
          flipPhase: 0,
          pulsePhase: 0,
          stage: 0,
          life: 0,
          done: false,
        });
    });

    it('points a particle inward from the edge it entered by', () =>
    {
      // Arrange - a motion that drifts rightward, entering from the right. chosen separately these
      // contradict, and the particle leaves on the frame it arrives - forever.
      const params = buildParams({
        speedX: 2,
        jitterX: 0,
        speedY: 0,
        jitterY: 0,
      });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Right, buildRolls());

      // Assert - same speed, aimed back across the screen.
      expect(result.velocityX)
        .toBe(-2);
    });

    it('turns a particle around when it entered by the edge it was heading for', () =>
    {
      // Arrange - a leftward drift entering from the left. the mirror of the case above, and the one
      // that proves the low edge is actually being tested rather than merely falling through: a
      // version that ignored it would hand this particle straight back out of the door it came in.
      const params = buildParams({
        speedX: -2,
        jitterX: 0,
        speedY: 0,
        jitterY: 0,
      });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Left, buildRolls());

      // Assert.
      expect(result.velocityX)
        .toBe(2);
    });

    it('leaves the other axis alone when orienting to an edge', () =>
    {
      // Arrange - a raindrop entering from the left still has to fall.
      const params = buildParams({
        speedX: 1,
        jitterX: 0,
        speedY: 4,
        jitterY: 0,
      });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Left, buildRolls());

      // Assert.
      expect(result.velocityX)
        .toBe(1);
      expect(result.velocityY)
        .toBe(4);
    });

    it('varies particle size when the layer asked for variance', () =>
    {
      // Arrange - a field of identical sprites reads as a repeated sprite however it is arranged.
      const params = buildParams({
        scale: 1.4,
        scaleJitter: 0.8,
      });

      // Act.
      const small = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ scale: 0 }));
      const large = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ scale: 1 }));

      // Assert.
      expect(small.scaleX)
        .toBe(1.4);
      expect(large.scaleX)
        .toBeCloseTo(2.2, 10);
    });

    it('gives two particles different velocities when their speed rolls differ', () =>
    {
      // Arrange - the same motion, rolled differently. a spawn that ignored the roll would hand back
      // two identical particles and a downpour would fall as a rigid grid.
      const params = buildParams();

      // Act.
      const slow = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ speedY: 0 }));
      const fast = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ speedY: 1 }));

      // Assert.
      expect(slow.velocityY)
        .toBe(3);
      expect(fast.velocityY)
        .toBe(5);
    });

    it('rolls the two axes separately, so a population does not travel as one rigid sheet', () =>
    {
      // Arrange - a motion that jitters on both axes by the same amount. sharing one roll would
      // make the gap between the two velocities identical for every particle ever born.
      const params = buildParams({
        speedX: 1,
        speedY: 1,
        jitterX: 2,
        jitterY: 2,
      });

      // Act.
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({
        speedX: 0.25,
        speedY: 0.75,
      }));

      // Assert - 1 + 2*0.25 across, 1 + 2*0.75 down; one shared roll could not produce both.
      expect(particle.velocityX)
        .toBe(1.5);
      expect(particle.velocityY)
        .toBe(2.5);
    });
  });

  describe('resolveEdge', () =>
  {
    it('hands back a fixed edge untouched', () =>
    {
      // Arrange - a motion that names its edge does not care where the player is walking.
      const params = buildParams({ edge: WeatherMotion.Edges.Left });

      // Act.
      const result = WeatherMotion.resolveEdge(params, {
        x: 0,
        y: 4,
      });

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Left);
    });

    it('throws particles at a player walking right', () =>
    {
      // Arrange - horizontal travel dominates, so the vertical component must not win. the motion
      // is a sideways one, because only a sideways one can be entered from the side at all.
      const params = buildParams({
        edge: WeatherMotion.Edges.Leading,
        speedX: 3,
        speedY: 0,
      });

      // Act.
      const result = WeatherMotion.resolveEdge(params, {
        x: 4,
        y: 1,
      });

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Right);
    });

    it('throws particles at a player walking left', () =>
    {
      // Arrange.
      const params = buildParams({
        edge: WeatherMotion.Edges.Leading,
        speedX: 3,
        speedY: 0,
      });

      // Act.
      const result = WeatherMotion.resolveEdge(params, {
        x: -4,
        y: 1,
      });

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Left);
    });

    it('throws particles at a player walking down', () =>
    {
      // Arrange - vertical travel dominates this time.
      const params = buildParams({ edge: WeatherMotion.Edges.Leading });

      // Act.
      const result = WeatherMotion.resolveEdge(params, {
        x: 1,
        y: 4,
      });

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Bottom);
    });

    it('throws particles at a player walking up', () =>
    {
      // Arrange.
      const params = buildParams({ edge: WeatherMotion.Edges.Leading });

      // Act.
      const result = WeatherMotion.resolveEdge(params, {
        x: 1,
        y: -4,
      });

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Top);
    });

    it('falls back to the motion own direction for a player standing still', () =>
    {
      // Arrange - nobody is moving, so there is no face to throw anything at. the motion deliberately
      // *rises*, because a falling one answers Top and so does a vertical branch that mistakenly
      // claimed a stationary player - and then the two are indistinguishable.
      const params = buildParams({
        edge: WeatherMotion.Edges.Leading,
        speedX: 0,
        speedY: -4,
      });

      // Act.
      const result = WeatherMotion.resolveEdge(params, {
        x: 0,
        y: 0,
      });

      // Assert - embers rise, so they are drawn from beneath the screen.
      expect(result)
        .toBe(WeatherMotion.Edges.Bottom);
    });
  });

  describe('entryEdgeFor', () =>
  {
    // the real screen, because flux weighting turns on the ratio between the two edge lengths and a
    // square one would hide getting that backwards.
    const screen = {
      width: 1920,
      height: 1080,
    };

    it('draws a purely sideways motion from the side it travels away from', () =>
    {
      // Arrange & Act - fog, which crawls right and has no vertical travel at all.
      const result = WeatherMotion.entryEdgeFor(buildParams({
        speedX: 1.2,
        speedY: 0,
      }), screen, WeatherMotion.Edges.Left, 0.99);

      // Assert - the roll is nearly 1, and must still not conjure a vertical edge out of no flux.
      expect(result)
        .toBe(WeatherMotion.Edges.Left);
    });

    it('draws a purely falling motion from the top however the roll lands', () =>
    {
      // Arrange & Act - rain, with no sideways travel.
      const result = WeatherMotion.entryEdgeFor(buildParams({
        speedX: 0,
        speedY: 4,
      }), screen, WeatherMotion.Edges.Top, 0);

      // Assert - a roll of zero would pick the horizontal edge if flux were not consulted.
      expect(result)
        .toBe(WeatherMotion.Edges.Top);
    });

    it('sends a low roll on a diagonal motion in through the side', () =>
    {
      // Arrange - snow drift: 0.4 across a 1080-tall side is 432 of flux, 0.3 down a 1920-wide top
      // is 576. the side therefore takes the first 432/1008 of the roll.
      const params = buildParams({
        speedX: 0.4,
        speedY: 0.3,
      });

      // Act.
      const result = WeatherMotion.entryEdgeFor(params, screen, WeatherMotion.Edges.Left, 0.42);

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Left);
    });

    it('sends a high roll on the same motion in through the top', () =>
    {
      // Arrange - the near-miss sibling of the case above, either side of 0.4286.
      const params = buildParams({
        speedX: 0.4,
        speedY: 0.3,
      });

      // Act.
      const result = WeatherMotion.entryEdgeFor(params, screen, WeatherMotion.Edges.Left, 0.44);

      // Assert - the slower axis wins the larger share, because its edge is the longer one.
      expect(result)
        .toBe(WeatherMotion.Edges.Top);
    });

    it('draws from the right and the bottom for a motion heading up and to the left', () =>
    {
      // Arrange - embers rising leftward. every sign is flipped, so an implementation that assumed
      // down-and-right would hand back the two opposite edges.
      const params = buildParams({
        speedX: -0.4,
        speedY: -1.2,
      });

      // Act.
      const low = WeatherMotion.entryEdgeFor(params, screen, WeatherMotion.Edges.Bottom, 0);
      const high = WeatherMotion.entryEdgeFor(params, screen, WeatherMotion.Edges.Bottom, 0.99);

      // Assert.
      expect(low)
        .toBe(WeatherMotion.Edges.Right);
      expect(high)
        .toBe(WeatherMotion.Edges.Bottom);
    });

    it('follows the heading edge when it has flipped the motion around', () =>
    {
      // Arrange - fog crawling right, but the player is walking right, so the heading edge is the
      // right one and the motion is turned around to meet them. it must then be drawn from the
      // right, not from the left the raw speed would suggest.
      const params = buildParams({
        speedX: 1.2,
        speedY: 0,
      });

      // Act.
      const result = WeatherMotion.entryEdgeFor(params, screen, WeatherMotion.Edges.Right, 0.5);

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Right);
    });

    it('still draws falling weather from the top when the heading edge is a side', () =>
    {
      // Arrange - rain, with the player walking left, so `leading` made Left the heading edge. rain
      // does not start coming in sideways because somebody walked west.
      const params = buildParams({
        speedX: 0,
        speedY: 4,
      });

      // Act.
      const result = WeatherMotion.entryEdgeFor(params, screen, WeatherMotion.Edges.Left, 0.5);

      // Assert - the heading edge names a side with no flux through it; the top has all of it.
      expect(result)
        .toBe(WeatherMotion.Edges.Top);
    });

    it('still draws sideways weather from the side when the heading edge is the top', () =>
    {
      // Arrange - the fog that emptied the map: crawling sideways, with the player walking north so
      // `leading` made Top the heading edge. entering from the top, it would be swept out the side
      // before it ever descended into view.
      const params = buildParams({
        speedX: 1.2,
        speedY: 0,
      });

      // Act.
      const result = WeatherMotion.entryEdgeFor(params, screen, WeatherMotion.Edges.Top, 0.5);

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Left);
    });

    it('falls back to the heading edge for a motion that travels on neither axis', () =>
    {
      // Arrange & Act - pure jitter has no upstream edge to be drawn from. the heading edge is a
      // real one rather than `anywhere`, so this exercises the zero-flux fallback rather than the
      // scatter shortcut above it.
      const result = WeatherMotion.entryEdgeFor(buildParams({
        speedX: 0,
        speedY: 0,
      }), screen, WeatherMotion.Edges.Top, 0.5);

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Top);
    });

    it('leaves a scattered motion scattered rather than picking an edge for it', () =>
    {
      // Arrange - a motion that appears all over the screen is not entering from anywhere, so it
      // has no upstream edge. The speeds are deliberately nonzero, or the zero-flux fallback below
      // would hand back the same answer for the wrong reason.
      const params = buildParams({
        speedX: 0.4,
        speedY: -0.35,
      });

      // Act.
      const result = WeatherMotion.entryEdgeFor(params, screen, WeatherMotion.Edges.Anywhere, 0.5);

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Anywhere);
    });
  });

  describe('travelEdgeFor', () =>
  {
    it('reports no edge at all for a player standing still', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.travelEdgeFor({
        x: 0,
        y: 0,
      });

      // Assert.
      expect(result)
        .toBe(String.empty);
    });
  });

  describe('restingEdgeFor', () =>
  {
    it('draws from the left for a motion travelling right', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.restingEdgeFor(buildParams({
        speedX: 4,
        speedY: 1,
      }));

      // Assert - spawning on the right would retire it immediately.
      expect(result)
        .toBe(WeatherMotion.Edges.Left);
    });

    it('draws from the right for a motion travelling left', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.restingEdgeFor(buildParams({
        speedX: -4,
        speedY: 1,
      }));

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Right);
    });

    it('draws from the top for a motion falling', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.restingEdgeFor(buildParams({
        speedX: 1,
        speedY: 4,
      }));

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Top);
    });

    it('draws from the bottom for a motion rising', () =>
    {
      // Arrange - embers over a lava flow, which is the one CA effect that travels upward.
      const result = WeatherMotion.restingEdgeFor(buildParams({
        speedX: 1,
        speedY: -4,
      }));

      // Assert.
      expect(result)
        .toBe(WeatherMotion.Edges.Bottom);
    });
  });

  describe('advance', () =>
  {
    it('counts a staggered particle down without moving it', () =>
    {
      // Arrange - still waiting its turn to exist.
      const particle = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls());

      // Act.
      WeatherMotion.advance(particle, buildParams());

      // Assert - one frame closer to arriving, and not one pixel further down.
      expect(particle.stagger)
        .toBe(59);
      expect(particle.y)
        .toBe(-256);
      expect(particle.opacity)
        .toBe(0);
    });

    it('fades a particle out once it is near the end of its life', () =>
    {
      // Arrange - 4 frames left and 40 opacity to shed at 10 a frame, so the fade is due to start.
      const params = buildParams({
        life: 100,
        fadeOut: 10,
        fadeIn: 25,
      });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));
      particle.age = 95;
      particle.opacity = 40;

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert - down by the fade rather than up by the fadeIn, which would have reached 65.
      expect(particle.opacity)
        .toBe(30);
    });

    it('still fades a long-lived particle in while it has time in hand', () =>
    {
      // Arrange - the near-miss sibling: the same mortal motion, early in its life.
      const params = buildParams({
        life: 100,
        fadeOut: 10,
        fadeIn: 25,
      });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));
      particle.age = 10;
      particle.opacity = 40;

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.opacity)
        .toBe(65);
    });

    it('never fades a particle past the strength its layer allows', () =>
    {
      // Arrange - a shading layer, already at its cap. fading on past it is what turns a shadow
      // into an opaque cloud sitting on top of the world.
      const params = buildParams({
        peakOpacity: 77,
        fadeIn: 25,
      });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));
      particle.opacity = 77;

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.opacity)
        .toBe(77);
    });

    it('ages a particle by a frame', () =>
    {
      // Arrange.
      const params = buildParams();
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.age)
        .toBe(1);
    });

    it('moves a particle once its stagger has run out', () =>
    {
      // Arrange - rolled to zero stagger, so it is live on its first frame.
      const params = buildParams({ roll: 0.1 });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.y)
        .toBe(-252);
      expect(particle.rotation)
        .toBe(0.1);
      expect(particle.opacity)
        .toBe(25);
    });

    it('grows a particle that was built to grow', () =>
    {
      // Arrange - a zooming motion, beside the scale it started at.
      const params = buildParams({ growth: 0.05 });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.scaleX)
        .toBe(1.3);
      expect(particle.scaleY)
        .toBe(1.3);
    });

    it('holds opacity at full rather than climbing past it', () =>
    {
      // Arrange - already fully faded in, with a fade that would overshoot.
      const params = buildParams();
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));
      particle.opacity = 250;

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert - clamped, while the position proves the move actually ran.
      expect(particle.opacity)
        .toBe(255);
      expect(particle.y)
        .toBe(-252);
    });
  });

  describe('hasEscaped', () =>
  {
    /**
     * Builds a particle sitting at a given point, with nothing else that matters.
     * @param {number} x Where it is horizontally.
     * @param {number} y Where it is vertically.
     * @returns {object}
     */
    const particleAt = (x, y) => ({
      x,
      y,
    });

    it('retires a particle past the left margin', () =>
    {
      // Arrange & Act & Assert.
      expect(WeatherMotion.hasEscaped(particleAt(-257, 300), bounds, buildParams()))
        .toBe(true);
    });

    it('retires a particle past the right margin', () =>
    {
      // Arrange & Act & Assert.
      expect(WeatherMotion.hasEscaped(particleAt(1073, 300), bounds, buildParams()))
        .toBe(true);
    });

    it('retires a particle past the top margin', () =>
    {
      // Arrange & Act & Assert.
      expect(WeatherMotion.hasEscaped(particleAt(400, -257), bounds, buildParams()))
        .toBe(true);
    });

    it('retires a particle past the bottom margin', () =>
    {
      // Arrange & Act & Assert.
      expect(WeatherMotion.hasEscaped(particleAt(400, 881), bounds, buildParams()))
        .toBe(true);
    });

    it('keeps a particle still inside the margin', () =>
    {
      // Arrange - exactly on every boundary rather than comfortably within, since the boundary is
      // where an off-by-one lives.
      const result = WeatherMotion.hasEscaped(particleAt(-256, 880), bounds, buildParams());

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('keeps a particle in open screen', () =>
    {
      // Arrange & Act & Assert - the ordinary case, which must survive all four tests.
      expect(WeatherMotion.hasEscaped(particleAt(400, 300), bounds, buildParams()))
        .toBe(false);
    });

    it('keeps a wide-margin particle that a default margin would have retired', () =>
    {
      // Arrange - a fog bank, drawn near a thousand pixels across. at the default margin it would be
      // retired while half of it was still on screen, which reads as fog blinking out at the edge.
      const fog = buildParams({ margin: 600 });

      // Act & Assert - the same position, judged differently.
      expect(WeatherMotion.hasEscaped(particleAt(-400, 300), bounds, fog))
        .toBe(false);
      expect(WeatherMotion.hasEscaped(particleAt(-400, 300), bounds, buildParams()))
        .toBe(true);
    });
  });

  describe('applySway', () =>
  {
    /**
     * Builds a particle sitting at the origin, part-way through its wander.
     * @param {object} overrides Whatever this case needs to differ on.
     * @returns {object}
     */
    const buildParticle = (overrides = {}) => ({
      x: 100,
      y: 100,
      velocityX: 0,
      velocityY: 1,
      rotation: 0,
      scale: 1,
      opacity: 255,
      stagger: 0,
      phase: 0,
      ...overrides,
    });

    it('leaves a particle alone when its motion does not wander', () =>
    {
      // Arrange - rain, which genuinely does fall in a straight line. the rate is set and the
      // amplitude is not, which is how an author half-configures a wander - and is the only way to
      // tell "returned early" apart from "did the arithmetic and it came to nothing".
      const particle = buildParticle();
      const params = buildParams({
        sway: 0,
        swayRate: 0.25,
      });

      // Act.
      WeatherMotion.applySway(particle, params);

      // Assert - neither axis moved, and the phase did not advance either.
      expect(particle.x)
        .toBe(100);
      expect(particle.y)
        .toBe(100);
      expect(particle.phase)
        .toBe(0);
    });

    it('wanders a mainly-vertical motion from side to side', () =>
    {
      // Arrange - an ember climbing, which should weave across its own heading.
      const particle = buildParticle();
      const params = buildParams({
        speedX: 0.15,
        speedY: -1.2,
        sway: 10,
        swayRate: Math.PI / 2,
      });

      // Act - a quarter turn from zero, so sin goes 0 to 1 and the full amplitude lands.
      WeatherMotion.applySway(particle, params);

      // Assert.
      expect(particle.x)
        .toBe(110);
      expect(particle.y)
        .toBe(100);
    });

    it('wanders a mainly-horizontal motion up and down instead', () =>
    {
      // Arrange - the near-miss sibling: the same wander on a motion travelling the other way,
      // which must come out on the other axis or the wander is along the heading rather than across.
      const particle = buildParticle();
      const params = buildParams({
        speedX: 2.5,
        speedY: 0,
        sway: 10,
        swayRate: Math.PI / 2,
      });

      // Act.
      WeatherMotion.applySway(particle, params);

      // Assert.
      expect(particle.y)
        .toBe(110);
      expect(particle.x)
        .toBe(100);
    });

    it('carries the wander onward from where the phase left off', () =>
    {
      // Arrange - already a quarter turn in, at the top of the sine.
      const particle = buildParticle({ phase: Math.PI / 2 });
      const params = buildParams({
        speedX: 0.15,
        speedY: -1.2,
        sway: 10,
        swayRate: Math.PI / 2,
      });

      // Act - another quarter turn takes sin from 1 back to 0, so it swings back.
      WeatherMotion.applySway(particle, params);

      // Assert - the same call that pushed the last particle +10 pulls this one -10.
      expect(particle.x)
        .toBe(90);
    });

    it('advances the phase by the motion own rate', () =>
    {
      // Arrange.
      const particle = buildParticle();
      const params = buildParams({
        sway: 10,
        swayRate: 0.25,
      });

      // Act.
      WeatherMotion.applySway(particle, params);

      // Assert.
      expect(particle.phase)
        .toBe(0.25);
    });
  });

  describe('tilt and stretch', () =>
  {
    it('lands a particle upright when its motion asks for no tilt', () =>
    {
      // Arrange - a raindrop rotated at random is not a raindrop.
      const result = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls({ tilt: 0.75 }));

      // Assert - the roll is a long way from zero, so only the absent knob can explain this.
      expect(result.rotation)
        .toBe(0);
    });

    it('turns a particle by its share of a full turn', () =>
    {
      // Arrange - free to face any direction, rolled three quarters of the way round.
      const params = buildParams({ tilt: 1 });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ tilt: 0.75 }));

      // Assert.
      expect(result.rotation)
        .toBeCloseTo(Math.PI * 1.5, 10);
    });

    it('limits the turn to the fraction the motion allows', () =>
    {
      // Arrange - the near-miss sibling: the same roll against a motion that only leans a little.
      const params = buildParams({ tilt: 0.1 });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ tilt: 0.75 }));

      // Assert.
      expect(result.rotation)
        .toBeCloseTo(Math.PI * 0.15, 10);
    });

    it('points a whole population the same way when its motion leans', () =>
    {
      // Arrange - shafts of light all come from one sun, so they agree on an angle. no tilt, so
      // the roll must not move this one off it.
      const params = buildParams({ lean: 0.25 });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ tilt: 0.9 }));

      // Assert - a quarter turn, regardless of a roll that would have swung it most of the way round.
      expect(result.rotation)
        .toBeCloseTo(Math.PI / 2, 10);
    });

    it('lets a particle depart from the shared angle by its own tilt', () =>
    {
      // Arrange - the near-miss sibling: the same lean, now with a little looseness allowed.
      const params = buildParams({
        lean: 0.25,
        tilt: 0.1,
      });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ tilt: 0.5 }));

      // Assert - a quarter turn plus a twentieth, so the two combine rather than one winning.
      expect(result.rotation)
        .toBeCloseTo(Math.PI * 0.6, 10);
    });

    it('keeps a particle proportional when its motion asks for no stretch', () =>
    {
      // Arrange & Act - the axis rolls disagree hard, and must still produce a square particle.
      const result = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls({
        stretchX: 0,
        stretchY: 1,
      }));

      // Assert.
      expect(result.scaleX)
        .toBe(result.scaleY);
    });

    it('pulls the two axes apart by the fraction the motion allows', () =>
    {
      // Arrange - a base size of 1.25 with the axes rolled to opposite extremes of a 40% stretch.
      const params = buildParams({ stretch: 0.4 });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({
        stretchX: 0,
        stretchY: 1,
      }));

      // Assert - 1.25 times 0.6 and 1.4 respectively.
      expect(result.scaleX)
        .toBeCloseTo(0.75, 10);
      expect(result.scaleY)
        .toBeCloseTo(1.75, 10);
    });

    it('stretches both axes from one shared size rather than rolling size twice', () =>
    {
      // Arrange - both axes rolled to the midpoint, so the stretch cancels and only the shared
      // size is left. A size rolled per axis would let these two differ.
      const params = buildParams({ stretch: 0.4 });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({
        scale: 1,
        stretchX: 0.5,
        stretchY: 0.5,
      }));

      // Assert - the full jittered size, unstretched, on both axes.
      expect(result.scaleX)
        .toBe(1.5);
      expect(result.scaleY)
        .toBe(1.5);
    });
  });

  describe('turning over', () =>
  {
    it('draws a still particle at its full width', () =>
    {
      // Arrange & Act - a raindrop does not turn over, and must not be scaled by a cosine.
      const result = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls({ flip: 0.4 }));

      // Assert - the roll is well away from zero, so only the absent knob keeps this at full width.
      expect(WeatherMotion.facingScaleX(result))
        .toBe(result.scaleX);
    });

    it('starts a turning particle somewhere of its own', () =>
    {
      // Arrange - a quarter of the way over is edge-on, which is the most obvious place to land.
      const params = buildParams({ flip: 0.05 });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ flip: 0.25 }));

      // Assert - cos of a quarter turn is zero, so it is drawn as a line.
      expect(WeatherMotion.facingScaleX(result))
        .toBeCloseTo(0, 10);
    });

    it('draws the back of a particle that has turned past edge-on', () =>
    {
      // Arrange - half a turn over, showing its other face.
      const params = buildParams({ flip: 0.05 });

      // Act.
      const result = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ flip: 0.5 }));

      // Assert - a negative width, which the renderer draws mirrored.
      expect(WeatherMotion.facingScaleX(result))
        .toBeCloseTo(-result.scaleX, 10);
    });

    it('turns a particle further over with every frame', () =>
    {
      // Arrange.
      const params = buildParams({ flip: 0.08 });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({
        flip: 0,
        stagger: 0,
      }));

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.flipPhase)
        .toBe(0.08);
    });
  });

  describe('dragOf', () =>
  {
    it('reads the speed a motion sheds', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.dragOf(buildParams({ drag: 0.02 }));

      // Assert.
      expect(result)
        .toBe(0.02);
    });

    it('lets a motion that says nothing keep all of its speed', () =>
    {
      // Arrange & Act - rain falls at terminal velocity and must not slow on the way past.
      const result = WeatherMotion.dragOf(buildParams());

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('slows a dragging particle a little each frame', () =>
    {
      // Arrange - a tenth shed per frame, from a clean 4 downward.
      const params = buildParams({
        drag: 0.1,
        speedY: 4,
        jitterY: 0,
      });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.velocityY)
        .toBeCloseTo(3.6, 10);
    });

    it('leaves a particle with no drag travelling exactly as fast', () =>
    {
      // Arrange - the near-miss sibling: the same motion without the knob.
      const params = buildParams({
        speedY: 4,
        jitterY: 0,
      });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ stagger: 0 }));

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.velocityY)
        .toBe(4);
    });
  });

  describe('lifespanFor', () =>
  {
    it('gives a particle the base lifetime when its motion adds no variance', () =>
    {
      // Arrange & Act - the roll is at one extreme and must still change nothing.
      const result = WeatherMotion.lifespanFor(buildParams({ life: 80 }), 1);

      // Assert.
      expect(result)
        .toBe(80);
    });

    it('stretches a lifetime by the motion own variance', () =>
    {
      // Arrange & Act - rain that all lived the same span would land along one line.
      const result = WeatherMotion.lifespanFor(buildParams({
        life: 30,
        lifeJitter: 130,
      }), 0.5);

      // Assert.
      expect(result)
        .toBe(95);
    });

    it('leaves an immortal particle immortal however the roll lands', () =>
    {
      // Arrange & Act - the near-miss sibling: variance declared against no lifetime at all, which
      // must not quietly give a raindrop a death.
      const result = WeatherMotion.lifespanFor(buildParams({ lifeJitter: 130 }), 1);

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('lifeJitterOf', () =>
  {
    it('reads the variance a motion asks for', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.lifeJitterOf(buildParams({ lifeJitter: 130 }));

      // Assert.
      expect(result)
        .toBe(130);
    });

    it('gives a motion that says nothing no variance at all', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.lifeJitterOf(buildParams());

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('succeed', () =>
  {
    it('stands the successor exactly where its predecessor finished', () =>
    {
      // Arrange - a shooting star burning out somewhere in the middle of the sky.
      const dying = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls());
      dying.x = 412;
      dying.y = 233;

      // Act.
      const result = WeatherMotion.succeed(dying, buildParams(), bounds, buildRolls());

      // Assert - spawning normally would have placed it at the top edge, not here.
      expect(result.x)
        .toBe(412);
      expect(result.y)
        .toBe(233);
    });

    it('gives the successor the next stage along', () =>
    {
      // Arrange.
      const dying = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls());

      // Act.
      const result = WeatherMotion.succeed(dying, buildParams(), bounds, buildRolls());

      // Assert.
      expect(result.stage)
        .toBe(1);
    });

    it('gives the successor nothing to wait for', () =>
    {
      // Arrange - a spawned particle normally waits out a stagger, but a successor is already
      // standing where it belongs and must not blink in.
      const dying = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls());

      // Act.
      const result = WeatherMotion.succeed(dying, buildParams({ staggerFrames: 400 }), bounds, buildRolls());

      // Assert.
      expect(result.stagger)
        .toBe(0);
    });

    it('builds the successor from its own motion rather than its predecessor', () =>
    {
      // Arrange - a splash is slower and smaller than the drop that made it.
      const dying = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls());
      const splash = buildParams({
        speedY: 0.5,
        jitterY: 0,
        scale: 0.3,
        scaleJitter: 0,
      });

      // Act.
      const result = WeatherMotion.succeed(dying, splash, bounds, buildRolls());

      // Assert.
      expect(result.velocityY)
        .toBe(0.5);
      expect(result.scaleY)
        .toBe(0.3);
    });
  });

  describe('pulsing', () =>
  {
    it('draws a steady particle at exactly its own brightness', () =>
    {
      // Arrange - a raindrop does not blink, and must not be scaled by a cosine of anything.
      const particle = WeatherMotion.spawn(buildParams(), bounds, WeatherMotion.Edges.Top, buildRolls({ pulse: 0.4 }));
      particle.opacity = 200;

      // Act.
      const result = WeatherMotion.glowFor(particle, buildParams());

      // Assert - the roll is well away from zero, so only the absent knob keeps this at full.
      expect(result)
        .toBe(200);
    });

    it('leaves a pulsing particle at full brightness at the top of its cycle', () =>
    {
      // Arrange - phase zero is the bright end of the swing.
      const params = buildParams({
        pulse: 0.85,
        pulseRate: 0.06,
      });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ pulse: 0 }));
      particle.opacity = 200;

      // Act.
      const result = WeatherMotion.glowFor(particle, params);

      // Assert.
      expect(result)
        .toBeCloseTo(200, 10);
    });

    it('dims a pulsing particle to its floor at the bottom of its cycle', () =>
    {
      // Arrange - the near-miss sibling: half a turn in, which is as dark as it gets.
      const params = buildParams({
        pulse: 0.85,
        pulseRate: 0.06,
      });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({ pulse: 0.5 }));
      particle.opacity = 200;

      // Act.
      const result = WeatherMotion.glowFor(particle, params);

      // Assert - fifteen percent of 200, so faintly there rather than gone.
      expect(result)
        .toBeCloseTo(30, 10);
    });

    it('gives a motion that says nothing no pulse pace at all', () =>
    {
      // Arrange & Act - an absent rate multiplied by a layer speed is how this becomes NaN, and a
      // NaN phase poisons the cosine for the whole rest of that particle's life.
      const result = WeatherMotion.pulseRateOf(buildParams());

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('reads the pace a motion pulses at', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.pulseRateOf(buildParams({ pulseRate: 0.06 }));

      // Assert.
      expect(result)
        .toBe(0.06);
    });

    it('carries a particle further through its pulse each frame', () =>
    {
      // Arrange.
      const params = buildParams({
        pulse: 0.85,
        pulseRate: 0.06,
      });
      const particle = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Top, buildRolls({
        pulse: 0,
        stagger: 0,
      }));

      // Act.
      WeatherMotion.advance(particle, params);

      // Assert.
      expect(particle.pulsePhase)
        .toBeCloseTo(0.06, 10);
    });
  });

  describe('peakOf', () =>
  {
    it('reads the strength a layer asks for', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.peakOf(buildParams({ peakOpacity: 77 }));

      // Assert.
      expect(result)
        .toBe(77);
    });

    it('draws a layer that says nothing at full strength', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.peakOf(buildParams());

      // Assert.
      expect(result)
        .toBe(255);
    });
  });

  describe('lifeOf', () =>
  {
    it('reads the lifetime a motion asks for', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.lifeOf(buildParams({ life: 210 }));

      // Assert.
      expect(result)
        .toBe(210);
    });

    it('gives a motion that says nothing no lifetime at all', () =>
    {
      // Arrange & Act - rain crosses the screen and is gone; a lifetime would wink it out mid-fall.
      const result = WeatherMotion.lifeOf(buildParams());

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('fadeOutOf', () =>
  {
    it('reads the fade a motion asks for', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.fadeOutOf(buildParams({ fadeOut: 12 }));

      // Assert.
      expect(result)
        .toBe(12);
    });

    it('gives a motion that says nothing no fade at all', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.fadeOutOf(buildParams());

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('settledOpacityFor', () =>
  {
    it('leaves a mortal particle at whatever its own age says', () =>
    {
      // Arrange - part way through fading out, which is a perfectly ordinary state to arrive into.
      const particle = { opacity: 37, life: 600 };
      const params = buildParams({
        life: 600,
        peakOpacity: 82,
      });

      // Act.
      const result = WeatherMotion.settledOpacityFor(particle, params);

      // Assert - the peak is a long way from 37, so only the lifetime can explain this answer.
      expect(result)
        .toBe(37);
    });

    it('lights an immortal particle to its layer full strength', () =>
    {
      // Arrange - the near-miss sibling: the same particle, on a motion with no lifetime.
      const particle = { opacity: 37, life: 0 };
      const params = buildParams({ peakOpacity: 82 });

      // Act.
      const result = WeatherMotion.settledOpacityFor(particle, params);

      // Assert.
      expect(result)
        .toBe(82);
    });
  });

  describe('hasExpired', () =>
  {
    it('retires a particle that has reached its lifetime', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.hasExpired({ age: 210, life: 210 });

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('keeps a particle that still has a frame left', () =>
    {
      // Arrange & Act - the near-miss on the boundary.
      const result = WeatherMotion.hasExpired({ age: 209, life: 210 });

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('never retires a particle whose motion has no lifetime', () =>
    {
      // Arrange & Act - an age far past any plausible lifetime, on a motion that declares none.
      const result = WeatherMotion.hasExpired({ age: 99999, life: 0 });

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('isDying', () =>
  {
    it('starts the fade with exactly enough life left to finish it', () =>
    {
      // Arrange - 40 opacity to shed at 10 a frame needs 4 frames, and it has 4.
      const particle = { age: 96, opacity: 40, life: 100 };
      const params = buildParams({
        life: 100,
        fadeOut: 10,
      });

      // Act.
      const result = WeatherMotion.isDying(particle, params);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('leaves a particle alone while it still has time in hand', () =>
    {
      // Arrange - the near-miss: one more frame of life than the fade needs.
      const particle = { age: 95, opacity: 40, life: 100 };
      const params = buildParams({
        life: 100,
        fadeOut: 10,
      });

      // Act.
      const result = WeatherMotion.isDying(particle, params);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('never calls an immortal particle dying', () =>
    {
      // Arrange & Act - no lifetime, so there is no end to be approaching.
      const result = WeatherMotion.isDying({ age: 99999, opacity: 10, life: 0 }, buildParams({ fadeOut: 10 }));

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('never calls a particle with nothing to fade by dying', () =>
    {
      // Arrange & Act - a lifetime but no fade would otherwise read as dying from birth, since
      // zero frames of fading always fit in the time remaining.
      const result = WeatherMotion.isDying({ age: 1, opacity: 255, life: 100 }, buildParams({ life: 100 }));

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('swayOf', () =>
  {
    it('reads the wander a motion asks for', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.swayOf(buildParams({ sway: 12 }));

      // Assert.
      expect(result)
        .toBe(12);
    });

    it('gives a motion that says nothing no wander at all', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.swayOf(buildParams());

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('swayRateOf', () =>
  {
    it('reads the pace a motion wanders at', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.swayRateOf(buildParams({ swayRate: 0.07 }));

      // Assert.
      expect(result)
        .toBe(0.07);
    });

    it('gives a motion that says nothing no pace at all', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.swayRateOf(buildParams());

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('marginOf', () =>
  {
    it('falls back to the default for a motion that says nothing', () =>
    {
      // Arrange & Act - which is every motion carrying something raindrop-sized.
      const result = WeatherMotion.marginOf(buildParams());

      // Assert.
      expect(result)
        .toBe(256);
    });

    it('uses the margin a motion asked for', () =>
    {
      // Arrange & Act.
      const result = WeatherMotion.marginOf(buildParams({ margin: 600 }));

      // Assert.
      expect(result)
        .toBe(600);
    });
  });

  describe('isDrained', () =>
  {
    it('reports a retired population that has entirely finished', () =>
    {
      // Arrange.
      const particles = [ { done: true }, { done: true }, { done: true } ];

      // Act.
      const result = WeatherMotion.isDrained(particles);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('holds a population back while even one particle is still going', () =>
    {
      // Arrange - the last one, because a check that only looked at the first would pass every
      // other case in this block. A layer thrown away with a live particle in it takes that
      // particle off the screen mid-flight, which is the cut the crossfade exists to avoid.
      const particles = [ { done: true }, { done: true }, { done: false } ];

      // Act.
      const result = WeatherMotion.isDrained(particles);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('holds back a population where the first particle is the live one', () =>
    {
      // Arrange - the mirror of the above, so neither end can be the only one inspected.
      const particles = [ { done: false }, { done: true }, { done: true } ];

      // Act.
      const result = WeatherMotion.isDrained(particles);

      // Assert.
      expect(result)
        .toBe(false);
    });
  });
});
//endregion plugins/weather/core/core/weather-motion.test.js