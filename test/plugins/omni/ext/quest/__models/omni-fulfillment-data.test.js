//region plugins/omni/ext/quest/__models/omni-fulfillment-data.test.js
import { describe, expect, it } from 'vitest';

import DestinationData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/DestinationData.js';
import FetchData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/FetchData.js';
import IndiscriminateData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/IndiscriminateData.js';
import QuestData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/QuestData.js';
import SlayData from '../../../../../../src/plugins/omni/ext/quest/__models/fulfillment/SlayData.js';
import OmniFulfillmentData from '../../../../../../src/plugins/omni/ext/quest/__models/OmniFulfillmentData.js';

describe('OmniFulfillmentData (omni ext/quest, direct src import)', () =>
{
  it('defaults every sub-type when no arguments are provided', () =>
  {
    const data = new OmniFulfillmentData();

    expect(data.indiscriminate).toBeInstanceOf(IndiscriminateData);
    expect(data.destination).toBeInstanceOf(DestinationData);
    expect(data.destination).toEqual({ mapId: -1, x1: -1, y1: -1, x2: -1, y2: -1 });
    expect(data.fetch).toBeInstanceOf(FetchData);
    // FetchData has no constructor of its own, so this is just its class fields' own defaults.
    expect(data.fetch).toEqual({ type: -1, id: -1, amount: 0 });
    expect(data.slay).toBeInstanceOf(SlayData);
    // SlayData likewise has no constructor of its own- this is just its class fields' own defaults.
    expect(data.slay).toEqual({ id: -1, amount: 0 });
    expect(data.quest).toBeInstanceOf(QuestData);
    expect(data.quest).toEqual({ keys: [] });
  });

  it('uses the explicitly-provided sub-type instances instead of defaulting', () =>
  {
    const indiscriminate = new IndiscriminateData();
    const destination = new DestinationData();
    const fetch = new FetchData();
    const slay = new SlayData();
    const quest = new QuestData();

    const data = new OmniFulfillmentData(indiscriminate, destination, fetch, slay, quest);

    expect(data.indiscriminate).toBe(indiscriminate);
    expect(data.destination).toBe(destination);
    expect(data.fetch).toBe(fetch);
    expect(data.slay).toBe(slay);
    expect(data.quest).toBe(quest);
  });
});
//endregion plugins/omni/ext/quest/__models/omni-fulfillment-data.test.js
