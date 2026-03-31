//region install-jabs-onchance-stub
/**
 * {@link RPGManager.getOnChanceEffectsFromDatabaseObject} instantiates {@link JABS_OnChanceEffect}, which lives in
 * JABS, not J-Base. Tests that exercise on-chance helpers must define a minimal global before {@link out/J-Base.js}
 * evaluates.
 *
 * @param {object} sandbox VM global object (before or after `vm.createContext`; assign properties on the same object
 *   passed into the context).
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

  sandbox.JABS_OnChanceEffect = JABS_OnChanceEffect;
}
//endregion install-jabs-onchance-stub
