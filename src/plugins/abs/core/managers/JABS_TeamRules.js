//region JABS_TeamRules
import JABS_Battler from './../__models/JABS_Battler.js';
/**
 * A static class for resolving team relationships between battlers.
 *
 * This exists to replace hardcoded/binary "friendly vs opposing" checks with a data-driven model.
 * The source of truth for configuration is {@link J.ABS.Metadata.ExternalConfig} and {@link J.ABS.Metadata.Teams},
 * which are populated by {@link J.ABS.Helpers.loadExternalConfig}.
 */
class JABS_TeamRules
{
  //region defaults
  /**
   * Builds the default team definitions.
   * These defaults match the legacy behavior:
   * - "friendly" means "same team id".
   * - "opposed" means "different team id".
   * @returns {JabsTeamDefinition[]} The default team definitions.
   */
  static defaultTeams()
  {
    const allyId = JABS_Battler.allyTeamId();
    const enemyId = JABS_Battler.enemyTeamId();
    const neutralId = JABS_Battler.neutralTeamId();
    return [
      {
        id: allyId,
        key: 'ALLY',
        name: 'Allies',
        opposes: [ enemyId, neutralId ],
      },
      {
        id: enemyId,
        key: 'ENEMY',
        name: 'Enemies',
        opposes: [ allyId, neutralId ],
      },
      {
        id: neutralId,
        key: 'NEUTRAL',
        name: 'Neutral',
        opposes: [ allyId, enemyId ],
      },
    ];
  }
  //endregion defaults

  //region accessors
  /**
   * Gets the current team definitions.
   * @returns {JabsTeamDefinition[]} The current teams (external config or defaults).
   */
  static teams()
  {
    // prefer externally configured teams when available.
    const externalTeams = J.ABS.Metadata.Teams;
    if (Array.isArray(externalTeams))
    {
      return externalTeams;
    }

    // fall back to defaults when no configuration exists.
    return this.defaultTeams();
  }
  //endregion accessors

  //region relationship checks
  /**
   * Checks whether or not the two team ids are friendly.
   * Under legacy behavior, only the same team id is friendly.
   * @param {number} teamA The first team id.
   * @param {number} teamB The second team id.
   * @returns {boolean} True if friendly, false otherwise.
   */
  static isFriendly(teamA, teamB)
  {
    return teamA === teamB;
  }

  /**
   * Checks whether or not the two team ids are opposed.
   * "Opposed" is driven by the configured {@link JabsTeamDefinition.opposes} list per team.
   * @param {number} teamA The first team id.
   * @param {number} teamB The second team id.
   * @returns {boolean} True if opposed, false otherwise.
   */
  static isOpposed(teamA, teamB)
  {
    // you cannot be opposed to yourself.
    if (teamA === teamB)
    {
      return false;
    }

    // locate the "A" team definition.
    const teamDefinition = this.teams()
      .find(team => team.id === teamA);

    // if the team definition isn't found, fall back to legacy behavior.
    if (!teamDefinition)
    {
      return true;
    }

    // determine whether or not "A" opposes "B".
    const opposedTeams = teamDefinition.opposes ?? [];
    return opposedTeams.includes(teamB);
  }
  //endregion relationship checks
}
//endregion JABS_TeamRules

//region typedefs
/**
 * @typedef {object} JabsTeamDefinition
 * @property {number} id The numeric id of this team.
 * @property {string=} key An optional stable key for this team (useful for tooling).
 * @property {string=} name An optional display name for this team.
 * @property {number[]=} opposes The list of team ids that this team treats as opposed.
 */
export default JABS_TeamRules;
//endregion typedefs