//region J_PopupLayoutRings
/**
 * Per-character slot offsets for {@link Map_TextPop.LayoutRings}. Ephemeral (WeakMap; not saved).
 */
J.POPUPS._layoutRingState = new WeakMap();

/**
 * Step layout for each ring. Indices wrap at slotCount.
 */
J.POPUPS.Layout.RingLayout = {};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.EnemyDamage] = {
  slotCount: 8,
  stepX: J.POPUPS.Layout.RingStepX,
  stepY: J.POPUPS.Layout.RingStepY,
  dirX: 1,
  dirY: 1,
  baseX: 24,
  baseY: 24,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.IncomingHeal] = {
  slotCount: 8,
  stepX: -J.POPUPS.Layout.RingStepX,
  stepY: J.POPUPS.Layout.RingStepY,
  dirX: 1,
  dirY: 1,
  baseX: -24,
  baseY: 24,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.SlipDamage] = {
  slotCount: 8,
  stepX: J.POPUPS.Layout.RingStepX,
  stepY: -J.POPUPS.Layout.RingStepY,
  dirX: 1,
  dirY: 1,
  baseX: 24,
  baseY: -24,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.Regen] = {
  slotCount: 8,
  stepX: -J.POPUPS.Layout.RingStepX,
  stepY: -J.POPUPS.Layout.RingStepY,
  dirX: 1,
  dirY: 1,
  baseX: -24,
  baseY: -24,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.RewardUp] = {
  slotCount: 10,
  stepX: 0,
  stepY: -J.POPUPS.Layout.RingStepY,
  dirX: 1,
  dirY: 1,
  baseX: 0,
  baseY: -24,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.LootDown] = {
  slotCount: 12,
  stepX: 0,
  stepY: J.POPUPS.Layout.RingStepY,
  dirX: 1,
  dirY: 1,
  baseX: 0,
  baseY: 24,
};

/**
 * Resolves how a popup participates in ring stacking vs center-only layout.
 * @param {Map_TextPop} popup The queued popup model.
 * @returns {{ usesRing: boolean, ring: string }} rings stack; center uses variance only.
 */
J.POPUPS.resolvePopupLayout = function(popup)
{
  if (popup.layoutRing === Map_TextPop.LayoutRings.CenterFocus)
  {
    return { usesRing: false, ring: popup.layoutRing };
  }

  return { usesRing: true, ring: popup.layoutRing };
};

/**
 * @param {Game_Character} character The anchor character.
 * @returns {{}}
 */
J.POPUPS._getRingCountersForCharacter = function(character)
{
  let state = J.POPUPS._layoutRingState.get(character);

  if (!state)
  {
    state = {};
    J.POPUPS._layoutRingState.set(character, state);
  }

  return state;
};

/**
 * Advances the slot for this character and ring, returning pixel offset to add to builder variance.
 * @param {Game_Character} character The anchor character.
 * @param {Map_TextPop.LayoutRings} layoutRing The ring id.
 * @returns {{ x: number, y: number }}
 */
J.POPUPS.consumeLayoutRingOffset = function(character, layoutRing)
{
  const resolved = J.POPUPS.resolvePopupLayout({ layoutRing });

  if (resolved.usesRing === false)
  {
    return { x: 0, y: 0 };
  }

  const spec = J.POPUPS.Layout.RingLayout[layoutRing];

  if (!spec)
  {
    return { x: 0, y: 0 };
  }

  const counters = J.POPUPS._getRingCountersForCharacter(character);
  const lastTime = counters[`${layoutRing}_lastTime`] || 0;
  const currentTime = Graphics.frameCount;

  // if more than the reset duration has passed, reset the counter.
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
};

/**
 * Resolves a simplified offset when motion is enabled.
 * Healing to the left, damage to the right.
 * @param {Map_TextPop} popup The popup model.
 * @returns {{ x: number, y: number }}
 */
J.POPUPS.resolveMotionOffset = function(popup)
{
  // if it's healing, move left. if it's damage, move right.
  const px = J.POPUPS.Layout.PaddingX;
  const py = J.POPUPS.Layout.PaddingY;
  const x = popup.healing ? -px : px;
  
  // start at the vertical offset baseline.
  let y = J.POPUPS.Layout.VerticalOffset + py;

  // if it's healing, put HP/MP/TP on their own vertical tracks to prevent stacking.
  if (popup.healing)
  {
    switch (popup.popupType)
    {
      case Map_TextPop.Types.HpDamage: y -= 16; break;
      case Map_TextPop.Types.MpDamage: y += 0;  break;
      case Map_TextPop.Types.TpDamage: y += 16; break;
    }
  }

  return { x, y };
};

/**
 * @param {Map_TextPop} textPop The candidate popup.
 * @returns {boolean} True if safe to queue.
 */
J.POPUPS.isValidTextPopForQueue = function(textPop)
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
};
//endregion J_PopupLayoutRings
