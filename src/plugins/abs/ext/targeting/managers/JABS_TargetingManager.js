//region JABS_TargetingManager
import JABS_TargetingSession from './../_models/JABS_TargetingSession.js';
import JABS_TargetingCursor from './../_models/JABS_TargetingCursor.js';
import JABS_TargetingSentinelAction from './../_models/JABS_TargetingSentinelAction.js';

/**
 * A static manager that owns the lifecycle of an in-progress tactical-targeting aim.<br/>
 * Two modes, chosen once at session start based on {@link JABS_Action#isDirectAction}:
 * - **cycle** (direct skills): the player cycles a discrete pool of eligible battlers gathered
 *   from `<proximity:N>`, scoped to allies/enemies per the skill's own scope.
 * - **freeRoam** (non-direct skills): the player freely aims a continuous point in space,
 *   clamped to `<proximity:N>` from the caster.<br/>
 * The soft-pause itself is NOT implemented via `$jabsEngine.absPause` (that flag is
 * single-owner: the quick menu's own per-frame cleanup unconditionally resets it to `false`
 * every frame the menu isn't open, which would stomp this feature's use of it). Instead,
 * `isActive()` is checked directly by aliases on the handful of gates that `absPause` used to
 * satisfy: {@link JABS_AiManager.canUpdate}, {@link JABS_Engine#canUpdateInput},
 * {@link Game_Player#canMove}, and {@link JABS_Battler#canUpdateEngagement}.
 */
class JABS_TargetingManager
{
  //region static fields
  /**
   * The currently active targeting session, or null if nobody is aiming.
   * @type {JABS_TargetingSession|null}
   */
  static _session = null;

  /**
   * The aiming state (cycle-select or free-roam) for the active session, or null.
   * @type {JABS_TargetingCursor|null}
   */
  static _cursor = null;

  /**
   * The shared sentinel action-event, reused across sessions; see its own class doc for why it
   * exists. Only meaningful while a session is active.
   * @type {JABS_TargetingSentinelAction}
   */
  static _sentinel = new JABS_TargetingSentinelAction();

  /**
   * The native dir8 (keyboard + analog stick) read on the previous frame, used to edge-detect a
   * fresh directional press in cycle mode (so holding a direction doesn't spam-cycle every
   * frame). Tracked separately from the d-pad below so each input channel gets its own turn.
   * @type {number}
   */
  static _previousDir8 = 0;

  /**
   * The d-pad step (-1/0/1) read on the previous frame, used to edge-detect a fresh d-pad press
   * in cycle mode, independently of the native dir8 channel above.
   * @type {number}
   */
  static _previousDpadStep = 0;

  /**
   * True for the remainder of the frame a session begins on. The button that opened the
   * session (e.g. mainhand attack) may be the same physical key as a raw `Input` symbol like
   * "ok" (both commonly bind to Z), so polling input on that same frame would immediately
   * confirm/cancel the session it just opened. Skip one frame before accepting input.
   * @type {boolean}
   */
  static _justBegan = false;

  /**
   * How many world tiles per frame the free-roam cursor moves while a direction is held.
   * @type {number}
   */
  static FreeRoamSpeedPerFrame = 0.15;
  //endregion static fields

  /**
   * Whether or not a targeting session is currently active.
   * @returns {boolean}
   */
  static isActive()
  {
    return this._session !== null;
  }

  /**
   * Gets the active aiming state, or null if nobody is aiming.
   * @returns {JABS_TargetingCursor|null}
   */
  static getCursor()
  {
    return this._cursor;
  }

  /**
   * Gets the shared sentinel action-event, standing in for whatever is currently being aimed.
   * @returns {JABS_TargetingSentinelAction}
   */
  static getSentinel()
  {
    return this._sentinel;
  }

  /**
   * Whether the primary of the given already-built actions requires the tactical targeting UX
   * instead of firing immediately.
   * @param {JABS_Action[]} actions The already-built pending actions.
   * @returns {boolean}
   */
  static isTargetedAttempt(actions)
  {
    return actions.length > 0 && actions[0].getBaseSkill().targeted;
  }

  /**
   * Peeks at what the given slot would fire without committing anything, returning the built
   * actions only if the attempt is both valid (non-empty, not global-cooldown-blocked) and
   * actually `<targeted>`. Centralizes the identical validation each `JABS_InputAdapter` choke
   * point needs, since only the caller knows which slot-specific gates/commit-tail apply.
   * @param {JABS_Battler} jabsBattler The battler attempting the action.
   * @param {string} slot The cooldown/skill slot being attempted.
   * @returns {JABS_Action[]} The pending actions if this is a valid targeted attempt; `[]` otherwise.
   */
  static peekTargetedActions(jabsBattler, slot)
  {
    // build the actions this slot would fire, exactly as the original method would.
    const actions = jabsBattler.getAttackData(slot);

    // an empty result means there's nothing to intercept.
    if (actions.length === 0) return [];

    // the global cooldown blocking this skill means it wouldn't have fired anyway.
    if (JABS_GlobalCooldown.isGlobalBlockingSkillId(jabsBattler, actions[0].getBaseSkill().id)) return [];

    // only a targeted primary action is ours to intercept.
    if (!this.isTargetedAttempt(actions)) return [];

    return actions;
  }

  /**
   * Begins a new targeting session for the given battler and already-built pending actions.
   * @param {JABS_Battler} battler The battler who is aiming.
   * @param {JABS_Action[]} actions The fully-built actions awaiting a confirmed target.
   * @param {function(JABS_Action[]): void} onCommit The slot-specific commit tail (cooldown
   * type, combo reset, etc.) to run once a target is confirmed.
   */
  static beginTargeting(battler, actions, onCommit)
  {
    // do not stomp an already-active session.
    if (this.isActive()) return;

    // stash the pending actions against a new session; `isActive()` becoming true is itself
    // what the aliased gates check, so nothing new happens while aiming.
    this._session = new JABS_TargetingSession(battler, actions, onCommit);

    // build the appropriate aiming state for this skill's flavor.
    const [ primaryAction ] = actions;
    this._cursor = primaryAction.isDirectAction()
      ? this.#buildCycleCursor(battler, primaryAction)
      : JABS_TargetingCursor.FreeRoam(battler, primaryAction.getProximity());

    // point the shared sentinel at the real action being aimed.
    this._sentinel.set(primaryAction);
    this.#syncSentinelPosition();

    // don't poll input until next frame; see the field doc on `_justBegan` for why.
    this._justBegan = true;
    this._previousDir8 = 0;
    this._previousDpadStep = 0;
  }

  /**
   * Gathers the eligible candidate pool for cycle mode, scoped to allies/enemies per the
   * skill's own scope, and builds a cursor over it.
   * @param {JABS_Battler} battler The battler doing the aiming.
   * @param {JABS_Action} primaryAction The primary action being aimed.
   * @returns {JABS_TargetingCursor}
   */
  static #buildCycleCursor(battler, primaryAction)
  {
    // <proximity:N> is the universal "how far can this skill reach" bound, for both direct
    // (candidate-pool search) and non-direct (free-roam clamp) skills.
    const proximity = primaryAction.getProximity();
    const candidates = this.gatherScopedCandidates(battler, primaryAction, proximity);

    return JABS_TargetingCursor.Cycle(battler, candidates, proximity);
  }

  /**
   * Gathers every battler within range that's actually a legitimate target for this action's
   * scope — allies only for an ally-scope skill, or anything not on the caster's own team
   * (inanimate/neutral objects included) for an enemy-scope skill. Shared by cycle-mode
   * candidate gathering and the AoE highlight preview, so a skill's AoE never highlights allies
   * as "about to be hit" when it can only actually affect enemies, or vice versa.<br/>
   * The enemy-scope branch deliberately does not reuse
   * {@link JABS_AiManager.getOpposingBattlersWithinRange} — that helper excludes neutral-team
   * battlers entirely (core's own auto-target priority chain only reaches them as a
   * special-cased last resort), but a player explicitly choosing a target via `<targeted>`
   * should be able to pick anything targetable, inanimate objects included.
   * @param {JABS_Battler} battler The battler doing the aiming.
   * @param {JABS_Action} action The action whose scope determines ally vs. enemy.
   * @param {number} range The range to search within.
   * @returns {JABS_Battler[]}
   */
  static gatherScopedCandidates(battler, action, range)
  {
    if (action.isSupportAction())
    {
      return JABS_AiManager.getAlliedBattlersWithinRange(battler, range);
    }

    // anything not on the caster's own team is fair game, neutral/inanimate included.
    return JABS_AiManager.getBattlersWithinRange(battler, range)
      .filter(candidate => !battler.isFriendlyTeam(candidate.getTeam()))
      .filter(candidate => !(candidate.isFollower() && candidate.getCharacter().isVisible() === false));
  }

  /**
   * Per-frame update while a targeting session may be active.<br/>
   * Stage 1 placeholder input: "ok" confirms, "cancel" aborts.
   */
  static update()
  {
    // if nobody is aiming, then there is nothing to update.
    if (!this.isActive()) return;

    // skip the frame the session began on; see `_justBegan`'s field doc for why.
    if (this._justBegan)
    {
      this._justBegan = false;
      return;
    }

    // move the cursor according to its mode, then keep the sentinel in sync.
    this.#updateCursorMovement();
    this.#syncSentinelPosition();

    // placeholder confirm input.
    if (Input.isTriggered('ok'))
    {
      this.confirm();
      return;
    }

    // placeholder cancel input.
    if (Input.isTriggered('cancel'))
    {
      this.cancel();
    }
  }

  /**
   * Reads directional input and moves the cursor according to its current mode.
   */
  static #updateCursorMovement()
  {
    if (this._cursor.isCycleMode())
    {
      this.#updateCycleSelection();
      return;
    }

    // free-roam: continuous movement while a direction is held, clamped to range. Both native
    // dir8 (keyboard + analog stick) and the d-pad move the cursor identically here — the
    // "smart alignment vs. raw list order" distinction only matters for cycle-mode selection.
    const dir8 = this.#readDirectionalInput();
    if (dir8 === 0) return;

    // convert the pressed direction into a unit vector, then step the cursor along it.
    const { x: dx, y: dy } = $jabsEngine.dir8ToUnitVector(dir8);
    const cursor = this._cursor;
    const caster = cursor.getCaster();
    let nextX = cursor.getX() + (dx * JABS_TargetingManager.FreeRoamSpeedPerFrame);
    let nextY = cursor.getY() + (dy * JABS_TargetingManager.FreeRoamSpeedPerFrame);

    // clamp to the skill's proximity range from the caster.
    const fromCasterX = nextX - caster.getX();
    const fromCasterY = nextY - caster.getY();
    const distanceFromCaster = Math.hypot(fromCasterX, fromCasterY);
    const range = cursor.getRange();
    if (distanceFromCaster > range && distanceFromCaster > 0)
    {
      // scale the step back down so it lands exactly on the range boundary instead of past it.
      const scale = range / distanceFromCaster;
      nextX = caster.getX() + (fromCasterX * scale);
      nextY = caster.getY() + (fromCasterY * scale);
    }

    // commit the (possibly clamped) new position.
    cursor.setPosition(nextX, nextY);
  }

  /**
   * Drives cycle-mode selection from two independent input channels, each edge-detected
   * separately so holding a direction doesn't spam-step every frame:
   * - native dir8 (keyboard + analog stick) drives {@link JABS_TargetingCursor#selectTowards},
   *   which jumps straight to whatever candidate best lines up with the pressed direction. This
   *   can skip over a candidate that isn't well-aligned even if it's spatially "in between."
   * - the d-pad instead drives {@link JABS_TargetingCursor#stepIndex}, which just advances
   *   through the candidate list one at a time, wrapping at either end, regardless of alignment
   *   — a reliable fallback for exactly the case above, where the alignment math doesn't
   *   cooperate and a candidate becomes otherwise unreachable.
   */
  static #updateCycleSelection()
  {
    // native dir8 (keyboard + analog stick): jump to the best-aligned candidate.
    const { dir8 } = Input;
    if (dir8 !== 0 && this._previousDir8 === 0)
    {
      const { x: dirX, y: dirY } = $jabsEngine.dir8ToUnitVector(dir8);
      this._cursor.selectTowards(dirX, dirY);
    }

    this._previousDir8 = dir8;

    // d-pad: advance through the list by raw index instead.
    const dpadStep = this.#readDpadStep();
    if (dpadStep !== 0 && this._previousDpadStep === 0)
    {
      this._cursor.stepIndex(dpadStep);
    }

    this._previousDpadStep = dpadStep;
  }

  /**
   * Reads the d-pad as a simple list-stepping direction: right/down advance forward, left/up
   * advance backward. Diagonals resolve to whichever axis is checked first (right/left before
   * up/down) rather than being treated as a distinct step.
   * @returns {-1|0|1}
   */
  static #readDpadStep()
  {
    const { Symbols } = J.ABS.EXT.INPUT;
    if (Input.isPressed(Symbols.DPadRight)) return 1;
    if (Input.isPressed(Symbols.DPadLeft)) return -1;
    if (Input.isPressed(Symbols.DPadDown)) return 1;
    if (Input.isPressed(Symbols.DPadUp)) return -1;

    return 0;
  }

  /**
   * Reads a numpad-style dir8 code (0 for none) from either native `Input.dir8` (keyboard
   * arrows and the analog stick — RMMZ reads the stick via hardcoded axis thresholds, unaffected
   * by symbol remapping) or, failing that, the d-pad. The d-pad's button codes get remapped to
   * custom `J.ABS.EXT.INPUT.Symbols.DPad*` symbols instead of the vanilla `'up'`/`'down'`/etc.
   * ones `Input.dir8` reads internally, so it never sees d-pad presses on its own — this mirrors
   * the same fix `Window_Selectable` already applies for menu navigation.
   * @returns {number}
   */
  static #readDirectionalInput()
  {
    // prefer native dir8 (keyboard + analog stick) when something's actually pressed.
    const { dir8 } = Input;
    if (dir8 !== 0) return dir8;

    // check each d-pad direction directly, then synthesize the equivalent numpad code.
    const { Symbols } = J.ABS.EXT.INPUT;
    const up = Input.isPressed(Symbols.DPadUp);
    const down = Input.isPressed(Symbols.DPadDown);
    const left = Input.isPressed(Symbols.DPadLeft);
    const right = Input.isPressed(Symbols.DPadRight);

    if (up && left) return 7;
    if (up && right) return 9;
    if (down && left) return 1;
    if (down && right) return 3;
    if (up) return 8;
    if (down) return 2;
    if (left) return 4;
    if (right) return 6;

    return 0;
  }

  /**
   * Keeps the shared sentinel's position aligned with the cursor's current effective position
   * (the selected battler in cycle mode, or the live point in free-roam mode), along with the
   * vertical centering offset that position requires — see
   * {@link JABS_TargetingSentinelAction#screenY} for why that offset varies: cycle mode centers
   * on a specific battler's own hitbox (whatever size it actually is), while free-roam mode aims
   * at open ground with no hitbox to center on at all.
   */
  static #syncSentinelPosition()
  {
    const cursor = this._cursor;
    if (cursor.isCycleMode())
    {
      const selected = cursor.getSelectedBattler();
      if (selected)
      {
        const character = selected.getCharacter();
        this._sentinel.setPosition(selected.getX(), selected.getY());
        this._sentinel.setVerticalCenterOffset(JABS_Engine.getBattlerAabbModel(character).h / 2);
      }
      return;
    }

    this._sentinel.setPosition(cursor.getX(), cursor.getY());
    this._sentinel.setVerticalCenterOffset(0);
  }

  /**
   * Confirms the current targeting session and commits the pending actions exactly as the
   * intercepted input-adapter method would have, using the cursor's actual resolved target.
   */
  static confirm()
  {
    // grab the active session; bail if somehow none is active.
    const session = this._session;
    if (!session) return;

    const battler = session.getBattler();
    const actions = session.getActions();
    const [ primaryAction ] = actions;

    // <directLock> skills promise to always land on the player's chosen target, live, even if
    // that target moves during cast time — core's own decision-time freezing already skips
    // <directLock> skills for exactly this reason (see `JABS_Battler#getAttackData`). Freezing a
    // location here would silently defeat that same guarantee, so instead of snapshotting
    // coordinates, hand the player's explicit pick to the same "known target" references
    // (`setTarget`/`setAllyTarget`) that live resolution already consults first, and leave the
    // location unset so `processQueuedActions()` falls through to live resolution.
    if (primaryAction.getBaseSkill().jabsDirectLock)
    {
      this.#confirmDirectLock(battler, primaryAction, session);
      return;
    }

    // resolve the real target location from the cursor's current state, facing wherever the
    // caster is currently facing regardless of mode.
    const { x, y } = this.#resolveTargetXY(battler);
    const location = JABS_Location.Builder()
      .setX(x)
      .setY(y)
      .setDirection(battler.getCharacter().direction())
      .build();

    // attach the resolved location to every action's options, preserving every other
    // per-action option (cooldown key, per-projectile spawn offsets, etc) untouched.
    actions.forEach(action =>
    {
      // read this action's own existing options rather than assuming they all match.
      const existing = action.getActionOptions();

      // rebuild the options with only the location swapped out.
      const rebuilt = JABS_ActionOptions.Builder()
        .setIsRetaliation(existing.isActionRetaliation())
        .setCooldownKey(existing.getCooldownKey())
        .setLocation(location)
        .setIsTerrainDamage(existing.isTerrainDamage())
        .setSpawnOffset(existing.getSpawnOffsetX(), existing.getSpawnOffsetY())
        .setProjectileTravelAngleDegrees(existing.getProjectileTravelAngleDegrees())
        .setRetaliationTarget(existing.getRetaliationTarget())
        .build();

      // assign the rebuilt options back onto the action.
      action.setActionOptions(rebuilt);
    });

    // run the slot-specific commit tail (cooldown type, combo reset, etc), exactly mirroring
    // what the intercepted input-adapter method would have done after `getAttackData`.
    session.getOnCommit()(actions);

    // end the session and restore normal JABS flow.
    this.#endSession();
  }

  /**
   * Confirms a `<directLock>` session: rather than freezing a location, hands the player's
   * explicit cycle-mode pick to whichever "known target" reference live resolution consults for
   * this action's scope, then commits without ever attaching a location at all. `<directLock>`
   * only ever applies to direct (cycle-mode) skills, so the cursor is guaranteed to be in cycle
   * mode here.
   * @param {JABS_Battler} battler The battler who confirmed the target.
   * @param {JABS_Action} primaryAction The primary action driving scope (ally vs. opponent).
   * @param {JABS_TargetingSession} session The active session being confirmed.
   */
  static #confirmDirectLock(battler, primaryAction, session)
  {
    // the player's explicit pick; may be null if the candidate pool was somehow empty, in which
    // case live resolution's own fallback chain takes over exactly as it would for a
    // non-targeted <directLock> skill.
    const selected = this._cursor.getSelectedBattler();
    if (selected)
    {
      // route the pick into whichever "known target" reference this action's scope consults
      // first: the ally-scope branch checks `getAllyTarget()`, while the opponent chain's
      // highest tier checks `getTarget()` before falling back to a general scan.
      if (primaryAction.isSupportAction())
      {
        battler.setAllyTarget(selected);
      }
      else
      {
        battler.setTarget(selected);
      }
    }

    // run the slot-specific commit tail exactly as the frozen-location path does; no location is
    // ever attached, so `processQueuedActions()` naturally falls through to live resolution.
    session.getOnCommit()(session.getActions());

    // end the session and restore normal JABS flow.
    this.#endSession();
  }

  /**
   * Resolves the world X/Y the confirmed action should target: the selected battler's position
   * in cycle mode, or the cursor's own live position in free-roam mode.
   * @param {JABS_Battler} battler The battler doing the aiming, used as a cycle-mode fallback if
   * the candidate pool somehow ended up empty.
   * @returns {{x: number, y: number}}
   */
  static #resolveTargetXY(battler)
  {
    const cursor = this._cursor;
    if (cursor.isCycleMode())
    {
      // fall back to the caster's own position if the candidate pool is somehow empty.
      const target = cursor.getSelectedBattler() ?? battler;
      return { x: target.getX(), y: target.getY() };
    }

    return { x: cursor.getX(), y: cursor.getY() };
  }

  /**
   * Cancels the current targeting session. Nothing was ever committed via `setDecidedAction`,
   * so no cooldown or cast time is consumed by backing out.
   */
  static cancel()
  {
    // if nobody is aiming, then there is nothing to cancel.
    if (!this.isActive()) return;

    // end the session and restore normal JABS flow.
    this.#endSession();
  }

  /**
   * Tears down the active session and restores normal JABS flow.
   */
  static #endSession()
  {
    // clear the active session and aiming state; the aliased gates immediately stop pausing.
    this._session = null;
    this._cursor = null;
    this._sentinel.reset();
  }
}

export default JABS_TargetingManager;
//endregion JABS_TargetingManager
