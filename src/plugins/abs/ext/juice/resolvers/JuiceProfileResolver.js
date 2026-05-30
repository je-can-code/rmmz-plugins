//region JuiceProfileResolver
import JuiceWeaponSwingMotionEffect from './../models/JuiceWeaponSwingMotionEffect.js';
import JuiceStyleMultiplierRow from './JuiceStyleMultiplierRow.js';
/**
 * Resolves weapon / armor icon indices and swing style keys for juice profiles.
 */
class JuiceProfileResolver
{
  /**
   * Resolves the selected preset motion for this skill (defaults to arc).
   * Normalizes legacy keys (swing-top-down / swing-bottom-up; spin-360 / spin-720 / spin-360-reverse).
   * @param {JABS_Action} action The executing action.
   * @returns {string}
   */
  static resolveJuiceMotion(action)
  {
    const skill = action.getBaseSkill();
    const motion = skill.jabsJuiceMotion;
    if (motion === String.empty)
    {
      return JuiceProfileResolver.MotionArcKey;
    }

    // when motion  equals  'swing-top-down', take this branch.
    if (motion === 'swing-top-down')
    {
      return JuiceProfileResolver.MotionArcKey;
    }

    // when motion  equals  'swing-bottom-up', take this branch.
    if (motion === 'swing-bottom-up')
    {
      return JuiceProfileResolver.MotionArcReverseKey;
    }

    // when motion  equals  'spin-360', take this branch.
    if (motion === 'spin-360')
    {
      return JuiceWeaponSwingMotionEffect.MotionTypes.Spin;
    }

    // when motion  equals  'spin-720', take this branch.
    if (motion === 'spin-720')
    {
      return JuiceWeaponSwingMotionEffect.MotionTypes.Spin;
    }

    // when motion  equals  'spin-360-reverse', take this branch.
    if (motion === 'spin-360-reverse')
    {
      return JuiceWeaponSwingMotionEffect.MotionTypes.SpinReverse;
    }

    // hand back motion to the caller.
    return motion;
  }

  /**
   * Full rotations for spin / spin-reverse (1–8). Tag overrides legacy `spin-720` (=2 when tag omitted).
   * @param {JABS_Action} action The executing action.
   * @returns {number}
   */
  static resolveJuiceSpinCount(action)
  {
    const skill = action.getBaseSkill();
    const tagged = skill.jabsJuiceSpinCount;

    // when tagged >= 1  and  tagged <= 8, take this branch.
    if (tagged >= 1 && tagged <= 8)
    {
      return Math.floor(tagged);
    }

    // capture motion for downstream policy in this routine.
    const motion = skill.jabsJuiceMotion;

    // when motion  equals  'spin-720', take this branch.
    if (motion === 'spin-720')
    {
      return 2;
    }

    // hand back 1 to the caller.
    return 1;
  }

  /**
   * Default motion key for arc preset (kebab-case).
   * @readonly
   */
  static MotionArcKey = 'arc';

  /**
   * Default motion key for reversed arc preset (kebab-case).
   * @readonly
   */
  static MotionArcReverseKey = 'arc-reverse';

  /**
   * Resolves arc span in degrees for arc / arc-reverse (default 120).
   * @param {JABS_Action} action The executing action.
   * @returns {number}
   */
  static resolveJuiceArcSpanDegrees(action)
  {
    const skill = action.getBaseSkill();
    const n = skill.jabsJuiceArcSpanDegrees;
    if (n >= 30 && n <= 300)
    {
      return n;
    }

    // hand back 120 to the caller.
    return 120;
  }

  /**
   * True when skill notes request profile-gun overlay alignment (horizontal mirror vs full flip).
   * @param {JABS_Action} action The executing action.
   * @returns {boolean}
   */
  static resolveJuiceProfileGun(action)
  {
    return action.getBaseSkill().jabsJuiceProfileGun === true;
  }

  /**
   * Resolves IconSet “barrel / tip from +x at rotation 0” in radians from `<juiceStabTipDegrees>`.
   * Omitted: stab-forward uses {@link JuiceWeaponSwingMotionEffect.StabIconTipAngleRadians} (sword read);
   * bash / recoil default to {@link JuiceWeaponSwingMotionEffect.BashRecoilIconTipAngleRadians} (barrel −x in cell).
   * @param {JABS_Action} action The executing action.
   * @param {string} motionKey Resolved {@link #resolveJuiceMotion} key (kebab-case).
   * @returns {number}
   */
  static resolveJuiceWeaponTipRadians(action, motionKey)
  {
    const skill = action.getBaseSkill();
    const deg = skill.jabsJuiceStabTipDegrees;
    if (deg !== null && deg !== undefined && Number.isFinite(deg))
    {
      return (deg * Math.PI) / 180;
    }

    // when motionKey  equals  JuiceWeaponSwingMotionEffect.MotionTypes.StabForward, take this branch.
    if (motionKey === JuiceWeaponSwingMotionEffect.MotionTypes.StabForward
      || motionKey === JuiceWeaponSwingMotionEffect.MotionTypes.Present)
    {
      return JuiceWeaponSwingMotionEffect.StabIconTipAngleRadians;
    }

    // hand back JuiceWeaponSwingMotionEffect.BashRecoilIconTipAngleRa... to the caller.
    return JuiceWeaponSwingMotionEffect.BashRecoilIconTipAngleRadians;
  }

  /**
   * Equipped weapon or armor row used for icon + multiplier inference.
   * Offhand + exactly one weapon: orb/shield armor unless the executing offhand skill currently
   * belongs to the mainhand's provided offhand path; armor pick prefers rows tagged for this
   * skill id, then {@link Game_Actor#equips} slot 1 when it is armor.
   * @param {JABS_Battler} caster The caster.
   * @param {JABS_Action} action The strike action.
   * @returns {{ kind: 'weapon', item: RPG_Weapon } | { kind: 'armor', item: RPG_Armor } | null}
   */
  static #equippedGearForJuiceInference(caster, action)
  {
    const gb = caster.getBattler();

    // when gb.isActor()  equals  false, take this branch.
    if (gb.isActor() === false)
    {
      return null;
    }

    // capture weapons for downstream policy in this routine.
    const weapons = gb.weapons();

    // when weapons.length  equals  0, take this branch.
    if (weapons.length === 0)
    {
      return null;
    }

    // capture slot key for downstream policy in this routine.
    const slotKey = action.getCooldownType();

    // when slotKey  equals  JABS_Button.Offhand  and  weapons.length > 1  and  w..., take this branch.
    if (slotKey === JABS_Button.Offhand && weapons.length > 1 && weapons[1])
    {
      return { kind: 'weapon', item: weapons[1] };
    }

    // when slotKey  equals  JABS_Button.Offhand  and  weapons.length  equals  1, take this branch.
    if (slotKey === JABS_Button.Offhand && weapons.length === 1)
    {
      const executingId = action.getBaseSkill().id;
      const [ w0 ] = weapons;

      // if the current offhand action comes from the mainhand's provided offhand path
      // (including any temporary state transform on that path), then the weapon owns the juice.
      if (gb.isMainhandProvidedOffhandSkill(executingId) === true)
      {
        return { kind: 'weapon', item: w0 };
      }

      // capture orb armor for downstream policy in this routine.
      const orbArmor = JuiceProfileResolver.#armorRowForOffhandSingleWeapon(gb, executingId);

      // when orbArmor, take this branch.
      if (orbArmor)
      {
        return { kind: 'armor', item: orbArmor };
      }

      // hand back { kind: 'weapon', item: w0 } to the caller.
      return { kind: 'weapon', item: w0 };
    }

    // hand back { kind: 'weapon', item: weapons[0] } to the caller.
    return { kind: 'weapon', item: weapons[0] };
  }

  /**
   * Picks the armor row that should drive orb/offhand-shield juice when only one weapon is equipped.
   * Body armor often sits earlier in {@link Game_Actor#armors} than the shield slot — match tags first, then slot 1.
   * @param {Game_Actor} gb The actor (callers ensure actor-only).
   * @param {number} executingId Skill id executing right now.
   * @returns {RPG_Armor|null}
   */
  static #armorRowForOffhandSingleWeapon(gb, executingId)
  {
    const armors = gb.armors();

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < armors.length; i++)
    {
      const row = armors[i];

      // when row.jabsOffhandSkillId > 0  and  row.jabsOffhandSkillId  equals  exec..., take this branch.
      if (row.jabsOffhandSkillId > 0 && row.jabsOffhandSkillId === executingId)
      {
        return row;
      }

      // when row.jabsSkillId > 0  and  row.jabsSkillId  equals  executingId, take this branch.
      if (row.jabsSkillId > 0 && row.jabsSkillId === executingId)
      {
        return row;
      }
    }

    // capture equips for downstream policy in this routine.
    const equips = gb.equips();
    const [ , slot1 ] = equips;

    // when slot1  and  DataManager.isArmor(slot1), take this branch.
    if (slot1 && DataManager.isArmor(slot1))
    {
      return slot1;
    }

    // when armors.length > 0  and  armors[0], take this branch.
    if (armors.length > 0 && armors[0])
    {
      return armors[0];
    }

    // hand back null to the caller.
    return null;
  }

  /**
   * Resolves the weapon icon index for swing overlay (-1 when unavailable).
   * Priority: `<jabsJuiceIcon:N>` tag → equipped gear ({@link #equippedGearForJuiceInference}).
   * Skill database `iconIndex` is not consulted here (tag or equip only).
   * @param {JABS_Battler} caster The caster.
   * @param {JABS_Action} action The executing action.
   * @returns {number}
   */
  static resolveWeaponIconIndex(caster, action)
  {
    const skill = action.getBaseSkill();
    const tagged = skill.jabsJuiceIconIndex;
    if (tagged >= 0)
    {
      return tagged;
    }

    // capture gear for downstream policy in this routine.
    const gear = JuiceProfileResolver.#equippedGearForJuiceInference(caster, action);
    if (!gear)
    {
      return -1;
    }

    // hand back gear.item.iconIndex to the caller.
    return gear.item.iconIndex;
  }

  /**
   * Resolves a weapon style bucket key for multiplier lookup (defaults to 'default').
   * Uses the same gear row as {@link #resolveWeaponIconIndex} when inferring (weapon: `wtypeId` string;
   * armor-inferred: `a` + armor type id so rows do not collide with weapon keys).
   * @param {JABS_Battler} caster The caster.
   * @param {JABS_Action} action The executing action.
   * @returns {string}
   */
  static resolveWeaponStyleKey(caster, action)
  {
    const skill = action.getBaseSkill();
    const noteStyle = skill.jabsJuiceWeaponStyle;
    if (noteStyle !== String.empty)
    {
      return noteStyle;
    }

    // capture gear for downstream policy in this routine.
    const gear = JuiceProfileResolver.#equippedGearForJuiceInference(caster, action);
    if (!gear)
    {
      return 'default';
    }

    // when gear.kind  equals  'weapon', take this branch.
    if (gear.kind === 'weapon')
    {
      return String(gear.item.wtypeId);
    }

    // hand back `a${gear.item.atypeId}` to the caller.
    return `a${gear.item.atypeId}`;
  }

  /**
   * Looks up swing / tilt multipliers for the resolved style key.
   * @param {string} styleKey The style bucket.
   * @returns {{ tiltMul: number, swingMul: number }}
   */
  static resolveStyleMultipliers(styleKey)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const table = md.weaponStyleMultipliers;
    const raw = table[styleKey] || table.default;
    if (!raw)
    {
      return new JuiceStyleMultiplierRow(1, 1);
    }

    // hand back new JuiceStyleMultiplierRow(raw.tiltMul, raw.swingMul) to the caller.
    return new JuiceStyleMultiplierRow(raw.tiltMul, raw.swingMul);
  }
}
export default JuiceProfileResolver;
//endregion JuiceProfileResolver