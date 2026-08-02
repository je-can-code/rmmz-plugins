//region JABS_SkillSlot
import JABS_Cooldown from './JABS_Cooldown.js';
/**
 * This class represents a single skill slot handled by the skill slot manager.
 */
class JABS_SkillSlot
{
  /**
   * Constructor.
   * @param {string} key The key of this skill slot.
   * @param {number} skillId The id of the skill.
   */
  constructor(key, skillId)
  {
    this.initialize(key, skillId);
  }

  /**
   * Initializes this class. Executed when this class is instantiated.
   */
  initialize(key, skillId)
  {
    /**
     * The key of this skill slot.
     *
     * Maps 1:1 to one of the possible skill slot button combinations.
     * @type {string}
     */
    // assign key on this instance for callers.
    this.key = key;

    /**
     * The id of the skill.
     *
     * Set to 0 when a skill is not equipped in this slot.
     * @type {number}
     */
    this.id = skillId;

    // initialize the rest of the members.
    this.initMembers();
  }

  /**
   * Initializes all properties on this class.
   */
  initMembers()
  {
    /**
     * The combo id that comes after the current id; default is 0.
     * @type {number}
     */
    this.comboId = 0;

    /**
     * The cooldown associated with this slot.
     * @type {JABS_Cooldown}
     */
    this.cooldown = new JABS_Cooldown(this.key);

    /**
     * Whether or not this skill slot is locked.
     *
     * Locked slots cannot be changed until unlocked.
     * @type {boolean}
     */
    this.locked = false;

    /**
     * The skill id that the player has explicitly pinned into this slot.
     *
     * Pinning is independent of {@link locked}: a pin is a player preference that survives
     * equipment refreshes and wins over auto-derived skill ids during resolution. A value
     * of 0 means no pin is set. Currently only meaningful for the offhand slot.
     * @type {number}
     */
    this.pinnedSkillId = 0;

    // initialize the refreshes.
    this.initVisualRefreshes();
  }

  //region refreshes
  /**
   * Initializes the various visual refreshes.
   */
  initVisualRefreshes()
  {
    /**
     * Whether or not this skill slot's name needs refreshing.
     * @type {boolean}
     */
    this.needsNameRefresh = true;

    /**
     * Whether or not this skill slot's item cost needs refreshing.
     * @type {boolean}
     */
    this.needsItemCostRefresh = true;

    /**
     * Whether or not this skill slot's hp cost needs refreshing.
     * @type {boolean}
     */
    this.needsHpCostRefresh = true;

    /**
     * Whether or not this skill slot's mp cost needs refreshing.
     * @type {boolean}
     */
    this.needsMpCostRefresh = true;

    /**
     * Whether or not this skill slot's tp cost needs refreshing.
     * @type {boolean}
     */
    this.needsTpCostRefresh = true;

    /**
     * Whether or not this skill slot's icon needs refreshing.
     * @type {boolean}
     */
    this.needsIconRefresh = true;
  }

  /**
   * Flags this skillslot to need a visual refresh for the HUD.
   */
  flagSkillSlotForRefresh()
  {
    this.needsNameRefresh = true;
    this.needsHpCostRefresh = true;
    this.needsMpCostRefresh = true;
    // assign needs tp cost refresh on this instance for callers.
    this.needsTpCostRefresh = true;
    this.needsItemCostRefresh = true;
    this.needsIconRefresh = true;
  }

  /**
   * Checks whether or not this skillslot's name is in need of a visual refresh.
   * @returns {boolean}
   */
  needsVisualNameRefresh()
  {
    return this.needsNameRefresh;
  }

  /**
   * Acknowledges that this skillslot's name was visually refreshed.
   */
  acknowledgeNameRefresh()
  {
    this.needsNameRefresh = false;
  }

  /**
   * Checks whether or not this skillslot's item cost is in need of a visual refresh by type.
   * @param {Sprite_SkillCost.Types} costType The cost type driving this step.
   * @returns {boolean} True if the given type
   */
  needsVisualCostRefreshByType(costType)
  {
    switch (costType)
    {
      case (Sprite_SkillCost.Types.HP):
        return this.needsHpCostRefresh;
      case (Sprite_SkillCost.Types.MP):
        return this.needsMpCostRefresh;
      case (Sprite_SkillCost.Types.TP):
        return this.needsTpCostRefresh;
      case (Sprite_SkillCost.Types.Item):
        return this.needsItemCostRefresh;
    }

    // Surface a non-fatal warning for operator triage.
    console.warn(`attempted to request a refresh of type: ${costType}, but it isn't implemented.`);
    return false;
  }

  /**
   * Acknowledges that this skillslot's item cost was visually refreshed.
   */
  acknowledgeCostRefreshByType(costType)
  {
    switch (costType)
    {
      case (Sprite_SkillCost.Types.HP):
        this.needsHpCostRefresh = false;
        break;
      case (Sprite_SkillCost.Types.MP):
        this.needsMpCostRefresh = false;
        break;
      case (Sprite_SkillCost.Types.TP):
        this.needsTpCostRefresh = false;
        break;
      case (Sprite_SkillCost.Types.Item):
        this.needsItemCostRefresh = false;
        break;
      default:
        console.warn(`attempted to acknowledge a refresh of type: ${costType}, but it isn't implemented.`);
        break;
    }
  }

  /**
   * Checks whether or not this skillslot's icon is in need of a visual refresh.
   * @returns {boolean}
   */
  needsVisualIconRefresh()
  {
    return this.needsIconRefresh;
  }

  /**
   * Acknowledges that this skillslot's icon was visually refreshed.
   */
  acknowledgeIconRefresh()
  {
    this.needsIconRefresh = false;
  }
  //endregion refreshes

  /**
   * Gets the cooldown associated with this skill slot.
   * @returns {JABS_Cooldown}
   */
  getCooldown()
  {
    return this.cooldown;
  }

  /**
   * Updates the cooldown for this skill slot.
   */
  updateCooldown(isCasting = false)
  {
    // update the cooldown.
    this.getCooldown()
      .update(isCasting);

    // handle the need to clear the combo id from this slot.
    this.handleComboReadiness();
  }

  /**
   * Determines readiness for combos based on cooldowns.
   */
  handleComboReadiness()
  {
    // grab this slot's cooldown.
    const cooldown = this.getCooldown();

    // check if we need to clear the combo id.
    if (cooldown.needsComboClear())
    {
      // otherwise, reset the combo id for this slot.
      this.resetCombo();

      // let the cooldown know we did the deed.
      cooldown.acknowledgeComboClear();
    }
  }

  /**
   * An event hook fired when this skill slot changes in some way.
   */
  onChange()
  {
    // flags the slot for visual refresh.
    this.flagSkillSlotForRefresh();
  }

  /**
   * Resets the combo id for this slot.
   */
  resetCombo()
  {
    // reset the combo id to 0, forcing use of the main id.
    this.setComboId(0);

    // perform the on-change event hook.
    this.onChange();
  }

  /**
   * Gets the next combo skill id for this skill slot.
   * @returns {number}
   */
  getComboId()
  {
    return this.comboId;
  }

  /**
   * Sets the next combo skill id for this skill slot.
   * @param {number} skillId The new skill id that is next in the combo.
   * @returns {this} Returns `this` for fluent chaining.
   */
  setComboId(skillId)
  {
    // initialize change to false.
    let changed = false;

    // check if the combo id is being changed.
    if (skillId !== this.comboId)
    {
      // it was changed.
      changed = true;
    }

    // update the combo id.
    this.comboId = skillId;

    // check if the slot had a change.
    if (changed)
    {
      // perform the on-change event hook.
      this.onChange();
    }

    // return this for fluent-chaining.
    return this;
  }

  /**
   * Gets whether or not this slot has anything assigned to it.
   * @returns {boolean}
   */
  isUsable()
  {
    return this.id > 0;
  }

  /**
   * Gets whether or not this slot is empty.
   * @returns {boolean}
   */
  isEmpty()
  {
    return this.id === 0;
  }

  /**
   * Gets whether or not this slot stores an item id rather than a skill id.
   * Both {@link JABS_Button.Tool} and {@link JABS_Button.UsableItem} equip items from $dataItems.
   * @returns {boolean}
   */
  isItem()
  {
    return this.key === JABS_Button.Tool || this.key === JABS_Button.UsableItem;
  }

  /**
   * Gets whether or not this slot belongs to a skill slot.
   * @returns {boolean}
   */
  isSkill()
  {
    return this.isItem() === false;
  }

  /**
   * Checks whether or not this is a "primary" slot making up the base functions
   * that this actor can perform on the field.
   * @returns {boolean}
   */
  isPrimarySlot()
  {
    const slots = [
      JABS_Button.Mainhand, JABS_Button.Offhand, JABS_Button.Tool,
      JABS_Button.UsableItem, JABS_Button.Dodge,
    ];

    return slots.includes(this.key);
  }

  /**
   * Checks whether or not this is a "secondary" slot making up the optional and
   * flexible functions this actor can perform on the field.
   * @returns {boolean}
   */
  isSecondarySlot()
  {
    const slots = [
      JABS_Button.CombatSkill1, JABS_Button.CombatSkill2, JABS_Button.CombatSkill3, JABS_Button.CombatSkill4, ];

    return slots.includes(this.key);
  }

  /**
   * Sets a new skill id to this slot.
   *
   * Slot cannot be assigned if it is locked.
   * @param {number} skillId The new skill id to assign to this slot.
   * @returns {this} Returns `this` for fluent chaining.
   */
  setSkillId(skillId)
  {
    if (this.isLocked())
    {
      console.warn("This slot is currently locked.");
      SoundManager.playBuzzer();
      return this;
    }

    // assign the new skill id.
    this.id = skillId;

    // no change check, always perform the on-change event hook.
    this.onChange();

    // return this for fluent-chaining.
    return this;
  }

  /**
   * Sets whether or not this slot is locked.
   * @param {boolean} locked Whether or not this slot is locked.
   * @returns {this} Returns `this` for fluent chaining.
   */
  setLock(locked)
  {
    if (this.canBeLocked())
    {
      this.locked = locked;
    }

    return this;
  }

  /**
   * Gets whether or not this slot can be locked.
   * @returns {boolean}
   */
  canBeLocked()
  {
    const lockproofSlots = [
      JABS_Button.Mainhand, JABS_Button.Offhand ];

    return !lockproofSlots.includes(this.key);
  }

  /**
   * Locks this slot, preventing changing of skill assignment.
   * @returns {this} Returns `this` for fluent chaining.
   */
  lock()
  {
    this.setLock(true);
    return this;
  }

  /**
   * Unlocks this slot.
   * @returns {this} Returns `this` for fluent chaining.
   */
  unlock()
  {
    this.setLock(false);
    return this;
  }

  /**
   * Gets whether or not this slot is locked.
   * @returns {boolean}
   */
  isLocked()
  {
    return this.locked;
  }

  //region pin
  /**
   * Gets the skill id that has been explicitly pinned to this slot.
   *
   * Returns 0 when no pin is set. Defensively handles legacy save data where the
   * pin field may be undefined on a deserialized slot.
   * @returns {number}
   */
  getPinnedSkillId()
  {
    // legacy saves may not have this field; treat absence as "no pin".
    return this.pinnedSkillId ?? 0;
  }

  /**
   * Sets the skill id pinned to this slot.
   *
   * A value of 0 clears the pin. Triggers the slot's on-change hook only when the
   * pin actually changes so consumers (HUD refresh, etc) are not spammed.
   * @param {number} skillId The skill id to pin, or 0 to clear the pin.
   * @returns {this} Returns `this` for fluent chaining.
   */
  setPinnedSkillId(skillId)
  {
    // normalize falsy values so a missing legacy field reads the same as 0.
    const previous = this.getPinnedSkillId();

    // assign the new pin value.
    this.pinnedSkillId = skillId;

    // only fire the on-change hook when the pin actually changed.
    if (previous !== skillId)
    {
      this.onChange();
    }

    // return this for fluent-chaining.
    return this;
  }

  /**
   * Whether or not this slot has a pinned skill id.
   * @returns {boolean}
   */
  hasPinnedSkill()
  {
    return this.getPinnedSkillId() > 0;
  }

  /**
   * Clears the pinned skill id from this slot.
   * @returns {this} Returns `this` for fluent chaining.
   */
  clearPinnedSkill()
  {
    return this.setPinnedSkillId(0);
  }
  //endregion pin

  /**
   * Gets the underlying data for this slot.
   * Supports retrieving combo skills via targetId.
   * Supports skill extended data via J-Extend.
   * @param {Game_Actor|null} user The user to get extended skill data for.
   * @param {number|null} targetId The target id to get skill data for.
   * @returns {RPG_UsableItem|RPG_Skill|null}
   */
  data(user = null, targetId = this.id)
  {
    // if there is no target, then return null.
    if (targetId === null) return null;

    // if this slot is empty, then return null.
    if (this.isEmpty()) return null;

    // check if this slot is an item.
    if (this.isItem())
    {
      // return the corresponding item.
      return $dataItems[targetId];
    }

    // check if we're using the skill extension plugin and have a user.
    if (user)
    {
      // grab the combo id in this slot.
      const comboId = this.getComboId();

      // check first if we have a valid combo id.
      if (comboId)
      {
        // nice find! return the combo id version of the skill instead.
        return user.skill(comboId);
      }

      // otherwise, return the target id.
      return user.skill(targetId);
    }

    // all else fails... just return the database data for the skill.
    return $dataSkills[targetId];
  }

  /**
   * Returns this slot to skill id 0 and unlocks it.
   * @returns {this} Returns `this` for fluent chaining.
   */
  clear()
  {
    this.unlock();
    this.setSkillId(0);
    return this;
  }

  /**
   * Clears this slot in the context of "releasing unequippable skills".
   * Skills that are mainhand/offhand/tool will not be automatically removed.
   * Skills that are locked will not be automatically removed.
   * @returns {this} Returns `this` for fluent chaining.
   */
  autoclear()
  {
    if (!this.canBeAutocleared())
    {
      // skip because you can't autoclear these slots.
      return this;
    }

    return this.setSkillId(0);
  }

  /**
   * Gets whether or not this slot can be autocleared, such as from auto-upgrading
   * a skill or something.
   * @returns {boolean}
   */
  canBeAutocleared()
  {
    // mainhand and offhand are equipment-driven slots managed entirely by
    // updateMainhandSkill / updateOffhandSkill; they must never be wiped by
    // the hasSkill validation pass.  tool is a usable-item slot that also
    // must survive that pass unchanged.
    const noAutoclearSlots = [
      JABS_Button.Mainhand,
      JABS_Button.Offhand,
      JABS_Button.Tool,
      JABS_Button.UsableItem,
    ];

    return !noAutoclearSlots.includes(this.key);
  }
}

SerializableRegistry.register(JABS_SkillSlot, {
  typed: {
    // initMembers builds this in the constructor, so every slot in a save carries one.
    cooldown: JABS_Cooldown,
  },
});

export default JABS_SkillSlot;
//endregion JABS_SkillSlot