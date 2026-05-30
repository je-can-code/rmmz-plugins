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
  /**
   * Clamps spin preset rotation count (full turns) for spin / spin-reverse.
   * @param {number} spinCount Candidate count from skill notes or resolver.
   * @returns {number}
   */
  static #clampSpinCount(spinCount)
  {
    if (spinCount === undefined || spinCount === null || Number.isFinite(spinCount) === false)
    {
      return 1;
    }

    const k = Math.floor(spinCount);

    if (k < 1)
    {
      return 1;
    }

    if (k > 8)
    {
      return 8;
    }

    return k;
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
    const tip = tipAngleRadians !== undefined && tipAngleRadians !== null && Number.isFinite(tipAngleRadians)
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
   * @param {number} spinCount Full rotations for spin / spin-reverse (clamped 1–8; ignored for other presets).
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
    spinCount,
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
    this._stabTipAngleRadians = stabTipAngleRadians !== undefined && stabTipAngleRadians !== null
      && Number.isFinite(stabTipAngleRadians)
      ? stabTipAngleRadians
      : JuiceWeaponSwingMotionEffect.StabIconTipAngleRadians;

    // remember hand-neutral placement so bash / recoil can offset spawn pose without drifting the ease track.
    if (neutralBaseX !== undefined && neutralBaseX !== null && Number.isFinite(neutralBaseX)
      && neutralBaseY !== undefined && neutralBaseY !== null && Number.isFinite(neutralBaseY))
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
     * Full rotations for spin / spin-reverse ({@link MotionTypes.Spin}, {@link MotionTypes.SpinReverse}).
     * @type {number}
     */
    this._spinCount = JuiceWeaponSwingMotionEffect.#clampSpinCount(spinCount);

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
      this._stabTipAngleRadians,
      this._profileGun
    );

    // continue the routine with the next policy step.
    this._overlay.rotation = align.rotation + extraRotationRadians;

    if (this._profileGun === true)
    {
      this._overlay.scale.x = this._scaleMag * (align.mirrorX ? -1 : 1);
      this._overlay.scale.y = this._scaleMag;
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
    return !!this._parentSprite.transform;
  }

  /**
   * Advances one frame of the swing arc.
   * @returns {boolean} True while the effect should stay in the runner queue.
   */
  tick()
  {
    this._frame++;

    const t = Math.min(this._frame / this._durationFrames, 1);

    const ease = 1 - Math.pow(1 - t, 3);

    const phy = this._parentSprite.patternHeight();
    const dir = this._swingDirection;

    switch (this._motionType)
    {
      case JuiceWeaponSwingMotionEffect.MotionTypes.ArcReverse:
        this.#tickArc(phy, dir, ease, true);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.Spin:
        this.#tickSpin(phy, t, this._spinCount, 1);
        break;
      case JuiceWeaponSwingMotionEffect.MotionTypes.SpinReverse:
        this.#tickSpin(phy, t, this._spinCount, -1);
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

    if (this._frame >= this._durationFrames)
    {
      this._parentSprite.removeChild(this._overlay);
      this._overlay.destroy();

      this._trail.forEach(trail =>
      {
        this._parentSprite.removeChild(trail.sprite);
        trail.sprite.destroy();
      });
      this._trail.length = 0;
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
      this._arcSpanDegrees,
      reverse,
      ease
    // continue the routine with the next policy step.
    );

    // continue the routine with the next policy step.
    this._overlay.x = pose.x;
    this._overlay.y = pose.y;

    if (reverse === true)
    {
      const travel = JuiceWeaponSwingMotionEffect.computeArcTravelRadians(
        dir,
        phy,
        this._arcSpanDegrees,
        true,
        ease
      );
      this._overlay.rotation = JuiceWeaponSwingMotionEffect.bladeRotationFromTravelRadians(travel);
      return;
    }

    // continue the routine with the next policy step.
    this._overlay.rotation = JuiceWeaponSwingMotionEffect.bladeRotationArcForward(pose.theta);
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
    this._overlay.rotation = this._baseRotation + radians;

    const centerX = 0;
    const centerY = -(phy * 0.5);

    const forward = JuiceWeaponSwingMotionEffect.#forwardUnit(this._swingDirection);
    const front = phy * 0.12;
    const frontX = forward.x * front;
    const frontY = forward.y * front;

    const phaseOffset = -(Math.PI / 6);
    const theta = radians + phaseOffset;

    const orbit = phy * 0.38;
    const juiceDy = J.ABS.EXT.JUICE.Metadata.spriteJuiceVerticalOffsetPixels;
    this._overlay.x = centerX + frontX + Math.cos(theta) * orbit;
    this._overlay.y = centerY + frontY + Math.sin(theta) * orbit + juiceDy;

    if (this._frame % 2 === 0)
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
    ghost.bitmap = this._overlay.bitmap;
    ghost.anchor.x = this._overlay.anchor.x;
    // continue the routine with the next policy step.
    ghost.anchor.y = this._overlay.anchor.y;
    ghost.scale.x = this._overlay.scale.x;
    ghost.scale.y = this._overlay.scale.y;
    ghost.opacity = 140;
    ghost.blendMode = 1;

    // continue the routine with the next policy step.
    ghost.setFrame(
      this._overlay._frame.x,
      this._overlay._frame.y,
      this._overlay._frame.width,
      this._overlay._frame.height
    );

    // continue the routine with the next policy step.
    ghost.x = this._overlay.x;
    ghost.y = this._overlay.y;
    ghost.rotation = this._overlay.rotation;

    // continue the routine with the next policy step.
    this._parentSprite.addChild(ghost);
    this._trail.push({ sprite: ghost, ttl: 10 });
  }

  /**
   * Ticks and fades all existing trail afterimages.
   */
  #tickTrail()
  {
    if (this._trail.length === 0)
    {
      return;
    }

    const survivors = [];
    this._trail.forEach(trail =>
    {
      trail.ttl -= 1;
      trail.sprite.opacity = Math.max(0, Math.round((trail.ttl / 10) * 140));
      if (trail.ttl > 0)
      {
        survivors.push(trail);
        return;
      }

      // continue the routine with the next policy step.
      this._parentSprite.removeChild(trail.sprite);
      trail.sprite.destroy();
    });

    // store  trail on the instance for later reads.
    this._trail = survivors;
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
    this._overlay.x = this._baseX + (dx * ease);
    this._overlay.y = this._baseY + (dy * ease);
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
    this._overlay.x = this._baseX;
    this._overlay.y = this._baseY - (lift * ease);
    this._overlay.rotation = this._baseRotation;
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
    this._overlay.x = this._baseX + off.x;
    this._overlay.y = this._baseY + off.y;
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
    this._overlay.x = this._baseX + p.x;
    this._overlay.y = this._baseY + p.y;
    this.#applyTipAlignedRotation(dir, p.rotationDelta);
  }
}
export default JuiceWeaponSwingMotionEffect;
//endregion JuiceWeaponSwingMotionEffect