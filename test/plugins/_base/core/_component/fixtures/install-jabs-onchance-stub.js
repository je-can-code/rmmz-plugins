//region plugins/_base/_component/fixtures/install-jabs-onchance-stub.js
/**
 * {@link RPGManager.getOnChanceEffectsFromDatabaseObject} instantiates {@link JABS_OnChanceEffect}, which lives in
 * JABS, not J-Base. Tests that exercise on-chance helpers must define a minimal global before J-Base's own source
 * files import.
 *
 * @param {object} sandbox The host-globals object (typically `globalThis`) to assign the stub onto.
 */
export function installJabsOnChanceEffectGlobalStub(sandbox)
{
  /**
   * @param {number} skillId
   * @param {number} chance
   * @param {string} key
   */
  function JABS_OnChanceEffect(skillId, chance, key)
  {
    this.skillId = skillId;
    this.chance = chance;
    this.key = key;
  }

  /**
   * Determines whether or not this on-chance effect should trigger.
   * @param {number} [rollForPositive=1] The number of rolls that count as success.
   * @param {number} [rollForNegative=0] The number of rolls that count as failure.
   * @returns {boolean}
   */
  JABS_OnChanceEffect.prototype.shouldTrigger = function(rollForPositive = 1, rollForNegative = 0)
  {
    return sandbox.RPGManager.chanceIn100(this.chance, rollForPositive, rollForNegative);
  };

  /**
   * Resolves how many times this effect's action should execute, mirroring the real class's
   * Accumulate Mode/Encore-aware signature.
   * @param {number} [rollForPositive=1]
   * @param {number} [rollForNegative=0]
   * @param {object=} positiveRoller
   * @returns {number}
   */
  JABS_OnChanceEffect.prototype.resolveProcCount = function(rollForPositive = 1, rollForNegative = 0, positiveRoller = null)
  {
    if (!positiveRoller)
    {
      return this.shouldTrigger(rollForPositive, rollForNegative) ? 1 : 0;
    }

    return sandbox.RPGManager.resolveProcCount(positiveRoller, this.chance, rollForPositive, rollForNegative);
  };

  /**
   * Gets the underlying skill for this on-chance effect, mirroring the real class's signature
   * closely enough for luck/curse roll-threading call sites that read `<thisLuckyRolls>`/
   * `<thisCursedRolls>` off of it.
   * @param {object=} battler The target perceiving the skill; defaults to none.
   * @returns {object}
   */
  JABS_OnChanceEffect.prototype.baseSkill = function(battler = null)
  {
    if (battler && typeof battler.skill === 'function')
    {
      return battler.skill(this.skillId);
    }

    return sandbox.$dataSkills?.at(this.skillId);
  };

  sandbox.JABS_OnChanceEffect = JABS_OnChanceEffect;
}
//endregion plugins/_base/_component/fixtures/install-jabs-onchance-stub.js
