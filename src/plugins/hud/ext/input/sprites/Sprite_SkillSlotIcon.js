//region Sprite_SkillSlotIcon
/**
 * A sprite that displays the icon represented by the assigned skill slot.
 */
class Sprite_SkillSlotIcon
  extends Sprite_Icon
{
  /**
   * Initializes this sprite with the designated icon.
   * @param {number} iconIndex The icon index of the icon for this sprite.
   * @param {JABS_SkillSlot} skillSlot The skill slot to monitor.
   */
  initialize(iconIndex = 0, skillSlot = null)
  {
    // perform original logic.
    super.initialize(iconIndex);

    // assign the skill slot to this sprite.
    this.setSkillSlot(skillSlot);
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * The skill slot that this sprite is watching.
     * @type {JABS_SkillSlot|null}
     */
    this._j._skillSlot = null;

    /**
     * The icon sprite rendered over the skill icon while the slot is on cooldown.
     * Created lazily on first use and then cached here.
     * @type {Sprite_Icon|null}
     */
    this._j._cooldownOverlaySprite = null;

    /**
     * Whether the base cooldown was ready on the previous frame.
     * Initialized to true so no pulse fires on HUD setup before any skill is used.
     * @type {boolean}
     */
    this._j._prevBaseReady = true;

    /**
     * Whether the combo window was ready (open) on the previous frame.
     * @type {boolean}
     */
    this._j._prevComboReady = false;

    /**
     * Remaining frames of the ready-pulse scale animation.
     * Zero means no pulse is currently active.
     * @type {number}
     */
    this._j._pulseFrames = 0;
  }

  /**
   * Sets the skill slot for this sprite's icon.
   * @param {JABS_SkillSlot} skillSlot The skill slot being assigned.
   */
  setSkillSlot(skillSlot)
  {
    this._j._skillSlot = skillSlot;
  }

  /**
   * Gets whether or not there is a skill slot currently being tracked.
   * @returns {boolean}
   */
  hasSkillSlot()
  {
    return !!this._j._skillSlot;
  }

  /**
   * Gets the skill slot currently assigned to this sprite.
   * @returns {JABS_SkillSlot|null}
   */
  skillSlot()
  {
    return this._j._skillSlot;
  }

  /**
   * Gets the icon associated with the tracked skill slot.
   *
   * The resolved (post-transform) skill id is used so the icon reflects the skill that
   * will actually fire rather than the raw equipped skill in the slot.
   * @returns {number}
   */
  skillSlotIcon()
  {
    // if there is no skill slot, return whatever is currently there.
    if (!this.hasSkillSlot()) return this._j._iconIndex;

    // grab the party leader; they are the source of transform resolution for the icon.
    const leader = $gameParty.leader();

    // if there is no leader, do not try to translate the slot into an icon.
    if (!leader) return this._j._iconIndex;

    // resolve through the transform layer so the icon shows the effective skill.
    const resolvedId = leader.getResolvedSkillId(this.skillSlot().key);

    // fetch the skill data for the resolved id.
    const skill = this.skillSlot().data(leader, resolvedId);

    // if nothing was in the slot, then don't draw it.
    if (!skill) return 0;

    // return the resolved skill's icon index.
    return skill.iconIndex;
  }

  /**
   * The `JABS_Button` key that this skill slot belongs to.
   * @returns {string}
   */
  skillSlotKey()
  {
    return this._j._skillSlot.key;
  }

  /**
   * Extends the `update()` to monitor the icon index in case it changes,
   * and to drive the cooldown overlay and ready-pulse animations.
   */
  update()
  {
    // perform original logic.
    super.update();

    // check if this slot needs icon synchronization.
    if (this.needsSynchronization())
    {
      // keep the icon index in-sync with the skill slot.
      this.synchronizeIconIndex();
    }

    // cooldown-driven updates require an assigned skill slot.
    if (!this.hasSkillSlot()) return;

    // resolve the leader JABS battler; the engine may not be ready on early frames.
    const jabsBattler = $jabsEngine?.getPlayer1();
    if (!jabsBattler) return;

    // fetch the cooldown object for this slot's key.
    const cooldown = jabsBattler.getCooldown(this.skillSlotKey());
    if (!cooldown) return;

    // update the semi-transparent icon that appears while the slot is on cooldown.
    this.updateCooldownOverlay(cooldown);

    // detect rising-edge transitions and drive the scale-pop animation.
    this.updateReadyPulse(cooldown);
  }

  /**
   * Returns the cached cooldown overlay sprite, creating and attaching it on first call.
   * @returns {Sprite_Icon}
   */
  getOrCreateCooldownOverlaySprite()
  {
    // return the existing overlay if it was already created.
    if (this._j._cooldownOverlaySprite) return this._j._cooldownOverlaySprite;

    // create the overlay using the icon index configured in the plugin parameters.
    const overlay = new Sprite_Icon(J.HUD.EXT.INPUT.Metadata.CooldownOverlayIconIndex);

    // render it at reduced opacity so the underlying skill icon is still visible.
    overlay.opacity = 160;

    // start hidden; shown only when the slot is actually on cooldown.
    overlay.hide();

    // attach as a child so it inherits this sprite's position automatically.
    this.addChild(overlay);

    // cache the reference so we never create a second one.
    this._j._cooldownOverlaySprite = overlay;

    return overlay;
  }

  /**
   * Synchronizes the cooldown overlay icon's visibility with the slot's base-ready state.
   *
   * Visibility is driven by {@link JABS_Cooldown.comboMode}, stamped at skill-fire time:
   *   'none'     — no combo link; overlay shows immediately while the slot is on cooldown.
   *   'expiring' — combo with an authored expire window; overlay hidden while the window is live,
   *                then shown for the remaining base cooldown once the window closes.
   *   'infinite' — combo with no expire window; overlay never shown (the entire CD is the window).
   *
   * @param {JABS_Cooldown} cooldown The cooldown data for this slot.
   */
  updateCooldownOverlay(cooldown)
  {
    // lazily create the overlay sprite on the first update tick that reaches here.
    const overlay = this.getOrCreateCooldownOverlaySprite();

    // no cooldown running — keep overlay hidden and bail.
    if (cooldown.isBaseReady() === true)
    {
      overlay.hide();
      return;
    }

    // slot is on cooldown — decide visibility from the authored combo mode.
    switch (cooldown.comboMode)
    {
      case 'infinite':
        // whole cooldown is the combo window; never show the lock icon.
        overlay.hide();
        break;

      case 'expiring':
        // show the lock icon only after the expire window has closed.
        if (cooldown.comboExpireFrames > 0)
        {
          overlay.hide();
        }
        else
        {
          overlay.show();
        }
        break;

      default: // 'none'
        // no combo link on this skill; slot is simply blocked.
        overlay.show();
        break;
    }
  }

  /**
   * Detects when the base cooldown or combo window becomes newly available and triggers a brief
   * scale pop to signal "new skill ready" to the player.
   * @param {JABS_Cooldown} cooldown The cooldown data for this slot.
   */
  updateReadyPulse(cooldown)
  {
    const baseReady = cooldown.isBaseReady();
    const comboReady = cooldown.isComboReady();

    // rising edge: base cooldown just finished.
    if (!this._j._prevBaseReady && baseReady)
    {
      this._j._pulseFrames = 12;
    }

    // rising edge: combo delay elapsed and the follow-up window just opened.
    if (!this._j._prevComboReady && comboReady)
    {
      this._j._pulseFrames = 12;
    }

    // record states for comparison on the next frame.
    this._j._prevBaseReady = baseReady;
    this._j._prevComboReady = comboReady;

    // apply the scale pop while a pulse is active.
    if (this._j._pulseFrames > 0)
    {
      // smooth arc: peaks at mid-pulse (sin(π/2) = 1) and returns to 1.0 at both ends.
      const t = this._j._pulseFrames / 12;
      const s = 1 + Math.sin(t * Math.PI) * 0.25;
      this.scale.x = s;
      this.scale.y = s;
      this._j._pulseFrames--;
    }
    else
    {
      // restore exact 1.0 scale once the animation ends.
      this.scale.x = 1;
      this.scale.y = 1;
    }
  }

  /**
   * Checks whether or not this slot is in need of name synchronization.
   * @returns {boolean}
   */
  needsSynchronization()
  {
    return (this.hasSkillSlot() && this.skillSlot()
      .needsVisualIconRefresh());
  }

  /**
   * Synchronize the icon index for this skill slot.
   * Updates it if necessary.
   */
  synchronizeIconIndex()
  {
    // check if the icon index for this icon is up to date.
    if (this.iconIndex() !== this.skillSlotIcon())
    {
      // if it isn't, update it.
      this.setIconIndex(this.skillSlotIcon());
    }

    // acknowledge the refresh.
    this.skillSlot()
      .acknowledgeIconRefresh();
  }

  /**
   * Upon becoming ready, execute this logic.
   * In this sprite's case, we render ourselves.
   * @param {number} iconIndex The icon index of this sprite.
   */
  onReady(iconIndex = 0)
  {
    // perform original logic.
    super.onReady(iconIndex);

    // only perform this logic if we have a skill slot.
    if (this.hasSkillSlot())
    {
      // set the icon index to be whatever the skill slot's icon is.
      this.setIconIndex(this.skillSlotIcon());
    }
  }
}

export default Sprite_SkillSlotIcon;
//endregion Sprite_SkillIcon