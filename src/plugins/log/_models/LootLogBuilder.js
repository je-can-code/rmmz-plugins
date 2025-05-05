//region LootLogBuilder
/**
 * A fluent-builder for building loot-related logs for the {@link Window_LootLog}.
 */
class LootLogBuilder
{
  /**
   * The current message that this log contains.
   * @type {string}
   */
  #message = "message-unset";

  /**
   * Builds the log based on the currently provided info.
   * @returns {ActionLog} The built log.
   */
  build()
  {
    // instantiate the log.
    const log = new ActionLog(this.#message);

    // clear this builder of its instance data.
    this.#clear();

    // return the log.
    return log;
  }

  /**
   * Clears the current parameters for this log.<br/>
   * This automatically runs after `build()` is run.
   */
  #clear()
  {
    this.#message = String.empty;
  }

  /**
   * Sets the message of this log.
   * @param {string} message The message to set for this log to display.
   * @returns {this} This builder, for fluent chaining.
   */
  setMessage(message)
  {
    this.#message = message;
    return this;
  }

  /**
   * Sets up a message based on the usage of an item.
   * @param {number} itemId The id of the item we're using the last of.
   * @returns {this} This builder, for fluent chaining.
   */
  setupUsedItem(itemId)
  {
    // construct the message.
    const message = `Used the \\Item[${itemId}].`;

    // assign the message to this log.
    this.setMessage(message);

    // return the builder for continuous building.
    return this;
  }

  /**
   * Sets up a message based on the context of using the last item/tool and unequipping it.
   * @param {number} itemId The id of the item we're using the last of.
   * @returns {this} This builder, for fluent chaining.
   */
  setupUsedLastItem(itemId)
  {
    // construct the message.
    const message = `The last \\Item[${itemId}] was used.`;

    // assign the message to this log.
    this.setMessage(message);

    // return the builder for continuous building.
    return this;
  }

  /**
   * Sets up a message based on the context of the party finding gold.
   * @param {number} goldFound The amount of gold found by the party.
   * @returns {this} This builder, for fluent chaining.
   */
  setupGoldFound(goldFound)
  {
    // wrap the amount in the appropriate color.
    const gold = `\\C[14]${goldFound}\\C[0]`;

    // construct the message.
    const message = `Found \\*${gold}\\* gold.`;

    // assign the message to this log.
    this.setMessage(message);

    // return the builder for continuous building.
    return this;
  }

  /**
   * Sets up a message based on the context of the player picking up loot.
   * @param {"armor"|"weapon"|"item"} lootType One of "armor", "weapon", or "item".
   * @param {number} lootId The id of the loot from the database.
   * @returns {this} This builder, for fluent chaining.
   */
  setupLootObtained(lootType, lootId)
  {
    // translate the loot based on type and id.
    const lootName = this.#translateLoot(lootType, lootId);

    // construct the bold message.
    const message = `\\*${lootName}\\* acquired.`;

    // assign the message to this log.
    this.setMessage(message);

    // return the builder for continuous building.
    return this;
  }

  /**
   * Translates into the proper text code based on loot type and id.
   * @param {"armor"|"weapon"|"item"} lootType One of "armor", "weapon", or "item".
   * @param {number} lootId The id of the loot from the database.
   * @returns {string} The compiled wrapped text code of the loot.
   */
  #translateLoot(lootType, lootId)
  {
    switch (lootType)
    {
      case "armor":
        return `\\Armor[${lootId}] (${$gameParty.numItems($dataArmors.at(lootId))})`;
      case "weapon":
        return `\\Weapon[${lootId}] (${$gameParty.numItems($dataWeapons.at(lootId))})`;
      case "item":
        return `\\Item[${lootId}] (${$gameParty.numItems($dataItems.at(lootId))})`;
      default:
        return String.empty;
    }
  }
}

//endregion LootLogBuilder