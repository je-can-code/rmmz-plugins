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

    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.EnemyDamage] = {
      slotCount: 8,
      stepX: RingStepX,
      stepY: RingStepY,
      dirX: 1,
      dirY: 1,
      baseX: 24,
      baseY: 24,
    };

    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.IncomingHeal] = {
      slotCount: 8,
      stepX: -RingStepX,
      stepY: RingStepY,
      dirX: 1,
      dirY: 1,
      baseX: -24,
      baseY: 24,
    };

    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.SlipDamage] = {
      slotCount: 8,
      stepX: RingStepX,
      stepY: -RingStepY,
      dirX: 1,
      dirY: 1,
      baseX: 24,
      baseY: -24,
    };

    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.Regen] = {
      slotCount: 8,
      stepX: -RingStepX,
      stepY: -RingStepY,
      dirX: 1,
      dirY: 1,
      baseX: -24,
      baseY: -24,
    };

    PopupLayoutHelper.RingLayout[Map_TextPop.LayoutRings.RewardUp] = {
      slotCount: 10,
      stepX: 0,
      stepY: -RingStepY,
      dirX: 1,
      dirY: 1,
      baseX: 0,
      baseY: -24,
    };

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

    if (!state)
    {
      state = {};
      PopupLayoutHelper._layoutRingState.set(character, state);
    }

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

    if (resolved.usesRing === false)
    {
      return { x: 0, y: 0 };
    }

    const spec = PopupLayoutHelper.RingLayout[layoutRing];

    if (!spec)
    {
      return { x: 0, y: 0 };
    }

    const counters = PopupLayoutHelper._getRingCountersForCharacter(character);
    const lastTime = counters[`${layoutRing}_lastTime`] || 0;
    const currentTime = Graphics.frameCount;

    if (currentTime - lastTime > J.POPUPS.Layout.ResetDuration)
    {
      counters[layoutRing] = 0;
    }

    const idx = counters[layoutRing] || 0;

    counters[layoutRing] = (idx + 1) % spec.slotCount;
    counters[`${layoutRing}_lastTime`] = currentTime;

    const x = (spec.stepX * idx * spec.dirX) + (spec.baseX || 0);
    const y = (spec.stepY * idx * spec.dirY) + (spec.baseY || 0);

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

    let y = J.POPUPS.Layout.VerticalOffset + py;

    if (popup.healing)
    {
      switch (popup.popupType)
      {
        case Map_TextPop.Types.HpDamage: y -= 16; break;
        case Map_TextPop.Types.MpDamage: break;
        case Map_TextPop.Types.TpDamage: y += 16; break;
      }
    }

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

    if (typeof textPop.layoutRing !== 'string')
    {
      return false;
    }

    const known = Object.values(Map_TextPop.LayoutRings);

    for (let i = 0; i < known.length; i++)
    {
      if (known[i] === textPop.layoutRing)
      {
        return true;
      }
    }

    return false;
  }
}

PopupLayoutHelper.initializeRingLayouts();

export default PopupLayoutHelper;
//endregion PopupLayoutHelper