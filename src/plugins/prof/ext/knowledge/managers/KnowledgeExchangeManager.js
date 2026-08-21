//region KnowledgeExchangeManager
/**
 * A static manager for converting banked knowledge into things from the database.
 *
 * The arithmetic and the transaction live here rather than in the plugin command that triggers them,
 * because a command is not a testable place to keep a rule. The command does nothing but call this and
 * report what came back.
 *
 * Nothing here narrates. No sound, no message, no fanfare- the event that calls the command owns all of
 * that, so a game's voice stays in its own events rather than being baked into a plugin.
 */
class KnowledgeExchangeManager
{
  /**
   * Constructor.<br/>
   * This is a static class; it should not be instantiated.
   */
  constructor()
  {
    throw new Error('The KnowledgeExchangeManager is a static class.');
  }

  /**
   * Converts as much of a tag's banked knowledge as the named exchange will take.
   *
   * Every whole unit the balance can afford is bought at once. Whatever is left over is smaller than the
   * price of a unit and stays banked toward the next one, which is why no remainder needs recording
   * anywhere- the balance is the remainder.
   * @param {string} exchangeKey The key of the exchange being performed.
   * @returns {{ units: number, granted: number, exchange: KnowledgeExchange }}
   */
  static exchange(exchangeKey)
  {
    const exchange = J.PROF.EXT.KNOWLEDGE.Metadata.exchangeByKey(exchangeKey);

    const points = $gameParty.knowledgePoints(exchange.tagKey);
    const units = exchange.unitsAvailable(points);

    // a balance too small to buy anything is not a failure, it is simply a quiet visit.
    if (units === 0)
    {
      return {
        units: 0,
        granted: 0,
        exchange,
      };
    }

    const price = exchange.priceOf(units);
    const granted = exchange.yieldOf(units);
    const output = exchange.resolveOutput();

    $gameParty.loseKnowledgePoints(exchange.tagKey, price);
    $gameParty.gainItem(output, granted);

    return {
      units,
      granted,
      exchange,
    };
  }

  /**
   * Records the outcome of an exchange where the event that asked for it can read it.
   *
   * An event branches its dialogue on this- whether the visit was worth anything, and how much- which is
   * how the plugin manages to hand out a reward without owning a single word of what gets said about it.
   *
   * An id of zero means the event did not ask for that output, and an output nobody asked for is left
   * entirely alone rather than being cleared. Writing to variable zero would quietly stomp on whatever
   * the game keeps there.
   * @param {{ units: number, granted: number, exchange: KnowledgeExchange }} result The exchange outcome.
   * @param {number} resultVariableId The variable to write the number granted into, or zero for none.
   * @param {number} resultSwitchId The switch to record whether anything was granted, or zero for none.
   */
  static report(result, resultVariableId, resultSwitchId)
  {
    const { granted } = result;

    if (resultVariableId > 0)
    {
      $gameVariables.setValue(resultVariableId, granted);
    }

    if (resultSwitchId > 0)
    {
      const grantedAnything = granted > 0;

      $gameSwitches.setValue(resultSwitchId, grantedAnything);
    }
  }
}

export default KnowledgeExchangeManager;
//endregion KnowledgeExchangeManager