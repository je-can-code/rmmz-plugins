//region CombatResourcePopupLayout

/**
 * Combat resource popup layout policy for concurrent HP/MP/TP map streams.
 */
class CombatResourcePopupLayout
{
  /**
   * Augments {@link PopupLayoutHelper.resolveMotionOffset} so every resource lane gets its own row.
   */
  static installMotionOffsetAugment()
  {
    J.POPUPS.EXT.ABS.Aliased.PopupLayoutHelper.set(
      'resolveMotionOffset',
      PopupLayoutHelper.resolveMotionOffset,
    );

    PopupLayoutHelper.resolveMotionOffset = function(popup)
    {
      const px = J.POPUPS.Layout.PaddingX;
      const py = J.POPUPS.Layout.PaddingY;
      const x = popup.healing ? -px : px;

      let y = J.POPUPS.Layout.VerticalOffset + py;

      switch (popup.popupType)
      {
        case Map_TextPop.Types.HpDamage: y -= 16; break;
        case Map_TextPop.Types.MpDamage: break;
        case Map_TextPop.Types.TpDamage: y += 16; break;
      }

      return { x, y };
    };
  }
}

CombatResourcePopupLayout.installMotionOffsetAugment();

export default CombatResourcePopupLayout;
//endregion CombatResourcePopupLayout