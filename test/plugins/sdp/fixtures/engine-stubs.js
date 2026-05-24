//region engine-stubs
import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';
import { buildVitestSdpConfigJson } from './sdp-config-json.js';

const VITEST_SDP_CONFIG_JSON = buildVitestSdpConfigJson();

const noop = function()
{
};

export const DEFAULT_SDP_PLUGIN_PARAMS = {
  menuSwitch: '104',
  sdpIcon: '306',
  victoryText: 'SDP points earned!',
  menuCommandName: 'Distribute',
  menuCommandIcon: '2563',
  sdpUnitSingular: 'panel',
  sdpUnitPlural: 'panels',
  sdpPointsDisplayName: 'SDP',
  showInBoth: 'false',
  sdpDefaultCommonBase: '0',
  sdpDefaultCommonFlat: '70',
  sdpDefaultCommonMult: '1.06',
  sdpDefaultMagicalBase: '0',
  sdpDefaultMagicalFlat: '235',
  sdpDefaultMagicalMult: '1.06',
  sdpDefaultRareBase: '0',
  sdpDefaultRareFlat: '1180',
  sdpDefaultRareMult: '1.06',
  sdpDefaultEpicBase: '0',
  sdpDefaultEpicFlat: '4320',
  sdpDefaultEpicMult: '1.06',
  sdpDefaultLegendaryBase: '0',
  sdpDefaultLegendaryFlat: '11900',
  sdpDefaultLegendaryMult: '1.06',
  sdpDefaultGodlikeBase: '0',
  sdpDefaultGodlikeFlat: '30500',
  sdpDefaultGodlikeMult: '1.06',
};

/**
 * Globals required for {@link out/sdp/J-SDP.js} to evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installSdpEngineStubs(sandbox)
{
  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-SDP')
      {
        return DEFAULT_SDP_PLUGIN_PARAMS;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  sandbox.StorageManager.fsReadFile = function()
  {
    return VITEST_SDP_CONFIG_JSON;
  };

  sandbox.SoundManager.playRecovery = noop;

  installMinimalMenuUiStubs(sandbox);

  function BattleManagerCtor()
  {
  }

  BattleManagerCtor.makeRewards = noop;
  BattleManagerCtor.gainRewards = noop;
  BattleManagerCtor.displayRewards = noop;

  sandbox.BattleManager = BattleManagerCtor;

  sandbox.IconManager = {
    longParam()
    {
      return '';
    },
  };

  sandbox.TextManager.longParam = function()
  {
    return '';
  };

  sandbox.TextManager.longParamDescription = function()
  {
    return '';
  };

  function Game_Action()
  {
  }

  Game_Action.prototype.applyGlobal = noop;
  Game_Action.prototype.apply = noop;

  sandbox.Game_Action = Game_Action;

  sandbox.Game_Actor.prototype.onBattlerDataChange = noop;

  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };

  sandbox.Game_Actor.prototype.param = function()
  {
    return 0;
  };

  sandbox.Game_Actor.prototype.xparam = function()
  {
    return 0;
  };

  sandbox.Game_Actor.prototype.sparam = function()
  {
    return 0;
  };

  sandbox.Game_Actor.prototype.maxTp = function()
  {
    return 0;
  };

  sandbox.Game_Enemy.prototype.extraDrops = function()
  {
    return [];
  };

  sandbox.Game_Enemy.prototype.findLoot = function()
  {
    return null;
  };

  sandbox.Game_Party.prototype.initialize = noop;

  sandbox.$gameActors = {
    _byId: {},
    actor(id)
    {
      const a = this._byId[id];
      if (a === undefined || a === null)
      {
        return null;
      }

      return a;
    },
    actors()
    {
      return Object.keys(this._byId)
        .map(k => this._byId[k])
        .filter(a => a !== undefined && a !== null);
    },
  };

  sandbox.Game_Player.prototype.useOnPickup = noop;

  sandbox.Game_System.prototype.initialize = noop;

  function Game_Troop()
  {
  }

  Game_Troop.prototype.deadMembers = function()
  {
    return [];
  };

  sandbox.Game_Troop = Game_Troop;

  function Scene_Map()
  {
  }

  Object.setPrototypeOf(Scene_Map.prototype, sandbox.Scene_Base.prototype);
  Scene_Map.prototype.constructor = Scene_Map;
  Scene_Map.prototype.createJabsAbsMenuMainWindow = noop;
  Scene_Map.prototype.getJabsMainListWindow = function()
  {
    return { setHandler: noop };
  };

  sandbox.Scene_Map = Scene_Map;

  function Scene_Menu()
  {
  }

  Object.setPrototypeOf(Scene_Menu.prototype, sandbox.Scene_MenuBase.prototype);
  Scene_Menu.prototype.constructor = Scene_Menu;
  Scene_Menu.prototype.createCommandWindow = noop;

  sandbox.Scene_Menu = Scene_Menu;

  function Window_MenuCommand()
  {
  }

  Window_MenuCommand.prototype.makeCommandList = noop;

  sandbox.Window_MenuCommand = Window_MenuCommand;
}
//endregion engine-stubs
