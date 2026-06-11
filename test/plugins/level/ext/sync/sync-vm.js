//region plugins/level/ext/sync/sync-vm.js
import { appendShippedPluginToVm, evaluateShippedPlugin } from '../../../../setup/shipped-plugin-vm.js';
import { installLevelEngineStubs } from '../../fixtures/engine-stubs.js';

export const LEVEL_SYNC_OUT_FILENAME = 'level/ext/J-Level-Sync.js';

/**
 * Loads {@link out/level/J-LevelMaster.js} followed by
 * {@link out/level/ext/J-Level-Sync.js} with J-Base and harness stubs.
 *
 * @param {object} sandbox
 * @param {object} [syncPluginParams] Optional plugin parameter overrides for J-LEVEL-Sync.
 */
export function loadLevelSyncPluginVm(sandbox, syncPluginParams = {})
{
  // install J-Base + J-LevelMaster first.
  evaluateShippedPlugin({
    outFilename: 'level/J-LevelMaster.js',
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installLevelEngineStubs(s);
      installLevelSyncEngineStubs(s, syncPluginParams);
    },
  });

  // append J-Level-Sync on top of the same sandbox.
  appendShippedPluginToVm({
    sandbox,
    outFilename: LEVEL_SYNC_OUT_FILENAME,
  });
}

/**
 * Installs the additional stubs required by J-Level-Sync.
 *
 * @param {object} sandbox
 * @param {object} syncPluginParams Plugin parameter overrides for J-LEVEL-Sync.
 */
function installLevelSyncEngineStubs(sandbox, syncPluginParams)
{
  const DEFAULT_SYNC_PLUGIN_PARAMS = {
    'sync-indicator-icon': '75',
    'sync-affects-exp': 'false',
  };

  const mergedParams = { ...DEFAULT_SYNC_PLUGIN_PARAMS, ...syncPluginParams };

  // extend the PluginManager stub to also serve J-LEVEL-Sync parameters.
  const prevPm = sandbox.PluginManager;
  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-Level-Sync')
      {
        return mergedParams;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  // stub $gameMap with content sync accessors.
  sandbox.$gameMap = {
    _j: { _levelSync: { _contentSyncLevel: null, _contentSyncUplevel: false } },
    getMapContentSyncLevel()
    {
      return this._j._levelSync._contentSyncLevel;
    },
    isMapContentSyncUplevel()
    {
      return this._j._levelSync._contentSyncUplevel;
    },
  };

  // stub $gameSystem with content sync session storage.
  sandbox.$gameSystem = {
    _j: { _levelSync: { _contentSyncSession: null } },
    getContentSyncSession()
    {
      return this._j._levelSync._contentSyncSession;
    },
    setContentSyncSession(level, uplevel)
    {
      this._j._levelSync._contentSyncSession = { level, uplevel };
    },
    clearContentSyncSession()
    {
      this._j._levelSync._contentSyncSession = null;
    },
    hasContentSyncSession()
    {
      return this._j._levelSync._contentSyncSession !== null;
    },
  };

  // stub $gameParty members for refresh calls.
  sandbox.$gameParty = {
    _members: [],
    members()
    {
      return this._members;
    },
  };
}
//endregion plugins/level/ext/sync/sync-vm.js
