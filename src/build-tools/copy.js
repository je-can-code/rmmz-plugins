import Mirror from './mirror.js'
import Logger from "./logger.js";

// start for timings sake.
const start = performance.now();

// grab all the destinations.
let destinations = process.argv.slice(2);

// build it.
const mirror = new Mirror();

// make sure we have destinations to actually assign.
if (destinations.length)
{
  // set all destinations for this mirror.
  mirror.setDestinations(destinations);
}

// use the default source setting to copy from.

// mirror the files!
await mirror.mirrorToAllDestinations();

const durationSeconds = ((performance.now() - start) / 1000).toFixed(3);
Logger.logAnyway(`Mirror™ has completed copying in ${durationSeconds}s. 💯✅`);
