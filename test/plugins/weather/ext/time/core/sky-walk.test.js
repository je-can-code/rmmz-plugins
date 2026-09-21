//region plugins/weather/ext/time/core/sky-walk.test.js
import { describe, expect, it } from 'vitest';
import SkyWalk from '../../../../../../src/plugins/weather/ext/time/core/SkyWalk.js';

// RMMZ's core installs this and the source uses it as its empty-string sentinel.
String.empty = '';

/**
 * How the sky gets from what it is now to what it is next.
 *
 * **Every roll below is chosen to land on an exact outcome, and the weights are chosen so that the
 * band boundaries are round numbers.** A weighted pick tested against a range rather than a value
 * would pass for an implementation that ignored the weights entirely.
 *
 * The fixture also keeps `drizzle` and `downpour` side by side throughout. They are both rain, both
 * legal in the same season, and reachable from one another - so any step that picked "something
 * rainy" rather than the exact rolled target would still look plausible and would still fail here.
 */
describe('SkyWalk', () =>
{
  /**
   * A sky shaped like the real one, with weights that make every band boundary exact.
   * @returns {object}
   */
  const buildSky = () => ({
    types: {
      calm: { preset: 'calm-preset', intensities: [ 'light', 'moderate', 'heavy' ] },
      drizzle: { preset: 'drizzle-preset', intensities: [ 'light', 'moderate' ] },
      downpour: { preset: 'downpour-preset', intensities: [ 'heavy' ] },
      gale: { preset: 'gale-preset' },
      trap: { preset: 'trap-preset' },
      bridge: { preset: 'bridge-preset' },
    },
    seasons: {
      wet: {
        allowed: [ 'calm', 'drizzle', 'downpour' ],
        transitions: {
          calm: { calm: 60, drizzle: 40 },
          drizzle: { drizzle: 50, calm: 30, downpour: 20 },
          downpour: { downpour: 70, drizzle: 30 },
        },
      },
      dry: {
        allowed: [ 'calm', 'gale' ],
        transitions: {
          calm: { calm: 80, gale: 20 },
          gale: { gale: 50, calm: 50 },
        },
      },
      // a season whose graph points somewhere the season does not permit, which is what config
      // validation exists to catch and what the walk has to survive in the meantime.
      leaky: {
        allowed: [ 'calm' ],
        transitions: { calm: { gale: 100 } },
      },
      // `trap` is a dead end with no route to the settling state, and `bridge` can reach both it
      // and the settling state - which is the only shape that proves unreachable candidates are
      // skipped rather than merely sorted last.
      stuck: {
        allowed: [ 'calm', 'trap', 'bridge' ],
        transitions: {
          calm: { calm: 100 },
          trap: { trap: 100 },
          bridge: { trap: 50, calm: 50 },
        },
      },
      // every weight zero, which is an authoring mistake rather than a distribution.
      silent: {
        allowed: [ 'calm', 'gale' ],
        transitions: { calm: { calm: 0, gale: 0 } },
      },
      // the settling condition has no self-loop here, so staying put is something the graph cannot
      // express and only the settling rule itself can produce.
      restless: {
        allowed: [ 'calm', 'gale' ],
        transitions: {
          calm: { gale: 100 },
          gale: { calm: 100 },
        },
      },
    },
    intensityDrift: {
      hold: 50,
      up: 30,
      down: 20,
    },
    settleTo: 'calm',
    // month 7 is deliberately absent, so a month with no opinion is always available as the
    // control every leaning case is compared against.
    months: {
      4: { downpour: 4, calm: 0.5 },
      5: { drizzle: 0 },
    },
  });

  describe('pickWeighted', () =>
  {
    it('picks the candidate whose band the roll lands in', () =>
    {
      // Arrange - bands are 0.0-0.6 and 0.6-1.0, and this roll sits inside the second.
      const candidates = [
        { type: 'calm', weight: 60 },
        { type: 'drizzle', weight: 40 },
      ];

      // Act.
      const result = SkyWalk.pickWeighted(candidates, 0.75);

      // Assert.
      expect(result)
        .toBe('drizzle');
    });

    it('treats a band boundary as belonging to the later candidate', () =>
    {
      // Arrange - exactly 0.6, which is where the first band ends. Getting this wrong shifts every
      // probability in the config by one band edge, and nothing else would ever notice.
      const candidates = [
        { type: 'calm', weight: 60 },
        { type: 'drizzle', weight: 40 },
      ];

      // Act.
      const result = SkyWalk.pickWeighted(candidates, 0.6);

      // Assert.
      expect(result)
        .toBe('drizzle');
    });

    it('picks the last candidate when a roll runs off the end of the bands', () =>
    {
      // Arrange - a roll of exactly one is outside [0, 1) but floating point can produce it, and
      // the bands add to precisely the total so nothing is left for it to land in.
      const candidates = [
        { type: 'calm', weight: 60 },
        { type: 'drizzle', weight: 40 },
      ];

      // Act.
      const result = SkyWalk.pickWeighted(candidates, 1);

      // Assert.
      expect(result)
        .toBe('drizzle');
    });

    it('picks the first candidate when every weight is zero', () =>
    {
      // Arrange - a distribution with no mass is an authoring mistake; the first entry is at least
      // something the season permits.
      const candidates = [
        { type: 'calm', weight: 0 },
        { type: 'gale', weight: 0 },
      ];

      // Act.
      const result = SkyWalk.pickWeighted(candidates, 0.5);

      // Assert.
      expect(result)
        .toBe('calm');
    });

    it('picks nothing from nothing', () =>
    {
      // Arrange.
      const candidates = [];

      // Act.
      const result = SkyWalk.pickWeighted(candidates, 0.5);

      // Assert.
      expect(result)
        .toBe('');
    });
  });

  describe('candidatesFor', () =>
  {
    it('offers what the graph says, at the weights it says', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.candidatesFor(sky, 'drizzle', 'wet');

      // Assert.
      expect(result)
        .toEqual([
          { type: 'drizzle', weight: 50 },
          { type: 'calm', weight: 30 },
          { type: 'downpour', weight: 20 },
        ]);
    });

    it('offers nothing for a season that does not exist', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.candidatesFor(sky, 'calm', 'eternal-autumn');

      // Assert.
      expect(result)
        .toEqual([]);
    });

    it('offers every legal condition to a state with no row of its own', () =>
    {
      // Arrange - `drizzle` is a real type with a real row in `wet`, and none at all in `dry`. A
      // debug clock jump lands the sky in exactly this position.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.candidatesFor(sky, 'drizzle', 'dry');

      // Assert.
      expect(result)
        .toEqual([
          { type: 'calm', weight: 1 },
          { type: 'gale', weight: 1 },
        ]);
    });

    it('offers every legal condition when the graph points only at illegal ones', () =>
    {
      // Arrange - the leaky season's one row names `gale`, which it does not permit.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.candidatesFor(sky, 'calm', 'leaky');

      // Assert - the illegal target is gone and the fallback stands in its place.
      expect(result)
        .toEqual([ { type: 'calm', weight: 1 } ]);
    });

    it('drops an illegal target while keeping the legal ones beside it', () =>
    {
      // Arrange - a row holding one of each, so "filtered correctly" and "fell back wholesale" are
      // distinguishable.
      const sky = buildSky();
      sky.seasons.dry.transitions.calm = { calm: 80, gale: 20, downpour: 50 };

      // Act.
      const result = SkyWalk.candidatesFor(sky, 'calm', 'dry');

      // Assert.
      expect(result)
        .toEqual([
          { type: 'calm', weight: 80 },
          { type: 'gale', weight: 20 },
        ]);
    });
  });

  describe('hopsTo', () =>
  {
    it('costs nothing to stay where it already is', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.hopsTo(sky, 'calm', 'calm', 'wet');

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('counts one step to a condition directly reachable', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.hopsTo(sky, 'calm', 'drizzle', 'wet');

      // Assert.
      expect(result)
        .toBe(1);
    });

    it('counts the shortest route rather than the first one walked', () =>
    {
      // Arrange - downpour reaches calm only through drizzle, and the search revisits calm along
      // the way, so this also proves the walk does not loop forever on a cyclic graph.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.hopsTo(sky, 'downpour', 'calm', 'wet');

      // Assert.
      expect(result)
        .toBe(2);
    });

    it('reports no route at all to somewhere the season forbids', () =>
    {
      // Arrange - `downpour` exists and is reachable in `wet`, which is what makes this a real
      // absence rather than a typo.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.hopsTo(sky, 'gale', 'downpour', 'dry');

      // Assert.
      expect(result)
        .toBe(-1);
    });
  });

  describe('settlingType', () =>
  {
    it('stays put when it is already at the settling condition', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.settlingType(sky, 'calm', 'wet');

      // Assert.
      expect(result)
        .toBe('calm');
    });

    it('stays put even when the graph offers it no way to stay', () =>
    {
      // Arrange - a season whose settling condition has no self-loop, so every edge out of it
      // leads somewhere else. In the seasons authored today every condition loops to itself and
      // this rule is invisible; the moment one does not, a handover day would walk away from
      // clear on the very phase it arrived there.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.settlingType(sky, 'calm', 'restless');

      // Assert.
      expect(result)
        .toBe('calm');
    });

    it('takes the step that lands nearest the settling condition', () =>
    {
      // Arrange - from downpour, `drizzle` is one hop from calm and `downpour` itself is two.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.settlingType(sky, 'downpour', 'wet');

      // Assert.
      expect(result)
        .toBe('drizzle');
    });

    it('skips a candidate that can never reach the settling condition', () =>
    {
      // Arrange - from `bridge` the graph offers `trap` first, and trap is a dead end. A pick that
      // merely sorted by hop count would take it, because an unreachable -1 sorts lowest of all.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.settlingType(sky, 'bridge', 'stuck');

      // Assert.
      expect(result)
        .toBe('calm');
    });

    it('stays put when there is nowhere at all to go', () =>
    {
      // Arrange - a season the sky has never heard of offers no candidates.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.settlingType(sky, 'downpour', 'eternal-autumn');

      // Assert.
      expect(result)
        .toBe('downpour');
    });
  });

  describe('stepFor', () =>
  {
    it('holds where it is on a low roll', () =>
    {
      // Arrange - the hold band runs 0.0 to 0.5.
      const drift = { hold: 50, up: 30, down: 20 };

      // Act.
      const result = SkyWalk.stepFor(0.2, drift);

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('steps up in the middle band', () =>
    {
      // Arrange - the up band runs 0.5 to 0.8, and this is its first value.
      const drift = { hold: 50, up: 30, down: 20 };

      // Act.
      const result = SkyWalk.stepFor(0.5, drift);

      // Assert.
      expect(result)
        .toBe(1);
    });

    it('steps down in the top band', () =>
    {
      // Arrange - the down band runs 0.8 to 1.0.
      const drift = { hold: 50, up: 30, down: 20 };

      // Act.
      const result = SkyWalk.stepFor(0.9, drift);

      // Assert.
      expect(result)
        .toBe(-1);
    });
  });

  describe('nextIntensity', () =>
  {
    it('climbs one rung and no further', () =>
    {
      // Arrange - an up roll from the bottom of the ladder.
      const drift = { hold: 50, up: 30, down: 20 };

      // Act.
      const result = SkyWalk.nextIntensity('light', 0.5, drift);

      // Assert - moderate, never heavy; a strength that can jump reads as dice.
      expect(result)
        .toBe('moderate');
    });

    it('descends one rung', () =>
    {
      // Arrange.
      const drift = { hold: 50, up: 30, down: 20 };

      // Act.
      const result = SkyWalk.nextIntensity('heavy', 0.9, drift);

      // Assert.
      expect(result)
        .toBe('moderate');
    });

    it('stops at the top of the ladder rather than wrapping', () =>
    {
      // Arrange - an up roll with nowhere above it to go.
      const drift = { hold: 50, up: 30, down: 20 };

      // Act.
      const result = SkyWalk.nextIntensity('heavy', 0.5, drift);

      // Assert.
      expect(result)
        .toBe('heavy');
    });

    it('stops at the bottom of the ladder rather than wrapping', () =>
    {
      // Arrange - a down roll with nowhere below it to go. Wrapping here would turn the gentlest
      // weather in the game into the heaviest, once in every five phases.
      const drift = { hold: 50, up: 30, down: 20 };

      // Act.
      const result = SkyWalk.nextIntensity('light', 0.9, drift);

      // Assert.
      expect(result)
        .toBe('light');
    });

    it('starts from the bottom for a strength that is not on the ladder', () =>
    {
      // Arrange - a hand-edited save, or a config naming a rung that does not exist.
      const drift = { hold: 50, up: 30, down: 20 };

      // Act.
      const result = SkyWalk.nextIntensity('torrential', 0.5, drift);

      // Assert.
      expect(result)
        .toBe('light');
    });
  });

  describe('leanOf', () =>
  {
    it('reports what a month wants more and less of', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.leanOf(sky, 4);

      // Assert.
      expect(result)
        .toEqual({ downpour: 4, calm: 0.5 });
    });

    it('leans nowhere for a month with no opinion', () =>
    {
      // Arrange - most months say nothing, and a month that says nothing must change nothing.
      const sky = buildSky();

      // Act.
      const result = SkyWalk.leanOf(sky, 7);

      // Assert.
      expect(result)
        .toEqual({});
    });

    it('leans nowhere for a sky with no calendar opinions at all', () =>
    {
      // Arrange - the `months` block is optional; a config without one is a perfectly good sky.
      const sky = buildSky();
      delete sky.months;

      // Act.
      const result = SkyWalk.leanOf(sky, 4);

      // Assert.
      expect(result)
        .toEqual({});
    });
  });

  describe('multiplierFor', () =>
  {
    it('leaves a condition the month said nothing about exactly as authored', () =>
    {
      // Arrange & Act.
      const result = SkyWalk.multiplierFor({ downpour: 4 }, 'drizzle');

      // Assert - one, not zero; a month names only what it cares about.
      expect(result)
        .toBe(1);
    });

    it('reports the multiplier a month named', () =>
    {
      // Arrange & Act.
      const result = SkyWalk.multiplierFor({ downpour: 4 }, 'downpour');

      // Assert.
      expect(result)
        .toBe(4);
    });

    it('reports a deliberate zero rather than treating it as absent', () =>
    {
      // Arrange - zero is how a condition ENDS rather than fades, so it must survive the lookup
      // intact. A falsy check here would silently turn "never in May" into "exactly as usual".
      const result = SkyWalk.multiplierFor({ sakura: 0 }, 'sakura');

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('leanToward', () =>
  {
    it('scales only the conditions the month named', () =>
    {
      // Arrange - one scaled up, one scaled down, one left alone, which is the whole contract.
      const candidates = [
        { type: 'calm', weight: 60 },
        { type: 'drizzle', weight: 40 },
        { type: 'downpour', weight: 20 },
      ];

      // Act.
      const result = SkyWalk.leanToward(candidates, { downpour: 4, calm: 0.5 });

      // Assert.
      expect(result)
        .toEqual([
          { type: 'calm', weight: 30 },
          { type: 'drizzle', weight: 40 },
          { type: 'downpour', weight: 80 },
        ]);
    });

    it('leaves every candidate alone when the month leans nowhere', () =>
    {
      // Arrange.
      const candidates = [ { type: 'calm', weight: 60 }, { type: 'drizzle', weight: 40 } ];

      // Act.
      const result = SkyWalk.leanToward(candidates, {});

      // Assert.
      expect(result)
        .toEqual([ { type: 'calm', weight: 60 }, { type: 'drizzle', weight: 40 } ]);
    });
  });

  describe('next', () =>
  {
    /**
     * A phase in a month that leans nowhere, so the graph's own weights decide alone.
     * @param {object} overrides Whatever this case needs to differ on.
     * @returns {{season: string, month: number, isSettling: boolean}}
     */
    const plainMoment = (overrides = {}) => ({
      season: 'wet',
      month: 7,
      isSettling: false,
      ...overrides,
    });

    it('rolls the condition forward on an ordinary phase', () =>
    {
      // Arrange - from calm, a roll of 0.75 lands in drizzle's band; the intensity holds.
      const sky = buildSky();
      const state = { type: 'calm', intensity: 'moderate' };

      // Act.
      const result = SkyWalk.next(sky, state, plainMoment(), { type: 0.75, intensity: 0.2 });

      // Assert.
      expect(result)
        .toEqual({ type: 'drizzle', intensity: 'moderate' });
    });

    it('ignores the condition roll entirely on a settling phase', () =>
    {
      // Arrange - this exact roll picks `downpour` on an ordinary phase, which is the furthest
      // thing from the settling state. If settling merely biased the roll, this would not be calm.
      const sky = buildSky();
      const state = { type: 'drizzle', intensity: 'moderate' };

      // Act.
      const result = SkyWalk.next(sky, state, plainMoment({ isSettling: true }), { type: 0.99, intensity: 0.2 });

      // Assert.
      expect(result.type)
        .toBe('calm');
    });

    it('clamps the strength against the condition it is arriving at, not the one it left', () =>
    {
      // Arrange - drizzle at light rolls into downpour, which only does heavy. Clamping against
      // the old type would leave this at light and quietly break every narrowed range in the
      // config; the strength has to be measured against where the sky is going.
      const sky = buildSky();
      const state = { type: 'drizzle', intensity: 'light' };

      // Act.
      const result = SkyWalk.next(sky, state, plainMoment(), { type: 0.99, intensity: 0.2 });

      // Assert.
      expect(result)
        .toEqual({ type: 'downpour', intensity: 'heavy' });
    });

    it('lets the month change which condition a given roll produces', () =>
    {
      // Arrange - the same state and the same roll, twice. From calm the graph offers
      // {calm 60, drizzle 40}, so a roll of 0.5 sits inside calm's band. Month 4 halves calm to
      // {calm 30, drizzle 40}, which moves the boundary down to 0.43 and leaves the same roll on
      // the other side of it. Same dice, different month, different weather - and it has to be a
      // roll that straddles the moved boundary, or the two months agree and prove nothing.
      const sky = buildSky();
      const state = { type: 'calm', intensity: 'moderate' };
      const rolls = { type: 0.5, intensity: 0.2 };

      // Act.
      const plain = SkyWalk.next(sky, state, plainMoment(), rolls);
      const leaned = SkyWalk.next(sky, state, plainMoment({ month: 4 }), rolls);

      // Assert.
      expect(plain.type)
        .toBe('calm');
      expect(leaned.type)
        .toBe('drizzle');
    });

    it('never produces a condition a month has scaled to zero', () =>
    {
      // Arrange - month 5 zeroes drizzle outright, which is how a seasonal condition ends rather
      // than fades. Every roll across the band must step past it.
      const sky = buildSky();
      const state = { type: 'calm', intensity: 'moderate' };

      // Act.
      const produced = [ 0, 0.25, 0.5, 0.75, 0.99 ]
        .map(value => SkyWalk.next(sky, state, plainMoment({ month: 5 }), { type: value, intensity: 0.2 }).type);

      // Assert - and `drizzle` is reachable from calm in this season, which is what makes its
      // absence here the month's doing rather than the graph's.
      expect(produced)
        .not
        .toContain('drizzle');
      expect(SkyWalk.candidatesFor(sky, 'calm', 'wet')
        .map(candidate => candidate.type))
        .toContain('drizzle');
    });

    it('does not let a month lean steer a settling day', () =>
    {
      // Arrange - month 4 wants downpour four times as much as usual, and a handover day does not
      // care what the month wants. Settling is the one thing in the walk that is not a roll.
      const sky = buildSky();
      const state = { type: 'downpour', intensity: 'heavy' };

      // Act.
      const result = SkyWalk.next(sky, state, plainMoment({ month: 4, isSettling: true }), { type: 0.99, intensity: 0.2 });

      // Assert.
      expect(result.type)
        .toBe('drizzle');
    });
  });
});
//endregion plugins/weather/ext/time/core/sky-walk.test.js