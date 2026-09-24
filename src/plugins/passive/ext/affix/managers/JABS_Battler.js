//region JABS_Battler
/**
 * With {@link J.HUD.EXT.TARGET}, extends {@link JABS_Battler#decorateFramedTarget}: tier prefix/suffix text, the
 * tier icons that lead the name, and the tier color (same passive id bands as the map stripe). The target frame
 * and the boss frame both decorate through that hook, so a tiered enemy reads the same in either.
 */
if (J.HUD && J.HUD.EXT.TARGET)
{
  /**
   * Extends {@link #decorateFramedTarget}.<br/>
   * Applies tier label text, icons, and color to a framed target.
   * @param {FramedTarget} framedTarget The framed target to decorate in place.
   * @param {JABS_Battler} framedBattler The battler the framed target shows.
   */
  J.PASSIVE.EXT.AFFIX.Aliased.JABS_Battler.set('decorateFramedTarget', JABS_Battler.prototype.decorateFramedTarget);
  JABS_Battler.prototype.decorateFramedTarget = function(framedTarget, framedBattler)
  {
    // perform original logic.
    J.PASSIVE.EXT.AFFIX.Aliased.JABS_Battler.get('decorateFramedTarget')
      .call(this, framedTarget, framedBattler);

    // layer passive tier presentation on top of whatever the HUD decided the base name should be.
    this.applyPassiveTierTargetFrameDecoration(framedTarget, framedBattler);

    // derive the same stripe hex the map uses, then tint the HUD name row to match the stripe.
    const tierStripeHex = J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex(framedBattler.getBattler());

    if (ColorManager.isValidHexColor(tierStripeHex))
    {
      framedTarget.nameColorHex = tierStripeHex;
    }
  };

  /**
   * Mutates {@link FramedTarget#name} and {@link FramedTarget#nameIconIndices}: tier words on the name, and up
   * to two tier icons ahead of it. The tier's color is not applied here- it rides on
   * {@link FramedTarget#nameColorHex}, set by {@link #decorateFramedTarget}.
   * @param {FramedTarget} framedTarget HUD row to update in place.
   * @param {JABS_Battler} battlerLastHit Source for passive state ids.
   */
  JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration = function(framedTarget, battlerLastHit)
  {
    // the target frame only decorates enemies that participate in passive tier bands.
    if (battlerLastHit.isEnemy() === false) return;

    // grab the underlying RPG Maker battler (event-driven enemy).
    const battler = battlerLastHit.getBattler();

    // grab all passive state ids currently on the battler.
    const passiveStatesIds = battler.getPassiveStateIds();

    // if there are no passive states, there is nothing tier-related to express in the HUD.
    if (passiveStatesIds.length === 0) return;

    // if none of the passive states participate in either prefix/suffix affix pool, leave the HUD name alone.
    const hasAnyAffix = passiveStatesIds.some(passiveStateId =>
    {
      const state = battler.state(passiveStateId);
      if (!state) return false;
      return state.isEnemyPrefix === true || state.isEnemySuffix === true;
    });

    if (hasAnyAffix === false) return;

    // walk passive state order so the first qualifying prefix/suffix wins (same policy as the old map nameplate).
    let foundPrefix = false;
    let foundSuffix = false;
    let prefixIconIndex = null;
    let suffixIconIndex = null;

    let displayName = framedTarget.name;

    for (const passiveStateId of passiveStatesIds)
    {
      const state = battler.state(passiveStateId);

      if (!state) continue;

      // apply at most one tier prefix (state name before the enemy name).
      if (state.isEnemyPrefix === true && foundPrefix === false)
      {
        // prepend the tier state's name before whatever the HUD already chose as the visible name.
        displayName = `${state.name} ${displayName}`;

        // remember which icon leads the name.
        prefixIconIndex = state.iconIndex;

        // flag that we already consumed the prefix slot.
        foundPrefix = true;
      }

      // apply at most one tier suffix ("of <tier>").
      if (state.isEnemySuffix === true && foundSuffix === false)
      {
        // append the classic "of <state>" suffix after the enemy label.
        displayName = `${displayName} of ${state.name}`;

        // the second icon slot, drawn after the prefix's- both still ahead of the name.
        suffixIconIndex = state.iconIndex;

        // flag that we already consumed the suffix slot.
        foundSuffix = true;
      }

      // if we have both a prefix and a suffix, we can stop scanning passive states.
      if (foundPrefix === true && foundSuffix === true) break;
    }

    // the tier icons travel as icons of their own rather than escapes baked into the name's text, so the
    // frame decides where they go (two at most: prefix tier, then suffix tier).
    const nameIconIndices = [];

    if (prefixIconIndex !== null)
    {
      nameIconIndices.push(prefixIconIndex);
    }

    if (suffixIconIndex !== null)
    {
      nameIconIndices.push(suffixIconIndex);
    }

    // hand over the tiered name and the icons that lead it.
    framedTarget.name = displayName;
    framedTarget.nameIconIndices = nameIconIndices;
  };
}
//endregion JABS_Battler