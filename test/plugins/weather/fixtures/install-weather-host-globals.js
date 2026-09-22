//region plugins/weather/fixtures/install-weather-host-globals.js
import { installJBaseHostGlobals } from '../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/core/models/PluginMetadata.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

/**
 * The weather configuration the stubbed external loader will hand back.
 * @type {object}
 */
let configuredWeather = {
  motions: {},
  presets: {},
  variables: { enabled: false },
};

/**
 * Chooses what the stubbed external config appears to contain.
 * @param {object} config The weather configuration to report.
 */
export function setWeatherConfig(config)
{
  configuredWeather = config;
}

/**
 * Points the bare build-time identifiers at J-Weather, which its initialization reads at import time.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJWeather(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Weather';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Installs everything J-Weather's own source expects a loaded game to already hold.
 *
 * The external config loader is stubbed because the real one reads a file off the game's disk, which
 * a unit test has neither reason nor ability to provide. Everything downstream of the load cares only
 * about the shape it produces.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 */
export function installWeatherHostGlobals(sandbox = globalThis)
{
  installJBaseHostGlobals(sandbox);

  // J-Weather's metadata subclasses this as a bare global rather than importing it.
  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-Weather', {});

  sandbox.ExternalJsonConfigLoaderOptions = {
    Builder: () =>
    {
      const builder = {
        pluginName: () => builder,
        configName: () => builder,
        logSummary: () => builder,
        build: () => ({}),
      };

      return builder;
    },
  };
  sandbox.ExternalJsonConfigLoader = {
    load: () => configuredWeather,
  };

  // the version gate reads these before anything else in initialization runs.
  sandbox.J ||= {};
  sandbox.J.BASE ||= {};
  sandbox.J.BASE.Metadata ||= { Version: '3.18.0' };
  sandbox.J.BASE.Helpers ||= { satisfies: () => true };
}
//endregion plugins/weather/fixtures/install-weather-host-globals.js