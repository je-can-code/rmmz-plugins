//region JABS_FoodChainResolver
import JABS_FoodChainPlan from './JABS_FoodChainPlan.js';

/**
 * A stateless utility class that owns all eat-event decision logic for the
 * J-ABS-FOOD extension. Methods here operate on game state but hold no state
 * themselves; every call reads from $gameParty, $jabsEngine, and the database.
 *
 * Call {@link JABS_FoodChainResolver.resolveEat} when a food item is consumed
 * via the R2 slot. All other public methods expose individual phases of that
 * decision tree for reuse (e.g. from the HUD or chain-type query).
 */
class JABS_FoodChainResolver
{
  /**
   * Strips all currently active food-chain states from all living party members.
   * Uses {@code battler.removeState(id)} (forced removal) so that applyStateOnExpire
   * does NOT fire — we are intentionally clearing the chain, not advancing it.
   * @param {Game_Actor[]} members The party members to strip states from.
   */
  static stripFoodChainStates(members)
  {
    members.forEach(member =>
    {
      // collect state ids that carry a foodChain tag on this member.
      const foodStateIds = member.states()
        .filter(state => state.jabsFoodChainType !== null)
        .map(state => state.id);

      // forced-remove each food state without advancing the expire chain.
      foodStateIds.forEach(id => member.removeState(id));
    });
  }

  /**
   * Returns the first active food-chain type found on the given battler, or null.
   * The type is a string like 'protein', 'overstuffed', etc. from the database tag.
   * @param {Game_Actor} battler The battler to inspect for active food chain states.
   * @returns {string|null} The chain type string, or null if no food chain is active.
   */
  static getActiveFoodChainType(battler)
  {
    // walk the battler's current states looking for a food-chain tag.
    const foodState = battler.states()
      .find(state => state.jabsFoodChainType !== null);

    // no food chain state found — the battler is clean.
    if (!foodState) return null;

    return foodState.jabsFoodChainType;
  }

  /**
   * Derives the current chain phase for a battler relative to a given plan.
   * Returns 'wellFed', 'peak', 'tail', 'overstuffed', or null when no plan
   * or no matching active state is found.
   * @param {Game_Actor} battler The battler to inspect.
   * @param {JABS_FoodChainPlan} plan The plan to check phases against.
   * @returns {'wellFed'|'peak'|'tail'|'overstuffed'|null} The current phase label.
   */
  static getPhase(battler, plan)
  {
    // without a plan there is nothing to phase-check against.
    if (!plan || plan.isEmpty()) return null;

    // check each segment of the plan against the battler's active states.
    for (const segment of plan.segments)
    {
      // skip segments not currently active on this battler.
      if (!battler.isStateAffected(segment.stateId)) continue;

      // determine position within the plan to assign a phase label.
      const index = plan.indexOfState(segment.stateId);

      // any overstuffed chain state gets its own distinct phase label.
      if (segment.chainType === J.ABS.EXT.FOOD.ChainType.Overstuffed) return 'overstuffed';

      return plan.phaseAtIndex(index);
    }

    // no active segment from this plan was found on the battler.
    return null;
  }

  /**
   * Returns true when the leader's notes contain the overstuffedImpervious tag,
   * granting Field Medic immunity to the Overstuffed chain on re-feed.
   * @returns {boolean} True if the leader has Field Medic mastery, false otherwise.
   */
  static leaderHasOverstuffedImpervious()
  {
    const leader = $gameParty.leader();

    // no leader means no immunity.
    if (!leader) return false;

    // check all note sources (passives, equips, states, class, actor) for the tag.
    const notes = leader.getAllNotes();

    return RPGManager.checkForBooleanFromAllNotesByRegex(notes, J.ABS.EXT.FOOD.RegExp.OverstuffedImpervious);
  }

  /**
   * Executes the full eat event for a food item consumed via the R2 food slot.
   *
   * Decision tree:
   *   - Always: heal/MP/TP/cure effects applied to all party members (skip code 21).
   *   - Resolve the food group type from the item's {@code <food:TYPE>} tag.
   *   - Look up the pre-built chain plan from the registry.
   *   - Determine the leader's current chain phase.
   *   - No active chain → apply Well Fed entry state, store plan.
   *   - Tail phase → strip all chains, apply new Well Fed, store plan.
   *   - Field Medic immune → strip all chains, apply new Well Fed, store plan.
   *   - Otherwise (well-fed or peak, no immunity) → strip all, apply Overstuffed.
   *
   * @param {number} itemId The database id of the food item consumed.
   * @param {JABS_Battler} jabsBattler The JABS battler eating the item (the map leader).
   */
  static resolveEat(itemId, jabsBattler)
  {
    const item = $dataItems[itemId];

    // a missing database entry means the item id was invalid.
    if (!item) return;

    // resolve the food group type from the item's tag.
    const foodType = item.jabsFoodType;

    // item must carry a food type tag to proceed.
    if (!foodType) return;

    // look up the pre-built chain plan from the boot-time registry.
    const newPlan = JABS_FoodChainPlan.forChainType(foodType);

    // no registered chain for this type — data is incomplete, abort silently.
    if (!newPlan) return;

    const leader = $gameParty.leader();
    const members = $gameParty.battleMembers();

    // apply buffet-style non-state effects to all party members.
    JABS_FoodChainResolver.#applyFoodBuffetEffects(item, members, jabsBattler);

    // the entry state id is always the first segment of the registered plan.
    const entryStateId = newPlan.getEntry().stateId;

    // read the leader's current food chain type before stripping anything.
    const currentChainType = JABS_FoodChainResolver.getActiveFoodChainType(leader);

    // determine the leader's active plan so we can derive the phase.
    const leaderUuid = jabsBattler.getUuid();
    const existingPlan = $jabsEngine.getFoodChainPlanByUuid(leaderUuid);

    // derive the current phase using the existing plan if one is available.
    const currentPhase = existingPlan
      ? JABS_FoodChainResolver.getPhase(leader, existingPlan)
      : null;

    // apply the appropriate chain transition based on phase and immunity.
    if (currentChainType === null)
    {
      // no active chain — simply start the new food arc.
      JABS_FoodChainResolver.#startFoodChain(leader, entryStateId, leaderUuid, newPlan);
    }
    else if (currentPhase === 'tail')
    {
      // tail phase always rescues into the new arc, regardless of immunity.
      JABS_FoodChainResolver.#stripAndStartFoodChain(members, leader, entryStateId, leaderUuid, newPlan);
    }
    else if (JABS_FoodChainResolver.leaderHasOverstuffedImpervious())
    {
      // Field Medic immunity — re-feed snaps to the new arc without Overstuffed penalty.
      JABS_FoodChainResolver.#stripAndStartFoodChain(members, leader, entryStateId, leaderUuid, newPlan);
    }
    else
    {
      // eating mid-arc without immunity — trigger the Overstuffed punishment chain.
      JABS_FoodChainResolver.#triggerOverstuffed(members, leader, leaderUuid);
    }
  }

  /**
   * Applies all food item effects to all party members, explicitly skipping
   * effect code 21 (Add State) so that chain states are handled separately.
   *
   * This provides the buffet-style healing experience: everyone gets the HP/MP/TP
   * regen and cure effects, but food chain states only land on the leader.
   * @param {RPG_Item} item The food item data.
   * @param {Game_Actor[]} members All battle members to apply effects to.
   * @param {JABS_Battler} jabsBattler The consuming JABS battler (for animation).
   */
  static #applyFoodBuffetEffects(item, members, jabsBattler)
  {
    members.forEach(member =>
    {
      // build a fresh action for this member as the subject.
      const gameAction = new Game_Action(member, false);
      gameAction.setItem(item.id);

      // manually apply each non-state effect to avoid adding chain states party-wide.
      item.effects.forEach(effect =>
      {
        // skip the Add State effect — the chain resolver handles state application.
        if (effect.code === Game_Action.EFFECT_ADD_STATE) return;

        // apply this effect (heal, MP, TP, cure, etc.) to the member.
        gameAction.applyItemEffect(member, effect);
      });
    });

    // fire common events and global logic once for the eat action.
    const leaderAction = new Game_Action($gameParty.leader(), false);
    leaderAction.setItem(item.id);
    leaderAction.applyGlobal();

    // play the item's animation on the map character.
    jabsBattler.showAnimation(item.animationId);
  }

  /**
   * Applies the Well Fed entry state to the leader and registers the given plan
   * on the engine. Use when no chain was active (clean start).
   * @param {Game_Actor} leader The party leader actor.
   * @param {number} entryStateId The Well Fed state id to apply.
   * @param {string} leaderUuid The UUID of the leader's JABS battler.
   * @param {JABS_FoodChainPlan} plan The pre-built registry plan for this food group.
   */
  static #startFoodChain(leader, entryStateId, leaderUuid, plan)
  {
    // apply the entry (Well Fed) state directly to the leader.
    leader.addState(entryStateId);

    // store the pre-built registry plan so the HUD can read it immediately.
    $jabsEngine.setFoodChainPlanByUuid(leaderUuid, plan);
  }

  /**
   * Strips all food chain states from all members, then starts the new chain
   * on the leader. Use for tail rescue and Field Medic re-feed.
   * @param {Game_Actor[]} members All party members to strip food states from.
   * @param {Game_Actor} leader The party leader actor.
   * @param {number} entryStateId The new Well Fed state id to apply.
   * @param {string} leaderUuid The UUID of the leader's JABS battler.
   * @param {JABS_FoodChainPlan} plan The pre-built registry plan for this food group.
   */
  static #stripAndStartFoodChain(members, leader, entryStateId, leaderUuid, plan)
  {
    // clear all food chain states across the party first.
    JABS_FoodChainResolver.stripFoodChainStates(members);

    // then begin the new chain cleanly.
    JABS_FoodChainResolver.#startFoodChain(leader, entryStateId, leaderUuid, plan);
  }

  /**
   * Strips all food chain states and applies the Overstuffed entry state to the leader.
   * The Overstuffed plan is looked up from the registry by its chain type constant.
   * This is the punishment path for eating mid-arc without Field Medic immunity.
   * @param {Game_Actor[]} members All party members to strip food states from.
   * @param {Game_Actor} leader The party leader actor.
   * @param {string} leaderUuid The UUID of the leader's JABS battler.
   */
  static #triggerOverstuffed(members, leader, leaderUuid)
  {
    // clear all food chain states across the party.
    JABS_FoodChainResolver.stripFoodChainStates(members);

    // look up the overstuffed chain from the boot-time registry.
    const overstuffedPlan = JABS_FoodChainPlan.forChainType(J.ABS.EXT.FOOD.ChainType.Overstuffed);

    // if the overstuffed chain hasn't been authored in the database yet, abort.
    if (!overstuffedPlan) return;

    // apply the Overstuffed entry state to the leader and store the plan.
    const entryStateId = overstuffedPlan.getEntry().stateId;
    JABS_FoodChainResolver.#startFoodChain(leader, entryStateId, leaderUuid, overstuffedPlan);
  }
}

export default JABS_FoodChainResolver;
//endregion JABS_FoodChainResolver