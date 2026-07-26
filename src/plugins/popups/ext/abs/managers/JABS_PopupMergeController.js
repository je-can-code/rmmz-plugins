//region JABS_PopupMergeController

/**
 * Central merge policy for map popups: accumulate compatible hits on a {@link Sprite_MapDamage}, then release motion.
 */
class JABS_PopupMergeController
{
  /**
   * Weak map: {@link Game_Character} -> `{ sessions: Map<string, object> }`.
   *
   * @type {WeakMap<Game_Character, { sessions: Map<string, object> }>}
   */
  static #characterStore = new WeakMap();

  /**
   * Characters that currently own at least one open merge session (idle flush scanning).
   *
   * @type {Set<Game_Character>}
   */
  static #trackedCharacters = new Set();

  /**
   * Resolves ring offsets exactly like {@link Sprite_Character#createIncomingTextPop}.
   *
   * @param {Sprite_Character} spriteCharacter The anchor sprite.
   * @param {Map_TextPop} popup The popup model.
   * @returns {{ x: number, y: number }}
   */
  static #ringExtraFor(spriteCharacter, popup)
  {
    const character = spriteCharacter.character();
    const isMotionType = popup.popupType === Map_TextPop.Types.HpDamage ||
                         popup.popupType === Map_TextPop.Types.MpDamage ||
                         popup.popupType === Map_TextPop.Types.TpDamage ||
                         popup.healing === true;
    const useMotion = J.POPUPS.Layout.Motion.Enabled === true && isMotionType;

    if (useMotion)
    {
      return PopupLayoutHelper.resolveMotionOffset(popup);
    }

    return PopupLayoutHelper.consumeLayoutRingOffset(character, popup.layoutRing);
  }

  /**
   * @param {Game_Character} character The anchor character.
   * @returns {{ sessions: Map<string, object> }}
   */
  static #ensureBucket(character)
  {
    let bucket = JABS_PopupMergeController.#characterStore.get(character);

    if (!bucket)
    {
      bucket = {
        sessions: new Map(),
      };
      JABS_PopupMergeController.#characterStore.set(character, bucket);
    }

    return bucket;
  }

  /**
   * Stamps the current frame on a single merge session so its idle window resets independently.
   * Other sessions on the same character are unaffected and can expire on their own timeline.
   *
   * @param {object} session The individual merge session to touch.
   */
  static #touchSessionMergeWindow(session)
  {
    session.lastActivityFrame = Graphics.frameCount;
  }

  /**
   * @param {Game_Character} character The anchor character.
   */
  static #trackCharacter(character)
  {
    JABS_PopupMergeController.#trackedCharacters.add(character);
  }

  /**
   * @param {Game_Character} character The anchor character.
   */
  static #untrackIfEmpty(character)
  {
    const bucket = JABS_PopupMergeController.#characterStore.get(character);

    if (!bucket || bucket.sessions.size === 0)
    {
      JABS_PopupMergeController.#trackedCharacters.delete(character);
    }
  }

  /**
   * Ends accumulation and starts bounce motion on a merge sprite.
   *
   * @param {Sprite_MapDamage} sprite The live sprite.
   */
  static #releaseSprite(sprite)
  {
    if (sprite.releaseAccumulatePhase)
    {
      sprite.releaseAccumulatePhase();
    }
  }

  /**
   * Ends merge accumulation so {@link Sprite_Character#updateTextPops} can run vanilla motion + fadeOut teardown.
   * Does **not** destroy the sprite — flush means “release into bounce”, same lifecycle as non-merge pops.
   *
   * @param {Sprite_Damage|Sprite_MapDamage} sprite The anchored popup sprite (still parented + bucket-tracked).
   */
  static #finishMergeSessionVisualRelease(sprite)
  {
    if (!sprite || sprite.destroyed === true)
    {
      return;
    }

    // continue the routine with the next policy step.
    JABS_PopupMergeController.#releaseSprite(sprite);
  }

  /**
   * @param {Map_TextPop} pop Template popup (clone fields shallowly for fresh builders).
   * @returns {Map_TextPop}
   */
  static #clonePopTemplate(pop)
  {
    return new Map_TextPop({
      iconIndex: pop.iconIndex,
      textColorIndex: pop.textColorIndex,
      // continue the routine with the next policy step.
      popupType: pop.popupType,
      value: pop.value,
      critical: pop.critical,
      // continue the routine with the next policy step.
      coordinateVariance: pop.coordinateVariance,
      healing: pop.healing,
      textAccent: pop.textAccent,
      // continue the routine with the next policy step.
      layoutRing: pop.layoutRing,
      jInstantRelease: false,
    });
  }

  /**
   * Builds the merge key for combat strikes on a target — **one aggregate stream per battler** for each
   * resource line (popup type) and heal-vs-harm polarity. Source attribution stays in action logs; first hit
   * carries icon/crit styling until flush.
   *
   * @param {Map_TextPop} pop Built popup anchored on the **target** character.
   * @returns {string}
   */
  static buildStrikeMergeKey(pop)
  {
    const healOrHarm = pop.healing === true ? 'heal' : 'harm';

    return [ 'strike', pop.popupType, healOrHarm ].join('|');
  }

  /**
   * Slip/regen streams merge every contributor on this battler (HP/MP/TP × heal vs slip damage).
   *
   * @param {Map_TextPop} pop Built slip/regen popup.
   * @returns {string}
   */
  static buildSlipMergeKey(pop)
  {
    const healOrHarm = pop.healing === true ? 'heal' : 'harm';

    return [ 'slip', pop.popupType, healOrHarm ].join('|');
  }

  /**
   * @param {Map_TextPop.Types} mitigationType Parry vs evade bucket.
   * @returns {string}
   */
  static buildMitigationMergeKey(mitigationType)
  {
    return [ 'mitigation', mitigationType ].join('|');
  }

  /**
   * @param {Map_TextPop.Types} rewardType Exp/gold/sdp/etc.
   * @returns {string}
   */
  static buildRewardMergeKey(rewardType)
  {
    return [ 'reward', rewardType ].join('|');
  }

  /**
   * Routes a combat strike popup through merge or instant dispatch.
   *
   * @param {Map_TextPop} pop Built popup.
   * @param {Game_Character} character Target anchor.
   * @param {{ attackerUuid: string, targetUuid: string, amount: number }} ctx Strike metadata (uuid fields
   * kept for diagnostics; merge buckets no longer split by attacker).
   */
  static routeStrikePop(pop, character, ctx)
  {
    if (J.POPUPS.EXT.ABS.Metadata.mergeParams.enableCombat === false)
    {
      TextPopManager.show(pop, character);

      // exit early without a payload.
      return;
    }

    const key = JABS_PopupMergeController.buildStrikeMergeKey(pop);
    const spriteCharacter = PopupSpriteLocator.findSpriteCharacterForGameCharacter(character);

    if (!spriteCharacter)
    {
      TextPopManager.show(pop, character);

      // exit early without a payload.
      return;
    }

    const bucket = JABS_PopupMergeController.#ensureBucket(character);

    let session = bucket.sessions.get(key);


    if (!session)
    {
      const template = JABS_PopupMergeController.#clonePopTemplate(pop);

      // merge sessions should not permanently inherit critical styling from one hit.
      // instead, critical contributions communicate themselves via a stronger pulse.
      template.critical = false;
      template.value = String(Math.round(ctx.amount));
      const ringExtra = JABS_PopupMergeController.#ringExtraFor(spriteCharacter, template);
      const sprite = TextPopSpriteManager.convert(template, ringExtra);

      // if the very first hit in this merged stream crits, immediately advertise it
      // with the larger combine pulse instead of silently treating it as a normal add.
      if (pop.critical === true && sprite.kickMergeCombinePulse)
      {
        sprite.kickMergeCombinePulse(true);
      }

      session = {
        kind: 'strike',
        sprite,
        runningTotal: ctx.amount,
      };

      // Register the value on the alias map for runtime lookup.
      bucket.sessions.set(key, session);
      JABS_PopupMergeController.#trackCharacter(character);
      spriteCharacter.attachConvertedDamagePopupSprite(sprite, template);
      JABS_PopupMergeController.#touchSessionMergeWindow(session);

      // exit early without a payload.
      return;
    }

    session.runningTotal += ctx.amount;
    pop.value = String(Math.round(session.runningTotal));

    if (session.sprite && session.sprite.refreshDisplayedValue)
    {
      session.sprite.refreshDisplayedValue(pop.value, pop.critical === true);
      session.sprite._j._popups._sourcePopup.value = pop.value;
    }

    JABS_PopupMergeController.#touchSessionMergeWindow(session);
  }

  /**
   * Routes slip/regen pops into per-target aggregate streams.
   *
   * @param {Map_TextPop} pop Built slip popup.
   * @param {Game_Character} character Target anchor.
   * @param {{ type: number, stateId: number, amount: number }} ctx Slip metadata (`stateId` still passed for hooks).
   */
  static routeSlipPop(pop, character, ctx)
  {
    if (J.POPUPS.EXT.ABS.Metadata.mergeParams.enableSlip === false)
    {
      TextPopManager.show(pop, character);

      // exit early without a payload.
      return;
    }

    const key = JABS_PopupMergeController.buildSlipMergeKey(pop);
    const spriteCharacter = PopupSpriteLocator.findSpriteCharacterForGameCharacter(character);

    if (!spriteCharacter)
    {
      TextPopManager.show(pop, character);

      // exit early without a payload.
      return;
    }

    const bucket = JABS_PopupMergeController.#ensureBucket(character);

    let session = bucket.sessions.get(key);

    if (!session)
    {
      const template = JABS_PopupMergeController.#clonePopTemplate(pop);

      template.value = String(Math.round(ctx.amount));
      const ringExtra = JABS_PopupMergeController.#ringExtraFor(spriteCharacter, template);
      const sprite = TextPopSpriteManager.convert(template, ringExtra);

      session = {
        kind: 'slip',
        sprite,
        runningTotal: ctx.amount,
      };

      // Register the value on the alias map for runtime lookup.
      bucket.sessions.set(key, session);
      JABS_PopupMergeController.#trackCharacter(character);
      spriteCharacter.attachConvertedDamagePopupSprite(sprite, template);
      JABS_PopupMergeController.#touchSessionMergeWindow(session);

      // exit early without a payload.
      return;
    }

    session.runningTotal += ctx.amount;
    pop.value = String(Math.round(session.runningTotal));

    if (session.sprite && session.sprite.refreshDisplayedValue)
    {
      session.sprite.refreshDisplayedValue(pop.value);
      session.sprite._j._popups._sourcePopup.value = pop.value;
    }

    JABS_PopupMergeController.#touchSessionMergeWindow(session);
  }

  /**
   * Stacks mitigation labels (parry / dodge counts).
   *
   * @param {Map_TextPop} pop Built mitigation popup.
   * @param {Game_Character} character Anchor.
   * @param {{ mitigationType: Map_TextPop.Types, labelPrefix: string }} ctx Labels.
   */
  static routeMitigationPop(pop, character, ctx)
  {
    if (J.POPUPS.EXT.ABS.Metadata.mergeParams.enableMitigation === false)
    {
      TextPopManager.show(pop, character);

      // exit early without a payload.
      return;
    }

    const key = JABS_PopupMergeController.buildMitigationMergeKey(ctx.mitigationType);
    const spriteCharacter = PopupSpriteLocator.findSpriteCharacterForGameCharacter(character);

    if (!spriteCharacter)
    {
      TextPopManager.show(pop, character);

      // exit early without a payload.
      return;
    }

    const bucket = JABS_PopupMergeController.#ensureBucket(character);

    let session = bucket.sessions.get(key);

    if (!session)
    {
      const template = JABS_PopupMergeController.#clonePopTemplate(pop);

      template.value = `${ctx.labelPrefix} x1`;
      const ringExtra = JABS_PopupMergeController.#ringExtraFor(spriteCharacter, template);
      const sprite = TextPopSpriteManager.convert(template, ringExtra);

      session = {
        kind: 'mitigation',
        sprite,
        count: 1,
        labelPrefix: ctx.labelPrefix,
      };

      // Register the value on the alias map for runtime lookup.
      bucket.sessions.set(key, session);
      JABS_PopupMergeController.#trackCharacter(character);
      spriteCharacter.attachConvertedDamagePopupSprite(sprite, template);
      JABS_PopupMergeController.#touchSessionMergeWindow(session);

      // exit early without a payload.
      return;
    }

    session.count += 1;
    pop.value = `${session.labelPrefix} x${session.count}`;

    if (session.sprite && session.sprite.refreshDisplayedValue)
    {
      session.sprite.refreshDisplayedValue(pop.value);
      session.sprite._j._popups._sourcePopup.value = pop.value;
    }

    JABS_PopupMergeController.#touchSessionMergeWindow(session);
  }

  /**
   * Sums reward-line pops (exp/gold/sdp/apt numbers).
   *
   * @param {Map_TextPop} pop Built reward popup.
   * @param {Game_Character} character Anchor.
   * @param {{ rewardType: Map_TextPop.Types, amount: number }} ctx Reward metadata.
   */
  static routeRewardPop(pop, character, ctx)
  {
    if (J.POPUPS.EXT.ABS.Metadata.mergeParams.enableRewards === false)
    {
      TextPopManager.show(pop, character);

      // exit early without a payload.
      return;
    }

    const key = JABS_PopupMergeController.buildRewardMergeKey(ctx.rewardType);
    const spriteCharacter = PopupSpriteLocator.findSpriteCharacterForGameCharacter(character);

    if (!spriteCharacter)
    {
      TextPopManager.show(pop, character);

      // exit early without a payload.
      return;
    }

    const bucket = JABS_PopupMergeController.#ensureBucket(character);

    let session = bucket.sessions.get(key);

    if (!session)
    {
      const template = JABS_PopupMergeController.#clonePopTemplate(pop);

      template.value = String(Math.round(ctx.amount));
      const ringExtra = JABS_PopupMergeController.#ringExtraFor(spriteCharacter, template);
      const sprite = TextPopSpriteManager.convert(template, ringExtra);

      session = {
        kind: 'reward',
        sprite,
        runningTotal: ctx.amount,
      };

      // Register the value on the alias map for runtime lookup.
      bucket.sessions.set(key, session);
      JABS_PopupMergeController.#trackCharacter(character);
      spriteCharacter.attachConvertedDamagePopupSprite(sprite, template);
      JABS_PopupMergeController.#touchSessionMergeWindow(session);

      // exit early without a payload.
      return;
    }

    session.runningTotal += ctx.amount;
    pop.value = String(Math.round(session.runningTotal));

    if (session.sprite && session.sprite.refreshDisplayedValue)
    {
      session.sprite.refreshDisplayedValue(pop.value);
      session.sprite._j._popups._sourcePopup.value = pop.value;
    }

    JABS_PopupMergeController.#touchSessionMergeWindow(session);
  }

  /**
   * Flushes every open merge session on a character (releases accumulated sprites into normal bounce/fade).
   *
   * @param {Game_Character} character The anchor character.
   */
  static flushCharacter(character)
  {
    const bucket = JABS_PopupMergeController.#characterStore.get(character);

    if (!bucket)
    {
      return;
    }

    const spriteCharacter = PopupSpriteLocator.findSpriteCharacterForGameCharacter(character);

    if (!spriteCharacter)
    {
      bucket.sessions.clear();
      JABS_PopupMergeController.#untrackIfEmpty(character);

      // exit early without a payload.
      return;
    }

    bucket.sessions.forEach(session =>
    {
      JABS_PopupMergeController.#finishMergeSessionVisualRelease(session.sprite);
    });

    bucket.sessions.clear();
    JABS_PopupMergeController.#untrackIfEmpty(character);
  }

  /**
   * Idle flush: releases each merge session independently after it has been idle for the configured frames.
   * A slip tick no longer holds reward or strike sessions hostage — each stream expires on its own timeline.
   */
  static tickIdleFlush()
  {
    const idleFrames = J.POPUPS.EXT.ABS.Metadata.mergeParams.idleFlushFrames;
    const now = Graphics.frameCount;

    JABS_PopupMergeController.#trackedCharacters.forEach(character =>
    {
      const bucket = JABS_PopupMergeController.#characterStore.get(character);
      const spriteCharacter = PopupSpriteLocator.findSpriteCharacterForGameCharacter(character);
      const keys = Array.from(bucket.sessions.keys());

      keys.forEach(key =>
      {
        const session = bucket.sessions.get(key);

        if (!session || !spriteCharacter)
        {
          bucket.sessions.delete(key);

          // exit early without a payload.
          return;
        }

        // each session tracks its own activity timestamp; only flush when this specific stream is idle.
        const lastAct = session.lastActivityFrame;

        if (now - lastAct < idleFrames)
        {
          return;
        }

        JABS_PopupMergeController.#finishMergeSessionVisualRelease(session.sprite);
        bucket.sessions.delete(key);
      });

      JABS_PopupMergeController.#untrackIfEmpty(character);
    });
  }

  /**
   * Hard flush used on map transfer / explicit emitter requests.
   */
  static flushAllCharacters()
  {
    const list = Array.from(JABS_PopupMergeController.#trackedCharacters);

    list.forEach(character =>
    {
      JABS_PopupMergeController.flushCharacter(character);
    });
  }

  /**
   * Whether emitter subscriptions were wired (guards duplicate listener registration).
   *
   * @type {boolean}
   */
  static #emitterStarted = false;

  /**
   * Subscribes merge listeners once ABS metadata is ready.
   */
  static start()
  {
    if (JABS_PopupMergeController.#emitterStarted === true)
    {
      return;
    }

    JABS_PopupMergeController.#emitterStarted = true;

    J.POPUPS.Helpers.PopupEmitter.on(J.POPUPS.EventNames.MergeFlushAll, () =>
    {
      JABS_PopupMergeController.flushAllCharacters();
    });
  }
}

JABS_PopupMergeController.start();
export default JABS_PopupMergeController;
//endregion JABS_PopupMergeController