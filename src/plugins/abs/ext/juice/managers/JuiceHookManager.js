//region JuiceHookManager
import JuiceWeaponSwingOverlay from './JuiceWeaponSwingOverlay.js';
import JuiceProfileResolver from './../resolvers/JuiceProfileResolver.js';
import JuiceMotionManager from './JuiceMotionManager.js';
import JuiceMapSpriteFinder from './../helpers/JuiceMapSpriteFinder.js';
import JuiceFlurryStrikeRecord from './../helpers/JuiceFlurryStrikeRecord.js';
/**
 * Central hook orchestration for J-ABS-Juice (caster, target, casting).
 */
class JuiceHookManager
{
  /**
   * Remembers multi-hit connection counts for amplitude decay.
   * @type {Map<string, JuiceFlurryStrikeRecord>}
   */
  static #flurryState = new Map();

  /**
   * Clears stale flurry rows occasionally so long sessions do not grow forever.
   */
  static #maybeGarbageCollectFlurry()
  {
    if (Graphics.frameCount % 600 !== 0)
    {
      return;
    }

    // continue the routine with the next policy step.
    JuiceHookManager.#flurryState.clear();
  }

  /**
   * Computes amplitude multiplier for pierced / repeated applications.
   * @param {JABS_Action} action The action.
   * @param {JABS_Battler} target The target battler.
   * @returns {number}
   */
  static #computeFlurryAmplitudeScale(action, target)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const key = `${action.getUuid()}::${target.getUuid()}`;
    const frame = Graphics.frameCount;
    const prior = JuiceHookManager.#flurryState.get(key);
    let count = 1;

    if (prior && frame - prior.frame <= 2)
    {
      count = prior.count + 1;
    }

    // Register the value on the alias map for runtime lookup.
    JuiceHookManager.#flurryState.set(key, new JuiceFlurryStrikeRecord(count, frame));

    const decay = md.flurryDecayPercent / 100;
    return Math.pow(decay, count - 1);
  }

  /**
   * Hook: {@link JABS_Engine#postPrimaryBattleEffects}.
   * @param {JABS_Action} action The impacting action.
   * @param {JABS_Battler} target The battler receiving the effect.
   */
  static onPostPrimaryBattleEffects(action, target)
  {
    JuiceHookManager.#maybeGarbageCollectFlurry();

    const result = target.getBattler()
      .result();

    if (result.parried === true)
    {
      return;
    }

    if (result.evaded === true)
    {
      return;
    }

    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(target.getCharacter());
    if (!sprite)
    {
      return;
    }

    const md = J.ABS.EXT.JUICE.Metadata;
    const ga = action.getAction();

    // support / utility skills (damage.type 0 = None) do not produce a target hit-reaction squish.
    // the caster-side juice handles their motion; squishing here would cancel it mid-cycle.
    if (ga.item().damage.type === 0)
    {
      return;
    }

    let intensity = md.targetMagicalSquishIntensity;

    if (ga.isPhysical())
    {
      intensity = md.targetPhysicalSquishIntensity;
    }

    if (action.isHealing())
    {
      intensity *= md.healingRecipientSquishScale;
    }

    intensity *= JuiceHookManager.#computeFlurryAmplitudeScale(action, target);

    JuiceMotionManager.scheduleSquish(sprite, intensity, md.targetSquishFrames);
  }

  /**
   * Hook: {@link JABS_Engine.executeMapAction}.
   * @param {JABS_Battler} caster The caster.
   * @param {JABS_Action} action The action executing on the map.
   */
  static onExecuteMapAction(caster, action)
  {
    const skill = action.getBaseSkill();
    const cooldownKey = action.getCooldownType();
    const dodgeKey = JABS_Button.Dodge;

    if (cooldownKey === dodgeKey)
    {
      JuiceHookManager.#applyDodgeJuice(caster);
      return;
    }

    // <noJuice> suppresses all caster motion for this skill.
    if (skill.jabsNoJuice === true)
    {
      return;
    }

    const motionKey = skill.jabsJuiceMotion;

    // <juiceMotion:none> is an inline opt-out equivalent to <noJuice>.
    if (motionKey === 'none')
    {
      return;
    }

    // <juiceMotion:squish> fires a body squash on the caster, repeated per <juiceRepeatCount:N>.
    // <juiceDuration:N> overrides the per-cycle frame count.
    if (motionKey === 'squish')
    {
      const repeatCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const duration = JuiceProfileResolver.resolveJuiceDuration(action);
      JuiceHookManager.#applySquishCasterJuice(caster, repeatCount, duration);
      return;
    }

    // <juiceMotion:pulse> fires the casting shimmer pulse on the caster, repeated per <juiceRepeatCount:N>.
    // <juiceDuration:N> overrides the per-cycle frame count.
    if (motionKey === 'pulse')
    {
      const repeatCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const duration = JuiceProfileResolver.resolveJuiceDuration(action);
      JuiceHookManager.#applySupportCasterJuice(caster, repeatCount, duration);
      return;
    }

    // <juiceMotion:flip> spins the caster sprite clockwise N full rotations over the duration.
    if (motionKey === 'flip')
    {
      const repeatCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const duration = JuiceProfileResolver.resolveJuiceDuration(action);
      JuiceHookManager.#applyFlipBodyJuice(caster, 1, repeatCount, duration);
      return;
    }

    // <juiceMotion:flip-reverse> spins the caster sprite counter-clockwise N full rotations over the duration.
    if (motionKey === 'flip-reverse')
    {
      const repeatCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const duration = JuiceProfileResolver.resolveJuiceDuration(action);
      JuiceHookManager.#applyFlipBodyJuice(caster, -1, repeatCount, duration);
      return;
    }

    if (action.isHealing())
    {
      // healing without an explicit weapon motion tag gets the gentle support pulse.
      if (motionKey === String.empty)
      {
        JuiceHookManager.#applySupportCasterJuice(caster);
        return;
      }

      // authored <juiceMotion:…> wins over the healing shortcut — same path as strikes (tilt + overlay).
    }

    // support skills (damage.type 0 = None) without an explicit motion tag get the support pulse.
    if (skill.damage.type === 0 && motionKey === String.empty)
    {
      JuiceHookManager.#applySupportCasterJuice(caster);
      return;
    }

    JuiceHookManager.#applyStrikeJuice(caster, action);
  }

  /**
   * Applies dodge-only motion on the caster (scale squash, no weapon overlay).
   * @param {JABS_Battler} caster The dodging battler.
   */
  static #applyDodgeJuice(caster)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(caster.getCharacter());
    if (!sprite)
    {
      return;
    }

    // continue the routine with the next policy step.
    JuiceMotionManager.scheduleSquish(sprite, md.dodgeSquishIntensity, md.dodgeSquishFrames);
  }

  /**
   * Applies a body squash on the caster, optionally repeated {@link repeatCount} times.
   * Used by <juiceMotion:squish> for skills that want a punchy caster reaction without a weapon overlay.
   * @param {JABS_Battler} caster The caster.
   * @param {number} [repeatCount=1] How many times to cycle the squish.
   */
  /**
   * Applies a body squash on the caster, optionally repeated {@link repeatCount} times.
   * Used by <juiceMotion:squish> for skills that want a punchy caster reaction without a weapon overlay.
   * @param {JABS_Battler} caster The caster.
   * @param {number} [repeatCount=1] How many times to cycle the squish.
   * @param {number|null} [totalDuration=null] Total frame budget; divided evenly across cycles. Defaults to metadata value.
   */
  static #applySquishCasterJuice(caster, repeatCount = 1, totalDuration = null)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(caster.getCharacter());
    if (!sprite)
    {
      return;
    }

    // divide the total duration evenly across all cycles.
    const baseDuration = totalDuration ?? md.unarmedStrikeSquishFrames;
    const perCycleDuration = Math.max(1, Math.floor(baseDuration / repeatCount));

    JuiceMotionManager.scheduleSquish(sprite, md.unarmedStrikeSquishIntensity, perCycleDuration, repeatCount);
  }

  /**
   * Applies gentle caster pulse for healing or support actions, optionally repeated {@link repeatCount} times.
   * @param {JABS_Battler} caster The healing caster.
   * @param {number} [repeatCount=1] How many times to cycle the pulse.
   * @param {number|null} [totalDuration=null] Total frame budget; divided evenly across cycles. Defaults to metadata value.
   */
  static #applySupportCasterJuice(caster, repeatCount = 1, totalDuration = null)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(caster.getCharacter());
    if (!sprite)
    {
      return;
    }

    // divide the total duration evenly across all cycles.
    const baseDuration = totalDuration ?? md.supportCasterPulseFrames;
    const perCycleDuration = Math.max(1, Math.floor(baseDuration / repeatCount));

    JuiceMotionManager.scheduleSquish(sprite, md.supportCasterPulseIntensity, perCycleDuration, repeatCount);
  }

  /**
   * Spins the caster sprite through N full 360° rotations over the total duration.
   * Used by <juiceMotion:flip> (clockwise) and <juiceMotion:flip-reverse> (counter-clockwise).
   * @param {JABS_Battler} caster The caster.
   * @param {number} directionSign +1 for clockwise, -1 for counter-clockwise.
   * @param {number} [repeatCount=1] Number of full rotations to complete.
   * @param {number|null} [totalDuration=null] Total frame budget. Defaults to metadata unarmed squish frames.
   */
  static #applyFlipBodyJuice(caster, directionSign, repeatCount = 1, totalDuration = null)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(caster.getCharacter());
    if (!sprite)
    {
      return;
    }

    const duration = totalDuration ?? md.unarmedStrikeSquishFrames;
    JuiceMotionManager.scheduleFlipBody(sprite, directionSign, duration, repeatCount);
  }

  /**
   * Applies strike motion: tilt + optional weapon swing for actors when an icon resolves.
   * @param {JABS_Battler} caster The attacker.
   * @param {JABS_Action} action The strike action.
   */
  static #applyStrikeJuice(caster, action)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(caster.getCharacter());
    if (!sprite)
    {
      // exit early without a payload.
      return;
    }

    const styleKey = JuiceProfileResolver.resolveWeaponStyleKey(caster, action);
    const mul = JuiceProfileResolver.resolveStyleMultipliers(styleKey);

    // continue the routine with the next policy step.
    JuiceMotionManager.scheduleTilt(
      sprite,
      md.casterStrikeTiltRadians * mul.tiltMul,
      // continue the routine with the next policy step.
      md.casterStrikeTiltFrames
    );

    const iconIndex = JuiceProfileResolver.resolveWeaponIconIndex(caster, action);
    if (iconIndex >= 0)
    {
      // exaggerate the swing so it stays readable through rapid combos.
      // this is intentionally over-the-top (paper mario juice).
      const swingWidthMultiplier = 2;
      const swingDurationMultiplier = 2;

      // select the motion type for this skill.
      const motionType = JuiceProfileResolver.resolveJuiceMotion(action);
      const arcSpanDegrees = JuiceProfileResolver.resolveJuiceArcSpanDegrees(action);
      const weaponTipRadians = JuiceProfileResolver.resolveJuiceWeaponTipRadians(action, motionType);
      const spinCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const profileGun = JuiceProfileResolver.resolveJuiceProfileGun(action);
      const juiceDuration = JuiceProfileResolver.resolveJuiceDuration(action)
        ?? (md.weaponSwingFrames * swingDurationMultiplier);

      // continue the routine with the next policy step.
      JuiceWeaponSwingOverlay.play(
        sprite,
        iconIndex,
        md.weaponSwingPeakRadians * mul.swingMul * swingWidthMultiplier,
        juiceDuration,
        motionType,
        arcSpanDegrees,
        action.direction(),
        weaponTipRadians,
        spinCount,
        profileGun
      );
    }
    else
    {
      JuiceMotionManager.scheduleSquish(
        sprite,
        md.unarmedStrikeSquishIntensity,
        md.unarmedStrikeSquishFrames
      );
    }
  }

  /**
   * Hook: cast timer loop — starts a casting pulse once per cast session.
   * @param {JABS_Battler} battler The casting battler.
   */
  static tickCastingJuice(battler)
  {
    if (battler._juiceCastingScheduled === true)
    {
      return;
    }

    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(battler.getCharacter());
    if (!sprite)
    {
      return;
    }

    battler._juiceCastingScheduled = true;

    const md = J.ABS.EXT.JUICE.Metadata;

    JuiceMotionManager.scheduleCastingPulse(
      sprite,
      md.castingPulseAmplitude,
      () => battler.isCasting()
    );
  }

  /**
   * Hook: cast completion — tears down casting-layer motion before execution juice runs.
   * @param {JABS_Battler} battler The battler who finished casting.
   */
  static endCastingJuice(battler)
  {
    battler._juiceCastingScheduled = false;

    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(battler.getCharacter());
    if (!sprite)
    {
      return;
    }

    JuiceMotionManager.cancelForSprite(sprite);
  }
}
export default JuiceHookManager;
//endregion JuiceHookManager