//region Spriteset_Map (targeting overlay)
import JABS_TargetingManager from './../managers/JABS_TargetingManager.js';
import Sprite_TargetingCursor from './Sprite_TargetingCursor.js';

/**
 * Extends {@link Spriteset_Map#createLowerLayer}.<br/>
 * Also creates the targeting reticle sprite and the tracking dictionary for AoE-highlight
 * outline sprites.
 */
J.ABS.EXT.TARGETING.Aliased.Spriteset_Map.set('createLowerLayer', Spriteset_Map.prototype.createLowerLayer);
Spriteset_Map.prototype.createLowerLayer = function()
{
  // perform original logic (includes JABS's own overlay layers).
  J.ABS.EXT.TARGETING.Aliased.Spriteset_Map.get('createLowerLayer')
    .call(this);

  // also create the targeting-specific overlay sprites.
  this.createTargetingOverlay();
};

/**
 * Creates the targeting reticle sprite and AoE-highlight tracking dictionary.
 */
Spriteset_Map.prototype.createTargetingOverlay = function()
{
  this._j ||= {};
  this._j._targeting ||= {};

  // the reticle sits directly on the spriteset (screen-space), same as the debug hitbox layer.
  this.setReticle(new Sprite_TargetingCursor());
  this.addChild(this.reticle());

  // tracking dictionary for AoE-highlight outline sprites, keyed by battler uuid.
  this.setHighlightSprites({});

  // one reusable pulse sprite for the AoE preview itself.
  this.setPreviewPulse(null);

  // one reusable pulse sprite for the max-range ring around the caster.
  this.setRangeRing(null);
};

/**
 * Extends {@link Spriteset_Map#update}.<br/>
 * Drives the AoE hitbox preview and per-battler highlight outlines while a free-roam targeting
 * session with an AoE radius is active.
 */
J.ABS.EXT.TARGETING.Aliased.Spriteset_Map.set('update', Spriteset_Map.prototype.update);
Spriteset_Map.prototype.update = function()
{
  // perform original logic.
  J.ABS.EXT.TARGETING.Aliased.Spriteset_Map.get('update')
    .call(this);

  // keep the AoE preview/highlight and the max-range ring in sync every frame.
  this.updateTargetingAoePreview();
  this.updateTargetingRangeRing();
};

/**
 * Updates the max-range ring, a faint-filled but clearly-outlined circle centered on the caster
 * showing how far the cursor may travel/search — active in either mode, styled distinctly from
 * the AoE preview so the two are never confused for one another.
 */
Spriteset_Map.prototype.updateTargetingRangeRing = function()
{
  // nobody's aiming; nothing to show a range for.
  if (!JABS_TargetingManager.isActive())
  {
    this.hideTargetingRangeRing();
    return;
  }

  this.showTargetingRangeRing(JABS_TargetingManager.getCursor());
};

/**
 * Hides the max-range ring, if one was ever created.
 */
Spriteset_Map.prototype.hideTargetingRangeRing = function()
{
  const ring = this.rangeRing();
  if (ring)
  {
    ring.visible = false;
  }
};

/**
 * Positions/updates the reusable max-range ring against the caster's current position.
 * @param {JABS_TargetingCursor} cursor The active aiming cursor.
 */
Spriteset_Map.prototype.showTargetingRangeRing = function(cursor)
{
  // lazily create the one reusable ring sprite the first time it's needed.
  let ring = this.rangeRing();
  if (!ring)
  {
    ring = new Sprite_HitboxPulse();
    JABS_HitboxPulseManager.getLayer()
      .addChild(ring);
    this.setRangeRing(ring);
  }

  // merge over the manager's configured defaults, but override the style to read as clearly
  // distinct from the AoE preview: faint fill so it never obscures the map, bold high-contrast
  // outline so the boundary itself always reads clearly.
  const options = JABS_HitboxPulseOptions.from(
    {
      shape: J.ABS.Shapes.Circle,
      range: cursor.getRange(),
      sustained: true,
      duration: 999999,
      startAlpha: 1.0,
      endAlpha: 1.0,
      scaleStart: 1.0,
      scaleEnd: 1.0,
      lineColor: 0xFFD700,
      lineAlpha: 1.0,
      lineWidth: 3,
      fillAlpha: 0.05,
    },
    JABS_HitboxPulseManager.getDefaultOptions());

  // anchor on the caster's actual position, not any melee-swing origin offset.
  const casterCharacter = cursor.getCaster()
    .getCharacter();

  ring.visible = true;
  ring.reset();
  ring.setup(options.toPlain());
  ring.setWorldPosition(casterCharacter.screenX(), casterCharacter.screenY());
};

/**
 * Updates the AoE hitbox preview pulse and the per-battler highlight outlines.<br/>
 * Applicable in either mode whenever the skill has an AoE radius (`<radius:N>`) — a direct
 * (cycle-mode) skill can just as easily resolve to one chosen target and still be an AoE
 * centered on them, not only a non-direct (free-roam) placed skill.
 */
Spriteset_Map.prototype.updateTargetingAoePreview = function()
{
  // gather the aiming state; while inactive, `getCursor()`/`getSentinel().getJabsAction()` are
  // null, so the active/radius check below must short-circuit before touching them.
  const cursor = JABS_TargetingManager.getCursor();
  const sentinel = JABS_TargetingManager.getSentinel();
  const action = sentinel.getJabsAction();
  const shouldPreview = JABS_TargetingManager.isActive() && action.getRange() !== null;

  // non-radius skills have no shape to preview at all.
  if (!shouldPreview)
  {
    this.hideTargetingAoePreview();
    return;
  }

  // drive the shape preview and the per-battler highlights off the same aiming state.
  this.showTargetingAoePreviewPulse(cursor, sentinel, action);
  this.refreshTargetingHighlightSprites(cursor, sentinel, action);
};

/**
 * Hides/clears the AoE preview pulse and purges all highlight sprites.
 */
Spriteset_Map.prototype.hideTargetingAoePreview = function()
{
  // only hide the pulse if one was ever created.
  const pulse = this.previewPulse();
  if (pulse)
  {
    pulse.visible = false;
  }

  // nothing is caught anymore; purge every tracked highlight sprite.
  this.purgeTargetingHighlightSprites([]);
};

/**
 * Positions/updates the reusable AoE preview pulse against the sentinel's current position.<br/>
 * Styled more boldly in free-roam mode, where the reticle is absent and this shape is the
 * primary "where am I aiming" signal; cycle mode keeps the subtler original style, since the
 * reticle and list window are already the primary indicators there and this is just a
 * secondary "here's what else gets caught" preview.
 * @param {JABS_TargetingCursor} cursor The active aiming cursor.
 * @param {JABS_TargetingSentinelAction} sentinel The sentinel standing in for the cursor.
 * @param {JABS_Action} action The real action being aimed.
 */
Spriteset_Map.prototype.showTargetingAoePreviewPulse = function(cursor, sentinel, action)
{
  // lazily create the one reusable pulse sprite the first time it's needed.
  let pulse = this.previewPulse();
  if (!pulse)
  {
    pulse = new Sprite_HitboxPulse();
    JABS_HitboxPulseManager.getLayer()
      .addChild(pulse);
    this.setPreviewPulse(pulse);
  }

  // read the degrees/thickness off the sentinel the same way real hit-resolution would.
  const degrees = $jabsEngine.getActionDegrees(sentinel) ?? 180;
  const thickness = $jabsEngine.getActionThicknessTiles(sentinel) ?? 1;

  // color always reflects scope, not just "AoE incoming" — green reads as "this helps," not
  // "danger," in either mode. Free-roam additionally gets the bold, high-visibility treatment;
  // cycle mode keeps the original subtler alpha/line-width, just with the same scoped color.
  const scopedColor = action.isSupportAction()
    ? 0x2ECC71
    : 0xFF6644;
  const style = cursor.isFreeRoamMode()
    ? { startAlpha: 0.55, endAlpha: 0.55, fillColor: scopedColor, lineColor: scopedColor, lineAlpha: 1.0, lineWidth: 3 }
    : { startAlpha: 0.20, endAlpha: 0.20, fillColor: scopedColor, lineColor: scopedColor };

  // merge over the manager's configured defaults so visual style (colors/alpha/blend) is
  // always fully populated, the same way the real `spawn()` path builds its options.
  const options = JABS_HitboxPulseOptions.from(
    {
      shape: action.getShape(),
      range: action.getRange(),
      facing: action.direction(),
      degrees,
      thickness,
      sustained: true,
      duration: 999999,
      scaleStart: 1.0,
      scaleEnd: 1.0,
      ...style,
    },
    JABS_HitboxPulseManager.getDefaultOptions());

  // anchor at the same melee-adjusted origin `collisionCircle` et al. actually test against
  // internally (not the sentinel's raw screen position), so the visual always agrees with
  // what's really caught — see `Sprite_TargetingCursor` for the same reasoning.
  const origin = JABS_Engine.getActionOriginPixels(sentinel);

  pulse.visible = true;
  pulse.reset();
  pulse.setup(options.toPlain());
  pulse.setWorldPosition(origin.x, origin.y);
  pulse.setRotation(JABS_HitboxPulseManager.directionToRadians(action.direction()));
};

/**
 * Builds/refreshes/purges highlight outline sprites for every battler currently inside the
 * previewed AoE shape, reusing the same collision math real hit-resolution uses.<br/>
 * Scoped the same way cycle-mode candidate gathering is (see
 * {@link JABS_TargetingManager.gatherScopedCandidates}) — an enemy-scope AoE can only actually
 * hit enemies, so it must not highlight allies/self as "about to be hit," and vice versa for an
 * ally-scope skill.
 * @param {JABS_TargetingCursor} cursor The active aiming cursor.
 * @param {JABS_TargetingSentinelAction} sentinel The sentinel standing in for the cursor.
 * @param {JABS_Action} action The real action being aimed.
 */
Spriteset_Map.prototype.refreshTargetingHighlightSprites = function(cursor, sentinel, action)
{
  // pull the shape parameters straight off the real action being aimed.
  const caster = cursor.getCaster();
  const shape = action.getShape();
  const range = action.getRange();
  const facing = action.direction();

  // anything further than the caster's proximity + this action's own radius cannot possibly
  // overlap the shape, so cap the candidate pool to that bound.
  const searchRange = cursor.getRange() + range;
  const candidates = JABS_TargetingManager.gatherScopedCandidates(caster, action, searchRange);

  // run every candidate through the same containment test real hit-resolution uses.
  const caught = candidates.filter(battler => $jabsEngine.isTargetWithinRange(
    facing,
    battler.getCharacter(),
    sentinel,
    range,
    shape));

  // core's own hitbox styling already models exactly this distinction: the default "base"
  // style is green, and only the "colliding" state override turns it red/danger-colored. An
  // ally-scope skill isn't a danger to its targets, so it gets the calmer default style instead.
  const colliding = !action.isSupportAction();

  // build/refresh a highlight sprite for every battler currently caught.
  const dict = this.highlightSprites();
  const layer = this.getJabsHitboxLayer();
  const tw = $gameMap.tileWidth();
  const th = $gameMap.tileHeight();
  caught.forEach(battler =>
  {
    // create this battler's highlight sprite the first time it's caught.
    const key = battler.getUuid();
    let sprite = dict[key];
    if (!sprite)
    {
      sprite = this.createBattlerHitboxSprite({ key, type: 'battler', source: battler.getCharacter() });
      layer.addChild(sprite);
      dict[key] = sprite;
    }

    // reposition and redraw it against the battler's current location.
    const character = battler.getCharacter();
    sprite.x = character.screenX();
    sprite.y = character.screenY();
    const aabb = JABS_Engine.getBattlerAabbModel(character);
    this.drawBattlerHitboxInto(sprite, 'battler', tw, th, colliding, aabb);
  });

  // anything not caught this frame gets its highlight sprite removed.
  this.purgeTargetingHighlightSprites(caught);
};

/**
 * Removes highlight sprites for battlers no longer caught in the previewed AoE shape.
 * @param {JABS_Battler[]} stillCaught The battlers still caught this frame.
 */
Spriteset_Map.prototype.purgeTargetingHighlightSprites = function(stillCaught)
{
  // build the set of keys that are still legitimately caught this frame.
  const dict = this.highlightSprites();
  const layer = this.getJabsHitboxLayer();
  const activeKeys = new Set(stillCaught.map(battler => battler.getUuid()));

  // remove and detach anything not in that set.
  Object.keys(dict)
    .forEach(key =>
    {
      if (activeKeys.has(key)) return;

      const sprite = dict[key];
      if (sprite.parent === layer)
      {
        layer.removeChild(sprite);
      }

      delete dict[key];
    });
};

//region properties
/**
 * Gets the reticle sprite drawn over the currently selected target.
 * @returns {Sprite} The targeting reticle.
 */
Spriteset_Map.prototype.reticle = function()
{
  // hand back the reticle.
  return this._j._targeting._reticle;
};

/**
 * Sets the reticle sprite drawn over the currently selected target.
 * @param {Sprite} newReticle The targeting reticle.
 */
Spriteset_Map.prototype.setReticle = function(newReticle)
{
  // assign the reticle.
  this._j._targeting._reticle = newReticle;
};

/**
 * Gets the highlight sprites.
 * @returns {*} The highlightSprites.
 */
Spriteset_Map.prototype.highlightSprites = function()
{
  // hand back the highlight sprites.
  return this._j._targeting._highlightSprites;
};

/**
 * Sets the highlight sprites.
 * @param {*} newHighlightSprites The new highlightSprites.
 */
Spriteset_Map.prototype.setHighlightSprites = function(newHighlightSprites)
{
  // assign the highlight sprites.
  this._j._targeting._highlightSprites = newHighlightSprites;
};

/**
 * Gets the preview pulse.
 * @returns {*} The previewPulse.
 */
Spriteset_Map.prototype.previewPulse = function()
{
  // hand back the preview pulse.
  return this._j._targeting._previewPulse;
};

/**
 * Sets the preview pulse.
 * @param {*} newPreviewPulse The new previewPulse.
 */
Spriteset_Map.prototype.setPreviewPulse = function(newPreviewPulse)
{
  // assign the preview pulse.
  this._j._targeting._previewPulse = newPreviewPulse;
};

/**
 * Gets the range ring.
 * @returns {*} The rangeRing.
 */
Spriteset_Map.prototype.rangeRing = function()
{
  // hand back the range ring.
  return this._j._targeting._rangeRing;
};

/**
 * Sets the range ring.
 * @param {*} newRangeRing The new rangeRing.
 */
Spriteset_Map.prototype.setRangeRing = function(newRangeRing)
{
  // assign the range ring.
  this._j._targeting._rangeRing = newRangeRing;
};
//endregion properties
//endregion Spriteset_Map (targeting overlay)
