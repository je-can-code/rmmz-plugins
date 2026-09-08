//region MasteryPayloadLocator
/**
 * Finds the database row a mastery actually delivers.
 *
 * Most masteries do not carry their numbers themselves. They carry a tag naming a second row - a ward
 * state, an aura skill, a venom - and that row holds the values a player cares about. Prose describing
 * the mastery therefore has to follow one hop before it can quote anything, and this locator is that
 * hop, kept apart from the resolver so the list of delivery tags has one home.
 */
class MasteryPayloadLocator
{
  /**
   * The tags that name a state as their payload, paired with the argument holding its id.
   * @type {[ string, number ][]}
   */
  static StateDeliveryTags = [
    [ 'autoApplyState', 0 ],
    [ 'autoApplyStateOnNearby', 0 ],
    [ 'onCritApply', 0 ],
    [ 'passiveStateCount', 0 ],
    [ 'autoInflictState', 0 ],
    [ 'removeStateOnMove', 0 ],
  ];

  /**
   * The tags that name a skill as their payload, paired with the argument holding its id.
   * @type {[ string, number ][]}
   */
  static SkillDeliveryTags = [
    [ 'autoExecuteSkill', 0 ],
    [ 'retaliate', 0 ],
    [ 'shieldBreak', 0 ],
  ];

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The row this mastery delivers, or the mastery's own state when it delivers nothing.
   *
   * Falling back to the state rather than to null is deliberate: a mastery that holds its own numbers
   * is the same shape to a caller as one that delegates them, so the caller never branches on which.
   * @param {RPG_State} state The mastery state.
   * @param {RPG_Skill} skill The wrapper skill, which carries some delivery tags itself.
   * @returns {RPG_State|RPG_Skill}
   */
  static locate(state, skill)
  {
    const fromState = MasteryPayloadLocator.#firstDelivery(state);
    if (fromState !== null) return MasteryPayloadLocator.#throughEffects(fromState);

    const fromSkill = MasteryPayloadLocator.#firstDelivery(skill);
    if (fromSkill !== null) return MasteryPayloadLocator.#throughEffects(fromSkill);

    return state;
  }

  /**
   * Follows a delivery skill to the state it exists to apply.
   *
   * An aura skill is frequently a vehicle rather than a payload: it deals no damage and its whole job
   * is the add-state effect it carries, which is where the numbers a player cares about actually live.
   * A skill that does something itself is left alone.
   * @param {RPG_State|RPG_Skill} payload The row the delivery tags named.
   * @returns {RPG_State|RPG_Skill}
   */
  /**
   * The row the delivery tags named, before following it through to what it applies.
   *
   * An aura's reach lives on the skill that projects it while its numbers live on the state it
   * applies, so a caller asking about distance wants this and a caller asking about magnitude wants
   * {@link #locate}.
   * @param {RPG_State} state The mastery state.
   * @param {RPG_Skill} skill The wrapper skill.
   * @returns {RPG_State|RPG_Skill}
   */
  static locateVehicle(state, skill)
  {
    const fromState = MasteryPayloadLocator.#firstDelivery(state);
    if (fromState !== null) return fromState;

    const fromSkill = MasteryPayloadLocator.#firstDelivery(skill);
    if (fromSkill !== null) return fromSkill;

    return state;
  }

  static #throughEffects(payload)
  {
    if (payload.isSkill() === false) return payload;
    if (!payload.effects) return payload;

    // a skill with a formula of its own is the payload; only an inert vehicle is followed through.
    const dealsDamage = payload.damage && payload.damage.formula && payload.damage.formula !== '0';

    if (dealsDamage) return payload;

    const addState = payload.effects.find(effect => effect.code === 21);

    if (addState === undefined) return payload;

    const applied = $dataStates[addState.dataId];

    if (!applied) return payload;

    return applied;
  }

  /**
   * The first payload named by any delivery tag on the given row.
   * @param {RPG_Base} dataRow The row whose notes are searched.
   * @returns {RPG_State|RPG_Skill|null}
   */
  static #firstDelivery(dataRow)
  {
    // a tag naming a row that was since deleted describes nothing, and answering the missing row
    // would hand every caller an undefined to trip over.
    const stateId = MasteryPayloadLocator.#firstIdFrom(dataRow, MasteryPayloadLocator.StateDeliveryTags);
    if (stateId > 0 && $dataStates[stateId]) return $dataStates[stateId];

    const skillId = MasteryPayloadLocator.#firstIdFrom(dataRow, MasteryPayloadLocator.SkillDeliveryTags);
    if (skillId > 0 && $dataSkills[skillId]) return $dataSkills[skillId];

    return null;
  }

  /**
   * The id named by the first of the given tags present on the row.
   * @param {RPG_Base} dataRow The row whose notes are searched.
   * @param {[ string, number ][]} deliveryTags The tags to try, in order.
   * @returns {number} Zero when none of them are present.
   */
  static #firstIdFrom(dataRow, deliveryTags)
  {
    for (const [ tagName, argumentIndex ] of deliveryTags)
    {
      const pattern = new RegExp(`<${tagName}:[ ]?\\[([^\\]]*)]>`, 'i');
      const match = dataRow.note.match(pattern);

      if (!match) continue;

      const args = match[1].split(',')
        .map(arg => arg.trim());
      const parsed = Number(args[argumentIndex]);

      if (Number.isNaN(parsed)) continue;

      return parsed;
    }

    return 0;
  }
}

export default MasteryPayloadLocator;
//endregion MasteryPayloadLocator