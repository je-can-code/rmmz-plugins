//region engine-stubs
const noop = function()
{
};

/**
 * Minimal globals so {@link out/extend/J-SkillExtend.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installExtendEngineStubs(sandbox)
{
  sandbox.$dataSkills = [];

  function Game_Item()
  {
  }

  Game_Item.prototype.initialize = function(item)
  {
    this._dataClass = '';
    this._item = item || null;
  };

  Game_Item.prototype.object = function()
  {
    return this._item;
  };

  Game_Item.prototype.setObject = function(obj)
  {
    this._item = obj;
  };

  sandbox.Game_Item = Game_Item;

  function Game_Action()
  {
    this._item = new Game_Item();
  }

  Game_Action.prototype.initialize = noop;
  Game_Action.prototype.clear = noop;
  Game_Action.prototype.setSkill = function(skillId)
  {
    this._item.initialize(sandbox.$dataSkills[skillId]);
  };

  Game_Action.prototype.setItemObject = function(itemObject)
  {
    this._item.setObject(itemObject);
  };

  Game_Action.prototype.apply = noop;
  Game_Action.prototype.applyItemUserEffect = noop;
  Game_Action.prototype.subject = function()
  {
    return null;
  };

  Game_Action.prototype.item = function()
  {
    return this._item.object();
  };

  sandbox.Game_Action = Game_Action;

  function JABS_SkillSlotManager()
  {
  }

  JABS_SkillSlotManager.prototype.filterActionSkills = function()
  {
    return true;
  };

  sandbox.JABS_SkillSlotManager = JABS_SkillSlotManager;

  sandbox.Game_Actor.prototype.learnSkill = noop;
  sandbox.Game_Actor.prototype.forgetSkill = noop;
  sandbox.Game_Actor.prototype.skill = function(skillId)
  {
    return sandbox.$dataSkills[skillId];
  };

  sandbox.Game_Enemy.prototype.learnSkill = noop;

  sandbox.Game_Enemy.prototype.skill = function(skillId)
  {
    return sandbox.$dataSkills[skillId];
  };

  sandbox.Game_Action.prototype.applyStates = function(target, effects)
  {
    if (effects.length)
    {
      effects.forEach(effect =>
      {
        if (effect.shouldTrigger())
        {
          target.addState(effect.skillId, this.subject());
        }
      });
    }
  };

  sandbox.Game_Actor.prototype.allStates = function()
  {
    return [];
  };

  sandbox.Game_Enemy.prototype.allStates = function()
  {
    return [];
  };

  sandbox.Game_Actor.prototype.addState = function(stateId)
  {
    this.__addedStates = this.__addedStates || [];
    this.__addedStates.push(stateId);
  };

  sandbox.Game_Enemy.prototype.addState = function(stateId)
  {
    this.__addedStates = this.__addedStates || [];
    this.__addedStates.push(stateId);
  };

  // this lightweight fixture doesn't load the real J-ABS Game_Battler roll-threading
  // augmentations, so stub sentinel (no bonus) implementations directly.
  sandbox.Game_Actor.prototype.getPositiveRollsForSkill = () => 0;
  sandbox.Game_Actor.prototype.getNegativeRolls = () => 0;
  sandbox.Game_Actor.prototype.getNegativeRollsForSkill = () => 0;
  sandbox.Game_Enemy.prototype.getPositiveRollsForSkill = () => 0;
  sandbox.Game_Enemy.prototype.getNegativeRolls = () => 0;
  sandbox.Game_Enemy.prototype.getNegativeRollsForSkill = () => 0;
}
//endregion engine-stubs
