//region JABS_TargetingSentinelAction
/**
 * A reusable stand-in for a spawned `Game_Event` action-sprite, so the cursor's hypothetical
 * position can be run through the real collision math (`JABS_Engine.isTargetWithinRange` and its
 * per-shape helpers) without anything actually being spawned.<br/>
 * Verified that every hitbox shape touches its `action` argument through exactly three members:
 * `screenX()`, `screenY()`, and `getJabsAction()` (needing `.direction()`, `.getBaseSkill()`,
 * `.getThicknessTiles()` — all of which the real {@link JABS_Action} already provides). This
 * class supplies the first two by wrapping a headless `Game_Character` (so screen-pixel
 * conversion reuses vanilla RMMZ math instead of hand-rolled tile-to-pixel formulas), and the
 * third by simply holding a reference to whichever real action is currently being aimed.<br/>
 * Meant to be a single reusable instance: `set()` when a session begins, position updated every
 * frame the cursor moves, `reset()` when the session ends.
 */
class JABS_TargetingSentinelAction
{
  /**
   * The headless character used purely for its `screenX()`/`screenY()` conversion math.
   * @type {Game_Character}
   */
  #character = new Game_Character();

  /**
   * The real action currently being aimed, or null if no session is active.
   * @type {JABS_Action|null}
   */
  #jabsAction = null;

  /**
   * Half the height (in pixels) of whichever battler's hitbox the origin is currently centered
   * on, or 0 when the origin isn't a battler at all (free-roam mode aims at open ground, which
   * has no hitbox to center on). Set externally by whoever positions this sentinel, since only
   * they know which battler (if any) the origin represents; see {@link #screenY} for why this
   * exists at all.
   * @type {number}
   */
  #verticalCenterOffset = 0;

  /**
   * Assigns the real action this sentinel stands in for.
   * @param {JABS_Action} jabsAction The real action being aimed.
   */
  set(jabsAction)
  {
    this.#jabsAction = jabsAction;
  }

  /**
   * Clears the assigned action; this sentinel no longer stands in for anything.
   */
  reset()
  {
    this.#jabsAction = null;
    this.#verticalCenterOffset = 0;
  }

  /**
   * Sets half the height of whichever battler's hitbox the origin is currently centered on (0
   * if the origin isn't a battler at all). See {@link #screenY} for why this matters.
   * @param {number} offset Half the target battler's hitbox height in pixels, or 0.
   */
  setVerticalCenterOffset(offset)
  {
    this.#verticalCenterOffset = offset;
  }

  /**
   * Moves the sentinel's position to match the cursor's current world position.
   * @param {number} x The world X.
   * @param {number} y The world Y.
   */
  setPosition(x, y)
  {
    this.#character.locate(x, y);
  }

  /**
   * The sentinel's screen X, pre-adjusted to cancel out the melee origin offset that
   * {@link JABS_Engine.getActionOriginPixels} applies internally. That offset exists to
   * correct a melee swing performed by the *caster's own body* for their sprite's facing — it
   * has nothing to do with an AoE centered on a chosen target's position, so without this
   * cancellation, an otherwise-symmetric AoE would land biased in whichever direction the
   * caster happened to be facing when they attacked, regardless of the actual target.
   * @returns {number}
   */
  screenX()
  {
    const { ox } = JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(this.#jabsAction.direction());
    return this.#character.screenX() - ox;
  }

  /**
   * The sentinel's screen Y, pre-adjusted for the same reason as {@link #screenX}, *and*
   * further shifted up by {@link #verticalCenterOffset}. Every battler's hitbox (whether the
   * generic tile-sized default or a custom per-enemy rectangle, e.g. 2x1, 1x0.5, 4x3 tiles — see
   * `Game_Event#getPixelAbsBattlerAabbModel`) is feet-anchored and extends upward only — so a
   * circle centered exactly on a target's feet is *not* centered on their hitbox, it's centered
   * on the hitbox's bottom edge. That bias is invisible for a single target, but it's exactly
   * what made an otherwise-symmetric row of targets catch only whichever neighbor sat below
   * (closer, since that neighbor's own box reaches upward toward the origin) and not the one
   * above (whose box only reaches further away). Shifting up by half of *that specific
   * battler's* hitbox height lands on its true vertical center, symmetric for both neighbors.
   * @returns {number}
   */
  screenY()
  {
    const facing = this.#jabsAction.direction();
    const { oy } = JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing(facing);
    const liftPx = JABS_Engine.resolveMeleeVerticalLiftPxForFacing(facing);
    return this.#character.screenY() + liftPx - oy - this.#verticalCenterOffset;
  }

  /**
   * The real action this sentinel currently stands in for.
   * @returns {JABS_Action|null}
   */
  getJabsAction()
  {
    return this.#jabsAction;
  }

  /**
   * The sentinel's raw, unadjusted ground screen position — the actual point being aimed at,
   * with none of {@link #screenX}/{@link #screenY}'s hit-test-specific corrections applied.
   * Meant for purely decorative positioning (e.g. the reticle sprite hovering above this point),
   * not for anything that feeds into collision math.
   * @returns {{x: number, y: number}}
   */
  groundScreenPosition()
  {
    return {
      x: this.#character.screenX(),
      y: this.#character.screenY(),
    };
  }
}

export default JABS_TargetingSentinelAction;
//endregion JABS_TargetingSentinelAction
