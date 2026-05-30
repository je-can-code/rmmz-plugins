//region PopupLayoutHelper
import Map_TextPop from './../_models/Map_TextPop.js';

/**
 * Popup ring stacking, motion offsets, and queue validation.
 */
class PopupLayoutHelper
{
  /**
   * Per-character slot offsets for {@link Map_TextPop.LayoutRings}. Ephemeral (not saved).
   * @type {WeakMap<Game_Character, object>}
   */
  static _layoutRingState = new WeakMap();

  /**
   * Step layout for each ring. Indices wrap at slotCount.
   * @type {Record<string, object>}
   */
  static RingLayout = {};

  /**
   * Builds {@link PopupLayoutHelper.RingLayout} from {@link J.POPUPS.Layout} defaults.
   */
  static initializeRingLayouts()
  {
    const { RingStepX, RingStepY } = J.POPUPS.Layout;

    // policy step inside initialize ring layouts.
    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.EnemyDamage] = {
      slotCount: 8,
      stepX: RingStepX,
      // policy step inside initialize ring layouts.
      stepY: RingStepY,
      dirX: 1,
      dirY: 1,
      // policy step inside initialize ring layouts.
      baseX: 24,
      baseY: 24,
    };

    // policy step inside initialize ring layouts.
    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.IncomingHeal] = {
      slotCount: 8,
      stepX: -RingStepX,
      // policy step inside initialize ring layouts.
      stepY: RingStepY,
      dirX: 1,
      dirY: 1,
      // policy step inside initialize ring layouts.
      baseX: -24,
      baseY: 24,
    };

    // policy step inside initialize ring layouts.
    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.SlipDamage] = {
      slotCount: 8,
      stepX: RingStepX,
      // policy step inside initialize ring layouts.
      stepY: -RingStepY,
      dirX: 1,
      dirY: 1,
      // policy step inside initialize ring layouts.
      baseX: 24,
      baseY: -24,
    };

    // policy step inside initialize ring layouts.
    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.Regen] = {
      slotCount: 8,
      stepX: -RingStepX,
      // policy step inside initialize ring layouts.
      stepY: -RingStepY,
      dirX: 1,
      dirY: 1,
      baseX: -24,
      baseY: -24,
    };

    // policy step inside initialize ring layouts.
    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.RewardUp] = {
      slotCount: 10,
      stepX: 0,
      stepY: -RingStepY,
      dirX: 1,
      dirY: 1,
      baseX: 0,
      baseY: -24,
    };

    // policy step inside initialize ring layouts.
    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.LootDown] = {
      slotCount: 12,
      stepX: 0,
      stepY: RingStepY,
      dirX: 1,
      dirY: 1,
      baseX: 0,
      baseY: 24,
    };
  }

  /**
   * Resolves how a popup participates in ring stacking vs center-only layout.
   * @param {Map_TextPop} popup The queued popup model.
   * @returns {{ usesRing: boolean, ring: string }} rings stack; center uses variance only.
   */
  static resolvePopupLayout(popup)
  {
    if (popup.layoutRing === Map_TextPop.LayoutRings.CenterFocus)
    {
      return { usesRing: false, ring: popup.layoutRing };
    }

    // hand back { usesRing: true, ring: popup.layoutRing } to the caller.
    return { usesRing: true, ring: popup.layoutRing };
  }

  /**
   * Lazily allocates per-character layout ring slot counters for popup staggering.
   * @param {Game_Character} character The anchor character.
   * @returns {{}}
   */
  static _getRingCountersForCharacter(character)
  {
    let state = PopupLayoutHelper._layoutRingState.get(character);

    // when not state, take this branch.
    if (!state)
    {
      state = {};
      PopupLayoutHelper._layoutRingState.set(character, state);
    }

    // hand back state to the caller.
    return state;
  }

  /**
   * Advances the slot for this character and ring, returning pixel offset to add to builder variance.
   * @param {Game_Character} character The anchor character.
   * @param {Map_TextPop.LayoutRings} layoutRing The ring id.
   * @returns {{ x: number, y: number }}
   */
  static consumeLayoutRingOffset(character, layoutRing)
  {
    const resolved = PopupLayoutHelper.resolvePopupLayout({ layoutRing });

    // when resolved.usesRing  equals  false, take this branch.
    if (resolved.usesRing === false)
    {
      return { x: 0, y: 0 };
    }

    // capture spec for downstream policy in this routine.
    const spec = PopupLayoutHelper.RingLayout[layoutRing];

    // when not spec, take this branch.
    if (!spec)
    {
      return { x: 0, y: 0 };
    }

    // capture counters for downstream policy in this routine.
    const counters = PopupLayoutHelper._getRingCountersForCharacter(character);
    const lastTime = counters[`${layoutRing}_lastTime`] || 0;
    const currentTime = Graphics.frameCount;

    // when currentTime - lastTime > J.POPUPS.Layout.ResetDuration, take this branch.
    if (currentTime - lastTime > J.POPUPS.Layout.ResetDuration)
    {
      counters[layoutRing] = 0;
    }

    // capture idx for downstream policy in this routine.
    const idx = counters[layoutRing] || 0;

    // policy step inside consume layout ring offset.
    counters[layoutRing] = (idx + 1) % spec.slotCount;
    counters[`${layoutRing}_lastTime`] = currentTime;

    // capture x for downstream policy in this routine.
    const x = (spec.stepX * idx * spec.dirX) + (spec.baseX || 0);
    const y = (spec.stepY * idx * spec.dirY) + (spec.baseY || 0);

    // hand back { x, y } to the caller.
    return { x, y };
  }

  /**
   * Resolves a simplified offset when motion is enabled.
   * Healing to the left, damage to the right.
   * @param {Map_TextPop} popup The popup model.
   * @returns {{ x: number, y: number }}
   */
  static resolveMotionOffset(popup)
  {
    const px = J.POPUPS.Layout.PaddingX;
    const py = J.POPUPS.Layout.PaddingY;
    const x = popup.healing ? -px : px;

    // capture y for downstream policy in this routine.
    let y = J.POPUPS.Layout.VerticalOffset + py;

    // when popup.healing, take this branch.
    if (popup.healing)
    {
      switch (popup.popupType)
      {
        case Map_TextPop.Types.HpDamage: y -= 16; break;
        case Map_TextPop.Types.MpDamage: y += 0; break;
        case Map_TextPop.Types.TpDamage: y += 16; break;
      }
    }

    // hand back { x, y } to the caller.
    return { x, y };
  }

  /**
   * Rejects malformed popup models before they enter the anchor queue.
   * @param {Map_TextPop} textPop The candidate popup.
   * @returns {boolean}
   */
  static isValidTextPopForQueue(textPop)
  {
    if (!textPop || textPop.constructor !== Map_TextPop)
    {
      return false;
    }

    // when typeof textPop.layoutRing  differs from  'string', take this branch.
    if (typeof textPop.layoutRing !== 'string')
    {
      return false;
    }

    // capture known for downstream policy in this routine.
    const known = Object.values(Map_TextPop.LayoutRings);

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < known.length; i++)
    {
      if (known[i] === textPop.layoutRing)
      {
        return true;
      }
    }

    // hand back false to the caller.
    return false;
  }
}

PopupLayoutHelper.initializeRingLayouts();

export default PopupLayoutHelper;
//endregion PopupLayoutHelper