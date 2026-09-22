//region plugins/weather/ext/time/core/sky-states.test.js
import { describe, expect, it } from 'vitest';
import SkyStates from '../../../../../../src/plugins/weather/ext/time/core/SkyStates.js';

// RMMZ's core installs this and the source uses it as its empty-string sentinel; nothing in this
// suite exercises the engine, so it is installed here rather than booting one.
String.empty = '';

/**
 * What conditions the sky can be in, and what each of them is drawn as.
 *
 * **Every fixture below holds a near-miss sibling on purpose.** Three types rather than one, two
 * seasons that permit overlapping but different sets, four face rules of which two could plausibly
 * match the same moment. With a single candidate, "picked the right one" and "picked the only one"
 * are the same program and no assertion can separate them.
 */
describe('SkyStates', () =>
{
  /**
   * A sky shaped like the real one and sharing none of its values.
   *
   * `drizzle` and `downpour` are deliberately similar - both rainy, both allowed in `wet` - so a
   * lookup that matched on "is it rain-ish" rather than on the exact key would pick the wrong one.
   * @returns {object}
   */
  const buildSky = () => ({
    types: {
      calm: {
        preset: 'calm-preset',
        intensities: [ 'light', 'moderate', 'heavy' ],
        faces: [
          { phases: [ 0, 5 ], seasons: [ 'wet' ], preset: 'calm-wet-night' },
          { phases: [ 0, 5 ], preset: 'calm-night' },
          { seasons: [ 'dry' ], preset: 'calm-dry' },
        ],
      },
      drizzle: {
        preset: 'drizzle-preset',
        intensities: [ 'light', 'moderate' ],
      },
      downpour: {
        preset: 'downpour-preset',
        intensities: [ 'heavy' ],
      },
      gale: {
        preset: 'gale-preset',
      },
    },
    seasons: {
      wet: { allowed: [ 'calm', 'drizzle', 'downpour' ] },
      dry: { allowed: [ 'calm', 'gale' ] },
    },
  });

  describe('seasonNameOf', () =>
  {
    it('names a season the calendar actually has', () =>
    {
      // Arrange - autumn, because it is neither end of the list and so cannot pass by accident.
      const seasonId = 2;

      // Act.
      const result = SkyStates.seasonNameOf(seasonId);

      // Assert.
      expect(result)
        .toBe('autumn');
    });

    it('names the first season, proving the table is not off by one', () =>
    {
      // Arrange.
      const seasonId = 0;

      // Act.
      const result = SkyStates.seasonNameOf(seasonId);

      // Assert.
      expect(result)
        .toBe('spring');
    });

    it('names the last season, which is the one that wraps the year', () =>
    {
      // Arrange.
      const seasonId = 3;

      // Act.
      const result = SkyStates.seasonNameOf(seasonId);

      // Assert.
      expect(result)
        .toBe('winter');
    });

    it('refuses to guess at an id off the calendar', () =>
    {
      // Arrange - what `Game_Time.seasonOfYear` hands back for a month it does not recognise.
      const seasonId = -1;

      // Act.
      const result = SkyStates.seasonNameOf(seasonId);

      // Assert - empty rather than 'spring', which a naive lookup would produce for index -1 only
      // by luck and for index 4 not at all.
      expect(result)
        .toBe('');
    });
  });

  describe('typeOf', () =>
  {
    it('finds the condition asked for rather than a similar one', () =>
    {
      // Arrange - `downpour` sits beside `drizzle`, so a loose match would find the wrong block.
      const sky = buildSky();

      // Act.
      const result = SkyStates.typeOf(sky, 'downpour');

      // Assert.
      expect(result.preset)
        .toBe('downpour-preset');
    });

    it('reports a condition the sky has never heard of', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyStates.typeOf(sky, 'hurricane');

      // Assert.
      expect(result)
        .toBeNull();
    });
  });

  describe('allowedIn', () =>
  {
    it('lists exactly what a season permits', () =>
    {
      // Arrange - the dry season permits two of the four types, so a method returning everything
      // would look identical on a one-type fixture and is caught here.
      const sky = buildSky();

      // Act.
      const result = SkyStates.allowedIn(sky, 'dry');

      // Assert.
      expect(result)
        .toEqual([ 'calm', 'gale' ]);
    });

    it('permits nothing in a season that does not exist', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyStates.allowedIn(sky, 'monsoon-season');

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('isAllowedIn', () =>
  {
    it('permits a condition the season lists', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyStates.isAllowedIn(sky, 'gale', 'dry');

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('refuses a condition belonging to the other season', () =>
    {
      // Arrange - `downpour` is a real type and really is allowed somewhere, just not here. That is
      // the case a gate keyed on "is this a known type" would wrongly pass.
      const sky = buildSky();

      // Act.
      const result = SkyStates.isAllowedIn(sky, 'downpour', 'dry');

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('intensitiesOf', () =>
  {
    it('reports the narrowed range a condition declared', () =>
    {
      // Arrange - `downpour` is the fixture's monsoon: heavy or nothing.
      const sky = buildSky();

      // Act.
      const result = SkyStates.intensitiesOf(sky, 'downpour');

      // Assert.
      expect(result)
        .toEqual([ 'heavy' ]);
    });

    it('gives the whole ladder to a condition that declared no range', () =>
    {
      // Arrange - `gale` names a preset and says nothing about strength.
      const sky = buildSky();

      // Act.
      const result = SkyStates.intensitiesOf(sky, 'gale');

      // Assert.
      expect(result)
        .toEqual([ 'light', 'moderate', 'heavy' ]);
    });

    it('gives the whole ladder to a condition that does not exist', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyStates.intensitiesOf(sky, 'hurricane');

      // Assert.
      expect(result)
        .toEqual([ 'light', 'moderate', 'heavy' ]);
    });
  });

  describe('clampIntensity', () =>
  {
    it('leaves a strength the condition already permits', () =>
    {
      // Arrange - moderate is inside drizzle's range, so nothing should move.
      const sky = buildSky();

      // Act.
      const result = SkyStates.clampIntensity(sky, 'drizzle', 'moderate');

      // Assert.
      expect(result)
        .toBe('moderate');
    });

    it('pulls a strength up into a condition that only does heavy', () =>
    {
      // Arrange - a drift arriving at downpour holding light, which is two rungs short.
      const sky = buildSky();

      // Act.
      const result = SkyStates.clampIntensity(sky, 'downpour', 'light');

      // Assert.
      expect(result)
        .toBe('heavy');
    });

    it('pulls a strength down into a condition that caps below it', () =>
    {
      // Arrange - drizzle stops at moderate, so heavy has to come down one rung.
      const sky = buildSky();

      // Act.
      const result = SkyStates.clampIntensity(sky, 'drizzle', 'heavy');

      // Assert.
      expect(result)
        .toBe('moderate');
    });

    it('falls to a condition first choice for a strength that is not on the ladder', () =>
    {
      // Arrange - nothing produces this today, but a hand-edited save or config could.
      const sky = buildSky();

      // Act.
      const result = SkyStates.clampIntensity(sky, 'drizzle', 'torrential');

      // Assert.
      expect(result)
        .toBe('light');
    });

    it('honours the authored order when a condition lists its range out of ladder order', () =>
    {
      // Arrange - nothing stops an author writing `intensities` in any order they like, and here
      // the type's own first choice and the rung nearest the bottom of the ladder disagree. That
      // disagreement is the only thing separating "the type's first choice" from "whatever is
      // lowest", and without it the off-ladder branch could be deleted untouched.
      const sky = buildSky();
      sky.types.drizzle.intensities = [ 'heavy', 'light' ];

      // Act.
      const result = SkyStates.clampIntensity(sky, 'drizzle', 'torrential');

      // Assert - heavy, because that is what the type asked for first.
      expect(result)
        .toBe('heavy');
    });
  });

  describe('nearestRung', () =>
  {
    it('resolves a tie downward rather than upward', () =>
    {
      // Arrange - moderate sits exactly one rung from both, so this is the only case that can prove
      // which way the comparison leans. A sky unsure of itself should understate.
      const permitted = [ 'light', 'heavy' ];
      const wanted = 1;

      // Act.
      const result = SkyStates.nearestRung(permitted, wanted);

      // Assert.
      expect(result)
        .toBe('light');
    });

    it('takes a strictly closer rung that appears later in the list', () =>
    {
      // Arrange - light is two rungs away and heavy is zero, so the later entry has to win.
      const permitted = [ 'light', 'heavy' ];
      const wanted = 2;

      // Act.
      const result = SkyStates.nearestRung(permitted, wanted);

      // Assert.
      expect(result)
        .toBe('heavy');
    });
  });

  describe('faceFor', () =>
  {
    it('picks the most specific rule when two of them match', () =>
    {
      // Arrange - a wet night matches both the wet-night rule and the any-night rule, and the first
      // authored wins. This is the ordering contract, and it is the whole reason faces are a list.
      const sky = buildSky();

      // Act.
      const result = SkyStates.faceFor(sky, 'calm', 'wet', 0);

      // Assert.
      expect(result)
        .toBe('calm-wet-night');
    });

    it('falls through to a less specific rule when the specific one misses on season', () =>
    {
      // Arrange - still a night phase, but the dry season, so the wet-night rule must not apply.
      const sky = buildSky();

      // Act.
      const result = SkyStates.faceFor(sky, 'calm', 'dry', 5);

      // Assert.
      expect(result)
        .toBe('calm-night');
    });

    it('matches a rule that names a season and no phases at all', () =>
    {
      // Arrange - a dry afternoon: both night rules miss on phase, and the season-only rule catches.
      const sky = buildSky();

      // Act.
      const result = SkyStates.faceFor(sky, 'calm', 'dry', 3);

      // Assert.
      expect(result)
        .toBe('calm-dry');
    });

    it('falls back to the condition own preset when no rule matches', () =>
    {
      // Arrange - a wet afternoon matches none of the three rules.
      const sky = buildSky();

      // Act.
      const result = SkyStates.faceFor(sky, 'calm', 'wet', 3);

      // Assert.
      expect(result)
        .toBe('calm-preset');
    });

    it('uses the condition own preset when it has no faces at all', () =>
    {
      // Arrange - most conditions wear one face all year.
      const sky = buildSky();

      // Act.
      const result = SkyStates.faceFor(sky, 'drizzle', 'wet', 0);

      // Assert.
      expect(result)
        .toBe('drizzle-preset');
    });

    it('draws nothing for a condition that does not exist', () =>
    {
      // Arrange.
      const sky = buildSky();

      // Act.
      const result = SkyStates.faceFor(sky, 'hurricane', 'wet', 0);

      // Assert.
      expect(result)
        .toBe('');
    });
  });

  describe('faceMatches', () =>
  {
    it('matches a rule that names neither season nor phase', () =>
    {
      // Arrange - an unconditional face, which is a wildcard on both axes.
      const face = { preset: 'anything' };

      // Act.
      const result = SkyStates.faceMatches(face, 'wet', 4);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('rejects a rule whose season does not include this one', () =>
    {
      // Arrange.
      const face = { seasons: [ 'dry' ], preset: 'anything' };

      // Act.
      const result = SkyStates.faceMatches(face, 'wet', 4);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('rejects a rule whose phases do not include this one', () =>
    {
      // Arrange - the season matches, so only the phase check can be doing the rejecting.
      const face = { seasons: [ 'wet' ], phases: [ 0, 5 ], preset: 'anything' };

      // Act.
      const result = SkyStates.faceMatches(face, 'wet', 4);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('accepts a rule when both keys are named and both match', () =>
    {
      // Arrange.
      const face = { seasons: [ 'wet' ], phases: [ 0, 5 ], preset: 'anything' };

      // Act.
      const result = SkyStates.faceMatches(face, 'wet', 5);

      // Assert.
      expect(result)
        .toBe(true);
    });
  });

  describe('presetsNamedBy', () =>
  {
    it('gathers every preset a face or a condition could ask for, without repeats', () =>
    {
      // Arrange - `calm` contributes its own preset plus three faces; the others contribute one
      // each. Deduplication matters because two seasons commonly share a face.
      const sky = buildSky();
      sky.types.gale.faces = [ { seasons: [ 'dry' ], preset: 'calm-dry' } ];

      // Act.
      const result = SkyStates.presetsNamedBy(sky);

      // Assert - `calm-dry` appears twice in the config and once here.
      expect(result)
        .toEqual([
          'calm-preset',
          'calm-wet-night',
          'calm-night',
          'calm-dry',
          'drizzle-preset',
          'downpour-preset',
          'gale-preset',
        ]);
    });
  });
});
//endregion plugins/weather/ext/time/core/sky-states.test.js