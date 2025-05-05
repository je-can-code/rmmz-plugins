//region OmniFulfillment
/**
 * A class representing the data shape of the fulfillment requirements for a single objective on a quest.
 */
class OmniFulfillmentData
{
  /**
   * The fulfillment details for objectives that cannot be categorized by any one of the other objective types.
   * @type {IndiscriminateData}
   */
  indiscriminate = null;

  /**
   * The fulfillment details for objectives that require the player to reach a certain destination.
   * @type {DestinationData}
   */
  destination = null;

  /**
   * The fulfillment details for fetch-based objectives.
   * @type {FetchData}
   */
  fetch = null;

  /**
   * The fulfillment details for enemy-slaying-based objectives.
   * @type {SlayData}
   */
  slay = null;

  /**
   * The fulfillment details for quest-completion-based objectives.
   * @type {QuestData}
   */
  quest = null;

  /**
   * @constructor
   * @param {IndiscriminateData=} indiscriminate The indiscriminate data; defaults to null.
   * @param {DestinationData=} destination The destination data; defaults to null.
   * @param {FetchData=} fetch The fetch data; defaults to null.
   * @param {SlayData=} slay The slay data; defaults to null.
   * @param {QuestData=} quest The quest data; defaults to null.
   */
  constructor(indiscriminate = null, destination = null, fetch = null, slay = null, quest = null)
  {
    this.indiscriminate = indiscriminate ?? new IndiscriminateData();
    this.destination = destination ?? new DestinationData(-1, -1, -1, -1, -1);
    this.fetch = fetch ?? new FetchData(OmniObjectiveFetchType.Unset, 0, 0);
    this.slay = slay ?? new SlayData(0, 0);
    this.quest = quest ?? new QuestData([]);
  }
}

//endregion OmniFulfillment