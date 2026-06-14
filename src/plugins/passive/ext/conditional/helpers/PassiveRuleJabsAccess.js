//region PassiveRuleJabsAccess
/**
 * Resolves {@link JABS_Battler} context and proximity helpers for passive rule evaluation.<br/>
 * Ally and enemy checks use JABS battlers — not {@link $gameParty} — so map AI context stays authoritative.
 */
class PassiveRuleJabsAccess
{
  /**
   * Looks up the map-side {@link JABS_Battler} wrapper for a {@link Game_Battler}.<br/>
   * Returns null when the battler is not registered with ABS (menu-only actors, etc.).
   * @param {Game_Battler} battler The battler whose uuid we resolve on the map.
   * @returns {JABS_Battler|null} The live JABS wrapper, or null when off-map / unregistered.
   */
  static getJabsBattler(battler)
  {
    if (!battler || !battler.getUuid) return null;

    // map-side battlers resolve through the ABS ai manager uuid table.
    return JABS_AiManager.getBattlerByUuid(battler.getUuid()) ?? null;
  }

  /**
   * Default proximity radius in tiles from plugin metadata.<br/>
   * Used when authors omit an explicit radius on alliesNearby / enemiesNearby rules.
   * @returns {number} Tile radius from {@link default-proximity-tiles} plugin param.
   */
  static defaultProximity()
  {
    return J.PASSIVE.EXT.CONDITIONAL.Metadata.defaultProximityTiles;
  }

  /**
   * Allied battlers within default proximity, excluding self.<br/>
   * Used by {@code alliesNearby} gates and stack counts — self never counts toward the tally.
   * @param {Game_Battler} battler The battler whose neighborhood we measure.
   * @returns {JABS_Battler[]} Allied JABS battlers in range, never including the evaluator.
   */
  static nearbyAlliesExcludingSelf(battler)
  {
    // grab the map wrapper — no wrapper means nobody is nearby on the abs map.
    const jabsBattler = this.getJabsBattler(battler);

    if (!jabsBattler) return [];

    // pull the shared default radius from plugin metadata.
    const proximity = this.defaultProximity();

    // query allied battlers in range, then strip self from the tally.
    return JABS_AiManager.getAlliedBattlersWithinRange(jabsBattler, proximity)
      .filter(ally => ally.getUuid() !== jabsBattler.getUuid());
  }

  /**
   * Opposing battlers within proximity of this battler.<br/>
   * Used by {@code enemiesNearby} gate rules and auto-execute trigger gates.
   * @param {Game_Battler} battler The battler whose neighborhood we measure.
   * @param {number|null} proximityTiles Optional tile radius; defaults to plugin param.
   * @returns {JABS_Battler[]} Opposing JABS battlers within the requested tile radius.
   */
  static nearbyEnemies(battler, proximityTiles = null)
  {
    // grab the map wrapper — no wrapper means no enemies to count.
    const jabsBattler = this.getJabsBattler(battler);

    if (!jabsBattler) return [];

    // use the tag override when provided; otherwise fall back to plugin default radius.
    const proximity = proximityTiles ?? this.defaultProximity();

    // query every opposing battler JABS considers in range of this evaluator.
    return JABS_AiManager.getOpposingBattlersWithinRange(jabsBattler, proximity);
  }

  /**
   * Allied battlers for {@code allAllies*} threshold checks (includes self when on the map).<br/>
   * Every member of the returned set must satisfy the same threshold for the gate to pass.
   * @param {Game_Battler} battler The battler whose party context we collect.
   * @returns {Game_Battler[]} Allied battlers plus self when map context exists.
   */
  static allAlliedBattlersIncludingSelf(battler)
  {
    const jabsBattler = this.getJabsBattler(battler);

    // off-map or non-abs contexts still evaluate against self only.
    if (!jabsBattler) return [ battler ];

    // collect every allied battler JABS knows about and unwrap to Game_Battler.
    const allies = JABS_AiManager.getAlliedBattlers(jabsBattler)
      .map(ally => ally.getBattler())
      .filter(allyBattler => !!allyBattler);

    // ensure the evaluating battler is always in the set for allAllies* rules.
    if (allies.includes(battler) === false)
    {
      allies.push(battler);
    }

    return allies;
  }

  /**
   * Allied JABS battlers within an explicit tile radius, excluding self.<br/>
   * Used by scoped resource threshold gates ({@code anyAlly}, {@code allAllies} scope).
   * @param {Game_Battler} battler The evaluating battler.
   * @param {number} range Tile radius.
   * @returns {JABS_Battler[]} Allied JABS battlers in range, never including the evaluator.
   */
  static alliedBattlersWithinRange(battler, range)
  {
    const jabsBattler = this.getJabsBattler(battler);

    if (!jabsBattler) return [];

    return JABS_AiManager.getAlliedBattlersWithinRange(jabsBattler, range)
      .filter(ally => ally.getUuid() !== jabsBattler.getUuid());
  }

  /**
   * Opposing JABS battlers within an explicit tile radius.<br/>
   * Used by scoped resource threshold gates ({@code anyEnemy}, {@code allEnemies} scope).
   * @param {Game_Battler} battler The evaluating battler.
   * @param {number} range Tile radius.
   * @returns {JABS_Battler[]} Opposing JABS battlers within range.
   */
  static opposingBattlersWithinRange(battler, range)
  {
    const jabsBattler = this.getJabsBattler(battler);

    if (!jabsBattler) return [];

    return JABS_AiManager.getOpposingBattlersWithinRange(jabsBattler, range);
  }

  /**
   * Maps author-facing slot names to {@link JABS_Button} keys.<br/>
   * Accepts shorthand like {@code mainhand} / {@code skill1} as well as raw button keys.
   * @param {string|number} slotParam Author tag value for a skill slot.
   * @returns {string} Resolved {@link JABS_Button} key for cooldown queries.
   */
  static resolveSlotKey(slotParam)
  {
    const normalized = String(slotParam).toLowerCase();

    switch (normalized)
    {
      case 'main':
      case 'mainhand':
        return JABS_Button.Mainhand;
      case 'offhand':
        return JABS_Button.Offhand;
      case 'tool':
        return JABS_Button.Tool;
      case 'dodge':
        return JABS_Button.Dodge;
      case 'combatskill1':
      case 'skill1':
        return JABS_Button.CombatSkill1;
      case 'combatskill2':
      case 'skill2':
        return JABS_Button.CombatSkill2;
      case 'combatskill3':
      case 'skill3':
        return JABS_Button.CombatSkill3;
      case 'combatskill4':
      case 'skill4':
        return JABS_Button.CombatSkill4;
      default:
        // allow authors to pass raw JABS_Button keys through unchanged.
        return String(slotParam);
    }
  }
}

export default PassiveRuleJabsAccess;
//endregion PassiveRuleJabsAccess