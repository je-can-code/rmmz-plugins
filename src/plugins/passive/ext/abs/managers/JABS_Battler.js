//region JABS_Battler
/**
 * With {@link J.HUD.EXT.TARGET}, wraps {@link JABS_Battler#buildFramedTarget}: tier prefix/suffix text, icons,
 * optional {@link Window_Base#colorizeText} (same passive id bands as the map stripe).
 */
if (J.HUD && J.HUD.EXT.TARGET)
{
  /**
   * Builds {@link FramedTarget} for the HUD, then applies tier label text, icons, and optional color.
   * @param {JABS_Battler} battlerLastHit Last-hit target for this frame.
   * @returns {FramedTarget}
   */
  J.PASSIVE.EXT.ABS.Aliased.JABS_Battler.set('buildFramedTarget', JABS_Battler.prototype.buildFramedTarget);
  JABS_Battler.prototype.buildFramedTarget = function(battlerLastHit)
  {
    // perform original logic (HUD fills name, notes text, icon slot, gauge config).
    const framedTarget = J.PASSIVE.EXT.ABS.Aliased.JABS_Battler.get('buildFramedTarget')
      .call(this, battlerLastHit);

    // layer passive tier presentation on top of whatever the HUD decided the base name should be.
    this.applyPassiveTierTargetFrameDecoration(framedTarget, battlerLastHit);

    // derive the same stripe hex the map uses, then tint the HUD name row to match the stripe.
    const tierStripeHex = J.PASSIVE.EXT.ABS.Helpers.resolvePassiveTierStripeColorHex(battlerLastHit.getBattler());

    if (ColorManager.isValidHexColor(tierStripeHex))
    {
      framedTarget.nameColorHex = tierStripeHex;
    }

    return framedTarget;
  };

  /**
   * Mutates {@link FramedTarget#name}: tier words, up to two `\\I` escapes, optional {@link Window_Base#colorizeText}.
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

    // when the tier hex is meaningful, tint the label to the nearest windowskin palette match (icons stay un-tinted).
    let prefixTierHudMessageColorIndex = null;

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

        // remember which icon to draw beside the label (Window_Base understands \\I[n] escapes).
        prefixIconIndex = state.iconIndex;

        // palette index only when the state note actually defined a tier hex (no tag => no HUD tint span).
        if (state.tierColorHex)
        {
          prefixTierHudMessageColorIndex = ColorManager.colorIndexFromHex(state.tierColorHex);
        }

        // flag that we already consumed the prefix slot.
        foundPrefix = true;
      }

      // apply at most one tier suffix ("of <tier>").
      if (state.isEnemySuffix === true && foundSuffix === false)
      {
        // append the classic "of <state>" suffix after the enemy label.
        displayName = `${displayName} of ${state.name}`;

        // second icon slot (still drawn to the left of the text because escapes lead the string).
        suffixIconIndex = state.iconIndex;

        // flag that we already consumed the suffix slot.
        foundSuffix = true;
      }

      // if we have both a prefix and a suffix, we can stop scanning passive states.
      if (foundPrefix === true && foundSuffix === true) break;
    }

    // build optional icon escapes (two icons max: prefix tier, then suffix tier).
    let iconEscapes = String.empty;

    if (prefixIconIndex !== null)
    {
      iconEscapes += `\\I[${prefixIconIndex}]`;
    }

    if (suffixIconIndex !== null)
    {
      iconEscapes += `\\I[${suffixIconIndex}]`;
    }

    // label body; may gain colorizeText (\\C…\\C[0]) when the tier note sets a palette index.
    let labeledBody = displayName;

    if (J.MESSAGE && prefixTierHudMessageColorIndex !== null)
    {
      // \\C[n] + \\C[0] so the default name color returns after this span.
      labeledBody = Window_Base.prototype.colorizeText(prefixTierHudMessageColorIndex, displayName);
    }

    // icons first, then label; drawTextEx consumes the escapes in one pass.
    framedTarget.name = `${iconEscapes}${labeledBody}`;
  };
}
//endregion JABS_Battler