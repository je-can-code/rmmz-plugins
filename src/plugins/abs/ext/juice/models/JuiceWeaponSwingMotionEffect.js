//region JuiceWeaponSwingMotionEffect
import JuiceBaseEffect from './JuiceBaseEffect.js';
/**
 * Drives one weapon-icon overlay swing arc, then detaches and destroys the overlay sprite.
 */
class JuiceWeaponSwingMotionEffect extends JuiceBaseEffect
{
  /**
   * Unit forward vector (Pixi space: +x right, +y down) for map facing codes 1–9.
   * @param {number} dir Game_Character.direction().
   * @returns {{ x: number, y: number }}
   */

  //region properties
  /**
   * Gets the stab tip angle radians.
   * @returns {number} The stabTipAngleRadians.
   */
  stabTipAngleRadians()
  {
    // hand back the stab tip angle radians.
    return this._stabTipAngleRadians;
  }

  /**
   * Gets the profile gun.
   * @returns {boolean} The profileGun.
   */
  profileGun()
  {
    // hand back the profile gun.
    return this._profileGun;
  }

  /**
   * Gets the overlay.
   * @returns {Bitmap} The overlay.
   */
  overlay()
  {
    // hand back the overlay.
    return this._overlay;
  }

  /**
   * Gets the scale mag.
   * @returns {number} The scaleMag.
   */
  scaleMag()
  {
    // hand back the scale mag.
    return this._scaleMag;
  }

  /**
   * Gets the parent sprite.
   * @returns {Sprite} The parentSprite.
   */
  parentSprite()
  {
    // hand back the parent sprite.
    return this._parentSprite;
  }

  /**
   * Gets the frame.
   * @returns {number} The frame.
   */
  frame()
  {
    // hand back the frame.
    return this._frame;
  }

  /**
   * Sets the frame.
   * @param {number} newFrame The new frame.
   */
  setFrame(newFrame)
  {
    // assign the frame.
    this._frame = newFrame;
  }

  /**
   * Gets the duration frames.
   * @returns {number} The durationFrames.
   */
  durationFrames()
  {
    // hand back the duration frames.
    return this._durationFrames;
  }

  /**
   * Gets the swing direction.
   * @returns {number} The swingDirection.
   */
  swingDirection()
  {
    // hand back the swing direction.
    return this._swingDirection;
  }

  /**
   * Gets the motion type.
   * @returns {string} The motionType.
   */
  motionType()
  {
    // hand back the motion type.
    return this._motionType;
  }

  /**
   * Gets the repeat count.
   * @returns {number} The repeatCount.
   */
  repeatCount()
  {
    // hand back the repeat count.
    return this._repeatCount;
  }

  /**
   * Gets the trail.
   * @returns {{sprite: Sprite, ttl: number}[]} The trail.
   */
  trail()
  {
    // hand back the trail.
    return this._trail;
  }

  /**
   * Sets the trail.
   * @param {{sprite: Sprite, ttl: number}[]} newTrail The new trail.
   */
  setTrail(newTrail)
  {
    // assign the trail.
    this._trail = newTrail;
  }

  /**
   * Gets the arc span degrees.
   * @returns {number} The arcSpanDegrees.
   */
  arcSpanDegrees()
  {
    // hand back the arc span degrees.
    return this._arcSpanDegrees;
  }

  /**
   * Gets the base rotation.
   * @returns {number} The baseRotation.
   */
  baseRotation()
  {
    // hand back the base rotation.
    return this._baseRotation;
  }

  /**
   * Gets the base x.
   * @returns {number} The baseX.
   */
  baseX()
  {
    // hand back the base x.
    return this._baseX;
  }

  /**
   * Gets the base y.
   * @returns {number} The baseY.
   */
  baseY()
  {
    // hand back the base y.
    return this._baseY;
  }
  //endregion properties

  /**
   * Normalizes repeat count — floors to integer, defaults to 1 if invalid or below 1.
   * @param {number} repeatCount Candidate count from skill notes or resolver.
   * @returns {number}
   */

  static #clampRepeatCount(repeatCount)
  {
    if (repeatCount === undefined || repeatCount === null || Number.isFinite(repeatCount) === false)
    {
      return 1;
    }

    const k = Math.floor(repeatCount);

    return k < 1 ? 1 : k;
  }

  static #forwardUnit(dir)
  {
    const h = Math.SQRT1_2;
    switch (dir)
    {
      case 2:
        return { x: 0, y: 1 };
      case 4:
        return { x: -1, y: 0 };
      case 6:
        return { x: 1, y: 0 };
      case 8:
        return { x: 0, y: -1 };
      case 1:
        return { x: -h, y: h };
      case 3:
        return { x: h, y: h };
      case 7:
        return { x: -h, y: -h };
      case 9:
        return { x: h, y: -h };
      default:
        return { x: -1, y: 0 };
    }
  }

  /**
   * Maps clock hour (12 at top, CW positive hour index) to Pixi polar angle from +x axis (radians).
   * Accepts any real hour so callers can interpolate across midnight without `% 12` (continuous θ).
   * @param {number} hourFrom12CW Fractional hours from 12 o'clock clockwise (may be negative or > 12).
   * @returns {number}
   */
  static hourToTheta(hourFrom12CW)
  {
    return (-Math.PI / 2) + (hourFrom12CW * (Math.PI / 6));
  }

  /**
   * Arc center hour per arc-table.md (facing → center of 120° arc on screen clock).
   * @param {number} dir Game_Character.direction().
   * @returns {number}
   */
  static arcCenterHourFromDirection(dir)
  {
    switch (dir)
    {
      case 8:
        return 0;
      case 2:
        return 6;
      case 4:
        return 9;
      case 6:
        return 3;
      case 7:
        return 10.5;
      case 1:
        return 7.5;
      case 9:
        return 1.5;
      case 3:
        return 4.5;
      default:
        return 9;
    }
  }

  /**
   * Pose on the orbit for arc / arc-reverse at eased progress (also used at spawn with ease 0).
   * @param {number} dir Facing direction.
   * @param {number} phy Pattern height.
   * @param {number} arcSpanDegrees Arc span in degrees.
   * @param {boolean} reverse True for arc-reverse (CW on clock).
   * @param {number} ease Eased progress 0..1.
   * @returns {{ x: number, y: number, theta: number }}
   */
  static computeArcPose(dir, phy, arcSpanDegrees, reverse, ease)
  {
    const juiceDy = J.ABS.EXT.JUICE.Metadata.spriteJuiceVerticalOffsetPixels;
    const cx = 0;
    const cy = -(phy * 0.5) + juiceDy;
    const orbit = phy * 0.38;
    const spanHours = arcSpanDegrees / 30;
    const centerH = JuiceWeaponSwingMotionEffect.arcCenterHourFromDirection(dir);
    const half = spanHours / 2;

    // interpolate in unwrapped hour space — never `% 12` mid-arc or θ jumps ~2π when the swing crosses 12 o'clock.
    let hourFloat;
    if (reverse === false)
    {
      hourFloat = (centerH + half) - (spanHours * ease);
    }
    else
    {
      hourFloat = (centerH - half) + (spanHours * ease);
    }

    const theta = JuiceWeaponSwingMotionEffect.hourToTheta(hourFloat);
    const x = cx + (Math.cos(theta) * orbit);
    const y = cy + (Math.sin(theta) * orbit);

    return { x, y, theta };
  }

  /**
   * Instantaneous travel angle (radians) along the arc from eased pose samples.
   * Used for {@link MotionTypes.ArcReverse} blade orientation — velocity-aligned read matches reverse motion.
   * Forward {@link MotionTypes.Arc} keeps {@link JuiceWeaponSwingMotionEffect.bladeRotationArcForward} instead;
   * IconSet anchor was tuned to θ+π/2, not raw atan2 velocity.
   * @param {number} dir Facing direction.
   * @param {number} phy Pattern height.
   * @param {number} arcSpanDegrees Arc span in degrees.
   * @param {boolean} reverse Arc-reverse when true.
   * @param {number} ease Eased progress 0..1.
   * @returns {number}
   */
  static computeArcTravelRadians(dir, phy, arcSpanDegrees, reverse, ease)
  {
    const eps = 1 / 96;
    let easeLo;
    let easeHi;

    if (ease <= eps)
    {
      easeLo = ease;
      easeHi = Math.min(ease + (eps * 2), 1);
    }
    // otherwise when ease >= 1 - eps, use this branch.
    else if (ease >= 1 - eps)
    {
      easeHi = ease;
      easeLo = Math.max(ease - (eps * 2), 0);
    }
    else
    {
      easeLo = ease - eps;
      easeHi = ease + eps;
    }

    const pLo = JuiceWeaponSwingMotionEffect.computeArcPose(dir, phy, arcSpanDegrees, reverse, easeLo);
    const pHi = JuiceWeaponSwingMotionEffect.computeArcPose(dir, phy, arcSpanDegrees, reverse, easeHi);
    const vx = pHi.x - pLo.x;
    const vy = pHi.y - pLo.y;
    const magSq = (vx * vx) + (vy * vy);

    if (magSq < 1e-12)
    {
      const pose = JuiceWeaponSwingMotionEffect.computeArcPose(dir, phy, arcSpanDegrees, reverse, ease);
      const spanHours = arcSpanDegrees / 30;
      const dhDease = reverse === true ? spanHours : -spanHours;
      const dThetaDease = (Math.PI / 6) * dhDease;
      const orbit = phy * 0.38;
      const vx2 = -orbit * Math.sin(pose.theta) * dThetaDease;
      const vy2 = orbit * Math.cos(pose.theta) * dThetaDease;

      return Math.atan2(vy2, vx2);
    }

    return Math.atan2(vy, vx);
  }

  /**
   * Full overlay rotation from travel radians plus IconSet diagonal rest bias (arc-reverse path).
   * @param {number} travelRadians Direction of motion along the orbit (radians).
   * @returns {number}
   */
  static bladeRotationFromTravelRadians(travelRadians)
  {
    return JuiceWeaponSwingMotionEffect.IconDiagonalRestRadians + travelRadians;
  }

  /**
   * Strike-phase ease for bash: 0 during wind-up, then smoothstep so contact snaps instead of floating.
   * @param {number} ease Outer eased progress 0..1 (swing tick).
   * @returns {number}
   */
  static #bashStrikeEase(ease)
  {
    const strikeStart = 0.18;
    let strikePhase = 0;

    if (ease > strikeStart)
    {
      strikePhase = (ease - strikeStart) / (1 - strikeStart);
    }

    return strikePhase * strikePhase * (3 - (2 * strikePhase));
  }

  /**
   * Bash preset offset: wind back, then drive forward through contact (club / pistol-whip shared read).
   * Lateral hook is tied to strike phase only so the path reads like a hit, not a full orbit.
   * Rotation uses {@link bashWhipRotationRadians} + thrust alignment (no velocity-spin).
   * @param {number} dir RMMZ 8-dir.
   * @param {number} phy Character pattern height.
   * @param {number} ease Eased progress 0..1 (matches swing tick).
   * @returns {{ x: number, y: number }}
   */
  static computeBashOffset(dir, phy, ease)
  {
    const forward = JuiceWeaponSwingMotionEffect.#forwardUnit(dir);
    const perp =
    {
      x: -forward.y,
      y: forward.x,
    };

    const windT = Math.min(1, ease / 0.32);
    const windBack = phy * 0.14 * (1 - windT) * (1 - windT);
    const strikeEase = JuiceWeaponSwingMotionEffect.#bashStrikeEase(ease);
    const fwdStrike = phy * 0.56 * strikeEase;
    const fwdScalar = -windBack + fwdStrike;

    const hookScalar = phy * 0.045 * Math.sin(Math.PI * strikeEase);
    const x = (forward.x * fwdScalar) + (perp.x * hookScalar);
    const y = (forward.y * fwdScalar) + (perp.y * hookScalar);

    return { x, y };
  }

  /**
   * Wrist snap during the strike phase only — lighter total twist so profile icons do not barrel-roll.
   * @param {number} ease Eased progress 0..1.
   * @returns {number}
   */
  static bashWhipRotationRadians(ease)
  {
    const strikeEase = JuiceWeaponSwingMotionEffect.#bashStrikeEase(ease);

    return Math.sin(Math.PI * strikeEase) * 0.22;
  }

  /**
   * Recoil preset offset: shot kick — pulls back along facing and climbs slightly (ease 0 = max kick).
   * Rotation delta is added on top of {@link IconDiagonalRestRadians}.
   * @param {number} dir RMMZ 8-dir.
   * @param {number} phy Character pattern height.
   * @param {number} ease Eased progress 0..1 (matches swing tick).
   * @returns {{ x: number, y: number, rotationDelta: number }}
   */
  static computeRecoilPose(dir, phy, ease)
  {
    const kick = 1 - ease;
    const forward = JuiceWeaponSwingMotionEffect.#forwardUnit(dir);
    const backDist = phy * 0.22 * kick;
    const x = -forward.x * backDist;
    const y = (-forward.y * backDist) - (phy * 0.06 * kick);
    const rotationDelta = -kick * 0.28;

    return { x, y, rotationDelta };
  }

  /**
   * Blade rotation for normal arc: polar tangent from orbit θ plus diagonal icon rest
   * (what the sheet was authored against).
   * @param {number} theta Orbit angle from {@link hourToTheta}.
   * @returns {number}
   */
  static bladeRotationArcForward(theta)
  {
    return JuiceWeaponSwingMotionEffect.IconDiagonalRestRadians + theta + (Math.PI / 2);
  }

  /**
   * Angle from Pixi +x to sword-tip direction inside this IconSet tile when {@link Sprite#rotation} === 0.
   * Vanilla sword slices sit corner-to-corner toward screen upper-left (−3π/4). Wrong prior guess assumed tip-at-west,
   * which made τ + π equal 0 for pure-west thrust — sprite stayed unturned while sliding sideways (“sorta stab”).
   * World tip angle = rotation + {@link StabIconTipAngleRadians} must equal thrust τ from {@link #forwardUnit}.
   * @readonly
   */
  static StabIconTipAngleRadians = (-Math.PI * 3) / 4;

  /**
   * Default bore axis for bash / recoil when `<juiceStabTipDegrees>` is omitted (tag overrides).
   * Matches typical IconSet firearms: barrel reads toward −x in the cell.
   * @readonly
   */
  static BashRecoilIconTipAngleRadians = Math.PI;

  /**
   * Full weapon rotation for stab-forward: sprite rotates so tip aims along thrust τ = atan2(fy, fx).
   * Pure alignment — rotation = τ − tipAngle only (no swing twist); stab tracks facing exactly.
   * tipAngle defaults to {@link StabIconTipAngleRadians} or skill tag degrees.
   * @param {number} dir RMMZ 8-dir (same as strike snapshot).
   * @param {number} tipAngleRadians Angle from Pixi +x to tip when rotation === 0 (radians).
   * @returns {number}
   */
  static stabBladeRotationRadians(dir, tipAngleRadians)
  {
    // an untagged weapon leaves the tip angle undefined, which Number.isFinite already answers
    // false for - as it does for null - so this one check covers absence and nonsense alike.
    const tip = Number.isFinite(tipAngleRadians)
      ? tipAngleRadians
      : JuiceWeaponSwingMotionEffect.StabIconTipAngleRadians;

    const forward = JuiceWeaponSwingMotionEffect.#forwardUnit(dir);
    const thrustAngle = Math.atan2(forward.y, forward.x);

    return thrustAngle - tip;
  }

  /**
   * Thrust alignment with optional profile-gun rule: mirror X instead of ~π rotation
   * (avoids upside-down profile art on east/west).
   * North/south still use ±90° rotation; side-view art cannot match top-down aim without new sprites or tip tweaks.
   * @param {number} dir RMMZ 8-dir.
   * @param {number} tipRadians Resolved bore angle from +x at rotation 0.
   * @param {boolean} profileGun Skill tagged `<juiceProfileGun>`.
   * @returns {{ rotation: number, mirrorX: boolean }}
   */
  static weaponTipAlign(dir, tipRadians, profileGun)
  {
    const forward = JuiceWeaponSwingMotionEffect.#forwardUnit(dir);
    const thrustAngle = Math.atan2(forward.y, forward.x);
    let rotation = thrustAngle - tipRadians;

    if (profileGun === false)
    {
      return { rotation, mirrorX: false };
    }

    // keep looping while rotation > Math.PI.
    while (rotation > Math.PI)
    {
      rotation -= Math.PI * 2;
    }
    while (rotation <= -Math.PI)
    {
      rotation += Math.PI * 2;
    }

    let mirrorX = false;
    const nearPi = 0.15;

    if (Math.abs(Math.abs(rotation) - Math.PI) < nearPi)
    {
      rotation = 0;
      mirrorX = true;
    }

    return { rotation, mirrorX };
  }

  /**
   * Preset motion keys for the weapon overlay.
   * @readonly
   */
  static MotionTypes = {
    Arc: 'arc',
    ArcOscillate: 'arc-oscillate',
    ArcReverse: 'arc-reverse',
    Bash: 'bash',
    Present: 'present',
    Recoil: 'recoil',
    Spin: 'spin',
    SpinReverse: 'spin-reverse',
    StabForward: 'stab-forward',
  };

  /**
   * Default IconSet cell rest: 45° CW so blade reads toward 12 o'clock before arc deltas (spec).
   * @readonly
   */
  static IconDiagonalRestRadians = Math.PI / 4;

  /**
   * @param {Sprite_Character} parentSprite The character sprite that owns the overlay.
   * @param {Sprite} overlay The IconSet slice child sprite.
   * @param {number} baseRotation Starting rotation of the overlay (radians).
   * @param {number} peakRotationRadians Peak extra rotation applied during the swing.
   * @param {number} durationFrames Duration of the swing in frames.
   * @param {string} motionType Preset key (kebab-case).
   * @param {number} arcSpanDegrees Arc span for arc presets (ignored for spin/stab).
   * @param {number} swingDirection RMMZ 8-dir locked at strike time.
   * Matches {@link JABS_Action#direction} when juice hooks pass it through.
   * @param {number} stabTipAngleRadians Resolved radians from +x to tip/bore at rotation 0 (stab / bash / recoil).
   * @param {number} neutralBaseX Hand-neutral overlay X when spawn pose includes preset offset (bash / recoil).
   * @param {number} neutralBaseY Hand-neutral overlay Y (same).
   * @param {number} repeatCount Times to repeat the motion within duration (clamped 1–8).
   * @param {boolean} profileGun Skill `<juiceProfileGun>` — mirror for E/W aim instead of π rotation.
   */
  constructor(
    parentSprite,
    overlay,
    baseRotation,
    peakRotationRadians,
    durationFrames,
    motionType,
    arcSpanDegrees,
    swingDirection,
    stabTipAngleRadians,
    neutralBaseX,
    neutralBaseY,
    repeatCount,
    profileGun
  )
  {
    super();
    this._parentSprite = parentSprite;
    this._overlay = overlay;
    // store  base rotation on the instance for later reads.
    this._baseRotation = baseRotation;
    this._peakRotationRadians = peakRotationRadians;
    this._durationFrames = durationFrames;
    // store  motion type on the instance for later reads.
    this._motionType = motionType;
    this._frame = 0;
    this._arcSpanDegrees = arcSpanDegrees >= 30 && arcSpanDegrees <= 300
      ? arcSpanDegrees
      : 120;

    /**
     * Facing used for orbit / stab / spin geometry for this swing only (not live {@link Game_Character#direction}).
     * @type {number}
     */
    this._swingDirection = swingDirection;

    /**
     * Stab tip axis (radians); ignored except stab-forward.
     * @type {number}
     */
    // an omitted argument arrives as undefined, which Number.isFinite already answers false for -
    // as it does for null - so this one check covers absence and nonsense alike.
    this._stabTipAngleRadians = Number.isFinite(stabTipAngleRadians)
      ? stabTipAngleRadians
      : JuiceWeaponSwingMotionEffect.StabIconTipAngleRadians;

    // remember hand-neutral placement so bash / recoil can offset spawn pose without drifting the ease track.
    // both axes must be real numbers; half a placement is not a placement.
    if (Number.isFinite(neutralBaseX) && Number.isFinite(neutralBaseY))
    {
      this._baseX = neutralBaseX;
      this._baseY = neutralBaseY;
    }
    else
    {
      this._baseX = overlay.x;
      this._baseY = overlay.y;
    }

    /** @type {{ sprite: Sprite, ttl: number }[]} */
    this._trail = [];

    /**
     * Times to repeat the motion within the duration window (all motion types).
     * @type {number}
     */
    this._repeatCount = JuiceWeaponSwingMotionEffect.#clampRepeatCount(repeatCount);

    /**
     * Profile gun: horizontal mirror replaces full 180° rotation for side-view IconSet art.
     * @type {boolean}
     */
    this._profileGun = profileGun === true;

    /**
     * Unsigned overlay scale magnitude from spawn (flip sign when mirroring).
     * @type {number}
     */
    this._scaleMag = Math.abs(overlay.scale.x);
  }

  /**
   * Applies thrust-aligned rotation plus extras; updates mirror scale when {@link #_profileGun}.
   * @param {number} dir Facing direction.
   * @param {number} extraRotationRadians Added on top of aligned thrust (whip, recoil kick, etc.).
   */
  #applyTipAlignedRotation(dir, extraRotationRadians)
  {
    const align = JuiceWeaponSwingMotionEffect.weaponTipAlign(
      dir,
      this.stabTipAngleRadians(),
      this.profileGun()
    );

    // continue the routine with the next policy step.
    this.overlay().rotation = align.rotation + extraRotationRadians;

    if (this.profileGun() === true)
    {
      this.overlay().scale.x = this.scaleMag() * (align.mirrorX ? -1 : 1);
      this.overlay().scale.y = this.scaleMag();
    }
  }

  /**
   * Returns false when the parent character sprite's Pixi transform has been nulled out.
   *
   * Pixi sets {@code transform = null} when a sprite is destroyed; it does NOT reliably set
   * a {@code destroyed} boolean in all RMMZ-bundled versions, so checking transform directly
   * is the safe guard. The overlay is a child of the parent; a null transform on the parent
   * means both are gone and ticking either would immediately throw.
   * @returns {boolean}
   */
  isSpriteAlive()
  {
    return !!this.parentSprite().transform;
  }

  /**
   * Advances one frame of the swing arc.
   * @returns {boolean} True while the effect should stay in the runner queue.
   */
  tick()
  {
    this.setFrame(this.frame() + 1);

    const t = Math.min(this.frame() / this.durationFrames(), 1);

    const ease = 1 - Math.pow(1 - t, 3);

    const phy = this.parentSprite().patternHeight();
    const dir = this.swingDirection();

    switch (this.motionType())
    {
      case JuiceWeaponSwingMotionEffect.MotionTypes.ArcReverse:
        this.#tickArc(phy, dir, ease, true);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.ArcOscillate:
        this.#tickArcOscillate(phy, dir, t);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.Spin:
        this.#tickSpin(phy, t, this.repeatCount(), 1);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.SpinReverse:
        this.#tickSpin(phy, t, this.repeatCount(), -1);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.StabForward:
        this.#tickStabForward(phy, dir, ease);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.Present:
        this.#tickPresent(phy, ease);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.Bash:
        this.#tickBash(phy, dir, ease);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.Recoil:
        this.#tickRecoil(phy, dir, ease);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.Arc:
      default:
        this.#tickArc(phy, dir, ease, false);
        break;
    }

    this.#tickTrail();

    if (this.frame() >= this.durationFrames())
    {
      this.parentSprite().removeChild(this.overlay());
      this.overlay().destroy();

      this.trail().forEach(trail =>
      {
        this.parentSprite().removeChild(trail.sprite);
        trail.sprite.destroy();
      });
      this.trail().length = 0;
      return false;
    }

    return true;
  }

  /**
   * Clock-orbit arc preset (arc-table.md); arc = CCW on clock, arc-reverse = CW.
   * @param {number} phy Pattern height.
   * @param {number} dir Facing direction.
   * @param {number} ease Eased progress (0..1).
   * @param {boolean} reverse Arc-reverse when true.
   */
  #tickArc(phy, dir, ease, reverse)
  {
    const pose = JuiceWeaponSwingMotionEffect.computeArcPose(
      dir,
      phy,
      // continue the routine with the next policy step.
      this.arcSpanDegrees(),
      reverse,
      ease
    // continue the routine with the next policy step.
    );

    // continue the routine with the next policy step.
    this.overlay().x = pose.x;
    this.overlay().y = pose.y;

    if (reverse === true)
    {
      const travel = JuiceWeaponSwingMotionEffect.computeArcTravelRadians(
        dir,
        phy,
        this.arcSpanDegrees(),
        true,
        ease
      );
      this.overlay().rotation = JuiceWeaponSwingMotionEffect.bladeRotationFromTravelRadians(travel);
      return;
    }

    // continue the routine with the next policy step.
    this.overlay().rotation = JuiceWeaponSwingMotionEffect.bladeRotationArcForward(pose.theta);
  }

  /**
   * Alternating arc sweeps: arc → arc-reverse → arc … for `_repeatCount` total passes.
   * Each pass occupies an equal slice of the total duration; direction flips each slice.
   * @param {number} phy Pattern height.
   * @param {number} dir Facing direction.
   * @param {number} t Linear progress (0..1).
   */
  #tickArcOscillate(phy, dir, t)
  {
    const sliceT = (t * this.repeatCount()) % 1;
    const sliceIndex = Math.floor(t * this.repeatCount());
    const reverse = (sliceIndex % 2) === 1;
    const ease = 1 - Math.pow(1 - sliceT, 3);
    this.#tickArc(phy, dir, ease, reverse);
  }

  /**
   * Ticks a spin flourish around the battler center.
   * @param {number} phy Pattern height for scale.
   * @param {number} t Linear progress (0..1).
   * @param {number} spinCount Number of full rotations.
   * @param {number} spinDirectionSign +1 default (CCW in Pixi); −1 for {@link MotionTypes.SpinReverse}.
   */
  #tickSpin(phy, t, spinCount, spinDirectionSign)
  {
    const sign = spinDirectionSign === -1 ? -1 : 1;
    const radians = (Math.PI * 2) * spinCount * t * sign;
    this.overlay().rotation = this.baseRotation() + radians;

    const centerX = 0;
    const centerY = -(phy * 0.5);

    const forward = JuiceWeaponSwingMotionEffect.#forwardUnit(this.swingDirection());
    const front = phy * 0.12;
    const frontX = forward.x * front;
    const frontY = forward.y * front;

    const phaseOffset = -(Math.PI / 6);
    const theta = radians + phaseOffset;

    const orbit = phy * 0.38;
    const juiceDy = J.ABS.EXT.JUICE.Metadata.spriteJuiceVerticalOffsetPixels;
    this.overlay().x = centerX + frontX + Math.cos(theta) * orbit;
    this.overlay().y = centerY + frontY + Math.sin(theta) * orbit + juiceDy;

    if (this.frame() % 2 === 0)
    {
      this.#spawnTrailAfterimage();
    }
  }

  /**
   * Spawns one afterimage based on the current overlay state.
   */
  #spawnTrailAfterimage()
  {
    const ghost = new Sprite();
    ghost.bitmap = this.overlay().bitmap;
    ghost.anchor.x = this.overlay().anchor.x;
    // continue the routine with the next policy step.
    ghost.anchor.y = this.overlay().anchor.y;
    ghost.scale.x = this.overlay().scale.x;
    ghost.scale.y = this.overlay().scale.y;
    ghost.opacity = 140;
    ghost.blendMode = 1;

    // continue the routine with the next policy step.
    ghost.setFrame(
      this.overlay()._frame.x,
      this.overlay()._frame.y,
      this.overlay()._frame.width,
      this.overlay()._frame.height
    );

    // continue the routine with the next policy step.
    ghost.x = this.overlay().x;
    ghost.y = this.overlay().y;
    ghost.rotation = this.overlay().rotation;

    // continue the routine with the next policy step.
    this.parentSprite().addChild(ghost);
    this.trail().push({ sprite: ghost, ttl: 10 });
  }

  /**
   * Ticks and fades all existing trail afterimages.
   */
  #tickTrail()
  {
    if (this.trail().length === 0)
    {
      return;
    }

    const survivors = [];
    this.trail().forEach(trail =>
    {
      trail.ttl -= 1;
      trail.sprite.opacity = Math.max(0, Math.round((trail.ttl / 10) * 140));
      if (trail.ttl > 0)
      {
        survivors.push(trail);
        return;
      }

      // continue the routine with the next policy step.
      this.parentSprite().removeChild(trail.sprite);
      trail.sprite.destroy();
    });

    // store  trail on the instance for later reads.
    this.setTrail(survivors);
  }

  /**
   * Ticks a forward stab (mostly translation, minimal rotation).
   * @param {number} phy Pattern height for scale.
   * @param {number} dir Facing direction.
   * @param {number} ease Eased progress (0..1).
   */
  #tickStabForward(phy, dir, ease)
  {
    this.#applyTipAlignedRotation(dir, 0);

    const forward = JuiceWeaponSwingMotionEffect.#forwardUnit(dir);
    const dist = phy * 0.55;
    const dx = forward.x * dist;
    const dy = forward.y * dist;

    // continue the routine with the next policy step.
    this.overlay().x = this.baseX() + (dx * ease);
    this.overlay().y = this.baseY() + (dy * ease);
  }

  /**
   * Lifts the icon straight upward on screen (facing-agnostic “present this item”).
   * @param {number} phy Character pattern height.
   * @param {number} ease Eased progress 0..1.
   */
  #tickPresent(phy, ease)
  {
    const lift = phy * 0.42;

    // continue the routine with the next policy step.
    this.overlay().x = this.baseX();
    this.overlay().y = this.baseY() - (lift * ease);
    this.overlay().rotation = this.baseRotation();
  }

  /**
   * Ticks bash smack — thrust-aligned weapon plus a single wrist hump (no velocity-spin rotation).
   * @param {number} phy Pattern height.
   * @param {number} dir Facing direction.
   * @param {number} ease Eased progress 0..1.
   */
  #tickBash(phy, dir, ease)
  {
    const off = JuiceWeaponSwingMotionEffect.computeBashOffset(dir, phy, ease);
    const whip = JuiceWeaponSwingMotionEffect.bashWhipRotationRadians(ease);

    // continue the routine with the next policy step.
    this.overlay().x = this.baseX() + off.x;
    this.overlay().y = this.baseY() + off.y;
    this.#applyTipAlignedRotation(dir, whip);
  }

  /**
   * Ticks firearm-style recoil (pull back + settle).
   * @param {number} phy Pattern height.
   * @param {number} dir Facing direction.
   * @param {number} ease Eased progress 0..1.
   */
  #tickRecoil(phy, dir, ease)
  {
    const p = JuiceWeaponSwingMotionEffect.computeRecoilPose(dir, phy, ease);

    // continue the routine with the next policy step.
    this.overlay().x = this.baseX() + p.x;
    this.overlay().y = this.baseY() + p.y;
    this.#applyTipAlignedRotation(dir, p.rotationDelta);
  }
}
export default JuiceWeaponSwingMotionEffect;
//endregion JuiceWeaponSwingMotionEffect