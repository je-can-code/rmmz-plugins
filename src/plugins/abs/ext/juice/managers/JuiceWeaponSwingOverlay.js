//region JuiceWeaponSwingOverlay
/**
 * Spawns a short-lived weapon icon sprite parented to a {@link Sprite_Character} and swings it.
 */
class JuiceWeaponSwingOverlay
{
  /**
   * @param {number} d Candidate direction code.
   * @returns {boolean}
   */
  static #isValidSwingDirection(d)
  {
    return d >= 1 && d <= 9 && d !== 5;
  }

  /**
   * True when motion uses clock-orbit arc geometry (shared focal point).
   * @param {string} motionType Preset key (kebab-case).
   * @returns {boolean}
   */
  static #isArcMotion(motionType)
  {
    return motionType === JuiceWeaponSwingMotionEffect.MotionTypes.Arc
      || motionType === JuiceWeaponSwingMotionEffect.MotionTypes.ArcReverse;
  }

  /**
   * @param {number} spinCount Spin count from hook (may be invalid when absent).
   * @returns {number}
   */
  static #coalesceSpinCount(spinCount)
  {
    if (spinCount === undefined || spinCount === null || Number.isFinite(spinCount) === false)
    {
      return 1;
    }

    return spinCount;
  }

  /**
   * Derives a direction-aware overlay placement so the icon reads like it's coming from the hand.
   * Used for spin / stab (arc presets use orbit math instead).
   * @param {Sprite_Character} parentSprite The character sprite receiving the overlay.
   * @param {string} motionType Preset key (kebab-case).
   * @param {number} direction RMMZ 8-dir (same snapshot as the swing arc uses).
   * @returns {{ x: number, y: number, scale: number }}
   */
  static #buildSwingProfile(parentSprite, motionType, direction)
  {
    const ph = parentSprite.patternHeight();

    const tightOrbit = motionType === JuiceWeaponSwingMotionEffect.MotionTypes.Arc
      || motionType === JuiceWeaponSwingMotionEffect.MotionTypes.ArcReverse;

    const tw = tightOrbit ? 20 : 26;
    const ySide = -ph * (tightOrbit ? 0.48 : 0.52);
    const yDown = -ph * (tightOrbit ? 0.18 : 0.22);
    const yUp = -ph * (tightOrbit ? 0.76 : 0.82);

    const card = (horiz, vert, sc) =>
    {
      return { x: horiz, y: vert, scale: sc };
    };

    const blendProf = (a, b, t) =>
    {
      return {
        x: a.x + ((b.x - a.x) * t),
        y: a.y + ((b.y - a.y) * t),
        scale: a.scale + ((b.scale - a.scale) * t),
      };
    };

    const left = card(-tw, ySide, 1.65);
    const right = card(tw, ySide, 1.65);
    const down = card(tightOrbit ? 6 : 10, yDown, 1.5);
    const up = card(0, yUp, 1.5);

    /** @type {{ x: number, y: number, scale: number }} */
    let prof;

    switch (direction)
    {
      case 2:
        prof = down;
        break;
      case 4:
        prof = left;
        break;
      case 6:
        prof = right;
        break;
      case 8:
        prof = up;
        break;
      case 1:
        prof = blendProf(down, left, 0.5);
        break;
      case 3:
        prof = blendProf(down, right, 0.5);
        break;
      case 7:
        prof = blendProf(up, left, 0.5);
        break;
      case 9:
        prof = blendProf(up, right, 0.5);
        break;
      default:
        prof = left;
        break;
    }

    return { x: prof.x, y: prof.y, scale: prof.scale };
  }

  /**
   * Plays a swing arc using an icon from IconSet, then removes the overlay.
   * @param {Sprite_Character} parentSprite The character sprite receiving the overlay.
   * @param {number} iconIndex Icon index on the IconSet sheet.
   * @param {number} peakRotationRadians Peak extra rotation applied during the swing.
   * @param {number} durationFrames Duration of the swing in frames.
   * @param {string} motionType Preset key (kebab-case).
   * @param {number} arcSpanDegrees Arc span for arc modes (default 120).
   * @param {number} swingDirection RMMZ 8-dir from {@link JABS_Action#direction} at strike time (pivot/guard-safe).
   * Omit to use {@link Game_Character#direction}.
   * @param {number} weaponTipRadians Radians from +x to tip/bore at rotation 0 (stab / bash / recoil).
   * Resolved per motion when omitted in skill notes
   * ({@link JuiceProfileResolver.resolveJuiceWeaponTipRadians}).
   * @param {number} spinCount Full rotations for spin / spin-reverse
   * ({@link JuiceProfileResolver.resolveJuiceSpinCount}).
   * @param {boolean} profileGun Skill `<juiceProfileGun>` — horizontal mirror for side-profile gun icons (east/west).
   */
  static play(
    parentSprite,
    iconIndex,
    peakRotationRadians,
    durationFrames,
    motionType,
    arcSpanDegrees,
    swingDirection,
    weaponTipRadians,
    spinCount,
    profileGun
  )
  {
    let spanDeg = arcSpanDegrees;
    if (spanDeg === undefined || spanDeg === null || Number.isFinite(spanDeg) === false)
    {
      spanDeg = 120;
    }

    const pw = ImageManager.iconWidth;
    const ph = ImageManager.iconHeight;
    const bitmap = ImageManager.loadSystem('IconSet');
    const sx = (iconIndex % 16) * pw;
    const sy = Math.floor(iconIndex / 16) * ph;

    const overlay = new Sprite();
    overlay.bitmap = bitmap;
    overlay.setFrame(sx, sy, pw, ph);
    if (motionType === JuiceWeaponSwingMotionEffect.MotionTypes.Spin
      || motionType === JuiceWeaponSwingMotionEffect.MotionTypes.SpinReverse)
    {
      overlay.anchor.x = 1.15;
      overlay.anchor.y = 1.15;
    }
    else
    {
      overlay.anchor.x = 0.78;
      overlay.anchor.y = 0.92;
    }

    let swingDir = swingDirection;
    if (JuiceWeaponSwingOverlay.#isValidSwingDirection(swingDir) === false)
    {
      swingDir = parentSprite._character.direction();
    }

    let weaponTipResolved = weaponTipRadians;
    if (weaponTipResolved === undefined || weaponTipResolved === null || Number.isFinite(weaponTipResolved) === false)
    {
      weaponTipResolved = JuiceWeaponSwingMotionEffect.StabIconTipAngleRadians;
    }

    const spinCountResolved = JuiceWeaponSwingOverlay.#coalesceSpinCount(spinCount);

    const profileGunResolved = profileGun === true;

    const phy = parentSprite.patternHeight();

    let neutralForCtorX;
    let neutralForCtorY;

    if (JuiceWeaponSwingOverlay.#isArcMotion(motionType) === true)
    {
      const reverse = motionType === JuiceWeaponSwingMotionEffect.MotionTypes.ArcReverse;
      const pose0 = JuiceWeaponSwingMotionEffect.computeArcPose(swingDir, phy, spanDeg, reverse, 0);

      overlay.x = pose0.x;
      overlay.y = pose0.y;

      if (reverse === true)
      {
        const travel0 = JuiceWeaponSwingMotionEffect.computeArcTravelRadians(swingDir, phy, spanDeg, true, 0);
        overlay.rotation = JuiceWeaponSwingMotionEffect.bladeRotationFromTravelRadians(travel0);
      }
      else
      {
        overlay.rotation = JuiceWeaponSwingMotionEffect.bladeRotationArcForward(pose0.theta);
      }
      overlay.scale.x = 1.6;
      overlay.scale.y = 1.6;
    }
    else
    {
      const profile = JuiceWeaponSwingOverlay.#buildSwingProfile(parentSprite, motionType, swingDir);
      const juiceDy = J.ABS.EXT.JUICE.Metadata.spriteJuiceVerticalOffsetPixels;
      const neutralX = profile.x;
      const neutralY = profile.y + juiceDy;

      if (motionType === JuiceWeaponSwingMotionEffect.MotionTypes.Bash)
      {
        const bash0 = JuiceWeaponSwingMotionEffect.computeBashOffset(swingDir, phy, 0);
        const bashAlign = JuiceWeaponSwingMotionEffect.weaponTipAlign(
          swingDir,
          weaponTipResolved,
          profileGunResolved
        );

        overlay.x = neutralX + bash0.x;
        overlay.y = neutralY + bash0.y;
        overlay.rotation = bashAlign.rotation + JuiceWeaponSwingMotionEffect.bashWhipRotationRadians(0);
        overlay.scale.x = profile.scale * (bashAlign.mirrorX ? -1 : 1);
        overlay.scale.y = profile.scale;
        neutralForCtorX = neutralX;
        neutralForCtorY = neutralY;
      }
      else if (motionType === JuiceWeaponSwingMotionEffect.MotionTypes.Recoil)
      {
        const recoil0 = JuiceWeaponSwingMotionEffect.computeRecoilPose(swingDir, phy, 0);
        const recoilAlign = JuiceWeaponSwingMotionEffect.weaponTipAlign(
          swingDir,
          weaponTipResolved,
          profileGunResolved
        );

        overlay.x = neutralX + recoil0.x;
        overlay.y = neutralY + recoil0.y;
        overlay.rotation = recoilAlign.rotation + recoil0.rotationDelta;
        overlay.scale.x = profile.scale * (recoilAlign.mirrorX ? -1 : 1);
        overlay.scale.y = profile.scale;
        neutralForCtorX = neutralX;
        neutralForCtorY = neutralY;
      }
      else if (motionType === JuiceWeaponSwingMotionEffect.MotionTypes.StabForward)
      {
        const stabAlign = JuiceWeaponSwingMotionEffect.weaponTipAlign(
          swingDir,
          weaponTipResolved,
          profileGunResolved
        );

        overlay.x = neutralX;
        overlay.y = neutralY;
        overlay.rotation = stabAlign.rotation;
        overlay.scale.x = profile.scale * (stabAlign.mirrorX ? -1 : 1);
        overlay.scale.y = profile.scale;
      }
      else if (motionType === JuiceWeaponSwingMotionEffect.MotionTypes.Present)
      {
        const presentProf = JuiceWeaponSwingOverlay.#buildSwingProfile(parentSprite, motionType, 8);
        const presentJuiceDy = J.ABS.EXT.JUICE.Metadata.spriteJuiceVerticalOffsetPixels;
        const px = presentProf.x;
        const py = presentProf.y + presentJuiceDy;

        overlay.x = px;
        overlay.y = py;
        overlay.rotation = JuiceWeaponSwingMotionEffect.IconDiagonalRestRadians;
        overlay.scale.x = presentProf.scale;
        overlay.scale.y = presentProf.scale;
      }
      else
      {
        overlay.x = neutralX;
        overlay.y = neutralY;
        overlay.rotation = JuiceWeaponSwingMotionEffect.IconDiagonalRestRadians;
        overlay.scale.x = profile.scale;
        overlay.scale.y = profile.scale;
      }
    }

    overlay.opacity = 200;
    overlay.blendMode = 0;

    parentSprite.addChild(overlay);

    const baseRotation = overlay.rotation;

    let swingDirForMotion = swingDir;
    if (motionType === JuiceWeaponSwingMotionEffect.MotionTypes.Present)
    {
      swingDirForMotion = 8;
    }

    const motion = new JuiceWeaponSwingMotionEffect(
      parentSprite,
      overlay,
      baseRotation,
      peakRotationRadians,
      durationFrames,
      motionType,
      spanDeg,
      swingDirForMotion,
      weaponTipResolved,
      neutralForCtorX,
      neutralForCtorY,
      spinCountResolved,
      profileGunResolved
    );

    JuiceMotionManager.pushExternalEffect(motion);
  }
}
//endregion JuiceWeaponSwingOverlay