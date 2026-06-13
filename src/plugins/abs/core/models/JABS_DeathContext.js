//region JABS_DeathContext
import JABS_AiManager from '../managers/JABS_AiManager.js';

/**
 * A snapshot of the conditions under which a battler died.
 * Populated immediately after the killing blow lands; available to all {@link Game_Battler#onDeath}
 * aliases and cleared on {@link Game_Actor#onRevive}.
 */
class JABS_DeathContext
{
  /**
   * @param {number[]} elementIds The element ids of the killing action.
   * @param {string} hitType One of "physical", "magical", or "certain".
   * @param {number} stypeId The skill type id of the killing skill.
   * @param {string} killerUuid The uuid of the battler that landed the killing blow.
   */
  constructor(elementIds, hitType, stypeId, killerUuid)
  {
    this.initMembers(elementIds, hitType, stypeId, killerUuid);
  }

  /**
   * Initializes the members of this class.
   * @param {number[]} elementIds The element ids of the killing action.
   * @param {string} hitType One of "physical", "magical", or "certain".
   * @param {number} stypeId The skill type id of the killing skill.
   * @param {string} killerUuid The uuid of the battler that landed the killing blow.
   */
  initMembers(elementIds, hitType, stypeId, killerUuid)
  {
    /**
     * All element ids carried by the killing action.
     * @type {number[]}
     */
    this.elementIds = elementIds;

    /**
     * The hit type of the killing action: "physical", "magical", or "certain".
     * @type {string}
     */
    this.hitType = hitType;

    /**
     * The skill type id of the killing skill.
     * @type {number}
     */
    this.stypeId = stypeId;

    /**
     * The uuid of the battler that landed the killing blow.
     * @type {string}
     */
    this.killerUuid = killerUuid;
  }

  /**
   * Whether the killing blow was physical.
   * @returns {boolean}
   */
  isPhysical()
  {
    return this.hitType === 'physical';
  }

  /**
   * Whether the killing blow was magical.
   * @returns {boolean}
   */
  isMagical()
  {
    return this.hitType === 'magical';
  }

  /**
   * Whether the killing blow was certain-hit.
   * @returns {boolean}
   */
  isCertain()
  {
    return this.hitType === 'certain';
  }

  /**
   * Whether the killing blow carried the given element id.
   * @param {number} elementId
   * @returns {boolean}
   */
  hasElement(elementId)
  {
    return this.elementIds.includes(elementId);
  }

  /**
   * Gets the {@link JABS_Battler} that landed the killing blow.
   * @returns {JABS_Battler|undefined}
   */
  killer()
  {
    return JABS_AiManager.getBattlerByUuid(this.killerUuid);
  }
}

export default JABS_DeathContext;
//endregion JABS_DeathContext
