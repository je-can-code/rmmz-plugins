//region plugins/omni/ext/stats/_component/fixtures/install-omni-stats-host-globals.js
/**
 * The realm J-OMNI-Stats reads from at runtime, assembled for tests.
 *
 * This is J-OMNI-Stats's own isolated fixture, shared with no other omni extension- each one is an
 * independent plugin and owns its own.
 */

/**
 * The metrics variable map, shaped the way `data/config.jabs.json` shapes it.
 *
 * The ids are deliberately scattered rather than consecutive. A fixture numbering them 1-26 in
 * declaration order cannot tell a statistic reading the right variable apart from one reading its
 * neighbour, because both would be wrong by an amount no assertion would ever notice.
 * @type {Object<string, number>}
 */
export const SAMPLE_METRIC_VARIABLE_IDS = {
  enemiesDefeated: 201,
  destructiblesDestroyed: 315,
  alliesDowned: 337,
  numberOfDeaths: 358,
  totalDamageDealt: 402,
  highestDamageDealt: 418,
  numberOfCritsDealt: 507,
  biggestCritDealt: 533,
  attacksEvadedByEnemies: 549,
  totalDamageTaken: 711,
  highestDamageTaken: 742,
  numberOfCritsTaken: 803,
  biggestCritTaken: 856,
  numberOfParries: 604,
  numberOfPreciseParries: 629,
  numberOfGlancingBlows: 655,
  numberOfGuardedHits: 671,
  attacksEvadedByParty: 688,
  damagePreventedByGuarding: 694,
  mainhandSkillUsage: 901,
  offhandSkillUsage: 927,
  assignedSkillUsage: 964,
  dodgeSkillUsage: 988,
  guardActivations: 993,
  toolUsage: 996,
  usableItemUsage: 999,
};

/**
 * Builds the metrics metadata object, whose fields are the config keys with a suffix.
 * @returns {object} The metadata J-ABS-Metrics publishes.
 */
const buildMetricsMetadata = () =>
{
  const metadata = {};

  Object.keys(SAMPLE_METRIC_VARIABLE_IDS)
    .forEach(key =>
    {
      metadata[`${key}VariableId`] = SAMPLE_METRIC_VARIABLE_IDS[key];
    });

  return metadata;
};

/**
 * Installs everything the statistopedia reads: the metrics namespace, the variable store, the party,
 * the map, and the database tables the superlative rows resolve names out of.
 * @param {{
 *   variables?: Object<number, number>,
 *   records?: object,
 *   steps?: number,
 *   mapId?: number,
 *   displayName?: string
 * }=} options How the realm should be shaped.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @returns {object} The installed sandbox.
 */
export const installOmniStatsHostGlobals = (options = {}, sandbox = globalThis) =>
{
  const {
    variables = {},
    records = null,
    steps = 0,
    mapId = 1,
    displayName = '',
  } = options;

  // RMMZ's core hangs this off the String constructor; nothing in a node realm does.
  Object.defineProperty(String, 'empty', {
    enumerable: true,
    configurable: true,
    get: () => '',
  });

  sandbox.J ||= {};
  sandbox.J.ABS ||= {};
  sandbox.J.ABS.EXT ||= {};
  sandbox.J.ABS.EXT.METRICS = { Metadata: buildMetricsMetadata() };

  sandbox.$gameVariables = {
    value: variableId => variables[variableId] ?? 0,
  };

  sandbox.$gameParty = {
    getStatistopediaRecords: () => records,
    steps: () => steps,
  };

  sandbox.$gameMap = {
    mapId: () => mapId,
    displayName: () => displayName,
  };

  // sparse tables indexed by id, exactly as the engine's own are.
  sandbox.$dataWeapons = [ null, null, null ];
  sandbox.$dataSkills = [ null, null, null ];
  sandbox.$dataEnemies = [ null, null, null ];
  sandbox.$dataMapInfos = [ null, null, null ];

  sandbox.$dataWeapons[12] = { name: 'Wooden Spoon' };
  sandbox.$dataWeapons[13] = { name: 'Iron Ladle' };
  sandbox.$dataSkills[41] = { name: 'Sear' };
  sandbox.$dataSkills[42] = { name: 'Simmer' };
  sandbox.$dataEnemies[88] = { name: 'Bearcat' };
  sandbox.$dataEnemies[89] = { name: 'Bearcat Alpha' };
  sandbox.$dataMapInfos[7] = { name: 'Sunken Larder' };
  sandbox.$dataMapInfos[8] = { name: 'Salt Flats' };

  return sandbox;
};
//endregion plugins/omni/ext/stats/_component/fixtures/install-omni-stats-host-globals.js
