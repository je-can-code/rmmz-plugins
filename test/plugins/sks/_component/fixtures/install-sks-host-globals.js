//region plugins/sks/_component/fixtures/install-sks-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/models/PluginMetadata.js';
import RPG_Skill from '../../../../../src/plugins/_base/database/implementations/RPG_Skill.js';
import RPG_Weapon from '../../../../../src/plugins/_base/database/implementations/RPG_Weapon.js';

export const DEFAULT_SKS_PLUGIN_PARAMS = {
  'menu-switch': '101',
  'equippable-skill-type-ids': '[]',
  'default-max-slots': '4',
  'default-max-slot-points': '4',
  'enable-exclusive-mode': 'false',
  'slots-only': 'false',
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by
 * _base/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-SkillSlots's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJSks(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-SkillSlots';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Builds a real {@link RPG_Skill}-shaped object for note-parsing tests without going through
 * $dataSkills/DataManager loading.
 * @param {object} props Overrides merged onto the RPG_Skill prototype.
 * @returns {RPG_Skill}
 */
export function skillData(props)
{
  return Object.assign(Object.create(RPG_Skill.prototype), props);
}

/**
 * Builds a real {@link RPG_Weapon}-shaped object for note-parsing tests.
 * @param {object} props Overrides merged onto the RPG_Weapon prototype.
 * @returns {RPG_Weapon}
 */
export function weaponData(props)
{
  return Object.assign(Object.create(RPG_Weapon.prototype), props);
}

/**
 * Globals required for J-SkillSlots's Game_Actor.js to evaluate when direct-imported into the real
 * Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>} [sksPluginParameterStrings] `PluginManager.parameters('J-SkillSlots')` shape.
 */
export function installSksHostGlobals(sandbox = globalThis, sksPluginParameterStrings = DEFAULT_SKS_PLUGIN_PARAMS)
{
  if (sandbox.__sksHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__sksHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // sks's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  // SkillEquipSlot.js calls SerializableRegistry.register(...) as an import-time side effect (so
  // JsonEx restores keep prototype methods after a save load).
  sandbox.SerializableRegistry ??= { register() {} };

  installPluginManagerWithParams(sandbox, 'J-SkillSlots', sksPluginParameterStrings);

  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;

  sandbox.Game_Actor.prototype.initMembers = function()
  {
    sandbox.Game_Battler.prototype.initMembers.call(this);
  };

  sandbox.Game_Actor.prototype.equips = function()
  {
    return [];
  };

  sandbox.Game_Actor.prototype.actorId = function()
  {
    return 1;
  };

  sandbox.Game_Actor.prototype.actor = function()
  {
    return {
      id: 1, name: '', note: '', classId: 1, traits: [],
    };
  };

  sandbox.Game_Actor.prototype.class = function()
  {
    return { note: '' };
  };

  sandbox.Game_Actor.prototype.currentClass = function()
  {
    return { id: 1, note: '' };
  };
}
//endregion plugins/sks/_component/fixtures/install-sks-host-globals.js
