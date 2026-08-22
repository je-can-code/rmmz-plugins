//region plugins/abs/core/managers/jabs-team-rules.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_TeamRules (direct src import)', () =>
{
  let JABS_TeamRules;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Metadata: { Teams: null } } };

    // JABS_TeamRules only reaches into JABS_Battler for its three static team-id constants;
    // mocked here so this file doesn't have to drag in JABS_Battler's full real dependency
    // tree (sprites, RMMZ core classes, etc.) just to test team relationship logic.
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({
      default: class
      {
        static allyTeamId() { return 0; }
        static enemyTeamId() { return 1; }
        static neutralTeamId() { return 2; }
      },
    }));

    ({ default: JABS_TeamRules } = await import('../../../../../src/plugins/abs/core/managers/JABS_TeamRules.js'));
  });

  beforeEach(() =>
  {
    globalThis.J.ABS.Metadata.Teams = null;
  });

  describe('defaultTeams', () =>
  {
    it('builds the ally/enemy/neutral definitions with legacy opposition', () =>
    {
      // Act
      const teams = JABS_TeamRules.defaultTeams();

      // Assert
      expect(teams).toEqual([
        { id: 0, key: 'ALLY', name: 'Allies', opposes: [ 1, 2 ] },
        { id: 1, key: 'ENEMY', name: 'Enemies', opposes: [ 0, 2 ] },
        { id: 2, key: 'NEUTRAL', name: 'Neutral', opposes: [ 0, 1 ] },
      ]);
    });
  });

  describe('teams', () =>
  {
    it('returns the externally configured teams when present', () =>
    {
      // Arrange
      const externalTeams = [ { id: 5, key: 'CUSTOM', opposes: [] } ];
      globalThis.J.ABS.Metadata.Teams = externalTeams;

      // Act & Assert
      expect(JABS_TeamRules.teams()).toBe(externalTeams);
    });

    it('falls back to the defaults when no external configuration is an array', () =>
    {
      // Arrange
      globalThis.J.ABS.Metadata.Teams = null;

      // Act & Assert
      expect(JABS_TeamRules.teams()).toEqual(JABS_TeamRules.defaultTeams());
    });
  });

  describe('isFriendly', () =>
  {
    it('is true when both team ids match', () =>
    {
      expect(JABS_TeamRules.isFriendly(0, 0)).toBe(true);
    });

    it('is false when the team ids differ', () =>
    {
      expect(JABS_TeamRules.isFriendly(0, 1)).toBe(false);
    });
  });

  describe('isOpposed', () =>
  {
    it('is false when both team ids are the same', () =>
    {
      expect(JABS_TeamRules.isOpposed(0, 0)).toBe(false);
    });

    it('is true under default teams when the ally team is checked against the enemy team', () =>
    {
      expect(JABS_TeamRules.isOpposed(0, 1)).toBe(true);
    });

    it('is false for a team with no definition compared against itself', () =>
    {
      // Arrange- team 99 exists on no definition, so the "no definition means opposed" fallback
      // below would call it hostile to itself. The same-id guard is the only thing standing
      // between an unconfigured team id and a battler treating its own squadmates as enemies.

      // Act & Assert
      expect(JABS_TeamRules.isOpposed(99, 99)).toBe(false);
    });

    it('resolves the opposition list of the requested team rather than the first one defined', () =>
    {
      // Arrange- the decoy is deliberately ordered ahead of the team actually being asked about,
      // and opposes something else entirely. With only one definition in the list, "found team A"
      // and "found any team" would be indistinguishable.
      globalThis.J.ABS.Metadata.Teams = [
        { id: 7, key: 'DECOY', opposes: [ 9 ] },
        { id: 8, key: 'ASKED', opposes: [ 3 ] },
      ];

      // Act & Assert
      expect(JABS_TeamRules.isOpposed(8, 3)).toBe(true);
      expect(JABS_TeamRules.isOpposed(8, 9)).toBe(false);
    });

    it('falls back to legacy opposed-by-default behavior when team A has no definition', () =>
    {
      // Arrange
      globalThis.J.ABS.Metadata.Teams = [ { id: 0, opposes: [ 1 ] } ];

      // Act & Assert- team id 99 has no definition in the external config.
      expect(JABS_TeamRules.isOpposed(99, 1)).toBe(true);
    });

    it('treats a missing opposes list as opposing nothing', () =>
    {
      // Arrange
      globalThis.J.ABS.Metadata.Teams = [ { id: 0 }, { id: 1 } ];

      // Act & Assert
      expect(JABS_TeamRules.isOpposed(0, 1)).toBe(false);
    });

    it('is false when team B is not in team A\'s opposes list', () =>
    {
      // Arrange
      globalThis.J.ABS.Metadata.Teams = [ { id: 0, opposes: [ 2 ] }, { id: 1 } ];

      // Act & Assert
      expect(JABS_TeamRules.isOpposed(0, 1)).toBe(false);
    });
  });
});
//endregion plugins/abs/core/managers/jabs-team-rules.test.js
