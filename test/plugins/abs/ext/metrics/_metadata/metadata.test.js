//region plugins/abs/ext/metrics/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import {
  installMetricsExternalConfig,
  SAMPLE_METRICS_CONFIG,
  setPluginContextToJabsMetrics,
} from '../_component/fixtures/install-abs-metrics-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Metrics metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Metrics', {});

    // this extension reads which variable holds which metric out of J-ABS's parsed external
    // configuration rather than its own plugin parameters, and J-ABS guarantees that config is
    // present before extensions reach postInitialize.
    installMetricsExternalConfig();

    setPluginContextToJabsMetrics();
    await import('../../../../../../src/plugins/abs/ext/metrics/_metadata/initialization.js');
  });

  it('publishes itself under the namespace its owner declared', () =>
  {
    // Arrange & Act & Assert- J-ABS owns the EXT namespace; metrics is a tenant of it.
    expect(globalThis.J.ABS.EXT.METRICS.Metadata.name).toBe('J-ABS-Metrics');
  });

  describe('external configuration translation', () =>
  {
    [
      [ 'enemiesDefeatedVariableId', 'enemiesDefeated' ],
      [ 'destructiblesDestroyedVariableId', 'destructiblesDestroyed' ],
      [ 'totalDamageDealtVariableId', 'totalDamageDealt' ],
      [ 'highestDamageDealtVariableId', 'highestDamageDealt' ],
      [ 'numberOfCritsDealtVariableId', 'numberOfCritsDealt' ],
      [ 'biggestCritDealtVariableId', 'biggestCritDealt' ],
      [ 'numberOfParriesVariableId', 'numberOfParries' ],
      [ 'numberOfPreciseParriesVariableId', 'numberOfPreciseParries' ],
      [ 'totalDamageTakenVariableId', 'totalDamageTaken' ],
      [ 'highestDamageTakenVariableId', 'highestDamageTaken' ],
      [ 'numberOfCritsTakenVariableId', 'numberOfCritsTaken' ],
      [ 'biggestCritTakenVariableId', 'biggestCritTaken' ],
      [ 'mainhandSkillUsageVariableId', 'mainhandSkillUsage' ],
      [ 'offhandSkillUsageVariableId', 'offhandSkillUsage' ],
      [ 'assignedSkillUsageVariableId', 'assignedSkillUsage' ],
      [ 'dodgeSkillUsageVariableId', 'dodgeSkillUsage' ],
      [ 'numberOfDeathsVariableId', 'numberOfDeaths' ],
    ].forEach(([ metadataKey, configKey ]) =>
    {
      it(`points ${metadataKey} at the variable the config named`, () =>
      {
        // Arrange & Act
        const { Metadata } = globalThis.J.ABS.EXT.METRICS;

        // Assert- the fixture's ids are deliberately scattered, so a metric wired to the wrong key
        // lands on a number no other metric uses.
        expect(Metadata[metadataKey]).toBe(SAMPLE_METRICS_CONFIG[configKey]);
      });
    });
  });
});
//endregion plugins/abs/ext/metrics/_metadata/metadata.test.js