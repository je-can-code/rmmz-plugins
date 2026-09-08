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
   * The type is a string like 'protein', 'vegetable', etc. from the database tag.
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
   * Returns 'wellFed', 'peak', 'tail', or null when no plan or no matching
   * active state is found.
   * @param {Game_Actor} battler The battler to inspect.
   * @param {JABS_FoodChainPlan} plan The plan to check phases against.
   * @returns {'wellFed'|'peak'|'tail'|null} The current phase label.
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

      return plan.phaseAtIndex(index);
    }

    // no active segment from this plan was found on the battler.
    return null;
  }

  /**
   * Returns true when the given battler's notes contain the foodChainImpervious tag.
   *
   * An impervious battler still executes a chain-ending skill and still receives everything it
   * does- they simply keep the arc they were in. This is the capstone form of food mastery: the
   * meal stops being the ammunition and becomes a standing condition.
   * @param {Game_Actor} battler The battler to inspect for immunity.
   * @returns {boolean} True if the battler keeps their chain through an ending skill.
   */
  static hasFoodChainImpervious(battler)
  {
    // no battler means no immunity.
    if (!battler) return false;

    // check all note sources (passives, equips, states, class, actor) for the tag.
    const notes = battler.getAllNotes();

    return RPGManager.checkForBooleanFromAllNotesByRegex(notes, J.ABS.EXT.FOOD.RegExp.FoodChainImpervious);
  }

  /**
   * Ends the given battler's active food chain, as demanded by a skill tagged
   * {@code <endFoodChain>}.
   *
   * This is the other half of metabolizing: the skill delivers whatever it delivers through the
   * ordinary action pipeline, and this clears the arc that paid for it. Imperviousness is checked
   * here rather than at the call site so that every future path into chain-ending inherits it.
   * @param {Game_Actor} battler The battler whose chain should end.
   */
  static resolveEndFoodChain(battler)
  {
    // nothing to end without a battler to end it on.
    if (!battler) return;

    // an impervious battler burns the fuel but never spends the meal.
    if (JABS_FoodChainResolver.hasFoodChainImpervious(battler)) return;

    // strip the arc from this battler only- a chain is the leader's, not the party's.
    JABS_FoodChainResolver.stripFoodChainStates([ battler ]);
  }

  /**
   * Executes the full eat event for a food item consumed via the R2 food slot.
   *
   * Decision tree:
   *   - Always: heal/MP/TP/cure effects applied to all party members (skip code 21).
   *   - Resolve the food group type from the item's {@code <food:TYPE>} tag.
   *   - Look up the pre-built chain plan from the registry.
   *   - No active chain → apply Well Fed entry state, store plan.
   *   - Any active chain → strip all chains, apply new Well Fed, store plan.
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

    // no registered chain for this type. the item declared a food group that the boot-time walk
    // never registered, which is an authoring mismatch rather than a state the game reaches
    // normally- and it presents as food that is consumed and does nothing at all, so it has to
    // say something or there is nothing to find it by.
    if (!newPlan)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `no food chain is registered for type: [ ${foodType} ].`, () => ({
        itemId,
        itemName: item.name,
        registeredTypes: JABS_FoodChainPlan.registeredChainTypes(),
      }));
      return;
    }

    const leader = $gameParty.leader();
    const members = $gameParty.battleMembers();

    // apply buffet-style non-state effects to all party members.
    JABS_FoodChainResolver.#applyFoodBuffetEffects(item, members, jabsBattler);

    // the entry state id is always the first segment of the registered plan.
    const entryStateId = newPlan.getEntry().stateId;

    // read the leader's current food chain type before stripping anything.
    const currentChainType = JABS_FoodChainResolver.getActiveFoodChainType(leader);

    // the uuid keys the plan registry the HUD reads from.
    const leaderUuid = jabsBattler.getUuid();

    // apply the appropriate chain transition based on whether an arc is already running.
    if (currentChainType === null)
    {
      // no active chain — simply start the new food arc.
      JABS_FoodChainResolver.#startFoodChain(leader, entryStateId, leaderUuid, newPlan);
    }
    else
    {
      // a chain is already running, so the new meal replaces it outright. eating is not the
      // button while an arc is live- that input metabolizes instead- so reaching here at all
      // means something other than the player's own R2 press fed them, and punishing an
      // unreachable path would only ever fire on the paths nobody chose.
      JABS_FoodChainResolver.#stripAndStartFoodChain(members, leader, entryStateId, leaderUuid, newPlan);
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
    // apply the entry (Well Fed) state directly to the leader, naming the leader as its own
    // source. the second argument is not decoration- it is what routes the application through
    // JABS rather than vanilla, and everything a food chain is made of lives on the JABS side:
    // the frame-based <stateDuration>, and the on-expire link that walks Well Fed to its
    // follow-ups. applied without it, the entry state lands as an inert vanilla state that never
    // expires and therefore never advances the arc.
    leader.addState(entryStateId, leader);

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

}

export default JABS_FoodChainResolver;
//endregion JABS_FoodChainResolver