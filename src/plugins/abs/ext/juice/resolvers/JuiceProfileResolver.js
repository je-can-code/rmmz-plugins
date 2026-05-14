//region JuiceProfileResolver
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

    if (motion === 'swing-top-down')
    {
      return JuiceProfileResolver.MotionArcKey;
    }

    if (motion === 'swing-bottom-up')
    {
      return JuiceProfileResolver.MotionArcReverseKey;
    }

    if (motion === 'spin-360')
    {
      return JuiceWeaponSwingMotionEffect.MotionTypes.Spin;
    }

    if (motion === 'spin-720')
    {
      return JuiceWeaponSwingMotionEffect.MotionTypes.Spin;
    }

    if (motion === 'spin-360-reverse')
    {
      return JuiceWeaponSwingMotionEffect.MotionTypes.SpinReverse;
    }

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

    if (tagged >= 1 && tagged <= 8)
    {
      return Math.floor(tagged);
    }

    const motion = skill.jabsJuiceMotion;

    if (motion === 'spin-720')
    {
      return 2;
    }

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

    if (motionKey === JuiceWeaponSwingMotionEffect.MotionTypes.StabForward
      || motionKey === JuiceWeaponSwingMotionEffect.MotionTypes.Present)
    {
      return JuiceWeaponSwingMotionEffect.StabIconTipAngleRadians;
    }

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

    if (gb.isActor() === false)
    {
      return null;
    }

    const weapons = gb.weapons();

    if (weapons.length === 0)
    {
      return null;
    }

    const slotKey = action.getCooldownType();

    if (slotKey === JABS_Button.Offhand && weapons.length > 1 && weapons[1])
    {
      return { kind: 'weapon', item: weapons[1] };
    }

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

      const orbArmor = JuiceProfileResolver.#armorRowForOffhandSingleWeapon(gb, executingId);

      if (orbArmor)
      {
        return { kind: 'armor', item: orbArmor };
      }

      return { kind: 'weapon', item: w0 };
    }

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

    for (let i = 0; i < armors.length; i++)
    {
      const row = armors[i];

      if (row.jabsOffhandSkillId > 0 && row.jabsOffhandSkillId === executingId)
      {
        return row;
      }

      if (row.jabsSkillId > 0 && row.jabsSkillId === executingId)
      {
        return row;
      }
    }

    const equips = gb.equips();
    const [ , slot1 ] = equips;

    if (slot1 && DataManager.isArmor(slot1))
    {
      return slot1;
    }

    if (armors.length > 0 && armors[0])
    {
      return armors[0];
    }

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

    const gear = JuiceProfileResolver.#equippedGearForJuiceInference(caster, action);
    if (!gear)
    {
      return -1;
    }

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

    const gear = JuiceProfileResolver.#equippedGearForJuiceInference(caster, action);
    if (!gear)
    {
      return 'default';
    }

    if (gear.kind === 'weapon')
    {
      return String(gear.item.wtypeId);
    }

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

    return new JuiceStyleMultiplierRow(raw.tiltMul, raw.swingMul);
  }
}
//endregion JuiceProfileResolver