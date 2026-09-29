//region DifficultyBuilder
import DifficultyMetadata from './DifficultyMetadata.js';
import DifficultyLayer from './DifficultyLayer.js';

/**
 * The fluent-builder for easily creating new difficulties.
 */
class DifficultyBuilder
{
  #name = String.empty;
  #key = String.empty;
  #description = String.empty;
  #iconIndex = 0;
  #cost = 0;

  #actorStateId = 0;
  #enemyStateId = 0;
  #affixEffects = null;

  #enabled = false;
  #unlocked = true;
  #hidden = false;

  /**
   * Constructor.
   * @param {string} name The name of this difficulty.
   * @param {string} key The unique key of this difficulty.
   */
  constructor(name, key)
  {
    this.setName(name);
    this.setKey(key);
  }

  /**
   * Builds the difficulty with its current configuration.
   * @returns {DifficultyMetadata}
   */
  build()
  {
    // start the difficulty here.
    const difficulty = new DifficultyMetadata();

    // assign the core data.
    difficulty.name = this.#name;
    difficulty.key = this.#key;
    difficulty.description = this.#description;
    difficulty.iconIndex = this.#iconIndex;
    difficulty.cost = this.#cost;

    // assign the effects.
    difficulty.actorStateId = this.#actorStateId;
    difficulty.enemyStateId = this.#enemyStateId;
    difficulty.affixEffects = this.#affixEffects;

    // assign the access booleans.
    difficulty.enabled = this.#enabled;
    difficulty.unlocked = this.#unlocked;
    difficulty.hidden = this.#hidden;

    // return the built product.
    return difficulty;
  }

  /**
   * Builds the difficulty as a layer rather than as metadata, for layers that exist only at runtime.
   * @returns {DifficultyLayer}
   */
  buildAsLayer()
  {
    // start the difficulty here.
    const difficulty = new DifficultyLayer(this.#key);

    // assign the core data.
    difficulty.name = this.#name;
    difficulty.description = this.#description;
    difficulty.iconIndex = this.#iconIndex;
    difficulty.cost = this.#cost;

    // assign the effects.
    difficulty.actorStateId = this.#actorStateId;
    difficulty.enemyStateId = this.#enemyStateId;
    difficulty.affixEffects = this.#affixEffects;

    // assign the access booleans.
    difficulty.enabled = this.#enabled;
    difficulty.unlocked = this.#unlocked;
    difficulty.hidden = this.#hidden;

    // return the built product.
    return difficulty;
  }

  /**
   * Sets the name of the difficulty being built.
   * @param {string} name The display name.
   * @returns {DifficultyBuilder}
   */
  setName(name)
  {
    this.#name = name;
    return this;
  }

  /**
   * Sets the key of the difficulty being built.
   * @param {string} key The unique key.
   * @returns {DifficultyBuilder}
   */
  setKey(key)
  {
    this.#key = key;
    return this;
  }

  /**
   * Sets the description of the difficulty being built.
   * @param {string} description The help text.
   * @returns {DifficultyBuilder}
   */
  setDescription(description)
  {
    this.#description = description;
    return this;
  }

  /**
   * Sets the icon of the difficulty being built.
   * @param {number} iconIndex The icon index.
   * @returns {DifficultyBuilder}
   */
  setIconIndex(iconIndex)
  {
    this.#iconIndex = iconIndex;
    return this;
  }

  /**
   * Sets the cost of the difficulty being built.
   * @param {number} cost The layer points it costs to enable.
   * @returns {DifficultyBuilder}
   */
  setCost(cost)
  {
    this.#cost = cost;
    return this;
  }

  /**
   * Sets the state every actor carries while the difficulty is in force.
   * @param {number} actorStateId The state id, or 0 for none.
   * @returns {DifficultyBuilder}
   */
  setActorStateId(actorStateId)
  {
    this.#actorStateId = actorStateId;
    return this;
  }

  /**
   * Sets the state every enemy carries while the difficulty is in force.
   * @param {number} enemyStateId The state id, or 0 for none.
   * @returns {DifficultyBuilder}
   */
  setEnemyStateId(enemyStateId)
  {
    this.#enemyStateId = enemyStateId;
    return this;
  }

  /**
   * Sets the affix biasing the difficulty applies while in force.
   * @param {AffixEffects|null} affixEffects The parsed effects, or null for none.
   * @returns {DifficultyBuilder}
   */
  setAffixEffects(affixEffects)
  {
    this.#affixEffects = affixEffects;
    return this;
  }

  /**
   * Sets whether the difficulty starts unlocked.
   * @param {boolean} unlocked Whether the player may toggle it.
   * @returns {DifficultyBuilder}
   */
  setUnlocked(unlocked)
  {
    this.#unlocked = unlocked;
    return this;
  }

  /**
   * Sets whether the difficulty starts enabled.
   * @param {boolean} enabled Whether it applies from the start.
   * @returns {DifficultyBuilder}
   */
  setEnabled(enabled)
  {
    this.#enabled = enabled;
    return this;
  }

  /**
   * Sets whether the difficulty starts hidden from the list.
   * @param {boolean} hidden Whether the list leaves it out.
   * @returns {DifficultyBuilder}
   */
  setHidden(hidden)
  {
    this.#hidden = hidden;
    return this;
  }
}

export default DifficultyBuilder;
//endregion DifficultyBuilder