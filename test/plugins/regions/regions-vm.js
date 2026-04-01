//region plugins/regions/regions-vm.js
import { appendShippedPluginToVm, evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS } from './fixtures/regions-plugin-params.js';
import {
  installRegionsCoreEngineStubs,
  installRegionsSkillsStackEngineStubs,
  installRegionsStatesStackEngineStubs,
} from './fixtures/engine-stubs.js';

export const REGION_EFFECTS_OUT_FILENAME = 'regions/J-RegionEffects.js';

export const REGION_STATES_OUT_FILENAME = 'regions/ext/J-Regions-States.js';

export const REGION_SKILLS_OUT_FILENAME = 'regions/ext/J-Regions-Skills.js';

/**
 * Loads {@link out/regions/J-RegionEffects.js} with J-Base and harness.
 *
 * @param {object} sandbox
 * @param {object} [options]
 * @param {Record<string, string>} [options.regionEffectsParams]
 */
export function loadRegionEffectsPluginVm(sandbox, options = {})
{
  const {
    regionEffectsParams = DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
  } = options;

  evaluateShippedPlugin({
    outFilename: REGION_EFFECTS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installRegionsCoreEngineStubs(s, regionEffectsParams);
    },
  });
}

/**
 * Loads core {@link out/regions/J-RegionEffects.js} then {@link out/regions/ext/J-Regions-States.js}.
 *
 * @param {object} sandbox
 */
export function loadRegionsStatesStackVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: REGION_EFFECTS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installRegionsStatesStackEngineStubs(s);
    },
  });

  appendShippedPluginToVm({
    sandbox,
    outFilename: REGION_STATES_OUT_FILENAME,
  });
}

/**
 * Loads core {@link out/regions/J-RegionEffects.js} then {@link out/regions/ext/J-Regions-Skills.js}.
 *
 * @param {object} sandbox
 */
export function loadRegionsSkillsStackVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: REGION_EFFECTS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installRegionsSkillsStackEngineStubs(s);
    },
  });

  appendShippedPluginToVm({
    sandbox,
    outFilename: REGION_SKILLS_OUT_FILENAME,
  });
}
//endregion plugins/regions/regions-vm.js
