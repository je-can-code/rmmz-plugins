//region JABS_HitstopManager
import JABS_HitstopRuntime from './../_models/JABS_HitstopRuntime.js';

/**
 * A small helper that owns hitstop calculation and application.
 */
class JABS_HitstopManager
{
  /**
   * Computes the hitstop duration for this impact in frames.
   * @param {JABS_Action} action The action causing the impact.
   * @param {JABS_Battler} attacker The attacker battler.
   * @param {JABS_Battler} target The target battler.
   * @returns {number} The resolved frames (0..MaxFrames).
   */
  static durationFor(action, attacker, target)
  {
    // pull base frames from the skill tag or global default.
    const baseFrames = this.#getSkillHitstopFrames(action);

    // short-circuit if globally or locally disabled.
    if (baseFrames === 0) return 0;

    // derive flags from the result on the target battler.
    const result = target.getBattler()
      .result();

    // scale by crit bonus when applicable.
    const critBonus = result.critical
      ? J.ABS.EXT.HITSTOP.Metadata.critBonusFrames
      : 0;

    // scale by guard when applicable.
    const guardScale = result.guarded
      ? (J.ABS.EXT.HITSTOP.Metadata.guardScalePercent / 100)
      : 1;

    // parries nullify hitstop if present on result (shield ext sets result.parried).
    const isParry = result.parried === true;

    // compute raw duration from base adjustments.
    const raw = isParry
      ? 0
      : Math.floor((baseFrames + critBonus) * guardScale);

    // apply per-target scale (optional tag) on actors/enemies if present.
    const targetScale = this.#getBattlerHitstopScale(target);

    // combine and clamp to the configured max frames.
    const combined = Math.min(
      Math.floor(raw * targetScale),
      J.ABS.EXT.HITSTOP.Metadata.maxFrames
    );

    // return the final duration.
    return Math.max(0, combined);
  }

  /**
   * Applies hitstop to the attacker, target, and the delivering action event.
   * Also handles multi-hit decay.
   * @param {JABS_Action} action The action causing the hit.
   * @param {JABS_Battler} attacker The attacker.
   * @param {JABS_Battler} target The target.
   */
  static apply(action, attacker, target)
  {
    // compute the duration for this impact.
    let frames = this.durationFor(action, attacker, target);

    // if there is no duration, then do not apply hitstop.
    if (frames === 0) return;

    // resolve decay if the target recently took a hit from this action (multi-hit window).
    const targetChar = target.getCharacter();
    const hitstop = targetChar.getHitstopData();
    const actionUuid = action.getUuid();

    // if inside flurry window, reduce by global percent.
    if (hitstop.isInFlurryWindow(actionUuid))
    {
      // calculate the decayed frames.
      frames = Math.floor(frames * (J.ABS.EXT.HITSTOP.Metadata.flurryDecayPercent / 100));

      // clamp the result to minimum of 0.
      if (frames < 0) frames = 0;
    }

    // if still nothing after decay, do not apply.
    if (frames === 0) return;

    // apply the window for subsequent impacts from this same action.
    const wasFirstInFlurry = hitstop.isInFlurryWindow(actionUuid) === false;
    hitstop.flagFlurryWindow(actionUuid, J.ABS.EXT.HITSTOP.Metadata.flurryWindowFrames);

    // resolve all involved characters.
    const attackerChar = attacker.getCharacter();
    const actionChar = action.getActionSprite();

    // set hitstop on target.
    this.#applyFrames(targetChar, frames);

    // set hitstop on attacker.
    this.#applyFrames(attackerChar, frames);

    // set hitstop on the action event (if available or relevant).
    if (actionChar)
    {
      // set frames on the action event.
      this.#applyFrames(actionChar, frames);
    }

    // trigger a tiny screen shake to sell the moment (player-centric, anti-spam).
    this.#applyMicroShake(frames, attacker, target, wasFirstInFlurry);
  }

  //region internals
  /**
   * Applies frames to a `Game_Character`’s hitstop data (extends if active).
   * @param {Game_Character} character The character to affect.
   * @param {number} frames The frames to apply.
   */
  static #applyFrames(character, frames)
  {
    // grab hitstop data.
    const data = character.getHitstopData();

    // choose extension (max) so concurrent impacts coalesce.
    const extended = Math.max(data.getFrames(), frames);

    // set the frames on the character.
    data.setFrames(extended);
  }

  /**
   * Reads the skill’s hitstop frames, honoring `<noHitstop>`.
   * @param {JABS_Action} action The action to inspect.
   * @returns {number}
   */
  static #getSkillHitstopFrames(action)
  {
    // short-circuit if the skill declares no hitstop.
    if (action.skillDisablesHitstop()) return 0;

    // read a hitstop value from the skill if present; otherwise use default.
    const tagged = action.getHitstopFrames();

    // coalesce to default when no tag provided.
    return tagged > 0
      ? tagged
      : J.ABS.EXT.HITSTOP.Metadata.defaultHitstopFrames;
  }

  /**
   * Computes a per-battler scale (actors/enemies) for hitstop if tagged.
   * @param {JABS_Battler} jabsBattler The battler to read scale from.
   * @returns {number} A multiplier like 1.0 for 100%.
   */
  static #getBattlerHitstopScale(jabsBattler)
  {
    // grab the database object for the battler.
    const db = jabsBattler.getBattlerDatabaseData();

    // resolve a percent from notes if present.
    const scalePercent = RPGManager.getNumberFromNoteByRegex(db, J.ABS.EXT.HITSTOP.RegExp.HitstopScale, true);

    // if no scale provided, default to 100%.
    if (!scalePercent) return 1;

    // convert to a multiplier.
    return Math.max(0, scalePercent) / 100;
  }

  /**
   * Applies a subtle screen shake scaled by the given hitstop frames.
   * Player-centric, anti-spam, and optionally first-hit-only within flurry.
   * @param {number} frames The resolved, post-decay hitstop frames.
   * @param {JABS_Battler} attacker The attacker.
   * @param {JABS_Battler} target The target.
   * @param {boolean} wasFirstInFlurry Whether this was the first impact in the flurry window.
   */
  static #applyMicroShake(frames, attacker, target, wasFirstInFlurry)
  {
    // feature toggle and minimum significance.
    if (J.ABS.EXT.HITSTOP.Metadata.shakeOnHit === false) return;
    if (frames < J.ABS.EXT.HITSTOP.Metadata.shakeMinFrames) return;

    // only first hit in a flurry may shake, if configured.
    if (J.ABS.EXT.HITSTOP.Metadata.shakeOnlyOnFlurryFirstHit && wasFirstInFlurry === false) return;

    // player-centric gating.
    const onlyOnPlayer = J.ABS.EXT.HITSTOP.Metadata.onlyOnPlayerImpact === true;
    const alsoOnPlayerTarget = J.ABS.EXT.HITSTOP.Metadata.alsoOnPlayerAsTarget === true;
    const attackerIsPlayer = attacker.isPlayer && attacker.isPlayer();
    const targetIsPlayer = target.isPlayer && target.isPlayer();

    if (onlyOnPlayer)
    {
      // allow: player as attacker; optionally: player as target.
      const allowed = attackerIsPlayer || (alsoOnPlayerTarget && targetIsPlayer);
      if (allowed === false) return;
    }

    // global anti-spam cooldown using frame counter.
    const now = Graphics.frameCount || SceneManager._frameCount || 0;
    const cooldown = J.ABS.EXT.HITSTOP.Metadata.shakeCooldownFrames;
    if (now - JABS_HitstopRuntime.lastShakeFrame < cooldown) return;

    // derive power and duration (still tiny), then shake.
    const base = J.ABS.EXT.HITSTOP.Metadata.shakeBasePower;
    const perF = J.ABS.EXT.HITSTOP.Metadata.shakePowerPerFrame;
    const power = Math.max(0, base + (frames * perF));
    const speed = J.ABS.EXT.HITSTOP.Metadata.shakeSpeed;
    const duration = Math.min(frames, J.ABS.EXT.HITSTOP.Metadata.shakeMaxDurationFrames);

    // continue the routine with the next policy step.
    $gameScreen.startShake(power, speed, duration);

    // stamp cooldown.
    JABS_HitstopRuntime.lastShakeFrame = now;
  }

  //endregion internals
}

export default JABS_HitstopManager;
//endregion JABS_HitstopManager