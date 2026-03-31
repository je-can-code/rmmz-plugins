//region install-plugin-manager-with-params
/**
 * Replaces {@link PluginManager} with a wrapper that overrides `parameters()` for a single plugin.
 *
 * @param {object} sandbox
 * @param {string} pluginName
 * @param {Record<string, string>} pluginParameterStrings
 */
export function installPluginManagerWithParams(sandbox, pluginName, pluginParameterStrings)
{
  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === pluginName)
      {
        return pluginParameterStrings;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };
}
//endregion install-plugin-manager-with-params
