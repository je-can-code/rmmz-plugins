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
  stepX: 8,
  stepY: 32,
  dirX: 1,
  dirY: 1,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.IncomingHeal] = {
  slotCount: 8,
  stepX: -8,
  stepY: -32,
  dirX: 1,
  dirY: 1,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.SlipDamage] = {
  slotCount: 8,
  stepX: 10,
  stepY: 28,
  dirX: 1,
  dirY: 1,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.Regen] = {
  slotCount: 8,
  stepX: -10,
  stepY: -28,
  dirX: 1,
  dirY: 1,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.RewardUp] = {
  slotCount: 10,
  stepX: 0,
  stepY: -28,
  dirX: 1,
  dirY: 1,
};

J.POPUPS.Layout.RingLayout[Map_TextPop.LayoutRings.LootDown] = {
  slotCount: 12,
  stepX: 0,
  stepY: 22,
  dirX: 1,
  dirY: 1,
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
  const idx = counters[layoutRing] || 0;

  counters[layoutRing] = (idx + 1) % spec.slotCount;

  const x = spec.stepX * idx * spec.dirX;
  const y = spec.stepY * idx * spec.dirY;

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
