//region engine-stubs
import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';

const DEFAULT_J_SKILL_SLOTS_PARAMETERS = {
  'menu-switch': '101',
  'equippable-skill-type-ids': '[]',
};

/**
 * Stubs so {@link out/sks/J-SkillSlots.js} can evaluate (menu windows + plugin parameters + actor init chain).
 *
 * @param {object} sandbox
 * @param {Record<string, string>} [skillSlotsParameters] raw shape passed to {@link PluginMetadata} for `J-SkillSlots`.
 */
export function installSksEngineStubs(sandbox, skillSlotsParameters = DEFAULT_J_SKILL_SLOTS_PARAMETERS)
{
  installMinimalMenuUiStubs(sandbox);

  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-SkillSlots')
      {
        return skillSlotsParameters;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

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
      id: 1,
      name: '',
      note: '',
      classId: 1,
      traits: [],
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
//endregion engine-stubs
