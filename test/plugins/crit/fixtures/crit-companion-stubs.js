//region crit-companion-stubs
const noop = function()
{
};

/**
 * Engine facades required for {@link out/crit/J-CriticalFactors.js} after {@link out/natural/J-NaturalGrowth.js}.
 *
 * @param {object} sandbox VM global object.
 */
export function installCritCompanionStubs(sandbox)
{
  function Game_Action()
  {
  }

  Game_Action.prototype.initialize = noop;
  Game_Action.prototype.apply = noop;

  sandbox.Game_Action = Game_Action;

  Object.setPrototypeOf(sandbox.Game_Battler.prototype, sandbox.Game_BattlerBase.prototype);
  sandbox.Game_Battler.prototype.constructor = sandbox.Game_Battler;

  sandbox.Game_Actor.prototype.parameter = function()
  {
    return 0;
  };

  sandbox.IconManager = {
    parameterIcon()
    {
      return 0;
    },
  };

  sandbox.TextManager.parameterDescription = function()
  {
    return [ '' ];
  };

  // RPGManager.getOnChanceEffectsFromDatabaseObject(s) constructs one of these per matched tag- a
  // real J-ABS class (JABS_OnChanceEffect.js), bare-global by ship time like everything else here.
  function JABS_OnChanceEffect(skillId, chance, key, hitType = null)
  {
    this.skillId = skillId;
    this.chance = chance;
    this.key = key;
    this.hitType = hitType;
  }

  sandbox.JABS_OnChanceEffect = JABS_OnChanceEffect;
}
//endregion crit-companion-stubs