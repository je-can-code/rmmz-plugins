//region plugins/abs/ext/metrics/_component/fixtures/install-abs-metrics-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Metrics's own identity. Call
 * this right before importing abs/ext/metrics/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards.
 *
 * This is J-ABS-Metrics's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsMetrics(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Metrics';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * The metrics section of J-ABS's external configuration, shaped the way the real
 * `data/config.jabs.json` shapes it.
 *
 * The ids deliberately do not run 101-117 in the order the metadata declares them: a fixture whose
 * numbers are consecutive cannot tell a metric pointed at the right variable apart from one pointed
 * at its neighbour, because both would be off by an amount no assertion here would notice.
 * @type {object}
 */
export const SAMPLE_METRICS_CONFIG = {
  enemiesDefeated: 201,
  destructiblesDestroyed: 315,
  totalDamageDealt: 402,
  highestDamageDealt: 418,
  numberOfCritsDealt: 507,
  biggestCritDealt: 533,
  numberOfParries: 604,
  numberOfPreciseParries: 629,
  totalDamageTaken: 711,
  highestDamageTaken: 742,
  numberOfCritsTaken: 803,
  biggestCritTaken: 856,
  mainhandSkillUsage: 901,
  offhandSkillUsage: 927,
  assignedSkillUsage: 964,
  dodgeSkillUsage: 988,
  numberOfDeaths: 999,
};

/**
 * Publishes the metrics configuration onto J-ABS's metadata, which is where this extension reads it
 * from while initializing its own.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @param {object} [config] The metrics configuration to publish. Defaults to {@link SAMPLE_METRICS_CONFIG}.
 */
export function installMetricsExternalConfig(sandbox = globalThis, config = SAMPLE_METRICS_CONFIG)
{
  sandbox.J.ABS.Metadata.ExternalConfig ??= {};
  sandbox.J.ABS.Metadata.ExternalConfig.metrics = config;
}

/**
 * Stands in the cooldown-type constants J-ABS-InputManager publishes as a bare global.
 *
 * The four assignable combat slots are present alongside the three this plugin branches on, because
 * the default arm of the slot switch is only meaningfully tested by a value that genuinely exists
 * and genuinely is not mainhand or offhand.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installJabsButtonStub(sandbox = globalThis)
{
  sandbox.JABS_Button = {
    Mainhand: 'Mainhand',
    Offhand: 'Offhand',
    Tool: 'Tool',
    Dodge: 'Dodge',
    CombatSkill1: 'CombatSkill1',
    CombatSkill2: 'CombatSkill2',
    CombatSkill3: 'CombatSkill3',
    CombatSkill4: 'CombatSkill4',
  };
}

/**
 * Installs a recording `$gameVariables` alongside a recording `modVariable`, keeping the two kinds
 * of write in separate transcripts.
 *
 * They are different statements about the world: a running total accumulates forever, while a
 * personal best only moves when it is actually beaten. Recording them apart is what lets a test tell
 * "the hit was counted" from "the record was rewritten".
 * @param {Record<number, number>} [startingValues] What each variable already reads.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @returns {{mods: object[], sets: object[]}} The transcript of everything written.
 */
export function captureMetricWrites(startingValues = {}, sandbox = globalThis)
{
  const transcript = {
    mods: [],
    sets: [],
  };

  sandbox.J.BASE.Helpers.modVariable = (variableId, amount) => transcript.mods.push({
    variableId,
    amount,
  });

  sandbox.$gameVariables = {
    value: variableId => startingValues[variableId] ?? 0,
    setValue: (variableId, value) => transcript.sets.push({
      variableId,
      value,
    }),
  };

  return transcript;
}
//endregion plugins/abs/ext/metrics/_component/fixtures/install-abs-metrics-host-globals.js